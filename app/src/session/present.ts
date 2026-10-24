// What the screens say and draw, as pure functions of the Turns and the transcript: the map's parts and their
// points, the light (points proved so far), the hint card, Help's price, the reveal, and the gap. No React here,
// so it's tested under Node. The rules behind the words are in CONTRACTS.md section 3.
import { MOVE_LABEL, MOVE_ORDER, WORKED_EXAMPLE, type Item, type MemoryGap, type MemoryView, type Mentefacto, type Message, type MoveId, type Quality, type Result, type Turn, type TurnBody } from "@build-north/agents";
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

/** The part the learner is on: every entry since the Turn that started the latest move, and everything
 * after it, follow-up questions included (the exclusion's "what's the difference?" is asked on the same
 * move, so the answer before it stays on screen). The previous part's feedback and its name arrive in that
 * first Turn, before its question; `leadOf` says which of them the screen draws. Before the moves (the guess,
 * the first attempt, the example) the part is what came since the latest question. */
export function currentPartOf(entries: readonly Entry[]): Entry[] {
  const latest = [...entries].reverse().find((e): e is Extract<Entry, { from: "app" }> => e.from === "app");
  if (!latest || latest.phase !== "move") return sinceLastQuestion(entries);
  let start = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i]!;
    if (e.from === "app" && (e.phase !== "move" || e.move !== latest.move)) {
      start = i + 1;
      break;
    }
  }
  // the learner's last answer on the previous move came before this move's first Turn
  while (start < entries.length && entries[start]!.from !== "app") start += 1;
  return entries.slice(start);
}

/** What the screen draws above the part's question, of the lead that comes with it in the same Turn (`lead` in
 * agents/src/orchestrator/advance.ts): the evaluator's feedback on the part just finished, which since Oct 23
 * says what made the answer right and what was left out (DECISIONS.md). The move's name isn't repeated, and a
 * revealed answer was read while held: the map shows how that part ended. Empty before the moves, on the first
 * part, and on a part picked up after a reload whose Turn had no question. */
export function leadOf(part: readonly Entry[]): Extract<Entry, { from: "app" }>[] {
  const asked = part.findIndex((e) => e.from === "app" && e.message.kind === "question");
  if (asked < 0) return [];
  return part.slice(0, asked).filter((e): e is Extract<Entry, { from: "app" }> => e.from === "app" && e.message.kind === "feedback");
}

/** True for feedback that comes with a question of the same Turn: the exclusion's follow-up, which isn't a
 * retry and doesn't cap the part (agents/src/orchestrator/advance.ts). */
export function isFollowUpFeedback(entries: readonly Entry[], i: number): boolean {
  const entry = entries[i];
  const next = entries[i + 1];
  return (
    !!entry && entry.from === "app" && entry.message.kind === "feedback" && !!next && next.from === "app" && next.message.kind === "question" && turnOf(next) === turnOf(entry)
  );
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

/** The hints on one part. A level-5 hint comes with no part: the n-th of those is about hintPartOf(n). */
function hintsFor(entries: readonly Entry[], move: MoveId) {
  let wholeMap = 0;
  return entries.filter((e): e is Extract<Entry, { from: "app" }> => e.from === "app" && e.message.kind === "hint" && (e.move ?? hintPartOf(wholeMap++)) === move);
}

/** True once the part on screen took a retry (feedback on a wrong answer) or a Help: it can then light 1 point
 * at most. A right answer's feedback comes with the next question, so it's never after the latest one. */
export function cappedOf(part: readonly Entry[]): boolean {
  const asked = part.findIndex((e) => e.from === "app" && e.message.kind === "question");
  return part.some((e, i) => i > asked && e.from === "app" && (e.message.kind === "hint" || (e.message.kind === "feedback" && !isFollowUpFeedback(part, i))));
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

/** A part's items in the learner's words, with "not" in front of what it isn't. */
export function partItemsOf(map: Mentefacto, move: MoveId): string[] {
  const values = itemsOf(map, move).map((item) => item.value.trim()).filter(Boolean);
  if (move !== "exclusion") return values;
  return values.map((value) => (/^not\b/i.test(value) ? value : `not ${value}`));
}

/** What a filled part shows: the learner's words, with "not" in front of what it isn't. */
export function partTextOf(map: Mentefacto, move: MoveId): string | null {
  const values = partItemsOf(map, move);
  return values.length ? values.join(", ") : null;
}

export type PartState = "unasked" | "asked" | "lit" | "revealed";
export type Pip = "earned" | "open" | "capped" | "claimed" | "missed";
/** `pips` is null where nothing is scored yet: the whole map at level 5, until it's submitted. */
/** `badge` is a short line under the part's words: on the result, a part that moved up a level. */
export type PartView = { move: MoveId; state: PartState; text: string | null; pips: [Pip, Pip] | null; badge?: string | null; prompt?: string; context?: string | null };

const pipsFor = (points: number, capped = false): [Pip, Pip] => [points >= 1 ? "earned" : "open", points >= 2 ? "earned" : capped ? "capped" : "open"];

/** The map during a session: finished parts lit with the learner's words (or revealed, 0 points), the part being
 * asked (the Turn names it; a Turn without a name means the next one in order), and the parts still to come.
 * `held` keeps the next part unasked while a reveal waits to be read. */
export function partsOf(turn: Turn, entries: readonly Entry[], { held = false, map = turn.mentefacto } = {}): PartView[] {
  const points = pointsOf(turn, entries);
  const capped = cappedOf(currentPartOf(entries));
  const asked = !held && turn.phase === "move" ? (turn.move ?? MOVE_ORDER[turn.progress.movesDone] ?? null) : null;
  return MOVE_ORDER.map((move) => {
    const done = points.find((p) => p.move === move);
    // a finished part with no points was shown by Help (the reveal arrives in the Turn that names the next
    // move, so the points, not the hint's Turn, say which part it was), as on the result
    if (done) return { move, state: done.points === 0 ? "revealed" : "lit", text: partTextOf(map, move), pips: pipsFor(done.points) };
    if (move === asked) return { move, state: "asked", text: null, pips: pipsFor(0, capped) };
    return { move, state: "unasked", text: null, pips: pipsFor(0) };
  });
}

/** The worked example's map: every part shown by the tutor, so none is lit and none scores. */
export const exampleParts = (map: Mentefacto): PartView[] =>
  MOVE_ORDER.map((move) => ({ move, state: "revealed", text: partTextOf(map, move), pips: ["open", "open"] }));

/** "First: what kind of thing is a planet? "A thing" is too broad…" becomes the question and the reasoning after it. */
export function exampleQuestionOf(text: string): { question: string | null; rest: string } {
  const match = /^(?:\w+[:,]\s+)?([^?.]{3,80}\?)\s*(.*)$/s.exec(text.trim());
  if (!match) return { question: null, rest: text.trim() };
  const question = match[1]!;
  return { question: question.charAt(0).toUpperCase() + question.slice(1), rest: match[2]! };
}

/** One part of the worked example: the question it asks, what it puts on the map, and the reasoning. */
export type ExampleStep = { move: MoveId; question: string | null; items: string[]; reasoning: string };

/** The worked example's lines, grouped by the part each one builds (WORKED_EXAMPLE says which), so the screen
 * shows four steps, not eight paragraphs. Null when a line isn't one of its steps: the lines then show as they came. */
export function exampleStepsOf(lines: readonly string[]): ExampleStep[] | null {
  const steps: ExampleStep[] = [];
  for (const line of lines) {
    const step = WORKED_EXAMPLE.steps.find((s) => s.thinkAloud === line);
    if (!step) return null;
    const item = step.move === "exclusion" ? `not ${step.item.value}` : step.item.value;
    const last = steps.at(-1);
    if (last?.move === step.move) {
      last.items.push(item);
      last.reasoning = `${last.reasoning} ${line}`.trim();
      continue;
    }
    const { question, rest } = exampleQuestionOf(line);
    steps.push({ move: step.move, question, items: [item], reasoning: rest });
  }
  return steps.length > 0 ? steps : null;
}

/** The result's map shows actual points per area. A total prediction can't assign confidence to an area;
 * its gap is shown only on the overall result scale. */
export function resultPartsOf(result: Result, map: Mentefacto): PartView[] {
  return MOVE_ORDER.map((move) => {
    const points = result.rubric.find((r) => r.move === move)?.points ?? 0;
    const pips = pipsFor(points);
    const text = partTextOf(map, move);
    // the part moved up a level this session (CONTRACTS.md section 3): the help on it fades next time
    const up = result.masteryChanges.find((c) => c.move === move && c.to > c.from);
    const badge = up ? (up.to === 5 ? "you can do this alone now" : "less help next time") : null;
    return { move, state: points === 0 && text ? "revealed" : text ? "lit" : "unasked", text, pips, badge };
  });
}

/** One part of the result, the way the worked example reads: its points as the map shows them, the learner's
 * words and the whole-map evaluator's note. */
export type ResultStep = { move: MoveId; pips: [Pip, Pip]; points: number; items: string[]; note: string | null };

/** The result part by part. Empty when there are no notes: a session at levels 1 to 4 already went through it
 * part by part in the conversation. */
export function resultStepsOf(result: Result, map: Mentefacto, notes: Partial<Record<MoveId, string>>): ResultStep[] {
  if (!Object.values(notes).some(Boolean)) return [];
  return resultPartsOf(result, map).map((part) => ({
    move: part.move,
    pips: part.pips ?? ["open", "open"],
    points: result.rubric.find((r) => r.move === part.move)?.points ?? 0,
    items: partItemsOf(map, part.move),
    note: notes[part.move] || null,
  }));
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
  const asked = part.findIndex((e) => e.from === "app" && e.message.kind === "question");
  // a part picked up after a reload shows the latest Turn's lines only (saved.ts): no question, so no firefly to
  // tap. Help goes by the input instead, as it does after a hint.
  if (asked < 0 && part.some((e) => e.from === "app" && e.phase === "move")) return { tag: "help", label: "More help", more: true };
  // only what came after the question counts: a reveal before it ended the last part
  const since = part.slice(asked + 1);
  if (since.some((e) => e.from === "app" && e.message.kind === "hint")) return { tag: "help", label: "More help", more: true };
  // once a retry capped the part at 1 point, Help costs nothing more; a follow-up question isn't a retry
  if (cappedOf(part)) return { tag: "help", label: "Help", more: false };
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

/** The calibration gap as the result shows it (decided Oct 22): in words with its direction, under the guess
 * and the score side by side, never as a bare signed number a learner could read as a grade. `note` is the
 * line under it; `over` is a guess above the score. */
export function gapOf(result: Pick<Result, "calibrationGap">): { headline: string; note: string | null; over: boolean } {
  const gap = result.calibrationGap;
  if (gap > 0) return { headline: `You felt ${plural(gap, "point")} surer than you could explain.`, note: "That's normal: explaining is how you find out.", over: true };
  if (gap < 0) return { headline: `You knew more than you felt: ${plural(-gap, "point")} more.`, note: "You explained more than you expected in this session.", over: false };
  return { headline: "Your prediction matched your score.", note: "Your confidence matched what you could explain in this session.", over: false };
}

/** What a learner shares from the result: the concept, the guess against the score, the tagline and the address.
 * Numbers only, never the learner's words. `brand` comes from the theme (theme.ts needs React Native; this file
 * doesn't). */
export function shareLineOf(concept: string, result: Pick<Result, "predictedScore" | "score">, brand: { name: string; tagline: string; site: string }): string {
  return `${concept} on ${brand.name}: I guessed ${result.predictedScore} of 8 and proved ${result.score}. ${brand.tagline} ${brand.site}`;
}

/** How a part earns its points (CONTRACTS.md section 3, `pointsFor`), in one line for the screens. */
export const POINTS_RULE = "4 areas × 2 points = 8 points total. Points reflect what you can explain; your prediction records how confident you feel.";

export const SCORING = [
  { points: 2, text: "A clear, complete answer on your first try, without a hint." },
  { points: 1, text: "A partly correct answer, or a correct one after a retry or hint." },
  { points: 0, text: "An incorrect answer, an empty area, or an answer revealed to you." },
] as const;

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
export const filledOf = (map: Mentefacto): number => MOVE_ORDER.filter((move) => partTextOf(map, move) !== null).length;

/** Interface guidance only: suggest the first empty area, without judging an answer or using a hint. */
export const nextPartOf = (map: Mentefacto): MoveId | null => MOVE_ORDER.find((move) => partTextOf(map, move) === null) ?? null;

/** The whole map while the learner builds it: their words light a part (nothing is scored until they submit),
 * an answer Help revealed stays dim, and an empty part is a "?". */
export function wholeMapPartsOf(draft: Mentefacto, server: Mentefacto): PartView[] {
  return withMapQuestions(MOVE_ORDER.map((move): PartView => {
    const text = partTextOf(draft, move);
    const shown = itemsOf(server, move).length > 0;
    return { move, state: text ? (shown ? "revealed" : "lit") : "unasked", text, pips: null };
  }), draft);
}

/** Shared orientation for both modes, independent of the adaptive question, scores and hint ladder. */
export function withMapQuestions(parts: readonly PartView[], map: Mentefacto, example = false): PartView[] {
  return parts.map((part) => ({
    ...part,
    prompt: mapQuestionOf(part.move, map.concept),
    context: part.move === "exclusion" ? categoryContextOf(map, example ? "Example category" : "Your chosen category") : null,
  }));
}

/** Keep the guided answer field specific, without replacing an AI follow-up or scaffolding the first attempt. */
export function answerLabelOf(turn: Turn): string {
  if (turn.phase !== "move" || !turn.move) return "Your first explanation";
  switch (turn.move) {
    case "supraordinate": return mapQuestionOf(turn.move, turn.mentefacto.concept);
    case "exclusion": return "A similar concept in this category + the key difference";
    case "isoordinate": return "Defining features every example must have";
    case "infraordinate": return "Your grouping rule + at least two types using that rule";
  }
}

/** The fact desk's side of the session: the learner's questions, its answers, the hints. The opening instruction
 * is the firefly's line under the map, so it isn't repeated. */
export const deskOf = (entries: readonly Entry[]): Entry[] =>
  entries.filter((e) => e.from === "learner" || (e.from === "app" && e.phase === "move" && e.message.kind !== "question"));

/** What the phone's whole-map screen scrolls to the end for: a new line in the fact chat (a question, its answer, a
 * hint), a call in flight or a failure. The key changes with those and with nothing else, so an edit to the map,
 * which also grows the page, never pulls the learner away from it. The website layout follows its own column. */
export const chatKeyOf = (desk: readonly Entry[], pending: boolean, failure: boolean): string => `${desk.length}:${pending ? 1 : 0}:${failure ? 1 : 0}`;

/** The task stays visible even when the learner skips the optional worked example. */
export function mapQuestionOf(move: MoveId, concept: string): string {
  switch (move) {
    case "supraordinate": return `${concept} is a kind of…`;
    case "exclusion": return `What else belongs to the same category, but isn't ${concept}?`;
    case "isoordinate": return `What are the defining features of ${concept}?`;
    case "infraordinate": return `How would you classify ${concept}?`;
  }
}

/** Echo the learner's category without judging it or blocking out-of-order answers. */
export function categoryContextOf(map: Mentefacto, label = "Your chosen category"): string | null {
  const category = map.supraordinate?.value.trim();
  return category ? `${label}: ${category}` : null;
}

/** Task instructions only: no examples or answers for the learner's concept. */
export function partMeaningOf(move: MoveId, concept: string): string {
  switch (move) {
    case "supraordinate":
      return `Name the closest category that ${concept} belongs to.`;
    case "exclusion":
      return "Choose a similar concept in the same category, then explain the key difference.";
    case "isoordinate":
      return `List the features every example must have. Together, they should distinguish ${concept} from other things in the same category.`;
    case "infraordinate":
      return "Choose one way to group them. State your grouping rule, then name at least two types using that same rule.";
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

/** Which Help of the session (from 0) the i-th hint on screen is, of the `shown` hints the transcript holds. A
 * session picked up after a reload shows the latest Turn's lines only (saved.ts), so the transcript may start
 * mid-session: the count runs back from the Turn's own total, which every hint moved up by one. */
export const hintNumberOf = (hintsUsed: number, shown: number, i: number): number => Math.max(0, hintsUsed - shown) + i;

/** Help on the whole map, under the firefly: the first Help on a part costs a point, the next ones nothing more
 * until the answer itself. Null once every part has been revealed. */
export function wholeMapHelpOf(hintsUsed: number): { tag: string; label: string } | null {
  if (hintsUsed >= STEPS_PER_PART * MOVE_ORDER.length) return null;
  return firstOnPart(hintsUsed) ? { tag: "help −1", label: "Help, costs a point" } : { tag: "help", label: "More help" };
}

const LABELED = new RegExp(`^(${MOVE_ORDER.map((m) => MOVE_LABEL[m]).join("|")}): ([\\s\\S]+)$`);

/** The whole-map evaluator's note on each part. The orchestrator writes each one as "Bigger group: …"
 * (submitMap in agents/src/orchestrator/advance.ts). */
/** What came with the result and after it: the result's Turn (the part notes are there), then the coach's
 * words, which come in their own Turn. */
export const resultMessagesOf = (entries: readonly Entry[]): Message[] =>
  entries.flatMap((e) => (e.from === "app" && e.phase === "result" ? [e.message] : []));

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

/** Levels 1 to 4: the evaluator's words on the part answered last come in the result's own Turn, and the result
 * opens at once, so the result shows that part with them (Cynthia, Oct 23: the last answer never got its "that
 * works"). The part is the one the last Turn before the result asked. Nothing after a reveal (no words came) and
 * nothing in a self-test, whose notes are labeled (`partNotesOf`). */
export function lastPartNoteOf(entries: readonly Entry[]): Partial<Record<MoveId, string>> {
  const app = entries.filter((e): e is Extract<Entry, { from: "app" }> => e.from === "app");
  const words = app.find((e) => e.phase === "result" && e.message.agent === "evaluator" && e.message.kind === "feedback" && !LABELED.test(e.message.text));
  const asked = [...app].reverse().find((e) => e.phase !== "result" && e.move !== null);
  return words && asked?.move ? { [asked.move]: words.message.text } : {};
}

/** What closed each part of a guided session, so a lit or revealed area can open and be read again (Cynthia, Oct
 * 24): the evaluator's words on the right answer, or the answer shown to the learner. A part closes where its name
 * comes (`named_move`); the part is the one the last question asked, and the words are the last feedback or reveal
 * before the name. A session picked up after a reload holds only its latest Turn, so earlier parts have none. */
export function partClosingsOf(entries: readonly Entry[]): Partial<Record<MoveId, { text: string; revealed: boolean }>> {
  const closings: Partial<Record<MoveId, { text: string; revealed: boolean }>> = {};
  let asking: MoveId | null = null;
  let words: { text: string; revealed: boolean } | null = null;
  for (const e of entries) {
    if (e.from !== "app") continue;
    const { message } = e;
    if (message.kind === "question") {
      if (e.move) asking = e.move;
      words = null;
    } else if (message.kind === "feedback" && message.agent === "evaluator") words = { text: message.text, revealed: false };
    else if (message.kind === "hint" && message.hintStep === "reveal") words = { text: message.text, revealed: true };
    else if (message.kind === "named_move" && asking && words) {
      closings[asking] = words;
      words = null;
    }
  }
  return closings;
}

/** What to paste into a coding agent in your project, so its answer can go in your notes. */
/** The dim line under a hint or the coach's words with memory on (#112): the facts the text relies on, in their
 * own sentences, which code wrote from the session's numbers. */
export function rememberedLineOf(sources: readonly { text: string }[]): string {
  return `From what Lumente remembers: ${sources.map((source) => source.text.trim()).join(" ")}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Oct 23" from an ISO date, in the device's time zone; "" for a date that doesn't parse. */
export function shortDateOf(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export type MemoryMoveLines = { move: MoveId; label: string; now: string; history: string[]; reads: number };
export type MemoryConceptLines = { concept: string; moves: MemoryMoveLines[]; gap: string | null };

const gapLineOf = (gap: MemoryGap) => `${shortDateOf(gap.at)}: you guessed ${gap.predictedScore} and proved ${gap.score}`;

/** The Memory sheet's words for one concept: per part the level now and how it got there, newest first, how many
 * times the AI read it, and the latest guess against the score beside the one before. */
export function memoryConceptOf(entry: MemoryView["concepts"][number]): MemoryConceptLines {
  const moves = entry.moves.map((move) => ({
    move: move.move,
    label: MOVE_LABEL[move.move],
    now: move.level === null ? "no level yet" : `level ${move.level}`,
    history: move.history.map((row) => (row.until ? `level ${row.level} from ${shortDateOf(row.since)} to ${shortDateOf(row.until)}` : `level ${row.level} since ${shortDateOf(row.since)}`)),
    reads: move.history.reduce((count, row) => count + row.readBy, 0),
  }));
  const { latest, previous } = entry.gap;
  const gap = latest ? `Last time, ${gapLineOf(latest)}.${previous ? ` Before, ${gapLineOf(previous)}.` : ""}` : null;
  return { concept: entry.concept, moves, gap };
}

export const AI_PROMPT =
  "List the technical concepts this project depends on that I should be able to explain, like JWT, CORS, a database index or RAG. For each one, write one line: the concept, then where the project uses it. Don't include code, file contents, keys, tokens, passwords, URLs or anyone's personal data.";
