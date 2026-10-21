import { once } from "node:events";
import type { AddressInfo } from "node:net";
import type { TestContext } from "node:test";
import { AGENTS, MOVE_ORDER, type Mastery, type Session } from "@build-north/agents";
import { createApp, type AppOptions } from "./app.ts";
import { createCallAgent, type SendToClaude } from "./call-agent.ts";
import { initialSession, type AgentLogEntry, type Store } from "./store.ts";

// What the route tests share (app.test.ts, memory.test.ts): dev-user headers, the Store kept in
// memory, a running app, and Claude faked behind the real callAgent.

export const KEY = "test-dev-key";
export const as = (user: string, key = KEY) => ({ "x-dev-user": user, "x-dev-key": key });

// The Store contract kept in memory, so the routes can be tested without a database.
export function memoryStore(): Store {
  const sessions = new Map<string, Session>();
  const mastery = new Map<string, Mastery>();
  let created = 0;
  return {
    async createSession(user, input) {
      const session: Session = { ...initialSession(user, input), id: `s${++created}`, createdAt: new Date().toISOString() };
      sessions.set(session.id, session);
      return structuredClone(session);
    },
    async getSession(user, id) {
      const session = sessions.get(id);
      return session?.user === user ? structuredClone(session) : null;
    },
    async saveSession(session, previousTurn) {
      if (sessions.get(session.id)?.turn !== previousTurn) return false;
      sessions.set(session.id, structuredClone(session));
      return true;
    },
    async getMastery(user) {
      const fresh = { moves: MOVE_ORDER.map((move) => ({ move, level: 1 as const, unassistedSuccesses: 0 })) };
      return structuredClone(mastery.get(user) ?? fresh);
    },
    async saveMastery(user, saved) {
      mastery.set(user, structuredClone(saved));
    },
    async logAgentCall() {},
    async deleteUserData(user) {
      for (const [id, session] of sessions) if (session.user === user) sessions.delete(id);
      mastery.delete(user);
    },
  };
}

export const post = (url: string, body: unknown, headers: Record<string, string> = as("leo")) =>
  fetch(`${url}/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
export const answer = (url: string, id: string, body: unknown, headers: Record<string, string> = as("leo")) =>
  fetch(`${url}/sessions/${id}/turns`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

export async function start(t: TestContext, options: AppOptions): Promise<string> {
  const server = createApp(options).listen(0);
  t.after(() => server.close());
  await once(server, "listening");
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

// Claude, faked behind the real callAgent: each call gets the next reply scripted for its agent (the
// system prompt says which agent is calling, so two calls at once get their own replies)
export function fakeClaude(replies: [keyof typeof AGENTS, unknown][]) {
  const send: SendToClaude = async ({ system }) => {
    const next = replies.findIndex(([agent]) => AGENTS[agent].system === system);
    if (next < 0) throw new Error("a call the script doesn't have");
    const [, output] = replies.splice(next, 1)[0]!;
    const usage = { input_tokens: 1_000, output_tokens: 500, cache_creation_input_tokens: null, cache_read_input_tokens: null };
    return { message: { content: [{ type: "text", text: JSON.stringify(output) }], stop_reason: "end_turn", usage }, headers: new Headers() };
  };
  const logged: AgentLogEntry[] = [];
  const callAgentFor = createCallAgent({ send, model: "claude-opus-5-5", budgetUsd: 10, log: async (entry) => void logged.push(entry) });
  return { callAgentFor, logged };
}
