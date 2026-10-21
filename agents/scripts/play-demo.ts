// Rehearses the demo's level-5 part against Claude: the presenter's questions go to the real fact desk,
// and each part of the map is scored by the real per-move evaluator, a stand-in until the whole-map
// evaluator exists (#36). The seed expects 6/8 with no hints: "security feature" is too broad for CORS,
// and the two types mix criteria.
import { readFileSync } from "node:fs";
import { AGENTS, DemoSeed, MOVE_LABEL, MOVE_ORDER, type Quality } from "../src/index.ts";
import { type AgentRun, dollars, MODEL, runAgent } from "./run-agent.ts";

const seed = DemoSeed.parse(JSON.parse(readFileSync(new URL("../fixtures/demo-seed.json", import.meta.url), "utf8")));
const { concept } = seed.session;
const runs: AgentRun<unknown>[] = [];
console.log(`Demo rehearsal on ${MODEL}: ${concept}, level 5\n`);

for (const question of seed.script.questions) {
  const run = await runAgent(AGENTS.fact_desk, { concept, material: null, mentefacto: seed.session.mentefacto, question });
  runs.push(run);
  const o = run.output;
  console.log(`learner: ${question}\n  fact desk (${o.kind}, ${o.questionType}, ${run.ms} ms): ${o.kind === "redirect" ? "[fixed redirect text]" : o.answer}`);
}

const map = seed.script.map;
let score = 0;
console.log("\nMap, scored part by part:");
for (const move of MOVE_ORDER) {
  const items = move === "supraordinate" ? (map.supraordinate ? [map.supraordinate] : []) : map[move];
  const answer = items.map((i) => (i.note ? `${i.value}, because ${i.note}` : i.value)).join("; ");
  const run = await runAgent(AGENTS.evaluator, {
    concept,
    material: null,
    move,
    level: 5,
    mentefacto: { ...map, [move]: move === "supraordinate" ? null : [] },
    recent: [],
    answer,
  });
  runs.push(run);
  const quality: Quality = run.output.quality;
  score += quality;
  console.log(`  ${MOVE_LABEL[move]}: "${answer}" → ${quality} (${run.output.verdict}) · ${run.output.feedback}`);
}
console.log(`\nScore: ${score}/8 (seed expects ${seed.script.expected.score}) · ${dollars(runs)}`);
process.exitCode = score === seed.script.expected.score ? 0 : 1;
