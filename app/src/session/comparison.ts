// A read-only return to the learner's starting words. Nothing here grades an explanation, reconstructs one,
// or infers that a zero-point area was revealed: provenance comes from the saved conversation, not the score.
import { MOVE_ORDER, type Item, type Mentefacto, type MoveId } from "@build-north/agents";
import { itemsOf } from "./present.ts";
import type { Entry } from "./transcript.ts";

export const FIRST_EXPLANATION_NOTE = "This first explanation is not scored. You'll revisit it at the end.";

/** The text submitted during the attempt phase, once the session moved on. An older/incomplete transcript
 * cannot supply it. If a failed send was edited, keep the last submission before the phase advanced. */
export function firstExplanationOf(entries: readonly Entry[]): string | null {
  let attempting = false;
  let answer: string | null = null;
  for (const entry of entries) {
    if (entry.from === "app" && entry.phase === "attempt" && entry.message.kind === "question") attempting = true;
    else if (attempting && (entry.from === "map" || (entry.from === "app" && entry.phase !== "attempt"))) return answer?.trim() ? answer : null;
    else if (attempting && entry.from === "learner") answer = entry.text;
  }
  return null;
}

export type ComparisonArea = { move: MoveId; items: readonly Item[]; support: "answer" | "hint" | "revealed" };

/** In guided mode a reveal arrives before the next question, in that question's Turn. Attribute it to the
 * area most recently asked, not to the Turn's new move. No support is guessed from points or answer wording. */
export function comparisonAreasOf(map: Mentefacto, entries: readonly Entry[]): ComparisonArea[] {
  const support: Partial<Record<MoveId, ComparisonArea["support"]>> = {};
  let asked: MoveId | null = null;
  for (const entry of entries) {
    if (entry.from !== "app") continue;
    if (entry.phase === "move" && entry.message.kind === "question") asked = entry.move;
    if (asked && entry.message.kind === "hint") {
      if (entry.message.hintStep === "reveal") support[asked] = "revealed";
      else if (support[asked] !== "revealed") support[asked] = "hint";
    }
  }
  return MOVE_ORDER.map((move) => ({ move, items: itemsOf(map, move), support: support[move] ?? "answer" }));
}
