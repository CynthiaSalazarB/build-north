# Agent contracts · v0.1

Locked at the Oct 19 kickoff ([section 6](#6-kickoff-decisions-oct-19) lists what was decided). This
file is the reference; the Zod schemas in `agents/` follow it. A change goes through a pull request
and, if it has a real trade-off, a line in `DECISIONS.md`.

Three layers, three pairs of people:

| Layer | Between | Section |
|---|---|---|
| App ↔ API | Jonathan + Leo | [1. API and the `Turn`](#1-api-and-the-turn) |
| API ↔ agents | Leo + Cynthia | [2. Agents](#2-agents) |
| What's stored | Leo | [3. State in SurrealDB](#3-state-in-surrealdb) |

**The rule behind the split: numbers in code, words in the model.** Code picks the level, the hint
step, the points, the calibration gap and the mastery update, so the numbers on the slide are
deterministic and explainable. Claude writes the questions, judges the answers and words the hints.

---

## 0. Shared vocabulary

```ts
type MoveId = "supraordinate" | "exclusion" | "isoordinate" | "infraordinate";
//             bigger group      what it isn't  what it needs   its types

type Level = 1 | 2 | 3 | 4 | 5;   // watch, guided, complete, named only, alone (the learner asks the fact desk)
type HintStep = "nudge" | "hint" | "partial" | "reveal";
type Verdict = "correct" | "partial" | "incorrect";

type Item = { value: string; note: string | null };   // note = the difference, for exclusions

type Mentefacto = {
  concept: string;
  supraordinate: Item | null;
  exclusion: Item[];       // { value: "dictatorship", note: "who holds the power" }
  isoordinate: Item[];
  infraordinate: Item[];
};
```

Moves run in this order in a session: supraordinate, exclusion, isoordinate, infraordinate (the
order of the democracy example in the brief).

Code and JSON use the ids above. The screen shows plain labels, and the method's name appears only
after the learner finds the move ("That's called the supraordinate class"):

```ts
const MOVE_LABEL: Record<MoveId, string> = {
  supraordinate: "Bigger group",
  exclusion: "What it isn't",
  isoordinate: "What it needs",
  infraordinate: "Its types",
};
```

---

## 1. API and the `Turn`

Every call needs the Clerk token as `Authorization: Bearer <token>`. Until Clerk lands (Oct 21) the
API accepts an `x-dev-user: <name>` header instead; the API rejects that header when
`NODE_ENV=production`.

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/sessions` | `{ concept, material?, mode? }` | `Turn` (asks for the prediction) |
| `POST` | `/sessions/:id/turns` | one of `{ prediction }`, `{ text }`, `{ question }`, `{ mentefacto }`, `{ action: "help" }`, `{ action: "continue" }` | `Turn` |
| `GET` | `/sessions/:id` | | latest `Turn` (resume after the app reloads) |
| `GET` | `/me/mastery` | | `Mastery` |
| `DELETE` | `/me/data` | | `204`, deletes sessions, logs and mastery (the delete button) |
| `GET` | `/health` | | `{ ok: true }` |

One endpoint moves a session forward: `/turns`. The app sends the body the last `Turn`'s `expects`
asks for: `prediction` → `{ prediction }`, `text` → `{ text }`, `continue` → `{ action: "continue" }`,
`map` → `{ question }` while the learner asks and `{ mentefacto }` to submit. `{ action: "help" }`
can be sent at any point.

Every `/turns` body also carries `turn`: the number of the `Turn` it answers. If that number is
older than the session's latest, the API returns the latest `Turn` as it is and doesn't call
`advance` again, so an answer resent after a timeout is judged once. The app disables Send while a
call is pending.

`prediction` is a whole number from 0 to 8. Before it, the app explains the task in one line and
asks on the same scale as the score: "You'll build the map of democracy in 4 parts, 2 points each.
How many of the 8 points do you think you'll get?"

`material` is text the learner pastes (notes, a passage); no files, photos or links in this version. Over 8,000 characters the API answers `413` with a message
asking for a shorter excerpt; it never trims silently.

`mode` is `"learn"` (default) or `"test"`. A test session runs every move at level 5 and never
changes mastery. The testers' pre-test and post-test use it, so a new learner can be measured
before the ladder starts.

### `Turn`: the one object the app renders

```ts
type Turn = {
  sessionId: string;
  turn: number;   // goes up by 1 with each Turn; the app sends it back with its next action
  phase: "predict" | "attempt" | "example" | "move" | "result";
  move: MoveId | null;
  level: Level | null;
  messages: {
    agent: "questioner" | "evaluator" | "hint_giver" | "example_builder" | "coach" | "fact_desk" | "app";
    kind: "question" | "feedback" | "hint" | "example" | "named_move" | "summary" | "fact" | "redirect";
    text: string;
    hintStep?: HintStep;
  }[];
  expects: "prediction" | "text" | "continue" | "map" | "none";   // decides which input the screen shows
  // "map" = level 5: a chat box for the learner's questions + the editable map + a Submit button
  scaffold: { given: string[]; blanks: number } | null;     // level 3 only: the half-built part
  mentefacto: Mentefacto;                                   // what the learner has built so far
  example: Mentefacto | null;   // phase "example" only: the worked example's map (planet) as it fills in
  progress: { movesDone: number; movesTotal: number; hintsUsed: number };
  result: Result | null;                                    // only when phase = "result"
  error: { code: "agent_failed" | "rate_limited"; retryable: boolean } | null;
};
```

Example, session 1, the learner just answered "A law?" for the bigger group:

```json
{
  "sessionId": "ses_8f2k",
  "turn": 5,
  "phase": "move",
  "move": "supraordinate",
  "level": 2,
  "messages": [
    { "agent": "evaluator", "kind": "feedback",
      "text": "Not quite: a law is one rule, and democracy isn't a rule. So what kind of thing is it?" }
  ],
  "expects": "text",
  "scaffold": null,
  "mentefacto": { "concept": "democracy", "supraordinate": null, "exclusion": [], "isoordinate": [], "infraordinate": [] },
  "example": null,
  "progress": { "movesDone": 0, "movesTotal": 4, "hintsUsed": 0 },
  "result": null,
  "error": null
}
```

### `Result`: the end of a session

```json
{
  "predictedScore": 7,
  "score": 5,
  "maxScore": 8,
  "calibrationGap": 2,
  "hintsUsed": 2,
  "rubric": [
    { "move": "supraordinate", "points": 1 },
    { "move": "exclusion", "points": 2 },
    { "move": "isoordinate", "points": 1 },
    { "move": "infraordinate", "points": 1 }
  ],
  "masteryChanges": [
    { "move": "exclusion", "from": 2, "to": 3 },
    { "move": "infraordinate", "from": 2, "to": 3 }
  ],
  "questions": { "asked": 0, "testing": 0 },
  "coach": { "message": "You found the bigger group and a real exclusion. 'What it needs' is next.", "nextFocus": "isoordinate" }
}
```

`calibrationGap = predictedScore − score`, in points. Positive means overconfident (predicted 7, got 5: +2).

`questions` counts what the learner asked the fact desk (level 5 and the testers' pre-test and
post-test). `testing` is how many of those test the concept (compare, contrast, breaking case, what
it needs) instead of asking a plain fact. In session 1 both are 0: the app does the asking.

### `Mastery`

```json
{ "moves": [
  { "move": "supraordinate", "level": 3, "unassistedSuccesses": 0 },
  { "move": "exclusion", "level": 3, "unassistedSuccesses": 1 },
  { "move": "isoordinate", "level": 2, "unassistedSuccesses": 0 },
  { "move": "infraordinate", "level": 3, "unassistedSuccesses": 0 }
] }
```

---

## 2. Agents

Every prompt, and every line the app shows, is in English in this version.

Each agent is one `client.messages.parse()` call with `output_config.format: zodOutputFormat(schema)`,
so the output is valid JSON or the call fails. The API never shows the learner anything an agent
didn't return.

Every agent receives the same context, plus its own fields:

```ts
type AgentContext = {
  concept: string;
  material: string | null;
  move: MoveId;
  level: Level;
  mentefacto: Mentefacto;                          // built so far
  recent: { from: "app" | "learner"; text: string }[];   // this move's exchanges only
};
```

### Questioner: asks the plain question for the learner's level

In: `AgentContext`

```json
{ "question": "Democracy is one example of a bigger group. What group?",
  "scaffold": null }
```

At level 3, `scaffold` is filled (`{ "given": ["free elections", "rights"], "blanks": 1 }`). Levels
4 and 5 use fixed text from code ("Now find the exclusion.", "Build the mentefacto for inflation.
Ask me any facts you need."), no model call.

### Evaluator: judges one answer against the mentefacto rules

In: `AgentContext & { answer: string }`

```json
{
  "verdict": "incorrect",
  "quality": 0,
  "accepted": [],
  "issue": "not_a_class",
  "reason": "A law is a rule, not a class that contains monarchy and dictatorship.",
  "feedback": "Not quite: a law is one rule, and democracy isn't a rule. So what kind of thing is it?"
}
```

- `quality`: 0 to 2 for this move, before any hint penalty. Any defensible answer passes, not one
  right answer: for democracy, "form of government" and "political system" both do. 2 = defensible
  and the closest class; 1 = defensible but too broad or incomplete; 0 = not defensible.
- `accepted`: the `Item`s to write into the mentefacto (empty when not accepted).
- `issue`: `too_broad | not_a_class | same_level | is_a_subtype | is_a_characteristic | off_topic | none`.
  Code keeps it (`session.lastIssue`) for the learner's next Help; the hint giver uses it to aim the hint.
- `reason` is for logs and for us. `feedback` is shown, and must never contain the answer.
- When the answer isn't right, `feedback` says what is off. At levels 2 and 3 it ends with a nudge: a
  question that sends the learner back to their own answer, with no new information (free, the
  ladder's first step). At levels 4 and 5 it stops there. Pointing where to look is a hint, and hints
  only come from Help.

### Evaluator, whole map: scores a mentefacto built alone

Used at level 5 and for the testers' pre-test and post-test. Same grading rule as the evaluator: any
defensible answer passes. In: `{ concept, material, mentefacto }`

```json
{ "rubric": [
    { "move": "supraordinate", "quality": 1, "feedback": "'Money' is too broad. What's the closest group?" },
    { "move": "exclusion", "quality": 2, "feedback": "'One product getting more expensive' is an excellent exclusion." },
    { "move": "isoordinate", "quality": 2, "feedback": "..." },
    { "move": "infraordinate", "quality": 2, "feedback": "..." }
  ] }
```

### Fact desk: level 5 only, answers the learner's questions with facts, never the structure

In: `{ concept, material, mentefacto, question }`

```json
{ "kind": "fact",
  "answer": "Not by itself: that's one product. It counts as inflation when the overall price level goes up.",
  "questionType": "breaking_case" }
```

When the question asks for the structure ("what's the bigger group of inflation?"), it doesn't answer.
It hands the decision back without pointing at any part of the map, and reminds the learner that
Help exists and costs a point (a question that points somewhere would be a free hint):

```json
{ "kind": "redirect",
  "answer": "That part is yours to decide. If you're stuck, tap Help (it costs a point).",
  "questionType": "asks_for_structure" }
```

- `questionType`: `fact | compare | contrast | breaking_case | what_it_needs | asks_for_structure | other`.
  Everything except `fact`, `asks_for_structure` and `other` counts as `testing` in the result.
- Facts in one or two sentences, from the learner's material when it has the answer.
- Never names a part of the map or says which box something belongs in. A leak here gives the answer
  away, so this prompt gets the most test cases.

### Hint giver: words the hint step code chose

In: `AgentContext & { step: HintStep; lastAnswer: string; issue: string }`

```json
{ "step": "hint",
  "text": "Think of monarchy and dictatorship. What are all three examples of?",
  "revealed": null }
```

Called only when the learner taps Help. `revealed` is filled only at `reveal`: the `Item` that goes into
the mentefacto, with 0 points.

A hint can be a counterexample when the answer is incomplete: "North Korea holds elections. Is it a
democracy? What's missing?" That is the hint giver's job; Check yourself has no Challenger agent.

### Example builder: the level 1 worked example, thinking out loud (a fixture, no live call)

Not a Claude call in this version. The planet example is written once and ships as
`agents/fixtures/worked-example.json` (#15), the same for every learner: instant, free, and it can't
fail on demo day. The shape below is the fixture's shape.

```json
{ "exampleConcept": "planet",
  "steps": [
    { "move": "supraordinate", "thinkAloud": "A planet is a kind of celestial body. 'A thing' is too broad; the closest group is opaque celestial bodies.",
      "item": { "value": "opaque celestial body", "note": null } },
    { "move": "exclusion", "thinkAloud": "It looks like a star, but it isn't one: it has no light of its own.",
      "item": { "value": "star", "note": "has no light of its own" } }
  ] }
```

### Coach: the end-of-session message

In: `{ concept, mentefacto, result }` with every number already computed by code; `result` comes without
its `coach` field, since that's what the coach writes.

```json
{ "message": "You found the bigger group and a real exclusion. 'What it needs' is next.",
  "nextFocus": "isoordinate" }
```

The coach never computes or states a number it wasn't given. Naming a move after it's found
("That's called the supraordinate class. You found it.") is fixed text from code.

### Not in this version

Challenger and Steelman belong to Check the AI. In Check yourself, a counterexample is a hint (see
Hint giver).

---

## 3. Orchestrator rules (code, in `agents/`)

| When | Rule |
|---|---|
| Session start | predict (0 to 8 points, after one line explaining the task) → short attempt ("in your own words") → worked example if any move is at level 1 → the four moves → result |
| Level for a move | read from mastery; new learners start at 1. Watching the worked example moves every move to level 2 |
| After an answer | evaluator. `correct` → accept, name the move, next move. `partial` / `incorrect` → the feedback only, and the learner tries again (a retry). No automatic hint |
| Hint ladder | nudge → hint → partial → reveal, one step per Help, and every Help counts. At levels 2 and 3 the feedback after a retry already nudged (free), so the first Help gives `hint`. At levels 4 and 5 there is no free nudge |
| The next move's question | asked at the same time as the move's first evaluation (or Help), from the map as it was before that answer, and kept in `session.nextQuestion`. The turn that ends a move waits for one call, not two. If it fails, the next move asks when it starts |
| Level 5 | **the learner asks.** They send any number of `{ question }` to the fact desk while filling the map, then submit `{ mentefacto }`. No per-move checks; whole-map evaluator at the end. Help gives a hint and caps that move at 1 point |
| Mixed levels | whole-map mode (the learner asks, one submit) runs only when all four moves are at level 5, or in test mode. Otherwise a move at level 5 runs like level 4: a check per move, hints only on Help |
| Testers' pre-test and post-test | run in level 5 mode, so both measure the same thing: questions asked, how many test the concept, and the score |
| Test sessions (`mode: "test"`) | every move at level 5 whatever the mastery says; the result is computed as usual; mastery is never updated |
| Points per move | evaluator `quality` on the first try with no Help; capped at 1 after a retry or a Help; 0 if revealed. Max 8 |
| Mastery | done with at most one retry or Help → level up one (max 5). Neither → `unassistedSuccesses + 1`. Never down in this version |
| Calibration | `calibrationGap = predictedScore − score` (points) |
| Exclusion without a difference | one follow-up question from code ("What's the key difference between democracy and dictatorship?"); not a hint, not a retry |
| Reveal | the ladder's last step reveals: the item goes on the map, the move scores 0, it's named, and the next move starts |
| Help on the whole map | works on the first move, in order, whose hints haven't run out; a revealed item goes on the map |
| Done, on the whole map | a move counts as done (level up, unassisted success) when its quality is 2 |
| Writing the map | a sharper item replaces the vaguer one it contains ("free elections" replaces "elections"); `note` only survives on exclusions; "a; b" becomes two items |
| Input that doesn't fit the phase | `advance` throws `UnexpectedInput`, nothing changes; the API answers 409 with the latest Turn |
| An agent call fails | `advance` returns the session unchanged and the last Turn with `error` set: `code` and `retryable` from callAgent's error (#10), otherwise `agent_failed`, retryable |
| The coach fails | the result still comes back, with fixed text built from the numbers (#44) |

### The seam between the orchestrator and the API

The orchestrator is one async function in `agents/`. It never touches the database or the network;
the only way it reaches Claude is the `callAgent` the API passes in.

```ts
type AgentName = "questioner" | "evaluator" | "evaluator_full" | "hint_giver" | "fact_desk" | "coach";

// Written by Leo (#10): sends the agent's prompt + Zod schema to Claude, validates, logs to agent_log.
type CallAgent = (agent: AgentName, input: unknown) => Promise<unknown>;

type TurnInput =
  | { action: "start" }                                   // sent by the API on POST /sessions
  | { prediction: number } | { text: string } | { question: string } | { mentefacto: Mentefacto }
  | { action: "help" } | { action: "continue" };

// Written by Cynthia (#3).
function advance(
  state: { session: Session; mastery: Mastery },
  input: TurnInput,
  callAgent: CallAgent,
): Promise<{ session: Session; mastery: Mastery; turn: Turn }>;
```

The API loads the session and mastery, calls `advance`, saves what comes back, and returns the
`Turn`. The repeat check on the `turn` number happens in the API before `advance`, so `advance` never
sees a resend.
The API never decides the flow; the orchestrator never stores anything. In test mode `advance` returns
the mastery unchanged. If `callAgent` throws, `advance` returns the session unchanged and a `Turn`
with `error` set.

---

## 4. State in SurrealDB

| Table | Fields | Notes |
|---|---|---|
| `mastery` | user, move, level, unassistedSuccesses, updatedAt | one row per user per move; read every turn |
| `session` | id, user, concept, material, mode, turn, lastTurn, predictedScore, firstAttempt, phase, move, hintStep, hintsPerMove, mentefacto, recent, retries, lastIssue, nextQuestion, questions, moveLog, result, createdAt | the orchestrator's state; `lastTurn` is returned again on a repeat; `hintsPerMove` starts with all four moves at 0, `retries` at 0, `lastIssue` at `"none"`, `nextQuestion` at null |
| `agent_log` | session, agent, input, output, ms, at | append-only; debugging and the testers' numbers (fact desk rows are the questions metric) |

`DELETE /me/data` removes all three for the user.

---

## 5. Notes for the API

- Model from `AGENT_MODEL` (default `claude-opus-5-5`). Effort `low` for questioner and hint giver,
  `medium` for the evaluators.
- Latency budget: **median under 4 s per turn, never over 8 s**, measured at the walking skeleton
  (Oct 21, #7 and #10). The app shows a thinking indicator whenever a call is pending. If it's slower:
  lower the effort first, then move the Questioner and Hint giver to `claude-sonnet-5-5`.
- Budget: the $100 credits expire Oct 21. Unless the organizers extend them (#19), the account gets
  $30 with auto-reload off (#20). Measure the cost of one full session (#10); if 20 tester sessions
  plus the demo don't fit in $30, `AGENT_MODEL` drops to `claude-sonnet-5-5`.
- A turn waits for one call at a time: a wrong answer is the evaluator alone, a Help is the hint giver
  alone, and the next move's question is asked alongside the move's first evaluation (section 3). The
  one turn with two calls in a row is the last answer (evaluator, then coach). At level 5 each question
  is one fact desk call (effort `low`).
- Schemas: every object `additionalProperties: false` (Zod does this). No `min`/`max`/`minLength`:
  the SDK strips them and checks them locally. The first call with a new schema is slower (it gets
  compiled, then cached 24 h), so warm up every agent before the demo.
- If a call fails or Claude refuses, return the same `Turn` with `error` set. Never fill the gap
  with a made-up answer.

---

## 6. Kickoff decisions (Oct 19)

| # | Question | Decision | Why |
|---|---|---|---|
| 1 | Move names | The method's ids in code; plain labels on screen (`MOVE_LABEL`, section 0) | Plain question first, the move's name after |
| 2 | One endpoint or one per action | One: `/turns`, driven by `expects` (section 1) | The orchestrator decides the next step anyway: one handler in the API, one call in the app |
| 3 | Challenger in Check yourself | No sixth agent: a counterexample is a hint from the hint giver | One less prompt; the Challenger stays in Check the AI |
| 4 | Worked example | A fixture (`agents/fixtures/worked-example.json`), no live call | Same for everyone; instant, free, can't fail on demo day |
| 5 | `x-dev-user` before Clerk | Yes, until Oct 21; rejected when `NODE_ENV=production` | Front end and back end can test without waiting for Clerk |
| 6 | Latency | Median under 4 s per turn, never over 8 s; a thinking indicator always shows (section 5) | The number is set before measuring, so the Oct 21 measurement has a pass line |
| 7 | Fact desk structure answer | `kind: "redirect"` in both the agent output and the `Turn` | One name end to end, nothing to translate |
| 8 | Prediction scale | 0 to 8 points (`{ prediction }`), after one line explaining the task | Same scale as the score, so the calibration gap compares like with like |
| 9 | Showing the worked example | `Turn.example` holds the planet map while it fills in | `mentefacto` stays the learner's own concept |
| 10 | Orchestrator and API | `advance(state, input, callAgent)` (section 3) | Rules stay in `agents/`, storage and Claude calls stay in the API |
| 11 | Sign-in | Clerk email code only, no Google or Apple | No OAuth setup, same on phone and web, testers and judges get in fast |
| 12 | Learner material | Pasted text only, up to 8,000 characters | No upload or parsing code |
| 13 | Language | English only this week | One set of prompts to test; Spanish goes on the roadmap |
| 14 | Layout | Phone first; the web build shows the same layout, centered | One layout to build and polish |
| 15 | Grading | Any defensible answer passes (2 = closest class, 1 = defensible but too broad or incomplete). The bigger group is tested with "<concept> is a kind of <answer>": related is not belonging | Concepts have fuzzy edges; one right answer would mark good thinking wrong |
| 16 | Mixed levels (Leo) | Whole-map mode only when all four moves are at 5 (or test mode); otherwise a level-5 move runs like level 4 | One clear rule; the demo profile is seeded with all four at 5 |
| 17 | Fact desk redirect (Leo) | "That part is yours to decide. If you're stuck, tap Help (it costs a point)." Never points at a move | A pointing question was a free hint, and learners could ask for the structure on purpose |
| 18 | Resent answers (Leo) | Each `Turn` has a `turn` number; a repeat gets the stored `Turn` back | A slow phone resends, and the hint step would move twice |
| 19 | Package name (Leo) | `@build-north/agents` | The plain name `agents` collides with another package on npm and trips `npm audit` |
