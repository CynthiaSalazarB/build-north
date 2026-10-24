import { Turn, advance, type Advance, type CallAgent } from "@build-north/agents";
import sessionOne from "@build-north/agents/fixtures/session-1.json" with { type: "json" };

// Cynthia's democracy walk-through from #15, from the prediction to the result, checked against the
// Turn schema when the API starts.
const SCRIPT = sessionOne.map((step) => Turn.parse(step.turn));

// What runs instead of Cynthia's `advance` when Claude is off (no ANTHROPIC_API_KEY): it replays
// agents/fixtures/session-1.json, one Turn per call (a Help too), whatever the concept or the answers,
// so the app can run every phase against an API with no key. Mastery never changes. It has the same
// `Advance` type, so server.ts picks one or the other.
export const advanceStub: Advance = async ({ session, mastery }) => {
  const scripted = SCRIPT[session.turn];
  if (!scripted) throw new Error(`The fixture session ends after ${SCRIPT.length} Turns`);
  const turn: Turn = { ...scripted, sessionId: session.id, turn: session.turn + 1 };
  const { phase, move, mentefacto, result } = turn;
  return { session: { ...session, turn: turn.turn, phase, move, mentefacto, result, lastTurn: turn }, mastery, turn };
};

// The fixture Turns need no agent, so without a key this only fails loudly if something asks for one.
export const callAgentStub: CallAgent = async (agent) => {
  throw new Error(`Claude is off (no ANTHROPIC_API_KEY); something asked for the ${agent}`);
};

/** Which orchestrator server.ts runs: Cynthia's `advance` with Claude and a database, the stub without them. The stub is
 * a development tool: a process that looks like production (Render sets NODE_ENV=production by default and
 * RENDER_GIT_COMMIT on every deploy) and lacks one of them gets an Error instead, so the deploy fails its health check,
 * Render keeps the last healthy one, and no learner is taught the democracy replay (#163). */
export function orchestratorFor(env: NodeJS.ProcessEnv, has: { claude: boolean; database: boolean }): Advance {
  if (has.claude && has.database) return advance;
  if (env.NODE_ENV === "production" || env.RENDER_GIT_COMMIT) {
    const missing = [has.claude ? null : "ANTHROPIC_API_KEY (Claude)", has.database ? null : "SURREAL_URL (the database)"].filter((m) => m !== null);
    throw new Error(
      `This process looks like production (NODE_ENV=production or RENDER_GIT_COMMIT set) and ${missing.join(" and ")} is missing: sessions would replay the session-1 fixture instead of running the agents, so the API refuses to start`,
    );
  }
  return advanceStub;
}
