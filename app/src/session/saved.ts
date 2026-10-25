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

export type SavedSessionStorage = {
  read: () => Promise<string | null>;
  write: (text: string) => Promise<void>;
  clear: () => Promise<void>;
};

export type SavedSessions = {
  snapshot: () => Promise<SavedSession[]>;
  get: (sessionId: string) => Promise<SavedSession | null>;
  keep: (sessionId: string, record: SavedSession | null) => Promise<void>;
  prune: (knownIds: ReadonlySet<string>, unfinishedIds: ReadonlySet<string>) => Promise<void>;
  clear: () => Promise<void>;
};

/** Serializes access to the device cache: its read, every update and every write. */
export function createSavedSessions(storage: SavedSessionStorage): SavedSessions {
  let records: SavedSession[] = [];
  let ready: Promise<void> | null = null;
  let writes: Promise<void> = Promise.resolve();

  const load = () => (ready ??= storage.read().then((text) => { records = parseSaved(text); }));

  async function persist(next: SavedSession[]) {
    await (next.length ? storage.write(serializeSaved(next)) : storage.clear());
  }

  function update(change: (current: SavedSession[]) => SavedSession[]) {
    const write = writes.then(async () => {
      await load();
      records = change(records);
      await persist(records);
    });
    writes = write.catch(() => {});
    return write;
  }

  return {
    async snapshot() {
      await load();
      await writes;
      return [...records];
    },
    async get(sessionId) {
      await load();
      await writes;
      return records.find((record) => record.sessionId === sessionId) ?? null;
    },
    keep: (sessionId, record) => update((current) => withSaved(current, sessionId, record)),
    prune: (knownIds, unfinishedIds) => update((current) => current.filter((record) => !knownIds.has(record.sessionId) || unfinishedIds.has(record.sessionId))),
    clear: () => update(() => []),
  };
}
