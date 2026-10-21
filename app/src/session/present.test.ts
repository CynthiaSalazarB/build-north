// What the round 8 screens say: the words, the checks and the box's corners come from the Turns, so they're
// checked here.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Turn, type Mentefacto, type MoveId, type Result } from "@build-north/agents";
import sessionOne from "@build-north/agents/fixtures/session-1.json" with { type: "json" };
import {
  aloneOf,
  checksOf,
  currentPartOf,
  eyebrowOf,
  fileNameOf,
  filledOf,
  firstOnPart,
  gapOf,
  guessCornersOf,
  helpLabelOf,
  hintCardOf,
  hintPartOf,
  itemsOf,
  missesOf,
  partLabelOf,
  partMeaningOf,
  partNotesOf,
  resultCornersOf,
  secretLineOf,
  splitTrailingQuestion,
  waitingLineOf,
  wholeMapHelpLabelOf,
  withPart,
} from "./present.ts";
import { blankMap, initialState, received, sent, type Entry } from "./transcript.ts";

const turns = sessionOne.map((step) => Turn.parse(step.turn));
const through = (last: number) => turns.filter((t) => t.turn <= last).reduce(received, initialState);
// the board's corner order (theme.ts box.cornerOrder; theme.ts needs React Native, so it isn't imported here)
const ORDER = [4, 8, 3, 7, 1, 2, 6, 5];

test("the session's concept shows as a spec file", () => {
  assert.equal(fileNameOf("JWT"), "jwt.spec");
  assert.equal(fileNameOf(" database index "), "database-index.spec");
});

test("the first hint on a part shows its price; the answer scores 0", () => {
  assert.deepEqual(hintCardOf("nudge", true), { title: "hint 1/3 · −1 pt", note: "this part can now score 1 point at most" });
  assert.equal(hintCardOf("hint", false).title, "hint 2/3");
  assert.equal(hintCardOf("partial", true).title, "hint 3/3 · −1 pt");
  assert.deepEqual(hintCardOf("reveal", false), { title: "the answer", note: "this part scores 0 now. its answer is on your map" });
});

test("Help shows a price only while it would still cost a point", () => {
  const question = { id: "turn-4-0", from: "app", message: { agent: "questioner", kind: "question", text: "What group?" }, phase: "move", move: "supraordinate", level: 2 } as const;
  const answer = { id: "learner-3", from: "learner", text: "A law?" } as const;
  const hint = { id: "turn-6-0", from: "app", message: { agent: "hint_giver", kind: "hint", text: "Think of monarchy.", hintStep: "hint" }, phase: "move", move: "supraordinate", level: 2 } as const;
  assert.equal(helpLabelOf([question]), "help · −1 pt");
  assert.equal(helpLabelOf([question, answer]), "help");
  assert.equal(helpLabelOf([question, answer, hint]), "more help");
});

test("the screen shows the Turn that asked the latest question, with the feedback that came with it", () => {
  // turn 7 says "yes", names the move, then asks about the next part
  assert.deepEqual(currentPartOf(through(7).entries).map((e) => e.id), ["turn-7-0", "turn-7-1", "turn-7-2"]);
});

test("a reply that ends in a question splits off the question, and a short lead becomes the label", () => {
  assert.deepEqual(splitTrailingQuestion("Not quite: a law is one rule, and democracy isn't a rule. So what kind of thing is it?"), {
    statement: "Not quite: a law is one rule, and democracy isn't a rule.",
    question: "So what kind of thing is it?",
  });
  assert.deepEqual(splitTrailingQuestion("You found it."), { statement: "You found it.", question: null });
  assert.deepEqual(eyebrowOf("Before any help: in your own words, what is democracy?"), {
    eyebrow: "Before any help",
    text: "In your own words, what is democracy?",
  });
  assert.equal(eyebrowOf("Democracy is one example of a bigger group. What group?").eyebrow, null);
});

test("the checks list walks the democracy session from queued to done, with the help each part took", () => {
  const firstMove = turns.find((t) => t.phase === "move")!;
  assert.deepEqual(checksOf(firstMove, []).map((c) => c.state), ["now", "queued", "queued", "queued"]);
  assert.equal(partLabelOf(firstMove), "1/4");
  assert.equal(partLabelOf(turns[0]!), null);
  const done = checksOf(turns.at(-1)!, through(Infinity).entries);
  assert.deepEqual(
    done.map(({ state, meta }) => [state, meta]),
    [
      ["hinted", "done · 1 hint"],
      ["done", "done"],
      ["hinted", "done · 1 hint"],
      ["done", "done"],
    ],
  );
});

test("the guess rings the corners it expects; the result proves, feels sure, or leaves them", () => {
  assert.deepEqual(guessCornersOf(ORDER, 3), { 4: "expected", 8: "expected", 3: "expected", 7: "empty", 1: "empty", 2: "empty", 6: "empty", 5: "empty" });
  const over = resultCornersOf(ORDER, 7, 5);
  assert.deepEqual(ORDER.map((corner) => over[corner as keyof typeof over]), ["proved", "proved", "proved", "proved", "proved", "felt", "felt", "empty"]);
  // did better than the guess: nothing was felt sure without proof
  const under = resultCornersOf(ORDER, 2, 3);
  assert.deepEqual(ORDER.map((corner) => under[corner as keyof typeof under]), ["proved", "proved", "proved", "empty", "empty", "empty", "empty", "empty"]);
});

test("the gap is a signed number and one sentence", () => {
  assert.deepEqual(gapOf({ calibrationGap: 2 }), { sign: "+", amount: 2, sentence: "You felt 2 points surer than you were.", over: true });
  assert.deepEqual(gapOf({ calibrationGap: -1 }), { sign: "−", amount: 1, sentence: "You did 1 point better than you felt.", over: false });
  assert.equal(gapOf({ calibrationGap: 0 }).sentence, "Your guess was exactly right.");
});

test("where the gap came from: each part under 2, the help it took and what ended up on the map", () => {
  const result: Result = {
    predictedScore: 7,
    score: 5,
    maxScore: 8,
    calibrationGap: 2,
    hintsUsed: 3,
    rubric: [
      { move: "supraordinate", points: 2 },
      { move: "exclusion", points: 0 },
      { move: "isoordinate", points: 2 },
      { move: "infraordinate", points: 1 },
    ],
    masteryChanges: [],
    questions: { asked: 0, testing: 0 },
    coach: { message: "Its types are next.", nextFocus: "infraordinate" },
  };
  const hint = (move: MoveId, hintStep: "nudge" | "reveal", turn: number): Entry => ({
    id: `turn-${turn}-0`,
    from: "app",
    message: { agent: "hint_giver", kind: "hint", text: "…", hintStep },
    phase: "move",
    move,
    level: 2,
  });
  const map: Mentefacto = {
    concept: "JWT",
    supraordinate: { value: "token format", note: null },
    exclusion: [{ value: "an encrypted token", note: "a JWT is signed, not encrypted" }],
    isoordinate: [],
    infraordinate: [{ value: "HS256", note: null }],
  };
  const entries = [hint("exclusion", "nudge", 5), hint("exclusion", "reveal", 6), hint("infraordinate", "nudge", 9)];
  assert.deepEqual(missesOf(result, entries, map), [
    { move: "exclusion", label: "What it isn't", meta: "0/2 · answer shown", detail: "an encrypted token: a JWT is signed, not encrypted" },
    { move: "infraordinate", label: "Its types", meta: "1/2 · 1 hint", detail: "HS256" },
  ]);
  // the whole-map evaluator's note wins over the map
  assert.equal(missesOf(result, entries, map, { infraordinate: "Name a second type." })[1]!.detail, "Name a second type.");
  assert.deepEqual(aloneOf(result), ["Bigger group", "What it needs"]);
});

test("notes with a key, a token or a password stop at the phone, and the warning says which line", () => {
  // fakes, put together at run time so this file never holds a secret-shaped string
  const fake = (...parts: string[]) => parts.join("");
  const secrets = [
    fake("sk", "-ant-api03-", "a".repeat(24)),
    fake("AK", "IA", "Q".repeat(16)),
    fake("pass", "word = ", "hunter2", "hunter2"),
    fake("DATABASE_PASS", "WORD=", "hunter22"),
    fake("CLERK_SECRET", '_KEY="', "sk", "_test_", "a1".repeat(10), '"'),
    fake("-".repeat(5), "BEGIN RSA PRIVATE ", "KEY", "-".repeat(5)),
  ];
  for (const secret of secrets) assert.equal(secretLineOf(secret), 1, secret.slice(0, 4));
  assert.equal(secretLineOf(fake("JWT: login/ signs a token\n", "api", "_key: ", "9f8e7d6c".repeat(2))), 2);
  const fine = [
    "JWT: the API signs a token after login",
    "token: signed in auth/login.ts",
    "Password hashing: bcrypt in auth/hash.ts",
    "task-queue-processing-worker in jobs/",
    "rate limiting on /api/sessions",
  ];
  for (const text of fine) assert.equal(secretLineOf(text), null, text);
});

test("the transcript doesn't echo the guess, and the waiting line says what's happening", () => {
  const state = sent(received(initialState, turns[0]!), { turn: 1, prediction: 7 });
  assert.ok(state.entries.every((e) => e.from === "app" && e.phase === "predict"));
  assert.equal(waitingLineOf(state.pending), "opening the box…");
  assert.equal(waitingLineOf({ turn: 2, text: "x" }), "checking your answer…");
  assert.equal(waitingLineOf({ turn: 2, question: "Is it a kind of token?" }), "asking the fact desk…");
  assert.equal(waitingLineOf({ turn: 2, action: "help" }), "finding a hint…");
});

test("on the whole map, Help costs a point on each new part, then names the part it helps", () => {
  assert.equal(wholeMapHelpLabelOf(0), "help · −1 pt");
  assert.equal(wholeMapHelpLabelOf(1), "more help");
  assert.equal(wholeMapHelpLabelOf(3), "more help");
  // the fourth Help revealed the bigger group, so the next one starts on what it isn't
  assert.equal(wholeMapHelpLabelOf(4), "help · −1 pt");
  assert.equal(wholeMapHelpLabelOf(16), null);
  assert.deepEqual([0, 3, 4, 8, 15].map(hintPartOf), ["supraordinate", "supraordinate", "exclusion", "isoordinate", "infraordinate"]);
  assert.deepEqual([0, 1, 4, 5].map(firstOnPart), [true, false, true, false]);
});

test("a part is written back clean: blanks go, and only an exclusion keeps its difference", () => {
  const map = blankMap("CORS");
  const exclusion = withPart(map, "exclusion", [
    { value: " same-origin policy ", note: " it relaxes that policy " },
    { value: "  ", note: "ignored" },
    { value: "a firewall", note: " " },
  ]);
  assert.deepEqual(exclusion.exclusion, [
    { value: "same-origin policy", note: "it relaxes that policy" },
    { value: "a firewall", note: null },
  ]);
  assert.deepEqual(withPart(map, "isoordinate", [{ value: "an Origin header", note: "dropped" }]).isoordinate, [{ value: "an Origin header", note: null }]);
  assert.equal(withPart(map, "supraordinate", [{ value: "", note: null }]).supraordinate, null);
  assert.equal(filledOf(exclusion), 1);
  assert.deepEqual(itemsOf(withPart(map, "supraordinate", [{ value: "browser security mechanism", note: null }]), "supraordinate"), [
    { value: "browser security mechanism", note: null },
  ]);
});

test("the whole-map evaluator's note on each part comes off its label", () => {
  const notes = partNotesOf([
    { agent: "evaluator", kind: "feedback", text: "Bigger group: 'Security' is too broad. What's the closest group?" },
    { agent: "evaluator", kind: "feedback", text: "What it isn't: A sharp exclusion." },
    { agent: "coach", kind: "summary", text: "Bigger group: not a note" },
    { agent: "evaluator", kind: "feedback", text: "Not quite: a law is one rule." },
  ]);
  assert.deepEqual(notes, { supraordinate: "'Security' is too broad. What's the closest group?", exclusion: "A sharp exclusion." });
  assert.equal(partMeaningOf("isoordinate", "CORS"), "What something needs to count as CORS.");
});
