---
title: "Status, Oct 22 night: what is live, what is open, and who holds it"
type: context
related: ["[[plan-to-win]]", "[[expo-prize-plan]]", "[[hosting-setup]]"]
created: 2026-10-22
updated: 2026-10-24
---

Where Leo's side stands, started late on Oct 22 and kept current since (the latest rows are Oct 24 morning),
written for the next session that opens this repo (Cynthia's Claude included). Numbers and links only; no
secrets, no tester names. Every item names who holds it.

## Live

| Piece | State | Evidence |
|---|---|---|
| API | `main`, auto-deployed on merge, Render Starter (no cold start). **Oct 23, 9:11 PM:** `main` at `7a372bc` with Agent Memory on (`AGENT_MEMORY_ENABLED=true`, the startup line says "Agent Memory: on"; the kill switch is that variable set to anything else, about a minute, no deploy). Since #143, `/health` names the running commit and the memory state, `{"ok":true,"commit":"7a372bc","memory":"on"}`, in about 0.2 s; `/health/db` asks `prod` for its clock as the database-level user (`SURREAL_USER=api`, auth level `database`), read-only; no token and dev headers both answer 401; CORS allows `https://lumente.expo.app`, its `testers` and `review` aliases and, until a day after the rename, the old `reality-check` addresses. **Oct 23, about 11:10 PM:** `main` at `6adbc84` (tonight's merges, #144 to #155), memory on, `/health` → `{"ok":true,"commit":"6adbc84","memory":"on"}`; `REQUESTS_PER_MINUTE=240` (the limit is per IP and a room shares one). Render auto-deploys every merge, so #158 and #159 (app only, `main` at `58f5c52`) went on it after that check. **Oct 24, about 12:45 AM:** `main` at `866c4d0`; Render runs `4264e2c` (#166: a production-looking process without the Claude key or the database refuses to start; #167 is app only), `/health` → commit `4264e2c`, memory on; the API code is unchanged since `6adbc84` | `npm run smoke -w api` (PR #104): 7 of 7 for production and 7 of 7 for `testers` with memory on, Oct 23 at 9:15 PM; `npm run memory:smoke -w api` 8 of 8 on the live context (#37) **Oct 24, about 12:50 AM:** `/health` → commit `a64cc3e` (docs-only merges after `4264e2c`), memory on; `ratelimit-policy` 240 a minute; CORS answers `https://lumente.expo.app`. **Oct 24, about 11:15 AM:** `/health` → `{"ok":true,"commit":"e41669d","memory":"on"}` (#170 and #171 touch docs and `.env.example` only); smoke 7 of 7. **Oct 24, about 11:30 AM:** `AGENT_BUDGET_USD=70` (Leo's call, #20; it was 95), the startup line says "$70 budget", memory on; smoke 7 of 7. **Oct 24, 12:16 PM:** `CORS_ORIGIN` is `localhost:8081` and the three lumente addresses only (Leo and Cynthia's call): `reality-check.expo.app` still loads its old build but can't reach the API; smoke 7 of 7. |
| Web, production and `testers` | https://lumente.expo.app and https://lumente--testers.expo.app (renamed from `reality-check` on Oct 23 at about 10:05 PM, Cynthia's ask; DECISIONS.md), EAS Hosting, both from `main`. **Oct 23, about 11:10 PM:** production redeployed by Ship from `main` at `6adbc84` (`entry-2f254156….js`: the Share link, #153's fixes, #154's light preview, #155's feedback lines); the `testers` alias stays at `179807e`. #158 and #159 (the firefly hovers in place; it rests on the result) merged after that Ship, so the website shows them only after the next one. **Oct 23, about 7:15 PM:** both redeployed from `main` at `179807e` (#136, #139) by Cynthia's side, after `34a285f` (#137) at about 4:25 PM and `99880ae` (#129, #130, #132, #133, #135) at about 12:50 PM. The 12:50 PM one had a five-minute demo-mode window first (12:47 to 12:52 PM, a cached export without `EXPO_PUBLIC_*`), so every export now runs with `--clear` and the bundle is checked before deploying (`docs/deploy.md`).. **Oct 24, about 12:45 AM:** two Ships by hand, from `4264e2c` (`entry-0709beb7….js`) and then `866c4d0` (`entry-50fc3599….js`, serving now): the firefly hover (#158, #159), the copy cuts (#160) with Cynthia's two lines back (#167), thin scrollbars (#164 over #162), demo mode on API only (#163), hover, press, focus and enter motion (#165). The `__common-22c9ff04….js` chunk carries the API host, the Clerk key, `brand.site` and the `fades` rule, the session chunk the new lines, `index.html` the scrollbar rule; smoke 7 of 7. The `testers` alias stays at `179807e` Render runs `main`, so they move together | `docs/expo-log.md`; at 8:55 PM both addresses serve `entry-92d2ccb4….js`, the file a clean export of `179807e` with `production` produces, and `/health` answers 200 **Oct 24, about 12:50 AM:** a third Ship from `a64cc3e` (`entry-8e2c69f5….js`, serving now) carries Cynthia's #168 (tap a lit area to read it again); the session chunk checked for its sheet and #167's lines, the common chunk for the API host, the Clerk key and `brand.site`; smoke 7 of 7. **Oct 24, about 12:52 AM:** Cynthia's side shipped `a64cc3e` too: production `lumente--82mn4udwxe`, and `testers` re-pointed to `lumente--uoy2ddh6ys`, so `testers` no longer sits at `179807e`; at about 11:15 AM both addresses serve `entry-8e2c69f5….js`. |
| Web, test alias | The `polish` alias: the #103 build at `7306df1` in demo mode (no API, no Clerk), deployed Oct 22 for the website layout, "Your data", the mic and the review fixes, all merged since. It was `reality-check--polish.expo.app` until the Oct 23 rename; the old addresses are no longer ours (DECISIONS.md, Oct 23), so if it still answers it is at `lumente--polish.expo.app`. Nothing deployed to it since Oct 22, not checked since the rename | A new address with the API would need its own `CORS_ORIGIN` row on Render |
| Android | `preview` APK, build 3 on the `lumente` project, runtime `56eeb40f…`: [download](https://expo.dev/artifacts/eas/LVkBl_worJBs2ro5p6z9vFa1XtYyA992vF3QrkSzG_A.apk). **Oct 23, about 7:15 PM:** the newest EAS Update on the `preview` channel, group `39faf44b…` (a clean-cache export, the `.hbc` checked for the API host, the Clerk key and #136's scoring text), is `main` at `179807e`; the APK takes it on its second launch. **Oct 23, about 11:10 PM:** group `0aefba2e…` from Ship, `main` at `6adbc84`, runtime `56eeb40f…`, so build 3 takes it. #158 and #159 (the firefly's hover, JavaScript only) merged after that Ship. **Oct 24, about 12:45 AM:** groups `232f9173…` (`4264e2c`) and `069add98…` (`866c4d0`, the newest), runtime `56eeb40f…` unchanged, so build 3 takes them and reach the phones with the next one | `docs/expo-log.md`; at 8:55 PM `eas update:list --branch preview` shows `39faf44b…` on top (commit `179807e`), and `eas fingerprint:compare --build-id 93910cdd…` says `main` at `179807e` still matches the build **Oct 24, about 12:50 AM:** group `f25d59ea…` (`a64cc3e`, #168), runtime `56eeb40f…`, so build 3 takes it. **Oct 24, about 12:52 AM:** Cynthia's side published group `cdf3bcfc…` from the same `a64cc3e`, the newest on `preview` at about 11:15 AM; same runtime, so build 3 takes it. |
| Demo account | Leo's Google account, seeded in `prod`: level 5 on all four parts and a CORS session waiting at the whole map | `npm run seed:demo -w api` from a checkout with the prod variables |
| First real session on prod | `/turns` median 2.4 s, slowest 10.6 s (the final `evaluator_full`, over the plan's 8 s line), $0.040 for the session | `agent_log` rows, Oct 22 |

## Open pull requests

**Update, Oct 23 early:** #104, #124 and #103 are merged (see "Open on Cynthia", item 1); #106 stays a draft
until the freeze.

**Update, Oct 23 night:** #144 to #159 are merged (`git log main`): the SurrealDB evidence page and memory unit
tests (#144), the baseline level fact and fact dates in the team's zone (#147), the old-name sweep (#150), the site
at `lumente.expo.app` (#151), the Devpost and demo-script drafts (#152), the judge-facing polish (#153), the guess
light (#154), the feedback line above the next question (#155), the status page and log rows (#146, #148, #157)
and the firefly's hover (#158, #159). #106 is the one open PR, still a draft.

All three of Leo's are ready for review; one teammate reviews, the merge is the acceptance.

| PR | What | Waits on |
|---|---|---|
| #103 | The app's final polish, with `main` merged in through #123 and Cynthia's three asks done (the points rule under the guess squares, "write your answers on the map", an audio line that promises only what we control; the facts are in the PR body). Plus the review fixes of Oct 22 night: the mic hands over between fields cleanly and ignores a second tap during the start, the coach is asked on a second session, Try again sends the map or the guess as it is on screen, Delete my data never sticks. Tests: app 49/49, api 42 + 1 skipped, agents 102/102; tsc clean. Native module inside, and `eas fingerprint:compare` says this tree matches build 3, so merging keeps `main` on build 3's runtime | Cynthia's review and merge. Leo's real-microphone test on the phone has not happened yet; the phones already run this code through the preview updates, so the merge changes nothing on them. Cynthia's timing rule stands: tonight, or after Oct 23, never on tester day |
| #104 | `npm run export:testers -w api` (the grading sheet's rows and the maps to grade, pseudonyms only, #50) and `npm run smoke -w api` (#45, #37). Reviewed by Cynthia on Oct 22 | Cynthia's merge |
| #124 | API: a Turn with `error` saves nothing (it wrote the stale session and mastery back), mastery is written only for the moves the Turn changed (every turn wrote all four from a seconds-old copy, so another session's level-up could go back down), and `REQUESTS_PER_MINUTE` (the limit is per IP; a room shares one; 60 when unset). api 43 pass + 1 skipped, tsc clean. Three smaller things seen and left for after Oct 23 are in the PR body | Cynthia's review and merge. Render deploys `main` on merge |
| #106 | The final README (#55), with `docs/testing-notes.md` for judges and the architecture diagram, Cynthia's memory paragraph merged in. Draft until the freeze; one TODO: the pilot results | A teammate follows it from a clean clone; Cynthia merges after the freeze |

Merged on Oct 22: #79, #81, #82, #88 to #100, #102, #105, #107 to #111, #113 to #123.

## Open on Cynthia

1. **Merge order: done.** #104, #124 and #103 merged early on Oct 23, in that order, with every check green on
   the merged result first (agents 102/102, api 47 pass + 1 skipped, app 49/49, tsc clean). Then, from `main` at
   `d0d4a25`: `ship.yml` run by hand (the `preview` update for build 3 and the production web), and the
   `testers` alias redeployed with the `production` environment. Both addresses checked for the new screens
   (Your data, "Ask me a fact", the result's level-up marks, the new headline); `/health` 200.
2. **Password at sign-up: done Oct 24, about 11:25 AM,** email code and Google only (Cynthia, Oct 22). Clerk's
   "Sign-up with password" is off; its public settings say the password is not required.
3. **The Expo GitHub app:** after the testers (Cynthia). Until then `ship.yml` runs by hand.
4. **#59: closed** on Oct 22: one Claude key for production and development (Cynthia).
5. The slow `evaluator_full` turn: lower the effort first, then Sonnet for the questioner and the hint giver
   (plan, section 10). Prompts and effort are hers. Related, from the #124 review: the Anthropic client runs
   with a 30 s timeout and one retry, so a hung call holds a learner for about a minute before the error Turn.
6. #112 (Agent Memory, Leo's build): **done.** #130 merged on Oct 23 and shipped with the 12:50 PM rollout; the
   flag went on in production at 9:11 PM (the kill rule, Oct 24 noon, was met). The live smoke
   (`npm run memory:smoke -w api`) passes all 8 checks against the `lumente` context. Since then: the evidence
   page with the three criteria, code pointers and unit tests (`wiki/context/surrealdb-sponsor-prize.md`, #144),
   and #147, so a part's first finished session leaves its level row even when no level moved (the demo account
   at level 5 everywhere included) and fact dates read in the team's zone.

## Open on Leo

- A full session on his phone with voice, and on the web with a real microphone.
- Clerk's Android tab: the package `ca.buildnorth.realitycheck` and build 3's SHA-256, so Google sign-in works
  on the phone. Email code works without it. **Done Oct 24, about 11:55 AM:** namespace `android_app`, the package
  and build 3's upload-keystore SHA-256 (`79:D0…9B:E3`, from Expo → Credentials); Clerk's public
  `/.well-known/assetlinks.json` lists them. Not yet tried on a phone.
- After #103 merges: the production web deploy (above), and one `ship.yml` run by hand. Done early on Oct 23 (above).
- **Oct 23, #129** (`leo/alive-polish`, review requested from Cynthia): the firefly's light answers hover and touch, and five fixes from a review of `main` (a mic that could stay stuck, Send mid-phrase, the timeout's words at 90 s, Try again keeping the notes, sign-out). App only, fingerprint unchanged. Leo's standing OK: as soon as it merges, a `preview` update from `main` and the production and `testers` web redeploys, logged in `docs/expo-log.md`. Merged at 11:45 AM; as of 1:30 PM not live anywhere (the `preview` channel's newest update is #127, the production web bundle has no #129 code), so one rollout after #133 carries #129, #130, #132 and #133 together.
- **Oct 23, #133** (`leo/expo-polish`, review requested from Cynthia, `main` merged in through #132): the web build installs as a web app on iPhones and laptops (manifest, icons, Apple metas), every page has a link card (`og.png`), the update notice checks again on the foreground and when Start is shown (once a minute), Your data ends with the running version and update, Observe gets a marker on the session route and the crashes a learner recovers from. JavaScript and web only, fingerprint unchanged. Tests on the merged tree: app 57/57, api 60 + 1 skipped, agents 103/103; tsc clean. Not checked on a device: a real iPhone's Add to Home Screen, an Android release build.
- **Oct 23, #137** (`leo/resume-session`, review requested from Cynthia, from `main` at `99880ae`): a session survives a reload or a killed app (the device keeps the session's id, mode, notes and the level-5 map; Start offers to resume it from `GET /sessions/:id`; the record goes when the session ends, on Delete my data and on sign-out; demo mode keeps nothing), Share on the result, and the prompt's Copy button says when a browser refused the clipboard. JavaScript only; `eas fingerprint:compare` against build 3: match. Tests: app 62/62, api 60 + 1 skipped, agents 103/103; tsc clean; the export builds. Walked in a browser against a scripted API. Not checked: the file on an Android build (every storage call swallows its errors). Ships as a `preview` update plus the two web redeploys once it merges, at a time that doesn't split a tester's pre-test from their post-test. **Shipped** at about 4:25 PM from `main` at `34a285f` (update group `9742677e…`; `docs/expo-log.md`).
- **Oct 23, 3:30 PM, Cynthia's #136** (`cynthia/ux-guidance`: the prediction picker, the map-first self-test, the collapsed fact chat, the hint confirmation, Expo's ESLint): merges cleanly with #137 (the two together: app 64/64, tsc clean, the export builds). **But it changes the fingerprint**: `eas fingerprint:compare` on the merged tree answers `7e43f635…`, not build 3's `56eeb40f…`, because the fingerprint includes `package.json` `scripts` and #136 adds `"lint": "eslint src"`. Once it merges as is, no update from `main` reaches the testers' phones (build 3 ignores a runtime it doesn't know), and the web keeps moving. The fix is one line: drop the `lint` script and document `npx eslint src` instead, or hold #136 for the Oct 24 production build. Also: the root `package-lock.json` gains ESLint; Render runs `npm ci` from it. **Update, 6:55 PM:** #136 merged without the `lint` script (ESLint stays as two devDependencies), so `main` at `179807e` still matches build 3, and it shipped at about 7:15 PM (update group `39faf44b…`).
- Oct 23: `npm run smoke -w api` in the morning (#37), on call for the API, fixes as `eas update` from a branch
  whose fingerprint matches build 3 (`main` after #103, or `leo/final-polish` before); after the post-tests,
  `npm run export:testers -w api` against `prod` (#50).
- Oct 24, before 6 PM: an Android build only if the fingerprint changed, and then with the `preview` profile, since
  every phone is on the one `preview` channel (DECISIONS.md, Oct 23, "One update channel for every phone"; `main`
  still matches build 3, so as of Oct 23 night no build is needed); the last update and web deploy (one Ship, which
  also carries #158 and #159); Render Auto-Deploy off; the freeze summary on #45. #112 is done early: #130 shipped
  with the 12:50 PM rollout on Oct 23, and `AGENT_MEMORY_ENABLED=true` has been on in production since Oct 23 at
  9:11 PM.

## Closed on Oct 22

#28 and #23 with evidence; #101 (superseded by #103). #10 and #27 have the evidence in a comment and wait for
their owners to close. #43 closes with #103.
