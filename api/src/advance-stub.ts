import { Turn, type Advance, type CallAgent } from "@build-north/agents";
import sessionOne from "@build-north/agents/fixtures/session-1.json" with { type: "json" };

// Cynthia's democracy walk-through from #15, from the prediction to the result, checked against the
// Turn schema when the API starts.
const SCRIPT = sessionOne.map((step) => Turn.parse(step.turn));

// Temporary: replays agents/fixtures/session-1.json, one Turn per call, whatever the concept or the
// answers, so the app can render every phase before the orchestrator exists. Mastery never changes
// and help isn't scripted. It has the exact `Advance` type from @build-north/agents, so #28 swaps in
// Cynthia's `advance` (#3) with one import.
export const advanceStub: Advance = async ({ session, mastery }, input) => {
  if ("action" in input && input.action === "help") {
    // a status under 500 reaches the app with this message (the error handler in app.ts)
    throw Object.assign(new Error("Help isn't in the fixture session; it works once the orchestrator lands (#28)"), { status: 409 });
  }
  const scripted = SCRIPT[session.turn];
  if (!scripted) throw new Error(`The fixture session ends after ${SCRIPT.length} Turns`);
  const turn: Turn = { ...scripted, sessionId: session.id, turn: session.turn + 1 };
  const { phase, move, mentefacto, result } = turn;
  return { session: { ...session, turn: turn.turn, phase, move, mentefacto, result, lastTurn: turn }, mastery, turn };
};

// Temporary: the fixture Turns need no agent, so this only fails loudly. #10 replaces it with the real
// callAgent (Claude call, schema check, agent_log row).
export const callAgentStub: CallAgent = async (agent) => {
  throw new Error(`callAgent isn't wired yet (#10); something asked for the ${agent}`);
};
