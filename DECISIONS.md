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

---

## Open

- **Render or Expo API routes on EAS Hosting for the API.** Leaning Render. Decided after the
  Oct 19 Render + SurrealDB test, before the API skeleton starts on Oct 20.
