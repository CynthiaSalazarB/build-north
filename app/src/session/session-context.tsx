// The session the screens share: the transcript state plus what a learner can do (start, send, retry,
// and at level 5 edit their map). The rules live in transcript.ts; this file only wires them to the
// client. Starting a session replaces the one on screen; the server keeps every session, and GET /sessions lists
// them (`history`), so Start offers the unfinished ones to pick up and the finished ones to read again. The device
// keeps, per session, only what the server doesn't hold (saved.ts, storage.ts): the notes and the level-5 map.
import type { CreateSessionBody, MemoryView, Mentefacto, SessionSummary, TurnInput } from "@build-north/agents";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ClientError, type SessionClient } from "./client.ts";
import { createSavedSessions, savedOf } from "./saved.ts";
import { clearSaved, readSaved, writeSaved } from "./storage.ts";
import { drafted, failed, initialState, received, replayed, resendOf, sent, startedWith, withRevealed, type SessionState } from "./transcript.ts";

/** What the learner can send: a /turns body without its `turn` number, which the provider adds. */
export type LearnerInput = Exclude<TurnInput, { action: "start" }>;

type SessionApi = {
  state: SessionState;
  offline: boolean;
  /** Starts a new session; resolves with an error message to show, or null when it started. */
  start(body: CreateSessionBody): Promise<string | null>;
  send(input: LearnerInput): void;
  retry(): void;
  /** Level 5: keeps the learner's map; `send({ mentefacto })` submits it. */
  edit(draft: Mentefacto): void;
  /** The learner's sessions on the server, newest first (GET /sessions); null until the first read. Demo mode has none. */
  history: SessionSummary[] | null;
  /** Reads the list again (Start does when it is shown). Resolves with an error message, or null. */
  refresh(): Promise<string | null>;
  /** Picks a session up from the server: unfinished, it goes on from its latest Turn, with the notes and the level-5
   * map this device kept; finished, its result shows again, read-only. Resolves with an error message to show, or
   * null when it is on screen. A session the server no longer has is forgotten. */
  resume(session: Pick<SessionSummary, "id" | "mode">): Promise<string | null>;
  /** Sign-out: the session on screen, the list and what the device kept all go, since the next learner on this
   * device isn't this one. */
  forget(): void;
  /** The delete button (#43): everything the server kept goes, and so does everything on this device.
   * Resolves with an error message to show, or null when it's done. */
  deleteData(): Promise<string | null>;
  /** The Memory sheet (#112): what Lumente remembers of this learner. Rejects with a ClientError. */
  memory(): Promise<MemoryView>;
};

const SessionContext = createContext<SessionApi | null>(null);

const messageOf = (error: unknown) => (error instanceof ClientError ? error.message : "Something went wrong. Try again.");
const retryableOf = (error: unknown) => (error instanceof ClientError ? error.retryable : true);

export function SessionProvider({ client, children }: { client: SessionClient; children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);
  const [history, setHistory] = useState<SessionSummary[] | null>(null);
  const saved = useRef<ReturnType<typeof createSavedSessions> | null>(null);
  if (!saved.current) saved.current = createSavedSessions({ read: readSaved, write: writeSaved, clear: clearSaved });

  // the session on screen is kept as it moves (the level-5 map with it), and dropped once it is over
  useEffect(() => {
    if (client.offline || !state.turn) return;
    void saved.current!.keep(state.turn.sessionId, savedOf(state));
  }, [client, state]);

  const refresh = useCallback(async () => {
    if (client.offline) return null;
    try {
      const before = await saved.current!.snapshot();
      const list = await client.list();
      setHistory(list);
      // Don't prune a record created while this list request was in flight; the response can predate that session.
      const knownIds = new Set(before.map((record) => record.sessionId));
      const unfinishedIds = new Set(list.filter((session) => !session.finished).map((session) => session.id));
      await saved.current!.prune(knownIds, unfinishedIds);
      return null;
    } catch (error) {
      return messageOf(error);
    }
  }, [client]);

  const forget = () => {
    setState(initialState);
    setHistory(null);
    void saved.current!.clear();
  };

  const deliver = (body: Parameters<typeof sent>[1], retry: boolean) => {
    const sessionId = state.turn?.sessionId;
    if (!sessionId || state.pending) return;
    setState((s) => sent(s, body, retry));
    // a reply for a session no longer on screen (the learner started another, say before the coach's words
    // came) changes nothing
    const same = (s: SessionState) => s.turn?.sessionId === sessionId;
    client.send(sessionId, body).then(
      (turn) => setState((s) => (same(s) ? received(s, turn) : s)),
      (error: unknown) => setState((s) => (same(s) ? failed(s, messageOf(error), retryableOf(error)) : s)),
    );
  };

  const api: SessionApi = {
    state,
    offline: client.offline,
    async start(body) {
      try {
        const turn = await client.start(body);
        setState(startedWith(turn, body.mode, body.material ?? null));
        return null;
      } catch (error) {
        return messageOf(error);
      }
    },
    send(input) {
      if (state.turn) deliver({ turn: state.turn.turn, ...input }, false);
    },
    retry() {
      const body = resendOf(state);
      if (body) deliver(body, true);
    },
    edit(draft) {
      setState((s) => drafted(s, draft));
    },
    history,
    refresh,
    async resume({ id, mode }) {
      try {
        // the latest Turn says whether the session is still there (a 404 when it isn't); the steps bring its whole
        // conversation back, and without them (an older session, or an API from before they were kept) the latest
        // Turn shows alone
        const [turn, steps] = await Promise.all([client.resume(id), client.transcript(id).catch(() => null)]);
        const kept = await saved.current!.get(id);
        // the server's map holds what Help revealed; the learner's own words come back from the device
        const back = replayed(steps, turn, mode, kept?.material ?? null);
        setState(kept?.draft ? drafted(back, withRevealed(kept.draft, turn.mentefacto)) : back);
        return null;
      } catch (error) {
        // deleted, over for longer than the server keeps it, or another learner's: it isn't coming back
        if (error instanceof ClientError && error.status === 404) {
          void saved.current!.keep(id, null);
          setHistory((list) => list?.filter((s) => s.id !== id) ?? null);
          return "That session is gone. Start a new one.";
        }
        return messageOf(error);
      }
    },
    forget,
    async deleteData() {
      try {
        await client.deleteData();
        forget();
        setHistory([]);
        return null;
      } catch (error) {
        return messageOf(error);
      }
    },
    memory: () => client.memory(),
  };

  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionApi {
  const api = useContext(SessionContext);
  if (!api) throw new Error("useSession needs a SessionProvider above it");
  return api;
}
