import { createApp } from "./app.ts";
import { surrealCheck, surrealConfigFromEnv } from "./db.ts";

const port = Number(process.env.PORT || 3000);
// Comma-separated: the Expo dev server, plus the deployed web build once it has a URL.
const corsOrigins = (process.env.CORS_ORIGIN ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
const surreal = surrealConfigFromEnv();

createApp({ corsOrigins, checkDb: surreal ? surrealCheck(surreal) : null }).listen(port, (error) => {
  if (error) throw error;
  const db = surreal ? `${new URL(surreal.url).host} (${surreal.namespace}/${surreal.database})` : "not configured";
  console.log(`api listening on :${port} · CORS: ${corsOrigins.join(", ") || "none"} · SurrealDB: ${db}`);
});
