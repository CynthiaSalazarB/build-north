import { CreateSessionBody, Turn, TurnBody, UnexpectedInput, type Advance, type CallAgent, type Expects, type Mastery } from "@build-north/agents";
import cors from "cors";
import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { createHash, timingSafeEqual } from "node:crypto";
import type { DbCheck } from "./db.ts";
import { fillSources, withMemory, type LearnerMemoryStore } from "./memory.ts";
import type { NewSession, Store } from "./store.ts";

export type AppOptions = {
  corsOrigins: string[];
  checkDb: (() => Promise<DbCheck>) | null;
  store: Store | null;
  // CONTRACTS.md section 3: the orchestrator and the only way it reaches Claude, one callAgent per
  // session so every agent_log row names its session
  advance: Advance;
  callAgentFor: (sessionId: string) => CallAgent;
  // CONTRACTS.md section 1: the Clerk user id in a session token, or null for a token that doesn't
  // hold up (#23). null when Clerk isn't set up (no CLERK_JWT_KEY), so no token signs anyone in.
  userFromToken: ((token: string) => Promise<string | null>) | null;
  // Outside production, x-dev-user also names the caller, but only with x-dev-key matching this key.
  // null turns dev users off (production, or no DEV_KEY set).
  devKey: string | null;
  // per IP, for every route except /health
  requestsPerMinute?: number;
  // CONTRACTS.md section 2, Memory (#112): what earlier sessions left, read before the hint giver and the coach,
  // written when a session has its result, shown by GET /me/memory and purged by DELETE /me/data. null with the
  // flag off: every route then runs as before memory existed.
  memory: LearnerMemoryStore | null;
  // The commit this process runs (Render's RENDER_GIT_COMMIT, shortened), so /health says what is live
  // without a dashboard visit. null when unknown (local runs, tests).
  commit?: string | null;
};

const MAX_CONCEPT = 100;
const DEV_USER = /^[A-Za-z0-9._@-]{1,64}$/;
const SESSION_ID = /^[a-z0-9]{1,40}$/; // the ids SurrealDB generates

// CONTRACTS.md section 1: what a /turns body may send for each `expects`. Help goes by the phase
// instead: it works during the moves, the whole map included, where `advance` has a hint to give.
const ANSWERS: Record<Expects, readonly string[]> = {
  prediction: ["prediction"],
  text: ["text"],
  continue: ["continue"],
  map: ["question", "mentefacto"],
  none: [],
};
const TURN_BODY = 'Send turn with one of: prediction (0 to 8), text, question, mentefacto, or action ("help" or "continue")';

// Hashing first gives timingSafeEqual two buffers of the same length, whatever was sent.
const digest = (text: string) => createHash("sha256").update(text).digest();
const sameKey = (sent: string, expected: string) => timingSafeEqual(digest(sent), digest(expected));

// A schema's issues as one line for the response
const describe = (issues: readonly { path: readonly PropertyKey[]; message: string }[]) =>
  issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ");

type Parsed<T> = { ok: true; value: T } | { ok: false; status: number; error: string };

/** The moves whose level or count of unassisted successes `after` changed from `before`: what a Turn writes
 * back, so the moves it left alone keep whatever a parallel session saved meanwhile. */
export function changedMoves(before: Mastery, after: Mastery): Mastery["moves"] {
  return after.moves.filter((m) => {
    const was = before.moves.find((b) => b.move === m.move);
    return !was || was.level !== m.level || was.unassistedSuccesses !== m.unassistedSuccesses;
  });
}

// The body schema is Cynthia's (@build-north/agents). The API adds what the schema leaves to it: 413
// for notes over 8,000 characters, a cap on the concept's length, and trimming.
function parseNewSession(body: unknown): Parsed<NewSession> {
  const parsed = CreateSessionBody.safeParse(body);
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some((issue) => issue.path[0] === "material" && issue.code === "too_big");
    if (tooLong) return { ok: false, status: 413, error: "Your notes are over 8,000 characters. Paste a shorter excerpt." };
    return { ok: false, status: 400, error: describe(parsed.error.issues) };
  }
  const { concept, material, mode = "learn" } = parsed.data;
  if (!concept.trim() || concept.trim().length > MAX_CONCEPT) {
    return { ok: false, status: 400, error: `concept must be text, 1 to ${MAX_CONCEPT} characters` };
  }
  return { ok: true, value: { concept: concept.trim(), material: material?.trim() ? material : null, mode } };
}

export function createApp({ corsOrigins, checkDb, store, advance, callAgentFor, userFromToken, devKey, requestsPerMinute = 60, memory, commit = null }: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  // Render puts one proxy in front of the app; trusting it makes req.ip the caller's address.
  app.set("trust proxy", 1);
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "64kb" }));

  // The Clerk user id from the session token. Without a token, x-dev-user with the right x-dev-key,
  // which devKey turns off in production. A token that doesn't hold up never falls back to the dev headers.
  async function signedIn(req: Request): Promise<string | null> {
    const token = /^Bearer (\S+)$/i.exec(req.get("authorization") ?? "")?.[1];
    if (token) return userFromToken ? userFromToken(token) : null;
    const name = req.get("x-dev-user");
    const key = req.get("x-dev-key");
    return devKey && name && DEV_USER.test(name) && key && sameKey(key, devKey) ? name : null;
  }

  // Who is calling, and whether there is a database to serve them. Answers the request itself when not.
  async function caller(req: Request, res: Response): Promise<{ user: string; store: Store } | null> {
    const user = await signedIn(req);
    if (!user) {
      const devHeaders = devKey ? ", or x-dev-user with x-dev-key" : "";
      res.status(401).json({ error: `Sign in first: send the Clerk session token as Authorization: Bearer <token>${devHeaders}` });
      return null;
    }
    if (!store) {
      res.status(503).json({ error: "SurrealDB is not configured (SURREAL_URL is unset)" });
      return null;
    }
    return { user, store };
  }

  // `ok` is what Render's health check reads; `commit` and `memory` let anyone confirm which commit is live
  // and whether the memory flag is on, with one request and no dashboard. Neither is a secret.
  app.get("/health", (_req, res) => {
    res.json({ ok: true, commit, memory: memory ? "on" : "off" });
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
    const who = await caller(req, res);
    if (!who) return;
    const parsed = parseNewSession(req.body);
    if (!parsed.ok) {
      res.status(parsed.status).json({ error: parsed.error });
      return;
    }
    // CONTRACTS.md section 3: load, advance, save what comes back, return the Turn
    const session = await who.store.createSession(who.user, parsed.value);
    const mastery = await who.store.getMastery(who.user);
    const next = await advance({ session, mastery }, { action: "start" }, callAgentFor(session.id));
    // nothing else knows this session's id yet, so this save can't lose to another request
    await who.store.saveSession(next.session, session.turn);
    // CONTRACTS.md section 3: a test session never writes mastery, and a start changes none, so this writes
    // nothing in practice; the rule is the same as /turns
    const changed = changedMoves(mastery, next.mastery);
    if (session.mode !== "test" && changed.length > 0) await who.store.saveMastery(who.user, { moves: changed });
    res.status(201).json(next.turn);
  });

  // Start's lists (CONTRACTS.md section 1): the sessions to pick up and "Your maps"
  app.get("/sessions", async (req, res) => {
    const who = await caller(req, res);
    if (!who) return;
    res.json({ sessions: await who.store.listSessions(who.user) });
  });

  app.get("/sessions/:id", async (req, res) => {
    const who = await caller(req, res);
    if (!who) return;
    const session = SESSION_ID.test(req.params.id) ? await who.store.getSession(who.user, req.params.id) : null;
    if (!session?.lastTurn) {
      res.status(404).json({ error: "No such session" });
      return;
    }
    res.json(session.lastTurn);
  });

  app.post("/sessions/:id/turns", async (req, res) => {
    const who = await caller(req, res);
    if (!who) return;
    const parsed = TurnBody.safeParse(req.body);
    if (!parsed.success) {
      // a body that matches none of the shapes gets the list instead of Zod's "Invalid input"
      const noShape = parsed.error.issues[0]?.code === "invalid_union";
      res.status(400).json({ error: noShape ? TURN_BODY : describe(parsed.error.issues) });
      return;
    }
    const session = SESSION_ID.test(req.params.id) ? await who.store.getSession(who.user, req.params.id) : null;
    if (!session?.lastTurn) {
      res.status(404).json({ error: "No such session" });
      return;
    }
    const { turn, ...input } = parsed.data;
    const latest = session.lastTurn;
    // Decision 18: an answer to an older Turn was judged already, so it gets the latest Turn back
    if (turn < session.turn) {
      res.json(latest);
      return;
    }
    // CONTRACTS.md section 5: a 409 answers with the latest Turn too, so the app draws whatever /turns
    // sends back. The reason goes to the server log.
    const conflict = (reason: string) => {
      console.warn(`409 for session ${session.id}: ${reason}`);
      res.status(409).json(latest);
    };
    if (turn > session.turn) {
      conflict(`Turn ${turn} doesn't exist yet; the latest is ${session.turn}`);
      return;
    }
    const sent = "action" in input ? input.action : (Object.keys(input)[0] ?? "");
    const { expects } = latest;
    const allowed = sent === "help" ? session.phase === "move" : ANSWERS[expects].includes(sent);
    if (!allowed) {
      conflict(expects === "none" ? "This session is over" : sent === "help" ? "Help works during the moves" : `Turn ${turn} expects ${expects}, not ${sent}`);
      return;
    }
    const mastery = await who.store.getMastery(who.user);
    // The hint giver and the coach get what this learner's earlier sessions left, read once per Turn and only
    // when one of them runs; over 1.5 s, empty or off, they run without it (CONTRACTS.md section 2, Memory).
    const remembered = memory ? withMemory(callAgentFor(session.id), () => memory.recall(who.user, session.concept, session.id)) : null;
    const next = await advance({ session, mastery }, input, remembered?.callAgent ?? callAgentFor(session.id)).catch((error: unknown) => {
      // input that doesn't fit the phase changes nothing
      if (error instanceof UnexpectedInput) return error;
      throw error;
    });
    if (next instanceof UnexpectedInput) {
      conflict(next.message);
      return;
    }
    // CONTRACTS.md section 5: an agent failed, so nothing moved on and there is nothing to save. Writing the
    // unchanged session and mastery back here could overwrite what a parallel request saved meanwhile.
    if (next.turn.error) {
      res.json(next.turn);
      return;
    }
    // the words of the facts a hint or the coach cited, so the app can show where they came from
    if (remembered) fillSources(next.turn, remembered.given());
    // The Turn is what the app draws and what the session keeps as its lastTurn, so one off the contract (an agent's
    // output reaching a stricter Turn field, as #139 found) would be refused by the app and fail every later read of
    // the session. It is never saved: the learner gets the latest Turn again with error set, and the retry runs
    // the agents again (CONTRACTS.md section 5).
    const checked = Turn.safeParse(next.turn);
    if (!checked.success) {
      console.error(`Turn ${next.turn.turn} of session ${session.id} is off the contract and wasn't saved: ${describe(checked.error.issues)}`);
      res.json({ ...latest, error: { code: "agent_failed", retryable: true } });
      return;
    }
    if (!(await who.store.saveSession(next.session, session.turn))) {
      // another request answering the same Turn saved first, and its Turn is the one that counts
      const saved = await who.store.getSession(who.user, session.id);
      if (saved?.lastTurn) res.json(saved.lastTurn);
      else res.status(404).json({ error: "No such session" });
      return;
    }
    // CONTRACTS.md section 3: a test session never writes mastery. Only the moves this Turn changed are written:
    // the copy read before the Claude call is seconds old, and writing all four back could undo a level another
    // session saved since.
    const changed = changedMoves(mastery, next.mastery);
    if (session.mode !== "test" && changed.length > 0) await who.store.saveMastery(who.user, { moves: changed });
    // The session has its result: what it leaves for the next one is written off the request path. The tables
    // above stay the record, so a memory that is down costs the learner nothing but the facts; the cause is logged.
    if (memory && next.session.result && !session.result) {
      memory.remember(who.user, next.session).catch((error: unknown) => console.error(`memory write failed for session ${session.id}:`, error));
    }
    res.json(next.turn);
  });

  // The Memory sheet (CONTRACTS.md section 2b). Empty with memory off, so the app says there is nothing yet.
  app.get("/me/memory", async (req, res) => {
    const who = await caller(req, res);
    if (!who) return;
    if (!memory) {
      res.json({ concepts: [] });
      return;
    }
    const [concepts, reads] = await Promise.all([who.store.finishedConcepts(who.user), who.store.memoryReads(who.user)]);
    res.json(await memory.view(who.user, concepts, reads));
  });

  app.get("/me/mastery", async (req, res) => {
    const who = await caller(req, res);
    if (!who) return;
    res.json(await who.store.getMastery(who.user));
  });

  // The delete button: the caller's memory scope, then their sessions, their agent logs, and mastery. Memory goes
  // first: if its purge fails, the request fails and nothing is half deleted; the learner can try again.
  app.delete("/me/data", async (req, res) => {
    const who = await caller(req, res);
    if (!who) return;
    if (memory) await memory.purge(who.user);
    await who.store.deleteUserData(who.user);
    res.status(204).end();
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
