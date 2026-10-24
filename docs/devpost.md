# Devpost page: draft for Cynthia

The text for every field of our Devpost project page (#30, #53), in the order Devpost shows them, plus
one section for each sponsor prize we enter with its own evidence. Each field stays under 150 words so
it reads on the page without scrolling. Judges skim the standard headings, so we keep them.

Every number here comes from a file in this repo. A number we don't have yet is written as
`[number: Cynthia]`; a link we don't have yet as `[link: Cynthia]`. The research figures under
Inspiration come from the studies the README cites, not from our pilot. Paste each field as it is, or
edit freely: this is a draft.

Sources: the README (`main` and PR #106), the [product thesis](../wiki/synthesis/product-thesis.md),
the [plan to win](../wiki/synthesis/plan-to-win.md), the [Expo prize plan](../wiki/synthesis/expo-prize-plan.md),
the [SurrealDB prize page](../wiki/context/surrealdb-sponsor-prize.md), [`DECISIONS.md`](../DECISIONS.md),
[`docs/expo-log.md`](expo-log.md), [`docs/clerk.md`](clerk.md) and the app's own screens.

## Project name

Lumente

## Tagline

Build with AI. Understand the concepts yourself.

## Inspiration

Coding agents write working code faster than students can understand it. The gap shows when someone
asks them to explain it: in a code review, a project defense or a job interview. The code works, so it
feels understood. One of us lives this problem, and the comments on a reel about it were full of people
describing their own routine: explain the concept to the AI and let it correct you.

Two studies shaped the design. At Anthropic, developers who learned a new tool with an AI assistant
scored 50% on a quiz about it, against 67% for those who coded by hand. At Aalto University, people who
solved problems with ChatGPT guessed their own score about 4 points too high. The confidence came with
the AI; the learner didn't earn it. So Lumente asks for a prediction before anything else, and it never
writes the answer.

## What it does

Lumente is for computer science students who build with Claude Code, Cursor or Copilot and can't explain
the ideas behind the code.

1. Pick a concept from your project, like API, JWT or CORS. "Ask your AI what to map" asks your coding
   agent for the list.
2. Predict your score, 0 to 8, before any question.
3. Build the concept's map in four areas: Bigger group, What it isn't, What it needs, Its types. A
   firefly asks and checks your answers. It never writes the map. Tap it for Help; the first Help on an
   area caps it at 1 point.
4. See your map score next to your prediction, and the gap in words.

As you get areas right with little help, the help fades. At level 5 the roles flip: you build the whole
map and ask a fact desk for facts only. Lumente remembers your levels.

## How we built it

One TypeScript repo with three npm workspaces; no build step on the server.

- **App:** Expo SDK 58 and Expo Router, one codebase for Android and the web. EAS Build makes the Android
  app, EAS Update ships fixes over the air, EAS Hosting serves the website, which installs as a web app
  on iPhones and laptops.
- **API:** Express 5 on Node 24, on Render. One route moves a session forward. SurrealDB Cloud holds
  sessions, levels and AI logs; SurrealDB Agent Memory holds the progress notes. Clerk signs learners in,
  checked without a network call.
- **Agents:** six Claude agents: a questioner, an evaluator, a whole-map evaluator, a fact desk, a hint
  giver and a coach, one structured call each. Zod schemas guard every boundary.

Numbers in code, words in the model: plain code computes every score, level and hint cost. Claude writes
the questions, judges the answers and words the hints.

## Challenges we ran into

- **"A server" is related to an API, but it isn't a kind of API.** Learners offered things that were
  close instead of the group a concept belongs to. The bigger group is now tested with one sentence,
  "An API is a kind of ___".
- **A fact desk that gives nothing away.** At level 5 the learner asks the questions. One that fishes
  for the structure gets one fixed line, chosen by code: "That part is yours to decide." An answer typed
  into the chat gets its own line; the chat never grades it.
- **The gap read as a grade.** Shown as a signed number, "−2" read as losing points, when 0 is the best
  calibration there is. The result now leads with the gap in words, over two rows of eight points.
- **Agent Memory refused parallel writes on one entity.** The notes now go one after another, off the
  request path.

## Accomplishments that we're proud of

- Lumente is live on the web and on Android, built, updated and hosted with EAS. The website installs
  as an app from the browser.
- On the evening of Oct 23, five computer science students who code with AI took a test, two practice
  sessions and a second test, on concepts they had not practiced in the app. Their first test averaged
  `[number: Cynthia]` of 8 and their second `[number: Cynthia]`. Their predictions missed their scores by
  `[number: Cynthia]` points on average, and `[number: Cynthia]` of them would open Lumente before an
  exam, a project defense or an interview.
- Fixes merged on the day of the pilot reached the testers' phones before their slots, over the air.
- Agent Memory has been on in production since the evening of Oct 23.
- Plain code computes every score, level and hint cost, so we can explain every number a learner sees.
- The AI never wrote a map.

## What we learned

- Open with the pain, not the method. At Expo's office hours we heard that "make people more curious"
  is too broad: nobody wakes up wanting it. People act on a moment they feel: the code works, and
  someone asks them to explain it.
- A learner reads the biggest number on screen as their grade. Confidence and knowledge need separate
  rows and plain words.
- Worked examples help beginners and slow down people who know the topic, so ours sits behind a "See an
  example" button.
- Hiding the answer is not enough. AI tutors with guardrails stop the harm but don't beat studying alone.
  Structure, fading help and measurement are our bet, not proven yet: our pilot has no comparison group.
- Turn a feature on for real users before the freeze. Memory went on for the testers behind a kill
  switch, and sessions survive a reload because tester day demanded it.

## What's next for Lumente

The next layer is the student's own project. Check the AI comes next: judging whether your coding
agent's answer holds up, its assumption and the kind of claim it makes. It starts only when learners
improve on the second test.

Before that, on the same engine: concepts read straight from your repo; material from a trusted source
when you only type a topic; a fact desk that says where each fact came from; a concept compared across
two examples; "Your maps", every map you built, by concept; a skill inside the coding agent as the
doorway ("your agent just used an API; want to practice it?"); Spanish.

Students use it free. Instructors, bootcamps and colleges pay for seats and a class view of what each
student has mastered, the evidence they seek today through oral exams. At Demo Day we ask for a pilot
with one CS program.

## Built with

Expo SDK 58, React Native, Expo Router, EAS Build, EAS Update, EAS Hosting, EAS Workflows, Expo Observe,
TypeScript, Node 24, Express 5, Render, SurrealDB Cloud, SurrealDB Agent Memory, Clerk, Claude
(Anthropic), Zod, React Native Reanimated, react-native-svg, expo-speech-recognition.

## Links

- Try it on the web: https://lumente.expo.app
- Android app: `[link: Cynthia]` (the install page of the build we freeze on Oct 24; today it is build 3,
  linked from the [Expo log](expo-log.md))
- Code: https://github.com/CynthiaSalazarB/build-north
- Demo video: `[link: Cynthia]`
- Server health check: https://build-north-api.onrender.com/health

## Try it (testing notes)

Open https://lumente.expo.app in any browser, or install the Android app. Sign in with an email
code, or with Google on the web. To skip the email, use any address that ends in
`+clerk_test@example.com` and the code `424242`. Tap "API", then "Explore with guidance". Pick a
prediction, explain the idea in your own words, and answer the four questions. Tap the firefly once to
see what a hint costs. The result shows your prediction next to your score. "Your data" says what is
kept, and "Delete my data" removes it. The full guide is `docs/testing-notes.md`, which arrives with the README in PR #106 (not on `main` yet, so no link here).

## Team

| Name | Role |
|---|---|
| Cynthia Salazar | Team lead: the product, the design and the AI agents |
| Leo Atienza | The server, hosting, Expo builds, sign-in and the memory layer |
| Jonathan `[last name: Cynthia]` | The app |
| Kyle `[last name: Cynthia]` | The pilot, the pitch and the video |

## Categories

Best Overall, Best Use of Expo, Best Use of Clerk, Best Use of SurrealDB Agent Memory.

## Disclosures

- We started from Expo's default `create-expo-app` template (SDK 58) and replaced its screens, icons and
  splash screen.
- Fonts: Newsreader, and Atkinson Hyperlegible Next and Mono, under the SIL Open Font License.
- The images in our design boards are CC0, public domain or from Unsplash.
- Voice input uses `expo-speech-recognition`, a community module. The audio goes to the device's own
  speech service; only the words reach us.
- AI tools: Lumente's AI runs on Claude (Anthropic), and we built it with Claude Code. `[confirm: Cynthia]`
- Nothing was built before Build Week. `[confirm: Cynthia]`

## Sponsor prize: Best Use of Expo

One TypeScript codebase runs on Android and the web, and the website installs as an app on iPhones and
laptops. We had no Apple account this week, so iPhones get the web app: a decision with a reason.

- **EAS Build:** `[number: Cynthia]` Android builds, on SDK 58 the week it came out, as development
  builds because Expo Go could not run it yet.
- **EAS Update** with the fingerprint policy: `[number: Cynthia]` updates over the air. Fixes merged on
  the day of the pilot reached the testers' phones before their slots. The app says "A new version is
  ready" and offers Restart.
- **EAS Hosting and Workflows:** the website, deployed from `main`.
- **Expo Observe:** launch times and crashes on the Android app.
- **From the SDK:** Expo Router, expo-updates, expo-secure-store, expo-haptics, expo-font,
  expo-splash-screen, expo-file-system, Reanimated, react-native-svg, and expo-speech-recognition, a
  community module.

Every build, update and deploy is in [`docs/expo-log.md`](expo-log.md), with the bugs and their fixes.

## Sponsor prize: Best Use of SurrealDB Agent Memory

After each finished session, our server writes progress notes to SurrealDB Agent Memory: the learner's
level on each area, the prediction next to the score, the Helps an area took. Code writes each note from
a template. The learner's words never go in.

- **Facts that replace old facts, history kept.** A new level supersedes the old note, and the Memory
  sheet shows the chain: "level 3 since Oct 23" above "level 2 from Oct 22 to Oct 23".
- **Answers traced to their source.** The hint giver and the coach read up to eight notes and cite the
  ones they use; the server keeps only ids it passed in. The learner sees "From what Lumente remembers:"
  under the message.
- **Memory shared across agents.** Three agents' work goes in; two read it.

Memory never changes a score. Delete my data purges it. Code pointers are on the
[prize page](../wiki/context/surrealdb-sponsor-prize.md).
