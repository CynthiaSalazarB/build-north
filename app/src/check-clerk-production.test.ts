import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const script = fileURLToPath(new URL("../scripts/check-clerk-production.mjs", import.meta.url));
const run = (key?: string) => {
  const env = { ...process.env };
  delete env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const result = spawnSync(process.execPath, [script], { encoding: "utf8", env: key ? { ...env, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: key } : env });
  return { status: result.status, output: result.stdout + result.stderr };
};

test("production Clerk check blocks missing and test keys, accepts live keys without echoing them", () => {
  assert.equal(run().status, 1);
  const testKey = run("pk_test_abc123");
  assert.equal(testKey.status, 1);
  assert.match(testKey.output, /production deploy blocked/i);
  const liveKey = `pk_live_${"a".repeat(24)}$`;
  const live = run(liveKey);
  assert.equal(live.status, 0, live.output);
  assert.doesNotMatch(live.output, new RegExp(liveKey));
});
