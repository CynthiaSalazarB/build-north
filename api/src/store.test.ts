import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { DemoSeed, Session as SessionSchema, advance } from "@build-north/agents";
import demoSeed from "@build-north/agents/fixtures/demo-seed.json" with { type: "json" };
import { RecordId, Surreal } from "surrealdb";
import { advanceStub, callAgentStub } from "./advance-stub.ts";
import { createApp } from "./app.ts";
import { loadDemoSeed } from "./demo-seed.ts";
import { createStore, defineSchema } from "./store.ts";

// Needs a real SurrealDB and a root user, for example a local container:
//   docker run --rm -p 8000:8000 surrealdb/surrealdb:latest start --user root --pass <pass> memory
//   SURREAL_TEST_URL=ws://127.0.0.1:8000 SURREAL_TEST_USER=root SURREAL_TEST_PASS=<pass> npm test -w api
// It works in its own namespace (store_test) and empties it first. Never point it at the cloud.
const url = process.env.SURREAL_TEST_URL;

test("the store against a real SurrealDB", { skip: url ? false : "set SURREAL_TEST_URL to run it" }, async (t) => {
  const db = new Surreal();
  await db.connect(url!, {
    authentication: { username: process.env.SURREAL_TEST_USER ?? "root", password: process.env.SURREAL_TEST_PASS ?? "root" },
  });
  t.after(() => db.close());
  await db.query("REMOVE NAMESPACE IF EXISTS store_test; DEFINE NAMESPACE store_test; USE NS store_test; DEFINE DATABASE main;").collect();
  await db.use({ namespace: "store_test", database: "main" });
  await defineSchema(db);
  const store = createStore(db);

  await t.test("a session is written, read back by its owner only, and saved once per Turn", async () => {
    const session = await store.createSession("leo", { concept: "democracy", material: null, mode: "learn" });
    assert.match(session.id, /^[a-z0-9]+$/);
    assert.equal(session.turn, 0);
    assert.equal(await store.getSession("jonathan", session.id), null);
    assert.equal(await store.getSession("leo", "doesnotexist0000000"), null);

    const next = await advanceStub({ session, mastery: await store.getMastery("leo") }, { action: "start" }, callAgentStub);
    assert.equal(await store.saveSession(next.session, session.turn), true);
    const saved = await store.getSession("leo", session.id);
    assert.equal(saved?.turn, 1);
    assert.deepEqual(saved?.lastTurn, next.turn);
    assert.equal(saved?.createdAt, session.createdAt);
    // a second answer to Turn 0 lost the race: its save is refused and changes nothing
    assert.equal(await store.saveSession({ ...next.session, phase: "result" }, session.turn), false);
    assert.equal((await store.getSession("leo", session.id))?.phase, "predict");
    // what comes back from the database still fits Cynthia's Session schema, so `advance` can trust it
    assert.doesNotThrow(() => SessionSchema.parse(session));
    assert.doesNotThrow(() => SessionSchema.parse(saved));
  });

  await t.test("every field the orchestrator changes is saved, the fields it added to Session included", async () => {
    const session = await store.createSession("leo", { concept: "democracy", material: null, mode: "learn" });
    const changed: typeof session = {
      ...session,
      turn: 6,
      phase: "move",
      move: "exclusion",
      hintStep: "nudge",
      recent: [{ from: "app", text: "How is democracy different from monarchy?" }, { from: "learner", text: "Kings?" }],
      retries: 1,
      lastIssue: "too_broad",
      nextQuestion: { move: "isoordinate", level: 2, question: "What other kinds of government are there?", scaffold: null },
      questions: { asked: 1, testing: 0 },
      moveLog: [{ move: "supraordinate", points: 2, hints: 1, retries: 1, from: 2, to: 3 }],
    };
    assert.equal(await store.saveSession(changed, session.turn), true);
    assert.deepEqual(await store.getSession("leo", session.id), changed);
  });

  await t.test("a row that drifted from the contract fails as soon as the store reads it", async () => {
    const session = await store.createSession("leo", { concept: "drift", material: null, mode: "learn" });
    await db.query("UPDATE $id SET phase = 'lost'", { id: new RecordId("session", session.id) }).collect();
    await assert.rejects(store.getSession("leo", session.id));
  });

  await t.test("GET /sessions lists the user's sessions that have a Turn, newest first, finished or not, and nobody else's", async () => {
    const result = { predictedScore: 7, score: 3, maxScore: 8 as const, calibrationGap: 4, hintsUsed: 0, rubric: [], masteryChanges: [], questions: { asked: 0, testing: 0 }, coach: null };
    const first = await store.createSession("lister", { concept: "API", material: null, mode: "learn" });
    const started = await advanceStub({ session: first, mastery: await store.getMastery("lister") }, { action: "start" }, callAgentStub);
    assert.equal(await store.saveSession(started.session, first.turn), true);
    const second = await store.createSession("lister", { concept: "JWT", material: null, mode: "test" });
    const over = await advanceStub({ session: second, mastery: await store.getMastery("lister") }, { action: "start" }, callAgentStub);
    assert.equal(await store.saveSession({ ...over.session, phase: "result", result }, second.turn), true);
    // never started (the agent failed on the first Turn): nothing to show
    await store.createSession("lister", { concept: "CORS", material: null, mode: "learn" });
    await store.createSession("someone-else", { concept: "cache", material: null, mode: "learn" });

    const listed = await store.listSessions("lister");
    assert.deepEqual(listed, [
      { id: second.id, concept: "JWT", mode: "test", createdAt: second.createdAt, finished: true, score: 3, predictedScore: 7 },
      { id: first.id, concept: "API", mode: "learn", createdAt: first.createdAt, finished: false, score: null, predictedScore: null },
    ]);
    assert.deepEqual(await store.listSessions("nobody"), []);
    await store.deleteUserData("lister");
    await store.deleteUserData("someone-else");
  });

  await t.test("mastery starts at level 1 and saves all four moves", async () => {
    const fresh = await store.getMastery("cynthia");
    assert.deepEqual(fresh.moves.map((m) => m.level), [1, 1, 1, 1]);
    fresh.moves[1] = { move: "exclusion", level: 3, unassistedSuccesses: 1 };
    await store.saveMastery("cynthia", fresh);
    assert.deepEqual((await store.getMastery("cynthia")).moves[1], { move: "exclusion", level: 3, unassistedSuccesses: 1 });
  });

  await t.test("the schema refuses a level outside 1 to 5 and a mode it doesn't know", async () => {
    const bad = await store.getMastery("kyle");
    bad.moves[0] = { move: "supraordinate", level: 9 as 5, unassistedSuccesses: 0 };
    await assert.rejects(store.saveMastery("kyle", bad));
    await assert.rejects(store.createSession("kyle", { concept: "x", material: null, mode: "exam" as "test" }));
  });

  await t.test("the Memory sheet's two reads: the finished concepts, each once, and the fact ids each hint giver or coach call received", async () => {
    const result = { predictedScore: 7, score: 3, maxScore: 8 as const, calibrationGap: 4, hintsUsed: 0, rubric: [], masteryChanges: [], questions: { asked: 0, testing: 0 }, coach: null };
    const api1 = await store.createSession("reader", { concept: "API", material: null, mode: "learn" });
    const jwt = await store.createSession("reader", { concept: "JWT", material: null, mode: "learn" });
    const api2 = await store.createSession("reader", { concept: "API", material: null, mode: "learn" });
    await store.createSession("reader", { concept: "CORS", material: null, mode: "learn" });
    const theirs = await store.createSession("other", { concept: "cache", material: null, mode: "learn" });
    for (const s of [api1, jwt, api2, theirs]) assert.equal(await store.saveSession({ ...s, turn: 1, phase: "result", result }, s.turn), true);
    assert.deepEqual([...(await store.finishedConcepts("reader"))].sort(), ["API", "JWT"]);
    assert.deepEqual(await store.finishedConcepts("nobody"), []);

    const facts = (...ids: string[]) => ({ memory: { facts: ids.map((id) => ({ id })) } });
    await store.logAgentCall({ session: api1.id, agent: "hint_giver", input: facts("attr_1", "attr_2"), output: { cites: ["attr_1"] }, ms: 1, usd: 0, dropped: ["attr_x"] });
    await store.logAgentCall({ session: api2.id, agent: "coach", input: facts("attr_1"), output: {}, ms: 1, usd: 0 });
    await store.logAgentCall({ session: api2.id, agent: "coach", input: { concept: "API" }, output: {}, ms: 1, usd: 0 });
    await store.logAgentCall({ session: api1.id, agent: "questioner", input: facts("attr_9"), output: {}, ms: 1, usd: 0 });
    await store.logAgentCall({ session: theirs.id, agent: "coach", input: facts("attr_8"), output: {}, ms: 1, usd: 0 });
    const reads = (await store.memoryReads("reader")).sort((a, b) => b.length - a.length);
    assert.deepEqual(reads, [["attr_1", "attr_2"], ["attr_1"], []]);
    const [dropped] = await db.query("SELECT VALUE dropped FROM agent_log WHERE agent = 'hint_giver'").collect<[string[][]]>();
    assert.deepEqual(dropped, [["attr_x"]]);
    // the delete test below counts the whole agent_log table
    await store.deleteUserData("reader");
    await store.deleteUserData("other");
  });

  await t.test("deleting a user's data removes their sessions, logs and mastery, and nobody else's", async () => {
    const mine = await store.createSession("delete-me", { concept: "inflation", material: "notes", mode: "test" });
    await store.logAgentCall({ session: mine.id, agent: "fact_desk", input: { q: 1 }, output: { a: 2 }, ms: 120.4, usd: 0.0123 });
    await store.saveMastery("delete-me", await store.getMastery("delete-me"));
    const theirs = await store.createSession("keep-me", { concept: "inflation", material: null, mode: "learn" });

    await store.deleteUserData("delete-me");
    const [counts] = await db
      .query(
        `RETURN {
           sessions: count(SELECT id FROM session WHERE user = "delete-me"),
           mastery: count(SELECT id FROM mastery WHERE user = "delete-me"),
           logs: count(SELECT id FROM agent_log)
         }`,
      )
      .collect<[{ sessions: number; mastery: number; logs: number }]>();
    assert.deepEqual(counts, { sessions: 0, mastery: 0, logs: 0 });
    assert.notEqual(await store.getSession("keep-me", theirs.id), null);
  });

  await t.test("the demo seed puts its user at level 5 on every move, with a CORS session the API carries on", async (st) => {
    const seed = DemoSeed.parse(demoSeed);
    const session = await loadDemoSeed(store, "demo");
    assert.deepEqual(await store.getMastery("demo"), seed.mastery);
    assert.deepEqual(await store.getSession("demo", session.id), session);

    // what the app gets when the demo user signs in, then the presenter's first question
    const fact = { kind: "fact", answer: "No. Browsers enforce CORS, and curl doesn't check it.", questionType: "breaking_case" };
    const server = createApp({ corsOrigins: [], checkDb: null, store, advance, callAgentFor: () => async () => fact, userFromToken: null, devKey: "k", memory: null }).listen(0);
    st.after(() => server.close());
    await once(server, "listening");
    const api = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const headers = { "content-type": "application/json", "x-dev-user": "demo", "x-dev-key": "k" };
    const mastery = await (await fetch(`${api}/me/mastery`, { headers })).json();
    assert.deepEqual(mastery.moves.map((m: { level: number }) => m.level), [5, 5, 5, 5]);
    const waiting = await (await fetch(`${api}/sessions/${session.id}`, { headers })).json();
    assert.deepEqual(waiting, { ...seed.session.lastTurn, sessionId: session.id });
    const body = JSON.stringify({ turn: waiting.turn, question: seed.script.questions[0] });
    const next = await (await fetch(`${api}/sessions/${session.id}/turns`, { method: "POST", headers, body })).json();
    assert.deepEqual([next.turn, next.expects, next.messages], [3, "map", [{ agent: "fact_desk", kind: "fact", text: fact.answer }]]);
  });
});
