// The session the screens share: the transcript state plus what a learner can do (start, send, retry,
// and at level 5 edit their map). The rules live in transcript.ts; this file only wires them to the
// client. Starting a session replaces the previous one.
import type { CreateSessionBody, Mentefacto, TurnInput } from "@build-north/agents";
import { createContext, useContext, useState, type ReactNode } from "react";
import { ClientError, type SessionClient } from "./client.ts";
import { drafted, failed, initialState, received, sent, startedWith, type SessionState } from "./transcript.ts";

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
  /** The delete button (#43): everything the server kept goes, and so does the session on this device.
   * Resolves with an error message to show, or null when it's done. */
  deleteData(): Promise<string | null>;
};

const SessionContext = createContext<SessionApi | null>(null);

const messageOf = (error: unknown) => (error instanceof ClientError ? error.message : "Something went wrong. Try again.");
const retryableOf = (error: unknown) => (error instanceof ClientError ? error.retryable : true);

export function SessionProvider({ client, children }: { client: SessionClient; children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);

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
        setState(startedWith(turn, body.mode));
        return null;
      } catch (error) {
        return messageOf(error);
      }
    },
    send(input) {
      if (state.turn) deliver({ turn: state.turn.turn, ...input }, false);
    },
    retry() {
      if (state.failure?.retryable) deliver(state.failure.body, true);
    },
    edit(draft) {
      setState((s) => drafted(s, draft));
    },
    async deleteData() {
      try {
        await client.deleteData();
        setState(initialState);
        return null;
      } catch (error) {
        return messageOf(error);
      }
    },
  };

  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionApi {
  const api = useContext(SessionContext);
  if (!api) throw new Error("useSession needs a SessionProvider above it");
  return api;
}
