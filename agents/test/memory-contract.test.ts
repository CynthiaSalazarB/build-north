// The Agent Memory contract (DECISIONS.md, Oct 22): what the agents receive, what they may cite, and
// what the app shows. Done when: the fixture parses, the limits hold, and nothing existing changes shape.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  AgentContext,
  CoachOutput,
  HintGiverOutput,
  LearnerMemory,
  MEMORY_FACTS_MAX,
  MOVE_ORDER,
  MemoryFact,
  MemoryView,
  type CoachOutput as CoachOutputT,
  type MemoryFact as MemoryFactT,
  verifyCites,
} from "../src/index.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const fact: MemoryFactT = {
  id: "attr_01HZX",
  text: "Level 3 on infraordinate for CORS, since Oct 22.",
  concept: "CORS",
  move: "infraordinate",
  level: 3,
  since: "2026-10-22T18:40:05Z",
  supersedes: "attr_01HZW",
  writtenBy: "evaluator",
  sessionId: "ses_cors_1",
  turn: 9,
};

const context = {
  concept: "CORS",
  material: null,
  move: "infraordinate" as const,
  level: 3 as const,
  mentefacto: { concept: "CORS", supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] },
  recent: [],
};

describe("MemoryFact and LearnerMemory", () => {
  it("parses a level fact and a whole-map fact (no move, no level)", () => {
    expect(() => MemoryFact.parse(fact)).not.toThrow();
    const { move: _m, level: _l, supersedes: _s, turn: _t, ...gap } = fact;
    expect(() => MemoryFact.parse({ ...gap, id: "attr_gap", text: "Predicted 7, scored 4 on CORS: 3 too many." })).not.toThrow();
  });

  it("is strict: an unknown field fails", () => {
    expect(() => MemoryFact.parse({ ...fact, quote: "the learner's words" })).toThrow();
  });

  it(`holds at most ${MEMORY_FACTS_MAX} facts`, () => {
    const facts = Array.from({ length: MEMORY_FACTS_MAX }, (_, i) => ({ ...fact, id: `attr_${i}` }));
    expect(() => LearnerMemory.parse({ facts })).not.toThrow();
    expect(() => LearnerMemory.parse({ facts: [...facts, { ...fact, id: "attr_one_too_many" }] })).toThrow();
  });
});

describe("AgentContext.memory", () => {
  it("is optional, so every existing input still parses", () => {
    expect(() => AgentContext.parse(context)).not.toThrow();
  });

  it("carries the facts when present", () => {
    const parsed = AgentContext.parse({ ...context, memory: { facts: [fact] } });
    expect(parsed.memory?.facts[0]?.id).toBe("attr_01HZX");
  });
});

describe("cites on the coach and the hint giver", () => {
  it("is optional, so the CONTRACTS.md examples still parse without it", () => {
    expect(() => CoachOutput.parse({ message: "Almost all alone.", nextFocus: "supraordinate" })).not.toThrow();
    expect(() => HintGiverOutput.parse({ step: "hint", text: "Think of it.", revealed: null })).not.toThrow();
  });

  it("is a list of fact ids when present", () => {
    expect(CoachOutput.parse({ message: "m", nextFocus: null, cites: ["attr_01HZX"] }).cites).toEqual(["attr_01HZX"]);
    expect(() => HintGiverOutput.parse({ step: "hint", text: "t", revealed: null, cites: "attr_01HZX" })).toThrow();
  });
});

describe("MemoryView", () => {
  const view = MemoryView.parse(JSON.parse(read("../fixtures/memory-view.json")));

  it("the fixture parses, with one row per move in session order", () => {
    expect(view.concepts[0]?.moves.map((m) => m.move)).toEqual([...MOVE_ORDER]);
  });

  it("the current row is first and open, and a superseded row is closed when the next one starts", () => {
    const [current, previous] = view.concepts[0]!.moves[0]!.history;
    expect(current?.until).toBeNull();
    expect(previous?.until).toBe(current?.since);
    expect(view.concepts[0]!.moves[0]!.level).toBe(current?.level);
  });

  it("a move with no fact yet has level null and no history", () => {
    const last = view.concepts[0]!.moves[3]!;
    expect([last.level, last.history]).toEqual([null, []]);
  });

  it("the gap is predicted minus real, as in Result.calibrationGap", () => {
    for (const g of [view.concepts[0]!.gap.latest!, view.concepts[0]!.gap.previous!]) {
      expect(g.gap).toBe(g.predictedScore - g.score);
    }
  });

  it("a first session is an empty view", () => {
    expect(() => MemoryView.parse({ concepts: [] })).not.toThrow();
  });
});

describe("verifyCites", () => {
  const memory = { facts: [fact, { ...fact, id: "attr_gap" }] };

  it("keeps the cites of facts it was given, each once, and names the ones it dropped", () => {
    const { output, dropped } = verifyCites({ message: "m", nextFocus: null, cites: ["attr_gap", "attr_made_up", "attr_gap", "attr_01HZX"] }, memory);
    expect(output).toEqual({ message: "m", nextFocus: null, cites: ["attr_gap", "attr_01HZX"] });
    expect(dropped).toEqual(["attr_made_up"]);
  });

  it("drops every cite when memory was off, and leaves an output with no cites as it is", () => {
    expect(verifyCites({ step: "hint", text: "t", revealed: null, cites: ["attr_gap"] }, undefined)).toEqual({
      output: { step: "hint", text: "t", revealed: null, cites: [] },
      dropped: ["attr_gap"],
    });
    const bare: CoachOutputT = { message: "m", nextFocus: null };
    expect(verifyCites(bare, memory)).toEqual({ output: bare, dropped: [] });
  });
});
