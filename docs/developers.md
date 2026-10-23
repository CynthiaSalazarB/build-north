# For developers

How to run Lumente from a clean clone, test it, and find your way around the repository. The
[README](../README.md) is for judges and visitors. The stack and the architecture diagram are there,
under "How it's built" in [For the judges](../README.md#for-the-judges).

## Run it from a clean clone

Node 24 (see [`.node-version`](../.node-version)). `app`, `api` and `agents` are npm workspaces, so one
install at the root covers all three:

```bash
npm install
npm run start -w app     # the Expo dev server: press w for the browser
npm run dev -w api       # the API on http://localhost:3000, restarts on save
npm test                 # every workspace's tests, no Claude call
```

Phones need the Android development build, since Expo Go does not run SDK 58 yet. The rest is in each
package's README: [`app/README.md`](../app/README.md), [`api/README.md`](../api/README.md),
[`agents/README.md`](../agents/README.md).

- With no `app/.env`, the app runs in demo mode: it replays
  [`agents/fixtures/session-api.json`](../agents/fixtures/session-api.json), the API session recorded
  live with Claude, one Turn per action, and needs no API. `EXPO_PUBLIC_API_URL` in `app/.env` points it
  at an API, and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` turns sign-in on.
- The API reads the repo root's `.env` (copy `.env.example`). Its variables, names only: `SURREAL_URL`,
  `SURREAL_NAMESPACE`, `SURREAL_DATABASE`, `SURREAL_USER`, `SURREAL_PASS` and `SURREAL_AUTH_LEVEL` for
  the database; `CLERK_JWT_KEY` to check sign-in tokens; `CORS_ORIGIN` for the web builds' origins;
  `ANTHROPIC_API_KEY` with `AGENT_BUDGET_USD` to turn Claude on, and `AGENT_MODEL` to pick the model;
  `DEV_KEY` for the local dev headers. Without the Claude key, the API replays
  `agents/fixtures/session-1.json` instead of calling Claude.
- `api/` and `agents/` have no build step: Node 24 runs the TypeScript directly.

## Tests

`node --test` in `app` and `api`, Vitest in `agents`; `npm test` at the root runs all three.
`npm run eval:*` in `agents` runs the prompt evals against Claude and prints the cost.

## Repository

| Folder | What lives there | Owner |
|---|---|---|
| [`app/`](../app/) | Expo + React Native app: Android and web | Cynthia and Leo (Jonathan helped) |
| [`api/`](../api/) | Express API: the sign-in check, storage, the Claude calls | Leo |
| [`agents/`](../agents/) | Prompts, Zod contracts, fixtures, the orchestrator. Plain TypeScript, no server code | Cynthia |
| [`wiki/`](../wiki/index.md) | Project notes: context, research, analysis | Cynthia and Leo |
| Slides (outside the repo) | The pitch presentation | Kyle |

- [`agents/CONTRACTS.md`](../agents/CONTRACTS.md): the contracts between the app, the API and the agents.
- [`DECISIONS.md`](../DECISIONS.md): every decision with a real trade-off, and why it was taken.
- [`wiki/index.md`](../wiki/index.md): the project wiki, starting with the product thesis and the plan.
- [`docs/expo-log.md`](expo-log.md): every EAS build, update and deploy.
- [`docs/tester-protocol.md`](tester-protocol.md): the Oct 23 pilot, five testers (T1 to T5), a pre-test
  and a post-test on concepts they never trained on. Results: TODO after the pilot.

## How the team works

- `main` is protected. Every change goes through a short branch and a pull request, docs included, and
  one teammate reviews. Changes to `agents/CONTRACTS.md` and new `DECISIONS.md` entries arrive the same
  way; the merge is the acceptance.
- The repo is public: no secrets, connection details, keys or tester names in any file. The Claude key
  exists only on the API.
- Stand-in code says `Temporary:` in its comment.
