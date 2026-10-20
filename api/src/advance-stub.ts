import type { Mastery, Session, Turn } from "./contract.ts";

// The API's side of the seam in CONTRACTS.md section 3: state in, new state and a Turn out.
export type Advance = (
  state: { session: Session; mastery: Mastery },
  input: { action: "start" },
) => Promise<{ session: Session; mastery: Mastery; turn: Turn }>;

// ponytail: answers only { action: "start" }, with the prediction question from CONTRACTS.md
// section 1, so POST /sessions returns a real Turn before the orchestrator exists. #28 replaces it
// with `advance` from @build-north/agents (#3) and passes callAgent (#10).
export const advanceStub: Advance = async ({ session, mastery }) => {
  const turn: Turn = {
    sessionId: session.id,
    turn: session.turn + 1,
    phase: "predict",
    move: null,
    level: null,
    messages: [
      {
        agent: "app",
        kind: "question",
        text: `You'll build the map of ${session.concept} in 4 parts, 2 points each. How many of the 8 points do you think you'll get?`,
      },
    ],
    expects: "prediction",
    scaffold: null,
    mentefacto: session.mentefacto,
    example: null,
    progress: { movesDone: 0, movesTotal: 4, hintsUsed: 0 },
    result: null,
    error: null,
  };
  return { session: { ...session, turn: turn.turn, phase: turn.phase, lastTurn: turn }, mastery, turn };
};
