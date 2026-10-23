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
| `POST /sessions` | `{ concept, material?, mode? }`: saves a new session and returns its first `Turn`, the prediction question. `mode: "test"` (the testers' pre-test and post-test) puts every move at level 5: after the prediction the learner asks the fact desk with `{ question }` and builds the whole map, and the session never writes mastery. `400` for a bad body, `413` for notes over 8,000 characters |
| `GET /sessions/:id` | The session's latest `Turn`. `404` if it doesn't exist or belongs to someone else |
| `POST /sessions/:id/turns` | One of the bodies in CONTRACTS.md section 1, plus `turn`, the number of the `Turn` it answers. Returns the next `Turn`. An answer to an older `Turn` gets the latest one back and runs nothing; two copies of the same answer arriving at once both run, and the one that saves first is the one that counts. A `Turn` with `error` saves nothing. Mastery is written only for the moves the `Turn` changed, never for a test session. `400` for a bad body, `404` if the session doesn't exist or belongs to someone else (both with `{ error }`). `409` with the latest `Turn` for a `turn` from the future or a body the latest `Turn` doesn't ask for; the reason goes to the server log |
| `GET /me/mastery` | The caller's `Mastery`: the four moves in session order, at level 1 until the orchestrator raises them |
| `DELETE /me/data` | `204`. Deletes the caller's sessions, their agent logs and mastery (the delete button) |

The session and `/me` routes need the Clerk session token as `Authorization: Bearer <token>` (#23).
The API checks it without a network call, using the instance's PEM public key in `CLERK_JWT_KEY` (in
the Clerk dashboard: API keys, Show JWT public key), and keys sessions and mastery by the Clerk user
id. A web build's token names the origin it came from, which must be one of the `CORS_ORIGIN`
origins; the native app's token names none. A token that doesn't hold up gets `401`, even with the dev
headers below.

Outside production, `x-dev-user` also works, but only together with an `x-dev-key` header equal to
the server's `DEV_KEY` (CONTRACTS.md section 1). Without a `DEV_KEY`, or with `NODE_ENV=production`,
the dev headers get `401`. Leo shares the key; it never goes in the repo or in the deployed web build.

Every route except `/health` allows 60 requests a minute from one IP (`REQUESTS_PER_MINUTE` changes it), then answers `429`.

The API's types and request schemas come from `@build-north/agents` (`agents/src/contracts.ts`), so
a change to the contract shows up here as a type error. With Claude on (below), `/turns` runs
Cynthia's orchestrator, `advance` from `@build-north/agents` (#28). With Claude off, the `Turn`s come
from [`src/advance-stub.ts`](src/advance-stub.ts) instead, with the same `Advance` type. It replays
Cynthia's democracy walk-through, [`agents/fixtures/session-1.json`](../agents/fixtures/session-1.json):
one `Turn` per answer, the same 9 whatever the concept, the mode or the answers (a Help gets the next
one too), and mastery stays at level 1. That way the app runs against an API with no key.

## Claude calls

[`src/call-agent.ts`](src/call-agent.ts) is the only code that talks to Claude (#10). Each agent is
one structured-output call, set up from Cynthia's registry in `@build-north/agents` (`AGENTS`, #2):
the agent's system prompt, the user message its `render` writes from the input, its effort, and its
Zod schemas. The reply is checked against the output schema. Every call writes an `agent_log` row
with its milliseconds and its cost in dollars. An agent that isn't in the registry fails before any
call. When the coach's call fails (#44), the session still ends: `advance` writes fixed text from the
result's numbers instead.

| Variable | What it does |
|---|---|
| `ANTHROPIC_API_KEY` | Turns Claude calls on. Render and your local `.env` only, never the app |
| `AGENT_MODEL` | `claude-opus-5-5` (default) or `claude-sonnet-5-5`, the two models with a price in the code |
| `AGENT_BUDGET_USD` | Required with the key: the Claude budget in dollars |
| `REQUESTS_PER_MINUTE` | Per IP, every route except `/health`; 60 when unset. Raise it for a room of testers on one Wi-Fi, who share an IP |

Following DECISIONS.md (Oct 20), calls stop at 95% of the budget, and while any of Anthropic's
rate-limit windows is 95% used, until it refills. Both come back as a `rate_limited` error in the
`Turn`: retryable for a rate limit, not for the budget. The spend is counted in memory, so it starts
again at $0 after a restart; the account's own balance, with auto-reload off (#20), is the hard stop.

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

## The demo profile

```bash
npm run seed:demo -w api -- <user id>
```

Loads Cynthia's demo profile ([`agents/fixtures/demo-seed.json`](../agents/fixtures/demo-seed.json),
#32) for one user, through the same store the API reads: level 5 on all four moves, and the CORS
session waiting at the whole map, with the prediction (7) already made. It prints the session's id.
Running it again resets the mastery to the seed and adds a fresh waiting session; earlier sessions
stay.

- **The user id** is what the API keys rows by: the demo account's Clerk user id (its `sub`, now that
  Clerk is in, #23), or an `x-dev-user` name for local work.
- **The database** is the one the `SURREAL_*` variables name. With the root `.env` that's `dev`. For
  demo day, set `SURREAL_DATABASE=prod` in the shell for that one run (a variable set in the shell wins
  over `.env`), with a user that can write to `prod`.

## The testers' numbers (#50)

```bash
npm run export:testers -w api -- testers.csv
```

Reads every finished test session (the pre-test and the post-test of each tester,
[`docs/tester-protocol.md`](../docs/tester-protocol.md)) from the database the `SURREAL_*` variables
name, and writes two files: `testers.csv`, the rows of [`docs/grading-sheet.csv`](../docs/grading-sheet.csv)
with the evaluator's four scores, the prediction, the questions and the hints filled in (the human
columns stay empty for #49), and `testers.maps.json`, each map to grade by hand. Testers appear as
`L1`, `L2`... in the order their first test session started, plus a pseudonym in the notes (8 hex
characters of a salted hash of their user id; set `LEARNER_ID_SALT` to salt it). No name or Clerk id
is written. The first finished test session of a tester is the pre-test, the last the post-test.

## The smoke test (#45, #37)

```bash
npm run smoke -w api                                          # the live API and web build
npm run smoke -w api -- http://localhost:3000 http://localhost:8081   # or any pair
```

Seven checks with no credentials, exit code 1 on any failure: `/health`, `/health/db` (writes to the
database), a call with no token and one with the dev headers both answer 401, the web build's origin
passes the CORS preflight, the web build answers with Lumente's title, and its bundle names this API's
host (a demo-mode export would not). A full session on the public URL is still a person's walk through
the web build; this is the part before and after it, and the warm-up before the testers.

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
| Environment | `CORS_ORIGIN` (comma-separated: the Expo dev server and every web build's address, since a web build's Clerk token must come from one of them), the `SURREAL_*` values with `SURREAL_DATABASE=prod`, `CLERK_JWT_KEY` (#23), and `ANTHROPIC_API_KEY` with `AGENT_BUDGET_USD` for Claude calls (#10) |

The Node version comes from [`../.node-version`](../.node-version). Render sets `PORT` itself, and
also sets `NODE_ENV=production` unless the service sets its own, which turns `x-dev-user` off on the
public URL. Since Oct 22 the service sets no `NODE_ENV`, so every caller signs in with Clerk (#22, #23);
a `DEV_KEY` left on Render does nothing there.
