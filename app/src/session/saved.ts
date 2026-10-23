// A session picked up after a reload or a killed app: what the device keeps so Start can offer to resume it. The
// server holds the session itself (GET /sessions/:id gives back its latest Turn), so the device keeps only what
// that Turn doesn't carry: which session, its mode, the notes it started with and, at level 5, the map the learner
// is building. Pure, so it's tested under Node; storage.ts reads and writes the text.
import { Mentefacto, SessionMode } from "@build-north/agents";
import type { SessionState } from "./transcript.ts";

export type SavedSession = {
  sessionId: string;
  concept: string;
  mode: SessionMode;
  material: string | null;
  draft: Mentefacto | null;
  /** ISO 8601; "" for a record that didn't say. */
  savedAt: string;
};

/** What to keep for the session on screen: null before one starts, and once it is over (the result and the
 * coach's words are both in), since there is nothing left to pick up. */
export function savedOf(state: SessionState, now = new Date()): SavedSession | null {
  const { turn } = state;
  if (!turn || turn.expects === "none") return null;
  return { sessionId: turn.sessionId, concept: turn.mentefacto.concept, mode: state.mode, material: state.material, draft: state.draft, savedAt: now.toISOString() };
}

export const serializeSaved = (saved: SavedSession): string => JSON.stringify(saved);

/** The record read back, or null for anything that isn't one (an older shape, a stray file, no file). */
export function parseSaved(text: string | null): SavedSession | null {
  if (!text) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const mode = SessionMode.safeParse(record.mode);
  const draft = record.draft === null || record.draft === undefined ? { success: true as const, data: null } : Mentefacto.safeParse(record.draft);
  if (typeof record.sessionId !== "string" || !record.sessionId || typeof record.concept !== "string" || !mode.success || !draft.success) return null;
  return {
    sessionId: record.sessionId,
    concept: record.concept,
    mode: mode.data,
    material: typeof record.material === "string" ? record.material : null,
    draft: draft.data,
    savedAt: typeof record.savedAt === "string" ? record.savedAt : "",
  };
}
