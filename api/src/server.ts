import { advanceStub } from "./advance-stub.ts";
import { createApp } from "./app.ts";
import { connectSurreal, surrealCheck, surrealConfigFromEnv } from "./db.ts";
import { createStore, defineSchema } from "./store.ts";

const port = Number(process.env.PORT || 3000);
// Comma-separated: the Expo dev server, plus the deployed web build once it has a URL.
const corsOrigins = (process.env.CORS_ORIGIN ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
const surreal = surrealConfigFromEnv();
const db = surreal ? connectSurreal(surreal) : null;
if (db) defineSchema(db).catch((error: unknown) => console.error("SurrealDB schema failed:", error));
// x-dev-user works only with a DEV_KEY set, and never in production (CONTRACTS.md section 1).
const devKey = process.env.NODE_ENV === "production" ? null : process.env.DEV_KEY?.trim() || null;

createApp({
  corsOrigins,
  checkDb: db ? surrealCheck(db) : null,
  store: db ? createStore(db) : null,
  advance: advanceStub,
  devKey,
}).listen(port, (error) => {
  if (error) throw error;
  const dbInfo = surreal ? `${new URL(surreal.url).host} (${surreal.namespace}/${surreal.database})` : "not configured";
  console.log(
    `api listening on :${port} · CORS: ${corsOrigins.join(", ") || "none"} · SurrealDB: ${dbInfo} · x-dev-user: ${devKey ? "on, with x-dev-key" : "off"}`,
  );
});
