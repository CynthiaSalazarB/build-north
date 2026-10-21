// What the screens say, as pure functions of the Turns and the transcript: the stage of a part, the
// hint card, the price on Help, the calibration gap and its blocks. No React here, so it's tested
// under Node. The rules behind the words are in CONTRACTS.md section 3.
import { MOVE_LABEL, MOVE_ORDER, type HintStep, type Item, type Level, type Mentefacto, type Message, type MoveId, type Result, type Turn, type TurnBody } from "@build-north/agents";
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

// ---------- Level 5: the learner builds the whole map and asks the fact desk ----------

/** A part's items: the bigger group is one item, the other parts are lists. */
export const itemsOf = (map: Mentefacto, move: MoveId): Item[] =>
  move === "supraordinate" ? (map.supraordinate ? [map.supraordinate] : []) : map[move];

/** How many of the four parts have something in them. */
export const filledOf = (map: Mentefacto): number => MOVE_ORDER.filter((move) => itemsOf(map, move).length > 0).length;

/** What each part asks for, in plain words: the method's moves without its names. */
export function partMeaningOf(move: MoveId, concept: string): string {
  switch (move) {
    case "supraordinate":
      return `The closest bigger group that ${concept} belongs to.`;
    case "exclusion":
      return `Something close to ${concept} that it isn't, and how they differ.`;
    case "isoordinate":
      return `What something needs to count as ${concept}.`;
    case "infraordinate":
      return `The kinds of ${concept}.`;
  }
}

/** Writes one part back into the map: blank items go, a note only stays on an exclusion. */
export function withPart(map: Mentefacto, move: MoveId, items: readonly Item[]): Mentefacto {
  const clean = items
    .map((i) => ({ value: i.value.trim(), note: move === "exclusion" && i.note?.trim() ? i.note.trim() : null }))
    .filter((i) => i.value);
  return move === "supraordinate" ? { ...map, supraordinate: clean[0] ?? null } : { ...map, [move]: clean };
}

/** The ladder has four steps per part (three hints, then the answer). */
const STEPS_PER_PART = 4;

/** On the whole map, Help works on the first part whose hints haven't run out, in order (CONTRACTS.md
 * section 3), so the n-th hint of the session (from 0) is about this part. */
export const hintPartOf = (n: number): MoveId => MOVE_ORDER[Math.min(Math.floor(n / STEPS_PER_PART), MOVE_ORDER.length - 1)]!;

/** Help on the whole map: the first Help on a part costs a point, the next ones nothing more until the
 * answer itself. Null once every part has been revealed. */
export function wholeMapHelpLabelOf(hintsUsed: number): string | null {
  if (hintsUsed >= STEPS_PER_PART * MOVE_ORDER.length) return null;
  return hintsUsed % STEPS_PER_PART === 0 ? "Help · −1 pt" : "More Help";
}

const LABELED = new RegExp(`^(${MOVE_ORDER.map((m) => MOVE_LABEL[m]).join("|")}): ([\\s\\S]+)$`);

/** The whole-map evaluator's note on each part. The orchestrator writes each one as "Bigger group: …"
 * (submitMap in agents/src/orchestrator/advance.ts). */
export function partNotesOf(messages: readonly Message[]): Partial<Record<MoveId, string>> {
  const notes: Partial<Record<MoveId, string>> = {};
  for (const message of messages) {
    if (message.kind !== "feedback") continue;
    const match = LABELED.exec(message.text);
    const move = match && MOVE_ORDER.find((m) => MOVE_LABEL[m] === match[1]);
    if (move) notes[move] = match[2]!.trim();
  }
  return notes;
}
