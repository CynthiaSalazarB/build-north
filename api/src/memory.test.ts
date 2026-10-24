import assert from "node:assert/strict";
import { test } from "node:test";
import { MemoryView as MemoryViewSchema, type CallAgent, type MemoryFact, type Session, type Turn } from "@build-north/agents";
import {
  MEMORY_READ_MS,
  createLearnerMemory,
  createMemoryApi,
  dateOf,
  entityOf,
  factText,
  factsOf,
  factsToWrite,
  fillSources,
  memoryConfigFromEnv,
  readCountsOf,
  scopeOf,
  viewOf,
  withMemory,
  type MemoryApi,
  type MemoryRow,
} from "./memory.ts";
import { initialSession } from "./store.ts";

// A finished session on API: two parts moved (one up, one down), 7 guessed and 3 proved, Help on two parts.
const finished: Session = {
  ...initialSession("user_2leo", { concept: "API", material: null, mode: "learn" }),
  id: "s2",
  createdAt: "2026-10-23T14:00:00Z",
  turn: 15,
  phase: "result",
  hintsPerMove: { supraordinate: 0, exclusion: 2, isoordinate: 1, infraordinate: 0 },
  result: {
    predictedScore: 7,
    score: 3,
    maxScore: 8,
    calibrationGap: 4,
    hintsUsed: 3,
    rubric: [
      { move: "supraordinate", points: 2 },
      { move: "exclusion", points: 0 },
      { move: "isoordinate", points: 1 },
      { move: "infraordinate", points: 0 },
    ],
    masteryChanges: [
      { move: "supraordinate", from: 2, to: 3 },
      { move: "exclusion", from: 2, to: 1 },
    ],
    questions: { asked: 0, testing: 0 },
    coach: null,
  },
};
const AT = "2026-10-23T14:05:00Z";

// One row as memory lists it, with the labels the API's writes stamp
const row = (id: string, key: string, value: string, labels: Record<string, string | number>, { since = AT, until = null as string | null, supersedes = null as string | null } = {}): MemoryRow => ({
  id,
  key,
  value,
  createdAt: since,
  validFrom: since,
  validUntil: until,
  supersedes,
  labels: Object.entries(labels).map(([k, v]) => `${k}=${v}`),
  source: { kind: "upsert" },
});
const s1 = { session: "s1", turn: 14 };
const s2 = { session: "s2", turn: 15 };
const EARLIER = "2026-10-22T18:40:05Z";
// what session 1 left on API, then what session 2 wrote over it
const rows: MemoryRow[] = [
  row("attr_sup1", "level_supraordinate", "You moved up to level 2 on 'Bigger group' for API on Oct 22.", { ...s1, writer: "evaluator", move: "supraordinate", level: 2 }, { since: EARLIER, until: AT }),
  row("attr_sup2", "level_supraordinate", "You moved up to level 3 on 'Bigger group' for API on Oct 23.", { ...s2, writer: "evaluator", move: "supraordinate", level: 3 }, { supersedes: "attr_sup1" }),
  row("attr_exc1", "level_exclusion", "You moved up to level 2 on 'What it isn't' for API on Oct 22.", { ...s1, writer: "evaluator", move: "exclusion", level: 2 }, { since: EARLIER }),
  row("attr_gap1", "gap", "Last time on API you guessed 7 and proved 4.", { ...s1, writer: "coach", predicted: 7, score: 4 }, { since: EARLIER, until: AT }),
  row("attr_gap2", "gap", "Last time on API you guessed 7 and proved 3.", { ...s2, writer: "coach", predicted: 7, score: 3 }, { supersedes: "attr_gap1" }),
  row("attr_help_exc1", "help_exclusion", "'What it isn't' took 1 Help on API last time.", { ...s1, writer: "hint_giver", move: "exclusion", helps: 1 }, { since: EARLIER }),
  row("attr_help_iso1", "help_isoordinate", "'What it needs' took 2 Helps on API last time.", { ...s1, writer: "hint_giver", move: "isoordinate", helps: 2 }, { since: EARLIER }),
  row("attr_help_sup1", "help_supraordinate", "'Bigger group' took no Help on API last time.", { ...s1, writer: "hint_giver", move: "supraordinate", helps: 0 }, { since: EARLIER }),
  // rows this API never writes: no session label, or a key it doesn't know
  row("attr_other", "level_exclusion", "Level 4", { writer: "evaluator", move: "exclusion", level: 4 }),
  row("attr_stray", "favourite_colour", "amber", { ...s1 }),
];

test("memory is off by default; on, the endpoint, the context and the key are required and the endpoint must be a URL", () => {
  assert.equal(memoryConfigFromEnv({}), null);
  assert.equal(memoryConfigFromEnv({ AGENT_MEMORY_ENABLED: "false", AGENT_MEMORY_ENDPOINT: "https://m.example", AGENT_MEMORY_CONTEXT: "c", AGENT_MEMORY_API_KEY: "k" }), null);
  assert.throws(() => memoryConfigFromEnv({ AGENT_MEMORY_ENABLED: "true" }), /AGENT_MEMORY_ENDPOINT, AGENT_MEMORY_CONTEXT and AGENT_MEMORY_API_KEY/);
  assert.throws(() => memoryConfigFromEnv({ AGENT_MEMORY_ENABLED: "1", AGENT_MEMORY_ENDPOINT: "not a url", AGENT_MEMORY_CONTEXT: "c", AGENT_MEMORY_API_KEY: "k" }), /not a URL/);
  assert.deepEqual(memoryConfigFromEnv({ AGENT_MEMORY_ENABLED: "true", AGENT_MEMORY_ENDPOINT: "https://m.example/", AGENT_MEMORY_CONTEXT: "c", AGENT_MEMORY_API_KEY: "k", LEARNER_ID_SALT: "pepper" }), {
    endpoint: "https://m.example",
    context: "c",
    apiKey: "k",
    salt: "pepper",
  });
});

test("a learner's scope and entity carry the testers' pseudonym, never the Clerk id, and a concept's name is made safe", () => {
  assert.equal(scopeOf("a1b2c3d4"), "learner/a1b2c3d4");
  assert.deepEqual(entityOf("a1b2c3d4", "Environment Variable!"), { type: "topic", name: "a1b2c3d4_environment_variable" });
  assert.equal(entityOf("a1b2c3d4", "API").name, "a1b2c3d4_api");
  assert.equal(dateOf("2026-10-22T23:59:00Z"), "Oct 22");
  // a fact's date follows the team's zone (TZ, else Toronto), the zone the Memory sheet's dates show in Ontario
  assert.equal(dateOf("2026-10-24T01:30:00Z", "America/Toronto"), "Oct 23");
  assert.equal(dateOf("2026-10-24T01:30:00Z", "UTC"), "Oct 24");
});

test("with memory's record given, a finished part with no level row yet gets its baseline level, and the rest nothing extra", () => {
  const played: Session = {
    ...finished,
    moveLog: [
      { move: "supraordinate", points: 2, hints: 0, retries: 0, from: 2, to: 3 },
      { move: "exclusion", points: 0, hints: 2, retries: 1, from: 2, to: 1 },
      { move: "isoordinate", points: 1, hints: 1, retries: 0, from: 5, to: 5 },
      { move: "infraordinate", points: 0, hints: 0, retries: 0, from: 4, to: 4 },
    ],
  };
  // infraordinate is on record already; isoordinate is not, so its level 5 is written as where the learner stood
  const keys = (writes: ReturnType<typeof factsToWrite>) => writes.filter((w) => w.key.startsWith("level_")).map((w) => [w.key, w.value, w.labels.level]);
  assert.deepEqual(keys(factsToWrite(played, AT, new Set(["infraordinate"]))), [
    ["level_supraordinate", "You moved up to level 3 on 'Bigger group' for API on Oct 23.", 3],
    ["level_exclusion", "You moved down to level 1 on 'What it isn't' for API on Oct 23.", 1],
    ["level_isoordinate", "You were at level 5 on 'What it needs' for API on Oct 23.", 5],
  ]);
  // every part on record: the changes only, as without the record
  assert.deepEqual(keys(factsToWrite(played, AT, new Set(["isoordinate", "infraordinate"]))), keys(factsToWrite(played, AT)));
  // a part the session never finished has no level to write
  assert.deepEqual(keys(factsToWrite({ ...played, moveLog: played.moveLog.slice(0, 2) }, AT, new Set())).map(([key]) => key), ["level_supraordinate", "level_exclusion"]);
  // the demo account: level 5 everywhere, nothing changes, and the first session still leaves four level rows
  const settled: Session = { ...played, moveLog: played.moveLog.map((entry) => ({ ...entry, from: 5, to: 5 })), result: { ...played.result!, masteryChanges: [] } };
  assert.deepEqual(keys(factsToWrite(settled, AT, new Set())).map(([key, , level]) => `${key}=${level}`), ["level_supraordinate=5", "level_exclusion=5", "level_isoordinate=5", "level_infraordinate=5"]);
  assert.deepEqual(keys(factsToWrite(settled, AT)), []);
});

test("remembering reads memory first: baselines for the parts it has no level for, and the changes alone when the read fails", async () => {
  const warnings: string[] = [];
  let history: () => Promise<MemoryRow[]> = async () => [row("attr_inf0", "level_infraordinate", "x", { ...s1, writer: "evaluator", move: "infraordinate", level: 4 })];
  const written: string[] = [];
  const api: MemoryApi = {
    async registerScope() {},
    async write(_scope, _labels, triples) {
      written.push(triples[0]!.key);
    },
    history: () => history(),
    async forgetScope() {
      return 0;
    },
  };
  const memory = createLearnerMemory(api, { salt: "pepper", warn: (message) => warnings.push(message) });
  const played: Session = {
    ...finished,
    moveLog: [
      { move: "supraordinate", points: 2, hints: 0, retries: 0, from: 2, to: 3 },
      { move: "exclusion", points: 0, hints: 2, retries: 1, from: 2, to: 1 },
      { move: "isoordinate", points: 1, hints: 1, retries: 0, from: 5, to: 5 },
      { move: "infraordinate", points: 0, hints: 0, retries: 0, from: 4, to: 4 },
    ],
  };
  await memory.remember("user_2leo", played);
  assert.deepEqual(written.filter((key) => key.startsWith("level_")), ["level_supraordinate", "level_exclusion", "level_isoordinate"]);
  assert.deepEqual(warnings, []);
  // memory not answering before the write: the changes are still written, and the reason is logged
  written.length = 0;
  history = async () => Promise.reject(new Error("memory answered 503"));
  await memory.remember("user_2leo", played);
  assert.deepEqual(written.filter((key) => key.startsWith("level_")), ["level_supraordinate", "level_exclusion"]);
  assert.match(warnings[0] ?? "", /only level changes are written: memory answered 503/);
});

test("a finished session leaves the level changes, the gap and the Helps, as plain sentences with the numbers in labels", () => {
  assert.deepEqual(factsToWrite(finished, AT), [
    { key: "level_supraordinate", value: "You moved up to level 3 on 'Bigger group' for API on Oct 23.", labels: { writer: "evaluator", move: "supraordinate", level: 3 } },
    { key: "level_exclusion", value: "You moved down to level 1 on 'What it isn't' for API on Oct 23.", labels: { writer: "evaluator", move: "exclusion", level: 1 } },
    { key: "gap", value: "Last time on API you guessed 7 and proved 3.", labels: { writer: "coach", predicted: 7, score: 3 } },
    { key: "help_supraordinate", value: "'Bigger group' took no Help on API last time.", labels: { writer: "hint_giver", move: "supraordinate", helps: 0 } },
    { key: "help_exclusion", value: "'What it isn't' took 2 Helps on API last time.", labels: { writer: "hint_giver", move: "exclusion", helps: 2 } },
    { key: "help_isoordinate", value: "'What it needs' took 1 Help on API last time.", labels: { writer: "hint_giver", move: "isoordinate", helps: 1 } },
    { key: "help_infraordinate", value: "'Its types' took no Help on API last time.", labels: { writer: "hint_giver", move: "infraordinate", helps: 0 } },
  ]);
  // Cynthia's three sentences (#112), word for word
  assert.equal(factText.gap("API", 7, 3), "Last time on API you guessed 7 and proved 3.");
  assert.equal(factText.help("API", "infraordinate", 2), "'Its types' took 2 Helps on API last time.");
  assert.equal(factText.level("API", "exclusion", 2, 3, "2026-10-22T20:00:00Z"), "You moved up to level 3 on 'What it isn't' for API on Oct 22.");
  // a session without a result leaves nothing
  assert.deepEqual(factsToWrite({ ...finished, result: null }, AT), []);
});

test("the facts an agent gets: the level per part, the latest gap, the Helps that cost most, from earlier sessions only, 8 at most", () => {
  // session 2's coach reads what came before session 2: the rows it just wrote are skipped
  const facts = factsOf(rows, "API", "s2");
  assert.deepEqual(
    facts.map((f) => f.id),
    ["attr_sup1", "attr_exc1", "attr_gap1", "attr_help_iso1", "attr_help_exc1", "attr_help_sup1"],
  );
  assert.deepEqual(facts[0], {
    id: "attr_sup1",
    text: "You moved up to level 2 on 'Bigger group' for API on Oct 22.",
    concept: "API",
    move: "supraordinate",
    level: 2,
    since: EARLIER,
    writtenBy: "evaluator",
    sessionId: "s1",
    turn: 14,
  });
  assert.deepEqual(facts[2], { id: "attr_gap1", text: "Last time on API you guessed 7 and proved 4.", concept: "API", since: EARLIER, writtenBy: "coach", sessionId: "s1", turn: 14 });
  // a third session reads the current values, with what they superseded
  const later = factsOf(rows, "API", "s3");
  assert.deepEqual(later.map((f) => f.id), ["attr_sup2", "attr_exc1", "attr_gap2", "attr_help_iso1", "attr_help_exc1", "attr_help_sup1"]);
  assert.equal(later[0]?.supersedes, "attr_sup1");
  // at most 8, so with all four Helps written only the three costliest fit
  const full = [
    ...rows,
    row("attr_iso1", "level_isoordinate", "x", { ...s1, writer: "evaluator", move: "isoordinate", level: 2 }, { since: EARLIER }),
    row("attr_inf1", "level_infraordinate", "x", { ...s1, writer: "evaluator", move: "infraordinate", level: 2 }, { since: EARLIER }),
    row("attr_help_inf1", "help_infraordinate", "x", { ...s1, writer: "hint_giver", move: "infraordinate", helps: 3 }, { since: EARLIER }),
  ];
  const eight = factsOf(full, "API", "s3");
  assert.equal(eight.length, 8);
  assert.deepEqual(eight.slice(5).map((f) => f.id), ["attr_help_inf1", "attr_help_iso1", "attr_help_exc1"]);
  assert.deepEqual(factsOf([], "API", "s1"), []);
});

test("the Memory sheet's view: each part's chain newest first, the superseded row closed, who read it, the latest gap beside the one before", () => {
  const readBy = readCountsOf([["attr_sup1", "attr_gap1"], ["attr_sup1"], []]);
  const api = viewOf("API", rows, readBy);
  assert.doesNotThrow(() => MemoryViewSchema.parse({ concepts: [api] }));
  assert.deepEqual(api.moves[0], {
    move: "supraordinate",
    level: 3,
    history: [
      { level: 3, since: AT, until: null, source: "upsert", writtenBy: "evaluator", readBy: 0 },
      { level: 2, since: EARLIER, until: AT, source: "upsert", writtenBy: "evaluator", readBy: 2 },
    ],
  });
  assert.deepEqual(api.moves[1]?.level, 2);
  assert.deepEqual(api.moves[3], { move: "infraordinate", level: null, history: [] });
  assert.deepEqual(api.gap, {
    latest: { sessionId: "s2", at: AT, predictedScore: 7, score: 3, gap: 4 },
    previous: { sessionId: "s1", at: EARLIER, predictedScore: 7, score: 4, gap: 3 },
  });
});

// A stand-in for memory's REST API: every request it saw, and the answers scripted for it
function fakeMemory(answer: (method: string, path: string, body: unknown) => { status: number; json?: unknown }) {
  const seen: { method: string; path: string; body: unknown; auth: string | null }[] = [];
  const send: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    seen.push({ method: init?.method ?? "GET", path: `${url.pathname}${url.search}`, body, auth: headers.get("authorization") });
    const { status, json } = answer(init?.method ?? "GET", `${url.pathname}${url.search}`, body);
    return new Response(json === undefined ? null : JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
  };
  return { seen, api: createMemoryApi({ endpoint: "https://memory.example", context: "ctx1", apiKey: "sp-secret" }, send) };
}
const signal = () => AbortSignal.timeout(1_000);

test("the REST calls: a triple write with its scope and labels, a history walked page by page, a scope registered once, a purge", async () => {
  const { seen, api } = fakeMemory((method, path) => {
    if (method === "POST" && path.endsWith("/scopes")) return { status: 409, json: { message: "scope exists" } };
    if (method === "POST" && path.endsWith("/facts")) return { status: 200, json: { mode: "triples", sessionId: "sess_m", turnId: "turn_m" } };
    if (method === "GET" && path.includes("/history?limit=200&cursor=")) return { status: 200, json: { history: [rows[1]], page: { hasMore: false } } };
    if (method === "GET" && path.includes("/history")) return { status: 200, json: { history: [rows[0]], page: { hasMore: true, nextCursor: "c2" } } };
    if (method === "POST" && path.endsWith("/scopes/forget")) return { status: 200, json: { forgotten: 9 } };
    return { status: 404, json: { message: "no" } };
  });
  await api.registerScope("learner/a1b2c3d4", signal());
  const entity = entityOf("a1b2c3d4", "API");
  await api.write("learner/a1b2c3d4", ["session=s1", "writer=coach"], [{ entity, key: "gap", value: "Last time on API you guessed 7 and proved 4.", occurred_at: AT }], signal());
  assert.deepEqual(await api.history(entity, signal()), [rows[0], rows[1]]);
  assert.equal(await api.forgetScope("learner/a1b2c3d4", signal()), 9);

  assert.deepEqual(
    seen.map((call) => `${call.method} ${call.path}`),
    [
      "POST /api/v1/ctx1/scopes",
      "POST /api/v1/ctx1/facts",
      "GET /api/v1/ctx1/entities/topic/a1b2c3d4_api/history?limit=200",
      "GET /api/v1/ctx1/entities/topic/a1b2c3d4_api/history?limit=200&cursor=c2",
      "POST /api/v1/ctx1/scopes/forget",
    ],
  );
  assert.ok(seen.every((call) => call.auth === "Bearer sp-secret"));
  assert.deepEqual(seen[0]?.body, { path: "learner/a1b2c3d4" });
  // no `text`, no model: the triples go in as they are, scoped to the learner
  assert.deepEqual(seen[1]?.body, {
    infer: "triples",
    scopes: [["learner/a1b2c3d4"]],
    memory_category: "knowledge",
    labels: ["session=s1", "writer=coach"],
    triples: [{ entity: { type: "topic", name: "a1b2c3d4_api" }, key: "gap", value: "Last time on API you guessed 7 and proved 4.", occurred_at: AT }],
  });
  assert.deepEqual(seen[4]?.body, { path: "learner/a1b2c3d4" });
});

test("an entity memory doesn't have is an empty history, a scope never registered purges nothing, and an error keeps memory's message", async () => {
  const { api } = fakeMemory((method, path) => {
    if (path.includes("/history")) return { status: 404, json: { message: "entity not found" } };
    if (path.endsWith("/scopes/forget")) return { status: 404, json: { message: "unknown scope node" } };
    if (path.endsWith("/facts")) return { status: 422, json: { message: "unknown scope node learner/x" } };
    return { status: 500 };
  });
  assert.deepEqual(await api.history(entityOf("a1b2c3d4", "API"), signal()), []);
  assert.equal(await api.forgetScope("learner/nobody", signal()), 0);
  await assert.rejects(api.write("learner/x", [], [], signal()), { name: "MemoryError", status: 422, message: "memory answered 422: unknown scope node learner/x" });
  await assert.rejects(api.registerScope("learner/x", signal()), { status: 500, message: "memory answered 500" });
});

test(`a read gives up after ${MEMORY_READ_MS} ms, and the agent runs without memory; so does a read that fails`, async () => {
  assert.equal(MEMORY_READ_MS, 1_500);
  const warnings: string[] = [];
  const slow: typeof fetch = (_input, init) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(new Response(JSON.stringify({ history: rows }), { status: 200 })), 500);
      init?.signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(init.signal?.reason);
      });
    });
  const late = createLearnerMemory(createMemoryApi({ endpoint: "https://memory.example", context: "c", apiKey: "k" }, slow), { salt: "", readMs: 30, warn: (m) => warnings.push(m) });
  assert.equal(await late.recall("user_2leo", "API", "s9"), undefined);
  assert.match(warnings[0] ?? "", /memory read skipped after \d+ ms: .*(abort|timeout)/i);

  const down: typeof fetch = async () => {
    throw new TypeError("fetch failed");
  };
  const failing = createLearnerMemory(createMemoryApi({ endpoint: "https://memory.example", context: "c", apiKey: "k" }, down), { salt: "", warn: (m) => warnings.push(m) });
  assert.equal(await failing.recall("user_2leo", "API", "s9"), undefined);
  assert.match(warnings[1] ?? "", /fetch failed/);

  // in time: the facts, from earlier sessions than the one asking
  const quick = createLearnerMemory(createMemoryApi({ endpoint: "https://memory.example", context: "c", apiKey: "k" }, async () => new Response(JSON.stringify({ history: rows }), { status: 200 })), { salt: "" });
  const memory = await quick.recall("user_2leo", "API", "s2");
  assert.deepEqual(memory?.facts.map((f) => f.id), ["attr_sup1", "attr_exc1", "attr_gap1", "attr_help_iso1", "attr_help_exc1", "attr_help_sup1"]);
  // nothing on this concept: no memory, not an empty one, so the user message stays as before memory existed
  const empty = createLearnerMemory(createMemoryApi({ endpoint: "https://memory.example", context: "c", apiKey: "k" }, async () => new Response(JSON.stringify({ history: [] }), { status: 200 })), { salt: "" });
  assert.equal(await empty.recall("user_2leo", "API", "s2"), undefined);
});

test("remembering a session registers its learner's scope once, writes one triple per fact with the session on it, one after another, and reports a write that failed", async () => {
  const calls: { method: string; path: string; body: unknown }[] = [];
  let failWrites = false;
  const api: MemoryApi = {
    async registerScope(path) {
      calls.push({ method: "scope", path, body: null });
    },
    async write(scope, labels, triples) {
      calls.push({ method: "write", path: scope, body: { labels, triples } });
      if (failWrites) throw new Error("memory answered 503");
    },
    async history() {
      return [];
    },
    async forgetScope(path) {
      calls.push({ method: "forget", path, body: null });
      return 7;
    },
  };
  const memory = createLearnerMemory(api, { salt: "pepper" });
  await memory.remember("user_2leo", finished);
  await memory.remember("user_2leo", { ...finished, id: "s3", turn: 16 });
  const writes = calls.filter((c) => c.method === "write");
  assert.equal(calls.filter((c) => c.method === "scope").length, 1);
  assert.equal(writes.length, 14);
  const expectedScope = scopeOf(entityOf("", "x").name.split("_")[0]!);
  assert.notEqual(writes[0]?.path, "learner/user_2leo", "the scope never names the Clerk id");
  assert.equal(expectedScope, "learner/");
  assert.deepEqual(writes[0]?.body, {
    labels: ["session=s2", "turn=15", "writer=evaluator", "move=supraordinate", "level=3"],
    triples: [{ entity: { type: "topic", name: `${writes[0]!.path.slice("learner/".length)}_api` }, key: "level_supraordinate", value: `You moved up to level 3 on 'Bigger group' for API on ${dateOf(new Date())}.`, occurred_at: (writes[0]!.body as { triples: { occurred_at: string }[] }).triples[0]!.occurred_at }],
  });
  assert.deepEqual(writes[7]?.body && (writes[7].body as { labels: string[] }).labels.slice(0, 2), ["session=s3", "turn=16"]);
  // a session with no result leaves nothing to write
  await memory.remember("user_2leo", { ...finished, result: null });
  assert.equal(calls.filter((c) => c.method === "write").length, 14);
  failWrites = true;
  await assert.rejects(memory.remember("user_2leo", finished), /7 of 7 memory writes failed: memory answered 503/);
  // the purge, and the scope is registered again afterwards
  await memory.purge("user_2leo");
  assert.equal(calls.at(-1)?.method, "forget");
  assert.equal(calls.at(-1)?.path, writes[0]?.path);
  failWrites = false;
  await memory.remember("user_2leo", finished);
  assert.equal(calls.filter((c) => c.method === "scope").length, 2);
});

test("the Memory sheet reads each concept's history and leaves out the ones memory holds nothing on", async () => {
  const api: MemoryApi = {
    async registerScope() {},
    async write() {},
    async history(entity) {
      return entity.name.endsWith("_api") ? rows : [];
    },
    async forgetScope() {
      return 0;
    },
  };
  const memory = createLearnerMemory(api, { salt: "" });
  const view = await memory.view("user_2leo", ["JWT", "API"], [["attr_sup1"]]);
  assert.deepEqual(view.concepts.map((c) => c.concept), ["API"]);
  assert.equal(view.concepts[0]?.moves[0]?.history[1]?.readBy, 1);
  assert.deepEqual(await memory.view("user_2leo", [], []), { concepts: [] });
});

test("only the hint giver and the coach receive memory, read once per Turn, and the sources of what they cite are filled in", async () => {
  const facts: MemoryFact[] = [
    { id: "attr_gap1", text: "Last time on API you guessed 7 and proved 4.", concept: "API", since: EARLIER, writtenBy: "coach", sessionId: "s1" },
    { id: "attr_exc1", text: "You moved up to level 2 on 'What it isn't' for API on Oct 22.", concept: "API", move: "exclusion", level: 2, since: EARLIER, writtenBy: "evaluator", sessionId: "s1" },
  ];
  let reads = 0;
  const received: [string, unknown][] = [];
  const callAgent: CallAgent = async (agent, input) => {
    received.push([agent, input]);
    return {};
  };
  const turnMemory = withMemory(callAgent, async () => {
    reads++;
    return { facts };
  });
  assert.deepEqual(turnMemory.given(), []);
  await turnMemory.callAgent("questioner", { q: 1 });
  assert.equal(reads, 0);
  await turnMemory.callAgent("hint_giver", { step: "hint" });
  await turnMemory.callAgent("coach", { concept: "API" });
  assert.equal(reads, 1);
  assert.deepEqual(received, [
    ["questioner", { q: 1 }],
    ["hint_giver", { step: "hint", memory: { facts } }],
    ["coach", { concept: "API", memory: { facts } }],
  ]);
  assert.deepEqual(turnMemory.given(), facts);

  // with nothing in memory the input is the one the orchestrator built
  const without = withMemory(callAgent, async () => undefined);
  await without.callAgent("coach", { concept: "API" });
  assert.deepEqual(received.at(-1), ["coach", { concept: "API" }]);
  assert.deepEqual(without.given(), []);

  const turn = {
    messages: [
      { agent: "coach", kind: "summary", text: "Closer than last time.", cites: ["attr_gap1", "attr_made_up"] },
      { agent: "hint_giver", kind: "hint", text: "Look again.", hintStep: "hint", cites: [] },
      { agent: "app", kind: "question", text: "What group?" },
    ],
  } as unknown as Turn;
  fillSources(turn, facts);
  assert.deepEqual(turn.messages[0]?.sources, [{ id: "attr_gap1", text: "Last time on API you guessed 7 and proved 4." }]);
  assert.equal("sources" in turn.messages[1]!, false);
  assert.equal("sources" in turn.messages[2]!, false);
});
