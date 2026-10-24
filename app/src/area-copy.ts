// UI vocabulary, independent of stored move IDs and the server's older labels. Never apply this to learner text.
import { MOVE_LABEL, MOVE_ORDER, type MoveId } from "@build-north/agents";

export const AREA_LABEL = {
  supraordinate: "Category",
  exclusion: "Similar concepts & differences",
  isoordinate: "Defining features",
  infraordinate: "Classification",
} as const satisfies Record<MoveId, string>;

const labelNames = MOVE_ORDER.flatMap((move) => [MOVE_LABEL[move], AREA_LABEL[move]].map((label) => ({ move, label })));

/** Read both old server feedback and the current UI labels, without rewriting the feedback or stored session. */
export function areaNoteOf(text: string): { move: MoveId; text: string } | null {
  const named = labelNames.find(({ label }) => text.toLowerCase().startsWith(`${label.toLowerCase()}: `));
  const note = named ? text.slice(named.label.length + 2).trim() : "";
  return named && note ? { move: named.move, text: note } : null;
}

const escapePattern = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const references = MOVE_ORDER.map((move) => ({
  label: AREA_LABEL[move],
  pattern: new RegExp(`(^|\\n|["'“‘])${escapePattern(MOVE_LABEL[move])}(?=["'”’]|\\s*:|$)`, "gi"),
}));

/** Presentation only: old quoted area names/headings and "bigger group" in the tutor's prose use today's labels.
 * Natural phrases such as "what it needs to do" and "two types" keep their meaning; code keeps its exact text. */
export function areaCopyOf(text: string): string {
  return text.split(/(```[\s\S]*?```|`[^`]*`)/g).map((piece, i) => {
    if (i % 2) return piece;
    let copy = piece;
    for (const { label, pattern } of references) copy = copy.replace(pattern, (_match, before: string) => `${before}${label}`);
    return copy.replace(/\bbigger groups?\b/gi, (match) => {
      const category = match.toLowerCase().endsWith("s") ? "categories" : "category";
      return /^[A-Z]/.test(match) ? category.charAt(0).toUpperCase() + category.slice(1) : category;
    });
  }).join("");
}
