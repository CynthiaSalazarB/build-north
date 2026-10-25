# Devpost page: draft for Cynthia

The text for every field of our Devpost project page (#30, #53), in the order Devpost shows them, plus
one section for each sponsor prize we enter with its own evidence. Each field stays under 150 words so
it reads on the page without scrolling. Judges skim the standard headings, so we keep them.

Every number here comes from a file in this repo. A number we don't have yet is written as
`[number: Cynthia]`; a link we don't have yet as `[link: Cynthia]`. The research figures under
Inspiration come from the studies the README cites, not from our pilot. Paste each field as it is, or
edit freely: this is a draft.

Sources: the README, the [product thesis](../wiki/synthesis/product-thesis.md),
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

TypeScript monorepo with three npm workspaces; no server build step.

- **App:** Expo SDK 58 and Expo Router, one codebase for Android and the web. EAS Build makes the Android
  app, EAS Update ships fixes over the air, EAS Hosting serves the website, which installs as a web app
  on iPhones and laptops.
- **API:** Express 5 on Node 24, on Render. One route moves a session forward. SurrealDB Cloud holds
  sessions, levels and AI logs; SurrealDB Agent Memory holds the progress notes. Clerk signs learners in,
  checked without a network call.
- **Agents:** six Claude agents: a questioner, an evaluator, a whole-map evaluator, a fact desk, a hint
  giver and a coach, one structured call each. Zod schemas guard every boundary.

Numbers in code, words in the model: code computes every score, level and hint cost. Claude writes
the questions, judges the answers and words the hints.

## Responsible by design

The Anthropic key stays on our server, and every private API route requires a Clerk session token.
Learner text is fenced as data in every agent prompt. SurrealDB Agent Memory stores progress notes
written from code templates, never the learner's answers, and memory cannot change a score. Voice audio
goes to the device's speech service; only the transcript reaches Lumente.

"Your data" explains what we keep. "Delete my data" purges the learner's sessions, agent logs, levels
and memory notes, then signs them out. Our pilot uses adults who agreed to participate, and no tester
names or emails appear in the repository or submission.

## Challenges we ran into

- **"A server" is related to an API, but it isn't a kind of API.** The bigger group is now tested with
  one sentence, "An API is a kind of ___".
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
- Our first pilot is coming: computer science students who code with AI take a test, two practice
  sessions and a second test, and we compare each student's prediction with their score.
  `[the numbers, if the pilot ends before we submit: Cynthia]`
- A fix reaches every phone the day it merges, over the air, without a new build.
- Agent Memory has been on in production since the evening of Oct 23.
- Learners can resume every unfinished session with its whole conversation and reopen finished maps
  from "Your maps".
- Plain code computes every score, level and hint cost, so we can explain every number a learner sees.
- The AI never wrote a map.

## What we learned

- Open with the pain, not the method. At Expo's office hours we heard that "make people more curious"
  is too broad: nobody wakes up wanting it. People act on a moment they feel: the code works, and
  someone asks them to explain it.
- A learner reads the biggest number on screen as their grade. Confidence and knowledge need separate
  rows and plain words.
- Worked examples help beginners but slow experts, so ours is optional.
- Hiding the answer is not enough. AI tutors with guardrails stop the harm but don't beat studying alone.
  Structure, fading help and measurement are our bet, not proven yet: our pilot has no comparison group.
- Turn a feature on for real users before the freeze. Memory went on before the pilot, behind a kill
  switch, and sessions survive a reload because getting ready for testers demanded it.

## What's next for Lumente

The next layer is the student's own project. Check the AI comes next: judging whether your coding
agent's answer holds up, its assumption and the kind of claim it makes. It starts only when learners
improve on the second test.

Before that, on the same engine: concepts read straight from your repo; material from a trusted source
when you only type a topic; a fact desk that says where each fact came from; a concept compared across
two examples; a skill inside the coding agent as the doorway ("your agent just used an API; want to
practice it?"); Spanish.

Students use it free. Instructors, bootcamps and colleges pay for seats and a class view of what each
student has mastered, the evidence they seek today through oral exams. At Demo Day we ask for a pilot
with one CS program.

## Built with

Expo SDK 58, React Native, Expo Router, EAS Build, EAS Update, EAS Hosting, EAS Workflows, Expo Observe,
TypeScript, Node 24, Express 5, Render, SurrealDB Cloud, SurrealDB Agent Memory, Clerk, Claude
(Anthropic), Zod, React Native Reanimated, react-native-svg, expo-speech-recognition.

## Links

- Try it on the web: https://lumente.expo.app
- Android app: https://expo.dev/artifacts/eas/LVkBl_worJBs2ro5p6z9vFa1XtYyA992vF3QrkSzG_A.apk (build 3,
  the `preview` APK; every phone takes updates on the one `preview` channel)
- Code: https://github.com/CynthiaSalazarB/build-north
- Demo video: `[link: Cynthia]`
- Server health check: https://build-north-api.onrender.com/health

## Try it (testing notes)

Open https://lumente.expo.app in any browser, or install the Android app. Sign in with an email
code, or with Google on the web. To skip the email, use any address that ends in
`+clerk_test@example.com` and the code `424242`. Tap "API", then "Explore with guidance". Pick a
prediction, explain the idea in your own words, and answer the four questions. Tap the firefly once to
see what a hint costs. The result shows your prediction next to your score. "Your data" says what is
kept, and "Delete my data" removes it. The full guide is
https://github.com/CynthiaSalazarB/build-north/blob/main/docs/testing-notes.md.

## Media to upload

- Hero/result screen: `docs/readme/hero.jpg`
- Predict your score: `docs/readme/step-1-guess.jpg`
- Build the map: `docs/readme/step-2-map.jpg`
- Ask for help: `docs/readme/step-3-hint.jpg`
- Compare prediction with score: `docs/readme/step-4-score.jpg`

These are the app's real demo-mode screens. Demo mode replays a session recorded live with Claude.

## Team

| Name | Role |
|---|---|
| Cynthia Salazar | Team lead: the product, the design and the AI agents |
| Leo Atienza | The server, hosting, Expo builds, sign-in and the memory layer |
| Jhonatan Lopez | The app |
| Kyle Argallon | The pilot, the pitch and the video |

## Categories

Best Overall, Best Use of Expo, Best Use of Clerk, Best Use of SurrealDB Agent Memory.

## Disclosures

- We started from Expo's default `create-expo-app` template (SDK 58) and replaced its screens, icons and
  splash screen.
- Fonts: Newsreader, and Atkinson Hyperlegible Next and Mono, under the SIL Open Font License.
- The images in our design boards are CC0, public domain or from Unsplash.
- Voice input uses `expo-speech-recognition`, a community module. The audio goes to the device's own
  speech service; only the words reach us.
- AI tools: Lumente's AI runs on Claude (Anthropic), and we built it with Claude Code.
- Apart from the template, fonts and images above, nothing was built before Build Week.

## Sponsor prize: Best Use of Expo

One TypeScript codebase runs on Android and the web; the web app installs on iPhones and laptops. With
no Apple account, we shipped iPhones the installable web app.

- **EAS Build:** three Android builds on SDK 58 the week it came out: an initial development build, a
  preview APK, and build 3 after the icon and voice module changed the native fingerprint.
- **EAS Update** with the fingerprint policy: 22 updates over the air on the `preview` channel through
  Oct 25. A merged fix reaches every phone without a new build.
- **EAS Hosting and Workflows:** the website, deployed from `main`.
- **Expo Observe:** launch times and crashes on the Android app.
- **From the SDK:** Expo Router, expo-updates, expo-secure-store, expo-haptics, expo-font,
  expo-splash-screen, expo-file-system, Reanimated, react-native-svg, and expo-speech-recognition, a
  community module.

Every build, update and deploy is in the
[Expo log](https://github.com/CynthiaSalazarB/build-north/blob/main/docs/expo-log.md), with the bugs
and their fixes.

## Sponsor prize: Best Use of Clerk

Clerk handles identity and sessions instead of an authentication system we built ourselves. Learners
sign in with a one-time email code or Google. The website uses Clerk's prebuilt sign-in and sign-up
components in Lumente's design; Android opens Clerk's hosted flow in an in-app browser.

Every app request carries a Clerk session token. Our API verifies its signature locally with Clerk's
public key, so a learning turn does not wait on another network call. Sessions, levels and progress
notes are keyed by the Clerk user id; we store no name or email. On Android, Expo SecureStore protects
the token. "Delete my data" removes that learner's Lumente data and signs them out.

Judges can use any address ending in `+clerk_test@example.com` and code `424242`, with no inbox. The
[implementation notes](https://github.com/CynthiaSalazarB/build-north/blob/main/docs/clerk.md) link
every claim to its code and tests.

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

Memory never changes a score. Delete my data purges it. Pointers are on the
[prize page](https://github.com/CynthiaSalazarB/build-north/blob/main/wiki/context/surrealdb-sponsor-prize.md).
