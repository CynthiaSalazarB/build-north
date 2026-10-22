// How the app moves a session forward (CONTRACTS.md section 1). Two clients share this shape: the
// real API (#7) and a replay of the recorded API session that needs no API at all (#6).
import type { CreateSessionBody, Turn, TurnBody } from "@build-north/agents";

export type SessionClient = {
  /** POST /sessions: the session's first Turn. */
  start(body: CreateSessionBody): Promise<Turn>;
  /** POST /sessions/:id/turns: the next Turn. */
  send(sessionId: string, body: TurnBody): Promise<Turn>;
  /** True when the client replays the fixture instead of calling the API. */
  readonly offline: boolean;
};

/** A call that didn't produce a Turn. `message` is safe to show the learner. */
export class ClientError extends Error {
  readonly status: number | null;
  readonly retryable: boolean;

  constructor(message: string, status: number | null, retryable: boolean) {
    super(message);
    this.name = "ClientError";
    this.status = status;
    this.retryable = retryable;
  }
}
