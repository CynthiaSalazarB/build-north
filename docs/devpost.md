# Devpost page: draft for Cynthia

The text for every field of our Devpost project page (#30, #53), in the order Devpost shows them, plus
one section for each sponsor prize we enter with its own evidence. Build North publishes no word limit
for these fields. The opening stays concise enough to skim, but explaining the problem, the method and
the value matters more than an arbitrary count. Judges skim the standard headings, so we keep them.

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

AI coding agents can produce working code faster than a student can understand the ideas underneath it.
The code runs, so it feels understood. Then a professor, teammate or interviewer asks, "Why does this
work?" and the answer disappears.

Lumente starts with programming students who build class and side projects with Claude Code, Cursor or
Copilot. They meet this gap in code reviews, project defenses and interviews. One of us lives it. In the
comments on a reel about the problem, people described routines they had invented for themselves:
explain the concept to the AI, ask it to challenge the explanation, and find the gaps before someone
else does.

The research shows the same pattern. At
[Anthropic](https://www.anthropic.com/research/AI-assistance-coding-skills), developers learning a new
tool with AI scored 50% on a concepts quiz, compared with 67% for those who coded by hand. In
[Aalto University's reasoning studies](https://www.aalto.fi/en/news/ai-use-makes-us-overestimate-our-cognitive-performance),
people using ChatGPT overestimated their score by about four points. AI can lend confidence before the
learner has earned it.

## What it does

Lumente turns a concept from an AI-built project into something the student can explain in their own
words.

1. Pick a concept your project uses, such as API, JWT or CORS. "Ask your AI what to map" gives your
   coding agent a prompt that finds the concepts in your own code.
2. Predict your score from 0 to 8 before seeing a question. This puts your confidence on record.
3. Build a **conceptual mentefact**, a specialized visual map from Conceptual Pedagogy. It places one
   concept in four areas: the bigger group it belongs to, what it is often confused with, what must be
   true for it to count as one, and the types that exist.
4. The firefly asks questions and checks each answer. You write the map. Help is available, but it costs
   points and fades as you improve.
5. See the score you proved beside the one you predicted. Lumente puts the gap into words: "You felt two
   points surer than you could explain."

A concept is the practice material. Questioning is the skill. By level 5, the roles flip: you build the
whole map, decide what you need to know and ask a fact desk for facts. The immediate value is being able
to explain the API or CORS rule in your project. The longer-term value is learning how to investigate
the next unfamiliar idea without handing the thinking back to AI.

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
- The concept map gives students something concrete to investigate while they practice forming their
  own questions. The questioning habit is the larger goal.
- Turn a feature on for real users before the freeze. Memory went on before the pilot, behind a kill
  switch, and sessions survive a reload because getting ready for testers demanded it.

## What's next for Lumente

First, we need evidence that the concepts loop improves what students can explain. Our first pilot uses
a test, two practice sessions and a second test on concepts the student did not practice in Lumente. It
gives us a first signal. Without a comparison group, it cannot prove the effect yet.

The next skill is **Check the AI**: judging whether a coding agent's answer holds up, which assumptions
it made and what kind of claim it is making. That phase starts only after students improve on the
second test.

Lumente begins with programming students because they face this problem often and at a real cost. The
same questioning loop can later work in other subjects, but we will widen the audience one group at a
time and only when the evidence supports it. Nearer steps include reading concepts from a repository,
using trusted sources, comparing a concept across examples, showing where the fact desk got each fact,
and Spanish.

Students use Lumente free. Instructors, bootcamps and colleges pay for seats and a class view of what
each student has mastered, the evidence they now try to get through oral exams. At Demo Day, we are
looking for one CS program to run the next pilot with us.

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
- **EAS Update** with the fingerprint policy: 23 updates over the air on the `preview` channel through
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
