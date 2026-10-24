// Demo mode (#6): the API session recorded live with Claude (agents/fixtures/session-api.json, the
// demo's session 1), one Turn per action, whatever the concept or the answer. It lets the whole session
// click through with no API. Played on Demo Day, it's a replay and has to be called one.
import { Turn } from "@build-north/agents";
import sessionApi from "@build-north/agents/fixtures/session-api.json" with { type: "json" };
import { ClientError, type SessionClient } from "./client.ts";

const STEPS: readonly Turn[] = sessionApi.map((step) => Turn.parse(step.turn));

/** `delayMs` stands in for the wait on Claude, so the thinking indicator shows. */
export function createFixtureClient(delayMs = 600): SessionClient {
  let next = 0;
  // each replay is its own session to the screens (the coach is asked once per session and Turn), though the
  // recording's id is the same every time
  let run = 0;
  // a copy, as if it came over the network (Hermes has no structuredClone)
  const after = (turn: Turn) => new Promise<Turn>((resolve) => setTimeout(() => resolve({ ...JSON.parse(JSON.stringify(turn)), sessionId: `${turn.sessionId}-${run}` }), delayMs));

  return {
    offline: true,
    // nothing is kept anywhere in demo mode, so there is nothing to delete, and nothing to remember
    async deleteData() {},
    async memory() {
      return { concepts: [] };
    },
    async start() {
      next = 1;
      run += 1;
      return after(STEPS[0]!);
    },
    async send() {
      const turn = STEPS[next];
      if (!turn) throw new ClientError("The demo session ends here.", null, false);
      next += 1;
      return after(turn);
    },
    // nothing is kept, so there is nothing to list or pick up; the provider never saves a demo session either
    async list() {
      return [];
    },
    async resume() {
      throw new ClientError("Demo mode keeps nothing to resume.", null, false);
    },
  };
}
