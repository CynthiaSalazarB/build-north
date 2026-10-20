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
  FACT_DESK_REDIRECT,
  FactDeskOutput,
  HintGiverOutput,
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
  const level = effectiveLevel(levelOf(m, move));
  let question: Message;
  let scaffold: Turn["scaffold"] = null;
  if (level >= 4) {
    question = say("app", "question", text.namedOnly(move, s.concept));
  } else {
    const q = QuestionerOutput.parse(await call("questioner", context(s, move, level)));
    question = say("questioner", "question", q.question);
    if (level === 3) scaffold = q.scaffold;
  }
  s.recent.push({ from: "app", text: question.text });
  return { messages: [...lead, question], expects: "text", level, scaffold };
}

async function answer(s: Session, m: Mastery, move: MoveId, learnerText: string, call: CallAgent): Promise<Step> {
  const level = effectiveLevel(levelOf(m, move));
  const ev = EvaluatorOutput.parse(await call("evaluator", { ...context(s, move, level), answer: learnerText }));
  merge(s.mentefacto, move, ev.accepted);
  s.recent.push({ from: "learner", text: learnerText }, { from: "app", text: ev.feedback });
  const feedback = say("evaluator", "feedback", ev.feedback);

  if (ev.verdict === "correct") {
    return finishMove(s, m, move, ev.quality, [feedback, say("app", "named_move", text.named(move, false))], call);
  }
  // An exclusion without its difference gets one follow-up question, not a hint.
  const undifferentiated = move === "exclusion" && ev.verdict === "partial" ? ev.accepted.find((i) => i.note === null) : undefined;
  if (undifferentiated) {
    const followUp = say("app", "question", text.exclusionDifference(s.concept, undifferentiated.value));
    s.recent.push({ from: "app", text: followUp.text });
    return { messages: [feedback, followUp], expects: "text", level };
  }
  // At levels 4 and 5 hints only come when the learner taps Help.
  if (level >= 4) return { messages: [feedback], expects: "text", level };
  return giveHint(s, m, move, level, learnerText, ev.issue, [feedback], call);
}

async function help(s: Session, m: Mastery, move: MoveId, call: CallAgent): Promise<Step> {
  const level = effectiveLevel(levelOf(m, move));
  const lastAnswer = [...s.recent].reverse().find((e) => e.from === "learner")?.text ?? "";
  return giveHint(s, m, move, level, lastAnswer, "none", [], call);
}

async function giveHint(
  s: Session,
  m: Mastery,
  move: MoveId,
  level: Level,
  lastAnswer: string,
  issue: EvaluatorIssue,
  lead: Message[],
  call: CallAgent,
): Promise<Step> {
  const { message, revealed } = await hint(s, move, level, lastAnswer, issue, call);
  if (revealed) {
    return finishMove(s, m, move, 0, [...lead, message, say("app", "named_move", text.named(move, true))], call);
  }
  return { messages: [...lead, message], expects: "text", level };
}

/** One hint giver call: the next step of the ladder for `move`. */
async function hint(
  s: Session,
  move: MoveId,
  level: Level,
  lastAnswer: string,
  issue: EvaluatorIssue,
  call: CallAgent,
): Promise<{ message: Message; revealed: boolean }> {
  const step = hintStepFor(s.hintsPerMove[move]);
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
  return next ? startMove(s, m, next, lead, call) : finishSession(s, lead, call);
}

// ---------- Whole map (level 5 on every move, or a test session) ----------

async function askFactDesk(s: Session, question: string, call: CallAgent): Promise<Step> {
  const fd = FactDeskOutput.parse(
    await call("fact_desk", { concept: s.concept, material: s.material, mentefacto: s.mentefacto, question }),
  );
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
  const { message } = await hint(s, move, 5, "", "none", call);
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
  return finishSession(s, feedback, call);
}

// ---------- Ending ----------

/** Points, mastery and the move log for one finished move. Mastery never changes in a test session. */
function record(s: Session, m: Mastery, move: MoveId, quality: Quality, done: boolean): void {
  const hints = s.hintsPerMove[move];
  const from = levelOf(m, move);
  const to = s.mode === "test" || !done ? from : levelAfter(from, hints);
  if (s.mode !== "test") {
    const row = m.moves.find((r) => r.move === move);
    if (row) {
      row.level = to;
      if (done && hints === 0) row.unassistedSuccesses += 1;
    }
  }
  s.moveLog.push({ move, points: pointsFor(quality, hints), hints, from, to });
}

async function finishSession(s: Session, lead: Message[], call: CallAgent): Promise<Step> {
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
  let coach: Result["coach"];
  try {
    coach = CoachOutput.parse(await call("coach", { concept: s.concept, mentefacto: s.mentefacto, result: withoutCoach }));
  } catch {
    // The coach is words only; the numbers are already in the result, so a fixed line will do (#44).
    const weakest = score < 8 ? [...rubric].sort((a, b) => a.points - b.points)[0]!.move : null;
    coach = { message: text.coachFallback(score, hintsUsed, weakest), nextFocus: weakest };
  }
  s.result = { ...withoutCoach, coach };
  s.phase = "result";
  s.move = null;
  s.recent = [];
  return { messages: [...lead, say("coach", "summary", coach.message)], expects: "none", level: null };
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
    progress: { movesDone: s.moveLog.length, movesTotal: MOVE_ORDER.length, hintsUsed: totalHints(s) },
    result: s.phase === "result" ? structuredClone(s.result) : null,
    error: null,
  };
}

/** The Turn the app shows when an agent call fails: the last one again, with a retryable error. */
function errorTurn(s: Session, error: unknown): Turn {
  const status = (error as { status?: number } | null)?.status;
  const code = status === 429 ? "rate_limited" : "agent_failed";
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
    progress: { movesDone: s.moveLog.length, movesTotal: MOVE_ORDER.length, hintsUsed: totalHints(s) },
    result: null,
    error: null,
  };
  return { ...base, error: { code, retryable: true } };
}
