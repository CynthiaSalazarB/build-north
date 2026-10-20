// #3 done when: a test replays session 1 from the brief and gets the same agents in the same order, a
// prediction of 7, a score of 5/8 and a calibration gap of +2. The Turns it produces must also be the
// ones in fixtures/session-1.json, the file the app renders.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  advance,
  type AgentName,
  type CallAgent,
  FACT_DESK_REDIRECT,
  type Mastery,
  type Mentefacto,
  MOVE_ORDER,
  type MoveId,
  rules,
  Session,
  Turn,
  type TurnInput,
  UnexpectedInput,
  WORKED_EXAMPLE,
  WorkedExample,
} from "../src/index.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const empty = (concept: string): Mentefacto => ({ concept, supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] });
const item = (value: string, note: string | null = null) => ({ value, note });

function newSession(concept: string, mode: "learn" | "test" = "learn"): Session {
  return {
    id: "ses_demo_democracy",
    user: "tester",
    concept,
    material: null,
    mode,
    turn: 0,
    lastTurn: null,
    predictedScore: null,
    firstAttempt: null,
    phase: "predict",
    move: null,
    hintStep: null,
    hintsPerMove: { supraordinate: 0, exclusion: 0, isoordinate: 0, infraordinate: 0 },
    mentefacto: empty(concept),
    recent: [],
    retries: 0,
    lastIssue: "none",
    nextQuestion: null,
    questions: { asked: 0, testing: 0 },
    moveLog: [],
    result: null,
    createdAt: "2026-10-20T00:00:00.000Z",
  };
}

function masteryAt(levels: Partial<Record<MoveId, 1 | 2 | 3 | 4 | 5>> | 1 | 2 | 3 | 4 | 5): Mastery {
  return {
    moves: MOVE_ORDER.map((move) => ({
      move,
      level: typeof levels === "number" ? levels : (levels[move] ?? 1),
      unassistedSuccesses: 0,
    })),
  };
}

/** A fake callAgent that answers from a script, in order (an Error in the script is thrown), and fails
 * loudly on any other call. Calls are recorded in the order they start, so two calls made at once
 * appear in the order advance starts them. */
function scripted(script: [AgentName, unknown][]) {
  const calls: AgentName[] = [];
  const call: CallAgent = async (agent) => {
    const next = script[calls.length];
    calls.push(agent);
    if (!next) throw new Error(`unexpected call ${calls.length}: ${agent}`);
    if (next[0] !== agent) throw new Error(`call ${calls.length}: expected ${next[0]}, got ${agent}`);
    if (next[1] instanceof Error) throw next[1];
    return next[1];
  };
  return { call, calls, finished: () => calls.length === script.length };
}

/** Runs inputs through advance, checking every step is a valid Turn and Session with no error. */
async function play(session: Session, mastery: Mastery, inputs: TurnInput[], call: CallAgent) {
  const turns: Turn[] = [];
  let state = { session, mastery };
  for (const input of inputs) {
    const next = await advance(state, input, call);
    expect(next.turn.error, `turn ${next.turn.turn}`).toBeNull();
    Turn.parse(next.turn);
    Session.parse(next.session);
    turns.push(next.turn);
    state = { session: next.session, mastery: next.mastery };
  }
  return { turns, ...state };
}

const evaluation = (verdict: "correct" | "partial" | "incorrect", quality: 0 | 1 | 2, accepted: ReturnType<typeof item>[], feedback: string, issue = "none") => ({
  verdict,
  quality,
  accepted,
  issue,
  reason: "scripted",
  feedback,
});
const hintOutput = (step: string, text: string) => ({ step, text, revealed: null });

describe("session 1 from the brief (democracy)", async () => {
  const { call, calls, finished } = scripted([
    ["questioner", { question: "Democracy is one example of a bigger group. What group?", scaffold: null }],
    ["evaluator", evaluation("incorrect", 0, [], "Not quite: a law is one rule, and democracy isn't a rule. So what kind of thing is it?", "not_a_class")],
    ["questioner", { question: "What looks close to democracy but isn't one?", scaffold: null }],
    ["hint_giver", hintOutput("hint", "Think of monarchy and dictatorship. What are all three examples of?")],
    ["evaluator", evaluation("correct", 2, [item("form of government")], "Yes: monarchy, dictatorship and democracy are all forms of government.")],
    ["evaluator", evaluation("partial", 1, [item("dictatorship")], "Dictatorship is close, and it isn't a democracy.")],
    ["questioner", { question: "What does a country need to count as a democracy?", scaffold: null }],
    ["evaluator", evaluation("correct", 2, [item("dictatorship", "who holds the power")], "Yes: in a dictatorship one person or group holds the power.")],
    ["evaluator", evaluation("partial", 1, [], "Elections are part of it, but not enough on their own. What else does a country need?")],
    ["questioner", { question: "What kinds of democracy are there?", scaffold: null }],
    ["hint_giver", hintOutput("hint", "North Korea holds elections. Is it a democracy? What's missing?")],
    ["evaluator", evaluation("correct", 2, [item("free elections"), item("rights"), item("more than one party")], "Yes: free elections, rights and more than one party.")],
    ["evaluator", evaluation("partial", 1, [item("direct democracy")], "Direct democracy is one type, where people vote on laws themselves. Is that the only way it can work?")],
    ["evaluator", evaluation("correct", 2, [item("direct democracy"), item("representative democracy")], "Yes: direct and representative democracy.")],
    ["coach", { message: "You found the bigger group and a real exclusion. 'What it needs' is next.", nextFocus: "isoordinate" }],
  ]);

  const inputs: TurnInput[] = [
    { action: "start" },
    { prediction: 7 },
    { text: "When people vote." },
    { action: "continue" },
    { text: "A law?" },
    { action: "help" },
    { text: "Forms of government." },
    { text: "Dictatorship." },
    { text: "Who holds the power." },
    { text: "Elections." },
    { action: "help" },
    { text: "Free elections, rights, other parties." },
    { text: "Direct?" },
    { text: "Direct and representative." },
  ];
  const { turns, session, mastery } = await play(newSession("democracy"), masteryAt(1), inputs, call);

  it("calls the same agents in the same order, the next question alongside each move's first evaluation", () => {
    expect(finished()).toBe(true);
    expect(calls).toEqual([
      "questioner", "evaluator", "questioner", "hint_giver", "evaluator", "evaluator", "questioner", "evaluator",
      "evaluator", "questioner", "hint_giver", "evaluator", "evaluator", "evaluator", "coach",
    ]);
  });

  it("ends with a prediction of 7, a score of 5/8 and a gap of +2", () => {
    const result = turns.at(-1)!.result!;
    expect(result.predictedScore).toBe(7);
    expect(result.score).toBe(5);
    expect(result.calibrationGap).toBe(2);
    expect(result.hintsUsed).toBe(2);
    expect(result.rubric.map((r) => r.points)).toEqual([1, 2, 1, 1]);
  });

  it("a wrong answer gets the evaluator's feedback only; the Help after it goes on from the nudge to 'hint'", () => {
    expect(turns[4]!.messages.map((m) => m.kind)).toEqual(["feedback"]);
    expect(turns[4]!.progress.hintsUsed).toBe(0);
    expect(turns[5]!.messages[0]!.hintStep).toBe("hint");
    expect(turns[5]!.progress.hintsUsed).toBe(1);
  });

  it("produces the Turns in fixtures/session-1.json", () => {
    const fixture = JSON.parse(read("../fixtures/session-1.json")) as { input: unknown; turn: Turn }[];
    for (const step of fixture) {
      expect(turns.find((t) => t.turn === step.turn.turn), `turn ${step.turn.turn}`).toEqual(step.turn);
    }
  });

  it("updates mastery: up a level with at most one retry or Help, unassisted only with neither", () => {
    expect(mastery.moves).toEqual([
      { move: "supraordinate", level: 2, unassistedSuccesses: 0 },
      { move: "exclusion", level: 3, unassistedSuccesses: 1 },
      { move: "isoordinate", level: 2, unassistedSuccesses: 0 },
      { move: "infraordinate", level: 3, unassistedSuccesses: 0 },
    ]);
    expect(session.moveLog.map(({ hints, retries }) => [hints, retries])).toEqual([[1, 1], [0, 0], [1, 1], [0, 1]]);
    expect(session.phase).toBe("result");
  });
});

describe("whole map (decision 16, level-5 decision)", () => {
  const coach = ["coach", { message: "Good map.", nextFocus: null }] as [AgentName, unknown];

  it("a test session goes from the prediction straight to the map, counts questions, and never changes mastery", async () => {
    const { call } = scripted([
      ["fact_desk", { kind: "redirect", answer: "It's an economic phenomenon, hope that helps", questionType: "asks_for_structure" }],
      ["fact_desk", { kind: "fact", answer: "Not by itself: that's one product.", questionType: "breaking_case" }],
      ["hint_giver", hintOutput("nudge", "What kind of thing happens to prices here?")],
      ["evaluator_full", {
        rubric: [
          { move: "supraordinate", quality: 2, feedback: "Close group." },
          { move: "exclusion", quality: 2, feedback: "Real exclusion." },
          { move: "isoordinate", quality: 1, feedback: "One is missing." },
          { move: "infraordinate", quality: 2, feedback: "Two types by one criterion." },
        ],
      }],
      coach,
    ]);
    const start = masteryAt(1);
    const { turns, mastery } = await play(newSession("inflation", "test"), start, [
      { action: "start" },
      { prediction: 6 },
      { question: "What's the bigger group?" },
      { question: "If gas goes up, is that inflation?" },
      { action: "help" },
      { mentefacto: { ...empty("inflation"), supraordinate: item("rise in prices") } },
    ], call);

    expect(turns[1]!.expects).toBe("map");
    expect(turns[2]!.messages[0]).toEqual({ agent: "fact_desk", kind: "redirect", text: FACT_DESK_REDIRECT });
    expect(turns[4]!.messages[0]!.hintStep).toBe("nudge");
    const result = turns.at(-1)!.result!;
    expect(result.questions).toEqual({ asked: 2, testing: 1 });
    expect(result.rubric.map((r) => r.points)).toEqual([1, 2, 1, 2]); // the hinted move is capped at 1
    expect(result.calibrationGap).toBe(0);
    expect(mastery).toEqual(start);
  });

  it("a learner at level 5 on every move gets the map, with no attempt and no example", async () => {
    const { turns } = await play(newSession("inflation"), masteryAt(5), [{ action: "start" }, { prediction: 7 }], scripted([]).call);
    expect(turns[1]!.messages[0]!.text).toBe("Build the mentefacto for inflation. Ask me any facts you need.");
    expect(turns[1]!.level).toBe(5);
  });
});

describe("mixed levels (decision 16)", () => {
  it("a level-5 move outside the whole map runs like level 4: fixed text, no hint until Help", async () => {
    const { call, calls } = scripted([
      ["evaluator", evaluation("incorrect", 0, [], "A law is a rule.", "not_a_class")],
      ["hint_giver", hintOutput("nudge", "Is it one rule, or a way of running a country?")],
    ]);
    const { turns } = await play(newSession("democracy"), masteryAt({ supraordinate: 5, exclusion: 5, isoordinate: 4, infraordinate: 5 }), [
      { action: "start" },
      { prediction: 8 },
      { text: "Rule by the people." },
      { text: "A law." },
      { action: "help" },
    ], call);
    expect(turns[2]!.messages[0]!.text).toBe("Now find the supraordinate class of democracy.");
    expect(turns[2]!.level).toBe(4);
    expect(turns[3]!.messages.map((m) => m.kind)).toEqual(["feedback"]);
    // No free nudge at level 4, so the first Help is the nudge. The next move is level 4 too: no question to ask ahead.
    expect(turns[4]!.messages[0]!.hintStep).toBe("nudge");
    expect(calls).toEqual(["evaluator", "hint_giver"]);
  });
});

describe("the next move's question, asked ahead", () => {
  it("a failed question asked ahead is asked again when the move starts", async () => {
    const { call, calls } = scripted([
      ["questioner", { question: "What group?", scaffold: null }],
      ["evaluator", evaluation("correct", 2, [item("form of government")], "Yes.")],
      ["questioner", new Error("overloaded")],
      ["questioner", { question: "What isn't it?", scaffold: null }],
    ]);
    const { turns } = await play(newSession("democracy"), masteryAt(2), [
      { action: "start" }, { prediction: 5 }, { text: "Rule by the people." }, { text: "A form of government." },
    ], call);
    expect(turns.at(-1)!.messages.at(-1)!.text).toBe("What isn't it?");
    expect(calls).toEqual(["questioner", "evaluator", "questioner", "questioner"]);
  });

  it("a failed evaluator leaves the session as it was, even when the question ahead arrived", async () => {
    const before = await play(newSession("democracy"), masteryAt(2), [
      { action: "start" }, { prediction: 5 }, { text: "Rule by the people." },
    ], scripted([["questioner", { question: "What group?", scaffold: null }]]).call);
    const { call } = scripted([
      ["evaluator", Object.assign(new Error("overloaded"), { status: 529 })],
      ["questioner", { question: "What isn't it?", scaffold: null }],
    ]);
    const out = await advance({ session: before.session, mastery: before.mastery }, { text: "A law." }, call);
    expect(out.turn.error).toEqual({ code: "agent_failed", retryable: true });
    expect(out.session).toEqual(before.session);
    expect(out.session.nextQuestion).toBeNull();
  });
});

describe("failures and limits", () => {
  it("an agent failure leaves the session as it was and returns a retryable error Turn", async () => {
    const started = await play(newSession("democracy"), masteryAt(2), [{ action: "start" }, { prediction: 5 }], scripted([]).call);
    const failing: CallAgent = async () => {
      throw Object.assign(new Error("overloaded"), { status: 529 });
    };
    const out = await advance({ session: started.session, mastery: started.mastery }, { text: "Rule by the people." }, failing);
    expect(out.session).toEqual(started.session);
    expect(out.turn.error).toEqual({ code: "agent_failed", retryable: true });
    expect(out.turn.turn).toBe(started.session.turn);
  });

  it("four Helps walk the ladder to reveal: the item goes on the map with 0 points and the next move starts", async () => {
    const reveal = { step: "reveal", text: "It's a form of government.", revealed: item("form of government") };
    const { call } = scripted([
      ["questioner", { question: "What group?", scaffold: null }],
      ["hint_giver", hintOutput("nudge", "a")],
      ["questioner", { question: "What isn't it?", scaffold: null }],
      ["hint_giver", hintOutput("hint", "b")],
      ["hint_giver", hintOutput("partial", "c")],
      ["hint_giver", reveal],
    ]);
    const { turns, session } = await play(newSession("democracy"), masteryAt(2), [
      { action: "start" }, { prediction: 3 }, { text: "?" },
      { action: "help" }, { action: "help" }, { action: "help" }, { action: "help" },
    ], call);
    const revealTurn = turns.at(-1)!;
    expect(revealTurn.mentefacto.supraordinate).toEqual(item("form of government"));
    expect(revealTurn.move).toBe("exclusion");
    expect(revealTurn.messages.at(-1)!.text).toBe("What isn't it?");
    expect(revealTurn.progress).toEqual({ movesDone: 1, movesTotal: 4, hintsUsed: 4 });
    expect(session.moveLog[0]!.points).toBe(0);
  });

  it("at level 2 a wrong answer's nudge is the first step, so three Helps reveal", async () => {
    const reveal = { step: "reveal", text: "It's a form of government.", revealed: item("form of government") };
    const { call } = scripted([
      ["questioner", { question: "What group?", scaffold: null }],
      ["evaluator", evaluation("incorrect", 0, [], "A law is one rule. So what kind of thing is it?", "not_a_class")],
      ["questioner", { question: "What isn't it?", scaffold: null }],
      ["hint_giver", hintOutput("hint", "b")],
      ["hint_giver", hintOutput("partial", "c")],
      ["hint_giver", reveal],
    ]);
    const { turns } = await play(newSession("democracy"), masteryAt(2), [
      { action: "start" }, { prediction: 3 }, { text: "?" }, { text: "A law." },
      { action: "help" }, { action: "help" }, { action: "help" },
    ], call);
    expect(turns.slice(-3).map((t) => t.messages[0]!.hintStep)).toEqual(["hint", "partial", "reveal"]);
    expect(turns.at(-1)!.move).toBe("exclusion");
  });

  it("a coach failure still ends the session, with fixed text built from the numbers", async () => {
    const { call } = scripted([
      ["evaluator_full", {
        rubric: MOVE_ORDER.map((move) => ({ move, quality: move === "isoordinate" ? 0 : 2, feedback: "ok" })),
      }],
      // no coach entry: the scripted callAgent throws when the coach is called
    ]);
    const { turns } = await play(newSession("inflation", "test"), masteryAt(1), [
      { action: "start" }, { prediction: 8 }, { mentefacto: empty("inflation") },
    ], call);
    const result = turns.at(-1)!.result!;
    expect(result.score).toBe(6);
    expect(result.coach).toEqual({ message: 'You scored 6 of 8 and used 0 hints. Next, work on "What it needs".', nextFocus: "isoordinate" });
    expect(turns.at(-1)!.error).toBeNull();
  });

  it("refuses input that doesn't fit the phase", async () => {
    await expect(advance({ session: newSession("democracy"), mastery: masteryAt(2) }, { text: "hi" }, scripted([]).call)).rejects.toBeInstanceOf(
      UnexpectedInput,
    );
  });
});

describe("rules", () => {
  it("points: quality on the first try, capped at 1 after a retry or a Help, 0 when revealed", () => {
    expect(rules.pointsFor(2, 0, 0)).toBe(2);
    expect(rules.pointsFor(2, 0, 1)).toBe(1);
    expect(rules.pointsFor(2, 1, 0)).toBe(1);
    expect(rules.pointsFor(1, 2, 3)).toBe(1);
    expect(rules.pointsFor(2, 4, 0)).toBe(0);
  });

  it("levels: up one with at most one retry or Help, never past 5", () => {
    expect(rules.levelAfter(2, 1)).toBe(3);
    expect(rules.levelAfter(2, 2)).toBe(2);
    expect(rules.levelAfter(5, 0)).toBe(5);
  });

  it("the ladder goes on from the furthest step shown; the feedback nudges at levels 2 and 3 only", () => {
    expect(rules.hintStepAfter(null)).toBe("nudge");
    expect(rules.hintStepAfter("nudge")).toBe("hint");
    expect(rules.hintStepAfter("reveal")).toBe("reveal");
    expect([2, 3, 4, 5].map((l) => rules.feedbackNudges(l as 2 | 3 | 4 | 5))).toEqual([true, true, false, false]);
  });

  it("the worked example module and the app's fixture are the same object", () => {
    expect(WORKED_EXAMPLE).toEqual(WorkedExample.parse(JSON.parse(read("../fixtures/worked-example.json"))));
  });
});
