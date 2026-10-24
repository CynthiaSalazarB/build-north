// Which client a build gets (#163): with EXPO_PUBLIC_API_URL the API, without it the recorded session (demo mode).
// Leo's dev build ran without the URL, so a tap on CORS replayed the recorded session about API; a build exported
// with the URL must never do that.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ClientError } from "./client.ts";
import { clientFor } from "./config.ts";

test("with an API address the client is the API client: offline is false, and a session starts over the network", async () => {
  const client = clientFor("http://127.0.0.1:1", async () => "tok");
  assert.equal(client.offline, false);
  // nothing listens on port 1, so the request fails as unreachable; the recorded session would have answered a Turn
  await assert.rejects(client.start({ concept: "CORS" }), (error: unknown) => error instanceof ClientError && error.status === null && error.retryable);
  // the address is trimmed, and without a token (local dev, no Clerk) it is still the API client
  assert.equal(clientFor(" http://127.0.0.1:1 ").offline, false);
});

test("without an API address the client is the recorded session: offline is true, and it is about API whatever the concept", async () => {
  for (const unset of [undefined, "", "  "]) assert.equal(clientFor(unset).offline, true);
  const turn = await clientFor(undefined).start({ concept: "CORS" });
  assert.equal(turn.mentefacto.concept, "API");
});
