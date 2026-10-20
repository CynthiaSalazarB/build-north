import cors from "cors";
import express from "express";
import type { DbCheck } from "./db.ts";

export type AppOptions = {
  corsOrigins: string[];
  checkDb: (() => Promise<DbCheck>) | null;
};

export function createApp({ corsOrigins, checkDb }: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: corsOrigins }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Ops check, not part of the app contract: proves the API can write to and read from SurrealDB.
  app.get("/health/db", async (_req, res) => {
    if (!checkDb) {
      res.status(503).json({ ok: false, error: "SurrealDB is not configured (SURREAL_URL is unset)" });
      return;
    }
    try {
      res.json({ ok: true, ...(await checkDb()) });
    } catch (error) {
      console.error("GET /health/db failed:", error);
      res.status(503).json({ ok: false, error: "SurrealDB check failed; the cause is in the server logs" });
    }
  });

  return app;
}
