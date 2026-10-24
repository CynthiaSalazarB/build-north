---
title: "Submission checklist: what Devpost and each prize ask for"
type: context
related: ["[[plan-to-win]]", "[[surrealdb-sponsor-prize]]", "[[status-oct22]]"]
created: 2026-10-22
updated: 2026-10-22
---

Read from the hackathon's Overview, Rules and Resources pages and SurrealDB's participant pack on Oct 22
(Sources, below). One Devpost page holds the whole submission. Each line has an owner and a date; tick it
in a pull request when it's done.

## The dates

- **Submit by Oct 25, 11:59 PM ET** (Devpost shows "26 Oct 2026 @ 12:00am EDT"). Our target is 9 PM, so
  there's time to fix a broken link (#53).
- The top 10 are announced **Oct 26**. Demo Day is **Oct 29 in Toronto**, and at least one of us must be
  there in person: Cynthia and Kyle go.

## Who can enter

- [x] **Everyone on the team is 18 or older and lives in Canada** (Rules: "You must be 18 or older and
  live in Canada"). Confirmed by Cynthia on Oct 22: all four, in Toronto.
- [x] Four people at most, one submission per team.
- [x] Built during Build Week, with prior work, templates and AI tools disclosed (below).

## What the page must include

| Item | What Devpost says | Owner | Date | Status |
|---|---|---|---|---|
| Public GitHub repo | "Your code, visible to judges and anyone else who wants to look." | Cynthia | done | public since Oct 19 |
| Live link | "A deployed app, App Store listing, or test build" | Leo | Oct 24, at the freeze | https://lumente.expo.app and the APK page |
| Demo video | Optional; "Four minutes or less, shareable link, no login required. Show what you built, how it works, and the key technology behind it." We plan 3:00 | Kyle (#48), script by Cynthia's Claude | Oct 24 evening, on the frozen build | |
| Write-up | "What you built and why, your tech stack, and which partner platforms you used and how" | Cynthia and Kyle (#30, #51) | draft Oct 24 noon, numbers Oct 25 | |
| Team | "List every team member by name, up to four." | Kyle | Oct 25 | |
| Disclosure of prior work | Templates or scaffolding, and anything that existed before Build Week: say what was built during the week | Cynthia | Oct 25 | `create-expo-app`'s default template (SDK 58), the fonts, Claude and Claude Code; the README carries it (#106) |
| Categories | Best Overall, Best Use of Expo, Best Use of Clerk, Best Use of SurrealDB Agent Memory (Eon skipped) | Kyle | Oct 25 | |

## What each prize looks for

All four category prizes: "judges will look for evidence that the platform materially shaped what you
built". The write-up shows that evidence with a screen, a file and a test for each.

| Prize | The ask, in Devpost's words | Our evidence | Owner |
|---|---|---|---|
| Best Overall | Open to any project; judged on the five criteria below | The whole page | Cynthia and Kyle |
| Best Use of Expo | "build it with Expo's React Native tooling. Use the SDK, ship with Build or Update, whichever fits your project" | `docs/expo-log.md`: EAS Build (the APK), EAS Update, EAS Hosting, Expo Router on Android and the web | Leo |
| Best Use of Clerk | "use Clerk rather than building this from scratch. Sign-up, sign-in, multi-factor authentication, and social login all qualify" | `docs/clerk.md`: email code and Google, the token checked without a network call, rows keyed by the Clerk id | Leo |
| Best Use of SurrealDB Agent Memory | "If your agent needs memory, use SurrealDB Agent Memory." The pack: "typed, time-aware facts you can query by relationship or by similarity, and trace back to where they came from" | #112 (the build), the Memory sheet, `verifyCites`; a short memory section in the write-up. Built Oct 23 (draft PR #130, the live smoke passes); the flag stays off until the app update ships, then Render. Kill rule: not merged and on by Oct 24 noon means we don't claim it | Leo (build), Cynthia (write-up, review) |

SurrealDB's pack asks for nothing extra at submission: no form, no key for its judges. Each of us can
redeem $50 of Agent Memory credit (`BUILDNORTH50` in Studio, Billing).

## The judging criteria

Innovation; Real-World Impact ("Clear user, value-add, and a path to production"); UI & Design ("Usable
by a real user, thoughtful and effective UI elements"); Tech & Deployment ("Solid architecture, tech
stack, and deployed, serving features"); Security & Ethics ("Responsible applications, guardrails, and safe
handling of user data"). No weights are published. Before submitting, check the write-up has evidence for
each one, and answers the three questions the Overview asks: who the user is, specifically; the value-add,
stated plainly; a credible path to production.

## Rules to keep in mind

- No faked demo. Demo mode replays a recorded session, and on Demo Day it has to be called a replay
  (`app/src/session/fixture-client.ts`).
- The repo, the video and the Devpost page are public, and Georgian and the partners may show them.
  No tester names or emails anywhere (`docs/tester-protocol.md`).
- Demo Day is photographed and filmed; anyone who wants out tells the organizers before the event.

## Sources

- [Build North overview](https://build-north.devpost.com/), [rules](https://build-north.devpost.com/rules)
  and [resources](https://build-north.devpost.com/resources), read Oct 22
- [SurrealDB Build North participant pack](https://surrealdb.notion.site/Build-North-SurrealDB-participant-resources-pack-3edbfa44ae3e81a0a6ebd0b4fbb802d3), read Oct 22
