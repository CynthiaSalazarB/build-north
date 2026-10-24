import assert from "node:assert/strict";
import { test } from "node:test";
import { MOVE_ORDER, advance } from "@build-north/agents";
import { advanceStub, orchestratorFor } from "./advance-stub.ts";
import { initialSession } from "./store.ts";

test("the stub replays the democracy fixture whatever the concept, so it is for development only", async () => {
  const session = { ...initialSession("leo", { concept: "CORS", material: null, mode: "learn" }), id: "s1", createdAt: new Date().toISOString() };
  const mastery = { moves: MOVE_ORDER.map((move) => ({ move, level: 1 as const, unassistedSuccesses: 0 })) };
  const { turn } = await advanceStub({ session, mastery }, { action: "start" }, async () => null);
  assert.equal(turn.mentefacto.concept, "democracy");
  assert.match(turn.messages[0]!.text, /map of democracy/);
});

test("server.ts runs Cynthia's advance with Claude and a database, the stub without them, and a production process missing one refuses to start (#163)", () => {
  assert.equal(orchestratorFor({}, { claude: true, database: true }), advance);
  assert.equal(orchestratorFor({ NODE_ENV: "production", RENDER_GIT_COMMIT: "8cc0621" }, { claude: true, database: true }), advance);
  // local runs: the stub, with no key, no database, or neither
  assert.equal(orchestratorFor({}, { claude: false, database: false }), advanceStub);
  assert.equal(orchestratorFor({ NODE_ENV: "development" }, { claude: true, database: false }), advanceStub);
  assert.equal(orchestratorFor({ NODE_ENV: "test" }, { claude: false, database: true }), advanceStub);
  // Render sets NODE_ENV=production by default and RENDER_GIT_COMMIT on every deploy: either one makes the stub a refusal
  assert.throws(() => orchestratorFor({ NODE_ENV: "production" }, { claude: false, database: true }), /ANTHROPIC_API_KEY.*refuses to start/);
  assert.throws(() => orchestratorFor({ RENDER_GIT_COMMIT: "8cc0621" }, { claude: true, database: false }), /SURREAL_URL.*refuses to start/);
  assert.throws(() => orchestratorFor({ NODE_ENV: "production" }, { claude: false, database: false }), /ANTHROPIC_API_KEY \(Claude\) and SURREAL_URL/);
});
