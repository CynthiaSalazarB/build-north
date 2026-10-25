# Lumente

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

Lumente is a TypeScript monorepo with three parts: the Expo app, an Express API and a guided-thinking
engine.

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
them out.

## Challenges we ran into

- **A blank first screen looked like a broken link.** Local WebKit cold starts waited roughly 12
  seconds for seven custom fonts before showing the interface. On the web, we now render readable
  fallback text first and load the brand fonts after the first frame with `FontDisplay.SWAP`. Android
  keeps its native font-loading gate.
- **Static web authentication broke multi-step sign-in.** Clerk's form moved to nested paths that a
  static export could not serve on reload, and hosted sign-up could leave learners in Clerk's account
  portal. We added app-owned sign-in and sign-up pages with hash routing and explicit return paths;
  Android keeps Clerk's hosted flow.
- **Multiple agents made latency a workflow problem.** Some transitions waited for one agent and then
  another; evaluation followed by final coaching took 9.2 seconds. We now prepare the next question in
  parallel with evaluation and show the code-computed result before requesting the coach.
- **Agent Memory rejected parallel writes on one concept record.** We changed its progress-fact writes
  to run sequentially and off the request path. A slow or failed memory operation never blocks the
  learning session.

## Accomplishments that we're proud of

- We shipped a working product on Android and the web from one Expo codebase. A learner can complete
  the full experience, leave, return to the conversation and reopen finished maps.
- Six specialized agents work inside one predictable flow while plain code owns every score and
  guidance-stage change. Flexible answers can be accepted without giving the model control of the
  rules.

## What we learned

- Performance, confidence and independence are different signals. The map score measures what someone
  explained in one session, the prediction gap compares that with their confidence, and the guidance
  stages track how independently they work across concepts.
- Designing the agents meant designing a handoff of responsibility, not a chatbot. Each agent needed
  one role in a flow that moves the learner from explaining, to answering guided questions, to forming
  their own questions.
- In a thinking tool, reliability affects the thinking itself. Losing a session on reload or waiting
  on non-essential coaching interrupts the work, so recovery and progressive results became part of
  the experience.

## What's next for Lumente

Critical thinking is the larger goal, and concepts are the first anchor. Next, **Check the AI** will
help learners practice judgment: examine whether an agent's answer holds up, uncover its assumptions,
identify what kind of claim it makes and notice possible bias. Later phases will apply shared skills
such as questioning, explaining and noticing uncertainty to perspectives and decisions.

The nearest product steps strengthen the concepts experience: show where each fact came from, connect
to a learner's repository to suggest concepts from their code, compare one concept across examples and
add Spanish. We begin with programming students and expand to other groups through the thinking skills
they need, rather than turning Lumente into a collection of unrelated courses.

The business model should match the cost of AI without turning learning into a meter. Learners can try
a small number of complete concept sessions free, then buy packs of additional sessions. Instructors,
bootcamps and colleges can fund access per active learner for a term, with a shared session allowance
and a class view of what students could explain, where they needed guidance and where their confidence
differed from what they could demonstrate. Exact prices will be set after we know how often people use
Lumente and what learners and schools find valuable.

## Built with

Expo SDK 58, React Native, Expo Router, EAS Build, EAS Update, EAS Hosting, EAS Workflows, Expo Observe,
TypeScript, Node 24, Express 5, Render, SurrealDB Cloud, SurrealDB Agent Memory, Clerk, Claude
(Anthropic), Zod, React Native Reanimated, react-native-svg, expo-speech-recognition.

## Links

- Try it on the web: https://lumente.expo.app
- Android app: https://expo.dev/artifacts/eas/LVkBl_worJBs2ro5p6z9vFa1XtYyA992vF3QrkSzG_A.apk
- Quick test: Sign in with Google on the web or use any address ending in
  `+clerk_test@example.com` with code `424242`. Choose "API", then "Explore with guidance".
- Code: https://github.com/CynthiaSalazarB/lumente
- Demo video: `[link: Cynthia]`

## Disclosures

- We started from Expo's default `create-expo-app` template (SDK 58) and replaced its screens, icons and
  splash screen.
- Fonts: Newsreader, and Atkinson Hyperlegible Next and Mono, under the SIL Open Font License.
- The images in our design boards are CC0, public domain or from Unsplash.
- Voice input uses `expo-speech-recognition`, a community module. The device or browser's speech
  provider processes the audio; only the editable transcript reaches Lumente.
- AI tools: Lumente's AI runs on Claude (Anthropic), and we built it with Claude Code.
- Apart from the template, fonts and images above, nothing was built before Build Week.

## Sponsor prize: Best Use of Expo

One Expo codebase runs on Android and the web, and iPhone users can install the progressive web app
full screen with its own icon. During Build Week we prioritized Android and web because native iOS
distribution requires an Apple Developer account, signing, device testing and TestFlight review.
Because Expo is cross-platform, a native iOS build is a next distribution step, not a rewrite.

- **EAS Build:** three Android builds on SDK 58 the week it came out: an initial development build, a
  preview APK, and build 3 after the icon and voice module changed the native fingerprint.
- **EAS Update** with the fingerprint policy: 23 updates over the air on the `preview` channel through
  Oct 25. A merged fix reaches every phone without a new build.
- **EAS Hosting and Workflows:** the website, deployed from `main`.

## Sponsor prize: Best Use of Clerk

Clerk handles identity and sessions instead of an authentication system we built ourselves. Learners
sign in with a one-time email code or Google. The website uses Clerk's prebuilt sign-in and sign-up
components in Lumente's design; Android opens Clerk's hosted flow in an in-app browser.

Every app request carries a Clerk session token. Our API verifies its signature locally with Clerk's
public key, so a learning turn does not wait on another network call. Sessions, guidance stages and
progress notes are keyed by the Clerk user id; we store no name or email. On Android, Expo SecureStore
protects the token. "Delete my data" removes that learner's Lumente data and signs them out.

## Sponsor prize: Best Use of SurrealDB Agent Memory

Agent Memory has been live in production since Oct 23. After each finished session, our server writes
progress notes: the learner's guidance stage on each area when they practiced that concept, the
prediction next to the score, and the Helps an area took. The stages track independence across
concepts, not mastery of the concept named in the note. Code writes each note from a template. The
learner's words never go in.

- **Facts that replace old facts, history kept.** A new guidance-stage note supersedes the old one, and the Memory
  sheet shows the chain of guidance stages over time.
- **Agent messages cite the remembered facts they use.** The hint giver and the coach read up to eight
  notes and cite the ones they use; the server keeps only ids it passed in. The learner sees "From what
  Lumente remembers:" under the message.
- **Memory shared across agents.** Three agents' work goes in; two read it.

Memory never changes a score. Delete my data purges it.
