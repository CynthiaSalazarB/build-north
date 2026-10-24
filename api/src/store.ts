import { MOVE_ORDER, Mastery, Session, SessionSummary, type MoveId } from "@build-north/agents";
import { RecordId, type Surreal } from "surrealdb";
import { queryTimeout } from "./db.ts";

export type NewSession = Pick<Session, "concept" | "material" | "mode">;

// All of the API's database code (CONTRACTS.md section 4). The orchestrator never comes here: the
// API loads a session and mastery, calls `advance`, and saves what it returns.

// Applied at every startup. Tables stay schemaless so the orchestrator's state can grow without a
// migration; the fields the API relies on get a type, so a bad write fails instead of saving.
const SCHEMA = `
DEFINE TABLE IF NOT EXISTS session SCHEMALESS;
DEFINE FIELD OVERWRITE user ON session TYPE string;
DEFINE FIELD OVERWRITE mode ON session TYPE "learn" | "test";
DEFINE FIELD OVERWRITE turn ON session TYPE int;
DEFINE FIELD OVERWRITE createdAt ON session TYPE datetime DEFAULT time::now() READONLY;
DEFINE INDEX OVERWRITE session_user ON session FIELDS user;

DEFINE TABLE IF NOT EXISTS mastery SCHEMALESS;
DEFINE FIELD OVERWRITE user ON mastery TYPE string;
DEFINE FIELD OVERWRITE concept ON mastery TYPE string;
DEFINE FIELD OVERWRITE move ON mastery TYPE "supraordinate" | "exclusion" | "isoordinate" | "infraordinate";
DEFINE FIELD OVERWRITE level ON mastery TYPE int ASSERT $value >= 1 AND $value <= 5;
DEFINE FIELD OVERWRITE unassistedSuccesses ON mastery TYPE int ASSERT $value >= 0;
DEFINE FIELD OVERWRITE updatedAt ON mastery TYPE datetime VALUE time::now();
DEFINE INDEX OVERWRITE mastery_user_concept ON mastery FIELDS user, concept;

DEFINE TABLE IF NOT EXISTS agent_log SCHEMALESS;
DEFINE FIELD OVERWRITE session ON agent_log TYPE record<session>;
DEFINE FIELD OVERWRITE agent ON agent_log TYPE string;
DEFINE FIELD OVERWRITE ms ON agent_log TYPE int;
DEFINE FIELD OVERWRITE usd ON agent_log TYPE number;
DEFINE FIELD OVERWRITE at ON agent_log TYPE datetime DEFAULT time::now() READONLY;
DEFINE INDEX OVERWRITE agent_log_session ON agent_log FIELDS session;
`;

/** `dropped`: on a coach or hint giver row, the fact ids its output cited that the API hadn't passed in (CONTRACTS.md, Memory). */
export type AgentLogEntry = { session: string; agent: string; input: unknown; output: unknown; ms: number; usd: number; dropped?: string[] };

export type Store = {
  createSession(user: string, input: NewSession, moveOrder?: readonly MoveId[]): Promise<Session>;
  // null when the session doesn't exist or belongs to someone else
  getSession(user: string, id: string): Promise<Session | null>;
  // GET /sessions: the user's sessions that have a Turn, newest first
  listSessions(user: string): Promise<SessionSummary[]>;
  // false when the stored session is no longer at `previousTurn`: another request answered it first
  saveSession(session: Session, previousTurn: number): Promise<boolean>;
  // every move, in session order; a move the learner hasn't touched yet is at level 1
  getMastery(user: string, concept: string): Promise<Mastery>;
  // the moves given, one row each; moves left out keep their rows (a Turn writes only what it changed)
  saveMastery(user: string, concept: string, mastery: Mastery): Promise<void>;
  getNextFocus(user: string, concept: string): Promise<MoveId | null>;
  logAgentCall(entry: AgentLogEntry): Promise<void>;
  // GET /me/memory: the concepts of the user's finished sessions, newest first, each once
  finishedConcepts(user: string): Promise<string[]>;
  // GET /me/memory: the memory fact ids each hint giver or coach call received, one list per agent_log row
  memoryReads(user: string): Promise<string[][]>;
  // DELETE /me/data: sessions, their agent logs, and mastery
  deleteUserData(user: string): Promise<void>;
};

export async function defineSchema(db: Surreal): Promise<void> {
  await db.query(SCHEMA).signal(queryTimeout()).collect();
}

// A new session before the orchestrator's first step, already valid against the Session schema in
// @build-north/agents: it starts in the predict phase with no hints on any move.
export function initialSession(user: string, { concept, material, mode }: NewSession, moveOrder: readonly MoveId[] = MOVE_ORDER): Omit<Session, "id" | "createdAt"> {
  return {
    user,
    concept,
    moveOrder: [...moveOrder],
    material,
    mode,
    turn: 0,
    lastTurn: null,
    predictedScore: null,
    firstAttempt: null,
    phase: "predict",
    move: null,
    hintStep: null,
    hintsPerMove: Object.fromEntries(MOVE_ORDER.map((move) => [move, 0])) as Record<MoveId, number>,
    mentefacto: { concept, supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] },
    recent: [],
    retries: 0,
    lastIssue: "none",
    nextQuestion: null,
    questions: { asked: 0, testing: 0 },
    moveLog: [],
    result: null,
  };
}

// saveSession writes every Session field but the ones fixed when the session starts, so a field the
// orchestrator adds to the contract is saved without a change here. The keys come from the schema,
// never from a request.
const FIXED_FIELDS = ["id", "user", "concept", "material", "mode", "createdAt"];
const SET_SESSION = Object.keys(Session.shape)
  .filter((key) => !FIXED_FIELDS.includes(key))
  .map((key) => `${key} = $s.${key}`)
  .join(", ");

export function createStore(db: Surreal): Store {
  // Runs one statement and returns its result as plain JSON (dates as ISO strings).
  async function one<T>(sql: string, bindings: Record<string, unknown>): Promise<T> {
    const [result] = await db.query(sql, bindings).json().signal(queryTimeout()).collect();
    return result as T;
  }
  const sessionId = (id: string) => new RecordId("session", id);

  // Rows go through the agents schemas on the way out, so a database that drifted from the contract
  // fails here instead of somewhere downstream.
  return {
    async createSession(user, input, moveOrder) {
      const session = await one("CREATE ONLY session CONTENT $content RETURN *, record::id(id) AS id", {
        content: initialSession(user, input, moveOrder),
      });
      return Session.parse(session);
    },

    async getSession(user, id) {
      const session = await one("SELECT *, record::id(id) AS id FROM ONLY $id WHERE user = $user", {
        id: sessionId(id),
        user,
      });
      return session ? Session.parse(session) : null;
    },

    async listSessions(user) {
      // a session whose first Turn never came back (the agent failed on the start) has nothing to show
      const rows = await one<unknown[]>(
        `SELECT record::id(id) AS id, concept, mode, createdAt, (result != NONE AND result != NULL) AS finished,
           result.score ?? NULL AS score, result.predictedScore ?? NULL AS predictedScore
         FROM session WHERE user = $user AND lastTurn != NONE AND lastTurn != NULL ORDER BY createdAt DESC LIMIT 200`,
        { user },
      );
      return rows.map((row) => SessionSummary.parse(row));
    },

    async saveSession(session, previousTurn) {
      // The WHERE checks and writes in one statement, so two answers to the same Turn can't both move it on.
      const saved = await one<unknown[]>(`UPDATE $id SET ${SET_SESSION} WHERE turn = $previousTurn RETURN VALUE turn`, {
        id: sessionId(session.id),
        previousTurn,
        s: session,
      });
      return saved.length > 0;
    },

    async getMastery(user, concept) {
      const rows = await one<{ move: string; level: number; unassistedSuccesses: number }[]>(
        "SELECT move, level, unassistedSuccesses FROM mastery WHERE user = $user AND concept = $concept",
        { user, concept: concept.trim().toLowerCase() },
      );
      return Mastery.parse({
        moves: MOVE_ORDER.map((move) => {
          const row = rows.find((r) => r.move === move);
          return { move, level: row?.level ?? 1, unassistedSuccesses: row?.unassistedSuccesses ?? 0 };
        }),
      });
    },

    async saveMastery(user, concept, { moves }) {
      // one statement, so the four moves are saved together or not at all
      await one(
        `FOR $m IN $moves {
           UPSERT type::record("mastery", [$user, $concept, $m.move]) SET user = $user, concept = $concept, move = $m.move,
             level = $m.level, unassistedSuccesses = $m.unassistedSuccesses;
         }`,
        { user, concept: concept.trim().toLowerCase(), moves },
      );
    },

    async getNextFocus(user, concept) {
      const rows = await one<{ nextFocus: string | null }[]>(
        `SELECT result.coach.nextFocus AS nextFocus FROM session
         WHERE user = $user AND string::lowercase(concept) = $concept AND result != NONE AND result != NULL
         ORDER BY createdAt DESC LIMIT 1`,
        { user, concept: concept.trim().toLowerCase() },
      );
      const focus = rows[0]?.nextFocus;
      return MOVE_ORDER.includes(focus as MoveId) ? (focus as MoveId) : null;
    },

    async logAgentCall({ session, agent, input, output, ms, usd, dropped }) {
      await one("CREATE agent_log CONTENT $entry RETURN NONE", {
        entry: { session: sessionId(session), agent, input, output, ms: Math.round(ms), usd, ...(dropped ? { dropped } : {}) },
      });
    },

    async finishedConcepts(user) {
      const rows = await one<{ concept: string }[]>("SELECT concept FROM session WHERE user = $user AND result != NONE AND result != NULL ORDER BY createdAt DESC", { user });
      return [...new Set(rows.map((row) => row.concept))];
    },

    async memoryReads(user) {
      // a path through the facts array gives the ids as one array; NONE on a call that got no memory
      const rows = await one<{ ids: unknown }[]>('SELECT input.memory.facts.id AS ids FROM agent_log WHERE session.user = $user AND agent IN ["hint_giver", "coach"]', { user });
      return rows.map((row) => (Array.isArray(row.ids) ? row.ids.filter((id): id is string => typeof id === "string") : []));
    },

    async deleteUserData(user) {
      await db
        .query(
          `BEGIN;
           DELETE agent_log WHERE session.user = $user;
           DELETE session WHERE user = $user;
           DELETE mastery WHERE user = $user;
           COMMIT;`,
          { user },
        )
        .signal(queryTimeout())
        .collect();
    },
  };
}
