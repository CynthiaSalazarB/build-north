# Reality Check (working name)

**Build with AI. Understand the concepts yourself.**

For programming students who build with AI agents but can't explain what they built, Reality Check is
where they figure out the concepts their projects use. First they answer questions, then they ask their
own, while the help fades level by level. Unlike AI study modes, it isn't a mode they can switch off
halfway: they build the concept map themselves, and at the end they see their real score next to the
one they predicted.

**How it works:** the learner names a concept, pastes their notes about it if they have any, and
builds a map of it: the bigger group it belongs to, what it isn't, what it needs, and its types. This
map comes from Conceptual Pedagogy, where it is called a conceptual mentefact. Claude agents ask the
questions and judge the answers, but never write the map. The help fades over five levels, and at the
top one the roles flip: the learner asks, and a fact desk answers with facts only. Scores and levels
are computed by code, never by the model.

**To understand the method, why it should work, what is still unproven and where it goes,** read the
[product thesis](wiki/synthesis/product-thesis.md). The evidence behind it is in
[`wiki/context/evidence.md`](wiki/context/evidence.md).

Built for **Build North** (Georgian AI Lab + TapNet), October 2026.

## Structure

| Folder | What lives there | Owner |
|---|---|---|
| [`app/`](app/) | Expo + React Native app (iOS, Android, web) | Cynthia and Leo (Jonathan helped) |
| [`api/`](api/) | Node + Express API: auth, storage, calls the agents | Leo |
| [`agents/`](agents/) | Prompts, JSON contracts, orchestrator and ladder rules. Pure TypeScript, no server code | Cynthia |
| [`wiki/`](wiki/index.md) | Project notes: context, research, analysis. Start at `wiki/index.md` | Cynthia and Leo |
| Slides (outside the repo) | The pitch presentation | Kyle |

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
