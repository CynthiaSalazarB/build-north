import assert from "node:assert/strict";
import { test } from "node:test";
import { Session as SessionSchema } from "@build-north/agents";
import { RecordId, Surreal } from "surrealdb";
import { advanceStub, callAgentStub } from "./advance-stub.ts";
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

  await t.test("a row that drifted from the contract fails as soon as the store reads it", async () => {
    const session = await store.createSession("leo", { concept: "drift", material: null, mode: "learn" });
    await db.query("UPDATE $id SET phase = 'lost'", { id: new RecordId("session", session.id) }).collect();
    await assert.rejects(store.getSession("leo", session.id));
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

  await t.test("deleting a user's data removes their sessions, logs and mastery, and nobody else's", async () => {
    const mine = await store.createSession("delete-me", { concept: "inflation", material: "notes", mode: "test" });
    await store.logAgentCall({ session: mine.id, agent: "fact_desk", input: { q: 1 }, output: { a: 2 }, ms: 120.4 });
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
});
