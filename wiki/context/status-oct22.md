---
title: "Status, Oct 22 evening: what is live, what is open, and who holds it"
type: context
related: ["[[plan-to-win]]", "[[expo-prize-plan]]", "[[hosting-setup]]"]
created: 2026-10-22
updated: 2026-10-22
---

Where Leo's side stands at the end of Oct 22, written for the next session that opens this repo (Cynthia's
Claude included). Numbers and links only; no secrets, no tester names. Every item names who holds it.

## Live

| Piece | State | Evidence |
|---|---|---|
| API | `main`, auto-deployed on merge, Render Starter (no cold start). `/health` 200 in about 0.2 s; `/health/db` writes to `prod` as the database-level user (`SURREAL_USER=api`, auth level `database`); no token and dev headers both answer 401; CORS allows `https://reality-check.expo.app` and the `testers` alias | `npm run smoke -w api` (PR #104): 7 of 7 checks pass on prod, Oct 22 |
| Web, production | https://reality-check.expo.app, EAS Hosting, deployed from `main` at `cafb329`. Does **not** yet have #103 (the polish), #105 or #108 | `docs/expo-log.md`. Redeploy = merge #103, then `eas env:exec production "expo export --platform web"` and `eas deploy --prod` from `app/` (Leo, approved) |
| Web, test alias | https://reality-check--polish.expo.app: the #103 build in demo mode (no API, no Clerk), to look at the website layout, "Your data" and the mic | A new address with the API would need its own `CORS_ORIGIN` row on Render |
| Android | `preview` APK, build 3 on the `lumente` project, Lumente icon and name, voice input, "Your data": [download](https://expo.dev/artifacts/eas/LVkBl_worJBs2ro5p6z9vFa1XtYyA992vF3QrkSzG_A.apk). Three EAS Updates on the `preview` channel followed it today (#105, the sign-in 404 fix, the follow-up fix); the APK takes each on its second launch | `docs/expo-log.md`; `eas fingerprint:compare` says the build and `leo/final-polish` match |
| Demo account | Leo's Google account, seeded in `prod`: level 5 on all four parts and a CORS session waiting at the whole map | `npm run seed:demo -w api` from a checkout with the prod variables |
| First real session on prod | `/turns` median 2.4 s, slowest 10.6 s (the final `evaluator_full`, over the plan's 8 s line), $0.040 for the session | `agent_log` rows, Oct 22 |

## Open pull requests

| PR | What | Waits on |
|---|---|---|
| #99 | Agent Memory contract. Contradicts the Oct 22 decision to skip the SurrealDB Agent Memory prize | Cynthia: close it, or reverse the decision |
| #102 | `docs/clerk.md`, "How Expo shaped Lumente", the challenges | Cynthia's review |
| #103 | The app's final polish: voice input everywhere (one field owns the recognizer, a mic by the level-5 question too), "Your data" with the privacy note and Delete my data (#43), the guess screen as a website, a dark root HTML, no 404 after the phone's sign-in redirect, a follow-up question keeps the answer on screen. Includes #101 (closed). `main` merged in through #105; #108 still to merge in | Leo tests it on the phone and the web, marks it ready; then Cynthia's review. Native module inside: merges before the testers' Android build or after Oct 23, never on tester day |
| #104 | `npm run export:testers -w api` (the grading sheet's rows and the maps to grade, pseudonyms only, #50) and `npm run smoke -w api` (#45, #37) | Cynthia's review |
| #106 | The final README (#55), with `docs/testing-notes.md` for judges (the `+clerk_test` sign-in, code `424242`) and the architecture diagram. Draft until the freeze | A teammate follows it from a clean clone; Cynthia merges after the freeze |

## Open on Cynthia

- Password at sign-up: Clerk's development instance still requires one. Email code only, or keep the password? Testers sign up tomorrow.
- The Expo GitHub app on the repo (plan decision 11), so `ship.yml` runs on every merge to `main` (an update to phones and the web deploy). Until then Leo runs it by hand.
- Issue #59: everything is done except a separate production Anthropic key (Render uses the same key as dev). Say whether a separate key is still wanted, then it closes.
- The slow `evaluator_full` turn: lower the effort first, then Sonnet for the questioner and the hint giver (plan, section 10). Prompts and effort are hers.

## Open on Leo

- A full session on his phone with voice, and on the web with a real microphone, tonight; then mark #103 ready.
- Clerk's Android tab: the package `ca.buildnorth.realitycheck` and build 3's SHA-256, so Google sign-in works on the phone. Email code works without it.
- After #103 merges: the production web deploy (above), and one `ship.yml` run by hand.
- Oct 23: `npm run smoke -w api` in the morning (#37), on call for the API, fixes as `eas update`; after the post-tests, `npm run export:testers -w api` against `prod` (#50).
- Oct 24, before 6 PM: the `production` Android build, the last update and web deploy, Render Auto-Deploy off, the freeze summary on #45.

## Closed today

#28 and #23 with evidence; #101 (superseded by #103). #10 and #27 have the evidence in a comment and wait for their owners to close. #43 closes with #103.
