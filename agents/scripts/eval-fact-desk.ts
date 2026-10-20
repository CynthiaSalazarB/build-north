// #25 done when: 10 test questions for "inflation", 5 of them asking for the structure: zero leaks, and
// `questionType` right on 8 of 10. A leak is a structure question answered with facts, or a fact answer
// that names a bigger group, a type or a requirement of inflation. Leak patterns are a net, not proof:
// read the printed answers too.
import { AGENTS, FACT_DESK_REDIRECT, type QuestionType } from "../src/index.ts";
import { dollars, MODEL, runAgent } from "./run-agent.ts";

const CASES: { question: string; structure: boolean; type: QuestionType }[] = [
  { question: "What's the bigger group that inflation belongs to?", structure: true, type: "asks_for_structure" },
  { question: "Is inflation a kind of economic phenomenon?", structure: true, type: "asks_for_structure" },
  { question: "What types of inflation are there?", structure: true, type: "asks_for_structure" },
  { question: "Is it something about money?", structure: true, type: "asks_for_structure" },
  { question: "What does something need to count as inflation?", structure: true, type: "asks_for_structure" },
  { question: "Is it when one thing gets more expensive, or everything?", structure: false, type: "contrast" },
  { question: "If gas goes up, is that inflation?", structure: false, type: "breaking_case" },
  { question: "Does it have to last a long time to count?", structure: false, type: "what_it_needs" },
  { question: "Is inflation like what happens when a currency loses value against the dollar?", structure: false, type: "compare" },
  { question: "When did Canada last have inflation above 5%?", structure: false, type: "fact" },
];

// Names of parts of the map for inflation that a fact answer must not hand over.
const LEAK =
  /bigger group|supraordinate|isoordinate|infraordinate|exclusion|types? of inflation|kinds? of inflation|demand[- ]pull|cost[- ]push|hyperinflation|stagflation|disinflation|creeping|galloping|economic (phenomenon|process|condition|concept|indicator)|monetary phenomenon/i;

const empty = { concept: "inflation", supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] };
const runs = await Promise.all(
  CASES.map((c) => runAgent(AGENTS.fact_desk, { concept: "inflation", material: null, mentefacto: empty, question: c.question })),
);

let leaks = 0;
let typesRight = 0;
console.log(`Fact desk on ${MODEL}, inflation\n`);
CASES.forEach((c, i) => {
  const { output: o, ms } = runs[i]!;
  const leak = c.structure ? o.kind !== "redirect" : o.kind === "fact" && LEAK.test(o.answer);
  const typeOk = o.questionType === c.type;
  if (leak) leaks++;
  if (typeOk) typesRight++;
  const redirectText = o.kind === "redirect" && o.answer !== FACT_DESK_REDIRECT ? " (model text differs; code shows the fixed one)" : "";
  console.log(`${leak ? "✘ LEAK" : "✔"} ${typeOk ? "" : `[type ${o.questionType}, expected ${c.type}] `}"${c.question}" → ${o.kind}${redirectText} (${ms} ms)`);
  if (o.kind === "fact") console.log(`    ${o.answer}`);
});
console.log(`\nleaks: ${leaks} (need 0) · questionType right: ${typesRight}/10 (need 8) · ${dollars(runs)}`);
process.exitCode = leaks === 0 && typesRight >= 8 ? 0 : 1;
