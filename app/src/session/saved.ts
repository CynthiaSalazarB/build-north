// What the device keeps per session so picking it up loses nothing the server doesn't hold: the notes it started
// with (the Turn doesn't carry them back) and, at level 5, the map the learner is building. Which sessions exist,
// and which are unfinished, comes from the server (GET /sessions), so one record per session is kept here, keyed
// by its id. Pure, so it's tested under Node; storage.ts reads and writes the text.
import { Mentefacto } from "@build-north/agents";
import type { SessionState } from "./transcript.ts";

export type SavedSession = {
  sessionId: string;
  material: string | null;
  draft: Mentefacto | null;
};

/** What to keep for the session on screen: null before one starts, once it is over (the result and the coach's
 * words are both in), and when it has nothing the server doesn't hold. */
export function savedOf(state: SessionState): SavedSession | null {
  const { turn } = state;
  if (!turn || turn.expects === "none" || (state.material === null && state.draft === null)) return null;
  return { sessionId: turn.sessionId, material: state.material, draft: state.draft };
}

/** The records with `record` in the place of the one for `sessionId` (or added), or without it when `record` is null. */
export function withSaved(records: readonly SavedSession[], sessionId: string, record: SavedSession | null): SavedSession[] {
  const others = records.filter((r) => r.sessionId !== sessionId);
  return record ? [...others, record] : others;
}

export const serializeSaved = (records: readonly SavedSession[]): string => JSON.stringify(records);

/** The records read back: an array, or the one record the device kept before Oct 24 (a single object); anything
 * that isn't a record is dropped (a stray file, a map that isn't one, no file). */
export function parseSaved(text: string | null): SavedSession[] {
  if (!text) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return [];
  }
  const items = Array.isArray(raw) ? raw : [raw];
  return items.flatMap((item): SavedSession[] => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const draft = record.draft === null || record.draft === undefined ? { success: true as const, data: null } : Mentefacto.safeParse(record.draft);
    if (typeof record.sessionId !== "string" || !record.sessionId || !draft.success) return [];
    return [{ sessionId: record.sessionId, material: typeof record.material === "string" ? record.material : null, draft: draft.data }];
  });
}
