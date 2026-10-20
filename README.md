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

`app`, `api` and `agents` are npm workspaces. The API and the app both import `agents/` as the package
`@build-north/agents`, values included (`MOVE_LABEL`, the fixtures), because it holds no server code: only
Zod and plain TypeScript. The Claude calls and the keys live in `api/`.

The contracts between the three are in [`agents/CONTRACTS.md`](agents/CONTRACTS.md).

## Setup

```bash
cp .env.example .env    # fill in the values (ask in Discord)
npm install             # installs all three workspaces; needs Node 24 (.node-version)
```

Per-folder run instructions live in each folder's README.

## How we work

- Tasks live in GitHub Issues + the project board (Todo, In Progress, Done). One owner per issue, 1 to
  3 hours, a "done when" line and a "depends on" line. Each issue sits in the milestone of its day.
- Every change goes through a short branch (`jonathan/6-session-screen`) and a pull request, docs
  included: one teammate reviews, merge the same day. `main` is protected, so nothing is pushed to it
  directly; even a typo is a quick pull request.
- Secrets never go in git. `.env.example` lists every variable; the Claude key exists only on the API.
- Decisions with a real trade-off go in [`DECISIONS.md`](DECISIONS.md), and changes to
  [`agents/CONTRACTS.md`](agents/CONTRACTS.md) change what everyone builds: both arrive through a pull
  request, and the merge is the acceptance.
- Claude Code picks up the skills in [`.claude/skills/`](.claude/skills/) when you open the repo:
  Expo and React Native (UI, data fetching, performance, EAS deploys and CI), mobile design, motion,
  and web interface guidelines for the web build. Each keeps its own license.
