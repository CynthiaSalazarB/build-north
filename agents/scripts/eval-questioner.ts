// A check on the Questioner (#2): at level 2 the question names no move and gives no answer away; at
// level 3 it brings a scaffold. Democracy's bigger group is "form of government" or "political system".
import { AGENTS, type AgentContext, type MoveId } from "../src/index.ts";
import { dollars, MODEL, runAgent } from "./run-agent.ts";

const JARGON = /supraordinate|isoordinate|infraordinate|exclusion|mentefacto/i;
const ANSWER = /government|political system/i;

const ctx = (move: MoveId, level: 2 | 3): AgentContext => ({
  concept: "democracy",
  material: null,
  move,
  level,
  mentefacto: { concept: "democracy", supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] },
  recent: [],
});

const cases = [
  { move: "supraordinate" as const, level: 2 as const },
  { move: "exclusion" as const, level: 2 as const },
  { move: "isoordinate" as const, level: 2 as const },
  { move: "infraordinate" as const, level: 2 as const },
  { move: "supraordinate" as const, level: 3 as const },
];
const runs = await Promise.all(cases.map((c) => runAgent(AGENTS.questioner, ctx(c.move, c.level))));
let failures = 0;
console.log(`Questioner on ${MODEL}, democracy\n`);
cases.forEach((c, i) => {
  const { output: o, ms } = runs[i]!;
  const problems = [
    JARGON.test(o.question) && "names a move",
    c.move === "supraordinate" && ANSWER.test(o.question) && "gives the answer away",
    c.level === 2 && o.scaffold !== null && "scaffold at level 2",
    c.level === 3 && o.scaffold === null && "no scaffold at level 3",
    c.level === 3 && o.scaffold && o.scaffold.given.some((g) => ANSWER.test(g)) && "scaffold gives the answer away",
  ].filter(Boolean);
  if (problems.length) failures++;
  console.log(`${problems.length ? "✘" : "✔"} ${c.move} L${c.level} (${ms} ms): ${o.question}`);
  if (o.scaffold) console.log(`    scaffold: given ${JSON.stringify(o.scaffold.given)}, blanks ${o.scaffold.blanks}`);
  if (problems.length) console.log(`    problems: ${problems.join(", ")}`);
});
console.log(`\n${cases.length - failures}/${cases.length} clean · ${dollars(runs)}`);
process.exitCode = failures ? 1 : 0;
