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

  it("is the session the orchestrator produces: CORS, prediction made, waiting at the whole map", async () => {
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
    expect(seed.session.lastTurn?.messages[0]?.text).toBe("Build the mentefacto for CORS. Ask me any facts you need.");
  });

  it("the demo script produces the expected numbers: 6/8, gap +1, no hints, 3 questions / 2 testing", async () => {
    const answers: Record<string, unknown> = {
      "If I call my API with curl, does CORS still block it?": { kind: "fact", answer: "No.", questionType: "breaking_case" },
      "Does the server have to send a header for the browser to allow it?": { kind: "fact", answer: "Yes.", questionType: "what_it_needs" },
      "Is CORS a kind of security feature?": { kind: "redirect", answer: "x", questionType: "asks_for_structure" },
    };
    const call: CallAgent = async (agent, input) => {
      if (agent === "fact_desk") return answers[(input as { question: string }).question];
      if (agent === "evaluator_full") {
        // 1 point each: "CORS is a kind of security feature" is true, but a closer group fits in between, and
        // the two types are split by different criteria. The real evaluator agrees, see eval:whole-map.
        const flawed = (move: string) => move === "supraordinate" || move === "infraordinate";
        return { rubric: MOVE_ORDER.map((move) => ({ move, quality: flawed(move) ? 1 : 2, feedback: "..." })) };
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
