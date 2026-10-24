// The session the screens share: the transcript state plus what a learner can do (start, send, retry,
// and at level 5 edit their map). The rules live in transcript.ts; this file only wires them to the
// client. Starting a session replaces the previous one. The session on screen is also kept on the device
// (saved.ts, storage.ts), so a reload or a killed app loses nothing: Start offers to pick it up again.
import type { CreateSessionBody, MemoryView, Mentefacto, TurnInput } from "@build-north/agents";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ClientError, type SessionClient } from "./client.ts";
import { parseSaved, savedOf, serializeSaved, type SavedSession } from "./saved.ts";
import { clearSaved, readSaved, writeSaved } from "./storage.ts";
import { drafted, failed, initialState, received, resendOf, sent, startedWith, withRevealed, type SessionState } from "./transcript.ts";

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
  /** The session this device kept from before a reload or a restart, or null. Start offers to resume it while
   * no session is on screen. */
  saved: SavedSession | null;
  /** Picks the saved session up from the server, where it went on. Resolves with an error message to show, or
   * null when it is back on screen. A session the server no longer has is forgotten. */
  resume(): Promise<string | null>;
  /** Sign-out: the session on screen and the one kept on the device both go, since the next learner on this
   * device isn't this one. */
  forget(): void;
  /** The delete button (#43): everything the server kept goes, and so does the session on this device.
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
  const [saved, setSaved] = useState<SavedSession | null>(null);

  // the record the device kept is read once; demo mode keeps nothing (its sessions can't be picked up)
  useEffect(() => {
    if (client.offline) return;
    let gone = false;
    void readSaved().then((text) => {
      if (!gone) setSaved(parseSaved(text));
    });
    return () => {
      gone = true;
    };
  }, [client]);

  // the session on screen is kept as it moves (the level-5 map with it), and dropped once it is over
  useEffect(() => {
    if (client.offline || !state.turn) return;
    const record = savedOf(state);
    setSaved(record);
    void (record ? writeSaved(serializeSaved(record)) : clearSaved());
  }, [client, state]);

  const forget = () => {
    setState(initialState);
    setSaved(null);
    void clearSaved();
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
    saved,
    async resume() {
      if (!saved) return "Nothing to pick up.";
      try {
        const turn = await client.resume(saved.sessionId);
        // the server's map holds what Help revealed; the learner's own words come back from the device
        const back = startedWith(turn, saved.mode, saved.material);
        setState(saved.draft ? drafted(back, withRevealed(saved.draft, turn.mentefacto)) : back);
        return null;
      } catch (error) {
        // deleted, over for longer than the server keeps it, or another learner's: it isn't coming back
        if (error instanceof ClientError && error.status === 404) {
          setSaved(null);
          void clearSaved();
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
