import { createHash } from "node:crypto";
import { AgentMemory, AgentMemoryError, type AttributeDetailJson, type QueryResponseJson } from "@surrealdb/memory";
import {
  EvaluatorInput,
  EvaluatorOutput,
  FactDeskInput,
  FactDeskOutput,
  MOVE_ORDER,
  NoteSource,
  WholeMapEvaluatorInput,
  WholeMapEvaluatorOutput,
  type AgentName,
  type CallAgent,
  type Item,
  type LearnerMemory,
  type Mentefacto,
  type MoveId,
  type Session,
  type Turn,
} from "@build-north/agents";

// SurrealDB Agent Memory (the SurrealDB prize, wiki/context/surrealdb-sponsor-prize.md): what the agents
// learn about a learner, shared by all of them and kept across sessions. One scope per learner holds the
// notes they paste and what the evaluators found on each part, where a later fact on a part replaces the
// earlier one and Agent Memory keeps the history. It all happens around the agent calls the API already
// makes; the orchestrator never sees it (CONTRACTS.md section 4, "Agent Memory").
//
// A memory call never fails a turn: a turn waits at most TURN_WAIT_MS for a read, the writes happen after
// the Turn is saved, off the learner's wait, and every failure is logged and skipped.

export type MemoryConfig = { url: string; contextId: string; apiKey: string };

// The most a turn waits for memory, a read plus any write of the learner's still on its way. Past it, the
// agent goes without (CONTRACTS.md section 5: median under 4 s per turn, never over 8 s).
const TURN_WAIT_MS = 1_500;
// Each request's own limit. Writes, uploads and the erase are off the learner's wait.
const REQUEST_TIMEOUT_MS = 10_000;
// DELETE /me/data waits this long for the erase, then answers 503 so the learner can try again
const FORGET_WAIT_MS = 15_000;
// What the agents get: the passages that match a fact desk question, and for the hint giver and the coach
// the latest facts per part, out of the newest rows of the concept's history
const NOTES_PER_QUESTION = 3;
const FACTS_PER_PART = 3;
const HISTORY_ROWS = 50;
// A learner's words in a fact: enough to recognise the answer, never a whole essay
const QUOTE_CHARS = 300;
// The concept a learner works on is an entity of this type, one of Agent Memory's fixed types
const ENTITY_TYPE = "concept";

// Null when none of the three are set: the API then runs without Agent Memory and never calls it.
export function memoryConfigFromEnv(env: NodeJS.ProcessEnv = process.env): MemoryConfig | null {
  const url = env.SPECTRON_URL?.trim();
  const contextId = env.SPECTRON_CONTEXT_ID?.trim();
  const apiKey = env.SPECTRON_API_KEY?.trim();
  if (!url && !contextId && !apiKey) return null;
  if (!url || !contextId || !apiKey) {
    throw new Error("Agent Memory needs all three of SPECTRON_URL, SPECTRON_CONTEXT_ID and SPECTRON_API_KEY, or none of them");
  }
  if (!URL.canParse(url)) throw new Error("SPECTRON_URL is not a URL (the context's host, from SurrealDB Studio)");
  return { url, contextId, apiKey };
}

// SurrealDB's own client, with one retry for reads and idempotent writes (its backoff starts at 250 ms)
export const memoryClient = ({ url, contextId, apiKey }: MemoryConfig) =>
  new AgentMemory({ endpoint: url, context: contextId, apiKey, timeoutMs: REQUEST_TIMEOUT_MS, maxRetries: 1 });

// What the API's key needs: read and write a learner's memory, erase it, and register a learner's scope
const NEEDED_GRANTS = ["memory:read", "memory:write", "memory:forget", "scope:create"];

// Once at startup, for the log: whether the key works for this context (GET /me) and has what the API needs
export async function checkMemory(client: AgentMemory): Promise<string> {
  const me = await client.whoami();
  const grants = me.effectiveGrants ?? {};
  const missing = NEEDED_GRANTS.filter((verb) => !grants[verb]?.length);
  return missing.length
    ? `the key works as ${me.displayName}, but its grants don't list ${missing.join(", ")}`
    : `the key works as ${me.displayName}, with ${NEEDED_GRANTS.join(", ")}`;
}

type Learner = { key: string; scope: string };

// The user id never leaves the API: Agent Memory gets the first 24 hex digits of its SHA-256, which is
// also safe in a scope path and in an entity name.
function learner(user: string): Learner {
  const key = createHash("sha256").update(user).digest("hex").slice(0, 24);
  return { key, scope: `learner/${key}` };
}
export const learnerScope = (user: string) => learner(user).scope;

// One entity per learner and concept: Agent Memory's entity history takes no lens (scope filter), so the
// learner is part of the name. A slash would end the URL path segment the history is read from.
const entityName = (key: string, concept: string) => `${concept.replace(/[\\/]+/g, " ").trim()} (learner ${key})`;

type Fact = { agent: AgentName; move: MoveId; value: string; said: string };

const clip = (text: string) => {
  const flat = text.trim().replace(/\s+/g, " ");
  return flat.length > QUOTE_CHARS ? `${flat.slice(0, QUOTE_CHARS)}…` : flat;
};
const itemsText = (items: Item[]) => items.map((i) => (i.note ? `${i.value} (${i.note})` : i.value)).join("; ");
const itemsOn = (map: Mentefacto, move: MoveId): Item[] =>
  move === "supraordinate" ? (map.supraordinate ? [map.supraordinate] : []) : map[move];

// What one answer showed about its part, as a fact that the part's next one replaces. It never holds a
// right answer: a part done right is just "correct", and a wrong one carries the learner's words and the
// evaluator's feedback, which never contains the answer (CONTRACTS.md section 2). An answer without an
// issue (an exclusion still missing its difference) says nothing new.
function answerFact(input: unknown, output: unknown): Fact | null {
  const asked = EvaluatorInput.safeParse(input);
  const judged = EvaluatorOutput.safeParse(output);
  if (!asked.success || !judged.success) return null;
  const { move, answer } = asked.data;
  const { verdict, issue, feedback } = judged.data;
  if (verdict === "correct") return { agent: "evaluator", move, value: "correct", said: answer };
  if (issue === "none") return null;
  return { agent: "evaluator", move, value: `${verdict} (${issue}): said "${clip(answer)}". ${feedback}`, said: answer };
}

// The whole-map evaluator's verdict on each part, the same way: its quality 0, 1 or 2 in words
const WHOLE_MAP_VERDICT = ["incorrect", "partial", "correct"] as const;
function mapFacts(input: unknown, output: unknown): Fact[] {
  const asked = WholeMapEvaluatorInput.safeParse(input);
  const judged = WholeMapEvaluatorOutput.safeParse(output);
  if (!asked.success || !judged.success) return [];
  return MOVE_ORDER.flatMap((move): Fact[] => {
    const row = judged.data.rubric.find((r) => r.move === move);
    if (!row) return [];
    const said = itemsText(itemsOn(asked.data.mentefacto, move));
    if (row.quality === 2) return [{ agent: "evaluator_full", move, value: "correct", said }];
    const put = said ? `put "${clip(said)}"` : "left it empty";
    return [{ agent: "evaluator_full", move, value: `${WHOLE_MAP_VERDICT[row.quality]}: ${put}. ${row.feedback}`, said }];
  });
}

// What the hint giver and the coach get from the concept's history: each part's latest few facts, oldest
// first, the ones a later fact replaced marked. The rows come from outside the API, so a row without a
// text value is dropped rather than sent to an agent, whose input check would fail the turn.
function memoryOf(rows: AttributeDetailJson[]): LearnerMemory {
  const oldestFirst = [...rows].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  return MOVE_ORDER.flatMap((move) =>
    oldestFirst
      .filter((row) => row.key === move && typeof row.value === "string")
      .slice(-FACTS_PER_PART)
      .map((row) => ({ move, fact: row.value, current: !row.supersededBy && !row.validUntil })),
  );
}

// The passages that match a fact desk question, with where each sits in its notes. Checked the same way.
function notesOf({ results }: QueryResponseJson): NoteSource[] {
  return results.slice(0, NOTES_PER_QUESTION).flatMap(({ chunk, document }) => {
    const note = NoteSource.safeParse({ document: document.id, title: document.title, quote: chunk.text, start: chunk.charStart, end: chunk.charEnd });
    return note.success ? [note.data] : [];
  });
}

// Rejects once `ms` have passed. The work itself goes on, until its request's own timeout.
async function within<T>(ms: number, work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`no answer in ${ms} ms`)), ms);
  });
  try {
    return await Promise.race([work, late]);
  } finally {
    clearTimeout(timer);
  }
}

const reason = (error: unknown) => (error instanceof Error ? error.message : String(error));
const statusOf = (error: unknown) => (error instanceof AgentMemoryError ? error.status : null);

export type TurnMemory = {
  callAgent: CallAgent;
  // Before the save: puts the passage the fact desk's fact comes from on that fact's message
  cite(turn: Turn): void;
  // After the save: writes what this Turn's evaluator found, in the background and in order
  remember(): void;
};

export type Memory = {
  // POST /sessions: the session's notes go to the learner's scope, in the background
  startSession(user: string, session: Session): void;
  // POST /sessions/:id/turns: the callAgent to give `advance` for this request, and what to do with its Turn
  forTurn(user: string, session: Session, callAgent: CallAgent): TurnMemory;
  // DELETE /me/data: erases the learner's scope. Rejects when Agent Memory couldn't.
  forget(user: string): Promise<void>;
};

export type MemoryOptions = { turnWaitMs?: number; forgetWaitMs?: number };

export function createMemory(client: AgentMemory, { turnWaitMs = TURN_WAIT_MS, forgetWaitMs = FORGET_WAIT_MS }: MemoryOptions = {}): Memory {
  // Learners whose scope this process has registered
  const registered = new Set<string>();
  // Each learner's memory work, one at a time: a fact before the one that replaces it, every write before
  // an erase. Only the tail is kept, and it never rejects.
  const queues = new Map<string, Promise<void>>();

  function inOrder(who: Learner, work: () => Promise<void>): Promise<void> {
    const run = (queues.get(who.key) ?? Promise.resolve()).then(work);
    const settled = run.then(
      () => {},
      () => {},
    );
    queues.set(who.key, settled);
    void settled.then(() => {
      if (queues.get(who.key) === settled) queues.delete(who.key);
    });
    return run;
  }
  const inBackground = (who: Learner, what: string, work: () => Promise<void>) => {
    inOrder(who, work).catch((error: unknown) => console.warn(`Agent Memory: ${what} failed for learner ${who.key}: ${reason(error)}`));
  };

  // A write to a scope Agent Memory hasn't registered fails (400), so each learner's scope is registered
  // before their first write in this process. If registering fails, the write still runs, and its own
  // answer says whether the scope is there.
  async function registerScope(who: Learner): Promise<void> {
    if (registered.has(who.key)) return;
    try {
      await client.scopes.register({ path: who.scope });
      registered.add(who.key);
    } catch (error) {
      console.warn(`Agent Memory: registering learner ${who.key}'s scope failed: ${reason(error)}`);
    }
  }

  return {
    startSession(user, session) {
      // A test session leaves no trace on the learner, like mastery (CONTRACTS.md section 3)
      if (session.mode === "test" || !session.material) return;
      const who = learner(user);
      const file = new Blob([session.material], { type: "text/plain" });
      inBackground(who, "the notes upload", async () => {
        await registerScope(who);
        await client.documents.upload({
          file,
          filename: "notes.txt",
          title: `Notes on ${session.concept}`,
          scopes: [[who.scope]],
          labels: [`session=${session.id}`],
          timeoutMs: REQUEST_TIMEOUT_MS,
        });
      });
    },

    forTurn(user, session, call) {
      if (session.mode === "test") return { callAgent: call, cite: () => {}, remember: () => {} };
      const who = learner(user);
      const entity = entityName(who.key, session.concept);
      const found: Fact[] = [];
      let cited: NoteSource | null = null;

      // The concept's history, read at most once per turn, after the learner's writes still on their way
      let history: Promise<LearnerMemory> | null = null;
      const readHistory = (): Promise<LearnerMemory> => {
        if (!history) {
          history = (async () => {
            await queues.get(who.key);
            try {
              const { history: rows } = await client.entities.changes(ENTITY_TYPE, entity, { limit: HISTORY_ROWS });
              return memoryOf(rows);
            } catch (error) {
              // no facts on this concept yet
              if (statusOf(error) === 404) return [];
              throw error;
            }
          })();
          // a read started early and never waited for still ends quietly
          history.catch(() => {});
        }
        return history;
      };
      const recall = async (): Promise<LearnerMemory | null> => {
        try {
          return await within(turnWaitMs, readHistory());
        } catch (error) {
          console.warn(`Agent Memory: reading learner ${who.key}'s history failed: ${reason(error)}`);
          return null;
        }
      };
      const lookUp = async (question: string): Promise<NoteSource[] | null> => {
        try {
          return notesOf(await within(turnWaitMs, client.documents.query({ query: question, k: NOTES_PER_QUESTION, lens: [[who.scope]] })));
        } catch (error) {
          console.warn(`Agent Memory: searching learner ${who.key}'s notes failed: ${reason(error)}`);
          return null;
        }
      };

      const callAgent: CallAgent = async (agent, input) => {
        switch (agent) {
          case "hint_giver":
          case "coach": {
            const memory = await recall();
            return call(agent, memory ? { ...(input as object), memory } : input);
          }
          case "fact_desk": {
            const asked = FactDeskInput.safeParse(input);
            const notes = asked.success ? await lookUp(asked.data.question) : null;
            if (!asked.success || !notes?.length) return call(agent, input);
            const output = await call(agent, { ...asked.data, notes });
            // the fact desk names the passage; the quote the learner sees is the stored one
            const answered = FactDeskOutput.safeParse(output);
            if (answered.success && answered.data.kind === "fact" && answered.data.source !== null) {
              cited = notes[answered.data.source - 1] ?? null;
            }
            return output;
          }
          case "evaluator":
          case "evaluator_full": {
            // The coach only comes after the last part's verdict, so its read starts now, alongside the evaluator
            if (agent === "evaluator_full" || (input as { move?: unknown }).move === MOVE_ORDER.at(-1)) void readHistory();
            const output = await call(agent, input);
            if (agent === "evaluator_full") found.push(...mapFacts(input, output));
            else {
              const fact = answerFact(input, output);
              if (fact) found.push(fact);
            }
            return output;
          }
          default:
            return call(agent, input);
        }
      };

      return {
        callAgent,
        cite(turn) {
          if (!cited || turn.error) return;
          const message = turn.messages.find((m) => m.agent === "fact_desk" && m.kind === "fact");
          if (message) message.source = cited;
        },
        remember() {
          const facts = found.splice(0);
          if (!facts.length) return;
          inBackground(who, "the fact write", async () => {
            await registerScope(who);
            for (const agent of new Set(facts.map((f) => f.agent))) {
              await client.remember(undefined, {
                infer: "triples",
                scopes: [[who.scope]],
                memoryCategory: "knowledge",
                labels: [`agent=${agent}`, `session=${session.id}`],
                triples: facts
                  .filter((f) => f.agent === agent)
                  .map(({ move, value, said }) => ({
                    entity: { type: ENTITY_TYPE, name: entity },
                    key: move,
                    value,
                    // the learner's own words: stored beside the fact as its source, not read back by the agents
                    ...(said.trim() ? { source_clause: clip(said) } : {}),
                  })),
              });
            }
          });
        },
      };
    },

    async forget(user) {
      const who = learner(user);
      await within(
        forgetWaitMs,
        inOrder(who, async () => {
          try {
            await client.scopes.forget({ path: who.scope });
          } catch (error) {
            // A scope that was never registered holds nothing: Agent Memory refuses the path (400) or can't
            // find it (404). Anything else (no key, no memory:forget grant, a server error) is a failure.
            const status = statusOf(error);
            if (status !== 400 && status !== 404) throw error;
          }
          registered.delete(who.key);
        }),
      );
    },
  };
}
