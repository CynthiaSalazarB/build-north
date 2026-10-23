import { MOVE_ORDER, type Session } from "@build-north/agents";
import { createLearnerMemory, createMemoryApi, entityOf, factsOf, memoryConfigFromEnv, scopeOf, MEMORY_READ_MS } from "./memory.ts";
import { pseudonymOf } from "./export-testers.ts";
import { initialSession } from "./store.ts";

// The Agent Memory smoke test (#112): against the live context, what the API relies on, with a throwaway learner
// that is erased at the end. npm run memory:smoke -w api. Exit 0 and a note when the memory variables aren't set,
// so it can run anywhere the API's smoke test runs; exit 1 on any failure. Prints no secret and no real learner.

const config = memoryConfigFromEnv({ ...process.env, AGENT_MEMORY_ENABLED: "true" });
if (!config) throw new Error("unreachable: the flag is forced on");
if (!process.env.AGENT_MEMORY_ENDPOINT || !process.env.AGENT_MEMORY_CONTEXT || !process.env.AGENT_MEMORY_API_KEY) {
  console.log("memory:smoke skipped: AGENT_MEMORY_ENDPOINT, AGENT_MEMORY_CONTEXT and AGENT_MEMORY_API_KEY are not all set");
  process.exit(0);
}

type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];
const ms = () => performance.now();
async function check(name: string, run: () => Promise<{ ok: boolean; detail: string }>): Promise<void> {
  const started = ms();
  try {
    const { ok, detail } = await run();
    checks.push({ name, ok, detail: `${detail} (${Math.round(ms() - started)} ms)` });
  } catch (error) {
    checks.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error) });
  }
}

const api = createMemoryApi(config);
const memory = createLearnerMemory(api, config);
// a learner nobody is: a fresh id each run, so a run that stops halfway leaves nothing a later run reads
const user = `smoke-${Date.now().toString(36)}`;
const pseudonym = pseudonymOf(user, config.salt);
const concept = "API";

/** A finished session on API, the shape the API hands `remember`. */
function finished(id: string, turn: number, predicted: number, score: number, changes: Session["result"] extends infer R ? (R extends { masteryChanges: infer C } ? C : never) : never, helps: number[]): Session {
  return {
    ...initialSession(user, { concept, material: null, mode: "learn" }),
    id,
    createdAt: new Date().toISOString(),
    turn,
    phase: "result",
    hintsPerMove: Object.fromEntries(MOVE_ORDER.map((move, i) => [move, helps[i] ?? 0])) as Session["hintsPerMove"],
    result: {
      predictedScore: predicted,
      score,
      maxScore: 8,
      calibrationGap: predicted - score,
      hintsUsed: helps.reduce((a, b) => a + b, 0),
      rubric: MOVE_ORDER.map((move) => ({ move, points: 1 })),
      masteryChanges: changes,
      questions: { asked: 0, testing: 0 },
      coach: null,
    },
  };
}

await check("session 1 writes its facts (scope registered, one triple each)", async () => {
  await memory.remember(user, finished("smoke1", 14, 7, 3, [{ move: "supraordinate", from: 2, to: 3 }, { move: "exclusion", from: 2, to: 2 }], [0, 2, 1, 0]));
  return { ok: true, detail: `scope ${scopeOf(pseudonym)}, entity ${entityOf(pseudonym, concept).name}` };
});

await check("the coach of session 1 reads nothing from its own session", async () => {
  const own = await memory.recall(user, concept, "smoke1");
  return { ok: own === undefined, detail: own ? `${own.facts.length} facts came back` : "no memory, as the contract says" };
});

await check(`session 2 reads session 1's facts within ${MEMORY_READ_MS} ms`, async () => {
  const started = ms();
  const read = await memory.recall(user, concept, "smoke2");
  const took = Math.round(ms() - started);
  const keys = read?.facts.map((f) => `${f.writtenBy}:${f.move ?? "gap"}`) ?? [];
  const ok = !!read && read.facts.length === 7 && took < MEMORY_READ_MS;
  return { ok, detail: `${read?.facts.length ?? 0} facts in ${took} ms: ${keys.join(", ")}${read ? `; first: "${read.facts[0]?.text}"` : ""}` };
});

await check("session 2's write supersedes session 1's level, and memory keeps the chain", async () => {
  await memory.remember(user, finished("smoke2", 15, 6, 5, [{ move: "supraordinate", from: 3, to: 4 }], [0, 1, 0, 0]));
  const rows = await api.history(entityOf(pseudonym, concept), AbortSignal.timeout(5_000));
  const chain = rows.filter((row) => row.key === "level_supraordinate");
  const closed = chain.find((row) => row.validUntil);
  const open = chain.find((row) => !row.validUntil);
  const linked = open?.supersedes === closed?.id;
  return { ok: chain.length === 2 && !!closed && !!open && linked, detail: `${rows.length} rows, level_supraordinate: ${chain.length} in the chain, closed ${closed ? "yes" : "no"}, supersedes ${linked ? "links" : "missing"}` };
});

await check("a third session reads the current facts, with what they superseded", async () => {
  const read = await memory.recall(user, concept, "smoke3");
  const level = read?.facts.find((f) => f.move === "supraordinate" && f.writtenBy === "evaluator");
  const gap = read?.facts.find((f) => f.writtenBy === "coach");
  const ok = level?.level === 4 && !!level.supersedes && gap?.text === "Last time on API you guessed 6 and proved 5.";
  return { ok, detail: `level ${level?.level ?? "?"} supersedes ${level?.supersedes ? "set" : "unset"}; gap "${gap?.text ?? "?"}"` };
});

await check("the Memory sheet shows the level change and the gap beside the one before", async () => {
  const view = await memory.view(user, [concept], [["x"]]);
  const sup = view.concepts[0]?.moves.find((m) => m.move === "supraordinate");
  const gap = view.concepts[0]?.gap;
  const ok = sup?.level === 4 && sup.history.length === 2 && sup.history[1]?.until !== null && gap?.latest?.score === 5 && gap?.previous?.score === 3;
  return { ok, detail: `supraordinate ${sup?.level ?? "?"} with ${sup?.history.length ?? 0} rows (${sup?.history.map((h) => `${h.level}${h.until ? " closed" : ""}`).join(", ")}); gap ${gap?.latest?.predictedScore}/${gap?.latest?.score} before ${gap?.previous?.predictedScore}/${gap?.previous?.score}` };
});

await check("facts come back as the rows memory stores (no learner text, the sentence as the value)", async () => {
  const rows = await api.history(entityOf(pseudonym, concept), AbortSignal.timeout(5_000));
  const facts = factsOf(rows, concept, "smoke9");
  const sentences = facts.every((f) => /^(You moved|Last time|').*\.$/.test(f.text));
  return { ok: sentences && rows.every((row) => row.source?.kind === "upsert"), detail: `${rows.length} rows, source ${[...new Set(rows.map((r) => r.source?.kind))].join("/")}` };
});

await check("Delete my data purges the scope, and nothing is left to read", async () => {
  await memory.purge(user);
  const rows = await api.history(entityOf(pseudonym, concept), AbortSignal.timeout(5_000));
  const read = await memory.recall(user, concept, "smoke9");
  return { ok: rows.length === 0 && read === undefined, detail: `${rows.length} rows after the purge` };
});

const width = Math.max(...checks.map((c) => c.name.length));
for (const c of checks) console.log(`${c.ok ? "ok  " : "FAIL"} ${c.name.padEnd(width)}  ${c.detail}`);
const failed = checks.filter((c) => !c.ok).length;
console.log(failed === 0 ? `\nAll ${checks.length} checks pass against ${new URL(config.endpoint).host}` : `\n${failed} of ${checks.length} checks failed`);
process.exitCode = failed === 0 ? 0 : 1;
