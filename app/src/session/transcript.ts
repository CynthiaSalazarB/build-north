// What the session screen shows, as pure functions of the Turns that came back: the conversation so
// far, the latest Turn, the call in flight and a failed call to retry. No React here, so it's tested
// under Node.
import type { Message, Turn, TurnBody } from "@build-north/agents";

export type Entry = { id: string; from: "app"; message: Message } | { id: string; from: "learner"; text: string };

export type Failure = { message: string; retryable: boolean; body: TurnBody };

export type SessionState = {
  /** The latest Turn: what the screen asks for next, the map, the progress. */
  turn: Turn | null;
  entries: Entry[];
  /** The body in flight. Send stays disabled while it's set (decision 18). */
  pending: TurnBody | null;
  failure: Failure | null;
};

export const initialState: SessionState = { turn: null, entries: [], pending: null, failure: null };

/** The learner's side of the conversation, as it shows in the transcript. */
export function echoFor(body: TurnBody): string | null {
  if ("text" in body) return body.text;
  if ("question" in body) return body.question;
  if ("prediction" in body) return `I'll get ${body.prediction} of 8.`;
  if ("mentefacto" in body) return "Here's my map.";
  if (body.action === "help") return "Help";
  return null;
}

/** The learner sent `body`. A retry sends the same body again without echoing it twice. */
export function sent(state: SessionState, body: TurnBody, retry = false): SessionState {
  const echo = retry ? null : echoFor(body);
  const entries = echo === null ? state.entries : [...state.entries, { id: `learner-${state.entries.length}`, from: "learner" as const, text: echo }];
  return { ...state, entries, pending: body, failure: null };
}

/** A Turn came back. Only a newer Turn adds messages: a resend, a 409 or an error Turn repeats the
 * latest one, which is already on screen. */
export function received(state: SessionState, turn: Turn): SessionState {
  const isNew = turn.turn > (state.turn?.turn ?? 0);
  const entries = isNew
    ? [...state.entries, ...turn.messages.map((message, i) => ({ id: `turn-${turn.turn}-${i}`, from: "app" as const, message }))]
    : state.entries;
  // An agent failed (CONTRACTS.md section 5): nothing moved on, and the same body can be sent again.
  const failure =
    turn.error && state.pending
      ? { message: turn.error.code === "rate_limited" ? "Too many requests right now. Wait a moment and try again." : "Something went wrong on our side.", retryable: turn.error.retryable, body: state.pending }
      : null;
  return { ...state, turn, entries, pending: null, failure };
}

/** The call failed before any Turn came back. */
export function failed(state: SessionState, message: string, retryable: boolean): SessionState {
  return state.pending ? { ...state, pending: null, failure: { message, retryable, body: state.pending } } : state;
}
