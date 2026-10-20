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

/** A fake callAgent that answers from a script, in order, and fails loudly on any other call. */
function scripted(script: [AgentName, unknown][]) {
  const calls: AgentName[] = [];
  const call: CallAgent = async (agent) => {
    const next = script[calls.length];
    calls.push(agent);
    if (!next) throw new Error(`unexpected call ${calls.length}: ${agent}`);
    if (next[0] !== agent) throw new Error(`call ${calls.length}: expected ${next[0]}, got ${agent}`);
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
    ["evaluator", evaluation("incorrect", 0, [], "Not quite. A law is a rule, and democracy isn't a rule.", "not_a_class")],
    ["hint_giver", hintOutput("nudge", "Think of monarchy and dictatorship. What are all three examples of?")],
    ["evaluator", evaluation("correct", 2, [item("form of government")], "Yes: monarchy, dictatorship and democracy are all forms of government.")],
    ["questioner", { question: "What looks close to democracy but isn't one?", scaffold: null }],
    ["evaluator", evaluation("partial", 1, [item("dictatorship")], "Dictatorship is close, and it isn't a democracy.")],
    ["evaluator", evaluation("correct", 2, [item("dictatorship", "who holds the power")], "Yes: in a dictatorship one person or group holds the power.")],
    ["questioner", { question: "What does a country need to count as a democracy?", scaffold: null }],
    ["evaluator", evaluation("partial", 1, [], "Elections are part of it, but not enough on their own.")],
    ["hint_giver", hintOutput("nudge", "North Korea holds elections. Is it a democracy? What's missing?")],
    ["evaluator", evaluation("partial", 1, [item("free elections")], "Free elections, yes. What else does it need?")],
    ["hint_giver", hintOutput("hint", "Think about what people need to be able to say and choose, before and after they vote.")],
    ["evaluator", evaluation("correct", 2, [item("rights"), item("more than one party")], "Yes: free elections, rights and more than one party.")],
    ["questioner", { question: "What kinds of democracy are there?", scaffold: null }],
    ["evaluator", evaluation("partial", 1, [item("direct democracy")], "Direct democracy is one type.")],
    ["hint_giver", hintOutput("nudge", "In a big country, can everyone vote on every law? How else could it work?")],
    ["evaluator", evaluation("correct", 2, [item("direct democracy"), item("representative democracy")], "Yes: direct and representative democracy.")],
    ["coach", { message: "You found the bigger group and a real exclusion. 'What it needs' is next.", nextFocus: "isoordinate" }],
  ]);

  const inputs: TurnInput[] = [
    { action: "start" },
    { prediction: 7 },
    { text: "When people vote." },
    { action: "continue" },
    { text: "A law?" },
    { text: "Forms of government." },
    { text: "Dictatorship." },
    { text: "Who holds the power." },
    { text: "Elections." },
    { text: "Free elections." },
    { text: "Rights, and more than one party." },
    { text: "Direct?" },
    { text: "Direct and representative." },
  ];
  const { turns, session, mastery } = await play(newSession("democracy"), masteryAt(1), inputs, call);

  it("calls the same agents in the same order", () => {
    expect(finished()).toBe(true);
    expect(calls).toEqual([
      "questioner", "evaluator", "hint_giver", "evaluator", "questioner", "evaluator", "evaluator", "questioner",
      "evaluator", "hint_giver", "evaluator", "hint_giver", "evaluator", "questioner", "evaluator", "hint_giver",
      "evaluator", "coach",
    ]);
  });

  it("ends with a prediction of 7, a score of 5/8 and a gap of +2", () => {
    const result = turns.at(-1)!.result!;
    expect(result.predictedScore).toBe(7);
    expect(result.score).toBe(5);
    expect(result.calibrationGap).toBe(2);
    expect(result.hintsUsed).toBe(4);
    expect(result.rubric.map((r) => r.points)).toEqual([1, 2, 1, 1]);
  });

  it("produces the Turns in fixtures/session-1.json", () => {
    const fixture = JSON.parse(read("../fixtures/session-1.json")) as { input: unknown; turn: Turn }[];
    for (const step of fixture) {
      expect(turns.find((t) => t.turn === step.turn.turn), `turn ${step.turn.turn}`).toEqual(step.turn);
    }
  });

  it("updates mastery: up a level with 1 hint or fewer, unassisted only with none", () => {
    expect(mastery.moves).toEqual([
      { move: "supraordinate", level: 3, unassistedSuccesses: 0 },
      { move: "exclusion", level: 3, unassistedSuccesses: 1 },
      { move: "isoordinate", level: 2, unassistedSuccesses: 0 },
      { move: "infraordinate", level: 3, unassistedSuccesses: 0 },
    ]);
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
    expect(turns[4]!.messages[0]!.kind).toBe("hint");
    expect(calls).toEqual(["evaluator", "hint_giver"]);
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
      ["hint_giver", hintOutput("hint", "b")],
      ["hint_giver", hintOutput("partial", "c")],
      ["hint_giver", reveal],
      ["questioner", { question: "What isn't it?", scaffold: null }],
    ]);
    const { turns } = await play(newSession("democracy"), masteryAt(2), [
      { action: "start" }, { prediction: 3 }, { text: "?" },
      { action: "help" }, { action: "help" }, { action: "help" }, { action: "help" },
    ], call);
    const revealTurn = turns.at(-1)!;
    expect(revealTurn.mentefacto.supraordinate).toEqual(item("form of government"));
    expect(revealTurn.move).toBe("exclusion");
    expect(revealTurn.progress).toEqual({ movesDone: 1, movesTotal: 4, hintsUsed: 4 });
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
  it("points: quality, capped at 1 with hints, 0 when revealed", () => {
    expect(rules.pointsFor(2, 0)).toBe(2);
    expect(rules.pointsFor(2, 1)).toBe(1);
    expect(rules.pointsFor(1, 2)).toBe(1);
    expect(rules.pointsFor(2, 4)).toBe(0);
  });

  it("levels: up one with 1 hint or fewer, never past 5", () => {
    expect(rules.levelAfter(2, 1)).toBe(3);
    expect(rules.levelAfter(2, 2)).toBe(2);
    expect(rules.levelAfter(5, 0)).toBe(5);
  });

  it("the worked example module and the app's fixture are the same object", () => {
    expect(WORKED_EXAMPLE).toEqual(WorkedExample.parse(JSON.parse(read("../fixtures/worked-example.json"))));
  });
});
