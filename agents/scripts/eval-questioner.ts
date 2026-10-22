// A check on the Questioner (#2): at level 2 the question names no move and gives no answer away; at
// level 3 it brings a scaffold. Democracy's bigger group is "form of government" or "political system".
// JWT and CORS, the demo's concepts, get the same 5 questions, each with the names of its bigger group.
// Name concepts after `--` to run only those (`npm run eval:questioner -- JWT CORS`).
import { AGENTS, type AgentContext, type MoveId } from "../src/index.ts";
import { dollars, MODEL, pick, runAgent } from "./run-agent.ts";

const JARGON = /supraordinate|isoordinate|infraordinate|exclusion|mentefacto/i;
const CONCEPTS = pick([
  { concept: "democracy", answer: /government|political system/i },
  { concept: "JWT", answer: /token format|security token|signed token|credential/i },
  {
    concept: "CORS",
    answer: /security (feature|mechanism)|access[- ]control mechanism|header[- ]based mechanism|browser (security )?(polic(y|ies)|rules?|mechanisms?)/i,
  },
]);

const ctx = (concept: string, move: MoveId, level: 2 | 3): AgentContext => ({
  concept,
  material: null,
  move,
  level,
  mentefacto: { concept, supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] },
  recent: [],
});

const MOVES = [
  { move: "supraordinate" as const, level: 2 as const },
  { move: "exclusion" as const, level: 2 as const },
  { move: "isoordinate" as const, level: 2 as const },
  { move: "infraordinate" as const, level: 2 as const },
  { move: "supraordinate" as const, level: 3 as const },
];
const cases = CONCEPTS.flatMap((c) => MOVES.map((m) => ({ ...c, ...m })));
const runs = await Promise.all(cases.map((c) => runAgent(AGENTS.questioner, ctx(c.concept, c.move, c.level))));
let failures = 0;
console.log(`Questioner on ${MODEL}, ${CONCEPTS.map((c) => c.concept).join(", ")}\n`);
cases.forEach((c, i) => {
  const { output: o, ms } = runs[i]!;
  const problems = [
    JARGON.test(o.question) && "names a move",
    c.move === "supraordinate" && c.answer.test(o.question) && "gives the answer away",
    c.level === 2 && o.scaffold !== null && "scaffold at level 2",
    c.level === 3 && o.scaffold === null && "no scaffold at level 3",
    c.level === 3 && o.scaffold && o.scaffold.given.some((g) => c.answer.test(g)) && "scaffold gives the answer away",
  ].filter(Boolean);
  if (problems.length) failures++;
  console.log(`${problems.length ? "✘" : "✔"} ${c.concept} ${c.move} L${c.level} (${ms} ms): ${o.question}`);
  if (o.scaffold) console.log(`    scaffold: given ${JSON.stringify(o.scaffold.given)}, blanks ${o.scaffold.blanks}`);
  if (problems.length) console.log(`    problems: ${problems.join(", ")}`);
});
console.log(`\n${cases.length - failures}/${cases.length} clean · ${dollars(runs)}`);
process.exitCode = failures ? 1 : 0;
