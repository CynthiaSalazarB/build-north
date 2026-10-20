// #2 done when: the Evaluator judges 6 sample answers for democracy's bigger group, 5 of 6 right.
// "Right" means the verdict says correct exactly when the answer is a defensible bigger group
// (CONTRACTS.md decision 15: "form of government" and "political system" both pass).
import { AGENTS, type EvaluatorInput } from "../src/index.ts";
import { dollars, MODEL, runAgent } from "./run-agent.ts";

const QUESTION = "Democracy is one example of a bigger group. What group?";
const CASES: { answer: string; passes: boolean }[] = [
  { answer: "a law", passes: false },
  { answer: "forms of government", passes: true },
  { answer: "a thing", passes: false },
  { answer: "politics", passes: false },
  { answer: "a political system", passes: true },
  { answer: "a country", passes: false },
];

const input = (answer: string): EvaluatorInput => ({
  concept: "democracy",
  material: null,
  move: "supraordinate",
  level: 2,
  mentefacto: { concept: "democracy", supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] },
  recent: [{ from: "app", text: QUESTION }],
  answer,
});

const runs = await Promise.all(CASES.map((c) => runAgent(AGENTS.evaluator, input(c.answer))));
let right = 0;
console.log(`Evaluator on ${MODEL}, democracy → bigger group\n`);
CASES.forEach((c, i) => {
  const { output: o, ms } = runs[i]!;
  const ok = (o.verdict === "correct") === c.passes;
  if (ok) right++;
  console.log(`${ok ? "✔" : "✘"} "${c.answer}" → ${o.verdict} (quality ${o.quality}, ${o.issue}, ${ms} ms)`);
  console.log(`    feedback: ${o.feedback}`);
  console.log(`    accepted: ${JSON.stringify(o.accepted.map((a) => a.value))}`);
});
console.log(`\n${right}/6 right (need 5) · ${dollars(runs)}`);
process.exitCode = right >= 5 ? 0 : 1;
