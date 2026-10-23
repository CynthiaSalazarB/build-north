---
title: "Hand-off, Oct 23 morning: for Cynthia's Claude, the whole picture to the freeze"
type: context
related: ["[[status-oct22]]", "[[plan-to-win]]", "[[expo-prize-plan]]", "[[surrealdb-sponsor-prize]]", "[[submission-checklist]]"]
created: 2026-10-23
updated: 2026-10-23
---

Written by Leo's Claude at 9:45 AM on tester day, for the next session that opens this repo on Cynthia's
side. It replaces the "open on" lists of [[status-oct22]] (kept as history). No secrets, no tester names;
every item names who holds it, and every claim names where its evidence is. Read the four sections in order:
what runs now, what is open, what to do and decide, what to know.

## 1. What runs now (checked at 9:40 AM, Oct 23)

| Piece | State | Evidence |
|---|---|---|
| `main` | `23d32b7`: #103 (final polish, voice, Your data, the review fixes), #104 (export + smoke), #124 (API saves), #125 (status) and Cynthia's #126 to #128 (Start copy, no "tutor", the pitch). #129 and #130 are **not** in it | `git log origin/main` |
| API | Render runs `main`; `npm run smoke -w api` passes 7 of 7 against prod and the production web | `api/README.md`, run at 9:40 AM |
| Web, production and `testers` | Both from `main` at `d0d4a25` (after #103), `production` environment, redeployed early Oct 23 by Cynthia's Claude; the new screens were checked | [[status-oct22]] item 1 |
| Android | Build 3 (`preview`, runtime `56eeb40f…`) takes update group `a13043a6…` (05:38Z), which is `main` at `d0d4a25` from `ship.yml`. So the phones run #103's code, not #129's | the `preview` channel's manifest, fetched at 9:40 AM |
| Memory (SurrealDB Agent Memory) | Built on #130, **flag off everywhere**; the live run against the real context passes 8 of 8 (`npm run memory:smoke -w api`) | the comment on #130 |

## 2. Open pull requests

| PR | What | Who | State |
|---|---|---|---|
| #129 `leo/alive-polish` | The firefly's light answers hover and touch (nothing moves on its own; Reduce Motion swaps instantly; the halo takes no pointer events, so a click on the glow is no longer Help). Plus four fixes from a review of `main` this morning: a mic that could stay stuck when a field unmounted while the permission was being asked; Send or Ask mid-phrase now aborts the phrase so the old text doesn't come back into the emptied field; a timeout says the server is slow (client waits 90 s, since a Claude call is 30 s + one retry); Try again on the result keeps the notes the learner pasted. app 51/51, api 47 + 1 skipped, agents 102/102, tsc clean; headless Chromium checks in the body | Cynthia reviews | Ready, review requested |
| #130 `leo/memory-build` | Issue #112: the memory writer (one sentence per fact at the result Turn: level changes, the gap, the Helps), the reader before the hint giver and the coach (up to 8 facts from earlier sessions, 1.5 s budget, skips the current session), `verifyCites` in `call-agent.ts` with dropped ids on `agent_log`, `GET /me/memory`, the purge in `DELETE /me/data`, the Memory sheet, "From what Lumente remembers: …" under a hint and under the coach's words, the progress-notes line in Your data, `DECISIONS.md` entries. **Touches `agents/`**: `Message.cites?` and `Message.sources?` (her #112 proposal), two lines in `advance.ts` that copy verified cites onto the hint and the summary message, a test, the CONTRACTS Memory section | Cynthia reviews the contract part first | Draft |
| #106 `leo/final-readme` | The final README, `docs/testing-notes.md` for judges, the diagram, her memory paragraph. One TODO: the pilot results | Cynthia merges after the freeze | Draft |

## 3. What to do and decide (Cynthia)

1. **#129, timing.** JS only (no native change: the speech module is already in build 3), so it can ship as a
   preview update any time. But a merge triggers nothing by itself (`ship.yml` runs by hand until the Expo
   GitHub app is on), and an update mid-session on a tester's phone takes effect on the next launch, not
   mid-session. Suggested: merge when reviewed; run `ship.yml` between testers or after the last one; redeploy
   the `testers` alias in the same step (Render runs `main`, the web must match). Leo can run both on her word.
2. **#130, the contract part is hers.** Her options, from the PR body: accept the `agents/` lines as they are, or
   drop them and land the orchestrator part herself (Leo rebases). The rest is the API and the app. Decide
   before Oct 24 noon (the kill rule, #112): not green by then, the flag stays off and no write-up claims it.
3. **#130, rollout order, in this order and no other:** merge; ship the app update (an older bundle rejects a
   Turn carrying `cites`/`sources`); then `AGENT_MEMORY_ENABLED=true` with `AGENT_MEMORY_ENDPOINT`,
   `AGENT_MEMORY_CONTEXT`, `AGENT_MEMORY_API_KEY` on Render (Leo sets them; values never in the repo). The
   writer runs off the request path (about 5 s per session, one write after another, since parallel writes on
   one entity failed in the live run), so no Turn waits on it. Never flip the flag on tester day.
4. **Tester day, hers from the plan:** observe and the grading sheet (#33), the bug log (#39), prompt fixes from
   the tester bugs (#40, hers; Leo ships app fixes as preview updates and API fixes through `main`), hand-grade
   the ten maps (#49). Leo is on call for the API (#37) and runs `export:testers` after the post-tests (#50).
5. **The slow `evaluator_full` turn** (10.6 s seen on prod, plan line 8 s): lower the effort first, then
   Sonnet for the questioner and the hint giver (plan, section 10). Prompts and effort are hers. Related: the
   Anthropic client runs with a 30 s timeout and one retry, so a hung call holds a learner for about a minute
   before the error Turn; the app now says "taking too long" instead of "can't reach the server" (#129).
6. **After the testers:** the Expo GitHub app on the repo (plan decision 11, her call), then the deck (#47,
   #31), the demo video (#48), the demo script on the frozen app (#41), Devpost (#30, #51, #53), the numbers
   slide (#52) from the export.
7. **Oct 24 by 6 PM (Leo, hers to watch):** the `production` Android build, the last update and web deploy,
   Render Auto-Deploy off, the freeze summary on #45; #106 merges after the freeze.

## 4. What to know and consider

- **Done last night and this morning, in one place.** #103 was caught up with `main` and her three asks, then
  reviewed for races: ten defects fixed (eight app, two API) with tests, all in the PR bodies of #103 and #124.
  This morning #129 fixed four more from a review of `main`. The audio facts for Your data (we keep none,
  nowhere; the speech service is Google's on most Android phones and the browser's on the web) are in #103's
  body; the wording is hers to change.
- **Not verified by anyone yet:** a real microphone on a phone and on the web. Every voice check so far used
  a stand-in `SpeechRecognition` in a browser. The first tester with the mic is the first real test; the
  fallback is typing, which never depended on the mic.
- **Clerk, two things on Leo:** the password at sign-up is to be turned off in the Clerk dashboard (her decision
  of Oct 22: email code and Google only); whether that is done is not recorded here, check before the first
  tester signs up. Google sign-in on the phone needs build 3's SHA-256 in Clerk's Android tab; email code
  works without it.
- **Rate limit:** 60 requests a minute per IP, and a room on one Wi-Fi shares one IP. Five testers plus the two
  of us stay under it; a bigger room means `REQUESTS_PER_MINUTE` on Render (#124), no deploy needed.
- **Builds are scarce** (3 of 15 free Android builds used): JS ships as `eas update --channel preview
  --environment preview` from a tree whose fingerprint matches build 3 (`eas fingerprint:compare --build-id
  93910cdd…`; `main` matches since #103). The only planned build is the `production` one at the freeze.
- **Memory never sets a score and never stores the learner's words:** the facts are sentences code writes from
  the numbers (`api/src/memory.ts`), the scope is the learner's pseudonym (the export's salted hash), and
  Delete my data purges it. The write-up and the prize page ([[surrealdb-sponsor-prize]]) already say this
  through #130's wiki changes; if the flag stays off, those lines go back to plain tables.
- **Seen and left alone** (in #124's body): the startup schema runs with the 5 s query signal and can log and
  go on; a session row saved before a contract field was added answers 500 instead of 404 on `GET
  /sessions/:id`. Neither reachable in a normal tester session.
- **Where the evidence lives:** `docs/expo-log.md` (every build, update and deploy with its group id),
  `api/README.md` (smoke, export, memory:smoke, env vars), the PR bodies, `DECISIONS.md`, and the Expo
  dashboard for the `preview` channel.
