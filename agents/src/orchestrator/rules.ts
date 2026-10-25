// The ladder rules (CONTRACTS.md section 3) as small pure functions: numbers in code, words in the model.
import { type HintStep, type Level, type Mastery, MOVE_ORDER, type MoveId, type Quality, type SessionMode } from "../contracts.ts";

export const HINT_LADDER: readonly HintStep[] = ["nudge", "hint", "partial", "reveal"];

/** A move whose hints reach the end of the ladder was revealed. */
export const REVEALED = HINT_LADDER.length;

/** The next step of the hint ladder after `hintsUsed` hints on a move. */
export function hintStepFor(hintsUsed: number): HintStep {
  return HINT_LADDER[Math.min(hintsUsed, HINT_LADDER.length - 1)]!;
}

/** The step after the furthest one this move has shown (null: nothing shown yet). */
export function hintStepAfter(shown: HintStep | null): HintStep {
  return shown === null ? HINT_LADDER[0]! : hintStepFor(HINT_LADDER.indexOf(shown) + 1);
}

/** Levels 2 and 3 get a nudge in the evaluator's feedback for free; at 4 and 5 the feedback only says
 * what is off (the help fades). */
export function feedbackNudges(level: Level): boolean {
  return level <= 3;
}

/** The evaluator's quality: in full on the first try with no Help, capped at 1 after a retry or a Help,
 * 0 if the move was revealed. */
export function pointsFor(quality: Quality, hints: number, retries = 0): Quality {
  if (hints >= REVEALED) return 0;
  return hints + retries > 0 ? (Math.min(quality, 1) as Quality) : quality;
}

/** Done with at most one retry or Help (`assists`, the two added): up one level, max 5. Never down in
 * this version. */
export function levelAfter(level: Level, assists: number): Level {
  return assists <= 1 ? (Math.min(level + 1, 5) as Level) : level;
}

/** Positive means overconfident. */
export function calibrationGap(predictedScore: number, score: number): number {
  return predictedScore - score;
}

export function levelOf(mastery: Mastery, move: MoveId): Level {
  return mastery.moves.find((m) => m.move === move)?.level ?? 1;
}

/** Decision 16: the learner asks the fact desk and builds the whole map only when all four moves are at
 * level 5, or in a test session. */
export function isWholeMap(mode: SessionMode, mastery: Mastery): boolean {
  return mode === "test" || MOVE_ORDER.every((move) => levelOf(mastery, move) === 5);
}

/** Outside whole-map mode, a level-5 move runs like level 4 (decision 16). */
export function effectiveLevel(level: Level): Level {
  return level === 5 ? 4 : level;
}

export function nextMove(move: MoveId): MoveId | null {
  return MOVE_ORDER[MOVE_ORDER.indexOf(move) + 1] ?? null;
}
