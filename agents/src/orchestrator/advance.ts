// The orchestrator (#3, CONTRACTS.md section 3). Given the session, the learner's mastery and one input,
// it decides who speaks next, calls agents only through `callAgent`, applies the ladder rules, and
// returns the new state and the Turn. It never touches the database or the network itself.
import {
  type Advance,
  type AgentContext,
  type CallAgent,
  CoachOutput,
  EvaluatorOutput,
  type EvaluatorIssue,
  FACT_DESK_ANSWER_REDIRECT,
  FACT_DESK_REDIRECT,
  FactDeskOutput,
  HintGiverOutput,
  type HintStep,
  type Item,
  type Level,
  type Mastery,
  type Mentefacto,
  type Message,
  MOVE_LABEL,
  MOVE_ORDER,
  type MoveId,
  type Quality,
  QuestionerOutput,
  type Result,
  type Session,
  TESTING_QUESTION_TYPES,
  type Turn,
  type TurnInput,
  WholeMapEvaluatorOutput,
} from "../contracts.ts";
import { WORKED_EXAMPLE } from "../worked-example.ts";
import {
  calibrationGap,
  effectiveLevel,
  feedbackNudges,
  hintStepAfter,
  hintStepFor,
  isWholeMap,
  levelAfter,
  levelOf,
  nextMove,
  pointsFor,
  REVEALED,
} from "./rules.ts";
import * as text from "./texts.ts";

/** The input doesn't fit the session's phase (for example, a map submitted during the worked example).
 * Nothing changed; the API answers 409 with the session's latest Turn. */
export class UnexpectedInput extends Error {}

/** What one step decides; `advance` turns it into a Turn. */
type Step = {
  messages: Message[];
  expects: Turn["expects"];
  level: Level | null;
  scaffold?: Turn["scaffold"];
  example?: Mentefacto | null;
};

export const advance: Advance = async (state, input, callAgent) => {
  const session = structuredClone(state.session);
  const mastery = structuredClone(state.mastery);
  try {
    const step = await route(session, mastery, input, callAgent);
    session.turn += 1;
    const turn = toTurn(session, step);
    session.lastTurn = turn;
    return { session, mastery, turn };
  } catch (error) {
    if (error instanceof UnexpectedInput) throw error;
    // An agent failed or Claude refused: nothing changes, and the app shows a retry (CONTRACTS.md section 5).
    return { session: state.session, mastery: state.mastery, turn: errorTurn(state.session, error) };
  }
};

async function route(s: Session, m: Mastery, input: TurnInput, call: CallAgent): Promise<Step> {
  if ("action" in input && input.action === "start") {
    if (s.turn !== 0) throw new UnexpectedInput("The session has already started");
    s.phase = "predict";
    return { messages: [say("app", "question", text.prediction(s.concept))], expects: "prediction", level: null };
  }
  switch (s.phase) {
    case "predict":
      if ("prediction" in input) return afterPrediction(s, m, input.prediction);
      break;
    case "attempt":
      if ("text" in input) return afterAttempt(s, m, input.text, call);
      break;
    case "example":
      if ("action" in input && input.action === "continue") return afterExample(s, m, call);
      break;
    case "move":
      if (s.move === null) {
        if ("question" in input) return askFactDesk(s, input.question, call);
        if ("action" in input && input.action === "help") return wholeMapHelp(s, call);
        if ("mentefacto" in input) return submitMap(s, m, input.mentefacto, call);
      } else {
        if ("text" in input) return answer(s, m, s.move, input.text, call);
        if ("action" in input && input.action === "help") return help(s, m, s.move, call);
      }
      break;
    case "result":
      if ("action" in input && input.action === "continue" && s.result?.coach === null) return coachSession(s, call);
      break;
  }
  throw new UnexpectedInput(`${Object.keys(input).join(", ")} doesn't fit the ${s.phase} phase`);
}

// ---------- Before the moves ----------

function afterPrediction(s: Session, m: Mastery, prediction: number): Step {
  s.predictedScore = prediction;
  if (isWholeMap(s.mode, m)) {
    s.phase = "move";
    s.move = null;
    return { messages: [say("app", "question", text.wholeMap(s.concept))], expects: "map", level: 5 };
  }
  s.phase = "attempt";
  return { messages: [say("app", "question", text.attempt(s.concept))], expects: "text", level: null };
}

async function afterAttempt(s: Session, m: Mastery, attempt: string, call: CallAgent): Promise<Step> {
  s.firstAttempt = attempt;
  if (!m.moves.some((move) => move.level === 1)) return startMove(s, m, MOVE_ORDER[0]!, [], call);
  s.phase = "example";
  return {
    messages: [
      say("app", "example", text.exampleIntro(s.concept, WORKED_EXAMPLE.exampleConcept)),
      ...WORKED_EXAMPLE.steps.map((step) => say("example_builder", "example", step.thinkAloud)),
    ],
    expects: "continue",
    level: null,
    example: workedExampleMap(),
  };
}

/** Watching the worked example moves every move at level 1 to level 2. */
async function afterExample(s: Session, m: Mastery, call: CallAgent): Promise<Step> {
  for (const move of m.moves) if (move.level === 1) move.level = 2;
  return startMove(s, m, MOVE_ORDER[0]!, [], call);
}

// ---------- One move at a time (levels 2 to 4) ----------

async function startMove(s: Session, m: Mastery, move: MoveId, lead: Message[], call: CallAgent): Promise<Step> {
  s.phase = "move";
  s.move = move;
  s.hintStep = null;
  s.recent = [];
  s.retries = 0;
  s.lastIssue = "none";
  const level = effectiveLevel(levelOf(m, move));
  const ahead = s.nextQuestion?.move === move && s.nextQuestion.level === level ? s.nextQuestion : null;
  s.nextQuestion = null;
  let question: Message;
  let scaffold: Turn["scaffold"] = null;
  if (level >= 4) {
    question = say("app", "question", text.namedOnly(move, s.concept));
  } else {
    const q = ahead ?? QuestionerOutput.parse(await call("questioner", context(s, move, level)));
    question = say("questioner", "question", q.question);
    if (level === 3) scaffold = q.scaffold;
  }
  s.recent.push({ from: "app", text: question.text });
  return { messages: [...lead, question], expects: "text", level, scaffold };
}

/** Asks the next move's question while the evaluator or the hint giver works on this one, so the turn
 * that ends a move waits for one Claude call instead of two in a row. Asked once per move, from the map
 * as it is before this answer. If it fails, startMove asks as before. */
async function askNextQuestionAhead(s: Session, m: Mastery, move: MoveId, call: CallAgent): Promise<void> {
  const next = nextMove(move);
  if (!next || s.nextQuestion?.move === next) return;
  const level = effectiveLevel(levelOf(m, next));
  if (level >= 4) return;
  const input = structuredClone({ ...context(s, next, level), recent: [] });
  try {
    const q = QuestionerOutput.parse(await call("questioner", input));
    s.nextQuestion = { move: next, level, ...q };
  } catch {
    // Nothing to undo: startMove calls the questioner itself.
  }
}

async function answer(s: Session, m: Mastery, move: MoveId, learnerText: string, call: CallAgent): Promise<Step> {
  const level = effectiveLevel(levelOf(m, move));
  const [output] = await Promise.all([
    call("evaluator", { ...context(s, move, level), answer: learnerText }),
    askNextQuestionAhead(s, m, move, call),
  ]);
  const ev = EvaluatorOutput.parse(output);
  merge(s.mentefacto, move, ev.accepted);
  s.recent.push({ from: "learner", text: learnerText }, { from: "app", text: ev.feedback });
  s.lastIssue = ev.issue;
  const feedback = say("evaluator", "feedback", ev.feedback);

  if (ev.verdict === "correct") {
    return finishMove(s, m, move, ev.quality, [feedback, say("app", "named_move", text.named(move, false))], call);
  }
  // An exclusion without its difference gets one follow-up question: not a retry, not a hint.
  const undifferentiated = move === "exclusion" && ev.verdict === "partial" ? ev.accepted.find((i) => i.note === null) : undefined;
  if (undifferentiated) {
    const followUp = say("app", "question", text.exclusionDifference(s.concept, undifferentiated.value));
    s.recent.push({ from: "app", text: followUp.text });
    return { messages: [feedback, followUp], expects: "text", level };
  }
  // No hint giver here: the learner tries again, and the move is capped at 1 point. At levels 2 and 3
  // the feedback ends with a nudge, the ladder's first step, so a Help goes on from "hint".
  s.retries += 1;
  if (feedbackNudges(level) && s.hintStep === null) s.hintStep = "nudge";
  return { messages: [feedback], expects: "text", level };
}

/** Hints only come from Help, and every Help counts. */
async function help(s: Session, m: Mastery, move: MoveId, call: CallAgent): Promise<Step> {
  const level = effectiveLevel(levelOf(m, move));
  const lastAnswer = [...s.recent].reverse().find((e) => e.from === "learner")?.text ?? "";
  const [{ message, revealed }] = await Promise.all([
    hint(s, move, level, hintStepAfter(s.hintStep), lastAnswer, s.lastIssue, call),
    askNextQuestionAhead(s, m, move, call),
  ]);
  if (revealed) {
    return finishMove(s, m, move, 0, [message, say("app", "named_move", text.named(move, true))], call);
  }
  return { messages: [message], expects: "text", level };
}

/** One hint giver call for `step` of the ladder on `move`. */
async function hint(
  s: Session,
  move: MoveId,
  level: Level,
  step: HintStep,
  lastAnswer: string,
  issue: EvaluatorIssue,
  call: CallAgent,
): Promise<{ message: Message; revealed: boolean }> {
  const h = HintGiverOutput.parse(await call("hint_giver", { ...context(s, move, level), step, lastAnswer, issue }));
  s.hintsPerMove[move] += 1;
  s.hintStep = step;
  s.recent.push({ from: "app", text: h.text });
  if (step === "reveal" && h.revealed) merge(s.mentefacto, move, [h.revealed]);
  return { message: { ...say("hint_giver", "hint", h.text), hintStep: step }, revealed: step === "reveal" };
}

async function finishMove(s: Session, m: Mastery, move: MoveId, quality: Quality, lead: Message[], call: CallAgent): Promise<Step> {
  record(s, m, move, quality, true);
  const next = nextMove(move);
  return next ? startMove(s, m, next, lead, call) : finishSession(s, lead);
}

// ---------- Whole map (level 5 on every move, or a test session) ----------

async function askFactDesk(s: Session, question: string, call: CallAgent): Promise<Step> {
  const fd = FactDeskOutput.parse(
    await call("fact_desk", { concept: s.concept, material: s.material, mentefacto: s.mentefacto, question }),
  );
  // An answer typed in the chat isn't a question: it says where answers go, whatever the model wrote (so it
  // can never confirm one), and it isn't counted (Oct 22).
  if (fd.questionType === "states_an_answer") return { messages: [say("fact_desk", "redirect", FACT_DESK_ANSWER_REDIRECT)], expects: "map", level: 5 };
  s.questions.asked += 1;
  if (TESTING_QUESTION_TYPES.includes(fd.questionType)) s.questions.testing += 1;
  // Decision 17: a redirect always says the same words, whatever the model wrote.
  const message = fd.kind === "redirect" ? say("fact_desk", "redirect", FACT_DESK_REDIRECT) : say("fact_desk", "fact", fd.answer);
  return { messages: [message], expects: "map", level: 5 };
}

/** Help on the whole map works on the first move whose hints haven't run out, in move order. */
async function wholeMapHelp(s: Session, call: CallAgent): Promise<Step> {
  const move = MOVE_ORDER.find((mv) => s.hintsPerMove[mv] < REVEALED);
  if (!move) return { messages: [say("app", "feedback", text.noMoreHelp)], expects: "map", level: 5 };
  s.recent = [];
  const { message } = await hint(s, move, 5, hintStepFor(s.hintsPerMove[move]), "", "none", call);
  return { messages: [message], expects: "map", level: 5 };
}

async function submitMap(s: Session, m: Mastery, map: Mentefacto, call: CallAgent): Promise<Step> {
  s.mentefacto = { ...map, concept: s.concept };
  const full = WholeMapEvaluatorOutput.parse(
    await call("evaluator_full", { concept: s.concept, material: s.material, mentefacto: s.mentefacto }),
  );
  const feedback: Message[] = [];
  for (const move of MOVE_ORDER) {
    const row = full.rubric.find((r) => r.move === move);
    // In the whole map a move counts as done (for levels and unassisted successes) when its quality is 2.
    record(s, m, move, row?.quality ?? 0, (row?.quality ?? 0) === 2);
    if (row) feedback.push(say("evaluator", "feedback", `${MOVE_LABEL[move]}: ${row.feedback}`));
  }
  return finishSession(s, feedback);
}

// ---------- Ending ----------

/** Points, mastery and the move log for one finished move. Mastery never changes in a test session.
 * `s.retries` belongs to the move being finished; on the whole map it stays 0 (no per-move answers). */
function record(s: Session, m: Mastery, move: MoveId, quality: Quality, done: boolean): void {
  const hints = s.hintsPerMove[move];
  const retries = s.retries;
  const from = levelOf(m, move);
  const to = s.mode === "test" || !done ? from : levelAfter(from, hints + retries);
  if (s.mode !== "test") {
    const row = m.moves.find((r) => r.move === move);
    if (row) {
      row.level = to;
      if (done && hints + retries === 0) row.unassistedSuccesses += 1;
    }
  }
  s.moveLog.push({ move, points: pointsFor(quality, hints, retries), hints, retries, from, to });
}

function finishSession(s: Session, lead: Message[]): Step {
  const rubric = MOVE_ORDER.map((move) => ({ move, points: s.moveLog.find((r) => r.move === move)?.points ?? 0 }));
  const score = rubric.reduce((sum, r) => sum + r.points, 0);
  const predictedScore = s.predictedScore ?? 0;
  const hintsUsed = totalHints(s);
  const withoutCoach: Omit<Result, "coach"> = {
    predictedScore,
    score,
    maxScore: 8,
    calibrationGap: calibrationGap(predictedScore, score),
    hintsUsed,
    rubric,
    masteryChanges: s.moveLog.filter((r) => r.to !== r.from).map(({ move, from, to }) => ({ move, from, to })),
    questions: { ...s.questions },
  };
  // The result shows first: every number is code's, so it's ready now. The coach's words come in the next
  // Turn, which the app asks for at once with `continue` (decided Oct 22: the last answer used to wait for two
  // calls in a row, 9.2 s against the 8 s ceiling).
  s.result = { ...withoutCoach, coach: null };
  s.phase = "result";
  s.move = null;
  s.recent = [];
  return { messages: lead, expects: "continue", level: null };
}

/** The coach's message on the result already shown, which ends the session. */
async function coachSession(s: Session, call: CallAgent): Promise<Step> {
  const { coach: _none, ...result } = s.result!;
  let coach: NonNullable<Result["coach"]>;
  try {
    coach = CoachOutput.parse(await call("coach", { concept: s.concept, mentefacto: s.mentefacto, result }));
  } catch {
    // The coach is words only; the numbers are already in the result, so a fixed line will do (#44).
    const weakest = result.score < 8 ? [...result.rubric].sort((a, b) => a.points - b.points)[0]!.move : null;
    coach = { message: text.coachFallback(result.score, result.hintsUsed, weakest), nextFocus: weakest };
  }
  s.result = { ...result, coach: { message: coach.message, nextFocus: coach.nextFocus } };
  return { messages: [say("coach", "summary", coach.message)], expects: "none", level: null };
}

// ---------- Helpers ----------

function say(agent: Message["agent"], kind: Message["kind"], textValue: string): Message {
  return { agent, kind, text: textValue };
}

function context(s: Session, move: MoveId, level: Level): AgentContext {
  return { concept: s.concept, material: s.material, move, level, mentefacto: s.mentefacto, recent: [...s.recent] };
}

function totalHints(s: Session): number {
  return MOVE_ORDER.reduce((sum, move) => sum + s.hintsPerMove[move], 0);
}

function progressOf(s: Session): Turn["progress"] {
  return {
    movesDone: s.moveLog.length,
    movesTotal: MOVE_ORDER.length,
    hintsUsed: totalHints(s),
    points: s.moveLog.map(({ move, points }) => ({ move, points })),
  };
}

const words = (item: Item) => item.value.trim().toLowerCase().split(/\s+/);
const sameItem = (a: Item, b: Item) => words(a).join(" ") === words(b).join(" ");
/** `sharper` keeps every word of `vaguer` and adds more. */
const refines = (sharper: Item, vaguer: Item) => {
  const w = words(sharper);
  return words(vaguer).every((x) => w.includes(x)) && w.length > words(vaguer).length;
};

/** Writes accepted items on the map: the bigger group is replaced, list items are added or completed.
 * Whatever the model sent, a note only survives on an exclusion, and "a; b" becomes two items. */
function merge(map: Mentefacto, move: MoveId, accepted: Item[]): void {
  const items = accepted.flatMap((i) =>
    i.value
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => ({ value, note: move === "exclusion" ? i.note : null })),
  );
  if (move === "supraordinate") {
    const last = items.at(-1);
    if (last) map.supraordinate = last;
    return;
  }
  const list = map[move];
  for (const item of items) {
    const existing = list.find((i) => sameItem(i, item));
    if (existing) {
      if (item.note) existing.note = item.note;
      continue;
    }
    // A sharper version of an item already on the map replaces it ("elections" → "free elections").
    const vaguer = list.findIndex((i) => refines(item, i));
    if (vaguer >= 0) list[vaguer] = item;
    else list.push(item);
  }
}

function workedExampleMap(): Mentefacto {
  const map: Mentefacto = {
    concept: WORKED_EXAMPLE.exampleConcept,
    supraordinate: null,
    exclusion: [],
    isoordinate: [],
    infraordinate: [],
  };
  for (const step of WORKED_EXAMPLE.steps) merge(map, step.move, [step.item]);
  return map;
}

function toTurn(s: Session, step: Step): Turn {
  return {
    sessionId: s.id,
    turn: s.turn,
    phase: s.phase,
    move: s.move,
    level: step.level,
    messages: step.messages,
    expects: step.expects,
    scaffold: step.scaffold ?? null,
    mentefacto: structuredClone(s.mentefacto),
    example: step.example ?? null,
    progress: progressOf(s),
    result: s.phase === "result" ? structuredClone(s.result) : null,
    error: null,
  };
}

/** The Turn the app shows when an agent call fails: the last one again, with the error. callAgent's
 * errors carry `code` and `retryable` (#10: a spent budget isn't retryable); anything else counts as a
 * retryable agent failure. */
function errorTurn(s: Session, error: unknown): Turn {
  const e = (error ?? {}) as { code?: unknown; retryable?: unknown; status?: unknown };
  const code = e.code === "rate_limited" || e.status === 429 ? "rate_limited" : "agent_failed";
  const retryable = typeof e.retryable === "boolean" ? e.retryable : true;
  const base: Turn = s.lastTurn ?? {
    sessionId: s.id,
    turn: s.turn,
    phase: s.phase,
    move: s.move,
    level: null,
    messages: [],
    expects: "none",
    scaffold: null,
    mentefacto: s.mentefacto,
    example: null,
    progress: progressOf(s),
    result: null,
    error: null,
  };
  return { ...base, error: { code, retryable } };
}
