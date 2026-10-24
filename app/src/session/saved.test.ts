// What the device keeps per session so a pick-up loses nothing: the record, its text form, and what is read back
// from it.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Turn } from "@build-north/agents";
import sessionOne from "@build-north/agents/fixtures/session-1.json" with { type: "json" };
import { parseSaved, savedOf, serializeSaved, withSaved } from "./saved.ts";
import { blankMap, drafted, initialState, received, startedWith, type SessionState } from "./transcript.ts";

const turns = sessionOne.map((step) => Turn.parse(step.turn));
const first = turns[0]!;

test("a session on screen is kept with its notes; one that is over, none at all, or one with nothing to keep, is not", () => {
  assert.equal(savedOf(initialState), null);
  const learning = startedWith(first, "learn", "my notes");
  assert.deepEqual(savedOf(learning), { sessionId: first.sessionId, material: "my notes", draft: null });
  // no notes and no map: the server holds everything a pick-up needs
  assert.equal(savedOf(startedWith(first, "learn", null)), null);
  // the result with the coach's words is the end: nothing is left to pick up
  let over = initialState;
  for (const turn of turns) over = received(over, { ...turn });
  assert.equal(over.turn!.expects, "none");
  assert.equal(savedOf({ ...over, material: "my notes" }), null);
  // the result before the coach's words still waits for them, so it is kept
  let waiting: SessionState = { ...initialState, material: "my notes" };
  for (const turn of turns.slice(0, -1)) waiting = received(waiting, turn);
  assert.equal(savedOf(waiting)?.sessionId, first.sessionId);
});

test("at level 5 the learner's map goes with the record, and comes back from the text", () => {
  const level5 = Turn.parse({ ...first, turn: 2, phase: "move", level: 5, expects: "map", messages: [], mentefacto: blankMap("CORS") });
  const map = { ...blankMap("CORS"), supraordinate: { value: "a browser rule", note: null } };
  const state = drafted(startedWith(level5, "test"), map);
  const record = savedOf(state)!;
  assert.deepEqual(record, { sessionId: level5.sessionId, material: null, draft: map });
  assert.deepEqual(parseSaved(serializeSaved([record])), [record]);
});

test("one record per session: a new record replaces the session's old one, and null removes it", () => {
  const a = { sessionId: "ses_a", material: "a", draft: null };
  const b = { sessionId: "ses_b", material: "b", draft: null };
  const list = withSaved(withSaved([], "ses_a", a), "ses_b", b);
  assert.deepEqual(list, [a, b]);
  assert.deepEqual(withSaved(list, "ses_a", { ...a, material: "a2" }), [b, { ...a, material: "a2" }]);
  assert.deepEqual(withSaved(list, "ses_b", null), [a]);
  assert.deepEqual(withSaved(list, "ses_c", null), [a, b]);
});

test("anything that isn't a record reads back as nothing; the one record kept before Oct 24 reads as a list of one", () => {
  assert.deepEqual(parseSaved(null), []);
  assert.deepEqual(parseSaved(""), []);
  assert.deepEqual(parseSaved("{"), []);
  assert.deepEqual(parseSaved("42"), []);
  assert.deepEqual(parseSaved(JSON.stringify({ sessionId: "" })), []);
  assert.deepEqual(parseSaved(JSON.stringify([{ sessionId: "ses_1", draft: { concept: "API" } }, 7, null])), []);
  // the older shape kept the concept, the mode and the date too; what a record didn't say takes its empty value
  assert.deepEqual(parseSaved(JSON.stringify({ sessionId: "ses_1", concept: "API", mode: "learn", material: "notes", savedAt: "2026-10-23T18:30:00Z" })), [
    { sessionId: "ses_1", material: "notes", draft: null },
  ]);
  assert.deepEqual(parseSaved(JSON.stringify([{ sessionId: "ses_1" }, { sessionId: "ses_2", material: 3 }])), [
    { sessionId: "ses_1", material: null, draft: null },
    { sessionId: "ses_2", material: null, draft: null },
  ]);
});
