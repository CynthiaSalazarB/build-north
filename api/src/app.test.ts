import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { test, type TestContext } from "node:test";
import { createApp, type AppOptions } from "./app.ts";

const WEB = "http://localhost:8081";
const noDb: AppOptions = { corsOrigins: [WEB], checkDb: null };

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
