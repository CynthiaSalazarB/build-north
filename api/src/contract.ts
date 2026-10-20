// The types from agents/CONTRACTS.md v0.1 that the API needs. Replace them with imports from
// @build-north/agents once its Zod schemas land (#15).

export const MOVES = ["supraordinate", "exclusion", "isoordinate", "infraordinate"] as const;
export type MoveId = (typeof MOVES)[number];
export type Level = 1 | 2 | 3 | 4 | 5;
export type HintStep = "nudge" | "hint" | "partial" | "reveal";
export type Mode = "learn" | "test";

export type Item = { value: string; note: string | null };

export type Mentefacto = {
  concept: string;
  supraordinate: Item | null;
  exclusion: Item[];
  isoordinate: Item[];
  infraordinate: Item[];
};

export type Turn = {
  sessionId: string;
  turn: number;
  phase: "predict" | "attempt" | "example" | "move" | "result";
  move: MoveId | null;
  level: Level | null;
  messages: {
    agent: "questioner" | "evaluator" | "hint_giver" | "example_builder" | "coach" | "fact_desk" | "app";
    kind: "question" | "feedback" | "hint" | "example" | "named_move" | "summary" | "fact" | "redirect";
    text: string;
    hintStep?: HintStep;
  }[];
  expects: "prediction" | "text" | "continue" | "map" | "none";
  scaffold: { given: string[]; blanks: number } | null;
  mentefacto: Mentefacto;
  example: Mentefacto | null;
  progress: { movesDone: number; movesTotal: number; hintsUsed: number };
  result: unknown; // the Result in section 1; the API stores it and never reads it
  error: { code: "agent_failed" | "rate_limited"; retryable: boolean } | null;
};

export type Mastery = { moves: { move: MoveId; level: Level; unassistedSuccesses: number }[] };

// The orchestrator's state (section 4). The API stores what `advance` returns and reads nothing
// in it except `user`, `turn` and `lastTurn`.
export type Session = {
  id: string;
  user: string;
  concept: string;
  material: string | null;
  mode: Mode;
  turn: number;
  lastTurn: Turn | null;
  predictedScore: number | null;
  firstAttempt: string | null;
  phase: Turn["phase"] | null;
  move: MoveId | null;
  hintStep: HintStep | null;
  hintsPerMove: Partial<Record<MoveId, number>>;
  mentefacto: Mentefacto;
  result: unknown;
  createdAt: string;
};

export type NewSession = Pick<Session, "concept" | "material" | "mode">;
