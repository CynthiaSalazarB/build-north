---
title: "Expo prize plan"
type: synthesis
related: ["[[plan-to-win]]"]
created: 2026-10-20
updated: 2026-10-21
---

How we go after Best Use of Expo. The main plan ([plan-to-win](plan-to-win.md), section 4) has the short
version; this page has the steps, the config, the judge's path and the evidence. Everything external was
checked against Expo's, Apple's and Clerk's docs on Oct 20 (sources at the end). It's a proposal:
Cynthia decides, and the owners below are suggestions.

Nobody can promise the prize: we can't see the other entries. What we can do is leave no doubt that Expo
shaped the build, make the app excellent on a phone, and make both easy to see in two minutes.

## 1. What the judges will look for

- **The prize.** Expo asks for an app built with its React Native tooling that uses the SDK and ships
  with EAS Build or EAS Update, so the platform does real work in the stack, and judges look for evidence
  that it shaped the build. Devpost names no Expo judge. The write-up has to say which partner platforms
  we used and how, and a test build counts as a live link.
- **How Expo judges its own awards.** The Expo team judges the Expo App Awards by hand, on design,
  technical excellence, performance, innovation and feel. Entrants explain the technical details, and an
  app's fame or revenue doesn't count.
- **What their winners had in common.** The 2025 winners and finalists with public write-ups (Callie,
  Lingvano, Partiful, Phantom) all ship with EAS Build and over-the-air updates, on top of real native
  work: animation on the UI thread, Continuous Native Generation, deep links, custom native modules,
  fingerprinted updates. Lingvano also has a web version.
- **Past hackathon Expo prizes.** Hack the North 2026's Expo prize for the best mobile experience went to
  Cospray, AR graffiti pinned to real places, with a custom AR module and a write-up that lists every
  Expo module it used (sensors, camera, audio, haptics, location, notifications with its own config
  plugin, widgets). HackPrinceton's Spring 2025 Expo prize went to capitalX, an AI credit card manager.
  Both lean on the device.

Our read, in order of weight:

1. **It feels native:** motion, haptics, native sheets and controls, speed, accessibility (Pillar 3).
2. **Expo does what Expo Go can't:** development builds, config plugins, many SDK modules, and one native
   surface outside the app, like a home screen widget (Pillars 3 and 4).
3. **A real release pipeline, shown working:** an installable build, an update pushed and picked up, a
   workflow doing it on every merge (Pillars 1 and 5).
4. **A write-up that lists every Expo piece** and the job it does (Pillar 5).
5. **The newest features, where they fit** (Pillar 4).
6. **Signs it could run in production:** startup and crash monitoring with Expo Observe, the web build on
   EAS Hosting (Pillars 1 and 4).

Our app is about thinking, not sensors, so it won't out-native an AR app. Our edge is a complete,
polished product that uses Expo end to end, from the first build to the fix a tester gets the same
evening, and a write-up that makes that plain.

## 2. Where we stand on Expo (Oct 20)

Update, Oct 21: #80 adds the EAS project, `eas.json`, EAS Update, Expo Observe and the workflows, and
#81 adds the brand icon and splash. The main plan's section 4 has the current status. The team also
decided against an Apple account, so the native app is Android only and iPhones use the web build.

**Already in the code** (Cynthia's `cynthia/4-expo-app` and #75 on top of it):

- Expo SDK 58, React Native 0.88, React 19.3. SDK 58 came out days ago, so we're on the newest SDK.
- Expo Router with typed routes, and the React Compiler on.
- One codebase for iOS, Android and the web: static web output, and platform files where the platforms
  differ (`sign-in.web.tsx` shows Clerk's prebuilt sign-in, `sign-in.tsx` the hosted one on phones).
- `Stack.Protected` routes: a signed-out learner only sees sign-in.
- Native settings only through config plugins in `app.json` (`expo-router`, `expo-splash-screen`,
  `@clerk/expo`, `expo-secure-store`, `expo-web-browser`): no `ios/` or `android/` folders to maintain.
- The app shares its contracts with the API: it imports the Zod schemas from `@build-north/agents`
  through the npm workspace and checks every `Turn` it receives, so a server that drifts fails loudly.
- `npx expo-doctor` on #75's branch: 20 of 20 checks pass.

**Missing:** no EAS project, build, update, web deploy or workflow yet; the app icon, splash and some
images are still the template's; no level-5 screen. And today nobody outside the team can try the app
on a phone: Expo Go for SDK 58 isn't in the stores yet, and Expo Go only opens projects your own account
owns. No path exists for iPhones yet either.

## 3. Pillar 1: ship it the Expo way

Done in #80 on Oct 21. The config lives in the repo, so this section says what it is and what's left.

- The EAS project is `@leo_atienza/reality-check`, under Leo's Expo account until the team's
  organization exists. Project settings, then Transfer project, moves it.
- `app.json` has the Android package `ca.buildnorth.realitycheck` and no iOS config. The `fingerprint`
  runtime policy means an update only reaches builds with the same native code, and
  `"web": { "output": "static" }` stays, since SDK 58 defaults to server output.
- `app/eas.json` has `development` (the dev client) and `preview` and `production` (APKs with
  internal distribution, each with its own channel and EAS environment). The build number counts up
  by itself.
- `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` are EAS environment variables in all
  three environments. Both are public. `EXPO_PUBLIC_DEV_KEY` never goes there.
- `app/.eas/workflows/` has Ship (an update on `preview` and the web deploy, on every merge to `main`)
  and Preview build (a new APK only when the fingerprint changed). The push trigger needs the Expo
  GitHub app, which only Cynthia can install, so until then `eas workflow:run` runs them by hand.
- The commands are in `app/README.md`, and every build, update and deploy goes in `docs/expo-log.md`.

The free plan gives 15 Android builds a month, so builds are rare and updates are frequent:

| Build | For | When |
|---|---|---|
| Android `development` | Our own phones, since Expo Go can't run SDK 58 yet | Oct 21 |
| Android `preview` (APK) | Testers, judges and Kyle's demo phone | Oct 21, built from #81, so it has the brand icon and splash |
| Android `production` (APK) | The frozen build | Oct 24, 6 PM |

Each merged app change goes out with `eas update --channel preview --environment preview` (the
environment flag is required since SDK 55). The web build goes out with `npx expo export --platform
web`, then `eas deploy --prod`, to `https://reality-check.expo.app`, which joins the API's `CORS_ORIGIN`
once #64 is live. Until then a copy in demo mode is up for review at
`https://reality-check--review.expo.app`.

## 4. Pillar 2: reach every judge

| A judge with | Gets the app through | What we give them |
|---|---|---|
| An Android phone | The `preview` APK (EAS internal distribution) | The install link and a QR code on Devpost and in the README, with one line about allowing the install |
| An iPhone or a laptop | The web build on EAS Hosting, which installs as a web app | `https://reality-check.expo.app`, with a page title, description and card from `generateMetadata()` so the link previews well. Share, then "Add to Home Screen": Lumente opens full screen with its own icon (`public/manifest.json`, `+html.tsx`) |
| No time | The video | Three minutes at most |

There's no TestFlight: on Oct 21 the team decided against an Apple Developer account, since Apple's
review takes too long for this week. If that changes after Build North, the steps are in this file's
history (f73bcd6).

### Signing in

Judges sign up with their own email and a code. Two limits of Clerk's development instance matter: it
sends at most 100 emails a calendar month (codes stop after that), and it holds at most 100 users. Two
fixes: ask Clerk support to raise the email limit before Oct 25 (they can), and put a fallback in
Devpost's testing notes. On a development instance, any address with `+clerk_test` in it (for example
`judge+clerk_test@example.com`) gets no email and signs in with the code `424242`. Anyone who reads the
notes can use it, so the instance should only ever hold demo data.

## 5. Pillar 3: make it feel native

Cynthia asked on Oct 21 which Expo features fit the app. This is the answer for Android and the web,
the two places we ship. Each one does a job the learner notices.

| What the learner gets | Expo piece | Status |
|---|---|---|
| Newsreader for titles, questions and the conversation | `expo-font` with `@expo-google-fonts/newsreader` | Done in #81 |
| The brand icon, Android's adaptive and themed icons, the splash | `app.json`, `expo-splash-screen` | Done in #81 |
| A tick when the guess changes and a success at a level-up, nothing else | `expo-haptics`: Android's own haptics, the Vibration API on the web (iPhone Safari has none) | Done in #81 |
| The drawn icons, the arch, the beam and the bronze | `react-native-svg` | Done in #81 |
| The dawn after the guess and the points casting into bronze, as fades with Reduce Motion | Reanimated | Done in #81 |
| Launch times and crashes from the APK, release by release, including the crashes a learner recovers from with Try again | Expo Observe (Android release builds; nothing on the web): `ObserveRoot`, a marker on each screen, `Observe.reportError` in the error boundary | Done in #80, the marker and the report in #PR |
| The fact desk at level 5 as a half-height sheet over the map | `@expo/ui`'s `BottomSheet`, which also works on the web. Expo Router's form sheet shows as a plain page there | In #26 (Cynthia) |
| "Update ready: restart", so testers see a fix arrive, also while the app is open: it checks again when it comes back to the foreground and when Start is shown again, at most once a minute | `expo-updates` with `useUpdates()` and `checkForUpdateAsync()` (release builds; nothing on the web) | Done in #81, the live check in #PR |
| Page titles and descriptions, so the link previews well, with a card (`public/og.png`) for a link shared in a chat | `generateMetadata()` from Expo Router, `openGraph` and `twitter` | Done in #92, the card in #PR |
| On an iPhone or a laptop, Lumente installs from the browser as a web app: its own icon, full screen, no address bar | `public/manifest.json` and the icons, copied into the static export; the Apple metas in `+html.tsx` | Done in #PR |
| In Your data, what is running: the version and the EAS Update it is on, so a tester or a judge can name what they saw and we find it in the dashboard | `expo-updates` (`updateId`, `createdAt`, `channel`) and `expo-constants` | Done in #PR |
| The question read aloud | `expo-speech` (Android and the web) | Only if we're ahead, and only in the Oct 24 production build: it is a native module |

We skip glass (`expo-glass-effect` only works on iOS 26 and later, and draws a plain view elsewhere) and
dark mode this week.

## 6. Pillar 4: use what Expo just shipped

SDK 58 came out on Oct 15, and Expo's team will notice who used it well. We only take what serves the
learner.

| Feature | Verdict |
|---|---|
| Expo Observe | Done in #80 |
| EAS Update rollouts and the `useUpdates()` banner | Do: a risky fix goes to some phones first, and the banner shows it arriving |
| A home screen widget on Android (`expo-widgets`, new in SDK 58) | Only if Pillars 1 to 3 are done by Oct 23. It needs a new build |
| Expo UI (Jetpack Compose components) | Skip: it has no stepper, and the design's guess stepper does the job |
| App Intents (Siri, Shortcuts, Spotlight) | Skip: iPhone only |
| PostHog through EAS | Skip: we promise to store only what learning needs |
| Native tabs, data loaders | Skip: Lumente has no tab bar, and loaders are for the web |

Checked again on Oct 23 against the SDK 58 changelog: anything that adds a native module (`expo-speech` for the
question read aloud, `expo-clipboard` for a Copy button, `expo-widgets`, `@expo/ui`) changes the fingerprint,
so build 3 would stop taking updates from `main`. None of it goes in before the testers finish; if any of it
goes in, it all goes into the one production build on Oct 24, and `eas fingerprint:compare` says so first.
JavaScript-only pieces (the live update check, the version line, the Observe markers and error report, the
installable web app and the link card) ship as updates and web deploys at no cost.

## 7. Pillar 5: prove it

1. **An Expo log from day one**, `docs/expo-log.md`: one row per build, update, deploy and workflow run,
   with the date, what shipped, why, and its link on expo.dev. The write-up and the numbers come from it.
2. **The Devpost section "How Expo shaped Lumente"**, in this order:
   - One codebase, three platforms: Expo Router, platform files, the static web build, and contracts
     shared with the API.
   - Built on SDK 58 the week it came out, with development builds, since Expo Go doesn't support it yet.
   - EAS Build: how many builds of each kind, and how the fingerprint check skipped native rebuilds.
   - EAS Update: how many updates, and tester night: how many fixes went out over the air, and how fast.
   - EAS Hosting: the web build at `<name>.expo.app`, deployed by EAS Workflows on every merge.
   - EAS Workflows: links to runs.
   - The Expo modules we use, each with the job it does (Pillar 3).
   - Try it: the three QR codes or links (Pillar 2).
3. **Screenshots:** the EAS project overview, the builds list, the updates list, a workflow run, the
   hosting deployments, and the app on an Android phone and in a browser side by side.
4. **Twenty seconds of the video:** change one line of copy, run `eas update`, relaunch the phone, and
   the change is there. Then the same session on a phone and on the web.
5. **README:** a "Built with Expo" block at the top with the links and QR codes.
6. **One slide, "How we ship":** code, then EAS Build, Update and Hosting, then Android and the web.
7. **Demo Day:** the app on a phone, mirrored, and one planned update live. Fix something small on
   stage ("testers missed the Help button"), run `eas update`, and the phone shows "Update ready:
   restart". Rehearse it twice; if the network fails, play the same moment from the video.

What the winning pages have that ours should too (read Oct 23: Cospray and capitalX on Devpost, and Expo's
own write-ups of Callie, Lingvano, Phantom and Partiful; the only two verifiable Expo hackathon prizes since
2025 are those two):

- One line per Expo module with the job the learner notices (Cospray's "List of Expo Technologies"), which
  `docs/expo-log.md` already keeps. Name `expo-speech-recognition` as a community module on the Expo Modules
  API, since judges check docs.expo.dev.
- The phone and the browser side by side, both linked: every winner claims a web build, none shows it.
- Challenges with numbers (the keyboard over the input, the 90 s timeout, the slowest turn at 10.6 s) and the
  alternatives we rejected and why (Expo Go can't run SDK 58, so development builds; drawn SVG and Reanimated
  on the UI thread instead of Lottie or Rive for the firefly; no TestFlight, so the web app on iPhones).
- Say plainly that web on iPhones is a decision with a reason, since the prize text says native iOS and Android.
- The EAS evidence no hackathon winner has shown: the builds and updates counted, the fingerprint check that
  skipped a rebuild, a workflow run, Observe's launch times, all linked and screenshotted.

## 8. Pillar 6: talk to Expo

- Expo's office hours on Discord (chat.expo.dev), Wednesdays at 12 PM Pacific, 3 PM Eastern. Oct 21 is a
  Wednesday. Bring two questions: what evidence of real use they want to see, and anything we should
  know about EAS builds in an npm workspace on SDK 58.
- Expo's partner team is in the Transferred Learnings Discord. Share the APK and web links by Oct 23 and
  ask for feedback while there's still time to act on it.
- After Build North: the Expo App Awards take entries until Oct 31. In 2025 the app had to be published
  in a store, so check this year's rules before spending time on it.

## 9. Day by day

The schedule lives in the main plan's [section 6](plan-to-win.md#6-day-by-day), so there's one to keep
current. Its Expo work runs like this: E1 to E3 and the office hours on Oct 21, then the web build on
EAS Hosting, the first `preview` APK and update, and the workflows on Oct 22. Updates go out on tester
night (Oct 23), the freeze builds run at 6 PM on Oct 24, and the Devpost section is written on Oct 25.
There's no TestFlight, since the team decided against an Apple account on Oct 21.

## 10. Owners (proposal)

- **Leo:** the EAS project, builds, updates, hosting and workflows, the update banner, metadata, Expo
  Observe, the Android widget if there's time, and the Expo log.
- **Cynthia:** the Expo GitHub app, the level-5 sheet in #26, reviews.
- **Jonathan:** #43 and #42. The font, icon, splash and haptics are done in #81.
- **Kyle:** the Devpost section, the screenshots, the video segment and the slide.

## 11. Done means

Before we enter the Expo category:

- [ ] The `preview` APK installs from the Devpost link on a phone that has never seen it, and a whole
      session works with Claude.
- [ ] The web build at `reality-check.expo.app` plays a whole session, on a laptop and on an iPhone.
- [ ] At least one update shipped over the air and visible in the app.
- [ ] A workflow run published an update and deployed the web build.
- [ ] Nothing left from the template: icon, splash, Expo and React logos, tab icons.
- [ ] `expo-doctor` passes; the typecheck and the tests pass.
- [ ] The Expo log has every build, update and deploy.
- [ ] The Devpost section, the screenshots, the video segment and the README block are done.

## 12. Risks

| Risk | What we do |
|---|---|
| Clerk's 100 emails a month run out | The `+clerk_test` fallback in the testing notes; ask Clerk support to raise the limit |
| Clerk's 100-user cap on a development instance | Keep an eye on the user count; testers and judges fit, random sign-ups might not |
| The free build queue is slow | Builds in the morning; JavaScript changes go out as updates |
| The first EAS build fails to install the workspace | Build on Oct 21. Never commit a lockfile regenerated on Windows: it loses its `libc` fields, and EAS installs on Linux |
| A crash that only happens on a phone (Clerk's Native API, secure storage, Zod on the phone's JavaScript engine) | The development build on Oct 21 is the first real-phone test |

## 13. Costs

- EAS on the free plan: 15 Android builds a month, unlimited updates up to 1,000 monthly
  users, hosting up to 100,000 requests a month, 60 CI minutes for workflows.
- Clerk: the free development instance, within the limits above.

## Sources

- What Expo rewards: [2025 Expo App Awards](https://expo.dev/blog/2025-expo-app-awards), [the 2026 awards](https://expo.dev/awards), the write-ups of [Callie](https://expo.dev/blog/making-ai-feel-human-in-a-mobile-app-with-expo-reanimated-and-skia), [Lingvano](https://expo.dev/blog/scaling-sign-language-education-to-4-million-learners-with-expo), [Partiful](https://expo.dev/customers/partiful) and [Phantom](https://expo.dev/blog/how-phantom-ships-a-secure-high-performance-crypto-wallet-with-expo), the hackathon winners [Cospray](https://devpost.com/software/fresco-b1riws) and [capitalX](https://devpost.com/software/capitalx)
- Expo: [SDK 58 changelog](https://expo.dev/changelog/sdk-58) (Expo Go timing, Observe, Android widgets, App Intents, Expo UI, office hours), [Expo Go loading changes, May 2026](https://expo.dev/changelog/expo-go-loading-changes-may-2026), [pricing](https://expo.dev/pricing), [SDK 58 minimum versions](https://docs.expo.dev/versions/latest/), [Expo Observe](https://docs.expo.dev/eas/observe/introduction/), [`expo-widgets`](https://docs.expo.dev/versions/v58.0.0/sdk/widgets/)
- EAS Build: [internal distribution](https://docs.expo.dev/build/internal-distribution/), [APKs](https://docs.expo.dev/build-reference/apk/), [app versions](https://docs.expo.dev/build-reference/app-versions), [managed credentials](https://docs.expo.dev/app-signing/managed-credentials/), [monorepos](https://docs.expo.dev/build-reference/build-with-monorepos/)
- EAS Update: [getting started](https://docs.expo.dev/eas-update/getting-started/), [runtime versions](https://docs.expo.dev/eas-update/runtime-versions/), [`expo-updates` API](https://docs.expo.dev/versions/latest/sdk/updates)
- EAS Hosting: [get started](https://docs.expo.dev/eas/hosting/get-started/), [deploy web](https://docs.expo.dev/deploy/web)
- EAS Workflows: [syntax](https://docs.expo.dev/eas/workflows/syntax/), [pre-packaged jobs](https://docs.expo.dev/eas/workflows/pre-packaged-jobs/), [preview builds with fingerprints](https://docs.expo.dev/tutorial/cicd/preview-builds), [building from GitHub](https://docs.expo.dev/build/building-from-github/)
- Expo Router and Expo UI: [form sheets](https://docs.expo.dev/router/advanced/modals), [web modals](https://docs.expo.dev/router/advanced/web-modals/), [the universal BottomSheet](https://docs.expo.dev/versions/v58.0.0/sdk/ui/universal/bottomsheet/), [haptics](https://docs.expo.dev/versions/v58.0.0/sdk/haptics/), [glass effect](https://docs.expo.dev/versions/v58.0.0/sdk/glass-effect/), [static rendering and `generateMetadata()`](https://docs.expo.dev/router/web/static-rendering)
- Clerk: [Expo quickstart](https://clerk.com/docs/expo/getting-started/quickstart), [test emails and phones](https://clerk.com/docs/guides/development/testing/test-emails-and-phones), [environments and limits](https://clerk.com/docs/guides/development/managing-environments), [the user object](https://clerk.com/docs/expo/reference/objects/user)
