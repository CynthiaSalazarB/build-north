// #21 done when: the 4 steps on the answer "a law" for democracy's bigger group; no step text contains
// the answer before reveal, and reveal returns the Item. Each step sees the hints already given, as in
// a real session. One more case checks the counterexample on an incomplete answer. JWT and CORS, the
// demo's concepts, get the same: the 4 steps on a wrong bigger group, and a counterexample to read. So do
// API (the demo since #96) and the testers' training concepts, hashing and environment variable. Name
// concepts after `--` to run only those (`npm run eval:hint-giver -- JWT CORS`). With `--memory`, every
// step also gets three facts from an earlier session (CONTRACTS.md, Memory): the bar is the same, plus no
// cite of an id it wasn't given (`verifyCites` drops none).
import { AGENTS, type AgentContext, type EvaluatorIssue, type HintGiverInput, type HintStep, type LearnerMemory, type Mentefacto, verifyCites } from "../src/index.ts";
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
  {
    concept: "API",
    // the group: a software interface or a contract between programs (the letters' expansion is the name)
    answer: /software interfaces?|(?<!application )programming interfaces?|interfaces? (between|for) (programs|software|applications)|contracts? between/i,
    question: "An API is one example of a bigger group. What group?",
    wrong: "a server",
    feedback: "Not quite. A server is a machine or program that answers requests, and an API isn't one.",
    issue: "not_a_class" as EvaluatorIssue,
    incomplete: {
      map: { supraordinate: item("software interface"), exclusion: [item("library", "a library is code you include; an API is how other code is allowed to use it")] },
      question: "What does something need to count as an API?",
      answer: "It connects programs.",
      feedback: "Connecting programs is part of it, but not enough on its own.",
    },
  },
  {
    concept: "hashing",
    // the group: a one-way function or transformation of data
    answer: /one-way (functions?|transformations?|processes?)|(mathematical|cryptographic) functions?|data transformations?|transformations? of data|functions? that (maps?|turns?)/i,
    question: "Hashing is one example of a bigger group. What group?",
    wrong: "encryption",
    feedback: "Not quite. Encryption can be undone with a key, and hashing is meant to work one way.",
    issue: "same_level" as EvaluatorIssue,
    incomplete: {
      map: { supraordinate: item("one-way function"), exclusion: [item("encryption", "encryption can be reversed with a key; a hash can't")] },
      question: "What does something need to count as hashing?",
      answer: "It scrambles the data.",
      feedback: "Scrambling is part of it, but not enough on its own.",
    },
  },
  {
    concept: "environment variable",
    // the group: a configuration value set outside the program
    answer: /configuration (values?|settings?|variables?|data)|key-value (pairs?|settings?)|(runtime|process) configuration|config(uration)? values?/i,
    question: "An environment variable is one example of a bigger group. What group?",
    wrong: "a password",
    feedback: "Not quite. A password is one thing you might keep in one, not what it is.",
    issue: "not_a_class" as EvaluatorIssue,
    incomplete: {
      map: { supraordinate: item("configuration value"), exclusion: [item("a variable in the code", "it's set outside the program, so it changes without changing the code")] },
      question: "What does something need to count as an environment variable?",
      answer: "It has a name.",
      feedback: "A name is part of it, but not enough on its own.",
    },
  },
]);

const withMemory = process.argv.includes("--memory");
/** Three facts an earlier session left, as the API passes them: two about this part, one about the gap. */
const memoryFor = (concept: string): LearnerMemory => ({
  facts: [
    { id: "attr_level", text: `Level 2 on supraordinate for ${concept}, since Oct 21.`, concept, move: "supraordinate", level: 2, since: "2026-10-21T18:00:00Z", writtenBy: "evaluator", sessionId: "ses_before" },
    { id: "attr_help", text: `Needed 2 Helps on supraordinate for ${concept}, Oct 21.`, concept, move: "supraordinate", since: "2026-10-21T18:05:00Z", writtenBy: "hint_giver", sessionId: "ses_before" },
    { id: "attr_gap", text: `Predicted 6, scored 3 on ${concept}: 3 too many.`, concept, since: "2026-10-21T18:10:00Z", writtenBy: "coach", sessionId: "ses_before" },
  ],
});
let cited = 0;
let invented = 0;

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
    ...(withMemory ? { memory: memoryFor(l.concept) } : {}),
  };
  console.log(`Hint giver on ${MODEL}${withMemory ? ", with memory" : ""}, ${l.concept} → bigger group, after "${l.wrong}"\n`);
  for (const step of ["nudge", "hint", "partial", "reveal"] as HintStep[]) {
    const input: HintGiverInput = { ...base, step, lastAnswer: l.wrong, issue: l.issue };
    const run = await runAgent(AGENTS.hint_giver, input);
    runs.push(run);
    steps++;
    const o = run.output;
    const { dropped } = verifyCites(o, base.memory);
    invented += dropped.length;
    if (o.cites?.length) cited++;
    const problems = [
      dropped.length > 0 && `cites ids it wasn't given: ${dropped.join(", ")}`,
      o.step !== step && `step came back as ${o.step}`,
      step !== "reveal" && l.answer.test(o.text) && "gives the answer before reveal",
      step !== "reveal" && o.revealed !== null && "revealed before reveal",
      step === "reveal" && o.revealed === null && "reveal without an Item",
      step === "reveal" && o.revealed !== null && !l.answer.test(o.revealed.value) && `revealed "${o.revealed.value}" isn't a defensible group`,
    ].filter(Boolean);
    if (problems.length) failures++;
    console.log(`${problems.length ? "✘" : "✔"} ${step} (${run.ms} ms): ${o.text}${o.cites?.length ? `  [cites ${o.cites.join(", ")}]` : ""}`);
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

console.log(`${steps - failures}/${steps} steps clean${withMemory ? ` · ${cited} cited a fact · ${invented} invented ids` : ""} · ${dollars(runs)}`);
process.exitCode = failures ? 1 : 0;
