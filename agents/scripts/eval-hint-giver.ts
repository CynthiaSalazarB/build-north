// #21 done when: the 4 steps on the answer "a law" for democracy's bigger group; no step text contains
// the answer before reveal, and reveal returns the Item. Each step sees the hints already given, as in
// a real session. One more case checks the counterexample on an incomplete answer. JWT and CORS, the
// demo's concepts, get the same: the 4 steps on a wrong bigger group, and a counterexample to read. Name
// concepts after `--` to run only those (`npm run eval:hint-giver -- JWT CORS`).
import { AGENTS, type AgentContext, type EvaluatorIssue, type HintGiverInput, type HintStep, type Mentefacto } from "../src/index.ts";
import { type AgentRun, dollars, MODEL, pick, runAgent } from "./run-agent.ts";

const item = (value: string, note: string | null = null) => ({ value, note });
const LADDERS = pick([
  {
    concept: "democracy",
    // The answer is the group's name: "form of government", "political system" and close rewordings.
    answer: /forms? of govern|system of govern|govern(ment|ing) system|political system|type of government|kind of government/i,
    question: "Democracy is one example of a bigger group. What group?",
    wrong: "a law",
    feedback: "Not quite. A law is a single rule, and democracy isn't a rule.",
    issue: "not_a_class" as EvaluatorIssue,
    // An incomplete answer for "what it needs": the counterexample is the natural nudge.
    incomplete: {
      map: { supraordinate: item("form of government"), exclusion: [item("dictatorship", "who holds the power")] },
      question: "What does a country need to count as a democracy?",
      answer: "Elections.",
      feedback: "Elections are part of it, but not enough on their own.",
    },
  },
  {
    concept: "JWT",
    // "a kind of token" alone is the first half (the name says token); the group is a token format or a
    // security token.
    answer: /token formats?|formats? for tokens|security tokens?|signed tokens?|self-contained tokens?|credentials?/i,
    question: "A JWT is one example of a bigger group. What group?",
    wrong: "encryption",
    feedback: "Not quite. Encryption is something done to data, and a JWT isn't a kind of it.",
    issue: "not_a_class" as EvaluatorIssue,
    incomplete: {
      map: { supraordinate: item("token format"), exclusion: [item("session id", "the server looks a session id up; a JWT carries its own claims")] },
      question: "What does a token need to count as a JWT?",
      answer: "It's signed.",
      feedback: "Being signed is part of it, but not enough on its own.",
    },
  },
  {
    concept: "CORS",
    // the group: a browser security or access-control mechanism, by its name or a close rewording
    answer: /security (features?|mechanisms?)|access[- ]control mechanisms?|header[- ]based mechanisms?|browser (security )?(polic(y|ies)|rules?|mechanisms?)/i,
    question: "CORS is one example of a bigger group. What group?",
    wrong: "an HTTP header",
    feedback: "Not quite. CORS uses HTTP headers, but it isn't a header itself.",
    issue: "not_a_class" as EvaluatorIssue,
    incomplete: {
      map: { supraordinate: item("browser security mechanism"), exclusion: [item("same-origin policy", "it blocks other origins; CORS lets a server allow some")] },
      question: "What does something need to count as CORS?",
      answer: "The server sends a header.",
      feedback: "A header is part of it, but not enough on its own.",
    },
  },
]);

const runs: AgentRun<unknown>[] = [];
let failures = 0;
let steps = 0;
for (const l of LADDERS) {
  const empty: Mentefacto = { concept: l.concept, supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] };
  const base: AgentContext = {
    concept: l.concept,
    material: null,
    move: "supraordinate",
    level: 2,
    mentefacto: empty,
    recent: [
      { from: "app", text: l.question },
      { from: "learner", text: l.wrong },
      { from: "app", text: l.feedback },
    ],
  };
  console.log(`Hint giver on ${MODEL}, ${l.concept} → bigger group, after "${l.wrong}"\n`);
  for (const step of ["nudge", "hint", "partial", "reveal"] as HintStep[]) {
    const input: HintGiverInput = { ...base, step, lastAnswer: l.wrong, issue: l.issue };
    const run = await runAgent(AGENTS.hint_giver, input);
    runs.push(run);
    steps++;
    const o = run.output;
    const problems = [
      o.step !== step && `step came back as ${o.step}`,
      step !== "reveal" && l.answer.test(o.text) && "gives the answer before reveal",
      step !== "reveal" && o.revealed !== null && "revealed before reveal",
      step === "reveal" && o.revealed === null && "reveal without an Item",
      step === "reveal" && o.revealed !== null && !l.answer.test(o.revealed.value) && `revealed "${o.revealed.value}" isn't a defensible group`,
    ].filter(Boolean);
    if (problems.length) failures++;
    console.log(`${problems.length ? "✘" : "✔"} ${step} (${run.ms} ms): ${o.text}`);
    if (o.revealed) console.log(`    revealed: ${JSON.stringify(o.revealed)}`);
    if (problems.length) console.log(`    problems: ${problems.join(", ")}`);
    base.recent.push({ from: "app", text: o.text });
  }

  const { map, question, answer, feedback } = l.incomplete;
  const iso = await runAgent(AGENTS.hint_giver, {
    concept: l.concept,
    material: null,
    move: "isoordinate",
    level: 2,
    mentefacto: { ...empty, ...map },
    recent: [
      { from: "app", text: question },
      { from: "learner", text: answer },
      { from: "app", text: feedback },
    ],
    step: "nudge",
    lastAnswer: answer,
    issue: "none",
  });
  runs.push(iso);
  console.log(`\n(review) isoordinate nudge after "${answer}" (${iso.ms} ms): ${iso.output.text}\n`);
}

console.log(`${steps - failures}/${steps} steps clean · ${dollars(runs)}`);
process.exitCode = failures ? 1 : 0;
