// #32 done when: the seed file parses with the Zod schemas and matches the demo script.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { advance, type CallAgent, DemoSeed, MOVE_ORDER, type Session } from "../src/index.ts";

const seed = DemoSeed.parse(JSON.parse(readFileSync(new URL("../fixtures/demo-seed.json", import.meta.url), "utf8")));
const noAgents: CallAgent = async (agent) => {
  throw new Error(`no ${agent} call expected`);
};

describe("demo seed", () => {
  it("puts the demo user at level 5 on every move", () => {
    expect(seed.mastery.moves.map((m) => m.move)).toEqual([...MOVE_ORDER]);
    expect(seed.mastery.moves.every((m) => m.level === 5)).toBe(true);
  });

  it("is the session the orchestrator produces: inflation, prediction made, waiting at the whole map", async () => {
    const fresh: Session = {
      ...seed.session,
      turn: 0,
      lastTurn: null,
      predictedScore: null,
      phase: "predict",
    };
    let state = { session: fresh, mastery: seed.mastery };
    for (const input of [{ action: "start" as const }, { prediction: 7 }]) {
      const out = await advance(state, input, noAgents);
      state = { session: out.session, mastery: out.mastery };
    }
    expect(state.session).toEqual(seed.session);
    expect(seed.session.lastTurn?.expects).toBe("map");
    expect(seed.session.lastTurn?.messages[0]?.text).toBe("Build the mentefacto for inflation. Ask me any facts you need.");
  });

  it("the demo script produces the expected numbers: 7/8, gap 0, no hints, 4 questions / 3 testing", async () => {
    const answers: Record<string, unknown> = {
      "Is it when one thing gets more expensive, or everything?": { kind: "fact", answer: "Everything, broadly.", questionType: "contrast" },
      "If gas goes up, is that inflation?": { kind: "fact", answer: "Not by itself.", questionType: "breaking_case" },
      "Does it have to last a long time to count?": { kind: "fact", answer: "Mostly yes.", questionType: "what_it_needs" },
      "What is the bigger group that inflation belongs to?": { kind: "redirect", answer: "x", questionType: "asks_for_structure" },
    };
    const call: CallAgent = async (agent, input) => {
      if (agent === "fact_desk") return answers[(input as { question: string }).question];
      if (agent === "evaluator_full") {
        // "an economic change" is defensible but too broad: 1 point (the real evaluator agreed in a probe).
        return { rubric: MOVE_ORDER.map((move) => ({ move, quality: move === "supraordinate" ? 1 : 2, feedback: "..." })) };
      }
      if (agent === "coach") return { message: "Almost all alone.", nextFocus: "supraordinate" };
      throw new Error(`unexpected ${agent}`);
    };
    let state = { session: seed.session, mastery: seed.mastery };
    let last;
    for (const input of [...seed.script.questions.map((question) => ({ question })), { mentefacto: seed.script.map }]) {
      last = await advance(state, input, call);
      state = { session: last.session, mastery: last.mastery };
    }
    const result = last!.turn.result!;
    expect({
      score: result.score,
      calibrationGap: result.calibrationGap,
      hintsUsed: result.hintsUsed,
      questions: result.questions,
    }).toEqual(seed.script.expected);
  });
});
