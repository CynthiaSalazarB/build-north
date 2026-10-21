// What the round 6 screens say: the words and counts come from the Turns, so they're checked here.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Turn } from "@build-north/agents";
import sessionOne from "@build-north/agents/fixtures/session-1.json" with { type: "json" };
import {
  blocksOf,
  eyebrowOf,
  gapOf,
  helpLabelOf,
  hintCardOf,
  keysOf,
  partLabelOf,
  sinceLastQuestion,
  splitTrailingQuestion,
  stageOf,
  waitingLineOf,
} from "./present.ts";
import { initialState, received, sent } from "./transcript.ts";

const turns = sessionOne.map((step) => Turn.parse(step.turn));

test("a level reads as a stage of the statue", () => {
  assert.deepEqual(stageOf(2), { name: "Clay", does: "Guided" });
  assert.deepEqual(stageOf(5), { name: "Patina", does: "You Ask" });
});

test("the hint card counts three hints, then the answer scores 0", () => {
  assert.deepEqual(hintCardOf("nudge"), { title: "Hint 1 of 3", pips: 1, note: "This part can now score 1 point at most." });
  assert.equal(hintCardOf("partial").pips, 3);
  assert.deepEqual(hintCardOf("reveal"), { title: "The answer", pips: null, note: "This part scores 0 now. Its answer is on your map." });
});

test("Help shows a price only while it would still cost a point", () => {
  const question = { id: "q", from: "app", message: { agent: "questioner", kind: "question", text: "What group?" }, phase: "move", move: "supraordinate", level: 2 } as const;
  const answer = { id: "a", from: "learner", text: "A law?" } as const;
  const hint = { id: "h", from: "app", message: { agent: "hint_giver", kind: "hint", text: "Think of monarchy.", hintStep: "hint" }, phase: "move", move: "supraordinate", level: 2 } as const;
  assert.equal(helpLabelOf([question]), "Help · −1 pt");
  assert.equal(helpLabelOf([question, answer]), "Help");
  assert.equal(helpLabelOf([question, answer, hint]), "More Help");
  // a new question starts a new part, so the price comes back
  assert.deepEqual(sinceLastQuestion([question, answer, hint, question]), [question]);
});

test("a reply that ends in a question splits off the question", () => {
  assert.deepEqual(splitTrailingQuestion("Not quite: a law is one rule, and democracy isn't a rule. So what kind of thing is it?"), {
    statement: "Not quite: a law is one rule, and democracy isn't a rule.",
    question: "So what kind of thing is it?",
  });
  assert.deepEqual(splitTrailingQuestion("What group?"), { statement: "", question: "What group?" });
  assert.deepEqual(splitTrailingQuestion("You found it."), { statement: "You found it.", question: null });
});

test("a short lead before a colon becomes the eyebrow", () => {
  assert.deepEqual(eyebrowOf("Before any help: in your own words, what is democracy?"), {
    eyebrow: "Before any help",
    text: "In your own words, what is democracy?",
  });
  assert.deepEqual(eyebrowOf("Democracy is one example of a bigger group. What group?"), {
    eyebrow: null,
    text: "Democracy is one example of a bigger group. What group?",
  });
});

test("the gap is a signed number and one sentence, and the blocks match it", () => {
  assert.deepEqual(gapOf({ calibrationGap: 2 }), { sign: "+", amount: 2, sentence: "You felt 2 points surer than you were.", over: true });
  assert.deepEqual(gapOf({ calibrationGap: -1 }), { sign: "−", amount: 1, sentence: "You did 1 point better than you felt.", over: false });
  assert.equal(gapOf({ calibrationGap: 0 }).sentence, "Your guess was exactly right.");
  assert.deepEqual(blocksOf(7, 5), ["cast", "cast", "cast", "cast", "cast", "shade", "shade", "empty"]);
  assert.deepEqual(blocksOf(3, 5), ["cast", "cast", "cast", "cast", "cast", "empty", "empty", "empty"]);
});

test("the democracy session walks the Greek key from no parts to all four", () => {
  const firstMove = turns.find((t) => t.phase === "move")!;
  assert.deepEqual(keysOf(turns[0]!), ["todo", "todo", "todo", "todo"]);
  assert.deepEqual(keysOf(firstMove), ["now", "todo", "todo", "todo"]);
  assert.equal(partLabelOf(firstMove), "1 of 4");
  assert.equal(partLabelOf(turns[0]!), null);
  assert.deepEqual(keysOf(turns.at(-1)!), ["done", "done", "done", "done"]);
});

test("the transcript keeps each message's phase and level, and doesn't echo the guess", () => {
  let state = received(initialState, turns[0]!);
  state = sent(state, { turn: 1, prediction: 7 });
  assert.ok(state.entries.every((e) => e.from === "app" && e.phase === "predict"));
  assert.equal(waitingLineOf(state.pending), "Opening the map…");
  assert.equal(waitingLineOf({ turn: 2, text: "x" }), "Checking your answer…");
  assert.equal(waitingLineOf({ turn: 2, action: "help" }), "Finding a hint…");
});
