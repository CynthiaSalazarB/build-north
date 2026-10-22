// The Agent Memory spike (docs/agent-memory-log.md): proves against a live context the eight things the
// memory design relies on, then erases everything it wrote. Run: `npm run memory:smoke -w api`. Skipped
// with exit 0 when AGENT_MEMORY_ENDPOINT, AGENT_MEMORY_CONTEXT and AGENT_MEMORY_API_KEY are unset.
// Prints no secret and no learner data: the scope is a throwaway `spike` learner.
import { AgentMemory, AgentMemoryError } from "@surrealdb/memory";

const endpoint = process.env.AGENT_MEMORY_ENDPOINT?.trim();
const context = process.env.AGENT_MEMORY_CONTEXT?.trim();
const apiKey = process.env.AGENT_MEMORY_API_KEY?.trim();
if (!endpoint || !context || !apiKey) {
  console.log("memory:smoke skipped: AGENT_MEMORY_ENDPOINT, AGENT_MEMORY_CONTEXT and AGENT_MEMORY_API_KEY are not all set");
  process.exit(0);
}

const ORG = process.env.AGENT_MEMORY_ORG?.trim() || "org/lumente-dev";
const LEARNER = `spike-${Date.now().toString(36)}`;
const SCOPE = `${ORG}/learner/${LEARNER}`;
const OTHER_SCOPE = `${ORG}/learner/${LEARNER}-other`;
const ENTITY = { type: "learner", name: LEARNER };
const KEY = "level.cors.infraordinate";
const TIMINGS = 20;

const client = new AgentMemory({ endpoint, context, apiKey, timeoutMs: 10_000, maxRetries: 0 });

type Row = { check: string; result: "pass" | "fail" | "workaround"; evidence: string };
const rows: Row[] = [];
const record = (check: string, ok: boolean, evidence: string, workaround = false) => {
  rows.push({ check, result: ok ? "pass" : workaround ? "workaround" : "fail", evidence });
  console.log(`${ok ? "ok  " : workaround ? "wa  " : "FAIL"} ${check}: ${evidence}`);
};
const status = (e: unknown) => (e instanceof AgentMemoryError ? `${e.status} ${e.title}` : e instanceof Error ? e.message : String(e));
const ms = async <T>(work: () => Promise<T>): Promise<[T, number]> => {
  const t = performance.now();
  const out = await work();
  return [out, Math.round(performance.now() - t)];
};
const quantile = (xs: number[], q: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))] ?? 0;
};

async function writeLevel(level: number, at: string, scope = SCOPE) {
  return client.remember(undefined, {
    infer: "triples",
    scopes: [[scope]],
    memoryCategory: "knowledge",
    labels: ["agent=evaluator", "lumente_session=spike"],
    triples: [{ entity: ENTITY, key: KEY, value: String(level), occurred_at: at }],
  });
}

const t1 = new Date(Date.now() - 60_000).toISOString();
const between = new Date(Date.now() - 30_000).toISOString();
const t2 = new Date().toISOString();

try {
  // (i) register the scope
  try {
    const node = await client.scopes.register({ path: SCOPE, displayName: "spike learner" });
    await client.scopes.register({ path: OTHER_SCOPE });
    record("i register scope", true, `registered ${JSON.stringify(node).length} bytes of scope node`);
  } catch (e) {
    record("i register scope", false, status(e));
    throw e;
  }

  // (ii) write level 2 as a triple
  const [w2, w2ms] = await ms(() => writeLevel(2, t1));
  record("ii write level 2 (triples)", w2.mode === "triples", `mode=${w2.mode} turn=${Boolean(w2.turnId)} ${w2ms} ms`);

  // (iii) write level 3: history shows two rows, the first closed in time
  const [w3] = await ms(() => writeLevel(3, t2));
  const history = await client.entities.history(ENTITY.type, ENTITY.name, KEY);
  const values = history.map((h) => `${h.value}[${h.validFrom?.slice(11, 19) ?? "?"}→${h.validUntil?.slice(11, 19) ?? "open"}${h.supersedes ? " supersedes" : ""}]`);
  const old = history.find((h) => h.value === "2");
  const current = history.find((h) => h.value === "3");
  record(
    "iii history after write 3",
    history.length === 2 && Boolean(old?.validUntil) && !current?.validUntil && w3.mode === "triples",
    `${history.length} rows: ${values.join(", ")}`,
  );

  // (iv) recall with a lens returns 3 with its source; as_of between the writes returns 2
  const [now, recallMs] = await ms(() => client.recall(`${KEY} of ${LEARNER}`, { lens: [[SCOPE]], k: 5 }));
  const nowHit = now.hits.find((h) => h.text.includes("3"));
  record("iv recall now = 3 with source", Boolean(nowHit), `${now.hits.length} hits, top: ${now.hits[0] ? `"${now.hits[0].text.slice(0, 60)}" source=${now.hits[0].source}` : "none"}, ${recallMs} ms`);
  const before = await client.recall(`${KEY} of ${LEARNER}`, { lens: [[SCOPE]], k: 5, asOf: between });
  const beforeHit = before.hits.find((h) => h.text.includes("2") && !h.text.includes("3"));
  record("iv recall as_of between = 2", Boolean(beforeHit), `${before.hits.length} hits: ${before.hits.map((h) => `"${h.text.slice(0, 40)}"`).join(" | ") || "none"}`);

  // (v) a read with a different lens cannot see it
  const other = await client.recall(`${KEY} of ${LEARNER}`, { lens: [[OTHER_SCOPE]], k: 5 });
  record("v other lens sees nothing", other.hits.length === 0, `${other.hits.length} hits`);

  // (vi) a read-only key cannot write
  try {
    const minted = await client.keys.create({ name: `spike-read-${LEARNER}`, grants: { "memory:read": [SCOPE] }, ttlSeconds: 600 });
    const reader = new AgentMemory({ endpoint, context, apiKey: minted.key, timeoutMs: 10_000, maxRetries: 0 });
    let refused = "";
    try {
      await reader.remember(undefined, { infer: "triples", scopes: [[SCOPE]], triples: [{ entity: ENTITY, key: KEY, value: "9" }] });
    } catch (e) {
      refused = status(e);
    }
    const canRead = (await reader.recall(`${KEY} of ${LEARNER}`, { lens: [[SCOPE]], k: 5 })).hits.length > 0;
    record("vi read-only key cannot write", Boolean(refused) && canRead, `write: ${refused || "ACCEPTED"}; read: ${canRead ? "sees the fact" : "sees nothing"}`);
    await client.keys.delete(`spike-read-${LEARNER}`).catch(() => undefined);
  } catch (e) {
    record("vi read-only key cannot write", false, `minting a key failed: ${status(e)} (keys may need allow_self_service_keys on the context)`, true);
  }

  // (viii) timings: 20 writes and 20 recalls (before the erase, so recalls find rows)
  const writes: number[] = [];
  const recalls: number[] = [];
  for (let i = 0; i < TIMINGS; i++) {
    const [, w] = await ms(() => writeLevel(2 + (i % 2), new Date(Date.now() + i).toISOString()));
    writes.push(w);
    const [, r] = await ms(() => client.recall(`${KEY} of ${LEARNER}`, { lens: [[SCOPE]], k: 3 }));
    recalls.push(r);
  }
  record("viii timings", true, `writes median ${quantile(writes, 0.5)} ms, p95 ${quantile(writes, 0.95)} ms; recalls median ${quantile(recalls, 0.5)} ms, p95 ${quantile(recalls, 0.95)} ms (n=${TIMINGS} each)`);
} catch (e) {
  console.error("spike stopped:", status(e));
} finally {
  // (vii) forget with purge, then recall is empty
  try {
    const gone = await client.scopes.forget({ path: SCOPE });
    await client.scopes.forget({ path: OTHER_SCOPE }).catch(() => undefined);
    const after = await client.recall(`${KEY} of ${LEARNER}`, { lens: [[SCOPE]], k: 5 }).catch((e: unknown) => ({ hits: [], error: status(e) }));
    const hist = await client.entities.history(ENTITY.type, ENTITY.name, KEY).catch((e: unknown) => ({ error: status(e) }));
    const histNote = Array.isArray(hist) ? `${hist.length} history rows` : `history: ${hist.error}`;
    record("vii forget (purge) then empty", after.hits.length === 0 && (!Array.isArray(hist) || hist.length === 0), `forgot ${JSON.stringify(gone)}; recall ${after.hits.length} hits${"error" in after ? ` (${after.error})` : ""}; ${histNote}`);
  } catch (e) {
    record("vii forget (purge) then empty", false, status(e));
  }
  console.log("\n| Check | Result | Evidence |\n|---|---|---|");
  for (const r of rows) console.log(`| ${r.check} | ${r.result} | ${r.evidence.replace(/\|/g, "/")} |`);
  process.exitCode = rows.some((r) => r.result === "fail") ? 1 : 0;
}
