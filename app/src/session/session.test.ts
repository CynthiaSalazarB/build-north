// The session logic without a phone: the fixture replay (#6), the API client's requests and answers
// (#7), and what the transcript shows.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Turn, type TurnBody } from "@build-north/agents";
import sessionOne from "@build-north/agents/fixtures/session-1.json" with { type: "json" };
import { createApiClient } from "./api-client.ts";
import { ClientError } from "./client.ts";
import { createFixtureClient } from "./fixture-client.ts";
import { echoFor, failed, initialState, received, sent } from "./transcript.ts";

const fixtureTurns = sessionOne.map((step) => Turn.parse(step.turn));
const first = fixtureTurns[0]!;

test("the fixture client clicks through the whole democracy session, then stops", async () => {
  const client = createFixtureClient(0);
  let state = received(initialState, await client.start({ concept: "democracy" }));
  for (const step of sessionOne.slice(1)) {
    const body = { turn: state.turn!.turn, ...(step.input as object) } as TurnBody;
    state = sent(state, body);
    state = received(state, await client.send(state.turn!.sessionId, body));
  }
  assert.equal(state.turn!.expects, "none");
  assert.equal(state.turn!.result!.score, 5);
  await assert.rejects(client.send("x", { turn: 99, action: "continue" }), ClientError);
});

test("the transcript adds a Turn's messages once, and echoes what the learner sent", () => {
  let state = received(initialState, first);
  assert.equal(state.entries.length, first.messages.length);
  state = sent(state, { turn: 1, text: "A form of government" });
  assert.deepEqual(state.entries.at(-1), { id: "learner-1", from: "learner", text: "A form of government" });
  // a resend or a 409 answers with the same Turn: nothing is added twice
  state = received(state, first);
  assert.equal(state.entries.length, first.messages.length + 1);
  assert.equal(echoFor({ turn: 3, action: "continue" }), null);
  // the guess has its own screen, so it isn't echoed
  assert.equal(echoFor({ turn: 1, prediction: 7 }), null);
});

test("the worked example's map joins the conversation once, ahead of its messages", () => {
  let state = initialState;
  for (const turn of fixtureTurns) state = received(state, turn);
  const at = state.entries.findIndex((e) => e.from === "map");
  const exampleTurn = fixtureTurns.find((t) => t.example)!;
  assert.equal(state.entries.filter((e) => e.from === "map").length, 1);
  assert.equal(state.entries[at + 1]!.id, `turn-${exampleTurn.turn}-0`);
});

test("an error Turn keeps the screen and offers to send the same body again, without echoing it twice", () => {
  const body = { turn: 1, prediction: 7 } as const;
  let state = sent(received(initialState, first), body);
  state = received(state, { ...first, error: { code: "agent_failed", retryable: true } });
  assert.deepEqual(state.failure, { message: "Something went wrong on our side.", retryable: true, body });
  assert.equal(state.pending, null);
  const before = state.entries.length;
  state = sent(state, body, true);
  assert.equal(state.entries.length, before);
  assert.equal(state.failure, null);
  assert.deepEqual(failed(state, "offline", true).failure, { message: "offline", retryable: true, body });
});

type Call = { url: string; init: RequestInit };
function fakeFetch(status: number, json: unknown) {
  const calls: Call[] = [];
  const fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
  }) as unknown as typeof globalThis.fetch;
  return { fetch, calls };
}

test("the API client posts the contract's bodies with the dev headers, and checks the Turn", async () => {
  const { fetch, calls } = fakeFetch(201, first);
  const client = createApiClient({ baseUrl: "http://api.test/", devUser: "tester", devKey: "k", fetch });
  assert.deepEqual(await client.start({ concept: "democracy" }), first);
  await client.send("ses_1", { turn: 1, prediction: 7 });
  assert.equal(calls[0]!.url, "http://api.test/sessions");
  assert.equal(calls[1]!.url, "http://api.test/sessions/ses_1/turns");
  assert.equal(calls[1]!.init.body, JSON.stringify({ turn: 1, prediction: 7 }));
  assert.deepEqual(calls[0]!.init.headers, { "content-type": "application/json", "x-dev-user": "tester", "x-dev-key": "k" });
});

test("a Clerk token goes instead of the dev headers", async () => {
  const { fetch, calls } = fakeFetch(201, first);
  await createApiClient({ baseUrl: "http://api.test", devUser: "tester", devKey: "k", getToken: async () => "tok", fetch }).start({ concept: "x" });
  assert.deepEqual(calls[0]!.init.headers, { "content-type": "application/json", authorization: "Bearer tok" });
});

test("a 409 with the latest Turn is drawn; other errors carry the server's message", async () => {
  assert.deepEqual(await createApiClient({ baseUrl: "http://api.test", fetch: fakeFetch(409, first).fetch }).send("s", { turn: 9, text: "x" }), first);

  const conflict = createApiClient({ baseUrl: "http://api.test", fetch: fakeFetch(409, { error: "This session is over" }).fetch });
  await assert.rejects(conflict.send("s", { turn: 9, text: "x" }), { message: "This session is over", retryable: false });

  const busy = createApiClient({ baseUrl: "http://api.test", fetch: fakeFetch(429, { error: "Too many requests" }).fetch });
  await assert.rejects(busy.send("s", { turn: 1, text: "x" }), { status: 429, retryable: true });

  const down = createApiClient({ baseUrl: "http://api.test", fetch: (async () => { throw new TypeError("network"); }) as unknown as typeof fetch });
  await assert.rejects(down.start({ concept: "x" }), { status: null, retryable: true });
});
