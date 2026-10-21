---
title: "Plan to win Build North"
type: synthesis
related: ["[[expo-prize-plan]]", "[[surrealdb-sponsor-prize]]", "[[hosting-setup]]"]
created: 2026-10-20
updated: 2026-10-21
---

The final plan, written on Oct 21 after the mentors told Cynthia the idea needs one specific user and
one specific problem. It replaces the Oct 20 version. It's a proposal: Cynthia decides, and anything
adopted goes in `DECISIONS.md` or an issue. The Expo details live in the
[Expo prize plan](expo-prize-plan.md).

## 1. The goal

Reality Check shows CS students which concepts in their AI-built code they can't explain, and gets
them explaining those concepts on their own.

Devpost asks every team three questions. Our answers:

1. Who is the user? A CS student who builds class and side projects with a coding agent (Claude Code,
   Cursor or Copilot) and can't explain the code it wrote. Our testers are classmates like this.
2. What's better because we exist? They find out what they can't explain before an interviewer or a
   bug does, and they learn it by building it themselves.
3. Is there a path to production? Students start free and pay for more sessions. CS programs and
   bootcamps pay per student. We price both from the measured cost of a session.

What winning looks like, in order: the top 10 on Oct 26, Best Overall at Demo Day on Oct 29, then Best
Use of Expo and Best Use of Clerk.

By Sunday, Oct 25 at 9 PM, all of this is true:

- The app is live on the web and on Android, with Claude on, sign-in, level 5 and the result screen
  with the gap. iPhones use the web build, since we decided against TestFlight on Oct 21.
- Five testers from our user took a pre-test and a post-test, and we have their numbers.
- The video, the deck, the README and the Devpost page are done, and the project is submitted.

## 2. The story

### The problem

- Coding agents make students learn less. In Anthropic's randomized trial (January 2026), developers
  who coded with an AI assistant scored 50% on a quiz about concepts they had used minutes before, and
  the group that coded by hand scored 67%.
- Students don't notice. Prather et al. (ICER 2024) found that struggling novices using AI "thought
  they performed better than they did."
- How they use the AI decides it. In the same trial, people who asked the AI conceptual questions
  scored 65% or more, and people who handed it the work scored under 40%.
- It reaches past students: in a CHI 2025 study of 319 knowledge workers, more confidence in AI went
  with less critical thinking.

### What Reality Check does

1. You pick a concept from your project, like JWT or CORS, and predict your score out of 8.
2. You build the concept's map in four moves: its bigger group, what it needs, what it isn't, and its
   types. The AI asks questions and gives hints that cost a point and fade as you improve. It never
   writes the answer.
3. You see the gap between how sure you felt and how you did.
4. At level 5 the roles flip. You ask the questions, and a fact desk answers with facts only.

The gap shows students the illusion, and level 5 trains the habit the high scorers had.
`DECISIONS.md` (Oct 18) already says the subject is the gym equipment and thinking is the muscle, so
the method stays and only the concepts change.

### The concepts

We picked them from what coding agents put in student projects. Six of the eight are in our own API.

| What the agent built | Concepts |
|---|---|
| Login | JWT, hashing |
| Data | database index, cache |
| An API | REST API, rate limiting |
| Deploy | environment variable, CORS |

- The demo uses JWT for session 1 and CORS for the level-5 profile.
- The testers use database index and rate limiting for the pre-test and post-test, swapped between
  testers as now, and hashing and environment variable in the two training sessions.
- No demo or tester concept may appear in a prompt (`MEASURED` in `agents/test/prompts.test.ts` checks
  it), and the tester concepts stay out of the evals, so we never tune the prompts on what we measure.
  Planet stays the only worked example.

### Why it's new

AI tutors explain things to you. Reality Check makes you do the explaining, shows how far off you
were, and then hands you the questions. The method is the mentefacto from Miguel de Zubiría's
conceptual pedagogy, with help that fades (Wood, Bruner and Ross; Collins, Brown and Newman) and
calibration measured as the predicted score against the real one on the same task.

### Path to production

Students start with free sessions, then pay for a plan priced from the cost of a session, which
`agent_log` records for every Claude call. CS programs and bootcamps pay per student and get classes
through Clerk Organizations. Next on the roadmap: concepts read straight from your repo, Check the AI
(checking what your coding agent wrote), Spanish, and the same method for any concept, democracy and
inflation included. At Demo Day we ask for a pilot with one CS program.

## 3. How we score

Devpost publishes no weights, so we treat the five criteria as equal. The judges are a Georgian
investor, Georgian's CTO, an AI founder and a Google startups engineer, so the business case gets read
as closely as the code.

| Criterion | What we show | Still to do |
|---|---|---|
| Innovation | An AI that won't do the thinking. The gap reveal and the role flip are the two demo moments | The new hook in the video and the deck |
| Real-World Impact | One user, three sources, tester numbers, the cost of a session, who pays | The testers (P2, P3) and the cost of a session (#10) |
| UI & Design | Round 6, "Out of the Cave", in every screen with the brand icon and splash (#81), and every state designed (waiting, error, empty, a small phone) | Merge #81, then level 5 and the result screen (#26, #34), and Reduce Motion |
| Tech & Deployment | A contract-first monorepo with Zod at every boundary, the orchestrator in code, evals against Claude, 59 agent tests and 37 API tests passing (Oct 20), budget and rate-limit stops | Everything deployed: the API on Render Starter, the web build at `reality-check.expo.app` (a review deploy is up), the Android builds (queued Oct 21), Clerk |
| Security & Ethics | The Claude key only on the server, Clerk tokens checked without a network call, rate limits, the 95% budget stop, the learner's text fenced as data, 0 leaks in 10 from the fact desk, no streaks, adult testers who consent, tester data in its own database | Delete my data and the privacy note (#43), and a welcome line that says the tutor is an AI that asks and never hands over the answer |

## 4. The prizes we enter

### Best Overall

Everything above.

### Best Use of Expo

Expo asks for an app built with its React Native tooling that uses the SDK and ships with EAS Build or
EAS Update, so Expo does real work in the stack. Our story: one TypeScript codebase ships to iOS,
Android and the web, and EAS builds it, updates it over the air, hosts the web build and ships every
merge.

The must-haves are E1 to E6 in the Expo plan: the EAS project, an Android development build and then a
`preview` APK with an install link, EAS Update, the web build on EAS Hosting, our own icon and splash,
and a "How we used Expo" section. After them come EAS Workflows, level 5 as a native sheet, the SDK
doing visible work (the font, haptics, secure store, images, glass, Reanimated), the demo on a real
phone, and ten seconds of `eas update` in the video.

Where it stands on Oct 21: #80 has the EAS project (`@leo_atienza/reality-check`), `eas.json`, EAS
Update with the fingerprint policy, Expo Observe and two workflows, and #81 has the icon and splash.
The first development and `preview` Android builds are in the free queue, and a review deploy of the
web build is up. The workflows' push trigger waits on Cynthia installing the Expo GitHub app. The
native app is Android only, and iPhones use the web build.

### Best Use of Clerk

Clerk asks teams to use it for sign-in and sessions instead of building their own. The API checks
Clerk's session token without a network call and keys every row by the Clerk user id (#64). The app
signs in with Clerk on the web and on phones, keeps the token in secure store and sends a fresh one on
every call (#75). A Google sign-in already worked on the web build against the API.

Still to add: a sign-in tested on a phone, and delete my data deleting the Clerk account too (#43). Our
demo's first concept is JWT, the kind of token Clerk issues, which gives the write-up a good line. The
development instance allows 100 users and 100 emails a month, so we ask Clerk support to raise the
email cap and keep the `+clerk_test` fallback in the testing notes.

### What we skip

We skip SurrealDB Agent Memory. We use plain tables, and its judges want facts that replace old ones,
answers traced to a source and memory shared across agents. We'd only try it if the core is green on
Oct 23. We skip Eon too: Era simulates companies for testing enterprise agents, which doesn't fit us.

## 5. The changes for the new user

About a day of work across three people. Nothing in the API changes.

| # | Change | Owner | By |
|---|---|---|---|
| P1 | Log the decision in `DECISIONS.md` (draft in section 9) | Cynthia | Oct 21 |
| P2 | Recruit five classmates who build with Claude Code, Cursor or Copilot, and book their Oct 23 slots (#12) | Kyle | Oct 21 |
| P3 | Swap the tester concepts in the protocol (#24), `docs/grading-sheet.md` and `MEASURED` | Kyle, Cynthia | Oct 22, morning |
| P4 | Move the demo seed's level-5 session from inflation to CORS. #78's whole-map eval and the seed's test follow it | Leo | Oct 22 |
| P5 | Write session 1 of the demo on JWT and play it live with Claude until it shows a hint and a gap of about +2 | Cynthia | Oct 22 |
| P6 | Add JWT and CORS cases to the four agent evals, starting with the fact desk's leak eval | Leo, Cynthia reviews | Oct 22 |
| P7 | The start screen: the hook "Can you explain the code your AI wrote?", the concept list from section 2, "type your own", and the placeholder "For example: JWT" | Leo, on top of #81 | Oct 22 |
| P8 | The deck, the Devpost draft and the video script around the new story (#13, #30, #31, #48) | Kyle | Oct 22, draft |

`agents/fixtures/session-1.json` (democracy) stays as test data, so the tests built on it don't change.
The app's demo mode (no API set) still replays it. Demo mode stays a development tool, and on Demo Day
the fallbacks are the web build and the video.

## 6. Day by day

Times are rough. Each evening's check sets the next morning's list.

### Oct 21: unblock

| What | Who |
|---|---|
| Confirm a Claude key that still works after the credits expire on Oct 21. If there's none, add $30 with auto-reload off and make a key (#19, #20) | Cynthia, Kyle |
| Set `ANTHROPIC_API_KEY` and `AGENT_BUDGET_USD` on Render | Leo |
| Merge #64, then #73 (their one conflict, in `api/src/app.test.ts`, is resolved on Leo's side). Manual Deploy `main` and post the latency and the cost of one session (#10, #28) | Cynthia, Leo |
| Open the app PR from `cynthia/4-expo-app` and merge it (#4, #6), then #75, #80 and #81, each on the one before | Cynthia |
| Take the decisions still open in section 9, P1 first | Cynthia |
| Recruit the testers (P2) | Kyle |
| Done in #80: the EAS project, `eas.json` and EAS Update (E1, E3). The development and `preview` Android builds are in the queue (E2) | Leo |
| Expo's office hours on Discord, 3 PM ET (E12) | Leo |
| Everyone confirms their issues by 9 PM, and anything unclaimed moves (section 7) | Everyone |

### Oct 22: feature complete

| What | Who |
|---|---|
| P3 to P8 | As in section 5 |
| Level 5 with the fact desk as a sheet (#26) and the result screen with the gap (#34) | Cynthia |
| Merge #77, #78 and #79 (test mode, the whole map, the coach), then load the demo seed on prod for the demo account | Cynthia reviews, Leo |
| Render Starter until Oct 30, paid with the Render credit (section 13), and the production settings (#59) | Leo |
| The production web build at `reality-check.expo.app` with `CORS_ORIGIN` updated (E4), the `preview` APK on Kyle's phone, the first update, and the workflows' push trigger once Cynthia installs the Expo GitHub app (E7) | Leo, Cynthia |
| Delete my data and the privacy note (#43), since #81 already has the theme, icon, splash and haptics | Jonathan |
| The Devpost draft and the slides (#30, #31) | Kyle |
| Evening: a whole session with Claude on JWT, on an Android phone and on the web. Whatever breaks is the morning's list | Everyone |

### Oct 23: testers

| What | Who |
|---|---|
| Morning: fixes, the warm-up (#37), a smoke test, an update to `preview` | Leo, Cynthia |
| Evening: five testers (#38). The pre-test in test mode, two training sessions, the post-test, then two questions: would you use this before an interview or a project demo, and what would you pay for it? | Kyle runs it, Cynthia observes (#33), Leo watches the API (#37), the app's builder stays on call (#35) |
| Fixes go out with `eas update`, and we count them for the write-up | Leo |

### Oct 24: polish, and the freeze at 6 PM

| What | Who |
|---|---|
| Prompt fixes (#40), the top three usability fixes, and #43 if it isn't in yet. The mastery screen (#42) is first to cut | Cynthia, Jonathan |
| The numbers export (#50) and the start of hand grading (#49) | Leo, Cynthia |
| 6 PM freeze (#45): the `production` Android build, the last update, the last web deploy. Nothing ships after | Leo |
| Evening: the rehearsal (#41) and the video (#48), both on the frozen build | Cynthia, Kyle |

### Oct 25: submit by 9 PM

| What | Who |
|---|---|
| Hand grading (#49), the numbers slide (#52) and the final deck (#47) | Cynthia, Kyle |
| The README (#55): the live links and QR codes at the top, the architecture diagram, the Expo and Clerk sections, the disclosures | Leo |
| The Devpost page (#30, #51) and the submission (#53), with a screenshot in the chat | Kyle, Cynthia |

### Oct 26 to 29: stay alive

- Starter stays on and the budget stays topped up. No deploys except a fix, and someone opens the live
  link every day.
- The top 10 comes out on Oct 26. We rehearse the live demo twice, and at least one of us goes to
  Toronto on Oct 29 with Kyle's Android phone running the native build, a laptop with the web build and
  the video on a USB stick.

## 7. Who does what (proposal)

- Cynthia: the decisions, reviews and merges, the app screens (#26, #34), the JWT session (P5) and the
  prompt fixes.
- Leo: the API and hosting, EAS (Build, Update, Hosting, Workflows), Clerk end to end, round 6 in the
  app (#81), the start screen (P7), the demo seed and the evals (P4, P6), the README.
- Jonathan: delete my data and the privacy note (#43) and the mastery screen (#42). #81 already did the
  theme (#46), the icon, the splash and haptics.
- Kyle: the credits (#19, #20), the testers (#12, #24, #38, #39), the deck (#13, #31, #47, #52),
  Devpost (#30, #53) and the video (#48).

If someone can't take their part by 9 PM on Oct 21, app work moves to Cynthia and Leo, and the deck,
video and Devpost page move to whoever has the most room. Those decide the top 10 as much as the code
does.

## 8. The cut list

Cut in this order if we fall behind:

1. The mastery screen (#42). The demo uses the seeded profile.
2. The SDK 58 extras still left: the Expo UI picker and the update banner.
3. Round 6's photo-heavy screens. Keep the colors, the font, the icon and the result blocks.
4. Extra welcome steps.

Not this week: TestFlight and any iOS build (no Apple account, decided Oct 21), dark mode, the Android
widget, SurrealDB Agent Memory, and reading concepts from the student's repo.

Never cut: Claude live, the tech concepts in the demo, level 5, the result screen with the gap,
sign-in, delete my data, EAS Build and Update, the web build, the five testers, the video.

## 9. Decisions for Oct 21

Each one becomes a `DECISIONS.md` entry once it's taken.

1. The user and the concepts. A draft entry:

   ```markdown
   ### 2026-10-21 · CS students who build with coding agents
   - **Decision:** our user is a CS student who builds projects with a coding agent and can't explain
     the code it wrote. The concepts come from what agents build (JWT, hashing, database index, cache,
     REST API, rate limiting, environment variable, CORS). The demo uses JWT and CORS.
   - **Instead of:** abstract concepts like democracy and inflation, for any learner.
   - **Why:** Devpost and the mentors ask for one specific user. Coding agents made this problem new,
     two recent studies measure it, and our testers are this user.
   - **Pattern / trade-off:** a narrower beachhead inside the Oct 18 thinking-tool decision, where the
     subject is still the gym equipment. Abstract concepts move to the vision slide.
   ```

2. The brand (#14): Leo picked round 6, "Out of the Cave", and #81 puts it in every screen. Cynthia
   approves it on #81.
3. The Claude budget and model for the testers and judging (Opus 5.5 or Sonnet 5.5), sized from the
   measured cost of a session, with enough left for the judges until Oct 29.
4. TestFlight: taken on Oct 21. Cynthia said we don't need an Apple account, since Apple's review takes
   too long, so the native app is Android only and iPhones use the web build.
5. The web build on EAS Hosting instead of a Render Static Site.
6. The Expo organization: answered for now. The EAS project is `@leo_atienza/reality-check` on Leo's
   account, and it can move to an organization later from its settings.
7. Render Starter from Oct 22 to Oct 30, about $7. Each of us can claim $50 of Render credit.
8. Who goes to Toronto on Oct 29.

## 10. Risks

| Risk | What we do |
|---|---|
| No Claude key works after the credits expire on Oct 21, so nothing is live | #20 on Oct 21, and Sonnet if a session costs too much |
| Cynthia's review queue blocks everyone: the app PR, #64, #73, #75, #77, #78, #79 | One review block on Oct 21 in that order. Leo keeps the branches merged up and green |
| The new concepts eat feature time | They're content (P3 to P7) spread over three people, and the API doesn't change |
| The fact desk gives away more on tech concepts, whose definitions are precise | P6 runs the leak eval first, and the code still forces the redirect text |
| The testers don't overestimate on the pre-test | We report what we find. The post-test and the testers' answers still count |
| A turn takes over 8 s | Lower the effort first, then Sonnet for the questioner and the hint giver |
| A judge hits a cold start | Starter from Oct 22 |
| The first native build fails | The first builds went into the queue on Oct 21, which leaves three days to fix a failure |
| The network fails at Demo Day | The web build on a laptop, then the video. The offline replay only if we say it's a replay, since Devpost's rules ban faking a demo |
| Clerk's 100 emails a month run out | Ask Clerk support, and use the `+clerk_test` fallback |

## 11. Submission checklist

Devpost's list, and what goes in each part:

- A public GitHub repo: ours is public already.
- Live links: the web build and the Android install page with its QR code.
- The video: 3 minutes (the limit is 4), shareable, no login. A hook in the first ten seconds, the gap
  reveal, level 5, fifteen seconds on Expo and EAS, the numbers, the ask.
- The write-up: the one-line pitch, the problem with its sources, the user, how it works, the tester
  numbers, the cost of a session, How we used Expo, How we used Clerk, Responsible by design, and the
  architecture diagram.
- The team: four names.
- Disclosures: the `create-expo-app` default template on SDK 58, the AI tools we used (Claude and
  Claude Code), and that nothing was built before Build Week, once the team confirms it.
- Categories: Best Overall, Best Use of Expo, Best Use of Clerk.
- Rules we keep: everyone is 18 or older and lives in Canada, the repo, the video and the page go
  public, and every image has permission (the design boards use CC0, public-domain and Unsplash
  images).

## 12. Demo Day, in 3 minutes

1. The hook: "Can you explain the code your AI wrote?" The presenter predicts their score on JWT.
2. Session 1, live: a hint costs a point, and the gap shows (about +2).
3. The switch to the level-5 profile on CORS: the learner asks, the fact desk answers with facts, a
   question fishing for the structure gets the redirect, and the result shows a small gap.
4. The tester numbers.
5. The vision (concepts read from your repo, Check the AI, schools) and the ask: a pilot with one CS
   program.

We run it on Kyle's Android phone with the native build, mirrored. The web build is the backup and the video
is the last resort. Every agent gets a warm-up ten minutes before we go on, since the first call with
a new schema is slower.

## 13. Free tools and credits

Everything Build North and our stack give us for free, and what we do with each. The perks come from
the Devpost resources page and the plan limits from each service's pricing page, read Oct 21.

| What we get | What we do with it |
|---|---|
| Anthropic API credits from the organizers, which expire on Oct 21 | Use them until they expire. #19 asks the organizers for more, and #20 is the paid fallback |
| Render: $50 in credits for each of us, claimed through the [form](https://credits-portal-mmdm.onrender.com/claim/build-north-georgian) | One of us claims it by Oct 22. It covers Starter (about $7) through Oct 30 (#59) |
| The EAS free plan: 15 Android and 15 iOS builds a month, 60 minutes of Workflows, updates for 1,000 monthly users, and hosting at a free `name.expo.app` address | All our Expo work fits in it. We build rarely and ship JavaScript changes as updates |
| Expo Skills and the Expo MCP for coding agents ([docs](https://docs.expo.dev/agents/)) | We load them in Claude Code for the EAS and app work |
| Clerk's free development instance: 100 users and 100 emails a month | Our sign-in runs on it. We ask Clerk support to raise the email cap, and `+clerk_test` is the fallback |
| Clerk: 50% off Clerk Pro ([link](https://clerk.com/startups?tag=Georgian)), the Clerk CLI and a Clerk skill for coding agents | We skip Pro this week, and use the CLI or the skill if the Clerk setup gets stuck |
| SurrealDB Cloud's free plan: 512 MB, 0.25 vCPU, 1 GB of storage | Our database, with `dev` and `prod` |
| SurrealDB: $50 in Agent Memory credit for each of us (code `BUILDNORTH50` in Studio) | Only if we try Agent Memory (section 4) |
| Era by Eon: free early access for every team | We skip it (section 4) |
| Google Cloud for Startups: up to $350,000 in credits over two years for eligible startups | Not needed this week. An option to apply for if we keep going after Demo Day |
| Help: the Transferred Learnings Discord with the Expo, Clerk and Eon teams, Expo's office hours (Wednesdays, 3 PM ET), SurrealDB's team in the Build North Discord, a Georgian office hour (#11), and the mentors | We ask Expo what evidence they want on Oct 21, and take the new pitch to a mentor or the Georgian office hour before Oct 24 |

## Sources

- Build North on Devpost: [overview](https://build-north.devpost.com/), [rules](https://build-north.devpost.com/rules), [resources](https://build-north.devpost.com/resources), read Oct 21
- Anthropic, [How AI assistance impacts the formation of coding skills](https://www.anthropic.com/research/AI-assistance-coding-skills), January 2026
- Prather et al., [The Widening Gap: The Benefits and Harms of Generative AI for Novice Programmers](https://arxiv.org/abs/2405.17739), ICER 2024
- Lee et al., [The Impact of Generative AI on Critical Thinking](https://advait.org/files/lee_2025_ai_critical_thinking_survey.pdf), CHI 2025
- [Expo pricing](https://expo.dev/pricing), read Oct 21
- Expo, Apple and Clerk: the sources in the [Expo prize plan](expo-prize-plan.md)
