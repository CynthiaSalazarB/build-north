// The ladder rules (CONTRACTS.md section 3) as small pure functions: numbers in code, words in the model.
import { type HintStep, type Level, type Mastery, MOVE_ORDER, type MoveId, type Quality, type SessionMode } from "../contracts.ts";

export const HINT_LADDER: readonly HintStep[] = ["nudge", "hint", "partial", "reveal"];

/** A move whose hints reach the end of the ladder was revealed. */
export const REVEALED = HINT_LADDER.length;

/** The next step of the hint ladder after `hintsUsed` hints on a move. */
export function hintStepFor(hintsUsed: number): HintStep {
  return HINT_LADDER[Math.min(hintsUsed, HINT_LADDER.length - 1)]!;
}

/** The evaluator's quality, capped at 1 if any hint was used, 0 if the move was revealed. */
export function pointsFor(quality: Quality, hints: number): Quality {
  if (hints >= REVEALED) return 0;
  return hints > 0 ? (Math.min(quality, 1) as Quality) : quality;
}

/** Done with 1 hint or fewer: up one level, max 5. Never down in this version. */
export function levelAfter(level: Level, hints: number): Level {
  return hints <= 1 ? (Math.min(level + 1, 5) as Level) : level;
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
