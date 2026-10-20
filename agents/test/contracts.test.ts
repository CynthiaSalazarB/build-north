// Done when (#15): every JSON example in CONTRACTS.md and the 8 fixture Turns parse.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  CoachOutput,
  CreateSessionBody,
  EvaluatorOutput,
  FactDeskOutput,
  HintGiverOutput,
  MOVE_LABEL,
  MOVE_ORDER,
  Mastery,
  QuestionerOutput,
  Result,
  Turn,
  TurnBody,
  WholeMapEvaluatorOutput,
  WorkedExample,
} from "../src/index.js";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

// Each JSON example in the markdown is matched to its schema by a key only that shape has.
function schemaFor(example: Record<string, unknown>): [string, z.ZodType] {
  if ("sessionId" in example) return ["Turn", Turn];
  if ("predictedScore" in example) return ["Result", Result];
  if ("moves" in example) return ["Mastery", Mastery];
  if ("verdict" in example) return ["EvaluatorOutput", EvaluatorOutput];
  if ("rubric" in example) return ["WholeMapEvaluatorOutput", WholeMapEvaluatorOutput];
  if ("questionType" in example) return ["FactDeskOutput", FactDeskOutput];
  if ("revealed" in example) return ["HintGiverOutput", HintGiverOutput];
  if ("exampleConcept" in example) return ["WorkedExample", WorkedExample];
  if ("question" in example) return ["QuestionerOutput", QuestionerOutput];
  if ("nextFocus" in example) return ["CoachOutput", CoachOutput];
  throw new Error(`No schema matches this example: ${JSON.stringify(example).slice(0, 120)}`);
}

describe("CONTRACTS.md examples", () => {
  const blocks = [...read("../CONTRACTS.md").matchAll(/```json\r?\n([\s\S]*?)```/g)].map((m) => m[1] ?? "");

  it("has the examples it should", () => {
    expect(blocks.length).toBeGreaterThanOrEqual(10);
  });

  it.each(blocks.map((b, i) => [i, b] as const))("example %i parses against its schema", (_i, block) => {
    const example = JSON.parse(block) as Record<string, unknown>;
    const [, schema] = schemaFor(example);
    expect(() => schema.parse(example)).not.toThrow();
  });
});

describe("fixtures", () => {
  const steps = JSON.parse(read("../fixtures/session-1.json")) as { note: string; input: unknown; turn: unknown }[];

  it("session 1 has 8 Turns", () => {
    expect(steps).toHaveLength(8);
  });

  it.each(steps.map((s, i) => [i, s] as const))("step %i: input and Turn parse", (i, step) => {
    const body = i === 0 ? CreateSessionBody : TurnBody;
    expect(() => body.parse(step.input)).not.toThrow();
    expect(() => Turn.parse(step.turn)).not.toThrow();
  });

  it("each input answers the Turn before it, and turn numbers only go up", () => {
    const turns = steps.map((s) => Turn.parse(s.turn));
    for (let i = 1; i < steps.length; i++) {
      const input = TurnBody.parse(steps[i]!.input);
      expect(input.turn).toBeLessThan(turns[i]!.turn);
      expect(turns[i]!.turn).toBeGreaterThan(turns[i - 1]!.turn);
    }
  });

  it("the result's numbers follow the rules (gap = predicted − score)", () => {
    const result = Turn.parse(steps.at(-1)!.turn).result!;
    const points = result.rubric.reduce((sum, r) => sum + r.points, 0);
    expect(result.score).toBe(points);
    expect(result.calibrationGap).toBe(result.predictedScore - result.score);
  });

  it("the worked example parses and fills every move", () => {
    const example = WorkedExample.parse(JSON.parse(read("../fixtures/worked-example.json")));
    expect(new Set(example.steps.map((s) => s.move))).toEqual(new Set(MOVE_ORDER));
  });
});

describe("vocabulary", () => {
  it("every move has a plain label", () => {
    expect(Object.keys(MOVE_LABEL).sort()).toEqual([...MOVE_ORDER].sort());
  });
});
