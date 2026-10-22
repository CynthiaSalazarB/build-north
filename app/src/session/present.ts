// What the screens say and draw, as pure functions of the Turns and the transcript: the map's parts and their
// points, the light (points proved so far), the hint card, Help's price, the reveal, and the gap. No React here,
// so it's tested under Node. The rules behind the words are in CONTRACTS.md section 3.
import { MOVE_ORDER, type Item, type Mentefacto, type MoveId, type Quality, type Result, type Turn, type TurnBody } from "@build-north/agents";
import type { Entry } from "./transcript.ts";

/** The concepts Start offers (Lumente's board): what coding agents put in student projects. */
export const CONCEPTS = ["API", "JWT", "hashing", "database index", "cache", "rate limiting", "environment variable", "CORS"] as const;

/** The line from the learner's project that Start shows in amber, one dim line above and below. */
const CODE: Record<(typeof CONCEPTS)[number], string> = {
  API: "app.get('/api/users/:id', getUser);",
  JWT: "const token = jwt.sign({ sub: id }, KEY);",
  hashing: "const hash = await bcrypt.hash(pw, 10);",
  "database index": "db.users.createIndex({ email: 1 });",
  cache: "cache.set(id, user, { ttl: 60 });",
  "rate limiting": "app.use(rateLimit({ max: 100 }));",
  "environment variable": "const url = process.env.DATABASE_URL;",
  CORS: "app.use(cors({ origin: CLIENT_URL }));",
};

/** The editor block on Start: line 12 is the concept's; a typed concept gets a comment line instead. */
export function editorLinesOf(concept: string): { n: number; text: string; current: boolean }[] {
  const known = CONCEPTS.find((c) => c.toLowerCase() === concept.trim().toLowerCase());
  const line = known ? CODE[known] : `// explain: ${concept.trim() || "a concept from your project"}`;
  return [
    { n: 11, text: "const app = express();", current: false },
    { n: 12, text: line, current: true },
    { n: 13, text: "app.listen(PORT);", current: false },
  ];
}

/** The transcript since the latest question: the part the learner is on. */
export function sinceLastQuestion(entries: readonly Entry[]): Entry[] {
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i]!;
    if (entry.from === "app" && entry.message.kind === "question") return entries.slice(i);
  }
  return [...entries];
}

const turnOf = (entry: Entry) => /^turn-(\d+)-/.exec(entry.id)?.[1] ?? null;

/** The Turn that asked the latest question (with the feedback and the named move that came with it) and
 * everything after: what the conversation under the map shows. Earlier parts live on the map. */
export function currentPartOf(entries: readonly Entry[]): Entry[] {
  const part = sinceLastQuestion(entries);
  const question = part[0];
  if (!question || question.from !== "app") return part;
  const asked = turnOf(question);
  const start = entries.findIndex((e) => turnOf(e) === asked);
  return start >= 0 ? entries.slice(start) : part;
}

/** A hint that gave the answer away: the last step of the ladder (0 points). */
export const isReveal = (e: Entry) => e.from === "app" && e.message.kind === "hint" && e.message.hintStep === "reveal";

/** A revealed answer comes in the same Turn as the next question. The screen holds that question behind "Next
 * question" so the answer can be read first, as the board shows it: the reveal alone, or null when the latest
 * question didn't come with one. `key` names the hold, so the button opens it once. */
export function revealHoldOf(entries: readonly Entry[]): { key: string; entries: Entry[] } | null {
  const reveal = currentPartOf(entries).find(isReveal);
  return reveal ? { key: reveal.id, entries: [reveal] } : null;
}

const hintsFor = (entries: readonly Entry[], move: MoveId) =>
  entries.filter((e): e is Extract<Entry, { from: "app" }> => e.from === "app" && e.message.kind === "hint" && e.move === move);

/** True once the part on screen took a retry (feedback on a wrong answer) or a Help: it can then light 1 point
 * at most. A right answer's feedback comes with the next question, so it's never after the latest one. */
export function cappedOf(part: readonly Entry[]): boolean {
  const asked = part.findIndex((e) => e.from === "app" && e.message.kind === "question");
  return part.slice(asked + 1).some((e) => e.from === "app" && (e.message.kind === "feedback" || e.message.kind === "hint"));
}

/** Each finished part's points. The Turn carries them (`progress.points`); a Turn saved before that field
 * falls back to the result's rubric, or to the rule itself: 0 if revealed, 1 after a Help, else 2. */
export function pointsOf(turn: Turn, entries: readonly Entry[]): { move: MoveId; points: Quality }[] {
  if (turn.progress.points) return turn.progress.points;
  if (turn.result) return turn.result.rubric;
  return MOVE_ORDER.slice(0, turn.progress.movesDone).map((move) => {
    const hints = hintsFor(entries, move);
    const points: Quality = hints.some((h) => h.message.hintStep === "reveal") ? 0 : hints.length > 0 ? 1 : 2;
    return { move, points };
  });
}

/** The points proved so far: the light's stage. */
export const provedOf = (turn: Turn, entries: readonly Entry[]) => pointsOf(turn, entries).reduce((sum, p) => sum + p.points, 0);

/** A part's items: the bigger group is one item, the other parts are lists. */
export const itemsOf = (map: Mentefacto, move: MoveId): Item[] =>
  move === "supraordinate" ? (map.supraordinate ? [map.supraordinate] : []) : map[move];

/** What a filled part shows: the learner's words, with "not" in front of what it isn't. */
export function partTextOf(map: Mentefacto, move: MoveId): string | null {
  const values = itemsOf(map, move).map((item) => item.value.trim()).filter(Boolean);
  if (values.length === 0) return null;
  if (move !== "exclusion") return values.join(", ");
  return values.map((value) => (/^not\b/i.test(value) ? value : `not ${value}`)).join(", ");
}

export type PartState = "unasked" | "asked" | "lit" | "revealed";
export type Pip = "earned" | "open" | "capped" | "claimed" | "missed";
export type PartView = { move: MoveId; state: PartState; text: string | null; pips: [Pip, Pip] };

const pipsFor = (points: number, capped = false): [Pip, Pip] => [points >= 1 ? "earned" : "open", points >= 2 ? "earned" : capped ? "capped" : "open"];

/** The map during a session: finished parts lit with the learner's words (or revealed, 0 points), the part being
 * asked, and the parts still to come. `held` keeps the next part unasked while a reveal waits to be read. */
export function partsOf(turn: Turn, entries: readonly Entry[], { held = false, map = turn.mentefacto } = {}): PartView[] {
  const points = pointsOf(turn, entries);
  const capped = cappedOf(currentPartOf(entries));
  return MOVE_ORDER.map((move, i) => {
    const done = points.find((p) => p.move === move);
    if (done) {
      const revealed = hintsFor(entries, move).some((h) => h.message.hintStep === "reveal");
      return { move, state: revealed ? "revealed" : "lit", text: partTextOf(map, move), pips: pipsFor(done.points) };
    }
    if (!held && turn.phase === "move" && i === turn.progress.movesDone) return { move, state: "asked", text: null, pips: pipsFor(0, capped) };
    return { move, state: "unasked", text: null, pips: pipsFor(0) };
  });
}

/** The worked example's map: every part shown by the tutor, so none is lit and none scores. */
export const exampleParts = (map: Mentefacto): PartView[] =>
  MOVE_ORDER.map((move) => ({ move, state: "revealed", text: partTextOf(map, move), pips: ["open", "open"] }));

/** The result's map: proved points filled; the points the guess claimed but didn't prove are dashed coral,
 * taken from the first unproved points in the parts' order. */
export function resultPartsOf(result: Result, map: Mentefacto): PartView[] {
  let missed = Math.max(0, result.predictedScore - result.score);
  return MOVE_ORDER.map((move) => {
    const points = result.rubric.find((r) => r.move === move)?.points ?? 0;
    const pips = pipsFor(points).map((pip) => {
      if (pip !== "open" || missed === 0) return pip;
      missed -= 1;
      return "missed";
    }) as [Pip, Pip];
    const text = partTextOf(map, move);
    return { move, state: points === 0 && text ? "revealed" : text ? "lit" : "unasked", text, pips };
  });
}

/** The part that just lit: the latest Turn finished a part (it names the move) without revealing it. */
export function justLitOf(turn: Turn): MoveId | null {
  const named = turn.messages.some((m) => m.kind === "named_move");
  const revealed = turn.messages.some((m) => m.kind === "hint" && m.hintStep === "reveal");
  if (!named || revealed || turn.progress.movesDone === 0) return null;
  return MOVE_ORDER[turn.progress.movesDone - 1] ?? null;
}

/** The hint card's head: the nth Help on the part, of the three before the answer (0 points). The first hint on a
 * part is the one that costs the point, so only it shows the price. */
export function hintCardOf(n: number, first: boolean): { title: string; filled: number; note: string } {
  const step = Math.max(1, Math.min(3, n));
  return { title: `hint ${step} of 3${first ? " · −1 pt" : ""}`, filled: step, note: "this part can now light 1 point at most" };
}

/** What the firefly says under itself: Help costs a point only while the part could still score 2. After a
 * hint, Help is the "More help" button by the input instead. */
export function helpOf(part: readonly Entry[]): { tag: string; label: string; more: boolean } {
  // only what came after the question counts: a reveal before it ended the last part
  const since = part.slice(part.findIndex((e) => e.from === "app" && e.message.kind === "question") + 1);
  if (since.some((e) => e.from === "app" && e.message.kind === "hint")) return { tag: "help", label: "More help", more: true };
  if (since.some((e) => e.from === "learner")) return { tag: "help", label: "Help", more: false };
  return { tag: "help −1", label: "Help, costs a point", more: false };
}

/** "Before any help: in your own words, what is API?" becomes a short label over the question. */
export function eyebrowOf(text: string): { eyebrow: string | null; text: string } {
  const match = /^([^:?.]{3,40}):\s+(.+\?)$/.exec(text.trim());
  if (!match) return { eyebrow: null, text: text.trim() };
  const rest = match[2]!;
  return { eyebrow: match[1]!.toLowerCase(), text: rest.charAt(0).toUpperCase() + rest.slice(1) };
}

/** A question with `code` in it: the code goes in mono chips, as on the board. */
export function inlineCodeOf(text: string): { code: boolean; text: string }[] {
  return text
    .split(/(`[^`]+`)/)
    .filter(Boolean)
    .map((piece) => (piece.startsWith("`") && piece.endsWith("`") ? { code: true, text: piece.slice(1, -1) } : { code: false, text: piece }));
}

/** What a screen reader hears while a call is in flight; the firefly says "checking". */
export function waitingLineOf(body: TurnBody | null): string {
  if (!body) return "One moment.";
  if ("text" in body) return "Checking your answer.";
  if ("question" in body) return "Looking up the fact.";
  if ("mentefacto" in body) return "Checking your map.";
  if ("prediction" in body) return "Locking in your guess.";
  return body.action === "help" ? "Finding a hint." : "One moment.";
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The calibration gap as the result shows it: a signed number and one sentence, never a failure. */
export function gapOf(result: Pick<Result, "calibrationGap">): { sign: "+" | "−" | null; amount: number; sentence: string; over: boolean } {
  const gap = result.calibrationGap;
  if (gap > 0) return { sign: "+", amount: gap, sentence: `You felt ${plural(gap, "point")} surer than you were.`, over: true };
  if (gap < 0) return { sign: "−", amount: -gap, sentence: `You did ${plural(-gap, "point")} better than you felt.`, over: false };
  return { sign: null, amount: 0, sentence: "Your guess was exactly right.", over: false };
}

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

/** What to paste into a coding agent in your project, so its answer can go in your notes. */
export const AI_PROMPT =
  "List the technical concepts this project depends on that I should be able to explain, like JWT, CORS, a database index or RAG. For each one, write one line: the concept, then where the project uses it. Don't include code, file contents, keys, tokens, passwords, URLs or anyone's personal data.";
