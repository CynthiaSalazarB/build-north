---
title: "Hosting setup: Render + SurrealDB Cloud"
type: context
related: ["[[surrealdb-sponsor-prize]]"]
created: 2026-10-19
updated: 2026-10-24
---

Status on Oct 20, 12:35 AM: the API is live and locked until Clerk (#60). The #8 test passed on
Oct 19: Render reached SurrealDB in 8 to 15 ms to write and 4 to 5 ms to read, and the whole request
from Leo's laptop took 0.12 to 0.16 s.

**Since Oct 20** (the sections below are the Oct 20 setup; the current settings are in `api/README.md`, "Deploy
on Render", and the live state in [`status-oct22.md`](status-oct22.md)): the service runs `main`, Starter since
Oct 22, with Auto-Deploy on every merge since Oct 22 (off from the Oct 24 freeze, `docs/deploy.md`). It sets no
`NODE_ENV`, so every caller signs in with Clerk (#22, #23) and a `DEV_KEY` left there does nothing. `CORS_ORIGIN`
lists the `lumente.expo.app` origins (#151). `REQUESTS_PER_MINUTE=240` since Oct 23. Agent Memory is on since
Oct 23, 9:11 PM (`AGENT_MEMORY_*`, `LEARNER_ID_SALT`), and `/health` names the running commit and the memory
state (#143). The API user is a database-level user (`SURREAL_AUTH_LEVEL=database`), and `/health/db` is
read-only.

## SurrealDB Cloud

- Organisation "Build North", instance `build-north`, on Leo's account (Google sign-in). Cynthia is
  invited as an Admin.
- Free plan: 512 MB, 0.25 vCPU, 1 GB storage. AWS US East (N. Virginia). SurrealDB 3.3.2.
- Endpoint: in Render's `SURREAL_URL`, or on the instance's dashboard in Studio. It ends in `/rpc`,
  and the JS SDK keeps it as is. Ask Leo for local dev values; this repo is public.
- Namespace `build_north` with two databases: `dev` for local work, and `prod`, which only Render
  uses, so the testers' sessions never mix with test data. Both were created by a `DEFINE` query
  (SurrealDB 3 doesn't create them on first write). The default `main`/`main` also exists.
- API user: a database user with the EDITOR role on each of `dev` and `prod`, so
  `SURREAL_AUTH_LEVEL=database`. Its name and password live only in Render and with Leo, never in a
  file in this repo.

## Render

- Web service `build-north-api`, live at https://build-north-api.onrender.com. Free plan, Virginia
  region (next to the database).
- The first deploy took 20.5 s. Render picked Node 24.22.0 from `.node-version`.
- Source: Public Git Repository `https://github.com/CynthiaSalazarB/build-north`, branch
  `leo/lock-api` (#60, which includes #54 and #58) until #58 and #60 merge. Then the branch is `main`,
  deployed by hand (Manual Deploy) after each merge, so prod only runs reviewed code. No auto-deploy
  until Cynthia installs Render's GitHub app on the repo.
- Build `npm ci --workspace api`, start `node api/src/server.ts`, health check `/health`.
- Env: `CORS_ORIGIN`, the `SURREAL_*` values with `SURREAL_DATABASE=prod`, `DEV_KEY` (made with
  Render's Generate button; Leo shares it privately), and `NODE_ENV=development` until Clerk lands
  (#23). Render sets `NODE_ENV=production` by default, and production refuses the `x-dev-user`
  header the app uses until then. Delete the variable with #23.
- Every route except `/health` allows 60 requests a minute per IP.
- Starter ($7/month) from Oct 22, per `DECISIONS.md`.
