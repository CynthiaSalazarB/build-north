---
title: "Status, Oct 22 night: what is live, what is open, and who holds it"
type: context
related: ["[[plan-to-win]]", "[[expo-prize-plan]]", "[[hosting-setup]]"]
created: 2026-10-22
updated: 2026-10-23
---

Where Leo's side stands late on Oct 22, written for the next session that opens this repo (Cynthia's
Claude included). Numbers and links only; no secrets, no tester names. Every item names who holds it.
The first thing to do is the merge order under "Open on Cynthia".

## Live

| Piece | State | Evidence |
|---|---|---|
| API | `main`, auto-deployed on merge, Render Starter (no cold start). `/health` 200 in about 0.2 s; `/health/db` writes to `prod` as the database-level user (`SURREAL_USER=api`, auth level `database`); no token and dev headers both answer 401; CORS allows `https://reality-check.expo.app` and the `testers` alias | `npm run smoke -w api` (PR #104): 7 of 7 checks pass on prod, Oct 22 at 9 PM |
| Web, production and `testers` | https://reality-check.expo.app and https://reality-check--testers.expo.app, EAS Hosting, both from `main`. **Oct 23, about 12:50 PM:** both redeployed from `main` at `99880ae` (#129, #130, #132, #133, #135) by Cynthia's side, after #133 merged at 12:42 PM, with a five-minute demo-mode window first (12:47 to 12:52 PM, a cached export without `EXPO_PUBLIC_*`; `docs/deploy.md` now says `--clear` and check the bundle). Render runs `main`, so they move together | `docs/expo-log.md`; at 2:35 PM both addresses serve the `99880ae` bundle and `npm run smoke -w api` passes 7 of 7 on prod |
| Web, test alias | https://reality-check--polish.expo.app: the #103 build at `7306df1` in demo mode (no API, no Clerk): the website layout, "Your data", the mic, the review fixes | A new address with the API would need its own `CORS_ORIGIN` row on Render |
| Android | `preview` APK, build 3 on the `lumente` project, runtime `56eeb40f…`: [download](https://expo.dev/artifacts/eas/LVkBl_worJBs2ro5p6z9vFa1XtYyA992vF3QrkSzG_A.apk). **Oct 23, about 12:50 PM:** the newest EAS Update on the `preview` channel, group `10096fd2…` (a clean-cache export checked for the API URL and the Clerk key; it supersedes `4ea2541a…` from the same commit), is `main` at `99880ae`; the APK takes it on its second launch | `docs/expo-log.md`; `eas update:list --branch preview` shows `10096fd2…` on top, and `eas fingerprint:compare --build-id 93910cdd…` says `main` at `99880ae` (and #137 on top of it) still matches the build |
| Demo account | Leo's Google account, seeded in `prod`: level 5 on all four parts and a CORS session waiting at the whole map | `npm run seed:demo -w api` from a checkout with the prod variables |
| First real session on prod | `/turns` median 2.4 s, slowest 10.6 s (the final `evaluator_full`, over the plan's 8 s line), $0.040 for the session | `agent_log` rows, Oct 22 |

## Open pull requests

**Update, Oct 23 early:** #104, #124 and #103 are merged (see "Open on Cynthia", item 1); #106 stays a draft
until the freeze.

All three of Leo's are ready for review; one teammate reviews, the merge is the acceptance.

| PR | What | Waits on |
|---|---|---|
| #103 | The app's final polish, with `main` merged in through #123 and Cynthia's three asks done (the points rule under the guess squares, "write your answers on the map", an audio line that promises only what we control; the facts are in the PR body). Plus the review fixes of Oct 22 night: the mic hands over between fields cleanly and ignores a second tap during the start, the coach is asked on a second session, Try again sends the map or the guess as it is on screen, Delete my data never sticks. Tests: app 49/49, api 42 + 1 skipped, agents 102/102; tsc clean. Native module inside, and `eas fingerprint:compare` says this tree matches build 3, so merging keeps `main` on build 3's runtime | Cynthia's review and merge. Leo's real-microphone test on the phone has not happened yet; the phones already run this code through the preview updates, so the merge changes nothing on them. Cynthia's timing rule stands: tonight, or after Oct 23, never on tester day |
| #104 | `npm run export:testers -w api` (the grading sheet's rows and the maps to grade, pseudonyms only, #50) and `npm run smoke -w api` (#45, #37). Reviewed by Cynthia on Oct 22 | Cynthia's merge |
| #124 | API: a Turn with `error` saves nothing (it wrote the stale session and mastery back), mastery is written only for the moves the Turn changed (every turn wrote all four from a seconds-old copy, so another session's level-up could go back down), and `REQUESTS_PER_MINUTE` (the limit is per IP; a room shares one; 60 when unset). api 43 pass + 1 skipped, tsc clean. Three smaller things seen and left for after Oct 23 are in the PR body | Cynthia's review and merge. Render deploys `main` on merge |
| #106 | The final README (#55), rewritten Oct 23 in plain words for judges and organizers: what Lumente is and who it's for, why, how a session works, the idea behind it, mission and vision, how to try it, the judging criteria, the prize tracks. A hero image and four screenshots from demo mode. Setup, tests and team rules moved to `docs/developers.md`; `main` merged in. Draft until the freeze; the PR body lists 8 `TODO(Cynthia)` items (links, pilot numbers, names, disclosures, wording) | Cynthia fills the TODOs and merges after the freeze |

Merged on Oct 22: #79, #81, #82, #88 to #100, #102, #105, #107 to #111, #113 to #123.

## Open on Cynthia

1. **Merge order: done.** #104, #124 and #103 merged early on Oct 23, in that order, with every check green on
   the merged result first (agents 102/102, api 47 pass + 1 skipped, app 49/49, tsc clean). Then, from `main` at
   `d0d4a25`: `ship.yml` run by hand (the `preview` update for build 3 and the production web), and the
   `testers` alias redeployed with the `production` environment. Both addresses checked for the new screens
   (Your data, "Ask me a fact", the result's level-up marks, the new headline); `/health` 200.
2. **Password at sign-up: decided,** email code and Google only (Cynthia, Oct 22). Leo turns the password off in
   the Clerk dashboard before the testers sign up.
3. **The Expo GitHub app:** after the testers (Cynthia). Until then `ship.yml` runs by hand.
4. **#59: closed** on Oct 22: one Claude key for production and development (Cynthia).
5. The slow `evaluator_full` turn: lower the effort first, then Sonnet for the questioner and the hint giver
   (plan, section 10). Prompts and effort are hers. Related, from the #124 review: the Anthropic client runs
   with a 30 s timeout and one retry, so a hung call holds a learner for about a minute before the error Turn.
6. #112 (Agent Memory, Leo's build): **built, Oct 23**, draft PR #130 on `leo/memory-build`. The `Message.sources`
   shape works and is in the PR (the two optional fields and the two-line copy in `advance.ts`, hers to keep or
   replace). The live smoke (`npm run memory:smoke -w api`) passes all 8 checks against the `lumente` context.
   Waits on her review; the flag stays off in production until the app update ships, then Render. The kill
   rule is Oct 24 noon.

## Open on Leo

- A full session on his phone with voice, and on the web with a real microphone.
- Clerk's Android tab: the package `ca.buildnorth.realitycheck` and build 3's SHA-256, so Google sign-in works
  on the phone. Email code works without it.
- After #103 merges: the production web deploy (above), and one `ship.yml` run by hand. Done early on Oct 23 (above).
- **Oct 23, #129** (`leo/alive-polish`, review requested from Cynthia): the firefly's light answers hover and touch, and five fixes from a review of `main` (a mic that could stay stuck, Send mid-phrase, the timeout's words at 90 s, Try again keeping the notes, sign-out). App only, fingerprint unchanged. Leo's standing OK: as soon as it merges, a `preview` update from `main` and the production and `testers` web redeploys, logged in `docs/expo-log.md`. Merged at 11:45 AM; as of 1:30 PM not live anywhere (the `preview` channel's newest update is #127, the production web bundle has no #129 code), so one rollout after #133 carries #129, #130, #132 and #133 together.
- **Oct 23, #133** (`leo/expo-polish`, review requested from Cynthia, `main` merged in through #132): the web build installs as a web app on iPhones and laptops (manifest, icons, Apple metas), every page has a link card (`og.png`), the update notice checks again on the foreground and when Start is shown (once a minute), Your data ends with the running version and update, Observe gets a marker on the session route and the crashes a learner recovers from. JavaScript and web only, fingerprint unchanged. Tests on the merged tree: app 57/57, api 60 + 1 skipped, agents 103/103; tsc clean. Not checked on a device: a real iPhone's Add to Home Screen, an Android release build.
- **Oct 23, #137** (`leo/resume-session`, review requested from Cynthia, from `main` at `99880ae`): a session survives a reload or a killed app (the device keeps the session's id, mode, notes and the level-5 map; Start offers to resume it from `GET /sessions/:id`; the record goes when the session ends, on Delete my data and on sign-out; demo mode keeps nothing), Share on the result, and the prompt's Copy button says when a browser refused the clipboard. JavaScript only; `eas fingerprint:compare` against build 3: match. Tests: app 62/62, api 60 + 1 skipped, agents 103/103; tsc clean; the export builds. Walked in a browser against a scripted API. Not checked: the file on an Android build (every storage call swallows its errors). Ships as a `preview` update plus the two web redeploys once it merges, at a time that doesn't split a tester's pre-test from their post-test.
- **Oct 23, 3:30 PM, Cynthia's #136** (`cynthia/ux-guidance`: the prediction picker, the map-first self-test, the collapsed fact chat, the hint confirmation, Expo's ESLint): merges cleanly with #137 (the two together: app 64/64, tsc clean, the export builds). **But it changes the fingerprint**: `eas fingerprint:compare` on the merged tree answers `7e43f635…`, not build 3's `56eeb40f…`, because the fingerprint includes `package.json` `scripts` and #136 adds `"lint": "eslint src"`. Once it merges as is, no update from `main` reaches the testers' phones (build 3 ignores a runtime it doesn't know), and the web keeps moving. The fix is one line: drop the `lint` script and document `npx eslint src` instead, or hold #136 for the Oct 24 production build. Also: the root `package-lock.json` gains ESLint; Render runs `npm ci` from it.
- Oct 23: `npm run smoke -w api` in the morning (#37), on call for the API, fixes as `eas update` from a branch
  whose fingerprint matches build 3 (`main` after #103, or `leo/final-polish` before); after the post-tests,
  `npm run export:testers -w api` against `prod` (#50).
- Oct 24, before 6 PM: #112 is built (#130, waits on review); if merged, Ship first, then `AGENT_MEMORY_ENABLED=true`
  on Render, else the kill rule at noon; the `production` Android build, the last update and web deploy,
  Render Auto-Deploy off, the freeze summary on #45.

## Closed on Oct 22

#28 and #23 with evidence; #101 (superseded by #103). #10 and #27 have the evidence in a comment and wait for
their owners to close. #43 closes with #103.
