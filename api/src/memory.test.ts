import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { test, type TestContext } from "node:test";
import { AGENTS, FACT_DESK_REDIRECT, MOVE_ORDER, advance, type CallAgent } from "@build-north/agents";
import { createMemory, learnerScope, memoryClient, memoryConfigFromEnv, type MemoryOptions } from "./memory.ts";
import type { Store } from "./store.ts";
import { KEY, answer, as, fakeClaude, memoryStore, post, start } from "./testing.ts";

// Agent Memory (memory.ts) through the real routes, the real orchestrator and SurrealDB's real client,
// against a stand-in for an Agent Memory context: no live calls. The stand-in records every request
// and answers like the REST API's documented shapes (surrealdb.com/docs/agent-memory/reference/rest-api).

type Recorded = { route: string; path: string; auth: string | undefined; body: any };

function routeOf(method: string, path: string): string {
  const rest = path.replace(/^\/api\/v1\/ctx/, "").replace(/\?.*$/, "");
  if (method === "POST" && rest === "/scopes") return "register";
  if (method === "POST" && rest === "/scopes/forget") return "forget";
  if (method === "POST" && rest === "/facts") return "facts";
  if (method === "POST" && rest === "/documents") return "upload";
  if (method === "POST" && rest === "/documents/query") return "search";
  if (method === "GET" && /^\/entities\/concept\/[^/]+\/history$/.test(rest)) return "history";
  return "unknown";
}

async function fakeAgentMemory(t: TestContext) {
  const am = {
    requests: [] as Recorded[],
    // "→route" when a request arrives, "←route" when its answer goes out
    events: [] as string[],
    // the concept's history (null: no such entity yet, a 404) and the passages a notes search finds
    history: null as object[] | null,
    passages: [] as object[],
    // routes that answer with an error status, and routes that answer only after a delay (ms)
    failing: new Map<string, number>(),
    slow: new Map<string, number>(),
    url: "",
    of: (route: string) => am.requests.filter((r) => r.route === route),
  };
  const server = createServer(async (req, res) => {
    const route = routeOf(req.method ?? "", req.url ?? "");
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks);
    const type = req.headers["content-type"] ?? "";
    let body: unknown = null;
    if (type.startsWith("multipart/form-data")) {
      const form = await new Response(raw, { headers: { "content-type": type } }).formData();
      const file = form.get("file") as File;
      body = { metadata: JSON.parse(String(form.get("metadata"))), file: await file.text(), filename: file.name, type: file.type };
    } else if (raw.length) body = JSON.parse(raw.toString());
    am.requests.push({ route, path: req.url ?? "", auth: req.headers.authorization, body });
    am.events.push(`→${route}`);

    const send = (status: number, json: unknown) => {
      am.events.push(`←${route}`);
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(json));
    };
    const reply = () => {
      const failure = am.failing.get(route);
      if (failure) return send(failure, { message: `scripted ${failure}` });
      const b = body as Record<string, unknown>;
      if (route === "register") return send(201, { path: `${b.path}/`, createdAt: "2026-10-21T12:00:00Z" });
      if (route === "facts") return send(200, { mode: "triples", sessionId: "am-session" });
      if (route === "upload") return send(202, { id: "doc1", status: "queued", contentHash: "4f3c", deduplicated: false });
      if (route === "search") return send(200, { queryMs: 4, results: am.passages });
      if (route === "history") return am.history ? send(200, { history: am.history, page: { hasMore: false } }) : send(404, { message: "entity not found" });
      if (route === "forget") return send(200, { forgotten: 7 });
      send(404, { message: "no such route" });
    };
    const delay = am.slow.get(route);
    if (delay) setTimeout(reply, delay);
    else reply();
  });
  server.listen(0);
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  await once(server, "listening");
  am.url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return am;
}

// The API with Agent Memory on, Claude scripted, and the store in memory. `levelFive` seeds the learner
// at level 5 on every move, the demo's profile: the whole map, with the fact desk. `slowAgent` makes one
// agent's Claude call take that long.
type SetupOptions = MemoryOptions & { levelFive?: boolean; slowAgent?: [keyof typeof AGENTS, number] };
async function setup(t: TestContext, replies: [keyof typeof AGENTS, unknown][], { levelFive = false, slowAgent, ...options }: SetupOptions = {}) {
  const am = await fakeAgentMemory(t);
  const memory = createMemory(memoryClient({ url: am.url, contextId: "ctx", apiKey: "sp-test-key" }), { turnWaitMs: 200, ...options });
  const store: Store = memoryStore();
  if (levelFive) await store.saveMastery("leo", { moves: MOVE_ORDER.map((move) => ({ move, level: 5 as const, unassistedSuccesses: 0 })) });
  const claude = fakeClaude(replies);
  const callAgentFor = (sessionId: string): CallAgent => {
    const call = claude.callAgentFor(sessionId);
    return async (agent, input) => {
      if (slowAgent?.[0] === agent) await new Promise((resolve) => setTimeout(resolve, slowAgent[1]));
      return call(agent, input);
    };
  };
  const url = await start(t, { corsOrigins: [], checkDb: null, store, advance, callAgentFor, devKey: KEY, memory });
  return { am, url, claude, store };
}

// Answers the latest Turn with `body` and returns the next one, which must not carry an error
async function next(url: string, latest: { sessionId: string; turn: number }, body: object) {
  const res = await answer(url, latest.sessionId, { ...body, turn: latest.turn });
  assert.equal(res.status, 200);
  const turn = await res.json();
  assert.equal(turn.error, null, `Turn ${turn.turn}`);
  return turn;
}

// The writes happen after the response, so a test waits for them to arrive
async function until(check: () => boolean) {
  const deadline = Date.now() + 2_000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error("Agent Memory never got the requests the test waits for");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

const scope = learnerScope("leo");
const key = scope.slice("learner/".length);
const item = (value: string, note: string | null = null) => ({ value, note });
const judged = (verdict: string, quality: number, accepted: object[], feedback: string, issue = "none") => ({
  verdict,
  quality,
  accepted,
  issue,
  reason: "scripted",
  feedback,
});
// The start of the democracy session (app.test.ts): a new learner, the worked example, then the bigger group
const toTheFirstPart = [{ prediction: 7 }, { text: "When people vote." }, { action: "continue" }];
const firstQuestion: [keyof typeof AGENTS, unknown] = ["questioner", { question: "Democracy is one example of a bigger group. What group?", scaffold: null }];
const aheadQuestion: [keyof typeof AGENTS, unknown] = ["questioner", { question: "What looks close to democracy but isn't one?", scaffold: null }];
const logged = (claude: { logged: { agent: string; input: unknown }[] }, agent: string) =>
  claude.logged.filter((row) => row.agent === agent).map((row) => row.input as Record<string, unknown>);

test("Agent Memory is off without the SPECTRON_* variables, and needs all three to be on", () => {
  assert.equal(memoryConfigFromEnv({}), null);
  assert.equal(memoryConfigFromEnv({ SPECTRON_URL: " ", SPECTRON_CONTEXT_ID: "", SPECTRON_API_KEY: "" }), null);
  const all = { SPECTRON_URL: "https://ctx-123.aws-use1.surreal.cloud", SPECTRON_CONTEXT_ID: "reality-check", SPECTRON_API_KEY: "sp-test-key" };
  assert.deepEqual(memoryConfigFromEnv(all), { url: all.SPECTRON_URL, contextId: "reality-check", apiKey: "sp-test-key" });
  assert.throws(() => memoryConfigFromEnv({ ...all, SPECTRON_API_KEY: "" }), /all three/);
  assert.throws(() => memoryConfigFromEnv({ SPECTRON_URL: all.SPECTRON_URL }), /all three/);
  assert.throws(() => memoryConfigFromEnv({ ...all, SPECTRON_URL: "ctx-123.surreal.cloud" }), /SPECTRON_URL is not a URL/);
  // the scope is a hash of the user id, the same every time
  assert.match(scope, /^learner\/[0-9a-f]{24}$/);
  assert.equal(learnerScope("leo"), scope);
  assert.notEqual(learnerScope("jonathan"), scope);
});

test("a session's notes go to the learner's scope as a document, in the background; a test session's never do, and the user id never leaves the API", async (t) => {
  const { am, url } = await setup(t, []);
  const notes = "Pluto orbits the Sun, but it hasn't cleared its orbit.";
  assert.equal((await post(url, { concept: "planet", material: notes })).status, 201);
  await until(() => am.of("upload").length === 1);
  assert.deepEqual(am.requests.map((r) => r.route), ["register", "upload"]);
  assert.deepEqual(am.of("register")[0]!.body, { path: scope });
  const [upload] = am.of("upload");
  assert.deepEqual(upload!.body, {
    metadata: { title: "Notes on planet", scopes: [[scope]], labels: ["session=s1"] },
    file: notes,
    filename: "notes.txt",
    type: "text/plain",
  });
  assert.equal(upload!.auth, "Bearer sp-test-key");

  // no notes, or a test session: nothing to upload, and a test session leaves no trace
  assert.equal((await post(url, { concept: "planet" })).status, 201);
  assert.equal((await post(url, { concept: "planet", material: notes, mode: "test" })).status, 201);
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(am.requests.length, 2);
  assert.doesNotMatch(JSON.stringify(am.requests), /leo/);
});

test("a part answered wrong, then right, writes two facts on the same part in that order, so the right one replaces the wrong one", async (t) => {
  const wrong = "Not quite: a law is one rule, and democracy isn't a rule. So what kind of thing is it?";
  const { am, url } = await setup(t, [
    firstQuestion,
    ["evaluator", judged("incorrect", 0, [], wrong, "not_a_class")],
    aheadQuestion,
    ["evaluator", judged("correct", 2, [item("form of government")], "Yes: they're all forms of government.")],
  ]);
  let latest = await (await post(url, { concept: "democracy" })).json();
  for (const body of [...toTheFirstPart, { text: "A law?" }]) latest = await next(url, latest, body);
  await until(() => am.of("facts").length === 1);
  latest = await next(url, latest, { text: "Forms of government." });
  assert.equal(latest.move, "exclusion");
  await until(() => am.of("facts").length === 2);

  const fact = (value: string, said: string) => ({
    infer: "triples",
    scopes: [[scope]],
    memory_category: "knowledge",
    labels: ["agent=evaluator", "session=s1"],
    triples: [{ entity: { type: "concept", name: `democracy (learner ${key})` }, key: "supraordinate", value, source_clause: said }],
  });
  assert.deepEqual(
    am.of("facts").map((r) => r.body),
    [fact(`incorrect (not_a_class): said "A law?". ${wrong}`, "A law?"), fact("correct", "Forms of government.")],
  );
  // the scope is registered once, before the first write; no part was the last, so no history was read
  assert.deepEqual(am.requests.map((r) => r.route), ["register", "facts", "facts"]);
});

test("a Help right after a wrong answer reads the history once the fact about that answer is written", async (t) => {
  const { am, url, claude } = await setup(
    t,
    [
      firstQuestion,
      ["evaluator", judged("incorrect", 0, [], "A thing is too broad. What's closer?", "too_broad")],
      aheadQuestion,
      ["hint_giver", { step: "hint", text: "Think of monarchy and dictatorship too. What are all three?", revealed: null }],
    ],
    { turnWaitMs: 1_000 },
  );
  am.history = [];
  am.slow.set("facts", 150);
  let latest = await (await post(url, { concept: "democracy" })).json();
  for (const body of [...toTheFirstPart, { text: "A thing?" }, { action: "help" }]) latest = await next(url, latest, body);
  assert.equal(latest.messages[0].hintStep, "hint");
  const written = am.events.indexOf("←facts");
  assert.ok(written >= 0 && written < am.events.indexOf("→history"), am.events.join(" "));
  assert.deepEqual(logged(claude, "hint_giver")[0]!.memory, []);
});

test("a Turn that failed writes nothing, since the learner answers it again", async (t) => {
  t.mock.method(console, "error", () => {});
  // the part is right, but the next part's question fails (the script has no more), so the Turn fails
  const { am, url } = await setup(t, [firstQuestion, ["evaluator", judged("correct", 2, [item("form of government")], "Yes.")]]);
  let latest = await (await post(url, { concept: "democracy" })).json();
  for (const body of toTheFirstPart) latest = await next(url, latest, body);
  const failed = await (await answer(url, latest.sessionId, { turn: latest.turn, text: "Forms of government." })).json();
  assert.deepEqual(failed.error, { code: "agent_failed", retryable: false });
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.deepEqual(am.requests, []);
});

test("a test session never reads or writes Agent Memory, like mastery", async (t) => {
  const { am, url, claude } = await setup(t, [
    ["fact_desk", { kind: "fact", answer: "Not by the current definition.", questionType: "breaking_case", source: null }],
    ["evaluator_full", { rubric: MOVE_ORDER.map((move) => ({ move, quality: 1, feedback: "Scripted." })) }],
    ["coach", { message: "Scripted coach.", nextFocus: "supraordinate" }],
  ]);
  am.history = [];
  let latest = await (await post(url, { concept: "planet", material: "Pluto hasn't cleared its orbit.", mode: "test" })).json();
  latest = await next(url, latest, { prediction: 4 });
  latest = await next(url, latest, { question: "Is Pluto a planet?" });
  latest = await next(url, latest, { mentefacto: { concept: "planet", supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] } });
  assert.equal(latest.expects, "none");
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.deepEqual(am.requests, []);
  assert.equal(logged(claude, "coach")[0]!.memory, undefined);
});

test("the hint giver and the coach get the learner's history on the concept, each part's latest facts oldest first, and the whole map's verdicts are written after", async (t) => {
  const { am, url, claude } = await setup(
    t,
    [
      ["hint_giver", { step: "nudge", text: "What is a planet a kind of?", revealed: null }],
      ["evaluator_full", { rubric: MOVE_ORDER.map((move) => ({ move, quality: move === "exclusion" ? 1 : 2, feedback: `Scripted ${move}.` })) }],
      ["coach", { message: "The bigger group holds up this time.", nextFocus: "exclusion" }],
    ],
    { levelFive: true },
  );
  const row = (id: string, rowKey: string, value: string, createdAt: string, more: object = {}) => ({
    id,
    entity: `entity:concept/planet (learner ${key})`,
    key: rowKey,
    value,
    createdAt,
    confidence: 1,
    importance: 0.5,
    labels: [],
    memoryCategory: "knowledge",
    scope: [[`${scope}/`]],
    source: { kind: "upsert" },
    ...more,
  });
  // newest first, as Agent Memory sends it; a key that isn't a part (from its own consolidation) is skipped
  am.history = [
    row("attribute:3", "supraordinate", "correct", "2026-10-20T10:05:00Z", { supersedes: "attribute:1" }),
    row("attribute:9", "top_priority", "speed", "2026-10-20T10:04:00Z"),
    row("attribute:1", "supraordinate", 'incorrect (too_broad): said "a thing". Too broad.', "2026-10-20T10:00:00Z", {
      supersededBy: "attribute:3",
      validUntil: "2026-10-20T10:05:00Z",
    }),
    row("attribute:2", "exclusion", 'partial: put "star". Say what separates them.', "2026-10-19T09:00:00Z"),
  ];
  const memory = [
    { move: "supraordinate", fact: 'incorrect (too_broad): said "a thing". Too broad.', current: false },
    { move: "supraordinate", fact: "correct", current: true },
    { move: "exclusion", fact: 'partial: put "star". Say what separates them.', current: true },
  ];

  const first = await (await post(url, { concept: "planet" })).json();
  const map = await next(url, first, { prediction: 6 });
  assert.equal(map.expects, "map");
  const helped = await next(url, map, { action: "help" });
  const mentefacto = {
    concept: "planet",
    supraordinate: item("opaque celestial body"),
    exclusion: [item("star")],
    isoordinate: [item("orbits a star"), item("cleared its orbit")],
    infraordinate: [item("rocky planet"), item("giant planet")],
  };
  const done = await next(url, helped, { mentefacto });
  assert.equal(done.expects, "none");

  assert.deepEqual(logged(claude, "hint_giver")[0]!.memory, memory);
  assert.deepEqual(logged(claude, "coach")[0]!.memory, memory);
  // read once per turn, from the entity of this learner and concept
  assert.equal(am.of("history").length, 2);
  assert.equal(am.of("history")[0]!.path, `/api/v1/ctx/entities/concept/${encodeURIComponent(`planet (learner ${key})`)}/history?limit=50`);

  await until(() => am.of("facts").length === 1);
  const [write] = am.of("facts");
  assert.deepEqual(write!.body.labels, ["agent=evaluator_full", `session=${first.sessionId}`]);
  assert.deepEqual(
    write!.body.triples.map((triple: { key: string; value: string; source_clause?: string }) => [triple.key, triple.value, triple.source_clause]),
    [
      ["supraordinate", "correct", "opaque celestial body"],
      ["exclusion", 'partial: put "star". Scripted exclusion.', "star"],
      ["isoordinate", "correct", "orbits a star; cleared its orbit"],
      ["infraordinate", "correct", "rocky planet; giant planet"],
    ],
  );
});

test("a fact desk answer from the learner's notes carries the stored passage, only when the fact desk names one", async (t) => {
  const { am, url, claude } = await setup(
    t,
    [
      ["fact_desk", { kind: "fact", answer: "Not by the current definition: it hasn't cleared its orbit.", questionType: "breaking_case", source: 2 }],
      ["fact_desk", { kind: "fact", answer: "Eight.", questionType: "fact", source: 5 }],
      ["fact_desk", { kind: "redirect", answer: "It's a celestial body.", questionType: "asks_for_structure", source: 1 }],
    ],
    { levelFive: true },
  );
  const passage = (n: number, text: string, charStart: number) => ({
    chunk: { id: `chunk${n}`, document: "doc1", position: n, section: null, text, charStart, charEnd: charStart + text.length },
    document: { id: "doc1", title: "Notes on planet", source: "notes.txt" },
    score: 0.9 - n / 10,
  });
  am.passages = [passage(1, "Planets orbit a star.", 0), passage(2, "Pluto hasn't cleared its orbit.", 22)];
  const cited = { document: "doc1", title: "Notes on planet", quote: "Pluto hasn't cleared its orbit.", start: 22, end: 53 };

  const first = await (await post(url, { concept: "planet", material: "Planets orbit a star. Pluto hasn't cleared its orbit." })).json();
  const map = await next(url, first, { prediction: 6 });
  const fact = await next(url, map, { question: "If Pluto orbits the Sun, is it a planet?" });
  assert.deepEqual(fact.messages, [{ agent: "fact_desk", kind: "fact", text: "Not by the current definition: it hasn't cleared its orbit.", source: cited }]);
  // the source is saved with the Turn, so a reload or a resent question gets it too
  assert.deepEqual(await (await fetch(`${url}/sessions/${first.sessionId}`, { headers: as("leo") })).json(), fact);
  assert.deepEqual(am.of("search")[0]!.body, { query: "If Pluto orbits the Sun, is it a planet?", k: 3, lens: [[scope]] });
  assert.deepEqual(logged(claude, "fact_desk")[0]!.notes, [
    { document: "doc1", title: "Notes on planet", quote: "Planets orbit a star.", start: 0, end: 21 },
    cited,
  ]);

  // a number with no passage, and a redirect, carry no source
  const unsourced = await next(url, fact, { question: "How many planets are there?" });
  assert.deepEqual(unsourced.messages, [{ agent: "fact_desk", kind: "fact", text: "Eight." }]);
  const redirect = await next(url, unsourced, { question: "What's the bigger group?" });
  assert.deepEqual(redirect.messages, [{ agent: "fact_desk", kind: "redirect", text: FACT_DESK_REDIRECT }]);
});

test("Delete my data erases the learner's scope after their writes, and answers 503 when Agent Memory can't, so the learner can try again", async (t) => {
  t.mock.method(console, "error", () => {});
  const { am, url } = await setup(t, []);
  const remove = () => fetch(`${url}/me/data`, { method: "DELETE", headers: as("leo") });
  const { sessionId } = await (await post(url, { concept: "planet", material: "Planets orbit a star." })).json();
  // the notes upload is still on its way: the erase waits for it
  assert.equal((await remove()).status, 204);
  assert.deepEqual(am.requests.map((r) => r.route), ["register", "upload", "forget"]);
  assert.deepEqual(am.of("forget")[0]!.body, { path: scope });
  assert.equal((await fetch(`${url}/sessions/${sessionId}`, { headers: as("leo") })).status, 404);

  am.failing.set("forget", 500);
  await post(url, { concept: "planet" });
  const failed = await remove();
  assert.equal(failed.status, 503);
  assert.match((await failed.json()).error, /Try again/);
  // our own tables went first either way
  assert.equal((await fetch(`${url}/sessions/s2`, { headers: as("leo") })).status, 404);

  // a scope Agent Memory never registered holds nothing to erase
  am.failing.set("forget", 400);
  assert.equal((await remove()).status, 204);
});

test("a memory call that fails never fails a turn: the agent goes without, and the failure is logged", async (t) => {
  const warned = t.mock.method(console, "warn", () => {});
  const { am, url, claude } = await setup(
    t,
    [
      ["fact_desk", { kind: "fact", answer: "Not by the current definition.", questionType: "breaking_case", source: null }],
      ["hint_giver", { step: "nudge", text: "What is a planet a kind of?", revealed: null }],
      ["evaluator_full", { rubric: MOVE_ORDER.map((move) => ({ move, quality: 2, feedback: "Scripted." })) }],
      ["coach", { message: "The whole map holds up.", nextFocus: null }],
    ],
    { levelFive: true },
  );
  for (const route of ["register", "upload", "search", "history", "facts"]) am.failing.set(route, 500);

  const first = await (await post(url, { concept: "planet", material: "Pluto hasn't cleared its orbit." })).json();
  let latest = await next(url, first, { prediction: 6 });
  latest = await next(url, latest, { question: "Is Pluto a planet?" });
  assert.equal(latest.messages[0].source, undefined);
  latest = await next(url, latest, { action: "help" });
  const blank = { concept: "planet", supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] };
  latest = await next(url, latest, { mentefacto: blank });
  assert.equal(latest.expects, "none");

  assert.equal(logged(claude, "fact_desk")[0]!.notes, undefined);
  assert.equal(logged(claude, "hint_giver")[0]!.memory, undefined);
  assert.equal(logged(claude, "coach")[0]!.memory, undefined);
  await until(() => warned.mock.calls.some((call) => /the fact write failed/.test(String(call.arguments[0]))));
  assert.ok(warned.mock.calls.every((call) => String(call.arguments[0]).startsWith("Agent Memory: ")));
});

test("the coach's read starts with the whole map's evaluation, so it doesn't add its wait to the last Turn", async (t) => {
  // the read takes 300 ms and the coach waits at most 100: it only gets memory because the read began
  // alongside the 300 ms evaluation
  const { am, url, claude } = await setup(
    t,
    [
      ["evaluator_full", { rubric: MOVE_ORDER.map((move) => ({ move, quality: 2, feedback: "Scripted." })) }],
      ["coach", { message: "The whole map holds up.", nextFocus: null }],
    ],
    { levelFive: true, turnWaitMs: 100, slowAgent: ["evaluator_full", 300] },
  );
  am.history = [];
  am.slow.set("history", 300);
  const first = await (await post(url, { concept: "planet" })).json();
  const map = await next(url, first, { prediction: 6 });
  await next(url, map, { mentefacto: { concept: "planet", supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] } });
  assert.deepEqual(logged(claude, "coach")[0]!.memory, []);
});

test("a slow memory read is cut off at the turn's wait, and the agent goes without", async (t) => {
  t.mock.method(console, "warn", () => {});
  const { am, url, claude } = await setup(t, [["hint_giver", { step: "nudge", text: "What is a planet a kind of?", revealed: null }]], {
    levelFive: true,
    turnWaitMs: 50,
  });
  am.history = [];
  am.slow.set("history", 1_000);
  const first = await (await post(url, { concept: "planet" })).json();
  const map = await next(url, first, { prediction: 6 });
  const started = performance.now();
  await next(url, map, { action: "help" });
  assert.ok(performance.now() - started < 800, "the Help waited for the slow read");
  assert.equal(logged(claude, "hint_giver")[0]!.memory, undefined);
  assert.equal(am.of("history").length, 1);
});
