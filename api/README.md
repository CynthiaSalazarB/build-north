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
| `GET /health/db` | Asks SurrealDB for its clock and returns it with how many milliseconds that took. Read-only. `503` when the database is not configured, refuses the login or takes over 5 s; the cause goes to the server log, not the response |
| `POST /sessions` | `{ concept, material?, mode? }`: saves a new session and returns its first `Turn`, the prediction question. `400` for a bad body, `413` for notes over 8,000 characters |
| `GET /sessions/:id` | The session's latest `Turn`. `404` if it doesn't exist or belongs to someone else |
| `POST /sessions/:id/turns` | One of the bodies in CONTRACTS.md section 1, plus `turn`, the number of the `Turn` it answers. Returns the next `Turn`. An answer to an older `Turn` gets the latest one back and runs nothing, even when two copies arrive at once. `400` for a bad body, `404` if the session doesn't exist or belongs to someone else, `409` for a `turn` from the future or a body the latest `Turn` doesn't ask for |
| `GET /me/mastery` | The caller's `Mastery`: the four moves in session order, at level 1 until the orchestrator raises them |
| `DELETE /me/data` | `204`. Deletes the caller's sessions, their agent logs and mastery (the delete button) |

Until Clerk lands (#23), the session and `/me` routes take the caller's name from an `x-dev-user`
header, and only together with an `x-dev-key` header equal to the server's `DEV_KEY` (CONTRACTS.md
section 1). Without a `DEV_KEY`, or with `NODE_ENV=production`, they all answer `401`. Leo shares the
key; it never goes in the repo or in the deployed web build.

Every route except `/health` allows 60 requests a minute from one IP, then answers `429`.

The API's types and request schemas come from `@build-north/agents` (`agents/src/contracts.ts`), so
a change to the contract shows up here as a type error. Until the orchestrator lands, the `Turn`s
come from a stand-in for `advance` ([`src/advance-stub.ts`](src/advance-stub.ts)) with the same
`Advance` type. It replays Cynthia's democracy walk-through,
[`agents/fixtures/session-1.json`](../agents/fixtures/session-1.json): one `Turn` per answer, the
same 9 whatever the concept or the answers (a Help gets the next one too), and mastery stays at
level 1. #28 replaces it with the orchestrator from `agents/`.

## Claude calls

[`src/call-agent.ts`](src/call-agent.ts) is the only code that talks to Claude (#10). Each agent is
one structured-output call with its Zod schema from `@build-north/agents`: the agent's prompt is the
system prompt, its input goes in the user message as JSON, and the reply is checked against the
schema. Every call writes an `agent_log` row with its milliseconds and its cost in dollars.

| Variable | What it does |
|---|---|
| `ANTHROPIC_API_KEY` | Turns Claude calls on. Render and your local `.env` only, never the app |
| `AGENT_MODEL` | `claude-opus-5-5` (default) or `claude-sonnet-5-5`, the two models with a price in the code |
| `AGENT_BUDGET_USD` | Required with the key: the Claude budget in dollars |

Following DECISIONS.md (Oct 20), calls stop at 95% of the budget, and while any of Anthropic's
rate-limit windows is 95% used, until it refills. Both come back as a `rate_limited` error in the
`Turn`: retryable for a rate limit, not for the budget. The spend is counted in memory, so it starts
again at $0 after a restart; the account's own balance, with auto-reload off (#20), is the hard stop.
Until Cynthia's prompts land (#2), every agent fails with a clear error.

## SurrealDB

- SurrealDB 3 does not create a namespace or database on first use. `SURREAL_NAMESPACE` and
  `SURREAL_DATABASE` must already exist on the instance (create them in Surrealist); otherwise
  `/health/db` answers `503` and the log says `The namespace '…' does not exist`.
- `SURREAL_AUTH_LEVEL` is the level the user was created at: `root` (default), `namespace` or `database`.
- Two databases on the instance: `dev` for local work, and `prod`, which only Render uses, so the
  testers' sessions never mix with test data.
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
| Environment | `CORS_ORIGIN`, the `SURREAL_*` values with `SURREAL_DATABASE=prod`, `DEV_KEY` (Render's Generate button), `NODE_ENV=development` until Clerk lands (#23), and `ANTHROPIC_API_KEY` with `AGENT_BUDGET_USD` for Claude calls (#10) |

The Node version comes from [`../.node-version`](../.node-version). Render sets `PORT` itself, and
also sets `NODE_ENV=production` unless the service sets its own. That would refuse `x-dev-user` on the
public URL before Clerk exists, so the service sets `NODE_ENV=development` for now. Delete that
variable when Clerk lands (#23).
