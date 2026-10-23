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
const SLOW = "The server is taking too long. Try again.";

/** The server gives each Claude call 30 s and one retry (api/src/server.ts), so one slow turn can take a minute;
 * the app waits a little past that before giving up. An answer sent again after this is judged once: the `turn`
 * number tells the server it already has it (CONTRACTS.md section 1). */
const TIMEOUT_MS = 90_000;

export function createApiClient({ baseUrl, devUser, devKey, getToken, fetch: send = fetch, timeoutMs = TIMEOUT_MS }: ApiClientOptions): SessionClient {
  const root = baseUrl.replace(/\/+$/, "");

  /** One call with the learner's credentials; the answer's body is parsed as JSON when there is one. */
  async function call(method: "POST" | "DELETE", path: string, body?: unknown): Promise<{ res: Response; json: unknown }> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["content-type"] = "application/json";
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
      res = await send(`${root}${path}`, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: abort.signal });
    } catch {
      // the timer fired, or the network did: both are worth trying again, and the words say which
      throw new ClientError(abort.signal.aborted ? SLOW : OFFLINE, null, true);
    } finally {
      clearTimeout(timer);
    }
    const json: unknown = res.status === 204 ? null : await res.json().catch(() => null);
    return { res, json };
  }

  /** The server's own message when it sent one; a 429 or a 5xx is worth trying again. */
  const errorOf = (res: Response, json: unknown) => {
    const message = (json as { error?: unknown } | null)?.error;
    return new ClientError(typeof message === "string" ? message : `The server answered ${res.status}.`, res.status, res.status === 429 || res.status >= 500);
  };

  async function post(path: string, body: unknown): Promise<Turn> {
    const { res, json } = await call("POST", path, body);
    // A 409 answers with the session's latest Turn (decision 18 and #73), so the app just redraws it.
    if (res.ok || res.status === 409) {
      const turn = Turn.safeParse(json);
      if (turn.success) return turn.data;
      if (res.ok) throw new ClientError("The server sent something unexpected. Try again.", res.status, true);
    }
    throw errorOf(res, json);
  }

  return {
    offline: false,
    start: (body: CreateSessionBody) => post("/sessions", body),
    send: (sessionId: string, body: TurnBody) => post(`/sessions/${encodeURIComponent(sessionId)}/turns`, body),
    async deleteData() {
      const { res, json } = await call("DELETE", "/me/data");
      if (!res.ok) throw errorOf(res, json);
    },
  };
}
