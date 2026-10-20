import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { test, type TestContext } from "node:test";
import { advanceStub } from "./advance-stub.ts";
import { createApp, type AppOptions } from "./app.ts";
import { MOVES, type Session } from "./contract.ts";
import { initialSession, type Store } from "./store.ts";

const WEB = "http://localhost:8081";
const noDb: AppOptions = { corsOrigins: [WEB], checkDb: null, store: null, advance: advanceStub, allowDevUser: true };

// The Store contract kept in memory, so the routes can be tested without a database.
function memoryStore(): Store {
  const sessions = new Map<string, Session>();
  return {
    async createSession(user, input) {
      const session: Session = { ...initialSession(user, input), id: `s${sessions.size + 1}`, createdAt: new Date().toISOString() };
      sessions.set(session.id, session);
      return structuredClone(session);
    },
    async getSession(user, id) {
      const session = sessions.get(id);
      return session?.user === user ? structuredClone(session) : null;
    },
    async saveSession(session) {
      sessions.set(session.id, structuredClone(session));
    },
    async getMastery() {
      return { moves: MOVES.map((move) => ({ move, level: 1 as const, unassistedSuccesses: 0 })) };
    },
    async saveMastery() {},
    async logAgentCall() {},
    async deleteUserData() {},
  };
}

const withStore = (): AppOptions => ({ ...noDb, store: memoryStore() });
const post = (url: string, body: unknown, user: string | null = "leo") =>
  fetch(`${url}/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(user ? { "x-dev-user": user } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
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

test("GET /health/db is 503 without SurrealDB", async (t) => {
  const res = await fetch(`${await start(t, noDb)}/health/db`);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).ok, false);
});

test("GET /health/db returns the check's record and timings", async (t) => {
  const check = { record: { id: "ping:api", at: "2026-10-19T00:00:00Z" }, ms: { write: 2, read: 3 } };
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

  const again = await fetch(`${url}/sessions/${turn.sessionId}`, { headers: { "x-dev-user": "leo" } });
  assert.equal(again.status, 200);
  assert.deepEqual(await again.json(), turn);
});

test("a session is invisible to every other user", async (t) => {
  const url = await start(t, withStore());
  const { sessionId } = await (await post(url, { concept: "inflation" })).json();
  const res = await fetch(`${url}/sessions/${sessionId}`, { headers: { "x-dev-user": "jonathan" } });
  assert.equal(res.status, 404);
});

test("without a dev user, or in production, the session routes answer 401", async (t) => {
  assert.equal((await post(await start(t, withStore()), { concept: "democracy" }, null)).status, 401);
  const production = await start(t, { ...withStore(), allowDevUser: false });
  assert.equal((await post(production, { concept: "democracy" })).status, 401);
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
