import assert from "node:assert/strict";
import { test } from "node:test";
import { surrealConfigFromEnv } from "./db.ts";

const full = {
  SURREAL_URL: "wss://example.surreal.cloud",
  SURREAL_NAMESPACE: "build_north",
  SURREAL_DATABASE: "dev",
  SURREAL_USER: "api",
  SURREAL_PASS: "secret",
};

test("no SURREAL_URL means no database, not an error", () => {
  assert.equal(surrealConfigFromEnv({}), null);
});

test("a full config signs in as a root user by default", () => {
  assert.equal(surrealConfigFromEnv(full)?.authLevel, "root");
  assert.equal(surrealConfigFromEnv({ ...full, SURREAL_AUTH_LEVEL: "database" })?.authLevel, "database");
});

test("a half-filled config fails at startup instead of at the first request", () => {
  assert.throws(() => surrealConfigFromEnv({ ...full, SURREAL_URL: "example.surreal.cloud" }), /not a URL/);
  assert.throws(() => surrealConfigFromEnv({ ...full, SURREAL_PASS: "" }), /SURREAL_PASS/);
  assert.throws(() => surrealConfigFromEnv({ ...full, SURREAL_AUTH_LEVEL: "admin" }), /SURREAL_AUTH_LEVEL/);
});
