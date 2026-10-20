import { RecordId, Surreal } from "surrealdb";

type AuthLevel = "root" | "namespace" | "database";

export type SurrealConfig = {
  url: string;
  namespace: string;
  database: string;
  username: string;
  password: string;
  authLevel: AuthLevel;
};

export type DbCheck = {
  record: unknown;
  ms: { write: number; read: number };
};

const AUTH_LEVELS: readonly AuthLevel[] = ["root", "namespace", "database"];
const PING = new RecordId("ping", "api");
// A turn's budget is 8 s (CONTRACTS.md §5): a database that can't answer in 5 s fails the request instead.
const QUERY_TIMEOUT_MS = 5_000;

// Bounds one request's database work, including any wait for the connection.
export function queryTimeout(): AbortSignal {
  return AbortSignal.timeout(QUERY_TIMEOUT_MS);
}

function isAuthLevel(level: string): level is AuthLevel {
  return (AUTH_LEVELS as readonly string[]).includes(level);
}

// Null when SURREAL_URL is unset, so the API still starts (and /health still passes) without a database.
export function surrealConfigFromEnv(env: NodeJS.ProcessEnv = process.env): SurrealConfig | null {
  const url = env.SURREAL_URL;
  if (!url) return null;
  if (!URL.canParse(url)) throw new Error("SURREAL_URL is not a URL (expected wss://<instance>.surreal.cloud)");
  const { SURREAL_NAMESPACE: namespace, SURREAL_DATABASE: database, SURREAL_USER: username, SURREAL_PASS: password } = env;
  if (!namespace || !database || !username || !password) {
    throw new Error("SURREAL_URL is set, so SURREAL_NAMESPACE, SURREAL_DATABASE, SURREAL_USER and SURREAL_PASS are required");
  }
  const authLevel = env.SURREAL_AUTH_LEVEL || "root";
  if (!isAuthLevel(authLevel)) throw new Error(`SURREAL_AUTH_LEVEL must be one of: ${AUTH_LEVELS.join(", ")}`);
  return { url, namespace, database, username, password, authLevel };
}

// Connects now and never gives up: after a drop the SDK reconnects forever (at most 5 s apart), so a
// database blip can't leave the API without a connection until the next deploy. Queries wait for the
// connection, bounded by their own timeout.
export function connectSurreal({ url, namespace, database, username, password, authLevel }: SurrealConfig): Surreal {
  // The level the user was created at: the signin has to name the same namespace and database.
  const authentication =
    authLevel === "root" ? { username, password }
    : authLevel === "namespace" ? { namespace, username, password }
    : { namespace, database, username, password };
  const db = new Surreal();
  db.subscribe("connected", (version) => console.log(`SurrealDB connected (${version})`));
  db.subscribe("disconnected", () => console.warn("SurrealDB disconnected"));
  db.subscribe("error", (error) => console.error("SurrealDB connection error:", error));
  db.connect(url, { namespace, database, authentication, reconnect: { attempts: -1, retryDelayMax: 5_000 } }).catch(
    (error: unknown) => console.error("SurrealDB connect failed:", error),
  );
  return db;
}

// Writes and reads one fixed record, so calling it over and over never grows the database.
export function surrealCheck(db: Surreal): () => Promise<DbCheck> {
  return async () => {
    const signal = queryTimeout();
    const started = performance.now();
    await db.upsert(PING).content({ at: new Date() }).signal(signal);
    const written = performance.now();
    const record = await db.select(PING).json().signal(signal);
    const read = performance.now();
    return { record, ms: { write: Math.round(written - started), read: Math.round(read - written) } };
  };
}
