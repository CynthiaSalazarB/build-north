import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { test, type TestContext } from "node:test";
import {
  MOVE_ORDER,
  Mastery as MasterySchema,
  Session as SessionSchema,
  Turn as TurnSchema,
  type Advance,
  type Mastery,
  type Session,
} from "@build-north/agents";
import sessionOne from "@build-north/agents/fixtures/session-1.json" with { type: "json" };
import { advanceStub, callAgentStub } from "./advance-stub.ts";
import { createApp, type AppOptions } from "./app.ts";
import { initialSession, type Store } from "./store.ts";

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
  assert.equal((await over.json()).error, "This session is over");
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

test("/turns refuses a body the latest Turn doesn't ask for, and a Turn from the future", async (t) => {
  const url = await start(t, withStore());
  const { sessionId } = await (await post(url, { concept: "democracy" })).json(); // Turn 1 expects a prediction
  for (const body of [{ turn: 1, text: "A law?" }, { turn: 1, action: "continue" }, { turn: 2, prediction: 7 }]) {
    const res = await answer(url, sessionId, body);
    assert.equal(res.status, 409);
    assert.equal(typeof (await res.json()).error, "string");
  }
  assert.equal((await answer(url, sessionId, { turn: 1, prediction: 7 })).status, 200);
  // help is allowed whatever the Turn expects (Turn 2 expects text)
  assert.equal((await answer(url, sessionId, { turn: 2, action: "help" })).status, 200);
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
