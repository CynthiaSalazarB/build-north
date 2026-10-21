---
title: "Plan to win Build North"
type: synthesis
related: ["[[surrealdb-sponsor-prize]]", "[[hosting-setup]]"]
created: 2026-10-20
updated: 2026-10-20
---

Written on Oct 20 at 9:30 PM from a full read of the repo (`main` and the open branches), all 55
issues, all 20 pull requests, the Devpost pages and the current Expo docs. It's a proposal: Cynthia
decides, and anything adopted goes in `DECISIONS.md` or an issue. Section 14 lists what this is based
on and what couldn't be checked.

## 1. The short version

**We can win.** The thinking engine and the API are the strongest part of the project, and better
engineered than most of what judges will open. The gap is the part judges touch: the app. With five
days left it has a start screen and a session screen on a branch with no PR, and sign-in in a PR on top
of it (#75). It has no level-5 screen, no brand and no EAS build yet.

Three bets:

1. **Finish the app on phones and the web**, with the calibration gap and level 5 as the stars.
   (UI & Design, Tech & Deployment)
2. **Make Expo the backbone and prove it**: EAS Build, EAS Update, EAS Hosting and EAS Workflows, plus
   the SDK doing visible work in the app. (Best Use of Expo, Tech & Deployment)
3. **Bring proof**: real tester numbers, the cost of a session from `agent_log`, and a three-minute
   demo that lands. (Real-World Impact, Best Overall)

The ten things that matter most, in order:

1. A Claude key with a budget on Render before the credits expire on Oct 21 (#19, #20). Without it,
   nothing is live.
2. Merge #64 and #73, deploy `main`, play democracy live, and post the latency and the cost of one
   session (#28, #10).
3. Open the app PR from `cynthia/4-expo-app` and merge it (#4, #6), then #75 on top, so everyone
   builds on the same app.
4. The EAS project: `eas.json`, bundle ids, `expo-updates`, the first Android build and the first
   update, on Oct 21. Expo Go can't run SDK 58 on a phone yet, so an EAS build is the only way anyone
   gets the app on a phone.
5. The whole-map evaluator (#36) by Oct 22. Level 5, the testers' pre-test and post-test, and the demo
   all need it, and unlike the coach it has no fallback.
6. The level-5 screen (#26) by Oct 22, and a real sign-in reaching the API (#22: #75 needs the Clerk
   publishable key and the dashboard settings).
7. The brand picked on Oct 21 and the theme in (#14, #46), with the app icon and splash replaced:
   they're still the Expo template's.
8. Testers recruited and scheduled today (#12, #24), run on Oct 23, with fixes shipped over the air.
9. Render on Starter from Oct 22 until Oct 30 (#59), so a judge never waits a minute for a cold start.
10. The video, the deck and the Devpost page, with an Expo evidence section, submitted by 9 PM on
    Oct 25 (#48, #47, #30, #53).

## 2. Where we stand (Oct 20, 9 PM)

| Part | Done | Open |
|---|---|---|
| `agents/` (Cynthia) | Prompts for the questioner, evaluator, hint giver and fact desk, with evals against Claude (evaluator 6/6, questioner 5/5, hint giver clean on all four steps, fact desk 0 leaks in 10). `advance()` and the ladder rules. Session 1 replays to 5/8 with a gap of +2. The demo seed plays to 6/8, gap +1. 59 tests pass. Median turn against Claude: 3.2 s and 2.8 s (two runs, budget 4 s) | The whole-map evaluator (#36) and the coach (#44) aren't in the `AGENTS` registry. The coach falls back to fixed text; the whole map has no fallback |
| `api/` (Leo) | Live on Render with SurrealDB Cloud. Every contract route, resent answers judged once, dev key and rate limit, `callAgent` with the 95% budget and rate-limit stops and the cost of every call in `agent_log`. 38 tests: 37 pass, 1 needs a database | #64 (Clerk, with the `.env.example` change Cynthia asked for) and #73 (orchestrator) are mergeable and waiting for her; they only conflict in `api/src/app.test.ts`, and Leo has that merge resolved. No Claude key on Render. Free instance, so it sleeps. #36, #44, #59. **Live today, the API replays the democracy fixture and makes no Claude calls** |
| `app/` (branch `cynthia/4-expo-app`, no PR) | Expo SDK 58 (React Native 0.88, Expo Router with typed routes, React Compiler, static web output). Start screen; session screen with the pinned map, the 0 to 8 picker, answers with Help, the worked example and a result card; an API client that already sends a Clerk token when it has one and draws the Turn a 409 sends back; a demo mode that replays session 1 with no API; tests | Level 5 (#26: the input says "coming soon"), the result screen (#34), mastery (#42), delete my data and the privacy note (#43), the theme (#46). The icon and splash are the template's. No bundle id, no `expo-updates`, no `eas.json`. The web build isn't deployed (#27). Sign-in (#22) is PR #75 (Leo, on top of this branch): `@clerk/expo`, Clerk's prebuilt `<SignIn />` on the web and its hosted sign-in in an in-app browser on phones, which works in Expo Go. It waits on the publishable key, email code as the only method and the Native API turned on in the Clerk dashboard, and a real sign-in |
| Design (Leo, PR #72) | Six rounds of boards. Round 6, "Out of the Cave", has everything #14 asks for (name, logo, three brand colors, meaning colors, Newsreader) and a tokens file in the shape a React Native theme uses | Nothing picked; #14 is due Oct 21 |
| Testers, deck, Devpost (Kyle) | | No branch, PR or issue comment on GitHub yet for #11, #12, #13, #19, #20, #24, #30 or #31. It may be moving in Discord: confirm today |
| App issues (Jonathan) | | #4 and #6 moved to Cynthia, and #22 to Leo (#75). No branch, PR or issue comment on GitHub yet for #5, #26 or #27. Confirm today |

## 3. How we're judged

- **Criteria:** Innovation; Real-World Impact (a clear user, the value it adds, a path to production);
  UI & Design (usable by a real user); Tech & Deployment (solid architecture, deployed, serving
  features); Security & Ethics (guardrails, safe handling of user data). No weights are published, so
  treat them as equal.
- **Process:** submissions close Oct 25 at 11:59 PM ET (we aim for 9 PM). The top 10 are announced on
  Oct 26 and demo live in Toronto on Oct 29, with at least one of us there. The top 10 are picked from
  the Devpost page, so the video, the live link and the write-up decide whether we demo at all.
- **Field:** 73 people registered and teams have up to four, so roughly 15 to 25 teams (an estimate).
- **Prizes:** Best Overall (the Georgian Golden Ticket, $15,000 in Anthropic credits, a Google Home
  each), Best Use of Expo (an LG 27" monitor each and a year of Expo Starter), Best Use of Clerk (JBL
  headphones each), Best Use of Eon, and Best Use of SurrealDB Agent Memory ($1,000 in credit). For a
  category prize, judges look for evidence that the platform "materially shaped" the build.
- **Rules that touch us:** disclose prior work, templates and the AI tools we used (the
  `create-expo-app` default template; Claude and Claude Code during Build Week). The repo, the video
  and the Devpost page become public. One submission per team.

## 4. The Expo prize playbook

The full version, with the config, the judge's path, TestFlight and the evidence, is
**[expo-prize-plan.md](expo-prize-plan.md)**. This section is the summary.

What Expo asks for: an app built with its React Native tooling that uses the SDK and ships with EAS
Build or EAS Update, so the platform does real work in the stack.

Our story: **one TypeScript codebase ships Reality Check to iOS, Android and the web through Expo, and
shares its contracts (the Zod schemas in `@build-north/agents`) with the API through the npm
workspace. EAS builds it, updates it over the air, hosts the web build and ships every merge.** The
phone is where learning happens; the web build is the judges' front door.

**What the docs changed (checked Oct 20).** Expo Go for SDK 58 isn't in the App Store or Google Play
yet: Expo expects it in the stores a few weeks after the SDK 58 release, and until then SDK 58 projects
need a development build. Since May 2026, Expo Go also only opens projects that belong to your own Expo
account or organization. So no judge or tester will run our app through Expo Go: every phone runs an
EAS build. That puts EAS Build on the critical path for anything on a phone, and it's exactly the
"ship with Build" the prize asks for. Staying on SDK 58 is right: the next store Expo Go supports only
58.

**The free plan shapes the plan.** EAS Build gives 15 Android and 15 iOS builds a month in a
low-priority queue (waits of over 90 minutes at peak, a 45-minute timeout), so we build rarely and
update often. EAS Update is unlimited up to 1,000 monthly users. EAS Hosting is free at a
`name.expo.app` address. EAS Workflows gets 60 CI minutes a month. Maestro tests need a paid plan, so
they're out.

### 4.1 Must have: the bar to be in the running

| # | What | Why it counts | Proposed owner | Time | When |
|---|---|---|---|---|---|
| E1 | An EAS project under a team Expo organization, set up from `app/` (in a monorepo, `eas.json` lives there): `eas init` (adds `owner` and `extra.eas.projectId`), `ios.bundleIdentifier` and `android.package` in `app.json`, an `eas.json` with `development`, `preview` and `production` profiles, and the `EXPO_PUBLIC_*` values (the API URL and the Clerk publishable key, never the dev key) as EAS environment variables | Everything below needs it | Leo | 1 h | Oct 21 morning |
| E2 | **EAS Build**: first an Android development build (an APK with `expo-dev-client`), so the team can run SDK 58 on Android phones; then a `preview` build (APK, internal distribution: anyone with the link can install it) with an install link and a QR code in the README and on Devpost. Start each build early: the free queue can take over an hour. About six of our 15 builds cover it (development, two previews, production, spares). #4's done-when says Expo Go; on SDK 58 that has to be the development build. iOS: see 4.4 | "Ship with Build", and the only way onto a phone | Leo | 1 to 2 h with the queue | Oct 21, again at the freeze |
| E3 | **EAS Update** (`npx expo install expo-updates`, then `eas update:configure`): `preview` and `production` channels, with the `fingerprint` runtime policy so an update only reaches builds with the same native code. Every merged app change ships as an update (`eas update --channel preview --environment preview`), and an installed build picks it up after a relaunch or two. On tester night, fixes go out over the air: count them for the write-up | "Ship with Update", and the best story we'll have | Leo | 45 min | Oct 21 |
| E4 | **The web build on EAS Hosting** (`npx expo export --platform web`, then `eas deploy --prod` for `name.expo.app`) instead of a Render Static Site. Keep `"output": "static"` in `app.json`, since SDK 58 defaults to server output when it's unset. Only the production address goes in the API's `CORS_ORIGIN`: each preview deploy gets a new address. The free limits (100,000 requests a month) are plenty | All three platforms ship through Expo, EAS Workflows can deploy it, and #27 hasn't started, so switching costs nothing. The API stays on Render. Needs a `DECISIONS.md` line: EAS Hosting was Render's plan B | Leo | 30 min | Oct 21 or 22 |
| E5 | **The app's identity**: the brand icon (with an Android adaptive icon), the splash and the name. The template's Expo and React logos and blue splash go. Check the splash on a release build | A judge sees the icon before anything else | Jonathan or Leo | 1 h | Oct 22 |
| E6 | **"How we used Expo"** in the README and on Devpost: the links, screenshots of the EAS dashboard (builds, updates, workflow runs, hosting deploys) and every Expo module with the job it does | The judges need evidence, and this is where they look | Leo, Kyle | 1 h | Oct 25 |

### 4.2 Strong: what sets us apart

| # | What | Proposed owner | Time |
|---|---|---|---|
| E7 | **EAS Workflows** in `.eas/workflows/`: one workflow that publishes an update to `preview` and deploys the web build, and one that makes an Android build. `eas workflow:run` runs them from the CLI today. Running them on every push to `main` needs the Expo GitHub app, which only Cynthia can install, since the repo is on her personal account. Builds stay manual within the 60 CI minutes | Leo | 1 to 2 h |
| E8 | **Level 5 that feels native**: the map owns the screen and the fact desk is a half-height sheet (Expo Router's `presentation: "formSheet"`, a draggable bottom sheet), as round 6 designs it | Cynthia (#26) | inside #26 |
| E9 | **The SDK doing visible work**: `expo-font` with Newsreader (`@expo-google-fonts/newsreader`); `expo-haptics` (selection when the guess changes, success on a level up, nothing else; the web gets the Vibration API); `expo-secure-store` for Clerk's token cache on phones (it has no web version); `expo-splash-screen`; `expo-image` for the arch photos; `expo-glass-effect` for the floating controls (glass on iOS 26 and later, an opaque surface on Android and the web); and Reanimated for the two moments (the dawn after the guess, the points casting into bronze), which turn into fades with Reduce Motion | Jonathan, Cynthia | 3 to 4 h |
| E10 | **Demo Day on a real phone** running the `preview` build, mirrored to the screen: an Android phone, unless someone has an Apple account (4.4). The web build is the backup, and demo mode (the session-1 replay, no network) the last resort | Cynthia | rehearsal |
| E11 | **Ten seconds in the video**: change one line, run `eas update`, relaunch, and the phone has the change. Update doing real work, on camera | Kyle, Leo | 0.5 h |
| E12 | **Expo's office hours** on Discord, Wednesdays at 12 PM Pacific (3 PM Eastern), and Oct 21 is a Wednesday. Ask what evidence of real use they want to see. Expo's partner team is also in the Transferred Learnings Discord | Leo or Cynthia | 30 min |
| E13 | **What SDK 58 just shipped, where it fits**: the 0 to 8 guess as a native Expo UI control, Expo Observe for startup times and crashes per release, and an "Update ready: restart" banner with `useUpdates()` | Jonathan, Leo | 2 to 3 h |

### 4.3 Only if we're ahead

- E14. Dark mode with round 6's dark palette (`"userInterfaceStyle": "automatic"`).
- E15. An iOS simulator build (free, no Apple account needed) if one of us has a Mac, to show the iOS
  app at Demo Day.
- E16. An Android home screen widget (`expo-widgets`, new in SDK 58): "Resume inflation: 3 of 4 parts"
  and each part's stage, progress only.

### 4.4 iPhones: TestFlight

- Expo Go is no iOS path for us: no SDK 58 in the stores yet, and it only opens our own projects.
- The way to put the native app on judges' iPhones is a **TestFlight public link**. It needs an Apple
  Developer Program membership (USD 99 a year; one of us enrolls as an individual, about a day to
  confirm), then Apple's Beta App Review of the first build (Apple's general figure: half in 24 hours,
  90% in 48). So the decision is tonight's (section 10). The steps, the reviewer login and what Apple
  checks are in [expo-prize-plan.md](expo-prize-plan.md), Pillar 2.
- Without it, iPhone users get the web build, a Mac can run the simulator build (E15), and Android
  gets the APK.

### 4.5 What not to do

- No App Store or Play Store submission: review times don't fit the deadline, and judges don't need it.
- No push notifications. They'd contradict our no-streaks decision; the write-up says we left them out
  on purpose.
- Don't spend a build on every change: builds are scarce and slow on the free plan, and JavaScript
  changes go out as updates.
- Never commit a lockfile regenerated on Windows: npm there drops its `libc` fields, and EAS installs
  from it on Linux, where that can pull the wrong native binaries.
- Never hand-edit `ios/` or `android/`: they're generated, and native settings live in `app.json`.
- Don't let EAS work block the core loop. E1 to E4 take a morning; the screens come first.

### 4.6 Evidence checklist for the Expo judges

- Links: the web build on EAS Hosting, the Android install page with its QR code, and screenshots of
  the EAS project (builds, updates, workflow runs).
- Numbers: builds made, updates shipped (the tester-night count), workflow runs.
- One diagram: one codebase, then EAS Build, Update and Hosting, then iOS, Android and the web, with
  the contracts shared with the API.
- The template disclosure: `create-expo-app` default template on SDK 58, demo screens removed.

## 5. Best Overall, criterion by criterion

### Innovation

- What we have that others won't: **an AI that refuses to think for you.** It asks instead of telling,
  its help fades as the learner improves, and at level 5 it hands the questions to the learner while a
  fact desk answers with facts only. The calibration gap shows how sure you felt next to how you did.
- Make the gap reveal and the role flip the two moments of the demo and the video. Name the method once
  (the mentefacto, from Miguel de Zubiría's conceptual pedagogy) and the research behind each choice,
  which `DECISIONS.md` already cites (Wood, Bruner and Ross; Collins, Brown and Newman; Koedinger and
  Aleven; Pearson and Gallagher).

### Real-World Impact

- **The problem, with a source.** A peer-reviewed CHI 2025 study by Microsoft Research and Carnegie
  Mellon (319 knowledge workers, 936 examples) found that more confidence in AI went with less critical
  thinking, and the authors suggest tools that adjust AI help to the user's confidence and expertise.
  That's our ladder and our calibration gap. MIT's "Your Brain on ChatGPT" is a preprint that hasn't
  been peer reviewed: label it that way, or leave it out.
- **One user.** The testers are adults, so the persona should match them: a first-year college student
  fits better than a high-school student. Schools stay the buyer on the vision slide. If the brief's
  persona is a high-school student, say the pilot used adults on purpose (no parental consent needed).
  Decide on Oct 21, before #31.
- **The value it adds, in numbers.** The pre-test and post-test (concepts counterbalanced, maps graded
  by hand and blind, the agreement with the evaluator reported) are rare at a hackathon. Run them even
  with three testers, and call it a pilot.
- **A path to production.** The cost of a session from `agent_log` (every call has its `usd`), a price
  per student and the margin; Clerk organizations for classes as the next step; Check the AI as the
  expansion; Spanish on the roadmap.

### UI & Design

- If time runs short, adopt round 6 "lite": the colors, Newsreader, the icon and splash, capsule
  buttons, the hint card that shows its price, and the result screen's shadow and bronze blocks, plus
  one dawn moment. Skip the photo-heavy screens.
- Design every state: waiting ("Checking your answer…"), an error with Try Again (the app already
  has it), empty, and a small phone.
- Tester night is the usability test: fix the top three problems on Oct 24.
- Accessibility: labels (already in the code), text that scales, the contrast round 6 already passes,
  and Reduce Motion.

### Tech & Deployment

- Already strong: a contract-first monorepo with Zod at every boundary, resent answers judged once, 37
  and 59 tests passing, evals against Claude, budget and rate-limit stops, and the cost of every call
  logged.
- Must happen: everything deployed and serving. The API on Render Starter with Claude on, the web build
  on EAS Hosting, an Android build, Clerk sign-in, and the demo seed loaded for the demo user.
- Show it: an architecture diagram in the README (Mermaid renders on GitHub). Optional, about 20
  minutes for the repo owner: a GitHub Actions workflow that runs `npm test` on every PR.

### Security & Ethics

- Already strong: the Claude key lives only on the server; Clerk tokens are checked without a network
  call and the web build's origin is checked too; the dev headers are off in production; rate limits;
  the budget stop at 95%; the learner's text is fenced as data in every prompt, and a test checks it;
  the fact desk can't hand over the structure (0 leaks in the eval, and code forces the redirect text);
  no streaks or XP; adult testers who consent; tester data in its own database.
- To add: the delete button and the privacy note (#43), and the welcome line that says the tutor is an
  AI that asks and never hands over the answer (round 6). Optional: deleting the learner's Clerk
  account too when they delete their data.
- Show it: a "Responsible by design" section in the README and on Devpost, and one slide.

## 6. The other prizes

- **Clerk:** low odds, cheap points, so enter. #75 signs in with `@clerk/expo`: the prebuilt
  `<SignIn />` on the web, the hosted sign-in on phones, the token cache in `expo-secure-store`, and a
  fresh session token on every API call. The API side is done (#64). The write-up describes the
  networkless token check and the origin check. #75 picked the hosted sign-in because it works in Expo
  Go; now that phones run a development build anyway, a sign-in screen in our own design (Clerk's
  email-code flow) or Clerk's native components (beta, `@clerk/expo-native-components`) would look
  better and show more of Clerk, if there's time. Delete my data (#43) should also delete the Clerk
  account, with `user.delete()` in the app after `DELETE /me/data`: Apple's guidelines ask for in-app
  account deletion, so TestFlight needs it too. Mind the development instance's limits: 100 users, and
  100 emails a calendar month. Ask Clerk support to raise the email limit, and keep the `+clerk_test`
  fallback ready (an address with `+clerk_test` signs in with the code `424242`, no email sent).
- **SurrealDB Agent Memory:** don't chase it by default. We use plain tables, and their judges want
  facts that supersede old ones, answers traced to a source, and memory shared by several agents.
  Agent Memory also needs access turned on for the Studio profile. Leo checks in ten minutes whether
  Contexts shows up in Studio and whether `BUILDNORTH50` redeems. Only if the core is green on Oct 23:
  write each mastery change as a fact and let the coach read them. Enter the category only if that's in.
- **Eon:** skip it; it's a poor fit.

## 7. Day by day

Proposed owners; Cynthia confirms. Times are rough.

### Tonight, Oct 20

- Cynthia merges #64 and #73 (the `.env.example` change on #64 is in). The second one needs a small
  merge in `api/src/app.test.ts`, which Leo has resolved.
- Everyone, in Discord: does anyone have an Apple Developer account, and if not, who enrolls tonight
  for TestFlight (section 10, decision 8)? Who goes to Toronto on Oct 29? Jonathan and Kyle: where your
  issues stand.
- Cynthia: the decisions in section 10.

### Oct 21: the walking skeleton, and EAS

- Morning: the Claude budget (#20: Cynthia adds $30 with auto-reload off and makes a key). Leo sets
  `ANTHROPIC_API_KEY`, `AGENT_BUDGET_USD` and `CLERK_JWT_KEY` on Render and runs a Manual Deploy of
  `main`. Democracy plays live; post the median latency and the cost of one session (#10, #28).
- Cynthia: open the app PR (#4, #6) and get it merged, then #75 on top; pick the brand by noon; start
  #26.
- Leo: E1 to E3 once the app is on `main`, starting the Android development build first thing so the
  queue runs while everything else happens; then E4. Then #36: the prompt, its registry entry and an
  eval. Check its done-when against the demo seed, which expects 6/8 with "money".
- 3 PM: Expo's office hours on Discord (E12).
- Leo: #75 to done: the Clerk publishable key in `app/.env` (and later in the EAS environment), email
  code as the only method and the Native API on in the dashboard, then a real sign-in reaching the API.
- Jonathan: #46 with the picked tokens and Newsreader, and the icon and splash (E5).
- Kyle: #12 (five names with time slots), #24 (the protocol in `docs/`), #14 (the brand page), #13.

### Oct 22: feature complete

- App: #26 with the fact desk sheet, #34 (the gap as shadow and bronze), #75 and #46 merged, haptics,
  the waiting and error states.
- API: #36 merged; #29 checked (with #73, test mode and the fact desk already run through `advance`);
  #44 (the coach, and the demo seed keyed to the demo user's Clerk id); #59 (Starter, its own key, and
  `NODE_ENV=production` once the app signs in with Clerk).
- EAS: E7 (Cynthia installs the Expo GitHub app), the web build on EAS Hosting, `CORS_ORIGIN` updated.
- Kyle: #30 (the Devpost draft) and #31 (the slides).
- Evening: a full session with Claude on, on an Android phone and on the web. Whatever breaks is the
  list for the morning.

### Oct 23: testers

- Morning: integration, warm-up (#37), a smoke test, and an update shipped to `preview`.
- Evening: five testers (#38): the pre-test in test mode, two training sessions, the post-test. Fixes
  ship with `eas update`; count them. Cynthia observes (#33), Kyle logs the bugs (#39), Leo watches the
  API (#37), and whoever built the app stays on call (#35).

### Oct 24: polish, and the freeze at 6 PM

- Prompt fixes (#40), the top three usability fixes, #43 (delete and privacy), #42 (first to cut).
- #50 (the numbers export) and the start of #49 (hand grading).
- 6 PM freeze (#45): a `production` Android build, the last update on the `production` channel, the
  last web deploy. Nothing ships after.
- Evening: the rehearsal (#41) and the video (#48), both on the frozen build.

### Oct 25: submit by 9 PM

- #49 and #52 (the numbers slide), #47 (the final deck), #55 (the README: the live links and QR codes
  at the top, the architecture diagram, the Expo, Clerk and SurrealDB sections, the disclosures), #30
  and #51 (the Devpost page), #53 (submit, with a screenshot in the chat).

### Oct 26 to 29: stay alive

- Starter stays on and the budget stays topped up. No deploys except a fix. Someone opens the live
  link every day.
- Rehearse the live demo twice. Bring a phone with the native build, a laptop with the web build, and
  the video on a USB stick.

## 8. Who does what (a proposal for Cynthia)

- **Leo:** the API and hosting, plus EAS (Build, Update, Hosting, Workflows), since it's deployment;
  #36, #44, #59; Clerk end to end, with #22 in #75 since Cynthia handed it over.
- **Cynthia:** the app screens, since she built the app's base: #26 and #34; prompt fixes; reviews and
  merges; the brand decision.
- **Jonathan:** #46 with the icon and splash, #43, #42.
- **Kyle:** credits (#19, #20), testers (#12, #24, #38, #39), the deck (#13, #31, #47, #52), Devpost
  (#30, #53) and the video (#48).
- If someone can't take their part by Oct 21 at noon, it moves: app work to Cynthia and Leo, and the
  deck, video and Devpost page to whoever has the most room. Those matter as much as the code for
  getting into the top 10.

## 9. The cut list, in order

1. #42, the mastery screen (the demo uses the seeded profile).
2. E14 to E16 (dark mode, the iOS simulator build, the Android widget).
3. SurrealDB Agent Memory.
4. Round 6's photo-heavy screens (keep the colors, the font, the icon and the result blocks).
5. Extra welcome steps.

Never cut: Claude live, level 5, the result screen with the gap, EAS Build and Update, the web build,
sign-in, delete my data, the testers, the video.

## 10. Decisions for the team

Each one becomes a `DECISIONS.md` line once it's taken.

1. The brand direction (#14), by noon on Oct 21.
2. The web build on EAS Hosting instead of a Render Static Site.
3. The Expo organization, and who owns the EAS project.
4. The Claude budget and model for the testers and judging, Opus 5.5 or Sonnet 5.5 (#20), sized from
   the measured cost of a session, with enough left for the judges until Oct 29.
5. The deck's persona, matching the adult testers.
6. Render Starter until Oct 30 (about $7). Each participant can claim $50 of Render credit through the
   form on the Devpost resources page.
7. Whether to try Agent Memory (default: no).
8. An Apple Developer Program membership for TestFlight (USD 99 a year), so judges' iPhones get the
   native app. Tonight, since Apple takes about a day to confirm and then reviews the first build.

## 11. Risks

| Risk | What we do |
|---|---|
| The credits expire on Oct 21 with no new key, so nothing is live | #20 today. Sonnet if a session costs too much |
| The app isn't finished (level 5, sign-in) | Owners confirmed by noon on Oct 21; the cut list |
| No whole-map evaluator: level 5, the testers and the demo break | #36 right after the walking skeleton |
| No testers, so no numbers | Recruit classmates tonight; three is enough for a pilot |
| A cold start when a judge opens the link | Starter from Oct 22 to Oct 30 |
| A turn takes over 8 s | Lower the effort first, then Sonnet for the questioner and hint giver (CONTRACTS.md section 5) |
| The network fails at Demo Day | The web build on a laptop, demo mode, the video |
| The first native build fails: so far the app has only run on the web and in Node tests | Build on Oct 21, not Oct 24. It's also the first test of Clerk's Native API, secure storage and Zod on the phone's JavaScript engine |
| The free build queue is slow (over 90 minutes at peak) | Start builds in the morning, ship JavaScript fixes as updates, and never leave the freeze build to the last hour |
| A spent budget shows as "Too many requests" in the app | A clearer message for a `rate_limited` error that isn't retryable |
| Clerk's development instance runs out of its 100 emails a month, so judges can't get a code | Ask Clerk support to raise the limit; the `+clerk_test` fallback in Devpost's testing notes |
| More design rounds | No new rounds once the brand is picked |

## 12. Submission checklist

Devpost page:

- A one-line pitch; the problem with the CHI 2025 citation; the persona; how it works (four parts, the
  help that fades, the gap, the role flip); the tester numbers; the cost of a session.
- Live links: the web build, the Android install QR code, the repo.
- The video, three minutes at most (the limit is four): a hook in the first ten seconds, the gap
  reveal, level 5, fifteen seconds on Expo and EAS, the numbers, the ask.
- The stack and the architecture diagram; "How we used Expo" (E6); "How we used Clerk"; SurrealDB
  Cloud; the Claude agents and the orchestrator in code; Render.
- "Responsible by design".
- The team: four names.
- Disclosures: the `create-expo-app` default template; the AI tools we used (Claude, Claude Code);
  confirm with the team that nothing was built before Build Week.
- Categories: Best Overall, Expo and Clerk; SurrealDB only if Agent Memory is in.

README (#55): the live links and QR codes at the top, a two-line pitch, the architecture diagram, how to
run it from a clean clone, the sponsor sections, the disclosures.

## 13. Demo Day, Oct 29

- Three minutes: the hook (predict your score), session 1 (a hint costs a point, the gap of +2), the
  switch to the level-5 profile (the learner asks, the fact desk answers with facts, and a question
  fishing for the structure gets the redirect), the result (6/8, gap +1), the tester numbers, Check the
  AI as the vision, the ask.
- Run it on a real phone with the native build, mirrored. The web build is the backup, demo mode covers
  a dead network, and the video is the last resort.
- Warm up every agent ten minutes before going on: the first call with a new schema is slower.

## 14. What this plan is based on

- **Read in full:** every tracked file on `main` and on `leo/clerk-token`; all of `cynthia/4-expo-app`
  (source, config, docs); the diffs of #73 and #75; PR #72's design files (README, design principles,
  round 6's tokens, and the text of every board); all 55 issues and 20 PRs with every comment and review; the
  Devpost overview, rules, resources, updates and gallery pages.
- **Checked against the docs on Oct 20:** Expo Go and SDK 58, the EAS free plan, EAS Build, Update,
  Hosting and Workflows, the Expo modules in E9, Clerk's Expo package, and Metro in a monorepo (sources
  below).
- **Not read in full:** `.env.example` (a local safety hook blocks it; the variable names come from the
  READMEs), `package-lock.json`, the images, `all-designs.html` (the same six boards in one file), and
  the vendored Claude skills on `leo/claude-skills`.
- **Checked live:** `/health` and `/health/db` on Render answer 200, and the session routes answer 401
  without the dev key. `npm test` on `leo/clerk-token`: the API 37 passed and 1 skipped (it needs a
  database), the agents 59 passed.
- **Not checked:** Discord, where #12, #19 and #20 may have moved; the brief.

Sources:

- Build North on Devpost: [overview](https://build-north.devpost.com/), [rules](https://build-north.devpost.com/rules), [resources](https://build-north.devpost.com/resources)
- Lee et al., [The Impact of Generative AI on Critical Thinking](https://advait.org/files/lee_2025_ai_critical_thinking_survey.pdf), CHI 2025
- Expo: [SDK 58 changelog](https://expo.dev/changelog/sdk-58) (Expo Go timing, office hours), [Expo Go loading changes, May 2026](https://expo.dev/changelog/expo-go-loading-changes-may-2026), [pricing](https://expo.dev/pricing)
- EAS: [internal distribution](https://docs.expo.dev/build/internal-distribution/), [APKs](https://docs.expo.dev/build-reference/apk/), [simulator builds](https://docs.expo.dev/build-reference/simulators/), [EAS Update](https://docs.expo.dev/eas-update/getting-started/), [runtime versions](https://docs.expo.dev/eas-update/runtime-versions/), [EAS Hosting](https://docs.expo.dev/eas/hosting/get-started/), [Workflows syntax](https://docs.expo.dev/eas/workflows/syntax/), [pre-packaged jobs](https://docs.expo.dev/eas/workflows/pre-packaged-jobs/), [building from GitHub](https://docs.expo.dev/build/building-from-github/), [monorepos](https://docs.expo.dev/guides/monorepos/)
- Expo Router [modals and form sheets](https://docs.expo.dev/router/advanced/modals)
- Apple's TestFlight rules, Clerk's test logins and limits, and what Expo rewards: the sources in
  [expo-prize-plan.md](expo-prize-plan.md)
- Clerk [Expo quickstart](https://clerk.com/docs/expo/getting-started/quickstart)
- SurrealDB [Agent Memory hosted quickstart](https://surrealdb.com/docs/agent-memory/quickstarts/hosted)
