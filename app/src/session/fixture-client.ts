// #6: the democracy session from agents/fixtures/session-1.json, one Turn per action, whatever the
// concept or the answer. It lets the whole session click through with no API.
import { Turn } from "@build-north/agents";
import sessionOne from "@build-north/agents/fixtures/session-1.json" with { type: "json" };
import { ClientError, type SessionClient } from "./client.ts";

const STEPS: readonly Turn[] = sessionOne.map((step) => Turn.parse(step.turn));

/** `delayMs` stands in for the wait on Claude, so the thinking indicator shows. */
export function createFixtureClient(delayMs = 600): SessionClient {
  let next = 0;
  // a copy, as if it came over the network (Hermes has no structuredClone)
  const after = (turn: Turn) => new Promise<Turn>((resolve) => setTimeout(() => resolve(JSON.parse(JSON.stringify(turn))), delayMs));

  return {
    offline: true,
    async start() {
      next = 1;
      return after(STEPS[0]!);
    },
    async send() {
      const turn = STEPS[next];
      if (!turn) throw new ClientError("The demo session ends here.", null, false);
      next += 1;
      return after(turn);
    },
  };
}
