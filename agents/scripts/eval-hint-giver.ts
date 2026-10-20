// #21 done when: the 4 steps on the answer "a law" for democracy's bigger group; no step text contains
// the answer before reveal, and reveal returns the Item. Each step sees the hints already given, as in
// a real session. One more case checks the counterexample on an incomplete answer.
import { AGENTS, type AgentContext, type HintGiverInput, type HintStep } from "../src/index.ts";
import { type AgentRun, dollars, MODEL, runAgent } from "./run-agent.ts";

// The answer is the group's name: "form of government", "political system" and close rewordings.
const ANSWER = /forms? of govern|system of govern|govern(ment|ing) system|political system|type of government|kind of government/i;
const QUESTION = "Democracy is one example of a bigger group. What group?";
const empty = { concept: "democracy", supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] };

const base: AgentContext = {
  concept: "democracy",
  material: null,
  move: "supraordinate",
  level: 2,
  mentefacto: empty,
  recent: [
    { from: "app", text: QUESTION },
    { from: "learner", text: "a law" },
    { from: "app", text: "Not quite. A law is a single rule, and democracy isn't a rule." },
  ],
};

const runs: AgentRun<unknown>[] = [];
let failures = 0;
console.log(`Hint giver on ${MODEL}, democracy → bigger group, after "a law"\n`);
for (const step of ["nudge", "hint", "partial", "reveal"] as HintStep[]) {
  const input: HintGiverInput = { ...base, step, lastAnswer: "a law", issue: "not_a_class" };
  const run = await runAgent(AGENTS.hint_giver, input);
  runs.push(run);
  const o = run.output;
  const problems = [
    o.step !== step && `step came back as ${o.step}`,
    step !== "reveal" && ANSWER.test(o.text) && "gives the answer before reveal",
    step !== "reveal" && o.revealed !== null && "revealed before reveal",
    step === "reveal" && o.revealed === null && "reveal without an Item",
    step === "reveal" && o.revealed !== null && !ANSWER.test(o.revealed.value) && `revealed "${o.revealed.value}" isn't a defensible group`,
  ].filter(Boolean);
  if (problems.length) failures++;
  console.log(`${problems.length ? "✘" : "✔"} ${step} (${run.ms} ms): ${o.text}`);
  if (o.revealed) console.log(`    revealed: ${JSON.stringify(o.revealed)}`);
  if (problems.length) console.log(`    problems: ${problems.join(", ")}`);
  base.recent.push({ from: "app", text: o.text });
}

// An incomplete answer for "what it needs": the counterexample is the natural nudge.
const iso = await runAgent(AGENTS.hint_giver, {
  concept: "democracy",
  material: null,
  move: "isoordinate",
  level: 2,
  mentefacto: { ...empty, supraordinate: { value: "form of government", note: null }, exclusion: [{ value: "dictatorship", note: "who holds the power" }] },
  recent: [
    { from: "app", text: "What does a country need to count as a democracy?" },
    { from: "learner", text: "Elections." },
    { from: "app", text: "Elections are part of it, but not enough on their own." },
  ],
  step: "nudge",
  lastAnswer: "Elections.",
  issue: "none",
});
runs.push(iso);
console.log(`\n(review) isoordinate nudge after "Elections." (${iso.ms} ms): ${iso.output.text}`);

console.log(`\n${4 - failures}/4 steps clean · ${dollars(runs)}`);
process.exitCode = failures ? 1 : 0;
