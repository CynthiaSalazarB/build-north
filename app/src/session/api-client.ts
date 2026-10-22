// #7: the real API (CONTRACTS.md section 1). Every response that carries a Turn is checked against the
// Turn schema, so a server that drifted from the contract fails here, not in a screen.
import { Turn, type CreateSessionBody, type TurnBody } from "@build-north/agents";
import { ClientError, type SessionClient } from "./client.ts";

export type ApiClientOptions = {
  baseUrl: string;
  /** Until Clerk (#22): x-dev-user, which the API only accepts with x-dev-key. Never in a deployed web build. */
  devUser?: string | null;
  devKey?: string | null;
  /** The Clerk session token, sent as Authorization: Bearer (#22). */
  getToken?: () => Promise<string | null>;
  fetch?: typeof fetch;
  timeoutMs?: number;
};

const OFFLINE = "Can't reach the server. Check your connection and try again.";

export function createApiClient({ baseUrl, devUser, devKey, getToken, fetch: send = fetch, timeoutMs = 60_000 }: ApiClientOptions): SessionClient {
  const root = baseUrl.replace(/\/+$/, "");

  async function post(path: string, body: unknown): Promise<Turn> {
    const headers: Record<string, string> = { "content-type": "application/json" };
    const token = getToken ? await getToken() : null;
    if (token) headers.authorization = `Bearer ${token}`;
    else if (devUser && devKey) {
      headers["x-dev-user"] = devUser;
      headers["x-dev-key"] = devKey;
    }

    // AbortController rather than AbortSignal.timeout, which React Native may not have
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutMs);
    let res: Response;
    try {
      res = await send(`${root}${path}`, { method: "POST", headers, body: JSON.stringify(body), signal: abort.signal });
    } catch {
      throw new ClientError(OFFLINE, null, true);
    } finally {
      clearTimeout(timer);
    }
    const json: unknown = await res.json().catch(() => null);

    // A 409 answers with the session's latest Turn (decision 18 and #73), so the app just redraws it.
    if (res.ok || res.status === 409) {
      const turn = Turn.safeParse(json);
      if (turn.success) return turn.data;
      if (res.ok) throw new ClientError("The server sent something unexpected. Try again.", res.status, true);
    }
    const message = (json as { error?: unknown } | null)?.error;
    throw new ClientError(
      typeof message === "string" ? message : `The server answered ${res.status}.`,
      res.status,
      res.status === 429 || res.status >= 500,
    );
  }

  return {
    offline: false,
    start: (body: CreateSessionBody) => post("/sessions", body),
    send: (sessionId: string, body: TurnBody) => post(`/sessions/${encodeURIComponent(sessionId)}/turns`, body),
  };
}
