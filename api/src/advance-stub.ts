import type { Advance, CallAgent, Turn } from "@build-north/agents";

// ponytail: answers only { action: "start" }, with the prediction question from CONTRACTS.md
// section 1, so POST /sessions returns a real Turn before the orchestrator exists. It has the exact
// `Advance` type from @build-north/agents, so #28 swaps in Cynthia's `advance` (#3) with one import.
export const advanceStub: Advance = async ({ session, mastery }, input) => {
  if (!("action" in input) || input.action !== "start") {
    throw new Error('The stand-in advance only handles { action: "start" } until the orchestrator lands (#28)');
  }
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

// ponytail: the start Turn needs no agent, so this only fails loudly. #10 replaces it with the real
// callAgent (Claude call, schema check, agent_log row).
export const callAgentStub: CallAgent = async (agent) => {
  throw new Error(`callAgent isn't wired yet (#10); something asked for the ${agent}`);
};
