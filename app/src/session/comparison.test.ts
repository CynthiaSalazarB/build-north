import assert from "node:assert/strict";
import { test } from "node:test";
import { Turn, type TranscriptStep, type TurnBody } from "@build-north/agents";
import sessionApi from "@build-north/agents/fixtures/session-api.json" with { type: "json" };
import { comparisonAreasOf, FIRST_EXPLANATION_NOTE, firstExplanationOf } from "./comparison.ts";
import { blankMap, failed, initialState, received, replayed, sent, startedWith, type Entry } from "./transcript.ts";

const steps: TranscriptStep[] = sessionApi.map((step, i) => ({ body: i === 0 ? null : { turn: i, ...step.input } as TurnBody, turn: Turn.parse(step.turn) }));
const latest = steps.at(-1)!.turn;
const live = steps.reduce((state, { body, turn }) => received(body ? sent(state, body) : state, turn), initialState);

test("the first-explanation note promises a return, without scoring or suggesting an answer", () => {
  assert.equal(FIRST_EXPLANATION_NOTE, "This first explanation is not scored. You'll revisit it at the end.");
});

test("the live and reopened result use the learner's exact submitted first explanation", () => {
  const attempt = steps.findIndex(({ turn }) => turn.phase === "attempt");
  const answer = steps[attempt + 1]!.body!;
  assert.ok("text" in answer);
  assert.equal(firstExplanationOf(live.entries), answer.text);
  const back = replayed(steps, latest);
  assert.equal(firstExplanationOf(back.entries), answer.text);
  assert.deepEqual(comparisonAreasOf(latest.mentefacto, back.entries), comparisonAreasOf(latest.mentefacto, live.entries));
});

test("old/incomplete histories, whole-map answers and a missing first answer are not reconstructed", () => {
  assert.equal(firstExplanationOf([]), null);
  assert.equal(firstExplanationOf(startedWith(latest).entries), null);
  assert.equal(firstExplanationOf(replayed(steps.slice(2), latest).entries), null);
  assert.equal(firstExplanationOf([{ id: "learner-0", from: "learner", text: "Here's my map." }]), null);
  const question = live.entries.find((e) => e.from === "app" && e.phase === "attempt")!;
  const after = live.entries.find((e) => e.from === "app" && e.phase === "move")!;
  assert.equal(firstExplanationOf([question, after, { id: "learner-1", from: "learner", text: "a map answer" }]), null);
});

test("a failed first send is not a saved explanation; a revised successful submission stays verbatim", () => {
  const attempt = steps.find(({ turn }) => turn.phase === "attempt")!.turn;
  const next = steps.find(({ turn }) => turn.turn === attempt.turn + 1)!.turn;
  const unsaved = { turn: attempt.turn, text: "first unsaved send" };
  const pending = sent(startedWith(attempt), unsaved);
  assert.equal(firstExplanationOf(pending.entries), null);
  const failure = failed(pending, unsaved, "offline", true);
  const exact = "  My explanation\nwith `code` and bigger group.  ";
  const saved = received(sent(failure, { turn: attempt.turn, text: exact }), next);
  assert.equal(firstExplanationOf(saved.entries), exact);
});

test("the first explanation is kept when guided moves begin without a worked example", () => {
  const attempt = steps.find(({ turn }) => turn.phase === "attempt")!.turn;
  const move = steps.find(({ turn }) => turn.phase === "move")!.turn;
  const after = received(sent(startedWith(attempt), { turn: attempt.turn, text: "My own starting words." }), move);
  assert.equal(firstExplanationOf(after.entries), "My own starting words.");
  assert.equal(firstExplanationOf([...after.entries, { id: "later", from: "learner", text: "A later map answer." }]), "My own starting words.");
});

test("hints and reveals are attributed to the area just asked, not the next move in their Turn", () => {
  const entry = (id: string, move: "supraordinate" | "exclusion" | "infraordinate", kind: "question" | "hint", hintStep?: "hint" | "reveal"): Entry => ({
    id, from: "app", phase: "move", move, level: 2,
    message: { agent: kind === "hint" ? "hint_giver" : "app", kind, text: "words", ...(hintStep ? { hintStep } : {}) },
  });
  const entries = [
    entry("turn-1-0", "supraordinate", "question"),
    entry("turn-2-0", "supraordinate", "hint", "hint"),
    entry("turn-3-0", "exclusion", "question"),
    entry("turn-4-0", "infraordinate", "hint", "reveal"),
    entry("turn-4-1", "infraordinate", "question"),
  ];
  const areas = comparisonAreasOf(blankMap("API"), entries);
  assert.deepEqual(areas.map((area) => area.support), ["hint", "revealed", "answer", "answer"]);
});

test("the comparison keeps differences and multiline classifications, and never invents a corrected map", () => {
  const map = { ...blankMap("API"),
    supraordinate: { value: "software interface", note: null },
    exclusion: [{ value: "user interface", note: "used by people rather than software" }],
    infraordinate: [{ value: "By access:\npublic and private", note: null }],
  };
  const before = JSON.stringify(map);
  const areas = comparisonAreasOf(map, []);
  assert.deepEqual(areas[1]!.items, map.exclusion);
  assert.equal(areas[2]!.items.length, 0);
  assert.equal(areas[3]!.items[0]!.value, "By access:\npublic and private");
  assert.ok(areas.every((area) => area.support === "answer"));
  assert.equal(JSON.stringify(map), before);
});
