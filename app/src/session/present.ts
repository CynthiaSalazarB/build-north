// What the screens say, as pure functions of the Turns and the transcript: the checks list, the hint card,
// the price on Help, the box's corners, the calibration gap and where it came from. No React here, so it's
// tested under Node. The rules behind the words are in CONTRACTS.md section 3.
import { MOVE_LABEL, MOVE_ORDER, type HintStep, type Item, type Mentefacto, type Message, type MoveId, type Result, type Turn, type TurnBody } from "@build-north/agents";
import type { Entry } from "./transcript.ts";

/** "jwt.spec": the session's concept as the file the top bar shows. */
export const fileNameOf = (concept: string) => `${concept.trim().toLowerCase().replace(/\s+/g, "-")}.spec`;

/** The hint ladder is nudge, hint, partial, reveal: three hints, then the answer (0 points). The first hint
 * on a part is the one that costs the point, so only it shows the price. */
export function hintCardOf(step: HintStep | undefined, first: boolean): { title: string; note: string } {
  const capped = "this part can now score 1 point at most";
  const price = first ? " · −1 pt" : "";
  switch (step) {
    case "nudge":
      return { title: `hint 1/3${price}`, note: capped };
    case "hint":
      return { title: `hint 2/3${price}`, note: capped };
    case "partial":
      return { title: `hint 3/3${price}`, note: capped };
    case "reveal":
      return { title: "the answer", note: "this part scores 0 now. its answer is on your map" };
    default:
      return { title: `hint${price}`, note: capped };
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

/** What the session screen shows: the Turn that asked the latest question (with the feedback and the named
 * move that came with it) and everything after. Earlier parts live in the checks list. */
export function currentPartOf(entries: readonly Entry[]): Entry[] {
  const part = sinceLastQuestion(entries);
  const question = part[0];
  if (!question || question.from !== "app") return part;
  const turnOf = (id: string) => /^turn-(\d+)-/.exec(id)?.[1];
  const asked = turnOf(question.id);
  const start = entries.findIndex((e) => turnOf(e.id) === asked);
  return start >= 0 ? entries.slice(start) : part;
}

/** Help shows its price. A part scores 2 only on the first try with no Help, so the first Help costs a point;
 * after a wrong answer or a hint it costs nothing more until the answer itself. */
export function helpLabelOf(part: readonly Entry[]): string {
  if (part.some((e) => e.from === "app" && e.message.kind === "hint")) return "more help";
  if (part.some((e) => e.from === "learner")) return "help";
  return "help · −1 pt";
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

/** "Before any help: in your own words, what is democracy?" becomes a short label over the question. */
export function eyebrowOf(text: string): { eyebrow: string | null; text: string } {
  const match = /^([^:?.]{3,40}):\s+(.+\?)$/.exec(text.trim());
  if (!match) return { eyebrow: null, text: text.trim() };
  const rest = match[2]!;
  return { eyebrow: match[1]!, text: rest.charAt(0).toUpperCase() + rest.slice(1) };
}

/** "3/4" while the learner works on a part. */
export function partLabelOf(turn: Turn): string | null {
  if (turn.phase !== "move" || !turn.move) return null;
  return `${Math.min(turn.progress.movesDone + 1, turn.progress.movesTotal)}/${turn.progress.movesTotal}`;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The hints on one part. A level-5 hint comes with no part: the n-th of those is about hintPartOf(n). */
function hintsFor(entries: readonly Entry[], move: MoveId) {
  let wholeMap = 0;
  return entries.filter((e): e is Extract<Entry, { from: "app" }> => e.from === "app" && e.message.kind === "hint" && (e.move ?? hintPartOf(wholeMap++)) === move);
}

export type Check = { move: MoveId; label: string; state: "done" | "hinted" | "now" | "queued"; meta: string };

/** The checks list (round 8), one row per part, in GitHub's words: queued, in progress, then how it ended.
 * Scores only come with the result, so a finished part says "done" and how much help it took. */
export function checksOf(turn: Turn, entries: readonly Entry[]): Check[] {
  const { movesDone } = turn.progress;
  return MOVE_ORDER.map((move, i) => {
    const label = MOVE_LABEL[move];
    const hints = hintsFor(entries, move);
    if (i < movesDone) {
      if (hints.some((h) => h.message.hintStep === "reveal")) return { move, label, state: "hinted", meta: "answer shown" };
      if (hints.length > 0) return { move, label, state: "hinted", meta: `done · ${plural(hints.length, "hint")}` };
      return { move, label, state: "done", meta: "done" };
    }
    if (i === movesDone && turn.phase === "move") return { move, label, state: "now", meta: "in progress" };
    return { move, label, state: "queued", meta: "queued" };
  });
}

/** What the screen says while a call is in flight. */
export function waitingLineOf(body: TurnBody | null): string {
  if (!body) return "one moment…";
  if ("text" in body) return "checking your answer…";
  if ("question" in body) return "asking the fact desk…";
  if ("mentefacto" in body) return "checking your map…";
  if ("prediction" in body) return "opening the box…";
  return body.action === "help" ? "finding a hint…" : "one moment…";
}

/** The calibration gap as the result shows it: a signed number and one sentence, never a failure. */
export function gapOf(result: Pick<Result, "calibrationGap">): { sign: "+" | "−" | null; amount: number; sentence: string; over: boolean } {
  const gap = result.calibrationGap;
  if (gap > 0) return { sign: "+", amount: gap, sentence: `You felt ${plural(gap, "point")} surer than you were.`, over: true };
  if (gap < 0) return { sign: "−", amount: -gap, sentence: `You did ${plural(-gap, "point")} better than you felt.`, over: false };
  return { sign: null, amount: 0, sentence: "Your guess was exactly right.", over: false };
}

/** A corner of the box: expected (the guess), proved, felt sure (guessed but not proved), or empty. */
export type CornerState = "expected" | "proved" | "felt" | "empty";

/** Point n of 8 is corner `order[n - 1]` (the theme's box.cornerOrder). */
function cornersBy(order: readonly number[], stateOf: (point: number) => CornerState) {
  return Object.fromEntries(order.map((corner, i) => [corner, stateOf(i + 1)])) as Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, CornerState>;
}

/** The guess: the first `guess` corners are ringed. */
export const guessCornersOf = (order: readonly number[], guess: number) => cornersBy(order, (n) => (n <= guess ? "expected" : "empty"));

/** The result: proved points are filled, the ones felt sure but not proved ringed in coral, the rest empty. */
export const resultCornersOf = (order: readonly number[], predicted: number, score: number) =>
  cornersBy(order, (n) => (n <= score ? "proved" : n <= predicted ? "felt" : "empty"));

/** A part's items: the bigger group is one item, the other parts are lists. */
export const itemsOf = (map: Mentefacto, move: MoveId): Item[] =>
  move === "supraordinate" ? (map.supraordinate ? [map.supraordinate] : []) : map[move];

export type Miss = { move: MoveId; label: string; meta: string; detail: string | null };

/** "Where the gap came from": every part that scored under 2, with how much help it took and what ended up on
 * the map for it (the learner's accepted answer, or the answer Help revealed). `notes` are the whole-map
 * evaluator's words per part, which win when there are any. */
export function missesOf(result: Result, entries: readonly Entry[], map: Mentefacto, notes: Partial<Record<MoveId, string>> = {}): Miss[] {
  return result.rubric
    .filter((row) => row.points < 2)
    .map(({ move, points }) => {
      const hints = hintsFor(entries, move);
      const help = hints.some((h) => h.message.hintStep === "reveal") ? " · answer shown" : hints.length > 0 ? ` · ${plural(hints.length, "hint")}` : "";
      const onMap = itemsOf(map, move).map((i) => (i.note ? `${i.value}: ${i.note}` : i.value));
      return { move, label: MOVE_LABEL[move], meta: `${points}/2${help}`, detail: notes[move] ?? (onMap.length > 0 ? onMap.join("; ") : null) };
    });
}

/** The parts done alone: 2 of 2, first try, no Help. */
export const aloneOf = (result: Result): string[] => result.rubric.filter((row) => row.points === 2).map((row) => MOVE_LABEL[row.move]);

/** Pasted notes go to Claude, so the start screen stops at anything that looks like a key, a token or a
 * password: a known key's shape, or a password, secret, token or key name set to a value with a digit in it
 * (so "token: signed in auth/login.ts" still passes). A net, not proof: it catches the common shapes. */
const KEY_SHAPE =
  /\b(?:sk-[A-Za-z0-9_-]{16,}|sk_(?:test|live)_[A-Za-z0-9]{16,}|sp-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|xox[abprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{30,}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})|-----BEGIN [A-Z ]*PRIVATE KEY-----/;
const SET_SECRET = /(?:pass(?:word|wd)?|secret|token|api[_-]?key|_key)\s*[:=]\s*["']?(?=[^\s"']*\d)[^\s"']{8,}/i;

/** The first line (from 1) of the notes that looks like it has a secret, so the warning can say where. */
export function secretLineOf(text: string): number | null {
  const i = text.split("\n").findIndex((line) => KEY_SHAPE.test(line) || SET_SECRET.test(line));
  return i < 0 ? null : i + 1;
}

// ---------- Level 5: the learner builds the whole map and asks the fact desk ----------

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

/** The n-th hint of the session (from 0) is the first on its part, the one that costs the point. */
export const firstOnPart = (n: number) => n % STEPS_PER_PART === 0;

/** Help on the whole map: the first Help on a part costs a point, the next ones nothing more until the
 * answer itself. Null once every part has been revealed. */
export function wholeMapHelpLabelOf(hintsUsed: number): string | null {
  if (hintsUsed >= STEPS_PER_PART * MOVE_ORDER.length) return null;
  return firstOnPart(hintsUsed) ? "help · −1 pt" : "more help";
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

/** What to paste into a coding agent in your project, so its answer can go in your notes. */
export const AI_PROMPT =
  "List the technical concepts this project depends on that I should be able to explain, like JWT, CORS, a database index or RAG. For each one, write one line: the concept, then where the project uses it. Don't include code, file contents, keys, tokens, passwords, URLs or anyone's personal data.";
