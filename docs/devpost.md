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

Build with AI. Explain the concepts yourself.

## Inspiration

AI coding agents can produce working code faster than students can understand the ideas underneath it.
The code runs, so it feels understood. Then a professor, teammate or interviewer asks, "Why does this
work?" and the answer disappears.

Psychologists call this the illusion of explanatory depth: we think we understand something until we
try to explain it. AI can make that gap larger. In
[Anthropic's study](https://www.anthropic.com/research/AI-assistance-coding-skills), developers learning
with AI scored 50% on a concepts quiz, compared with 67% for those who coded by hand.
[Aalto University](https://www.aalto.fi/en/news/ai-use-makes-us-overestimate-our-cognitive-performance)
found that people using ChatGPT overestimated their performance by about four points.

Lumente starts with programming students because they face this moment constantly. It helps them
explain the concepts behind their own projects. But concepts are the anchor, not the final goal. The
skill underneath is questioning: noticing what you do not understand, asking what you need to know and
building the answer yourself. We see that as a foundational habit of critical thinking.

## What it does

A learner chooses a concept from their project, such as API or CORS, and predicts their score before
seeing a question. The prediction is not a grade. It captures their confidence at the start.

They then build a **conceptual mentefact**, a specialized visual map from Conceptual Pedagogy. It places
one concept in four areas: the bigger group it belongs to, what it is often confused with, what must be
true for it to count as one, and the types that exist. The firefly asks questions and checks each
answer, while the learner builds the map in their own words. Help is always available. The score shows
how much the learner could explain independently and how much they built with guidance, which fades as
they become more independent.

At the end, Lumente shows the predicted score beside the score they proved. That gap makes confidence
visible: how well what they felt they knew matches what they could actually explain.

The guidance stages track independence in the four map areas across concepts; they are not scores for
API, CORS or another individual concept. Once guidance has faded across all four areas, the roles flip.
The learner builds the whole map, decides what they need to know and asks a fact desk for facts. That is
where Lumente moves from helping with one concept to practicing how to unravel the next one.

## How we built it

Lumente is a TypeScript monorepo with three parts: the Expo app, an Express API and a learning engine.

- **One app, two platforms:** Expo SDK 58 and Expo Router power the Android and responsive web apps.
  EAS Build creates the APK, EAS Update sends fixes to installed phones and EAS Hosting serves
  `lumente.expo.app`, which can also be installed as a web app.
- **A controlled agent flow:** a deterministic state machine decides what happens next. It calls six
  Claude agents, each with one job: ask a question, evaluate one answer, evaluate the whole map, answer
  facts, offer guidance or coach the result. Zod validates every structured input and output.
- **Numbers in code, words in the model:** Claude writes questions, evaluates the meaning of answers and
  words the feedback. Plain code applies the rubric and computes every score, guidance stage and how
  guidance affects the score, so the model does not control the scoring rules or progression.
- **Backend and memory:** Express 5 runs on Node 24 and Render. SurrealDB Cloud stores sessions, complete
  conversation transcripts, guidance stages and agent logs. SurrealDB Agent Memory holds small progress
  facts that the guidance and coaching agents can cite. Clerk handles sign-in.

Each answer and step is saved as it happens. If a request is repeated or the learner closes the app,
they can continue without duplicating a step or losing their conversation.

## Responsible by design

Because Lumente measures learning, we separated what the model can judge from what it can control. Claude
evaluates an answer against a rubric, but plain code assigns the points and advances the guidance. Any
defensible answer can pass; the learner does not have to match one expected phrase. The AI asks, checks
and responds, but the learner writes the map.

The Anthropic key stays on the server, every private route requires a Clerk session token and the API
verifies that token locally. Our database uses the Clerk user ID and stores no name or email. Learner
text is fenced as untrusted data inside every agent prompt.

Agent Memory never receives the learner's answers. It stores only progress facts written from code
templates under a salted pseudonym, and it cannot change a score or guidance stage. Agents may cite only
facts the server gave them. If memory is unavailable or takes more than 1.5 seconds, the session continues
without it.

Lumente never receives a voice recording: the device or browser's speech provider processes it, and only
the editable transcript reaches us when the learner submits it. "Your data" explains what we keep, and
"Delete my data" purges the learner's memory, sessions, agent logs and guidance stages before signing
them out. Our pilot uses consenting adults, and no tester names or emails appear in the repository or
submission.

## Challenges we ran into

- **Related is not the same as belonging.** The evaluator initially treated "a server" as a possible
  bigger group for API. We made the rule explainable with one sentence: "An API is a kind of ___".
  "Software interface" passes; "server" does not.
- **The interface was inviting the wrong action.** In independent practice, learners typed map answers
  into the fact chat because it looked like the main task. We made the map the primary action, collapsed
  the chat behind "Ask a fact (optional)" and added a review step before submission.
- **The fact desk had to help without taking over.** It answers factual questions, but a question that
  asks it to fill part of the map gets a fixed redirect. If the learner types an answer into the chat,
  it points them back to the map without judging the answer.
- **The confidence gap looked like a grade.** A large signed number made "−2" feel like losing points,
  even though a gap of zero means accurate confidence. The result now names the direction in words and
  shows two separate rows: prediction and map score.
- **The final answer was making learners wait.** Evaluating the last answer and then generating coaching
  took 9.2 seconds. We now return the code-computed result first and request the coach in the next turn.
  We also prepare the next question while the current answer is being evaluated.
- **Agent Memory rejected parallel writes on one concept record.** We changed its progress-fact writes
  to run sequentially and off the request path. A slow or failed memory operation never blocks the
  learning session.

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
- Plain code computes every score, guidance stage and hint scoring effect, so we can explain every number a learner sees.
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
- The concept map gives students a concrete way to unravel an idea while they practice forming their
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
see how a hint affects the score. The result shows your prediction next to your score. "Your data" says what is
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
public key, so a learning turn does not wait on another network call. Sessions, guidance stages and
progress notes are keyed by the Clerk user id; we store no name or email. On Android, Expo SecureStore
protects the token. "Delete my data" removes that learner's Lumente data and signs them out.

Judges can use any address ending in `+clerk_test@example.com` and code `424242`, with no inbox. The
[implementation notes](https://github.com/CynthiaSalazarB/build-north/blob/main/docs/clerk.md) link
every claim to its code and tests.

## Sponsor prize: Best Use of SurrealDB Agent Memory

After each finished session, our server writes progress notes to SurrealDB Agent Memory: the learner's
guidance stage on each area when they practiced that concept, the prediction next to the score, and the
Helps an area took. The stages track independence across concepts, not mastery of the concept named in
the note. Code writes each note from a template. The learner's words never go in.

- **Facts that replace old facts, history kept.** A new guidance-stage note supersedes the old one, and the Memory
  sheet shows the chain of guidance stages over time.
- **Answers traced to their source.** The hint giver and the coach read up to eight notes and cite the
  ones they use; the server keeps only ids it passed in. The learner sees "From what Lumente remembers:"
  under the message.
- **Memory shared across agents.** Three agents' work goes in; two read it.

Memory never changes a score. Delete my data purges it. Pointers are on the
[prize page](https://github.com/CynthiaSalazarB/build-north/blob/main/wiki/context/surrealdb-sponsor-prize.md).
