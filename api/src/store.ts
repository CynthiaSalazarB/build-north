import { RecordId, type Surreal } from "surrealdb";
import { MOVES, type Level, type Mastery, type MoveId, type NewSession, type Session } from "./contract.ts";
import { queryTimeout } from "./db.ts";

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
DEFINE FIELD OVERWRITE move ON mastery TYPE "supraordinate" | "exclusion" | "isoordinate" | "infraordinate";
DEFINE FIELD OVERWRITE level ON mastery TYPE int ASSERT $value >= 1 AND $value <= 5;
DEFINE FIELD OVERWRITE unassistedSuccesses ON mastery TYPE int ASSERT $value >= 0;
DEFINE FIELD OVERWRITE updatedAt ON mastery TYPE datetime VALUE time::now();
DEFINE INDEX OVERWRITE mastery_user ON mastery FIELDS user;

DEFINE TABLE IF NOT EXISTS agent_log SCHEMALESS;
DEFINE FIELD OVERWRITE session ON agent_log TYPE record<session>;
DEFINE FIELD OVERWRITE agent ON agent_log TYPE string;
DEFINE FIELD OVERWRITE ms ON agent_log TYPE int;
DEFINE FIELD OVERWRITE at ON agent_log TYPE datetime DEFAULT time::now() READONLY;
DEFINE INDEX OVERWRITE agent_log_session ON agent_log FIELDS session;
`;

export type AgentLogEntry = { session: string; agent: string; input: unknown; output: unknown; ms: number };

export type Store = {
  createSession(user: string, input: NewSession): Promise<Session>;
  // null when the session doesn't exist or belongs to someone else
  getSession(user: string, id: string): Promise<Session | null>;
  saveSession(session: Session): Promise<void>;
  // every move, in session order; a move the learner hasn't touched yet is at level 1
  getMastery(user: string): Promise<Mastery>;
  saveMastery(user: string, mastery: Mastery): Promise<void>;
  logAgentCall(entry: AgentLogEntry): Promise<void>;
  // DELETE /me/data: sessions, their agent logs, and mastery
  deleteUserData(user: string): Promise<void>;
};

export async function defineSchema(db: Surreal): Promise<void> {
  await db.query(SCHEMA).signal(queryTimeout()).collect();
}

// A new session before the orchestrator's first step; `advance` fills in the rest.
export function initialSession(user: string, { concept, material, mode }: NewSession): Omit<Session, "id" | "createdAt"> {
  return {
    user,
    concept,
    material,
    mode,
    turn: 0,
    lastTurn: null,
    predictedScore: null,
    firstAttempt: null,
    phase: null,
    move: null,
    hintStep: null,
    hintsPerMove: {},
    mentefacto: { concept, supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] },
    result: null,
  };
}

export function createStore(db: Surreal): Store {
  // Runs one statement and returns its result as plain JSON (dates as ISO strings).
  async function one<T>(sql: string, bindings: Record<string, unknown>): Promise<T> {
    const [result] = await db.query(sql, bindings).json().signal(queryTimeout()).collect();
    return result as T;
  }
  const sessionId = (id: string) => new RecordId("session", id);

  return {
    async createSession(user, input) {
      return one<Session>("CREATE ONLY session CONTENT $content RETURN *, record::id(id) AS id", {
        content: initialSession(user, input),
      });
    },

    async getSession(user, id) {
      const session = await one<Session | null>("SELECT *, record::id(id) AS id FROM ONLY $id WHERE user = $user", {
        id: sessionId(id),
        user,
      });
      return session ?? null;
    },

    async saveSession({ id, turn, lastTurn, predictedScore, firstAttempt, phase, move, hintStep, hintsPerMove, mentefacto, result }) {
      // user, concept, material, mode and createdAt never change after the session starts
      await one(
        `UPDATE ONLY $id SET turn = $s.turn, lastTurn = $s.lastTurn, predictedScore = $s.predictedScore,
           firstAttempt = $s.firstAttempt, phase = $s.phase, move = $s.move, hintStep = $s.hintStep,
           hintsPerMove = $s.hintsPerMove, mentefacto = $s.mentefacto, result = $s.result`,
        { id: sessionId(id), s: { turn, lastTurn, predictedScore, firstAttempt, phase, move, hintStep, hintsPerMove, mentefacto, result } },
      );
    },

    async getMastery(user) {
      const rows = await one<{ move: MoveId; level: Level; unassistedSuccesses: number }[]>(
        "SELECT move, level, unassistedSuccesses FROM mastery WHERE user = $user",
        { user },
      );
      return {
        moves: MOVES.map((move) => {
          const row = rows.find((r) => r.move === move);
          return { move, level: row?.level ?? 1, unassistedSuccesses: row?.unassistedSuccesses ?? 0 };
        }),
      };
    },

    async saveMastery(user, { moves }) {
      // one statement, so the four moves are saved together or not at all
      await one(
        `FOR $m IN $moves {
           UPSERT type::record("mastery", [$user, $m.move]) SET user = $user, move = $m.move,
             level = $m.level, unassistedSuccesses = $m.unassistedSuccesses;
         }`,
        { user, moves },
      );
    },

    async logAgentCall({ session, agent, input, output, ms }) {
      await one("CREATE agent_log CONTENT $entry RETURN NONE", {
        entry: { session: sessionId(session), agent, input, output, ms: Math.round(ms) },
      });
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
