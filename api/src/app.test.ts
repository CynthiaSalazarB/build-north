import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { test, type TestContext } from "node:test";
import {
  AGENTS,
  FACT_DESK_REDIRECT,
  MOVE_ORDER,
  Mastery as MasterySchema,
  Session as SessionSchema,
  Turn as TurnSchema,
  UnexpectedInput,
  advance,
  type Advance,
  type Mastery,
  type Session,
} from "@build-north/agents";
import sessionOne from "@build-north/agents/fixtures/session-1.json" with { type: "json" };
import { advanceStub, callAgentStub } from "./advance-stub.ts";
import { createApp, type AppOptions } from "./app.ts";
import { createCallAgent, type SendToClaude } from "./call-agent.ts";
import { initialSession, type AgentLogEntry, type Store } from "./store.ts";

const WEB = "http://localhost:8081";
const KEY = "test-dev-key";
const noDb: AppOptions = {
  corsOrigins: [WEB],
  checkDb: null,
  store: null,
  advance: advanceStub,
  callAgentFor: () => callAgentStub,
  devKey: KEY,
};
const as = (user: string, key = KEY) => ({ "x-dev-user": user, "x-dev-key": key });

// The Store contract kept in memory, so the routes can be tested without a database.
function memoryStore(): Store {
  const sessions = new Map<string, Session>();
  const mastery = new Map<string, Mastery>();
  let created = 0;
  return {
    async createSession(user, input) {
      const session: Session = { ...initialSession(user, input), id: `s${++created}`, createdAt: new Date().toISOString() };
      sessions.set(session.id, session);
      return structuredClone(session);
    },
    async getSession(user, id) {
      const session = sessions.get(id);
      return session?.user === user ? structuredClone(session) : null;
    },
    async saveSession(session, previousTurn) {
      if (sessions.get(session.id)?.turn !== previousTurn) return false;
      sessions.set(session.id, structuredClone(session));
      return true;
    },
    async getMastery(user) {
      const fresh = { moves: MOVE_ORDER.map((move) => ({ move, level: 1 as const, unassistedSuccesses: 0 })) };
      return structuredClone(mastery.get(user) ?? fresh);
    },
    async saveMastery(user, saved) {
      mastery.set(user, structuredClone(saved));
    },
    async logAgentCall() {},
    async deleteUserData(user) {
      for (const [id, session] of sessions) if (session.user === user) sessions.delete(id);
      mastery.delete(user);
    },
  };
}

const withStore = (): AppOptions => ({ ...noDb, store: memoryStore() });
const post = (url: string, body: unknown, headers: Record<string, string> = as("leo")) =>
  fetch(`${url}/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const answer = (url: string, id: string, body: unknown, headers: Record<string, string> = as("leo")) =>
  fetch(`${url}/sessions/${id}/turns`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

async function start(t: TestContext, options: AppOptions): Promise<string> {
  const server = createApp(options).listen(0);
  t.after(() => server.close());
  await once(server, "listening");
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

// Claude, faked behind the real callAgent: each call gets the next reply scripted for its agent (the
// system prompt says which agent is calling, so two calls at once get their own replies)
function fakeClaude(replies: [keyof typeof AGENTS, unknown][]) {
  const send: SendToClaude = async ({ system }) => {
    const next = replies.findIndex(([agent]) => AGENTS[agent].system === system);
    if (next < 0) throw new Error("a call the script doesn't have");
    const [, output] = replies.splice(next, 1)[0]!;
    const usage = { input_tokens: 1_000, output_tokens: 500, cache_creation_input_tokens: null, cache_read_input_tokens: null };
    return { message: { content: [{ type: "text", text: JSON.stringify(output) }], stop_reason: "end_turn", usage }, headers: new Headers() };
  };
  const logged: AgentLogEntry[] = [];
  const callAgentFor = createCallAgent({ send, model: "claude-opus-5-5", budgetUsd: 10, log: async (entry) => void logged.push(entry) });
  return { callAgentFor, logged };
}

test("GET /health answers ok", async (t) => {
  const res = await fetch(`${await start(t, noDb)}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test("CORS allows the configured origins only", async (t) => {
  const url = await start(t, noDb);
  const allowed = await fetch(`${url}/health`, { headers: { origin: WEB } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), WEB);
  const other = await fetch(`${url}/health`, { headers: { origin: "https://elsewhere.example" } });
  assert.equal(other.headers.get("access-control-allow-origin"), null);
});

test("CORS lets the web build send the dev headers with every method", async (t) => {
  const res = await fetch(`${await start(t, noDb)}/me/data`, {
    method: "OPTIONS",
    headers: { origin: WEB, "access-control-request-method": "DELETE", "access-control-request-headers": "content-type,x-dev-user,x-dev-key" },
  });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), WEB);
  assert.match(res.headers.get("access-control-allow-methods") ?? "", /DELETE/);
  assert.match(res.headers.get("access-control-allow-headers") ?? "", /x-dev-key/);
});

test("GET /health/db is 503 without SurrealDB", async (t) => {
  const res = await fetch(`${await start(t, noDb)}/health/db`);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).ok, false);
});

test("GET /health/db returns the database's clock and the time it took", async (t) => {
  const check = { now: "2026-10-20T00:00:00Z", ms: 3 };
  const res = await fetch(`${await start(t, { ...noDb, checkDb: async () => check })}/health/db`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, ...check });
});

test("GET /health/db keeps a failure's cause out of the response", async (t) => {
  t.mock.method(console, "error", () => {});
  const failing = async () => {
    throw new Error("authentication failed for user leo");
  };
  const res = await fetch(`${await start(t, { ...noDb, checkDb: failing })}/health/db`);
  assert.equal(res.status, 503);
  assert.doesNotMatch(await res.text(), /authentication failed/);
});

test("POST /sessions starts a session and GET /sessions/:id gives back its Turn", async (t) => {
  const url = await start(t, withStore());
  const res = await post(url, { concept: "democracy" });
  assert.equal(res.status, 201);
  const turn = await res.json();
  assert.equal(turn.turn, 1);
  assert.equal(turn.phase, "predict");
  assert.equal(turn.expects, "prediction");
  assert.match(turn.messages[0].text, /map of democracy in 4 parts/);

  const again = await fetch(`${url}/sessions/${turn.sessionId}`, { headers: as("leo") });
  assert.equal(again.status, 200);
  assert.deepEqual(await again.json(), turn);
});

test("a session is invisible to every other user", async (t) => {
  const url = await start(t, withStore());
  const { sessionId } = await (await post(url, { concept: "inflation" })).json();
  const res = await fetch(`${url}/sessions/${sessionId}`, { headers: as("jonathan") });
  assert.equal(res.status, 404);
});

test("the session routes need a dev user with the right dev key, and never work in production", async (t) => {
  const url = await start(t, withStore());
  assert.equal((await post(url, { concept: "democracy" }, {})).status, 401);
  assert.equal((await post(url, { concept: "democracy" }, { "x-dev-user": "leo" })).status, 401);
  assert.equal((await post(url, { concept: "democracy" }, as("leo", "wrong-key"))).status, 401);
  const production = await start(t, { ...withStore(), devKey: null });
  assert.equal((await post(production, { concept: "democracy" })).status, 401);
  for (const [method, path] of [["POST", "/sessions/s1/turns"], ["GET", "/me/mastery"], ["DELETE", "/me/data"]]) {
    assert.equal((await fetch(`${url}${path}`, { method, headers: { "x-dev-user": "leo" } })).status, 401);
  }
});

test("each IP gets a limited number of requests a minute, but /health is never limited", async (t) => {
  const url = await start(t, { ...withStore(), requestsPerMinute: 2 });
  assert.equal((await post(url, { concept: "a" })).status, 201);
  assert.equal((await post(url, { concept: "b" })).status, 201);
  const third = await post(url, { concept: "c" });
  assert.equal(third.status, 429);
  assert.equal(typeof (await third.json()).error, "string");
  for (let i = 0; i < 3; i++) assert.equal((await fetch(`${url}/health`)).status, 200);
});

test("POST /sessions checks its body", async (t) => {
  const url = await start(t, withStore());
  assert.equal((await post(url, {})).status, 400);
  assert.equal((await post(url, { concept: "democracy", mode: "exam" })).status, 400);
  assert.equal((await post(url, { concept: "democracy", material: "x".repeat(8_001) })).status, 413);
  const broken = await post(url, "{ not json");
  assert.equal(broken.status, 400);
  assert.equal(typeof (await broken.json()).error, "string");
});

test("unknown routes answer 404 in JSON", async (t) => {
  const res = await fetch(`${await start(t, noDb)}/nope`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: "Not found" });
});

test("a new session and its first Turn match the schemas in @build-north/agents", async (t) => {
  const fresh = { ...initialSession("leo", { concept: "democracy", material: null, mode: "learn" }), id: "s1", createdAt: new Date().toISOString() };
  assert.doesNotThrow(() => SessionSchema.parse(fresh));
  const turn = await (await post(await start(t, withStore()), { concept: "democracy" })).json();
  assert.doesNotThrow(() => TurnSchema.parse(turn));
});

test("/turns replays the session-1 fixture one Turn per answer, then the session is over", async (t) => {
  const warned = t.mock.method(console, "warn", () => {});
  const url = await start(t, withStore());
  const first = await (await post(url, { concept: "democracy" })).json();
  // the fixture's Turns, numbered from 1 in this session
  const scripted = (i: number) => ({ ...sessionOne[i]!.turn, sessionId: first.sessionId, turn: i + 1 });
  assert.deepEqual(first, scripted(0));
  let latest = first;
  for (let i = 1; i < sessionOne.length; i++) {
    const res = await answer(url, first.sessionId, { ...sessionOne[i]!.input, turn: latest.turn });
    assert.equal(res.status, 200);
    latest = await res.json();
    assert.deepEqual(latest, scripted(i));
  }
  assert.equal(latest.expects, "none");
  const over = await answer(url, first.sessionId, { turn: latest.turn, action: "help" });
  assert.equal(over.status, 409);
  assert.deepEqual(await over.json(), latest);
  assert.match(String(warned.mock.calls[0]?.arguments[0]), /This session is over/);
  assert.deepEqual(await (await fetch(`${url}/sessions/${first.sessionId}`, { headers: as("leo") })).json(), latest);
});

test("a resent answer gets the same Turn back, and advance runs once", async (t) => {
  let calls = 0;
  const counting: Advance = (...args) => {
    calls++;
    return advanceStub(...args);
  };
  const url = await start(t, { ...withStore(), advance: counting });
  const { sessionId } = await (await post(url, { concept: "democracy" })).json();
  const first = await (await answer(url, sessionId, { turn: 1, prediction: 7 })).json();
  const resent = await answer(url, sessionId, { turn: 1, prediction: 7 });
  assert.equal(resent.status, 200);
  assert.deepEqual(await resent.json(), first);
  assert.equal(calls, 2); // the start and the first answer
});

test("two answers to the same Turn at once move the session on once", { timeout: 5_000 }, async (t) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let waiting = 0;
  // Holds both answers inside advance until each request has read the session, and tags each Turn
  // with the answer it got, so a request that lost the save can't pass for the winner.
  const slow: Advance = async (state, input, callAgent) => {
    const next = await advanceStub(state, input, callAgent);
    if (!("prediction" in input)) return next;
    waiting++;
    await gate;
    const tagged = { ...next.turn, messages: [{ agent: "app" as const, kind: "feedback" as const, text: `predicted ${input.prediction}` }] };
    return { ...next, session: { ...next.session, lastTurn: tagged }, turn: tagged };
  };
  const url = await start(t, { ...withStore(), advance: slow });
  const { sessionId } = await (await post(url, { concept: "democracy" })).json();
  const both = [answer(url, sessionId, { turn: 1, prediction: 7 }), answer(url, sessionId, { turn: 1, prediction: 3 })];
  while (waiting < 2) await new Promise((resolve) => setImmediate(resolve));
  release();
  const [a, b] = await Promise.all(both.map(async (res) => (await res).json()));
  assert.deepEqual(a, b);
  const latest = await (await fetch(`${url}/sessions/${sessionId}`, { headers: as("leo") })).json();
  assert.deepEqual(latest, a);
  assert.equal(latest.turn, 2);
});

test("a body the latest Turn doesn't ask for, or a Turn from the future, gets a 409 with the latest Turn", async (t) => {
  const warned = t.mock.method(console, "warn", () => {});
  const url = await start(t, withStore());
  const first = await (await post(url, { concept: "democracy" })).json(); // Turn 1 expects a prediction
  for (const body of [{ turn: 1, text: "A law?" }, { turn: 1, action: "continue" }, { turn: 2, prediction: 7 }]) {
    const res = await answer(url, first.sessionId, body);
    assert.equal(res.status, 409);
    assert.deepEqual(await res.json(), first);
  }
  // the reason goes to the server log
  assert.deepEqual(
    warned.mock.calls.map((call) => String(call.arguments[0]).replace(/^409 for session \w+: /, "")),
    ["Turn 1 expects prediction, not text", "Turn 1 expects prediction, not continue", "Turn 2 doesn't exist yet; the latest is 1"],
  );
  assert.equal((await answer(url, first.sessionId, { turn: 1, prediction: 7 })).status, 200);
});

test("Help works during the moves only", async (t) => {
  const warned = t.mock.method(console, "warn", () => {});
  const url = await start(t, withStore());
  const first = await (await post(url, { concept: "democracy" })).json();
  const { sessionId } = first;
  const help = (turn: number) => answer(url, sessionId, { turn, action: "help" });
  const refused = await help(1);
  assert.equal(refused.status, 409);
  assert.deepEqual(await refused.json(), first);
  assert.match(String(warned.mock.calls[0]?.arguments[0]), /Help works during the moves/);
  // the prediction, the first attempt and the worked example come before the first move (Turn 4)
  for (const body of [{ turn: 1, prediction: 7 }, { turn: 2, text: "When people vote." }, { turn: 3, action: "continue" }]) {
    assert.equal((await answer(url, sessionId, body)).status, 200);
  }
  assert.equal((await help(4)).status, 200);
});

test("input that advance refuses for the phase changes nothing, and gets a 409 with the latest Turn", async (t) => {
  const warned = t.mock.method(console, "warn", () => {});
  const refusing: Advance = (state, input, callAgent) =>
    "action" in input && input.action === "start" ? advanceStub(state, input, callAgent) : Promise.reject(new UnexpectedInput("not now"));
  const url = await start(t, { ...withStore(), advance: refusing });
  const first = await (await post(url, { concept: "democracy" })).json();
  const res = await answer(url, first.sessionId, { turn: 1, prediction: 7 });
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), first);
  assert.match(String(warned.mock.calls[0]?.arguments[0]), /not now/);
  assert.deepEqual(await (await fetch(`${url}/sessions/${first.sessionId}`, { headers: as("leo") })).json(), first);
});

test("/turns checks its body, and answers only the session's owner", async (t) => {
  const url = await start(t, withStore());
  const { sessionId } = await (await post(url, { concept: "democracy" })).json();
  const empty = await answer(url, sessionId, {});
  assert.equal(empty.status, 400);
  assert.match((await empty.json()).error, /one of/);
  assert.equal((await answer(url, sessionId, { turn: 1, prediction: 9 })).status, 400);
  assert.equal((await answer(url, sessionId, { turn: 1, prediction: 7 }, as("jonathan"))).status, 404);
  assert.equal((await answer(url, "s999", { turn: 1, prediction: 7 })).status, 404);
});

test("GET /me/mastery lists the four moves, and DELETE /me/data removes only the caller's data", async (t) => {
  const store = memoryStore();
  const url = await start(t, { ...noDb, store });
  const call = (path: string, method = "GET", user = "leo") => fetch(`${url}${path}`, { method, headers: as(user) });
  const levels = async () => MasterySchema.parse(await (await call("/me/mastery")).json()).moves.map((m) => m.level);

  assert.deepEqual(await levels(), [1, 1, 1, 1]);
  const raised = await store.getMastery("leo");
  raised.moves[1] = { move: "exclusion", level: 3, unassistedSuccesses: 1 };
  await store.saveMastery("leo", raised);
  assert.deepEqual(await levels(), [1, 3, 1, 1]);

  const mine = await (await post(url, { concept: "democracy" })).json();
  const theirs = await (await post(url, { concept: "inflation" }, as("jonathan"))).json();
  assert.equal((await call("/me/data", "DELETE")).status, 204);
  assert.deepEqual(await levels(), [1, 1, 1, 1]);
  assert.equal((await call(`/sessions/${mine.sessionId}`)).status, 404);
  assert.equal((await call(`/sessions/${theirs.sessionId}`, "GET", "jonathan")).status, 200);
});

test("Cynthia's advance runs the democracy session through callAgent: 4 moves, 2 Helps, 5/8, an agent_log row per call", async (t) => {
  // the coach joins the registry with #44; until then its call fails before Claude, and advance writes fixed text
  t.mock.method(console, "error", () => {});
  const item = (value: string, note: string | null = null) => ({ value, note });
  const judged = (verdict: string, quality: number, accepted: ReturnType<typeof item>[], feedback: string, issue = "none") => ({
    verdict,
    quality,
    accepted,
    issue,
    reason: "scripted",
    feedback,
  });
  const hint = (text: string) => ({ step: "hint", text, revealed: null });
  // What Claude answers, per agent and in order: session 1 from agents/test/advance.test.ts
  const replies: [keyof typeof AGENTS, unknown][] = [
    ["questioner", { question: "Democracy is one example of a bigger group. What group?", scaffold: null }],
    ["evaluator", judged("incorrect", 0, [], "Not quite: a law is one rule, and democracy isn't a rule. So what kind of thing is it?", "not_a_class")],
    ["questioner", { question: "What looks close to democracy but isn't one?", scaffold: null }],
    ["hint_giver", hint("Think of monarchy and dictatorship. What are all three examples of?")],
    ["evaluator", judged("correct", 2, [item("form of government")], "Yes: monarchy, dictatorship and democracy are all forms of government.")],
    ["evaluator", judged("partial", 1, [item("dictatorship")], "Dictatorship is close, and it isn't a democracy.")],
    ["questioner", { question: "What does a country need to count as a democracy?", scaffold: null }],
    ["evaluator", judged("correct", 2, [item("dictatorship", "who holds the power")], "Yes: in a dictatorship one person or group holds the power.")],
    ["evaluator", judged("partial", 1, [], "Elections are part of it, but not enough on their own. What else does a country need?")],
    ["questioner", { question: "What kinds of democracy are there?", scaffold: null }],
    ["hint_giver", hint("North Korea holds elections. Is it a democracy? What's missing?")],
    ["evaluator", judged("correct", 2, [item("free elections"), item("rights"), item("more than one party")], "Yes: free elections, rights and more than one party.")],
    ["evaluator", judged("partial", 1, [item("direct democracy")], "Direct democracy is one type, where people vote on laws themselves. Is that the only way it can work?")],
    ["evaluator", judged("correct", 2, [item("direct democracy"), item("representative democracy")], "Yes: direct and representative democracy.")],
  ];
  const { callAgentFor, logged } = fakeClaude(replies);
  const url = await start(t, { ...withStore(), advance, callAgentFor });

  let latest = await (await post(url, { concept: "democracy" })).json();
  const inputs = [
    { prediction: 7 },
    { text: "When people vote." },
    { action: "continue" },
    { text: "A law?" },
    { action: "help" },
    { text: "Forms of government." },
    { text: "Dictatorship." },
    { text: "Who holds the power." },
    { text: "Elections." },
    { action: "help" },
    { text: "Free elections, rights, other parties." },
    { text: "Direct?" },
    { text: "Direct and representative." },
  ];
  for (const input of inputs) {
    const body = { ...input, turn: latest.turn };
    const next = await (await answer(url, latest.sessionId, body)).json();
    assert.equal(next.error, null, `Turn ${next.turn}`);
    // the same answer sent again gets the same Turn, and advance isn't run again (the script would run out)
    assert.deepEqual(await (await answer(url, latest.sessionId, body)).json(), next);
    latest = next;
  }
  assert.equal(replies.length, 0);
  assert.equal(latest.expects, "none");
  const { predictedScore, score, calibrationGap, hintsUsed, rubric } = latest.result;
  assert.deepEqual({ predictedScore, score, calibrationGap, hintsUsed }, { predictedScore: 7, score: 5, calibrationGap: 2, hintsUsed: 2 });
  assert.deepEqual(rubric.map((r: { points: number }) => r.points), [1, 2, 1, 1]);
  assert.equal(typeof latest.result.coach.message, "string");
  // one agent_log row per Claude call, each with its session and its cost
  assert.equal(logged.length, 14);
  assert.ok(logged.every((row) => row.session === latest.sessionId && row.usd > 0));
  const mastery = await (await fetch(`${url}/me/mastery`, { headers: as("leo") })).json();
  assert.deepEqual(mastery.moves.map((m: { level: number }) => m.level), [2, 3, 2, 3]);
});

test("a test session starts at level 5, { question } gets the fact desk's answer, and mastery is unchanged when it ends", async (t) => {
  // the coach joins the registry with #44; until then its call fails before Claude, and advance writes fixed text
  t.mock.method(console, "error", () => {});
  const store = memoryStore();
  const before = await store.getMastery("leo");
  before.moves[1] = { move: "exclusion", level: 3, unassistedSuccesses: 1 };
  await store.saveMastery("leo", before);
  const masterySaves = t.mock.method(store, "saveMastery");
  const replies: [keyof typeof AGENTS, unknown][] = [
    ["fact_desk", { kind: "fact", answer: "Yes, when the fish, the plants and the water act on one another.", questionType: "breaking_case" }],
    // the model's words give the bigger group away; the learner only ever sees the fixed redirect (decision 17)
    ["fact_desk", { kind: "redirect", answer: "It's a kind of system.", questionType: "asks_for_structure" }],
  ];
  const claude = fakeClaude(replies);
  // Temporary: the whole-map evaluator joins the registry with #36; until then the test answers for it
  const rubric = { rubric: MOVE_ORDER.map((move) => ({ move, quality: move === "isoordinate" ? 1 : 2, feedback: "Scripted." })) };
  const callAgentFor: AppOptions["callAgentFor"] = (id) => async (agent, input) =>
    agent === "evaluator_full" ? rubric : claude.callAgentFor(id)(agent, input);
  const url = await start(t, { ...noDb, store, advance, callAgentFor });
  // answers the latest Turn with `body` and returns the next one
  const next = async (latest: { sessionId: string; turn: number }, body: object) => {
    const res = await answer(url, latest.sessionId, { ...body, turn: latest.turn });
    assert.equal(res.status, 200);
    const turn = await res.json();
    assert.equal(turn.error, null, `Turn ${turn.turn}`);
    return turn;
  };

  const first = await (await post(url, { concept: "ecosystem", mode: "test" })).json();
  // straight from the prediction to the whole map: no first attempt, no worked example, no questioner
  const map = await next(first, { prediction: 5 });
  assert.deepEqual([map.phase, map.move, map.level, map.expects], ["move", null, 5, "map"]);
  assert.equal(map.messages[0].text, "Build the mentefacto for ecosystem. Ask me any facts you need.");

  const fact = await next(map, { question: "Is a fish tank an ecosystem?" });
  assert.deepEqual(fact.messages, [{ agent: "fact_desk", kind: "fact", text: "Yes, when the fish, the plants and the water act on one another." }]);
  assert.equal(fact.expects, "map");
  const redirect = await next(fact, { question: "What's the bigger group of ecosystem?" });
  assert.deepEqual(redirect.messages, [{ agent: "fact_desk", kind: "redirect", text: FACT_DESK_REDIRECT }]);

  const item = (value: string, note: string | null = null) => ({ value, note });
  const done = await next(redirect, {
    mentefacto: {
      concept: "ecosystem",
      supraordinate: item("system"),
      exclusion: [item("habitat", "a habitat is only the place, without what lives there")],
      isoordinate: [item("living things"), item("their surroundings")],
      infraordinate: [item("aquatic ecosystem"), item("land ecosystem")],
    },
  });
  assert.equal(done.expects, "none");
  const { score, calibrationGap, masteryChanges, questions } = done.result;
  assert.deepEqual({ score, calibrationGap, masteryChanges, questions }, { score: 7, calibrationGap: -2, masteryChanges: [], questions: { asked: 2, testing: 1 } });
  assert.equal(replies.length, 0);
  // the fact desk's agent_log rows are the questions metric
  assert.deepEqual(claude.logged.map((row) => [row.agent, row.session]), [["fact_desk", first.sessionId], ["fact_desk", first.sessionId]]);
  // the mastery from before the session, which the session never wrote
  assert.deepEqual(await (await fetch(`${url}/me/mastery`, { headers: as("leo") })).json(), before);
  assert.equal(masterySaves.mock.callCount(), 0);
});
