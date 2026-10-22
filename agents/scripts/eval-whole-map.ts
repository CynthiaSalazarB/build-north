// #36 done when: the whole-map evaluator scores the demo's map as the seed expects and a blank map 0/8. The
// demo's map is the CORS map in fixtures/demo-seed.json, which replaced the brief's inflation map (P4 of the
// plan on #76). It should score 6/8: "CORS is a kind of security feature" is true, but a closer group fits
// in between (1), and its two types are split by different criteria (1).
import { readFileSync } from "node:fs";
import { AGENTS, DemoSeed, type Mentefacto, MOVE_LABEL, MOVE_ORDER } from "../src/index.ts";
import { dollars, MODEL, runAgent } from "./run-agent.ts";

const seed = DemoSeed.parse(JSON.parse(readFileSync(new URL("../fixtures/demo-seed.json", import.meta.url), "utf8")));
const { concept } = seed.session;
const blank: Mentefacto = { concept, supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] };
// quality per move, in MOVE_ORDER
const CASES = [
  { label: "the demo's map", map: seed.script.map, want: [1, 2, 2, 1] },
  { label: "a blank map", map: blank, want: [0, 0, 0, 0] },
];

const total = (qualities: number[]) => qualities.reduce((sum, q) => sum + q, 0);

const runs = await Promise.all(CASES.map((c) => runAgent(AGENTS.evaluator_full, { concept, material: null, mentefacto: c.map })));
console.log(`Whole-map evaluator on ${MODEL}, ${concept}\n`);
let right = 0;
CASES.forEach((c, i) => {
  const { output, ms } = runs[i]!;
  const rows = output.rubric;
  const inOrder = rows.length === MOVE_ORDER.length && rows.every((r, j) => r.move === MOVE_ORDER[j]);
  const ok = inOrder && rows.every((r, j) => r.quality === c.want[j]);
  if (ok) right++;
  console.log(
    `${ok ? "✔" : "✘"} ${c.label}: ${total(rows.map((r) => r.quality))}/8, want ${total(c.want)}/8 (${ms} ms)${inOrder ? "" : ", but the rubric isn't the four moves in order"}`,
  );
  for (const r of rows) console.log(`    ${MOVE_LABEL[r.move]}: ${r.quality} (want ${c.want[MOVE_ORDER.indexOf(r.move)]}) · ${r.feedback}`);
});
console.log(`\n${right}/${CASES.length} maps right · ${dollars(runs)}`);
process.exitCode = right === CASES.length ? 0 : 1;
