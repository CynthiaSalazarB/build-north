# Reality Check (working name)

A mobile app that teaches people to question, anchored in concepts. The learner builds a concept's
map (a *mentefacto conceptual*) without AI while a set of Claude agents asks questions, gives hints
that fade over time, and shows the **calibration gap**: how sure the learner felt vs. how well they
actually did. At the top level the roles flip: the learner asks, and a fact desk agent answers with
facts only, never the structure.

Built for **Build North** (Georgian AI Lab + TapNet), October 2026.

## Structure

| Folder | What lives there | Owner |
|---|---|---|
| [`app/`](app/) | Expo + React Native app (iOS, Android, web) | Jonathan |
| [`api/`](api/) | Node + Express API: auth, storage, calls the agents | Leo |
| [`agents/`](agents/) | Prompts, JSON contracts, orchestrator and ladder rules. Pure TypeScript, no server code | Cynthia |

`app`, `api` and `agents` are npm workspaces. The API imports `agents/` as the package `@build-north/agents`; the app imports
**types only** from it (`import type`), so no server code ends up in the bundle.

The contracts between the three are in [`agents/CONTRACTS.md`](agents/CONTRACTS.md).

## Setup

```bash
cp .env.example .env    # fill in the values (ask in Discord)
npm install             # installs all three workspaces
```

Per-folder run instructions live in each folder's README.

## How we work

- Tasks live in GitHub Issues + the project board (Todo, In Progress, Done). One owner per issue, 1 to
  3 hours, a "done when" line and a "depends on" line. Each issue sits in the milestone of its day.
- Short branches (`jonathan/session-screen`), a pull request, one teammate reviews, merge the same day.
- Secrets never go in git. `.env.example` lists every variable; the Claude key exists only on the API.
- Decisions with a real trade-off go in [`DECISIONS.md`](DECISIONS.md).
