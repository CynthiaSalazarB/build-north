# api

Node 24 + Express 5 in TypeScript. Checks the Clerk token, reads and writes SurrealDB, runs the
orchestrator from `agents`, and is the only place the Claude key exists.

Endpoints and the `Turn` shape are in [`../agents/CONTRACTS.md`](../agents/CONTRACTS.md).

Host: Render, decided in [`../DECISIONS.md`](../DECISIONS.md) (2026-10-19). Live at
https://build-north-api.onrender.com, in Render's Virginia region next to the SurrealDB Cloud
instance (AWS US East, N. Virginia).

## Run it

From the repo root, with `.env` filled in (see [`../.env.example`](../.env.example)):

```bash
npm run dev -w api
```

That serves on `http://localhost:3000` and restarts on save. `npm test -w api` runs the tests and
`npm run typecheck -w api` type checks. The store's tests need a real SurrealDB and are skipped
without one; the top of [`src/store.test.ts`](src/store.test.ts) shows how to run them against a
local container.

There is no build step: Node runs the `.ts` files as they are, by stripping the types. So only write
TypeScript that can be erased (no `enum`, `namespace` or constructor parameter properties), import
local files with their `.ts` extension, and use `import type` for types. The type check catches the rest.

## Routes so far

| Route | What it does |
|---|---|
| `GET /health` | `{ ok: true }`. Render's health check; never touches the database |
| `GET /health/db` | Writes the record `ping:api` to SurrealDB, reads it back and returns it with the milliseconds each step took. `503` when the database is not configured, refuses the login or takes over 5 s; the cause goes to the server log, not the response |
| `POST /sessions` | `{ concept, material?, mode? }`: saves a new session and returns its first `Turn`, the prediction question. `400` for a bad body, `413` for notes over 8,000 characters |
| `GET /sessions/:id` | The session's latest `Turn`. `404` if it doesn't exist or belongs to someone else |

Until Clerk lands (#23), the session routes take the caller's name from an `x-dev-user` header.
With `NODE_ENV=production` the API refuses that header (CONTRACTS.md section 1), and every
session route answers `401`.

The API's types and request schemas come from `@build-north/agents` (`agents/src/contracts.ts`), so
a change to the contract shows up here as a type error. The first `Turn` comes from a stand-in for
`advance` ([`src/advance-stub.ts`](src/advance-stub.ts)) with the same `Advance` type, which only
knows `{ action: "start" }`. #28 replaces it with the orchestrator from `agents/`.

## SurrealDB

- SurrealDB 3 does not create a namespace or database on first use. `SURREAL_NAMESPACE` and
  `SURREAL_DATABASE` must already exist on the instance (create them in Surrealist); otherwise
  `/health/db` answers `503` and the log says `The namespace '…' does not exist`.
- `SURREAL_AUTH_LEVEL` is the level the user was created at: `root` (default), `namespace` or `database`.
- One connection per process, opened at startup. After a drop it reconnects on its own; requests in
  the meantime fail after 5 s instead of hanging.
- All the database code is in [`src/store.ts`](src/store.ts), and the orchestrator never touches the
  database. At startup the store defines the `session`, `mastery` and `agent_log` tables from
  CONTRACTS.md section 4. They stay schemaless so the orchestrator's state can grow, but the fields
  the API relies on are typed, so a bad level or mode is refused instead of saved.

## Deploy on Render

Render dashboard → **New → Web Service**:

| Field | Value |
|---|---|
| Source | **Git Provider** once the Render GitHub app has access to this repo (auto-deploys on merge). Until then, **Public Git Repository** with `https://github.com/CynthiaSalazarB/build-north` (manual deploys only) |
| Branch | `main` |
| Region | Closest to the SurrealDB instance, whose AWS region code is in `SURREAL_URL` (`aws-euw1` would be eu-west-1). It can't be changed later |
| Root directory | Empty (the repo root): the API needs the workspace lockfile, and soon `agents/` |
| Build command | `npm ci --workspace api` |
| Start command | `node api/src/server.ts` |
| Health check path | `/health` (under Advanced) |
| Instance type | Free while building (it sleeps after 15 min idle and takes about a minute to wake). Starter from Oct 22, per `DECISIONS.md` |
| Environment | `CORS_ORIGIN`, the `SURREAL_*` values from `.env`, and `NODE_ENV=development` until Clerk lands (#23) |

The Node version comes from [`../.node-version`](../.node-version). Render sets `PORT` itself, and
also sets `NODE_ENV=production` unless the service sets its own. That would refuse `x-dev-user` on the
public URL before Clerk exists, so the service sets `NODE_ENV=development` for now. Delete that
variable when Clerk lands (#23).
