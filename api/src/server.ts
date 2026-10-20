import Anthropic from "@anthropic-ai/sdk";
import { advanceStub, callAgentStub } from "./advance-stub.ts";
import { createApp } from "./app.ts";
import { agentConfigFromEnv, createCallAgent, sendWith } from "./call-agent.ts";
import { connectSurreal, surrealCheck, surrealConfigFromEnv } from "./db.ts";
import { createStore, defineSchema } from "./store.ts";

const port = Number(process.env.PORT || 3000);
// Comma-separated: the Expo dev server, plus the deployed web build once it has a URL.
const corsOrigins = (process.env.CORS_ORIGIN ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
const surreal = surrealConfigFromEnv();
const db = surreal ? connectSurreal(surreal) : null;
if (db) defineSchema(db).catch((error: unknown) => console.error("SurrealDB schema failed:", error));
const store = db ? createStore(db) : null;
// x-dev-user works only with a DEV_KEY set, and never in production (CONTRACTS.md section 1).
const devKey = process.env.NODE_ENV === "production" ? null : process.env.DEV_KEY?.trim() || null;
// Claude calls (#10) need ANTHROPIC_API_KEY, a budget, and a database for their agent_log rows.
// Without them the stand-in fails loudly if anything asks for an agent.
const agents = agentConfigFromEnv();
const callAgentFor =
  agents && store
    ? createCallAgent({
        ...agents,
        // one retry, and no learner waits on a call longer than 30 s
        send: sendWith(new Anthropic({ maxRetries: 1, timeout: 30_000 })),
        // Temporary: no prompts until Cynthia's #2 lands, so every agent fails with a clear error
        prompts: {},
        log: (entry) => store.logAgentCall(entry),
      })
    : () => callAgentStub;

createApp({
  corsOrigins,
  checkDb: db ? surrealCheck(db) : null,
  store,
  advance: advanceStub,
  callAgentFor,
  devKey,
}).listen(port, (error) => {
  if (error) throw error;
  const dbInfo = surreal ? `${new URL(surreal.url).host} (${surreal.namespace}/${surreal.database})` : "not configured";
  const claude = agents && store ? `${agents.model}, $${agents.budgetUsd} budget` : "off";
  console.log(
    `api listening on :${port} · CORS: ${corsOrigins.join(", ") || "none"} · SurrealDB: ${dbInfo} · x-dev-user: ${devKey ? "on, with x-dev-key" : "off"} · Claude: ${claude}`,
  );
});
