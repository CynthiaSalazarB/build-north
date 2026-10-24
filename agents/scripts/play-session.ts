// Plays a session 1 end to end against Claude: the real orchestrator and the real agents, with a scripted
// learner. Prints the conversation and the seconds per turn against the budget (CONTRACTS.md section 5:
// median under 4 s, never over 8 s). The real model judges for itself, so the session can take a
// different path from the fixture; the learner's lines stay the same.
// `npm run play:session` plays democracy (the session in fixtures/session-1.json);
// `npm run play:session -- api` plays the demo's session 1 (DECISIONS.md, the demo runs on API, then CORS).
import { writeFileSync } from "node:fs";
import { advance, AGENTS, type AgentName, type CallAgent, type Mastery, MOVE_LABEL, MOVE_ORDER, type Session, type TurnInput } from "../src/index.ts";
import { type AgentRun, dollars, MODEL, runAgent } from "./run-agent.ts";

// The learner's lines for each concept, in order. If the session asks for more, the learner taps Help.
const SCRIPTS: Record<string, { concept: string; lines: TurnInput[] }> = {
  democracy: {
    concept: "democracy",
    lines: [
      { action: "start" },
      { prediction: 7 },
      { text: "When people vote." },
      { action: "continue" },
      { text: "A law?" },
      { action: "help" },
      { text: "Forms of government." },
      { text: "Dictatorship." },
      { text: "Who holds the power." },
      { text: "Elections." },
      { action: "help" },
      { text: "Free elections, rights, other parties." },
      { text: "Direct?" },
      { text: "Direct and representative." },
    ],
  },
  // The "server" answer is the demo's related-but-not-a-kind-of moment: an API runs on a server, but it
  // isn't a kind of server. One Help after it, and the target is 5/8 against a prediction of 7 (+2).
  api: {
    concept: "API",
    lines: [
      { action: "start" },
      { prediction: 7 },
      { text: "Something that lets two apps talk to each other." },
      { action: "continue" },
      { text: "A server?" },
      { action: "help" },
      { text: "A software interface." },
      { text: "A library. A library is code you add to your project; an API is how you call it." },
      { text: "Requests and responses." },
      { text: "A defined set of requests and responses, and it hides how the other side works." },
      { text: "REST?" },
      { text: "Web APIs, library APIs and operating system APIs." },
    ],
  },
};
const name = process.argv[2] ?? "democracy";
const script = SCRIPTS[name];
if (!script) throw new Error(`No script for "${name}". Try: ${Object.keys(SCRIPTS).join(", ")}`);
const { concept, lines } = script;

const runs: AgentRun<unknown>[] = [];
const callAgent: CallAgent = async (name: AgentName, input) => {
  const agent = (AGENTS as Partial<Record<AgentName, (typeof AGENTS)[keyof typeof AGENTS]>>)[name];
  // The coach is in the registry too (#44). If its call fails, advance still ends the session with fixed
  // text from the numbers.
  if (!agent) throw new Error(`${name} isn't in the registry yet`);
  const run = await runAgent(agent as never, input as never);
  runs.push(run);
  return run.output;
};

let session: Session = {
  id: "play",
  user: "script",
  concept,
  moveOrder: [...MOVE_ORDER],
  material: null,
  mode: "learn",
  turn: 0,
  lastTurn: null,
  predictedScore: null,
  firstAttempt: null,
  phase: "predict",
  move: null,
  hintStep: null,
  hintsPerMove: { supraordinate: 0, exclusion: 0, isoordinate: 0, infraordinate: 0 },
  mentefacto: { concept, supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] },
  recent: [],
  retries: 0,
  lastIssue: "none",
  nextQuestion: null,
  questions: { asked: 0, testing: 0 },
  moveLog: [],
  result: null,
  createdAt: new Date().toISOString(),
};
let mastery: Mastery = { moves: MOVE_ORDER.map((move) => ({ move, level: 1 as const, unassistedSuccesses: 0 })) };


// `--save <file>` writes the run as a fixture in the shape of session-1.json: each step's input as the app
// sends it (the first one is POST /sessions), and the Turn it got back.
const savePath = process.argv.includes("--save") ? process.argv[process.argv.indexOf("--save") + 1] : undefined;
const recorded: { note: string; input: unknown; turn: unknown }[] = [];
if (savePath) session.id = `ses_demo_${name}`;

const seconds: number[] = [];
console.log(`Session 1 (${concept}) on ${MODEL}\n`);
for (let i = 0; i < 30 && session.lastTurn?.expects !== "none"; i++) {
  // the result shows first; the app then asks for the coach's words with continue
  const coaching = session.phase === "result";
  const input: TurnInput = coaching ? { action: "continue" } : (lines[i] ?? { action: "help" });
  const started = performance.now();
  const out = await advance({ session, mastery }, input, callAgent);
  if (savePath && !out.turn.error) {
    const sent = i === 0 ? { concept } : { turn: session.turn, ...input };
    const where = out.turn.move ? `${out.turn.phase}: ${MOVE_LABEL[out.turn.move]}, level ${out.turn.level}` : out.turn.phase;
    recorded.push({ note: `Recorded live on ${MODEL}. ${where}.`, input: sent, turn: out.turn });
  }
  const s = (performance.now() - started) / 1000;
  const learner = "text" in input ? `"${input.text}"` : JSON.stringify(input);
  if (out.turn.error) {
    console.log(`  learner ${learner} → ERROR ${out.turn.error.code}`);
    break;
  }
  // turns 1-4 make at most one call, and the coach's Turn comes while the result is on screen: the budget is
  // about answer turns
  if (i > 3 && !coaching) seconds.push(s);
  console.log(`[turn ${out.turn.turn} · ${out.turn.phase}${out.turn.move ? ` · ${out.turn.move} L${out.turn.level}` : ""} · ${s.toFixed(1)} s] learner ${learner}`);
  for (const m of out.turn.messages.filter((m) => m.agent !== "example_builder")) console.log(`    ${m.agent}${m.hintStep ? ` (${m.hintStep})` : ""}: ${m.text}`);
  session = out.session;
  mastery = out.mastery;
}

const r = session.result;
if (r) {
  console.log(`\nResult: predicted ${r.predictedScore}, scored ${r.score}/8, gap ${r.calibrationGap > 0 ? "+" : ""}${r.calibrationGap}, ${r.hintsUsed} hints`);
  console.log(`Points per move: ${r.rubric.map((x) => `${x.move} ${x.points}`).join(", ")}`);
  console.log(`Map: ${JSON.stringify(session.mentefacto)}`);
}
const sorted = [...seconds].sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
const max = sorted.at(-1) ?? 0;
console.log(`\nAnswer turns: median ${median.toFixed(1)} s, max ${max.toFixed(1)} s (budget: median < 4, max < 8) · ${runs.length} Claude calls · ${dollars(runs)}`);
if (savePath && r) {
  writeFileSync(savePath, `${JSON.stringify(recorded, null, 2)}\n`);
  console.log(`Saved ${recorded.length} steps to ${savePath}`);
}
