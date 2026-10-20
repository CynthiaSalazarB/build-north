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
// Exclusion (not part of #2's threshold): a close concept alone is partial; a short right difference
// completes it, as in the brief ("who holds the power").
const EXCLUSION_Q = "What looks close to democracy but isn't one?";
const exclusionBase = { ...input(""), move: "exclusion" as const, mentefacto: { ...input("").mentefacto, supraordinate: { value: "form of government", note: null } } };
const exclusionCases: { label: string; input: EvaluatorInput; want: string }[] = [
  { label: '"Dictatorship." alone', input: { ...exclusionBase, recent: [{ from: "app", text: EXCLUSION_Q }], answer: "Dictatorship." }, want: "partial" },
  {
    label: '"Who holds the power." after dictatorship',
    input: {
      ...exclusionBase,
      mentefacto: { ...exclusionBase.mentefacto, exclusion: [{ value: "dictatorship", note: null }] },
      recent: [
        { from: "app", text: EXCLUSION_Q },
        { from: "learner", text: "Dictatorship." },
        { from: "app", text: "What's the key difference between democracy and dictatorship?" },
      ],
      answer: "Who holds the power.",
    },
    want: "correct",
  },
  { label: '"A car."', input: { ...exclusionBase, recent: [{ from: "app", text: EXCLUSION_Q }], answer: "A car." }, want: "incorrect" },
];
const exRuns = await Promise.all(exclusionCases.map((c) => runAgent(AGENTS.evaluator, c.input)));
let exRight = 0;
console.log("\nExclusion (extra checks)\n");
exclusionCases.forEach((c, i) => {
  const { output: o, ms } = exRuns[i]!;
  const ok = o.verdict === c.want;
  if (ok) exRight++;
  console.log(`${ok ? "✔" : "✘"} ${c.label} → ${o.verdict} (quality ${o.quality}, ${ms} ms), want ${c.want}`);
  console.log(`    feedback: ${o.feedback}`);
  console.log(`    accepted: ${JSON.stringify(o.accepted)}`);
});

// The "is a kind of" test (extra checks): related is not belonging, and a true but far group is too broad.
const kindOfBase = {
  ...input(""),
  concept: "inflation",
  mentefacto: { ...input("").mentefacto, concept: "inflation" },
  recent: [{ from: "app" as const, text: "Inflation is one example of a bigger group. What group?" }],
};
const kindOfCases = [
  { answer: "money", want: "incorrect", quality: 0, mentionsKindOf: true },
  { answer: "an economic change", want: "partial", quality: 1, mentionsKindOf: false },
];
const kindRuns = await Promise.all(kindOfCases.map((c) => runAgent(AGENTS.evaluator, { ...kindOfBase, answer: c.answer })));
let kindRight = 0;
console.log("\nThe 'is a kind of' test, inflation (extra checks)\n");
kindOfCases.forEach((c, i) => {
  const { output: o, ms } = kindRuns[i]!;
  const ok = o.verdict === c.want && o.quality === c.quality && (!c.mentionsKindOf || /kind of/i.test(o.feedback));
  if (ok) kindRight++;
  console.log(`${ok ? "✔" : "✘"} "${c.answer}" → ${o.verdict} (quality ${o.quality}, ${o.issue}, ${ms} ms), want ${c.want}/${c.quality}`);
  console.log(`    feedback: ${o.feedback}`);
});

console.log(`\n${right}/6 right (need 5) · exclusion ${exRight}/3 · kind of ${kindRight}/2 · ${dollars([...runs, ...exRuns, ...kindRuns])}`);
process.exitCode = right >= 5 ? 0 : 1;
