// Plays session 1 (democracy) end to end against Claude: the real orchestrator and the real agents, with
// a scripted learner. Prints the conversation and the seconds per turn against the budget (CONTRACTS.md
// section 5: median under 4 s, never over 8 s). The real model judges for itself, so the session can
// take a different path from the fixture; the learner's lines stay the same.
import { advance, AGENTS, type AgentName, type CallAgent, type Mastery, MOVE_ORDER, type Session, type TurnInput } from "../src/index.ts";
import { type AgentRun, dollars, MODEL, runAgent } from "./run-agent.ts";

const runs: AgentRun<unknown>[] = [];
const callAgent: CallAgent = async (name: AgentName, input) => {
  const agent = (AGENTS as Partial<Record<AgentName, (typeof AGENTS)[keyof typeof AGENTS]>>)[name];
  if (!agent) throw new Error(`${name} isn't in the registry yet`); // the coach (#44) falls back to fixed text
  const run = await runAgent(agent as never, input as never);
  runs.push(run);
  return run.output;
};

let session: Session = {
  id: "play",
  user: "script",
  concept: "democracy",
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
  mentefacto: { concept: "democracy", supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] },
  recent: [],
  questions: { asked: 0, testing: 0 },
  moveLog: [],
  result: null,
  createdAt: new Date().toISOString(),
};
let mastery: Mastery = { moves: MOVE_ORDER.map((move) => ({ move, level: 1 as const, unassistedSuccesses: 0 })) };

// The learner's lines, in order. If the session asks for more, the learner taps Help.
const lines: TurnInput[] = [
  { action: "start" },
  { prediction: 7 },
  { text: "When people vote." },
  { action: "continue" },
  { text: "A law?" },
  { text: "Forms of government." },
  { text: "Dictatorship." },
  { text: "Who holds the power." },
  { text: "Elections." },
  { text: "Free elections." },
  { text: "Rights, and more than one party." },
  { text: "Direct?" },
  { text: "Direct and representative." },
];

const seconds: number[] = [];
console.log(`Session 1 (democracy) on ${MODEL}\n`);
for (let i = 0; i < 30 && session.phase !== "result"; i++) {
  const input: TurnInput = lines[i] ?? { action: "help" };
  const started = performance.now();
  const out = await advance({ session, mastery }, input, callAgent);
  const s = (performance.now() - started) / 1000;
  const learner = "text" in input ? `"${input.text}"` : JSON.stringify(input);
  if (out.turn.error) {
    console.log(`  learner ${learner} → ERROR ${out.turn.error.code}`);
    break;
  }
  if (i > 3) seconds.push(s); // turns 1-4 make at most one call; the budget is about answer turns
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
