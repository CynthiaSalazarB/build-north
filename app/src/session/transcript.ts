// What the session screen shows, as pure functions of the Turns that came back: the conversation so
// far, the latest Turn, the call in flight, a failed call to retry and, at level 5, the map the learner
// is building. No React here, so it's tested under Node.
import { MOVE_ORDER, type Item, type Level, type Mentefacto, type Message, type MoveId, type Phase, type SessionMode, type Turn, type TurnBody } from "@build-north/agents";

/** An app entry keeps the phase, part and level of the Turn it came with, so the screen can draw a
 * question with its stage, and leave the guess's own messages to the guess screen. A map entry is the
 * worked example's map (planet), which stays in the conversation after the example. */
export type Entry =
  | { id: string; from: "app"; message: Message; phase: Phase; move: MoveId | null; level: Level | null }
  | { id: string; from: "learner"; text: string }
  | { id: string; from: "map"; map: Mentefacto };

export type Failure = { message: string; retryable: boolean; body: TurnBody };

export type SessionState = {
  /** The latest Turn: what the screen asks for next, the map, the progress. */
  turn: Turn | null;
  entries: Entry[];
  /** The body in flight. Send stays disabled while it's set (decision 18). */
  pending: TurnBody | null;
  failure: Failure | null;
  /** "test" for a self-test (the testers' pre-test and post-test): every part at level 5. */
  mode: SessionMode;
  /** Level 5: the learner's map, kept on the phone until they submit it (`expects: "map"`). */
  draft: Mentefacto | null;
};

export const initialState: SessionState = { turn: null, entries: [], pending: null, failure: null, mode: "learn", draft: null };

/** A session that just started, in learn or test mode. */
export const startedWith = (turn: Turn, mode: SessionMode = "learn"): SessionState => received({ ...initialState, mode }, turn);

/** The learner's side of the conversation, as it shows in the transcript. The guess has its own
 * screen and comes back on the result, and Help shows as the hint card it brings, so neither is echoed. */
export function echoFor(body: TurnBody): string | null {
  if ("text" in body) return body.text;
  if ("question" in body) return body.question;
  if ("mentefacto" in body) return "Here's my map.";
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
  // one worked example per session: its map goes in once, ahead of its messages
  const example =
    isNew && turn.example && !state.entries.some((e) => e.from === "map") ? [{ id: `turn-${turn.turn}-map`, from: "map" as const, map: turn.example }] : [];
  const entries = isNew
    ? [
        ...state.entries,
        ...example,
        ...turn.messages.map((message, i) => ({
          id: `turn-${turn.turn}-${i}`,
          from: "app" as const,
          message,
          phase: turn.phase,
          move: turn.move,
          level: turn.level,
        })),
      ]
    : state.entries;
  // An agent failed (CONTRACTS.md section 5): nothing moved on, and the same body can be sent again.
  const failure =
    turn.error && state.pending
      ? { message: turn.error.code === "rate_limited" ? "Too many requests right now. Wait a moment and try again." : "Something went wrong on our side.", retryable: turn.error.retryable, body: state.pending }
      : null;
  // The map stays the learner's while they build it; an answer Help revealed joins it.
  const draft = turn.expects === "map" ? withRevealed(state.draft ?? blankMap(turn.mentefacto.concept), turn.mentefacto) : null;
  return { ...state, turn, entries, pending: null, failure, draft };
}

/** The call failed before any Turn came back. */
export function failed(state: SessionState, message: string, retryable: boolean): SessionState {
  return state.pending ? { ...state, pending: null, failure: { message, retryable, body: state.pending } } : state;
}

/** The learner changed their map (level 5). Nothing is sent until they submit it. */
export function drafted(state: SessionState, draft: Mentefacto): SessionState {
  return state.turn?.expects === "map" ? { ...state, draft } : state;
}

export const blankMap = (concept: string): Mentefacto => ({ concept, supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] });

const sameValue = (a: Item, b: Item) => a.value.trim().toLowerCase() === b.value.trim().toLowerCase();

/** At level 5 the server's map only holds what Help revealed (CONTRACTS.md section 3), so those items
 * join the learner's map: a revealed bigger group replaces theirs, revealed list items are added. */
export function withRevealed(draft: Mentefacto, server: Mentefacto): Mentefacto {
  const next: Mentefacto = { ...draft, exclusion: [...draft.exclusion], isoordinate: [...draft.isoordinate], infraordinate: [...draft.infraordinate] };
  if (server.supraordinate && !(draft.supraordinate && sameValue(draft.supraordinate, server.supraordinate))) next.supraordinate = server.supraordinate;
  for (const move of MOVE_ORDER) {
    if (move === "supraordinate") continue;
    for (const item of server[move]) if (!next[move].some((mine) => sameValue(mine, item))) next[move].push(item);
  }
  return next;
}
