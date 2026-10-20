# Decisions

Decisions that would be expensive or confusing to reverse without knowing why. Implementation
details don't go here. Newest at the bottom.

Format: **Decision** · **Instead of** · **Why** · **Pattern / trade-off**

---

### 2026-10-18 · Education first, but a thinking tool
- **Decision:** start in education as the beachhead, and build a thinking tool, not a study tool.
  The subject is the gym equipment; thinking is the muscle.
- **Instead of:** a general tool for every area of life from day one.
- **Why:** one clear user, a buyer (schools), and something we can measure in seven days.
- **Pattern / trade-off:** beachhead market. A smaller story now; life decisions move to the vision slide.

### 2026-10-18 · Check yourself ships first, complete
- **Decision:** build the "Check yourself" mode end to end before starting "Check the AI".
- **Instead of:** both modes in parallel.
- **Why:** a complete small thing beats two half-built ones. If time runs out, Check the AI becomes
  the scalability slide and the demo is never half-built.
- **Pattern / trade-off:** walking skeleton, then vertical slices. Less breadth in the demo.

### 2026-10-18 · Scaffolding that fades, with mastery tracked per move
- **Decision:** teach each thinking move with a five-level ladder (watch, guided, complete, named
  only, alone) and a hint ladder (nudge, hint, partial, reveal). Plain question first, the move's
  name after.
- **Instead of:** the same Socratic questions for everyone, from the start.
- **Why:** beginners don't have the moves yet; questions alone leave them stuck.
- **Pattern / trade-off:** cognitive apprenticeship and fading (Wood, Bruner and Ross; Collins,
  Brown and Newman). Costs per-user, per-move state, which makes the database core instead of decoration.

### 2026-10-18 · Orchestrator in code, single-job agents
- **Decision:** code decides who speaks next (reading the learner's level per move); each agent is
  one Claude call with one job and a JSON output.
- **Instead of:** one autonomous agent that decides its own next step.
- **Why:** a demo that wanders loses. Each agent can be tested and debugged on its own.
- **Pattern / trade-off:** orchestrator-workers (Anthropic, "Building effective agents"). More code
  paths to write; in exchange the flow is predictable.

### 2026-10-18 · Small modules inside one app
- **Decision:** each thinking move is its own module with its own ladder. Check yourself and Check
  the AI are two combinations of the same modules.
- **Instead of:** separate apps per problem.
- **Why:** one codebase, one pitch, seven days.
- **Pattern / trade-off:** modular monolith. Module boundaries have to be kept by discipline, not by deploys.

### 2026-10-18 · Progression-only gamification
- **Decision:** levels per move, a mastery map, and "you did this alone" moments.
- **Instead of:** XP, streaks and leaderboards.
- **Why:** extrinsic rewards make people chase points instead of skill.
- **Pattern / trade-off:** self-determination theory (competence over rewards). Less of the
  habit-forming pull that streaks give.

### 2026-10-18 · The Claude key lives only on the server
- **Decision:** the app talks to our own API; the API holds the Claude key, checks the Clerk token
  and calls the agents.
- **Instead of:** calling Claude from the app.
- **Why:** anything in the app bundle is public. It also ties every learner's progress to their account.
- **Pattern / trade-off:** backend for frontend. Two things to deploy instead of one.

### 2026-10-19 · Concepts are the anchor for teaching questioning
- **Decision:** a concepts tool (mentefactos) that teaches questioning through them.
- **Instead of:** a general "learn to ask questions" tool.
- **Why:** questioning needs ground to stand on. A person can't be curious about something they
  can't even frame, and concepts give the frame.
- **Pattern / trade-off:** a narrower product, so the broader philosophy lives on the vision slide.
  Adds a metric: self-generated questions at level 5.

### 2026-10-19 · At level 5 the learner asks, and the AI only gives facts
- **Decision:** the top level hands the questioning over to the learner. They ask a fact desk agent
  anything while building the map; it answers facts and never the structure. The testers' pre-test and
  post-test run in this mode, and the metric is the questions asked, how many test the concept
  (compare, contrast, a breaking case, what it needs), and the score.
- **Instead of:** level 5 as "build the map alone", with the metric "says the four questions unprompted".
- **Why:** the point is for people to start asking questions to work something out, here to get a
  concept clear. If the app does all the asking, they only practice answering, and the four questions
  just get memorized.
- **Pattern / trade-off:** gradual release of responsibility ("I do, we do, you do"; Pearson and
  Gallagher). One more agent and about a day of work, and the fact desk must never leak the structure.

### 2026-10-19 · Test sessions are a flag, not a separate flow
- **Decision:** `POST /sessions` takes `mode: "test"`. A test session runs every move at level 5 and
  never updates mastery. The testers' pre-test and post-test use it.
- **Instead of:** a separate test endpoint, or measuring testers through normal sessions.
- **Why:** a new learner starts at level 1, and the pre-test has to measure them alone, before the
  ladder. Without it the numbers slide has no pre-test. The demo doesn't need it: the demo profile is
  pre-seeded at level 4 to 5, so the orchestrator reaches level 5 on its own.
- **Pattern / trade-off:** one code path with a flag (feature flag on the request). Less to build and
  one result shape; in exchange the orchestrator has to check the flag everywhere mastery is read or
  written, and a forgotten check leaks test runs into the ladder.

### 2026-10-19 · One endpoint moves a session forward
- **Decision:** `POST /sessions/:id/turns` takes every learner action (confidence, answer, question,
  map, help, continue). The last `Turn`'s `expects` tells the app which body to send.
- **Instead of:** one endpoint per action (`/answer`, `/hint`, `/question`, `/submit`).
- **Why:** the orchestrator decides the next step anyway, so the state advances in one place. One
  handler in the API, one call in the app.
- **Pattern / trade-off:** a single command endpoint over a state machine. The request body is a union
  (a Zod discriminated union validates it), and the API logs are less readable by URL alone.

### 2026-10-19 · A counterexample is a hint, not a Challenger agent
- **Decision:** in Check yourself, the hint giver can push back with a counterexample ("North Korea
  holds elections. Is it a democracy?"). The Challenger agent stays in Check the AI.
- **Instead of:** a sixth agent for Check yourself.
- **Why:** pushing back on an incomplete answer is the same job as a hint. One less prompt to write
  and test in a week.
- **Pattern / trade-off:** fewer, broader workers in orchestrator-workers. The hint giver's prompt
  carries more cases, and its test script has to cover counterexamples too.

### 2026-10-19 · The learner predicts points, not a percentage
- **Decision:** before building, the learner predicts how many of the 8 points they will get, after
  one line explaining the task. `calibrationGap = predictedScore − score`.
- **Instead of:** "How well do you understand democracy?" as a percentage.
- **Why:** a percentage of "understanding" and a score on a map are different things, so the gap
  would partly measure not knowing the format. Same scale, same task, a fair comparison.
- **Pattern / trade-off:** calibration measured as predicted vs. actual score on the same test (the
  usual design in confidence research). The question is less natural than "how well do you know it?",
  so it needs the one-line explanation first.

### 2026-10-19 · The orchestrator gets Claude passed in
- **Decision:** the orchestrator is one function, `advance(state, input, callAgent)`, in `agents/`.
  The API owns storage and the Claude calls and passes `callAgent` in.
- **Instead of:** agent calls and database writes inside the orchestrator, or flow logic in the API.
- **Why:** the rules can be tested with a fake `callAgent` and no server, and the hosting choice never
  touches them. Each side of the seam has one owner.
- **Pattern / trade-off:** functional core, imperative shell, with dependency injection. One more
  interface to agree on, and the API has to save exactly what `advance` returns.

---

### 2026-10-19 · The API runs on Render
- **Decision:** the Express API runs on Render: the Free instance while building, Starter ($7/month,
  paid from the $50 credit) from Oct 22 so it never sleeps during the testers, judging and demo day.
  The Render + SurrealDB test (#8) confirms it; if SurrealDB fails there, mastery goes to local
  storage for the demo.
- **Instead of:** Expo API routes on EAS Hosting.
- **Why:** Render is full Node, so everything we use (SurrealDB, Clerk, Claude) is supported without
  surprises, and that makes it the more reliable choice for a six-day build. EAS Hosting runs on
  Cloudflare Workers with partial Node support, and SurrealDB has no guide for it.
- **Pattern / trade-off:** a managed full runtime over an edge runtime. Two deploys instead of one,
  and $7/month once the credit runs out (or the Free instance, which takes about a minute to wake).
  It stays reversible because of ports and adapters: moving later means rewriting only the routes,
  the token check and the database module, about a day of work.

---

## Open

- **Where the web build is hosted** (the judges' URL): Render static site or EAS Hosting.
