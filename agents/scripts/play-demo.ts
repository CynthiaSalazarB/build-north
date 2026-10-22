// Rehearses the demo's level-5 part against Claude: the presenter's questions go to the real fact desk,
// the finished map goes to the real whole-map evaluator (#36) in one call, and the result to the real
// coach (#44), as `advance` sends them. The seed expects 6/8 with no hints: "security feature" is too
// broad for CORS, and the two types mix criteria.
import { readFileSync } from "node:fs";
import { AGENTS, type CoachInput, DemoSeed, MOVE_LABEL, MOVE_ORDER, rules, TESTING_QUESTION_TYPES } from "../src/index.ts";
import { type AgentRun, dollars, MODEL, runAgent } from "./run-agent.ts";

const seed = DemoSeed.parse(JSON.parse(readFileSync(new URL("../fixtures/demo-seed.json", import.meta.url), "utf8")));
const { concept } = seed.session;
const runs: AgentRun<unknown>[] = [];
// counted the way advance counts them: every question, and the ones that test the concept
const questions = { asked: 0, testing: 0 };
console.log(`Demo rehearsal on ${MODEL}: ${concept}, level 5\n`);

for (const question of seed.script.questions) {
  const run = await runAgent(AGENTS.fact_desk, { concept, material: null, mentefacto: seed.session.mentefacto, question });
  runs.push(run);
  const o = run.output;
  questions.asked += 1;
  if (TESTING_QUESTION_TYPES.includes(o.questionType)) questions.testing += 1;
  console.log(`learner: ${question}\n  fact desk (${o.kind}, ${o.questionType}, ${run.ms} ms): ${o.kind === "redirect" ? "[fixed redirect text]" : o.answer}`);
}

const map = seed.script.map;
const full = await runAgent(AGENTS.evaluator_full, { concept, material: null, mentefacto: map });
runs.push(full);
let score = 0;
const rubric: CoachInput["result"]["rubric"] = [];
console.log(`\nMap, scored by the whole-map evaluator (${full.ms} ms):`);
for (const move of MOVE_ORDER) {
  // read the way advance reads it: a move with no row gets 0, and with no hints its quality is its points
  const row = full.output.rubric.find((r) => r.move === move);
  score += row?.quality ?? 0;
  rubric.push({ move, points: row?.quality ?? 0 });
  console.log(`  ${MOVE_LABEL[move]}: ${row ? `${row.quality} · ${row.feedback}` : "no row (0)"}`);
}

// The coach gets the map and the result the way advance builds it, every number computed here. Level 5
// is the top, so the map changes no level, and the presenter taps no Help.
const predictedScore = seed.session.predictedScore ?? 0;
const result: CoachInput["result"] = {
  predictedScore,
  score,
  maxScore: 8,
  calibrationGap: rules.calibrationGap(predictedScore, score),
  hintsUsed: 0,
  rubric,
  masteryChanges: [],
  questions,
};
const coach = await runAgent(AGENTS.coach, { concept, mentefacto: map, result });
runs.push(coach);
console.log(`\nCoach (${coach.ms} ms, next: ${coach.output.nextFocus ?? "none"}): ${coach.output.message}`);
const gap = `${result.calibrationGap > 0 ? "+" : ""}${result.calibrationGap}`;
console.log(
  `\nScore: ${score}/8 (seed expects ${seed.script.expected.score}), gap ${gap}, ${questions.asked} questions (${questions.testing} testing) · ${dollars(runs)}`,
);
process.exitCode = score === seed.script.expected.score ? 0 : 1;
