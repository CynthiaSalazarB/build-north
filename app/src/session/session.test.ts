// The session logic without a phone: the fixture replay (#6), the API client's requests and answers
// (#7), and what the transcript shows.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Turn, type TurnBody } from "@build-north/agents";
import sessionApi from "@build-north/agents/fixtures/session-api.json" with { type: "json" };
import sessionOne from "@build-north/agents/fixtures/session-1.json" with { type: "json" };
import { createApiClient } from "./api-client.ts";
import { ClientError } from "./client.ts";
import { createFixtureClient } from "./fixture-client.ts";
import { resultMessagesOf } from "./present.ts";
import { blankMap, drafted, echoFor, failed, initialState, received, resendOf, sent, startedWith, withRevealed } from "./transcript.ts";

const fixtureTurns = sessionOne.map((step) => Turn.parse(step.turn));
const first = fixtureTurns[0]!;

test("the fixture client clicks through the whole recorded API session, then stops", async () => {
  const client = createFixtureClient(0);
  let state = received(initialState, await client.start({ concept: "API" }));
  assert.equal(state.turn!.mentefacto.concept, "API");
  for (const step of sessionApi.slice(1)) {
    const body = { turn: state.turn!.turn, ...(step.input as object) } as TurnBody;
    state = sent(state, body);
    state = received(state, await client.send(state.turn!.sessionId, body));
  }
  assert.equal(state.turn!.expects, "none");
  assert.equal(state.turn!.result!.score, 5);
  await assert.rejects(client.send("x", { turn: 99, action: "continue" }), ClientError);
  // a second run is its own session to the screens, so the coach is asked again (demo mode's Try again)
  assert.notEqual((await client.start({ concept: "API" })).sessionId, state.turn!.sessionId);
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

test("the result comes first without the coach's words; the next Turn brings them, and the result's lines stay", () => {
  let state = initialState;
  for (const turn of fixtureTurns.slice(0, -1)) state = received(state, turn);
  assert.deepEqual([state.turn!.phase, state.turn!.expects, state.turn!.result!.coach], ["result", "continue", null]);
  const shown = resultMessagesOf(state.entries);
  state = received(state, fixtureTurns.at(-1)!);
  assert.equal(state.turn!.expects, "none");
  assert.deepEqual(resultMessagesOf(state.entries), [...shown, { agent: "coach", kind: "summary", text: state.turn!.result!.coach!.message }]);
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

test("the delete button sends DELETE /me/data with the credentials, no body, and takes the 204", async () => {
  const calls: Call[] = [];
  const fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(null, { status: 204 });
  }) as unknown as typeof globalThis.fetch;
  await createApiClient({ baseUrl: "http://api.test", getToken: async () => "tok", fetch }).deleteData();
  assert.equal(calls[0]!.url, "http://api.test/me/data");
  assert.equal(calls[0]!.init.method, "DELETE");
  assert.equal(calls[0]!.init.body, undefined);
  assert.deepEqual(calls[0]!.init.headers, { authorization: "Bearer tok" });

  const refused = createApiClient({ baseUrl: "http://api.test", fetch: fakeFetch(401, { error: "Sign in first" }).fetch });
  await assert.rejects(refused.deleteData(), { message: "Sign in first", status: 401, retryable: false });
  // demo mode has nothing to delete, and says nothing
  await createFixtureClient(0).deleteData();
});

/** A level-5 Turn: the whole map, as the orchestrator sends it after the guess. */
function wholeMap(over: Partial<Turn> = {}): Turn {
  return Turn.parse({
    sessionId: "ses_5",
    turn: 2,
    phase: "move",
    move: null,
    level: 5,
    messages: [{ agent: "app", kind: "question", text: "Build the mentefacto for CORS. Ask me any facts you need." }],
    expects: "map",
    scaffold: null,
    mentefacto: blankMap("CORS"),
    example: null,
    progress: { movesDone: 0, movesTotal: 4, hintsUsed: 0 },
    result: null,
    error: null,
    ...over,
  });
}

test("a self-test starts in test mode, and the learner's map stays on the phone until they submit", () => {
  let state = startedWith(wholeMap(), "test");
  assert.equal(state.mode, "test");
  assert.deepEqual(state.draft, blankMap("CORS"));
  const mine = { ...blankMap("CORS"), supraordinate: { value: "web security", note: null }, infraordinate: [{ value: "simple requests", note: null }] };
  state = drafted(state, mine);
  // a fact desk answer keeps the map as the learner left it
  state = received(sent(state, { turn: 2, question: "Does curl get blocked?" }), wholeMap({ turn: 3, messages: [{ agent: "fact_desk", kind: "fact", text: "No: browsers enforce it." }] }));
  assert.deepEqual(state.draft, mine);
  assert.equal(state.entries.at(-2)?.from, "learner");
});

test("an answer Help revealed joins the learner's map once: a bigger group replaces theirs, list items are added", () => {
  const mine = { ...blankMap("CORS"), supraordinate: { value: "web security", note: null }, infraordinate: [{ value: "simple requests", note: null }] };
  const server = {
    ...blankMap("CORS"),
    supraordinate: { value: "browser security mechanism", note: null },
    infraordinate: [{ value: "Simple Requests", note: null }, { value: "preflighted requests", note: null }],
  };
  const joined = withRevealed(mine, server);
  assert.deepEqual(joined.supraordinate, server.supraordinate);
  assert.deepEqual(joined.infraordinate.map((i) => i.value), ["simple requests", "preflighted requests"]);
  assert.deepEqual(withRevealed(joined, server), joined);
  // the learner's own map isn't changed in place
  assert.equal(mine.supraordinate.value, "web security");
});

test("the map goes once the result comes back, and only a level-5 Turn takes edits", () => {
  let state = startedWith(wholeMap());
  state = received(state, { ...wholeMap({ turn: 3, phase: "result", expects: "none" }), result: null });
  assert.equal(state.draft, null);
  assert.equal(drafted(state, blankMap("x")).draft, null);
  assert.equal(drafted(received(initialState, first), blankMap("x")).draft, null);
});

test("a retry sends the same body, except that a map goes as the learner has it now", () => {
  let state = startedWith(wholeMap());
  const before = { ...blankMap("CORS"), supraordinate: { value: "a browser rule", note: null } };
  state = drafted(state, before);
  state = failed(sent(state, { turn: 2, mentefacto: before }), "offline", true);
  assert.deepEqual(resendOf(state), { turn: 2, mentefacto: before });
  // the failure note says the map is saved, so a part fixed before Try again is what goes
  const fixed = { ...before, supraordinate: { value: "a browser security rule", note: null } };
  assert.deepEqual(resendOf(drafted(state, fixed)), { turn: 2, mentefacto: fixed });
  // a text answer goes as it was, and nothing goes without a retryable failure
  const text = failed(sent(startedWith(first), { turn: 1, text: "a rule" }), "down", true);
  assert.deepEqual(resendOf(text), { turn: 1, text: "a rule" });
  assert.equal(resendOf(failed(sent(startedWith(first), { turn: 1, text: "a rule" }), "spent", false)), null);
  assert.equal(resendOf(state.failure ? { ...state, failure: null } : state), null);
});
