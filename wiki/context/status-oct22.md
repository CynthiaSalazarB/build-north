---
title: "Status, Oct 22 night: what is live, what is open, and who holds it"
type: context
related: ["[[plan-to-win]]", "[[expo-prize-plan]]", "[[hosting-setup]]"]
created: 2026-10-22
updated: 2026-10-22
---

Where Leo's side stands late on Oct 22, written for the next session that opens this repo (Cynthia's
Claude included). Numbers and links only; no secrets, no tester names. Every item names who holds it.
The first thing to do is the merge order under "Open on Cynthia".

## Live

| Piece | State | Evidence |
|---|---|---|
| API | `main`, auto-deployed on merge, Render Starter (no cold start). `/health` 200 in about 0.2 s; `/health/db` writes to `prod` as the database-level user (`SURREAL_USER=api`, auth level `database`); no token and dev headers both answer 401; CORS allows `https://reality-check.expo.app` and the `testers` alias | `npm run smoke -w api` (PR #104): 7 of 7 checks pass on prod, Oct 22 at 9 PM |
| Web, production and `testers` | https://reality-check.expo.app and https://reality-check--testers.expo.app, EAS Hosting, both from `main` (last at `5932b76`, #120). Render runs `main`, so they move together. Neither has #103 (the polish) yet | `docs/expo-log.md`; `npm run smoke -w api` passes on both. After #103 merges: `eas env:exec production "expo export --platform web"` and `eas deploy --prod` from `app/` (Leo, approved) |
| Web, test alias | https://reality-check--polish.expo.app: the #103 build at `7306df1` in demo mode (no API, no Clerk): the website layout, "Your data", the mic, the review fixes | A new address with the API would need its own `CORS_ORIGIN` row on Render |
| Android | `preview` APK, build 3 on the `lumente` project, runtime `56eeb40f…`: [download](https://expo.dev/artifacts/eas/LVkBl_worJBs2ro5p6z9vFa1XtYyA992vF3QrkSzG_A.apk). Five EAS Updates on the `preview` channel followed it on Oct 22; the latest, group `77f667d8…` (10 PM), is `leo/final-polish` at `7306df1` with `main` through #123 and the review fixes. The APK takes it on its second launch | `docs/expo-log.md`; `eas fingerprint:compare --build-id 93910cdd…` says the build and `leo/final-polish` match, and the update manifest for channel `preview` resolves to `77f667d8…` |
| Demo account | Leo's Google account, seeded in `prod`: level 5 on all four parts and a CORS session waiting at the whole map | `npm run seed:demo -w api` from a checkout with the prod variables |
| First real session on prod | `/turns` median 2.4 s, slowest 10.6 s (the final `evaluator_full`, over the plan's 8 s line), $0.040 for the session | `agent_log` rows, Oct 22 |

## Open pull requests

All three of Leo's are ready for review; one teammate reviews, the merge is the acceptance.

| PR | What | Waits on |
|---|---|---|
| #103 | The app's final polish, with `main` merged in through #123 and Cynthia's three asks done (the points rule under the guess squares, "write your answers on the map", an audio line that promises only what we control; the facts are in the PR body). Plus the review fixes of Oct 22 night: the mic hands over between fields cleanly and ignores a second tap during the start, the coach is asked on a second session, Try again sends the map or the guess as it is on screen, Delete my data never sticks. Tests: app 49/49, api 42 + 1 skipped, agents 102/102; tsc clean. Native module inside, and `eas fingerprint:compare` says this tree matches build 3, so merging keeps `main` on build 3's runtime | Cynthia's review and merge. Leo's real-microphone test on the phone has not happened yet; the phones already run this code through the preview updates, so the merge changes nothing on them. Cynthia's timing rule stands: tonight, or after Oct 23, never on tester day |
| #104 | `npm run export:testers -w api` (the grading sheet's rows and the maps to grade, pseudonyms only, #50) and `npm run smoke -w api` (#45, #37). Reviewed by Cynthia on Oct 22 | Cynthia's merge |
| #124 | API: a Turn with `error` saves nothing (it wrote the stale session and mastery back), mastery is written only for the moves the Turn changed (every turn wrote all four from a seconds-old copy, so another session's level-up could go back down), and `REQUESTS_PER_MINUTE` (the limit is per IP; a room shares one; 60 when unset). api 43 pass + 1 skipped, tsc clean. Three smaller things seen and left for after Oct 23 are in the PR body | Cynthia's review and merge. Render deploys `main` on merge |
| #106 | The final README (#55), with `docs/testing-notes.md` for judges and the architecture diagram, Cynthia's memory paragraph merged in. Draft until the freeze; one TODO: the pilot results | A teammate follows it from a clean clone; Cynthia merges after the freeze |

Merged on Oct 22: #79, #81, #82, #88 to #100, #102, #105, #107 to #111, #113 to #123.

## Open on Cynthia

1. **Merge order:** #104 (no runtime change), then #124 (Render deploys it; nothing to set unless the room is
   bigger than five testers, then `REQUESTS_PER_MINUTE` on Render), then #103 when the timing rule allows. After
   #103 merges, Leo redeploys the production and `testers` web from `main` and runs `.eas/workflows/ship.yml`
   once by hand, so the phones take `main`'s JS instead of the branch's.
2. Password at sign-up: Clerk's development instance still requires one. Email code only, or keep the password?
   Testers sign up tomorrow.
3. The Expo GitHub app on the repo (plan decision 11), so `ship.yml` runs on every merge to `main`. Until then
   Leo runs it by hand.
4. Issue #59: everything is done except a separate production Anthropic key (Render uses the same key as dev).
   Say whether a separate key is still wanted, then it closes.
5. The slow `evaluator_full` turn: lower the effort first, then Sonnet for the questioner and the hint giver
   (plan, section 10). Prompts and effort are hers. Related, from the #124 review: the Anthropic client runs
   with a 30 s timeout and one retry, so a hung call holds a learner for about a minute before the error Turn.
6. #112 (Agent Memory, Leo's build): the `Message.sources` shape she proposed waits on Leo's answer; the kill
   rule is Oct 24 noon.

## Open on Leo

- A full session on his phone with voice, and on the web with a real microphone.
- Clerk's Android tab: the package `ca.buildnorth.realitycheck` and build 3's SHA-256, so Google sign-in works
  on the phone. Email code works without it.
- After #103 merges: the production web deploy (above), and one `ship.yml` run by hand.
- Oct 23: `npm run smoke -w api` in the morning (#37), on call for the API, fixes as `eas update` from a branch
  whose fingerprint matches build 3 (`main` after #103, or `leo/final-polish` before); after the post-tests,
  `npm run export:testers -w api` against `prod` (#50).
- Oct 24, before 6 PM: #112 or its kill rule at noon; the `production` Android build, the last update and web
  deploy, Render Auto-Deploy off, the freeze summary on #45.

## Closed on Oct 22

#28 and #23 with evidence; #101 (superseded by #103). #10 and #27 have the evidence in a comment and wait for
their owners to close. #43 closes with #103.
