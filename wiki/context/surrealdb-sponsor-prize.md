---
title: "SurrealDB sponsor prize: Agent Memory"
type: context
related: ["[[hosting-setup]]"]
created: 2026-10-19
updated: 2026-10-24
---

As relayed by Leo on Oct 19 from SurrealDB's Build North participant pack. Not re-checked against the sources.

## The prize

- SurrealDB sponsors Build North. The prize is $1,000 in Agent Memory credit.
- Judges want three things: facts that replace old facts without overwriting them, answers you can
  trace back to their source, and memory shared across more than one agent. A single-agent CRUD demo
  is unlikely to be competitive.
- Submissions close Oct 25, 11:59 PM ET. Chiru Boggavarapu from SurrealDB answers questions in the
  Build North Discord.

## Getting started

- Every participant gets $50 of Agent Memory credit: in Studio, Billing, code `BUILDNORTH50`, Redeem.
  Not redeemed yet as of Oct 19.
- Studio sidebar: Agent Memory, Deploy new context (name, region). Then API keys: the secret starts
  with `sp-` and shows once. Each context has its own host URL and context ID; there's no global endpoint.
- Env vars: `SPECTRON_URL`, `SPECTRON_CONTEXT_ID`, `SPECTRON_API_KEY`. Write with
  `POST $SPECTRON_URL/api/v1/$SPECTRON_CONTEXT_ID/facts`, read with `/query`.
- SDKs: `@surrealdb/memory` (JS/TS) and `surrealdb[memory]` (Python).

## Lumente and this prize

**Decided Oct 22: we enter this prize** (reversing the same morning's skip; `DECISIONS.md`, #99). The
design in five lines:

- Facts are built in code from templates (`infer: "triples"`): a learner's level on each part, the latest
  prediction gap, the Helps that cost the most. Never the learner's words.
- One scope per learner, a salted hash of the Clerk id; Delete my data purges it.
- The hint giver and the coach read up to 8 facts from earlier sessions and cite the ids they use;
  `verifyCites` keeps only the ones they were given.
- A level-up supersedes the old fact and keeps the history.
- The learner sees it in the Memory sheet. Levels still come from code, so memory never changes a score.

**Built Oct 23** (PR #130, `api/src/memory.ts`, the Memory sheet in the app; `api/README.md` has the variables
and the rollout). `npm run memory:smoke -w api` runs the loop against the live context with a throwaway
learner and erases it: all 8 checks pass. What the live context does, found that day and handled in the code:

- A dot in an attribute key is folded into an underscore, so the keys are `level_<move>`, `gap` and
  `help_<move>`. Labels (`session=…`, `writer=…`, the numbers) come back exactly as sent.
- Parallel `POST /facts` writes on one entity answer "unknown error" for some of them; one after another they
  all land, about 700 ms each (a session's seven facts take about 5 s, off the request path).
- A history read takes 150 to 240 ms, inside the 1.5 s budget. A new scope answers 201. A scoped forget reports
  more rows than were written (it counts across tables).
- The scope is `learner/<pseudonym>`, the entity `topic/<pseudonym>_<concept>` (lowercase, digits, underscores:
  it comes back unchanged); each fact is one attribute, and a later write of the same key supersedes the
  earlier one with `supersedes` set and the old row closed by `validUntil`.

Leo's first read of the fit, from Oct 19:

- Several agents already share one learner (questioner, evaluator, hint giver, fact desk, coach).
- Mastery per move changes over time: each level-up is a new fact that replaces the old one, with the
  history kept.
- The fact desk answers from the learner's pasted material, so each answer can point to its source.

## How Lumente meets the three criteria

For a judge with ten minutes. Each criterion has the mechanism in plain words, the exact pointers, and
what the running app shows. Every pointer was read in the code on `main` at `179807e` (Oct 23). The pull
request that added this section changed none of the files it names, so the line numbers hold. The
contract is `agents/CONTRACTS.md`, section 2, "Memory: what earlier sessions left", with the Zod schemas
in `agents/src/contracts.ts` (sections 2a and 2b). The unit tests named below run with `npm test -w api`
and `npm test -w @build-north/agents`, against a stand-in for memory's REST API, with no network.

### 1. Facts that replace old facts, with the history kept

**Mechanism.** When a session reaches its result, the API writes one fact per changed level, one for the
prediction gap and one per part for its Helps, each under a fixed key (`level_<move>`, `gap`,
`help_<move>`) on one entity per learner and concept. The next session on the concept writes the same
keys again, and Agent Memory keeps both rows: the new row carries `supersedes` with the old row's id, and
the old row is closed with `validUntil`. The API never edits or deletes a row, except on Delete my data.

**Pointers.**

- `api/src/memory.ts:107` `factsToWrite`: the keys are built at lines 111 (`level_${change.move}`), 116
  (`gap`) and 122 (`help_${move}`). The numbers travel in labels, so a read never parses a sentence.
- `api/src/memory.ts:62` `slug` and `api/src/memory.ts:67` `entityOf`: one entity per learner and
  concept, in lowercase letters, digits and underscores. Memory folds a dot in a key to an underscore, so
  the keys use underscores from the start.
- `api/src/memory.ts:198` `write`: `POST /facts` with `infer: "triples"`, one write per fact.
- `api/src/memory.ts:235` `chainsOf`: the rows of one key, newest first. The first row is the current
  value. Line 266 takes `MemoryFact.supersedes` from the row. Line 299 takes the view's `until` from the
  row's `validUntil`.
- `api/src/memory.ts:317` `viewOf`: per part, the level now and its chain.
- Contract: `MemoryFact.supersedes` (`agents/src/contracts.ts:192`), `MemoryHistoryRow.until`
  (`agents/src/contracts.ts:354`), `MemoryView` (`agents/src/contracts.ts:373`).
- Fixture: `agents/fixtures/memory-view.json`. "Bigger group" (`supraordinate`) is at level 3 since Oct
  23, with the level 2 row closed at that same instant. `agents/test/memory-contract.test.ts:104` checks
  that the superseded row closes when the next one starts.
- Tests in `api/src/memory.test.ts`: "a later session's write of the same key supersedes the earlier
  one" and "the Memory sheet's view: each part's chain newest first, the superseded row closed". The
  first runs two sessions through a stand-in memory service, then reads the view and a third session's
  facts.
- Live: `npm run memory:smoke -w api` runs the same loop against the live context
  (`api/src/memory-smoke.ts:79`, "session 2's write supersedes session 1's level, and memory keeps the
  chain").

**In the app.** Open "Memory" at the top of Start. Under the concept, each part shows its level now and
its chain, newest first. For example "level 3 since Oct 23", then "level 2 from Oct 22 to Oct 23"
(`app/src/session/present.ts:439`). The old level is still there, closed, not overwritten.

### 2. Answers you can trace to their source

**Mechanism.** Before the hint giver and the coach run, the API reads up to 8 facts from the learner's
earlier sessions on the concept and passes them in as `memory`, one line per fact after its id, with the
instruction to put the id of every fact the text relies on in `cites`. The API keeps only the ids it
passed in, logs the rest on the call's `agent_log` row as `dropped`, and fills `Message.sources` with the
cited facts' own words before the Turn goes out. A made-up source never reaches the screen.

**Pointers.**

- `agents/src/prompts/shared.ts:68` `MEMORY` (the instruction) and `agents/src/prompts/shared.ts:77`
  `renderMemory` (`- <id>: <text>` lines inside `<memory>`). `agents/src/prompts/hint-giver.ts:47` and
  `agents/src/prompts/coach.ts:68` render it.
- `agents/src/contracts.ts:316` `HintGiverOutput.cites` and `agents/src/contracts.ts:340`
  `CoachOutput.cites`.
- `agents/src/memory.ts:7` `verifyCites`: keeps the ids that are in `memory`, each once, and returns the
  dropped ones. `api/src/call-agent.ts:172` calls it on every coach and hint giver reply. Line 175 warns,
  and line 178 puts `dropped` on the log row (`api/src/store.ts:38`, `AgentLogEntry.dropped`).
- `agents/src/orchestrator/advance.ts:363` `cited`: the verified ids go onto the hint (line 245) and the
  summary (line 352).
- `api/src/memory.ts:443` `fillSources`: fills `Message.sources` (`agents/src/contracts.ts:111`) from
  the facts this Turn was given, called at `api/src/app.ts:237`. `Message.cites` is
  `agents/src/contracts.ts:108`.
- `api/src/memory.ts:251` `factOf`: each fact carries `writtenBy`, `sessionId`, `turn` and `since`. A
  cited id leads back to the session and the agent that produced the number.
- Tests: `agents/test/memory-contract.test.ts:127` ("verifyCites") and `api/src/call-agent.test.ts:236`.
  In `api/src/app.test.ts:708` the hint giver cites a made-up id, and the Turn carries only the real one,
  with its words. In `api/src/memory.test.ts`: "only the hint giver and the coach receive memory, read
  once per Turn, and the sources of what they cite are filled in".

**In the app.** Under a hint's amber card, or under the coach's words on the result screen, a dim line
starts with "From what Lumente remembers:" and gives the cited sentences. One reads like "You moved up to
level 3 on 'Bigger group' for CORS on Oct 23." The code: `app/src/components/messages.tsx:138`
`Remembered`, `app/src/components/result.tsx:123`, `app/src/session/present.ts:415` `rememberedLineOf`.
A tap on the line opens the Memory sheet on that concept, where the same fact is a row of the chain. The
line is there only when the agent cited a fact.

### 3. Memory shared by several agents

**Mechanism.** Three agents' work goes in and two agents read it: a level fact records the evaluator's
verdicts (`writtenBy: evaluator`), the gap fact the coach's whole-map result (`writtenBy: coach`), and a
Helps fact the hint giver's work (`writtenBy: hint_giver`). In the next session the hint giver reads the
evaluator's level and the coach reads the gap, from the same scope, `learner/<pseudonym>`. The Memory
sheet shows, per row, who wrote it and how many agent calls received it.

**Pointers.**

- `api/src/memory.ts:73` `WRITER`: the agent each kind of fact is written for. It is stamped on the row
  as the `writer` label (lines 113, 118 and 122) and read back as `MemoryFact.writtenBy`
  (`api/src/memory.ts:245` `writtenByOf`, contract `agents/src/contracts.ts:193`).
- `api/src/memory.ts:59` `scopeOf`: one scope per learner, shared by every agent call for that learner.
- `api/src/memory.ts:426` `withMemory`: the read happens once per Turn and goes to the hint giver and the
  coach only (line 431). `api/src/app.ts:220` puts it in front of the orchestrator's `callAgent`.
  `agents/src/contracts.ts:214` is `AgentContext.memory` (the hint giver's input) and
  `agents/src/contracts.ts:333` is `CoachInput.memory`.
- `api/src/memory.ts:277` `factsOf`: a session's agents read only earlier sessions' rows, so the coach of
  the session that just wrote never reads its own facts.
- `api/src/store.ts:170` `memoryReads`: the fact ids each hint giver and coach call received, from
  `agent_log`. `api/src/memory.ts:328` `readCountsOf` turns them into `MemoryHistoryRow.readBy`
  (`agents/src/contracts.ts:358`), served by `GET /me/memory` (`api/src/app.ts:269`).
- Tests in `api/src/memory.test.ts`: "only the hint giver and the coach receive memory, read once per
  Turn" and "the Memory sheet's view: ... who read it". In `api/src/app.test.ts:708` the hint giver and
  the coach of one session both receive the facts, and the sheet counts both reads.

**In the app.** In the Memory sheet, a part with a history shows "the AI read this once" or "the AI read
this N times" under its chain (`app/src/components/memory-sheet.tsx:89`). Those are the hint giver's and
the coach's reads of rows that the evaluator's verdicts produced. The hint's "From what Lumente
remembers" line shows a level fact, the evaluator's work, inside the hint giver's help.

## Walkthrough for the demo

Under two minutes, on the demo account, with the flag on and one finished session on the concept (say
CORS). Two conditions, from the code. The seed (`npm run seed:demo -w api`) writes no memory, so the
finished session must be a real one run with `AGENT_MEMORY_ENABLED=true`. A `level_<move>` row also
needs a part whose level changed in that session (see Limits). A learner already at level 5 on every part
leaves the gap and the Helps only.

1. Start. Tap "Memory" at the top (`app/src/app/index.tsx:310`). The sheet "What Lumente remembers"
   lists CORS. Each part reads "level N since <date>". The gap line reads "Last time, <date>: you guessed
   7 and proved 4." Criterion 3 shows as "the AI read this ..." under a part, once an agent read a row.
   Close the sheet.
2. Start a session on CORS. At the first part, tap Help. Under the amber hint card: "From what Lumente
   remembers: ...". Criterion 2. Tap the line: the sheet opens on CORS, and the cited sentence is a row
   there.
3. Finish the map. On the result, "for next time" shows the coach's words with the same dim line under
   them, with the guess against last time's. Criterion 2 again, from a second agent (criterion 3).
4. Open "Memory" again. A part that moved up now shows two rows: "level 3 since <today>" above "level 2
   from <date> to <today>". Criterion 1. "Last time" is this session's gap, and "Before" the earlier one.
5. If a judge asks what runs: "Your data", bottom line (`app/src/components/version-line.tsx`). It gives
   the app's name and version, the EAS update id (its first 8 characters), when it was published, and the
   channel (`app/src/components/version.ts:29`).

## Limits

What memory does not do, from the code:

- **It never changes a level or a score.** Levels come from `agents/src/orchestrator/rules.ts:34`
  `levelAfter` and the `mastery` table (`api/src/app.ts:258`). Memory only remembers them, so a wrong,
  stale or deleted fact changes no number (CONTRACTS.md, Memory).
- **Facts are templates, not the learner's words.** The only sentences memory ever holds are the three
  in `api/src/memory.ts:95` `factText`. They go in as triples (`infer: "triples"`, line 199), so memory
  runs no model on them. The learner's answers never go in.
- **Writes are sequential and off the request path.** One `POST /facts` per fact, one after another
  (`api/src/memory.ts:386`), because the live context refused parallel writes on one entity (Oct 23,
  above). A failed write is logged, not retried (`api/src/app.ts:263`). The tables stay the record, and
  the next session has fewer facts.
- **The flag can be off.** With `AGENT_MEMORY_ENABLED` unset, `api/src/memory.ts:44` returns null and
  nothing is read or written. `GET /me/memory` answers `{ "concepts": [] }` (`api/src/app.ts:272`), and
  the sheet says "Nothing yet. Finish a session and come back." (`app/src/components/memory-sheet.tsx:15`).
- **A read has 1.5 s.** `MEMORY_READ_MS` (`api/src/memory.ts:33`). Past it, or on any error, the agent
  runs without memory and the Turn goes on (`api/src/memory.ts:360` `recall`). There is no retry. The
  route test is `api/src/app.test.ts`, "a memory read slower than its budget".
- **Only the hint giver and the coach read.** The questioner, the evaluator and the fact desk never see
  memory (`api/src/memory.ts:431`).
- **`writtenBy` is assigned by code**, per kind of fact (`api/src/memory.ts:73`): the API writes on
  behalf of the agent whose work produced the number. The agents do not write to memory themselves.
- **`supersedes` and `validUntil` are memory's.** The API never sets them. It maps them to the contract
  (`api/src/memory.ts:266` and 299). The unit tests reproduce memory's behaviour with a stand-in. The
  live behaviour was seen on Oct 23 (above).
- **`readBy` counts our own `agent_log` rows** (`api/src/store.ts:170`), not reads that memory counted.
- **A level fact needs a change.** `masteryChanges` holds only the parts whose level moved
  (`agents/src/orchestrator/advance.ts:327`), and a level never goes down
  (`agents/src/orchestrator/rules.ts:34`). A learner at level 5 on every part, the demo seed included,
  leaves no `level_<move>` row. The sheet then says "no level yet" for each part.
- **A session's own coach reads only earlier sessions** (`api/src/memory.ts:278`). On a learner's first
  session on a concept, nothing is cited.
- **The pseudonym is a hash**, the first 8 hex characters of sha256 over the salt and the Clerk id
  (`api/src/export-testers.ts:42`). Delete my data purges the scope first (`api/src/app.ts:291`), and a
  failed purge leaves the tables untouched (`api/src/app.test.ts:798`).

## Sources

- [Build North resources](https://build-north.devpost.com/resources)
- [SurrealDB Build North participant pack](https://surrealdb.notion.site/Build-North-SurrealDB-participant-resources-pack-3edbfa44ae3e81a0a6ebd0b4fbb802d3)
- [Agent Memory hosted quickstart](https://surrealdb.com/docs/agent-memory/quickstarts/hosted.md)
- [Agent Memory on SurrealDB Cloud](https://surrealdb.com/docs/agent-memory/quickstarts/surrealdb-cloud.md)
