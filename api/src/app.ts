import { CreateSessionBody, type Advance, type CallAgent } from "@build-north/agents";
import cors from "cors";
import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { createHash, timingSafeEqual } from "node:crypto";
import type { DbCheck } from "./db.ts";
import type { NewSession, Store } from "./store.ts";

export type AppOptions = {
  corsOrigins: string[];
  checkDb: (() => Promise<DbCheck>) | null;
  store: Store | null;
  // CONTRACTS.md section 3: the orchestrator and the only way it reaches Claude
  advance: Advance;
  callAgent: CallAgent;
  // CONTRACTS.md section 1: until Clerk lands (#23), x-dev-user names the caller, and it only counts
  // with x-dev-key matching this key. null turns dev users off (production, or no DEV_KEY set).
  devKey: string | null;
  // per IP, for every route except /health
  requestsPerMinute?: number;
};

const MAX_CONCEPT = 100;
const DEV_USER = /^[A-Za-z0-9._@-]{1,64}$/;
const SESSION_ID = /^[a-z0-9]{1,40}$/; // the ids SurrealDB generates

// Hashing first gives timingSafeEqual two buffers of the same length, whatever was sent.
const digest = (text: string) => createHash("sha256").update(text).digest();
const sameKey = (sent: string, expected: string) => timingSafeEqual(digest(sent), digest(expected));

type Parsed<T> = { ok: true; value: T } | { ok: false; status: number; error: string };

// The body schema is Cynthia's (@build-north/agents). The API adds what the schema leaves to it: 413
// for notes over 8,000 characters, a cap on the concept's length, and trimming.
function parseNewSession(body: unknown): Parsed<NewSession> {
  const parsed = CreateSessionBody.safeParse(body);
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some((issue) => issue.path[0] === "material" && issue.code === "too_big");
    if (tooLong) return { ok: false, status: 413, error: "Your notes are over 8,000 characters. Paste a shorter excerpt." };
    const why = parsed.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ");
    return { ok: false, status: 400, error: why };
  }
  const { concept, material, mode = "learn" } = parsed.data;
  if (!concept.trim() || concept.trim().length > MAX_CONCEPT) {
    return { ok: false, status: 400, error: `concept must be text, 1 to ${MAX_CONCEPT} characters` };
  }
  return { ok: true, value: { concept: concept.trim(), material: material?.trim() ? material : null, mode } };
}

export function createApp({ corsOrigins, checkDb, store, advance, callAgent, devKey, requestsPerMinute = 60 }: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  // Render puts one proxy in front of the app; trusting it makes req.ip the caller's address.
  app.set("trust proxy", 1);
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "64kb" }));

  // Who is calling, and whether there is a database to serve them. Answers the request itself when not.
  function caller(req: Request, res: Response): { user: string; store: Store } | null {
    const name = req.get("x-dev-user");
    const key = req.get("x-dev-key");
    if (!devKey || !name || !DEV_USER.test(name) || !key || !sameKey(key, devKey)) {
      res.status(401).json({ error: "Sign in first. Until Clerk lands (Oct 21), send x-dev-user and x-dev-key" });
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

  // After /health, so Render's health checks never count against it.
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: requestsPerMinute,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({ error: "Too many requests. Wait a minute and try again" });
      },
    }),
  );

  // Ops check, not part of the app contract: proves the API can reach SurrealDB.
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
    const next = await advance({ session, mastery: await who.store.getMastery(who.user) }, { action: "start" }, callAgent);
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
