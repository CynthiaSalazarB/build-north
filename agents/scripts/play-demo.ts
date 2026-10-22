// Rehearses the demo's level-5 part against Claude: the presenter's questions go to the real fact desk,
// and the finished map goes to the real whole-map evaluator (#36) in one call, as `advance` sends it. The
// seed expects 6/8 with no hints: "security feature" is too broad for CORS, and the two types mix
// criteria.
import { readFileSync } from "node:fs";
import { AGENTS, DemoSeed, MOVE_LABEL, MOVE_ORDER } from "../src/index.ts";
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
const full = await runAgent(AGENTS.evaluator_full, { concept, material: null, mentefacto: map });
runs.push(full);
let score = 0;
console.log(`\nMap, scored by the whole-map evaluator (${full.ms} ms):`);
for (const move of MOVE_ORDER) {
  // read the way advance reads it: a move with no row gets 0, and with no hints its quality is its points
  const row = full.output.rubric.find((r) => r.move === move);
  score += row?.quality ?? 0;
  console.log(`  ${MOVE_LABEL[move]}: ${row ? `${row.quality} · ${row.feedback}` : "no row (0)"}`);
}
console.log(`\nScore: ${score}/8 (seed expects ${seed.script.expected.score}) · ${dollars(runs)}`);
process.exitCode = score === seed.script.expected.score ? 0 : 1;
