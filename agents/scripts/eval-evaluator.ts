// #2 done when: the Evaluator judges 6 sample answers for democracy's bigger group, 5 of 6 right.
// "Right" means the verdict says correct exactly when the answer is a defensible bigger group
// (CONTRACTS.md decision 15: "form of government" and "political system" both pass). JWT and CORS, the
// demo's concepts, get 6 answers each and the same bar, 5 of every 6. Name concepts after `--` to run only
// those (`npm run eval:evaluator -- JWT CORS`); the extra checks run with democracy.
import { AGENTS, type EvaluatorInput } from "../src/index.ts";
import { type AgentRun, dollars, MODEL, pick, runAgent } from "./run-agent.ts";

// Each concept's question and answers, and what its feedback must never name: the group or another member.
const GROUPS = pick([
  {
    concept: "democracy",
    question: "Democracy is one example of a bigger group. What group?",
    leak: /government|monarch|dictator|regime|oligarch|republic/i,
    cases: [
      { answer: "a law", passes: false },
      { answer: "forms of government", passes: true },
      { answer: "a thing", passes: false },
      { answer: "politics", passes: false },
      { answer: "a political system", passes: true },
      { answer: "a country", passes: false },
    ],
  },
  {
    concept: "JWT",
    question: "A JWT is one example of a bigger group. What group?",
    leak: /token format|security token|signed token|credential|SAML|PASETO|opaque token|API key/i,
    cases: [
      { answer: "encryption", passes: false },
      { answer: "a token format", passes: true },
      { answer: "a thing", passes: false },
      { answer: "authentication", passes: false },
      { answer: "a security token", passes: true },
      { answer: "a cookie", passes: false },
    ],
  },
  {
    concept: "CORS",
    question: "CORS is one example of a bigger group. What group?",
    leak: /security (feature|mechanism)|access[- ]control mechanism|browser (security|mechanism|rule|polic)|same-origin policy|content security policy|\bCSP\b/i,
    cases: [
      { answer: "an HTTP header", passes: false },
      { answer: "a browser security mechanism", passes: true },
      { answer: "a thing", passes: false },
      { answer: "web security", passes: false },
      { answer: "an access-control mechanism", passes: true },
      { answer: "a firewall", passes: false },
    ],
  },
]);

const input = (concept: string, question: string, answer: string): EvaluatorInput => ({
  concept,
  material: null,
  move: "supraordinate",
  level: 2,
  mentefacto: { concept, supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] },
  recent: [{ from: "app", text: question }],
  answer,
});

const CASES = GROUPS.flatMap((g) => g.cases.map((c) => ({ ...c, group: g })));
const runs = await Promise.all(CASES.map((c) => runAgent(AGENTS.evaluator, input(c.group.concept, c.group.question, c.answer))));
let right = 0;
console.log(`Evaluator on ${MODEL}, bigger group of ${GROUPS.map((g) => g.concept).join(", ")}\n`);
CASES.forEach((c, i) => {
  const { output: o, ms } = runs[i]!;
  const ok = (o.verdict === "correct") === c.passes;
  if (ok) right++;
  console.log(`${ok ? "✔" : "✘"} ${c.group.concept}: "${c.answer}" → ${o.verdict} (quality ${o.quality}, ${o.issue}, ${ms} ms)`);
  console.log(`    feedback: ${o.feedback}`);
  console.log(`    accepted: ${JSON.stringify(o.accepted.map((a) => a.value))}`);
});
const needed = Math.ceil((CASES.length * 5) / 6);

// Feedback by level: at levels 2 and 3 a wrong answer's feedback ends with a nudge (a question); at 4 it
// stops after what is off. At no level does it name the answer or another member of the group.
const feedbackChecks = CASES.flatMap((c, i) =>
  c.passes ? [] : [{ label: `${c.group.concept}: "${c.answer}" at level 2`, feedback: runs[i]!.output.feedback, nudge: true, leak: c.group.leak }],
);
const extraRuns: AgentRun<unknown>[] = [];
let extras = "";

const democracy = GROUPS.find((g) => g.concept === "democracy");
if (democracy) {
  const base = (answer: string) => input(democracy.concept, democracy.question, answer);
  // Exclusion (not part of #2's threshold): a close concept alone is partial; a short right difference
  // completes it, as in the brief ("who holds the power").
  const EXCLUSION_Q = "What looks close to democracy but isn't one?";
  const exclusionBase = { ...base(""), move: "exclusion" as const, mentefacto: { ...base("").mentefacto, supraordinate: { value: "form of government", note: null } } };
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
    ...base(""),
    concept: "inflation",
    mentefacto: { ...base("").mentefacto, concept: "inflation" },
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

  const level4 = await runAgent(AGENTS.evaluator, { ...base("a law"), level: 4 });
  feedbackChecks.push({ label: 'democracy: "a law" at level 4', feedback: level4.output.feedback, nudge: false, leak: democracy.leak });
  extraRuns.push(...exRuns, ...kindRuns, level4);
  extras = ` · exclusion ${exRight}/3 · kind of ${kindRight}/2`;
}

let feedbackRight = 0;
console.log("\nFeedback by level (a nudge at 2 and 3, none at 4, never a leak)\n");
for (const c of feedbackChecks) {
  const ok = c.feedback.trim().endsWith("?") === c.nudge && !c.leak.test(c.feedback);
  if (ok) feedbackRight++;
  console.log(`${ok ? "✔" : "✘"} ${c.label}: ${c.feedback}`);
}

console.log(
  `\n${right}/${CASES.length} right (need ${needed})${extras} · feedback ${feedbackRight}/${feedbackChecks.length} · ${dollars([...runs, ...extraRuns])}`,
);
process.exitCode = right >= needed ? 0 : 1;
