// What the screens say, as pure functions of the Turns and the transcript: the stage of a part, the
// hint card, the price on Help, the calibration gap and its blocks. No React here, so it's tested
// under Node. The rules behind the words are in CONTRACTS.md section 3.
import type { HintStep, Level, Result, Turn, TurnBody } from "@build-north/agents";
import type { Entry } from "./transcript.ts";

/** A part's level as a stage of the statue (round 6): what the learner sees on the chip. */
const STAGES: Record<Level, { name: string; does: string }> = {
  1: { name: "Sketch", does: "Watch" },
  2: { name: "Clay", does: "Guided" },
  3: { name: "Plaster", does: "Complete" },
  4: { name: "Bronze", does: "Named Only" },
  5: { name: "Patina", does: "You Ask" },
};

export const stageOf = (level: Level) => STAGES[level];

/** The hint ladder is nudge, hint, partial, reveal: three hints, then the answer (0 points). */
export function hintCardOf(step: HintStep | undefined): { title: string; pips: number | null; note: string } {
  const capped = "This part can now score 1 point at most.";
  switch (step) {
    case "nudge":
      return { title: "Hint 1 of 3", pips: 1, note: capped };
    case "hint":
      return { title: "Hint 2 of 3", pips: 2, note: capped };
    case "partial":
      return { title: "Hint 3 of 3", pips: 3, note: capped };
    case "reveal":
      return { title: "The answer", pips: null, note: "This part scores 0 now. Its answer is on your map." };
    default:
      return { title: "Hint", pips: null, note: capped };
  }
}

/** The transcript since the latest question: the part the learner is on. */
export function sinceLastQuestion(entries: readonly Entry[]): Entry[] {
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i]!;
    if (entry.from === "app" && entry.message.kind === "question") return entries.slice(i);
  }
  return [...entries];
}

/** Help shows its price (round 6). A part scores 2 only on the first try with no Help, so the first
 * Help costs a point; after a wrong answer or a hint it costs nothing more until the answer itself. */
export function helpLabelOf(part: readonly Entry[]): string {
  if (part.some((e) => e.from === "app" && e.message.kind === "hint")) return "More Help";
  if (part.some((e) => e.from === "learner")) return "Help";
  return "Help · −1 pt";
}

/** Splits a tutor reply that ends in a question, so the question can be set in italic. */
export function splitTrailingQuestion(text: string): { statement: string; question: string | null } {
  const trimmed = text.trim();
  if (!trimmed.endsWith("?")) return { statement: trimmed, question: null };
  let cut = -1;
  for (const match of trimmed.slice(0, -1).matchAll(/[.!?:]["')\]]?\s+/g)) cut = match.index + match[0].length;
  if (cut < 0) return { statement: "", question: trimmed };
  return { statement: trimmed.slice(0, cut).trim(), question: trimmed.slice(cut) };
}

/** "Before any help: in your own words, what is democracy?" becomes a short eyebrow over the question. */
export function eyebrowOf(text: string): { eyebrow: string | null; text: string } {
  const match = /^([^:?.]{3,40}):\s+(.+\?)$/.exec(text.trim());
  if (!match) return { eyebrow: null, text: text.trim() };
  const rest = match[2]!;
  return { eyebrow: match[1]!, text: rest.charAt(0).toUpperCase() + rest.slice(1) };
}

/** "1 of 4" while the learner works on a part. */
export function partLabelOf(turn: Turn): string | null {
  if (turn.phase !== "move" || !turn.move) return null;
  return `${Math.min(turn.progress.movesDone + 1, turn.progress.movesTotal)} of ${turn.progress.movesTotal}`;
}

export type KeyState = "done" | "now" | "todo";

/** The Greek key: one unit per part of the map. */
export function keysOf(turn: Turn): KeyState[] {
  const { movesDone, movesTotal } = turn.progress;
  return Array.from({ length: movesTotal }, (_, i) =>
    i < movesDone ? "done" : i === movesDone && turn.phase === "move" ? "now" : "todo",
  );
}

/** What the screen says while a call is in flight. */
export function waitingLineOf(body: TurnBody | null): string {
  if (!body) return "One moment…";
  if ("text" in body) return "Checking your answer…";
  if ("question" in body) return "Asking the fact desk…";
  if ("mentefacto" in body) return "Checking your map…";
  if ("prediction" in body) return "Opening the map…";
  return body.action === "help" ? "Finding a hint…" : "One moment…";
}

const points = (n: number) => (n === 1 ? "point" : "points");

/** The calibration gap as the result shows it: a signed number and one sentence, never a failure. */
export function gapOf(result: Pick<Result, "calibrationGap">): { sign: "+" | "−" | null; amount: number; sentence: string; over: boolean } {
  const gap = result.calibrationGap;
  if (gap > 0) return { sign: "+", amount: gap, sentence: `You felt ${gap} ${points(gap)} surer than you were.`, over: true };
  if (gap < 0) return { sign: "−", amount: -gap, sentence: `You did ${-gap} ${points(-gap)} better than you felt.`, over: false };
  return { sign: null, amount: 0, sentence: "Your guess was exactly right.", over: false };
}

export type Block = "cast" | "shade" | "empty";

/** The 8 points: cast in bronze when proven, a shadow when felt sure but not proven, empty otherwise. */
export function blocksOf(predicted: number, score: number, max = 8): Block[] {
  return Array.from({ length: max }, (_, i) => (i < score ? "cast" : i < predicted ? "shade" : "empty"));
}
