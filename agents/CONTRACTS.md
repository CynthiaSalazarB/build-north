# Agent contracts · draft v0.1

For the Oct 19 kickoff. Everything here is a proposal: react to it, then it becomes Zod schemas in
`agents/` and this file becomes the reference.

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

type Level = 1 | 2 | 3 | 4 | 5;   // watch, guided, complete, named only, alone
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

---

## 1. API and the `Turn`

Every call needs the Clerk token as `Authorization: Bearer <token>`. Until Clerk lands (Oct 21) the
API accepts an `x-dev-user: <name>` header instead.

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/sessions` | `{ concept, material? }` | `Turn` (asks for confidence) |
| `POST` | `/sessions/:id/turns` | one of `{ confidence }`, `{ text }`, `{ action: "help" }`, `{ action: "continue" }` | `Turn` |
| `GET` | `/sessions/:id` | | latest `Turn` (resume after the app reloads) |
| `GET` | `/me/mastery` | | `Mastery` |
| `DELETE` | `/me/data` | | `204`, deletes sessions, logs and mastery (the delete button) |
| `GET` | `/health` | | `{ ok: true }` |

`material` is the learner's own notes. Over 8,000 characters the API answers `413` with a message
asking for a shorter excerpt; it never trims silently.

### `Turn`: the one object the app renders

```ts
type Turn = {
  sessionId: string;
  phase: "predict" | "attempt" | "example" | "move" | "result";
  move: MoveId | null;
  level: Level | null;
  messages: {
    agent: "questioner" | "evaluator" | "hint_giver" | "example_builder" | "coach" | "app";
    kind: "question" | "feedback" | "hint" | "example" | "named_move" | "summary";
    text: string;
    hintStep?: HintStep;
  }[];
  expects: "confidence" | "text" | "continue" | "none";   // decides which input the screen shows
  scaffold: { given: string[]; blanks: number } | null;     // level 3 only: the half-built part
  mentefacto: Mentefacto;                                   // what the learner has built so far
  progress: { movesDone: number; movesTotal: number; hintsUsed: number };
  result: Result | null;                                    // only when phase = "result"
  error: { code: "agent_failed" | "rate_limited"; retryable: boolean } | null;
};
```

Example, session 1, the learner just answered "A law?" for the bigger group:

```json
{
  "sessionId": "ses_8f2k",
  "phase": "move",
  "move": "supraordinate",
  "level": 2,
  "messages": [
    { "agent": "evaluator", "kind": "feedback", "text": "Not quite. A law is a rule, and democracy isn't a rule." },
    { "agent": "hint_giver", "kind": "hint", "hintStep": "hint",
      "text": "Think of monarchy and dictatorship. What are all three examples of?" }
  ],
  "expects": "text",
  "scaffold": null,
  "mentefacto": { "concept": "democracy", "supraordinate": null, "exclusion": [], "isoordinate": [], "infraordinate": [] },
  "progress": { "movesDone": 0, "movesTotal": 4, "hintsUsed": 1 },
  "result": null,
  "error": null
}
```

### `Result`: the end of a session

```json
{
  "predictedConfidence": 80,
  "score": 5,
  "maxScore": 8,
  "actualPercent": 63,
  "calibrationGap": 17,
  "hintsUsed": 4,
  "rubric": [
    { "move": "supraordinate", "points": 1 },
    { "move": "exclusion", "points": 2 },
    { "move": "isoordinate", "points": 1 },
    { "move": "infraordinate", "points": 1 }
  ],
  "masteryChanges": [
    { "move": "supraordinate", "from": 2, "to": 3 },
    { "move": "exclusion", "from": 2, "to": 3 },
    { "move": "infraordinate", "from": 2, "to": 3 }
  ],
  "selfGeneratedQuestions": 0,
  "coach": { "message": "You found the bigger group and a real exclusion. 'What it needs' is next.", "nextFocus": "isoordinate" }
}
```

`calibrationGap = predictedConfidence − actualPercent`. Positive means overconfident.

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
4 and 5 use fixed text from code ("Now find the exclusion.", "Build the mentefacto for inflation."),
no model call.

### Evaluator: judges one answer against the mentefacto rules

In: `AgentContext & { answer: string }`

```json
{
  "verdict": "incorrect",
  "quality": 0,
  "accepted": [],
  "issue": "not_a_class",
  "reason": "A law is a rule, not a class that contains monarchy and dictatorship.",
  "feedback": "Not quite. A law is a rule, and democracy isn't a rule.",
  "learnerQuestions": []
}
```

- `quality`: 0 to 2 for this move, before any hint penalty.
- `accepted`: the `Item`s to write into the mentefacto (empty when not accepted).
- `issue`: `too_broad | not_a_class | same_level | is_a_subtype | is_a_characteristic | off_topic | none`.
  Code uses it to pick the next hint; the hint giver uses it to aim the hint.
- `reason` is for logs and for us. `feedback` is shown, and must never contain the answer.
- `learnerQuestions`: questions the learner asked on their own in this answer (the self-generated
  questions metric).

### Evaluator, whole map: scores a mentefacto built alone

Used at level 5 and for the testers' pre-test and post-test. In: `{ concept, material, mentefacto }`

```json
{ "rubric": [
    { "move": "supraordinate", "quality": 1, "feedback": "'Money' is too broad. What's the closest group?" },
    { "move": "exclusion", "quality": 2, "feedback": "'One product getting more expensive' is an excellent exclusion." },
    { "move": "isoordinate", "quality": 2, "feedback": "..." },
    { "move": "infraordinate", "quality": 2, "feedback": "..." }
  ],
  "learnerQuestions": [] }
```

### Hint giver: words the hint step code chose

In: `AgentContext & { step: HintStep; lastAnswer: string; issue: string }`

```json
{ "step": "hint",
  "text": "Think of monarchy and dictatorship. What are all three examples of?",
  "revealed": null }
```

`revealed` is filled only at `reveal`: the `Item` that goes into the mentefacto, with 0 points.

### Example builder: the level 1 worked example, thinking out loud

In: `{ exampleConcept: "planet", moves: MoveId[] }` (code picks a simpler concept from a different subject)

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

In: `{ concept, mentefacto, result }` with every number already computed by code.

```json
{ "message": "You found the bigger group and a real exclusion. 'What it needs' is next.",
  "nextFocus": "isoordinate" }
```

The coach never computes or states a number it wasn't given. Naming a move after it's found
("That's called the supraordinate class. You found it.") is fixed text from code.

### Not in this version

Challenger and Steelman belong to Check the AI.

---

## 3. Orchestrator rules (code, in `agents/`)

| When | Rule |
|---|---|
| Session start | predict (confidence) → short attempt ("in your own words") → worked example if any move is at level 1 → the four moves → result |
| Level for a move | read from mastery; new learners start at 1. Watching the worked example moves every move to level 2 |
| After an answer | evaluator. `correct` → accept, name the move, next move. `partial` / `incorrect` → next hint step |
| Hint ladder | nudge → hint → partial → reveal. At levels 4 and 5, hints only when the learner taps Help |
| Level 5 | no per-move checks; whole-map evaluator at the end |
| Points per move | evaluator `quality`, capped at 1 if any hint was used, 0 if revealed. Max 8 |
| Mastery | done with ≤ 1 hint → level up one (max 5). 0 hints → `unassistedSuccesses + 1`. Never down in this version |
| Calibration | `actualPercent = round(score / 8 × 100)`; `gap = predicted − actualPercent` |

---

## 4. State in SurrealDB

| Table | Fields | Notes |
|---|---|---|
| `mastery` | user, move, level, unassistedSuccesses, updatedAt | one row per user per move; read every turn |
| `session` | user, concept, material, predictedConfidence, firstAttempt, phase, move, hintStep, hintsPerMove, mentefacto, result, createdAt | the orchestrator's state |
| `agent_log` | session, agent, input, output, ms, at | append-only; debugging and the testers' numbers |

`DELETE /me/data` removes all three for the user.

---

## 5. Notes for the API

- Model from `AGENT_MODEL` (default `claude-opus-5-5`). Effort `low` for questioner and hint giver,
  `medium` for the evaluators. Measure seconds per turn on Oct 20 before changing anything.
- A learner's answer costs two calls in a row (evaluator, then hint giver or questioner). That's the
  latency to watch.
- Schemas: every object `additionalProperties: false` (Zod does this). No `min`/`max`/`minLength`:
  the SDK strips them and checks them locally. The first call with a new schema is slower (it gets
  compiled, then cached 24 h), so warm up every agent before the demo.
- If a call fails or Claude refuses, return the same `Turn` with `error` set. Never fill the gap
  with a made-up answer.

---

## 6. Questions for the kickoff

1. **Move ids:** keep the method's names in code (`supraordinate`…) and plain names on screen ("bigger group")?
2. **One answer endpoint** (`/turns` with four body shapes) or one endpoint per action?
3. **Challenger in Check yourself:** the brief's democracy example uses it ("North Korea holds
   elections"). Proposal: a counterexample is something the hint giver can use, not a sixth agent.
4. **Worked example:** generate "planet" once and ship it as a fixture, with no live call in the demo?
5. **Before Clerk:** is the `x-dev-user` header fine until Oct 21?
6. **Latency:** how many seconds per turn is acceptable on a phone? Pick the number before measuring.
