import cors from "cors";
import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import type { Advance } from "./advance-stub.ts";
import type { Mode, NewSession } from "./contract.ts";
import type { DbCheck } from "./db.ts";
import type { Store } from "./store.ts";

export type AppOptions = {
  corsOrigins: string[];
  checkDb: (() => Promise<DbCheck>) | null;
  store: Store | null;
  advance: Advance;
  // CONTRACTS.md section 1: the x-dev-user header stands in for Clerk until Oct 21, never in production
  allowDevUser: boolean;
};

const MAX_CONCEPT = 100;
const MAX_MATERIAL = 8_000;
const DEV_USER = /^[A-Za-z0-9._@-]{1,64}$/;
const SESSION_ID = /^[a-z0-9]{1,40}$/; // the ids SurrealDB generates

type Parsed<T> = { ok: true; value: T } | { ok: false; status: number; error: string };

function parseNewSession(body: unknown): Parsed<NewSession> {
  const { concept, material, mode } = (body ?? {}) as Record<string, unknown>;
  if (typeof concept !== "string" || !concept.trim() || concept.length > MAX_CONCEPT) {
    return { ok: false, status: 400, error: `concept must be text, 1 to ${MAX_CONCEPT} characters` };
  }
  if (material != null && typeof material !== "string") return { ok: false, status: 400, error: "material must be text" };
  if (typeof material === "string" && material.length > MAX_MATERIAL) {
    return { ok: false, status: 413, error: "Your notes are over 8,000 characters. Paste a shorter excerpt." };
  }
  if (mode != null && mode !== "learn" && mode !== "test") return { ok: false, status: 400, error: 'mode must be "learn" or "test"' };
  return {
    ok: true,
    value: { concept: concept.trim(), material: material?.trim() ? material : null, mode: (mode ?? "learn") as Mode },
  };
}

export function createApp({ corsOrigins, checkDb, store, advance, allowDevUser }: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "64kb" }));

  // Who is calling, and whether there is a database to serve them. Answers the request itself when not.
  function caller(req: Request, res: Response): { user: string; store: Store } | null {
    const name = req.get("x-dev-user");
    if (!allowDevUser || !name || !DEV_USER.test(name)) {
      res.status(401).json({ error: "Sign in first. Until Clerk lands (Oct 21), send an x-dev-user header" });
      return null;
    }
    if (!store) {
      res.status(503).json({ error: "SurrealDB is not configured (SURREAL_URL is unset)" });
      return null;
    }
    return { user: name, store };
  }

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

  app.post("/sessions", async (req, res) => {
    const who = caller(req, res);
    if (!who) return;
    const parsed = parseNewSession(req.body);
    if (!parsed.ok) {
      res.status(parsed.status).json({ error: parsed.error });
      return;
    }
    // CONTRACTS.md section 3: load, advance, save what comes back, return the Turn
    const session = await who.store.createSession(who.user, parsed.value);
    const next = await advance({ session, mastery: await who.store.getMastery(who.user) }, { action: "start" });
    await who.store.saveSession(next.session);
    await who.store.saveMastery(who.user, next.mastery);
    res.status(201).json(next.turn);
  });

  app.get("/sessions/:id", async (req, res) => {
    const who = caller(req, res);
    if (!who) return;
    const session = SESSION_ID.test(req.params.id) ? await who.store.getSession(who.user, req.params.id) : null;
    if (!session?.lastTurn) {
      res.status(404).json({ error: "No such session" });
      return;
    }
    res.json(session.lastTurn);
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Every error answers in JSON, never with a stack trace. body-parser marks its own errors with a
  // status: 400 for broken JSON, 413 for a body over the limit.
  const onError: ErrorRequestHandler = (error, _req, res, _next) => {
    const status = typeof error?.status === "number" && error.status < 500 ? error.status : 500;
    if (status === 500) console.error(error);
    res.status(status).json({ error: status === 500 ? "Something went wrong; the cause is in the server logs" : String(error.message) });
  };
  app.use(onError);

  return app;
}
