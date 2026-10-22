// #44 done when: the coach's message states no number it wasn't given. Four finished sessions, with the
// numbers computed the way the orchestrator computes them: the demo (CORS, 6/8), session 1
// (democracy, 5/8, from the fixture), a perfect map that beat its prediction, and a weak pre-test with a
// big gap and questions to count. Every number in a message must appear in what the coach was sent;
// `nextFocus` must be a part with the fewest points, or null when every part got 2; and the message names
// parts by their plain labels. The number check is a net, not proof: read the printed messages too.
import { readFileSync } from "node:fs";
import {
  AGENTS,
  type CoachInput,
  DemoSeed,
  type Mentefacto,
  MOVE_LABEL,
  MOVE_ORDER,
  type Quality,
  type Result,
  rules,
  type Turn,
  verifyCites,
} from "../src/index.ts";
import { dollars, MODEL, runAgent } from "./run-agent.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const seed = DemoSeed.parse(read("../fixtures/demo-seed.json"));
const sessionOne = (read("../fixtures/session-1.json") as { turn: Turn }[]).at(-1)!.turn;

/** A result as `advance` builds it: the score and the calibration gap from the points and the prediction. */
function finished(
  concept: string,
  mentefacto: Mentefacto,
  predictedScore: number,
  points: Quality[],
  rest: Pick<Result, "hintsUsed" | "masteryChanges" | "questions">,
): CoachInput {
  const score = points.reduce<number>((sum, p) => sum + p, 0);
  const rubric = MOVE_ORDER.map((move, i) => ({ move, points: points[i]! }));
  return { concept, mentefacto, result: { predictedScore, score, maxScore: 8, calibrationGap: rules.calibrationGap(predictedScore, score), rubric, ...rest } };
}

const item = (value: string, note: string | null = null) => ({ value, note });
const one = sessionOne.result!;
const CASES: { label: string; input: CoachInput }[] = [
  {
    label: "the demo, level 5",
    input: finished(seed.session.concept, seed.script.map, seed.session.predictedScore!, [1, 2, 2, 1], {
      hintsUsed: 0,
      masteryChanges: [],
      questions: seed.script.expected.questions,
    }),
  },
  {
    label: "session 1",
    input: finished("democracy", sessionOne.mentefacto, one.predictedScore, one.rubric.map((r) => r.points), {
      hintsUsed: one.hintsUsed,
      masteryChanges: one.masteryChanges,
      questions: one.questions,
    }),
  },
  {
    label: "a perfect map, level 4",
    input: finished("democracy", sessionOne.mentefacto, 5, [2, 2, 2, 2], {
      hintsUsed: 0,
      masteryChanges: MOVE_ORDER.map((move) => ({ move, from: 4, to: 5 })),
      questions: { asked: 0, testing: 0 },
    }),
  },
  {
    label: "a weak pre-test",
    input: finished(
      "inflation",
      { concept: "inflation", supraordinate: item("money"), exclusion: [], isoordinate: [item("prices go up")], infraordinate: [] },
      6,
      [0, 0, 1, 0],
      { hintsUsed: 0, masteryChanges: [], questions: { asked: 5, testing: 2 } },
    ),
  },
];

// Digits, and the number words a short message would use. "one" counts only before something counted
// ("one hint"): "the closest one" isn't a number.
const NUMBER =
  /\d+(?:\.\d+)?|\b(?:zero|two|three|four|five|six|seven|eight|nine|ten|half|twice|double|percent)\b|\bone(?= (?:more |extra )?(?:hint|point|part|question|level|try|retry|mistake)s?\b)/gi;
const WORD: Record<string, string> = { zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10" };
const numbersIn = (text: string) => (text.match(NUMBER) ?? []).map((n) => WORD[n.toLowerCase()] ?? n.toLowerCase());
const JARGON = /supraordinate|isoordinate|infraordinate/i;

// `--memory`: each case also gets an earlier session's gap and a level, as the API passes them (CONTRACTS.md,
// Memory). The bar adds: no cite of an id it wasn't given, and a message that talks about last time cites
// what it relies on (and the reverse).
const withMemory = process.argv.includes("--memory");
if (withMemory) {
  for (const c of CASES) {
    const concept = c.input.concept;
    c.input.memory = {
      facts: [
        { id: "attr_gap", text: `Predicted 7, scored 3 on ${concept}: 4 too many.`, concept, since: "2026-10-21T18:10:00Z", writtenBy: "coach", sessionId: "ses_before" },
        { id: "attr_level", text: `Level 2 on isoordinate for ${concept}, since Oct 21.`, concept, move: "isoordinate", level: 2, since: "2026-10-21T18:00:00Z", writtenBy: "evaluator", sessionId: "ses_before" },
      ],
    };
  }
}
const PAST = /last time|before|earlier|previous|than you did/i;

const runs = await Promise.all(CASES.map((c) => runAgent(AGENTS.coach, c.input)));
console.log(`Coach on ${MODEL}${withMemory ? ", with memory" : ""}\n`);
let right = 0;
CASES.forEach((c, i) => {
  const { output: o, ms } = runs[i]!;
  const { rubric, score, calibrationGap } = c.input.result;
  // what the coach was sent is the only place a number may come from
  const given = new Set(numbersIn(AGENTS.coach.render(c.input)));
  const stray = numbersIn(o.message).filter((n) => !given.has(n));
  const fewest = Math.min(...rubric.map((r) => r.points));
  const focusOk = fewest === 2 ? o.nextFocus === null : rubric.some((r) => r.move === o.nextFocus && r.points === fewest);
  const problems = [
    stray.length > 0 && `states ${stray.join(", ")}, which it wasn't given`,
    !focusOk && `nextFocus ${o.nextFocus} isn't ${fewest === 2 ? "null" : `a part with ${fewest} points`}`,
    JARGON.test(o.message) && "uses a move's id instead of its label",
    o.nextFocus && !o.message.toLowerCase().includes(MOVE_LABEL[o.nextFocus].toLowerCase()) && `doesn't name "${MOVE_LABEL[o.nextFocus]}"`,
    withMemory && verifyCites(o, c.input.memory).dropped.length > 0 && `cites ids it wasn't given: ${verifyCites(o, c.input.memory).dropped.join(", ")}`,
    withMemory && PAST.test(o.message) && !o.cites?.length && "talks about last time without citing a fact",
    withMemory && !!o.cites?.length && !PAST.test(o.message) && "cites a fact it doesn't talk about",
    !withMemory && PAST.test(o.message) && "talks about a last time it can't see",
  ].filter(Boolean);
  if (!problems.length) right++;
  console.log(`${problems.length ? "✘" : "✔"} ${c.label} (${score}/8, gap ${calibrationGap > 0 ? "+" : ""}${calibrationGap}) → ${o.nextFocus ?? "null"} (${ms} ms)`);
  console.log(`    ${o.message}${o.cites?.length ? `  [cites ${o.cites.join(", ")}]` : ""}`);
  if (problems.length) console.log(`    problems: ${problems.join("; ")}`);
});
console.log(`\n${right}/${CASES.length} messages clean · ${dollars(runs)}`);
process.exitCode = right === CASES.length ? 0 : 1;
