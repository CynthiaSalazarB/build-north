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
- **Web build (the judges' URL):** a Render Static Site in the same workspace, so one dashboard and
  one owner for deploys. Plan B is EAS Hosting, only if Render charges for it or causes trouble: the
  files are the same, so moving takes about 30 minutes plus a `CORS_ORIGIN` update.
- **Superseded** for the web build on 2026-10-22 by "The web build is on EAS Hosting".

### 2026-10-19 · Any defensible answer passes
- **Decision:** the evaluators accept any defensible answer, not one right answer. 2 = defensible and
  the closest class; 1 = defensible but too broad or incomplete; 0 = not defensible.
- **Instead of:** matching the learner's answer against a single expected answer.
- **Why:** real concepts have fuzzy edges ("form of government" and "political system" both work for
  democracy). One right answer would mark good thinking wrong and make the scores unfair.
- **Pattern / trade-off:** rubric grading over answer matching (prototype theory: concepts have
  graded membership). More judgment in the model, so the human double-check (#33, #49) matters more.
  Asking the learner to justify the choice ("why that group?") is left for later.

### 2026-10-19 · Tester concepts and order
- **Decision:** the pre-test and post-test use "ecosystem" (biology) and "contract" (law); training
  uses "metaphor" (language) and "habit" (psychology). Half the testers take ecosystem first and
  contract last, the other half the reverse.
- **Instead of:** the same pre-test concept for everyone, or reusing democracy and inflation.
- **Why:** a concept that happens to be harder could fake progress or hide it; swapping the order
  cancels that out. None of the four appears in the prompts' test cases, so tuning can't inflate them.
- **Pattern / trade-off:** counterbalancing. With 5 testers the halves are 3 and 2, so it reduces the
  bias, it doesn't remove it; the slide still calls this a pilot.
- **Superseded** on 2026-10-21 by "Tester concepts are programming concepts".

### 2026-10-19 · Build-week scope cuts
- **Decision:** sign-in by Clerk email code only; learner material is pasted text only (up to 8,000
  characters); English only; phone-first layout, with the web build showing the same layout centered.
- **Instead of:** Google or Apple sign-in, file and photo uploads, Spanish, a separate desktop layout.
- **Why:** each of these is work that doesn't change the demo. Cutting them keeps the six days on the
  Check yourself loop.
- **Pattern / trade-off:** scope cut to a walking skeleton plus one complete loop. Each cut is a later
  roadmap item, and none needs a rewrite to add back.

### 2026-10-19 · The fact desk's redirect gives nothing away
- **Decision:** when a learner asks the fact desk for the structure, it answers "That part is yours to
  decide. If you're stuck, tap Help (it costs a point)." It never points at a part of the map.
- **Instead of:** a redirect that hands the decision back with a guiding question ("What other things
  happen to money in an economy?").
- **Why:** a guiding question was a free hint, while Help costs a point. A learner could ask for the
  structure on purpose and get help without paying for it. Raised by Leo on #1.
- **Pattern / trade-off:** one price for help, so the level-5 score stays honest. The redirect teaches
  less in the moment; the help is still there, behind the Help button.

### 2026-10-19 · A resent answer is judged once
- **Decision:** every `Turn` carries a `turn` number and the app sends it back with its next action.
  When the number repeats, the API returns the stored `Turn` without calling the orchestrator again.
- **Instead of:** trusting that each request arrives once.
- **Why:** one answer costs two Claude calls, so a slow phone can time out and resend; without this the
  hint step would move twice and the learner would be charged a hint they never saw. Raised by Leo on #1.
- **Pattern / trade-off:** idempotency with a sequence number. The session stores its last `Turn`, and
  the check lives in the API, so the orchestrator stays unaware of it.

### 2026-10-20 · No build step anywhere
- **Decision:** `api/` and `agents/` run their TypeScript directly on Node 24 (type stripping). Nothing
  is compiled; `tsc` only type checks. Render installs and runs, with no build command for our code.
- **Instead of:** compiling `agents/` to `dist/` and having the API import the compiled copy.
- **Why:** a build is one more step that can break, and its typical bug is running a stale `dist/`
  after someone forgets to rebuild. Node 24 already runs TypeScript, so the build would add risk and
  no benefit. One convention for the whole repo.
- **Pattern / trade-off:** type stripping (no transpile step). Only erasable TypeScript is allowed (no
  `enum` or `namespace`), local imports carry the `.ts` extension, and it depends on Node 24 or newer.
  A build would only come back if the package were published to npm.

### 2026-10-20 · The public API stays locked until Clerk
- **Decision:** until Clerk lands (#23), `x-dev-user` only counts together with an `x-dev-key` equal to
  the server's `DEV_KEY`, which Leo shares privately. Every route except `/health` allows 60 requests a
  minute per IP. Render uses its own `prod` database and `dev` is for local work. When the Claude
  calls land (#10), the API stops calling Claude at 95% of Anthropic's rate limits and of the budget.
- **Instead of:** an open `x-dev-user` header on a public URL whose address is in a public repo.
- **Why:** anyone can read the repo, so anyone can find the URL and the header name. Once `/turns`
  calls Claude (#10, #28), a stranger could spend the budget before Clerk exists. A separate database
  keeps the testers' sessions clean for the numbers export (#50).
- **Pattern / trade-off:** a shared secret as a stopgap before real auth, plus rate limits with
  headroom. One more value to pass around privately, and the app's local `.env` needs it too.

### 2026-10-20 · The bigger group is tested with "is a kind of"
- **Decision:** the evaluator checks a bigger group with the sentence "<concept> is a kind of <answer>".
  True with nothing closer in between: 2 points. True but far ("an economic change" for inflation): 1
  point, too broad. False because the answer is only related ("money" for inflation): 0 points, and the
  feedback says so ("inflation is related to money, but it isn't a kind of money"). True only because it
  fits everything ("a thing"): 0.
- **Instead of:** counting how many levels up the answer is (for example, "too broad" up to three levels).
- **Why:** money is related to inflation, but it isn't a direct group: currencies, recessions and personal
  finances are all related to money too, and none of them belong together. Levels can't be counted the
  same way by everyone; the sentence test can.
- **Pattern / trade-off:** the closest genus (genus proximum) and the "is a kind of" relation. A sharper
  rule for the evaluator and a clearer lesson for the learner (related vs. belonging). The demo now shows
  6/8 with "money", the real score.

### 2026-10-20 · A wrong answer gets a free nudge that fades; hints only come from Help
- **Decision:** after a wrong or incomplete answer, the Evaluator's feedback says what is off. At levels
  2 and 3 it ends with a nudge: a question that sends the learner back to their own answer, with no new
  information. At levels 4 and 5 there is no nudge. Hints (where to look, part of the answer, the
  answer) only come when the learner taps Help, and every Help counts. Points depend on attempts: right
  on the first try keeps the Evaluator's quality (up to 2), after a retry or a Help the move is capped
  at 1, and a revealed move scores 0. A level goes up when the move took at most one retry or Help.
- **Instead of:** (A) every wrong answer triggering a hint on its own, counted as help used; or (B) a
  free nudge at every level, with points that ignore retries.
- **Why:** it matches the questions fading (the help the app gives), learners think more by
  themselves, and the scores stay consistent. And because the nudge already helps a little, a wrong
  answer no longer needs the Evaluator and the Hint giver one after the other, which cuts the latency.
- **Pattern / trade-off:** the assistance dilemma (Koedinger & Aleven, 2007): too little help
  frustrates, too much makes learning shallow. Explanatory feedback with help that fades sits in
  between. "Hints used" now means how many times the learner asked; retries are counted on their own,
  so getting it after a nudge still scores 1, not 2, and session 1 still scores 5/8.

### 2026-10-20 · The next question is prepared while the answer is judged
- **Decision:** at the learner's first answer (or first Help) of each part, the Questioner writes the
  next part's question at the same time as the Evaluator judges the answer. It's saved in the session
  and shown as soon as the part ends.
- **Instead of:** waiting for the part to end and then calling the Questioner (two calls in a row,
  ~4.5 s), or preparing the questions while the learner reads the planet example (only the first
  session has it).
- **Why:** to reduce latency. The turn that ends a part waits for one call instead of two, in every
  session.
- **Pattern / trade-off:** prefetching (two independent calls in parallel). The next question is
  written from the map as it was before the answer being judged, so it can't build on what the
  learner just found. If the early call fails, the part asks normally when it starts.

### 2026-10-21 · The first group is programming students who build with AI agents
- **Decision:** the first users, testers and pitch are programming students who build with AI coding
  agents and can't explain the concepts behind what they built. The app stays open to any concept and
  any learner: the focus is who we build the demo for, test with, sell to and talk about first.
  Refines "Education first, but a thinking tool" (2026-10-18).
- **Instead of:** education for any learner, high school students first, or critical thinking for
  everyone.
- **Why:** I have this problem myself, people in this group already describe it (a reel about it drew
  about 200 comments, many with workarounds of their own), and I can reach testers in it this week.
- **Pattern / trade-off:** a beachhead market: win one small group first, then reach the next groups
  with the same product, one at a time (Moore, *Crossing the Chasm*). The persona is still defined by
  how the learner thinks, not by age. The demo and tester
  concepts change to programming ones, and high school becomes the next group, backed by research
  (Bastani et al., 2025) instead of our own testers. Evidence in
  [`wiki/context/evidence.md`](wiki/context/evidence.md).

### 2026-10-21 · The pitch opens with the pain, not the method
- **Decision:** the pitch, the README and Devpost open with the moment the learner feels (the agent's
  code works, and someone asks them to explain it), then the method, then the vision last. Tagline:
  "Build with AI. Understand the concepts yourself." It says "the concepts" because the app teaches
  the concepts a project uses, not the project itself, which is a later layer. Closing line: "The help
  fades. The understanding stays."
- **Instead of:** opening with "We teach questioning, and concepts are the anchor", or with critical
  thinking for every area of life; and closing with "Good technology should make you need it less",
  which read as if losing users were the goal.
- **Why:** office-hours feedback (Expo, Oct 20): getting people to be more curious is too broad, and
  nobody wakes up wanting it. People act on a pain they feel; the method explains why the fix works.
- **Pattern / trade-off:** positioning on the pain: say who it's for, the pain they feel, what the
  product is, and what it does that the alternatives don't (Moore's positioning template). The philosophy moves to the end of the pitch and to the
  [product thesis](wiki/synthesis/product-thesis.md), so anyone who only hears the opening hears a
  narrower product.

### 2026-10-21 · The demo runs on API, then CORS
- **Decision:** session 1 of the demo, the live learning session with a hint and the prediction gap,
  maps "API". The level-5 part runs on the CORS profile (#78). JWT stays in the list of tech concepts
  next to API, for the evals and for learners to try. Replaces inflation.
- **Instead of:** inflation, which doesn't match the first group; JWT for session 1, as the plan to win
  (#76) proposed; or dependency injection, too hard to follow in a four-minute demo.
- **Why:** almost every programmer, and every judge, has heard of an API, so the audience can follow
  the map as it's built: a kind of software interface; it isn't a library, a server or a database; it
  needs defined requests and responses and hides how the other side works; its types include web,
  library and operating system APIs. It keeps the moment where a related answer fails the "is a kind
  of" test ("a server": an API runs on one, but it isn't a kind of server). CORS is a concept coding
  agents add to student projects and few students can explain, which suits level 5.
- **Pattern / trade-off:** the demo matches the first group and starts from its most familiar concept.
  Session 1 has to be written on API and rehearsed live with Claude (it was planned on JWT, so no
  extra work), and "api" joins the measured concepts in `agents/test/prompts.test.ts`, next to the
  list in #83.

### 2026-10-21 · Tester concepts are programming concepts
- **Decision:** the pre-test and post-test use "database index" and "rate limiting"; training uses
  "hashing" and "environment variable". Half the testers take database index first and rate limiting
  last, the other half the reverse. The testers come from the first group: classmates who code with
  AI. From the plan to win (#76). Supersedes "Tester concepts and order" (2026-10-19).
- **Instead of:** ecosystem, contract, metaphor and habit, from outside the first group; or general
  programming concepts such as cache, compiler, loop and array, which coding agents don't add to a
  project (loop and array are too basic to show a gap).
- **Why:** testers should be measured on concepts coding agents put in their projects and they often
  can't explain. The earlier rules stay: none of the four appears in the prompts (the `MEASURED` check
  in `agents/test/prompts.test.ts`), none is a demo concept, and swapping the order cancels out a
  concept that happens to be harder.
- **Pattern / trade-off:** counterbalancing, as before. Hashing and database index are related (a hash
  index is one type of database index), so training on hashing could help whoever takes database index
  last; worth checking when reading the results. With 5 testers it is still a pilot.

### 2026-10-21 · The app's design is round 8, Open Box
- **Decision:** the app uses round 8, Open Box (`docs/design/08-open-box/`), picked by Leo on Oct 21. It
  replaces round 6, Out of the Cave, which #81 first put in the app, and round 7's recommendation, 7F. The
  app opens in the Obsidian theme (black and white), and its day and night modes follow the phone's
  setting. Cobalt (blue and white) stays in the tokens as the second theme. Per #14, Cynthia approves the
  direction on #72.
- **Instead of:** keeping round 6's cave and bronze, or moving to 7F (round 6's colors on a test run).
- **Why:** the user is now CS students who build with coding agents. Round 8 is drawn from what they
  already read every day: a spec file, a list of checks, `Expected` and `Received`. The gap gets a picture
  they get at a glance, a black box whose corners open as they prove points, and the pair keeps the tutor
  friendly without ever reacting to the score.
- **Pattern / trade-off:** colors by role. Screens read colors by name from one tokens file, so the second
  theme is one constant, not a second set of screens. Round 6's dawn and bronze cast go; the box opening
  on the result is now the session's one big moment.
- **Superseded** on 2026-10-22 by "The app's design is Lumente (round 9)".

### 2026-10-22 · The app's design is Lumente (round 9)
- **Decision:** one idea for the whole app: questions are the light. The map is four questions in the dark around
  the concept; a firefly tutor asks them, a dashed amber line runs from it to the part being asked, and it is Help;
  an answer in the learner's words lights that part. Near-black, amber and warm light, with coral only for the gap;
  Newsreader, Atkinson Hyperlegible Next and Atkinson Hyperlegible Mono. Working name Lumente (*lumen* plus *mente*,
  light and mind). Board, tokens and contrast in `docs/design/09-lumente/`. Supersedes round 8, Open Box (#72, used
  on #81).
- **Instead of:** round 8, which mixed four round 7 directions (a terminal, a test file, a cube, a mascot) into a
  look with no single idea; or the cave (round 6, and a version where shadows become real), which needs Plato's
  allegory to be read and whose blurred shadow cards read as loading placeholders.
- **Why:** it needs an identity and a differentiator.
- **Pattern / trade-off:** one central metaphor (a conceptual model: people work out how an app behaves from one
  image) instead of borrowed conventions (spec files, CI checks). The metaphor costs a rebuild of the screens and a
  sentence in the pitch; borrowed conventions cost nothing but look like every dev tool. Understanding as light is
  already in everyday language ("it dawned on me"), so it needs no explanation (conceptual metaphor, Lakoff and
  Johnson). The tech-student signal lives in the content: the learner's code on Start, code in the questions,
  `Expected / Received` on the result.

### 2026-10-22 · Progress is the light: dark to light, one stage per point
- **Decision:** a warm light grows from the top-right corner of a near-black screen, one stage per point proved; at
  5 points it fills the screen and the text turns dark. The exact score stays in the map's points. The guess screen
  previews the light of the guess; locking it in returns to the dark. Nothing blinks or pulses.
- **Instead of:** a progress bar or "3 of 4"; or a night-blue sky going from night to morning (the first version),
  which still looked like a sleep app.
- **Why:** it gives the app more feeling and a better user experience.
- **Pattern / trade-off:** ambient feedback (the environment is the progress bar). Less exact than a bar, so the
  points carry the score, and the text has to switch from light to dark at the right stage to stay readable: every
  pair is checked against the real gradient in `docs/design/09-lumente/README.md`. Cues for ideas, not sleep: a
  graph-paper grid, crisp corners, upright questions and a spark when a part lights. The phone's light or dark
  setting no longer drives session screens.

### 2026-10-22 · Each Turn carries the points of the moves done so far
- **Decision:** `Turn.progress.points` lists each finished move's points (0 to 2), in the order the moves
  finished, taken from the orchestrator's `moveLog`. The app lights a part's points as soon as its move ends,
  instead of waiting for the result's rubric. The field is optional, so Turns saved before it still parse.
- **Instead of:** the app guessing the points from the transcript (first try 2, a retry or Help 1, revealed
  0), which is wrong whenever the evaluator scores a first-try answer 1; or showing points only on the result.
- **Why:** the app's design (Lumente, round 9) makes progress a light that grows one stage per point
  proved, with two point squares on each part. Both have to be exact while the session runs, and the
  numbers already exist in the session.
- **Pattern / trade-off:** the server owns the score and the app only draws it (one source of truth). One
  more field in every Turn; the session-1 and demo-seed fixtures carry it too.

### 2026-10-22 · The web build is on EAS Hosting
- **Decision:** the web build, the judges' URL, is hosted on EAS Hosting, deployed by the EAS workflow from
  `main`. The API stays on Render. Supersedes the web-build part of "The API runs on Render" (2026-10-19).
- **Instead of:** a Render Static Site next to the API, the Oct 19 plan.
- **Why:** it already runs there, it ships with the same EAS setup as the Android app, and it counts
  toward Best Use of Expo.
- **Pattern / trade-off:** the app's web and native builds on one platform (EAS), and the API on another.
  Two dashboards instead of one, and the web build depends on the EAS project on Leo's account.

### 2026-10-22 · Sign-in by email code and Google
- **Decision:** Clerk offers both email code and Google. Google came back on Oct 22 and works on the web
  build; on phones it needs Clerk's Native API setting. Supersedes the sign-in part of "Build-week scope
  cuts" (2026-10-19).
- **Instead of:** email code only, the Oct 19 cut.
- **Why:** testers and judges sign in with one tap, and Google sign-ins don't count against the Clerk
  development instance's 100 emails a month. It was already built, so keeping it costs no build time.
- **Pattern / trade-off:** a federated sign-in next to a passwordless one. One more flow to test on
  phones before the freeze.

### 2026-10-22 · We don't enter the SurrealDB Agent Memory prize
- **Decision:** we skip the SurrealDB Agent Memory prize. SurrealDB stays our database, with plain tables
  for sessions and mastery.
- **Instead of:** building on Agent Memory in the last two days before the freeze.
- **Why:** the core loop doesn't need it: the levels come from code, by the rule "numbers in code, words
  in the model". The prize asks for facts that replace older ones, answers traced to a source and
  memory shared across agents, and the sponsor said plain tables are unlikely to compete. By default
  Agent Memory sends what it stores to another model to extract facts, a privacy question about
  learners' text that we haven't settled.
- **Pattern / trade-off:** a scope cut to protect the core. One prize fewer; a memory of each learner's
  habits, for the coach and the hint giver, is parked in the Vision and Scope doc.
- **Superseded the same day** by "Agent Memory contract: facts the agents read, ids they may cite, a view
  the app shows" (below): we enter the prize, with no learner text in memory.

### 2026-10-22 · The light grows over all 8 points
- **Decision:** the light grows over all 8 points in smaller steps: the dark stages spread over 0 to 6
  points, the screen turns light at 7, and 8 is full light. Supersedes the "at 5 points it fills the
  screen" part of "Progress is the light" (2026-10-22). The 9 contrast-checked stages stay as designed;
  a step between two of them blends them, so every background sits between two that already pass.
- **Instead of:** the light filling the screen at 5 points.
- **Why:** testing the app, the jump between 4 and 5 felt too big. Smaller steps read as steady progress.
  The turn from light ink to dark has no readable in-between (light ink needs the background behind the
  words dark; the darkest text on the light needs it about half as bright as white), so it moves to the
  last step before full light instead of disappearing.
- **Pattern / trade-off:** a continuous progress cue. The screen turns light only for 7 or 8 points, so
  most sessions stay in the dark with a growing glow, and a full light means a full map.

### 2026-10-22 · The worked example is behind a button
- **Decision:** after the first attempt, the worked example (planet) shows as a "See an example" button
  instead of the whole walkthrough. "Continue" moves on either way, and all four parts start at level 2,
  as before. Only the screen changes: the session's steps, the contracts and the scoring stay the same.
- **Instead of:** showing everyone the whole walkthrough, or moving the example before the first attempt.
- **Why:** the walkthrough was a whole paragraph to read on the first screen. Worked examples help
  beginners but slow down people who already know the topic, so it's offered, not imposed. The first
  attempt stays first, so it captures the learner's own words before any help.
- **Pattern / trade-off:** optional scaffolding (the worked-example effect and the expertise reversal
  effect). Level 2 no longer means the learner watched the example.

### 2026-10-22 · From 1,000 px the web build is laid out as a website
- **Decision:** from 1,000 px wide, the web build has a header (the wordmark, the session's concept, the
  screen's actions) and two columns: the words on the left, 480 px wide, and the map or the code on the
  right, where the light falls. The firefly's dashed line runs from the firefly, at the edge of the words,
  down the gap and into the part it asks about. Start and the signed-out landing page put the question and
  the choices (or the sign-in) on the left, and the code with the empty map on the right. Sheets become
  dialogs, controls answer hover, Enter sends an answer and Shift+Enter starts a new line. Below 1,000 px,
  and on Android, the phone layout stays as the board draws it. Leo's call; supersedes the "same layout
  centered" part of "Build-week scope cuts" (2026-10-19).
- **Instead of:** the phone column centered on a laptop, which reads as a phone app in a browser; a wider
  centered stage; or a question card floating beside each part.
- **Why:** the judges and most testers open the web build on a laptop, and a wide screen can keep the map
  and the conversation in view together. Keeping the words on the left keeps text out of the light's bright
  corner, where light ink would fail contrast at 3 and 4 points.
- **Pattern / trade-off:** one codebase with a width breakpoint, and the lesson-left, work-right split of
  coding courses (boot.dev, Exercism's editor). Each screen now has a phone branch and a website branch to
  keep in step. On a big screen the light reaches at most 1,300 px from its corner, so it lights the map,
  not the words. Motion is one-shot (blocks rise in, a part eases into its new state, the line draws
  itself, the guess rolls, Start's code line types itself in); nothing loops, blinks or pulses, and Reduce
  Motion leaves only the light.

### 2026-10-22 · Agent Memory contract: facts the agents read, ids they may cite, a view the app shows
- **Decision:** `AgentContext` gets an optional `memory: { facts: MemoryFact[] }` (at most 8), built by the
  API from SurrealDB Agent Memory before the coach and the hint giver run. A `MemoryFact` is one line from a
  template ("Level 3 on infraordinate for CORS, since Oct 22"), with its id, when it became current, the id
  it superseded, which agent wrote it and which session. The coach's and the hint giver's outputs get an
  optional `cites: string[]`, the fact ids the message relies on; the API keeps only ids it passed in.
  `MemoryView` is what `GET /me/memory` returns and the app's Memory sheet shows: per concept and move the
  level now, its history (level, since, until, source kind, writer, how many times other agents read it),
  and the latest whole-map gap next to the one before. Reverses "We don't enter the SurrealDB Agent Memory
  prize" (2026-10-22), on the privacy point it raised: no learner text ever goes to memory, the learner id
  is a salted hash of the Clerk id, the flag is off by default, and Delete my data purges the scope.
- **Instead of:** memory inside the orchestrator's state, or raw memory rows passed to the prompts, or the
  Oct 21 draft that stored the learner's own words beside each fact.
- **Why:** the prize asks for facts that replace older facts with the history kept, answers traced to a
  source, and memory shared across agents. Each lands on a field here: `supersedes` and `history`, `cites`
  and `source`, `writtenBy` and `readBy`. Keeping memory out of the orchestrator keeps "numbers in code,
  words in the model": a level still comes from `rules.ts`, memory only remembers it.
- **Pattern / trade-off:** a read model beside the system of record, with provenance on every row. The
  agents' inputs grow by one optional field, so every existing fixture and prompt stays valid; the cost is
  one more read before two of the six agent calls, bounded by the API at 1.5 s.

### 2026-10-22 · The result shows first; the coach's words come right after
- **Decision:** a session ends in two Turns. The last answer's Turn shows the result (every number is
  code's) with `result.coach: null` and `expects: "continue"`; the app sends `continue` at once, with no
  button, and the next Turn brings the coach's message. The result screen says "Reading your map…"
  until it arrives, and Try again if the call fails. If the coach itself fails, its Turn carries the fixed
  text built from the numbers, as before.
- **Instead of:** a faster model for the coach, or the API running the coach in the background while the
  app polls for it.
- **Why:** the last answer waited for two calls in a row, the evaluator and then the coach: 9.2 s, over the
  8 s ceiling. The numbers are ready the moment the evaluator answers, and they're the moment of the
  session (the gap), so they shouldn't wait for words. A faster coach would save less time and write
  weaker messages. Memory adds its read before the coach, and now that wait is hidden too.
- **Pattern / trade-off:** take the slow, non-critical call off the critical path (progressive rendering),
  done as one more request from the app rather than a background job. Every session gets one more Turn
  and request; in exchange there's no job queue and no polling, and the turn numbers already make the
  extra request safe to resend.

### 2026-10-22 · An answer typed in the fact desk's chat gets its own fixed line
- **Decision:** when a learner types an answer in the level-5 chat ("software interface") instead of a
  question, the fact desk marks it `states_an_answer`, and code shows one fixed line: "That looks like an
  answer. Answers go on the map, and the whole map is scored when you submit. If you need a fact, ask me."
  It isn't counted in `questions`. Decision 17's redirect stays for questions that fish for the structure.
  The coach also stops repeating the prediction, which the screen already shows, unless memory compares it
  with last time.
- **Instead of:** the same redirect for everything ("That part is yours to decide…"), which repeated word
  for word when I typed answers in the chat, or a check in the app for a missing question mark.
- **Why:** in my own self-test I typed answers in the chat, and the screen kept giving the same line
  without saying where answers go. Answers belong on the map, and this line says so without ever saying
  whether the answer is right. A statement isn't a question, so counting it would inflate the testers'
  "questions asked". The app can't tell a claim worth checking ("an API always uses HTTP") from an
  answer by its punctuation; the model can.
- **Pattern / trade-off:** a fixed reply chosen by a classification (the model classifies, code speaks),
  as in decision 17. One more value in `questionType`; a learner whose claim gets misread as an answer
  sees the line instead of a fact, and can ask it as a question.

### 2026-10-22 · The result leads with the gap in words, over the guess and the score
- **Decision:** the result's headline is the gap in words, with its direction ("You felt 2 points surer
  than you could explain", "You knew more than you felt: 2 points more", "Your guess was exactly right"),
  over two rows of eight points: my guess and what I proved. The big signed number is gone, and the screen
  says how a part earns its points.
- **Instead of:** the gap as one big signed number ("−2", "0", "+2") with a sentence beside it.
- **Why:** Leo showed me that a learner reads the biggest number as their grade: "0" looks like nothing and
  "−2" like losing points, when 0 is the best calibration there is. The pitch says AI gives false
  confidence, so the screen has to say plainly that this number is about my confidence, not my map.
- **Pattern / trade-off:** show both values and name the direction, the way certainty-based marking keeps
  "how much you got right" apart from "how well your confidence matched". The gap stays the message, and
  it loses the drama of one big number.

### 2026-10-23 · Memory is written when the result is saved, and a session's coach reads only what came before it
- **Decision:** the API writes a session's facts to Agent Memory the moment its result Turn is saved (the level
  changes, the gap, the Helps per part), off the request path, with each fact's provenance in labels on the row
  (`session`, `turn`, `writer`, the numbers). The read before the hint giver and the coach takes, per key, the
  newest row not written by the current session, so the coach of a session whose facts were just written still
  reads only earlier sessions. Facts are attributes of one entity per learner and concept, one key per fact
  (`level_<move>`, `gap`, `help_<move>`), so a later session's write supersedes the earlier value and memory's own
  history is the Memory sheet's chain. The message's `cites` go on the `Message` (optional, with `sources`), not on
  `Result`, and the result screen reads the summary message's `sources` from the same Turn.
- **Instead of:** writing after the coach's Turn (the session's real end), or keeping the numbers in a side table
  of our own, or putting `sources` on `Result.coach`.
- **Why:** the coach's Turn only arrives if the app asks for it; a learner who closes the app on the result would
  leave no memory. Writing at the result and skipping the current session's rows on the read keeps both. Labels
  keep each row self-describing, so the view and the agents read memory, not our tables, which is what the prize
  judges. `Result` stays as it was for every saved session; only the Turn that carries the coach's words gains
  a field, and only with memory on.
- **Pattern / trade-off:** write early, filter on read. One more label per row; a read has to skip rows by
  session instead of trusting "newest". A session with no result (abandoned) leaves nothing, as before.

### 2026-10-22 · No mastery screen: a level-up shows on the result, the levels live in the Memory sheet
- **Decision:** the mastery screen (#42) is cut. On the result, a part that moved up a level says so under
  its words ("less help next time", or "you can do this alone now" at level 5), and the Memory sheet (#112)
  is the one place to see every level and how it changed.
- **Instead of:** a separate screen with the level per part and a "you did this alone" moment.
- **Why:** I want a clean experience that doesn't repeat itself, and the same levels on two screens is
  noise. The moment belongs where it happens, at the end of the session.
- **Pattern / trade-off:** one home for each piece of information. If memory's flag stays off, the levels
  have no screen of their own; the result still marks each level-up.

### 2026-10-23 · After a part is right, its feedback says what makes it right and what was left out
- **Decision:** when the evaluator marks a part correct, its feedback names what makes the answer right (for
  types, the criterion that splits them) and adds, in one sentence, what the learner left out of that same
  criterion: a missing type, a missing essential characteristic, or what would make a quality 1 answer exact.
  Never a type sorted by another criterion. Before a part is correct nothing changes (no answers, no other
  members of the group), and the points don't change. The part answered last, whose feedback came with the
  result and never showed, now shows on the result with those words. The self-test (the testers' pre-test and
  post-test) keeps its notes as they were.
- **Instead of:** confirming in a few words and nothing more, or adding every type a search lists (those lists
  mix criteria: "composite" is how an API is built, not who uses it).
- **Why:** if a part passes, I'd think that's all there is: I said three types, so there are three. I want it to
  be accurate and tell me: you said this, and specifically it's this.
- **Pattern / trade-off:** elaborated feedback, given after the attempt: I do the thinking first, and what I
  missed arrives once the part is scored, so it teaches without doing the work for me. The feedback gets
  longer (up to 45 words) and holds things I didn't find myself. The self-test stays as it was, so a pre-test
  can't hand a tester the post-test's answers.

### 2026-10-23 · Agent Memory goes on for the testers
- **Decision:** the Agent Memory flag goes on before the first tester, in Leo's rollout order (the app update
  with #130 ships first, then the flag on Render), instead of after the testers.
- **Instead of:** keeping it off on tester day and turning it on tonight.
- **Why:** it's better if the testers test the memory layer as well: every session they finish writes real
  facts, and the Memory sheet and Delete my data get real use, instead of only a smoke test.
- **Pattern / trade-off:** a feature flag with a kill switch, turned on for real users early. Its first
  production run happens with the testers; the design bounds that (a read over 1.5 s or a failed write and the
  session goes on without memory) and so does the switch (one Render variable, about a minute, no deploy). An
  app without the update rejects a Turn that cites memory, so the order is ship, check, then the flag. A
  tester's four sessions are on four different concepts (`docs/tester-protocol.md`), so no agent cites memory
  during a slot: the remembering itself shows from a second session on the same concept.

### 2026-10-23 · On iPhones the web build installs as a web app
- **Decision:** the web build ships a web app manifest, its icons and Apple's home-screen metas
  (`app/public/`, `app/src/app/+html.tsx`), so a judge or a tester with an iPhone or a laptop can add Lumente
  to the home screen and open it full screen with its own icon. The status bar is black, not translucent,
  so the wordmark never sits under the clock. No service worker: every session needs the API, so there is
  nothing to run offline.
- **Instead of:** a plain Safari tab for everyone without an Android phone, or an Apple account and
  TestFlight (decided against on Oct 21: Apple's review takes too long for this week).
- **Why:** the Expo story is one codebase on three platforms, and until now the third platform was a
  browser tab. This is the same static export EAS Hosting already serves, with no new build and nothing
  native, so it costs nothing on the free plan and cannot break the phones.
- **Pattern / trade-off:** a progressive web app on top of Expo Router's static output. In standalone mode
  on iOS, Google sign-in may bounce to Safari and lose the standalone window; the email code signs in
  without leaving it, and the testing notes say so.

### 2026-10-23 · A session survives a reload or a killed app
- **Decision:** the device keeps which session is on screen (its id, its mode, the notes it started with and,
  at level 5, the map being built) in the browser's storage on the web and in a file in the app's documents
  folder on a phone (`app/src/session/saved.ts`, `storage.ts`), and Start offers to resume it after a reload,
  a closed tab or a killed app. Resuming reads the session's latest Turn back from the API (`GET /sessions/:id`,
  which existed since #27 and nothing called), so the map, the points and the current question return and the
  session goes on from that Turn; the earlier lines stay on the server. The record goes once the session is
  over, on Delete my data and on sign-out. Demo mode keeps nothing.
- **Instead of:** losing the session (a tester who refreshes the page, or whose phone kills the app in the
  background, starts over while the server's copy stays half done), or keeping the whole transcript on the
  device (more to keep in step with the server, and the learner's words on the device).
- **Why:** tester day: five testers, each with a pre-test, a session and a post-test, on phones and laptops we
  don't control. The server already kept every session; only the app forgot. `expo-file-system` is part of
  every Expo build, so the fingerprint doesn't change and build 3 takes this as an update.
- **Pattern / trade-off:** a pointer on the device, the state on the server. A resumed session shows the latest
  Turn's lines, not the whole conversation (the map and the points carry the history); the pointer lives on
  one device, so a session can't be picked up on another.

### 2026-10-23 · The first session on a part leaves its level in memory, even when the level didn't move
- **Decision:** when a session reaches its result, the API reads what memory already holds for the learner and
  the concept, then writes a baseline level fact for every finished part that has no level row yet ("You were at
  level 5 on 'Its types' for API on Oct 23.", key `level_<move>`, `writtenBy: evaluator`), beside the usual facts
  for the parts that moved. A read that fails leaves the old behaviour: the changes only, and a log line.
- **Instead of:** a level row only when a level changed (#112 as built). Levels never go down in a learn session
  and never move in a test one, so a learner at level 5 on every part, the demo account included, would never get
  a level row: the Memory sheet said "no level yet" under each part, and the hint giver and the coach read no
  level at all for them.
- **Why:** the Memory sheet and the SurrealDB prize walkthrough show the level chain per part; on the account the
  judges will see, that chain was empty by construction. Found by the Oct 23 evidence review of PR #130.
- **Pattern / trade-off:** one history read per finished session, off the request path, inside the write's 10 s
  budget. The first session on a concept writes up to four extra rows; later sessions write the changes only, so
  the chain still reads as a history of moves.

### 2026-10-23 · One update channel for every phone: a new Android build uses the `preview` profile
- **Decision:** every Android APK we hand out is built with the `preview` profile (channel `preview`), the Oct 24
  freeze build included, through `.eas/workflows/preview-build.yml`. The `production` profile in `app/eas.json`
  stays defined but unused until a second channel is wanted on purpose.
- **Instead of:** a `production` build at the freeze (the Oct 21 plan), which would put that phone on a
  `production` channel while `ship.yml` publishes updates to `preview` only: a Demo Day update, or any fix after
  the freeze, would never reach it.
- **Why:** one channel is one place to look when a phone misbehaves, and the three EAS environments carry the
  same `EXPO_PUBLIC_*` values, so the `production` profile buys nothing today. Builds are scarce (15 a month);
  if no native module lands, build 3 keeps taking updates and the freeze needs no build at all.
- **Pattern / trade-off:** the testers and the demo phone share one channel, so a fix meant for the demo also
  reaches a tester's phone. Acceptable: after the freeze, every update is a reviewed `main`.

### 2026-10-23 · The website is `lumente.expo.app`
- **Decision:** the EAS Hosting preview subdomain moves from `reality-check` to `lumente`, so the production site is
  `https://lumente.expo.app` and the aliases are `lumente--testers.expo.app` and `lumente--review.expo.app`. The
  app's Share link (`brand.site` in `app/src/theme.ts`), the smoke test's default and the docs follow; `CORS_ORIGIN`
  on Render carries the new origins (Clerk's `azp` check reads the same list, so web sign-in needs it).
- **Instead of:** keeping `reality-check.expo.app`, the slug chosen on Oct 21 before the product was named (#91), or
  a custom domain (a paid EAS feature, and one more thing to own before Demo Day).
- **Why:** the link is the first thing a judge or a Devpost reader sees, and it said the old name. Cynthia asked for
  the change the night the testers finished (Oct 23), the one window where no tester holds a live link.
- **Pattern / trade-off:** Expo reserves a released subdomain for ever and allows three changes in all. Right after
  the change the old addresses still answered (Expo says old deployments keep working), but we no longer own the
  name, so every old link (the testers' message, the Oct 22 status page, #106's draft) gets replaced rather than
  trusted. The Android package `ca.buildnorth.realitycheck`, the app slug and the EAS project name stay as they are
  (a change there is a new app on every phone). The phones pick up the new Share link with the next update.

