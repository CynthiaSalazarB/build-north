// What the device keeps so a session survives a reload or a killed app: the record, its text form, and what is
// read back from it.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Turn } from "@build-north/agents";
import sessionOne from "@build-north/agents/fixtures/session-1.json" with { type: "json" };
import { parseSaved, savedOf, serializeSaved } from "./saved.ts";
import { blankMap, drafted, initialState, received, startedWith } from "./transcript.ts";

const turns = sessionOne.map((step) => Turn.parse(step.turn));
const first = turns[0]!;
const at = new Date("2026-10-23T18:30:00Z");

test("a session on screen is kept with its mode and its notes; one that is over, or none at all, is not", () => {
  assert.equal(savedOf(initialState), null);
  const learning = startedWith(first, "learn", "my notes");
  assert.deepEqual(savedOf(learning, at), { sessionId: first.sessionId, concept: first.mentefacto.concept, mode: "learn", material: "my notes", draft: null, savedAt: at.toISOString() });
  // the result with the coach's words is the end: nothing is left to pick up
  let over = initialState;
  for (const turn of turns) over = received(over, turn);
  assert.equal(over.turn!.expects, "none");
  assert.equal(savedOf(over), null);
  // the result before the coach's words still waits for them, so it is kept
  let waiting = initialState;
  for (const turn of turns.slice(0, -1)) waiting = received(waiting, turn);
  assert.equal(savedOf(waiting, at)?.sessionId, first.sessionId);
});

test("at level 5 the learner's map goes with the record, and comes back from the text", () => {
  const level5 = Turn.parse({ ...first, turn: 2, phase: "move", level: 5, expects: "map", messages: [], mentefacto: blankMap("CORS") });
  const map = { ...blankMap("CORS"), supraordinate: { value: "a browser rule", note: null } };
  const state = drafted(startedWith(level5, "test"), map);
  const record = savedOf(state, at)!;
  assert.deepEqual(record.draft, map);
  assert.equal(record.mode, "test");
  assert.deepEqual(parseSaved(serializeSaved(record)), record);
});

test("anything that isn't a record reads back as nothing: no text, bad JSON, an older shape, a map that isn't one", () => {
  assert.equal(parseSaved(null), null);
  assert.equal(parseSaved(""), null);
  assert.equal(parseSaved("{"), null);
  assert.equal(parseSaved("42"), null);
  assert.equal(parseSaved(JSON.stringify({ sessionId: "ses_1" })), null);
  assert.equal(parseSaved(JSON.stringify({ sessionId: "", concept: "API", mode: "learn" })), null);
  assert.equal(parseSaved(JSON.stringify({ sessionId: "ses_1", concept: "API", mode: "quiz" })), null);
  assert.equal(parseSaved(JSON.stringify({ sessionId: "ses_1", concept: "API", mode: "learn", draft: { concept: "API" } })), null);
  // the least a record needs; what it didn't say takes its empty value
  assert.deepEqual(parseSaved(JSON.stringify({ sessionId: "ses_1", concept: "API", mode: "learn" })), { sessionId: "ses_1", concept: "API", mode: "learn", material: null, draft: null, savedAt: "" });
});
