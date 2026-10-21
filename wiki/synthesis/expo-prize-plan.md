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

Every change reaches a phone or the web through EAS. Steps in order, all from `app/` (in a monorepo,
`eas.json` lives next to the app):

1. **One Expo owner for the project.** An Expo organization for the team, or one teammate's account with
   the others invited, so everyone can build, update and see the dashboard.
2. **`npx eas-cli@latest init`** adds `owner` and `extra.eas.projectId` to `app.json`.
3. **`app.json`:** a bundle id and a package name, the same on both platforms, for example
   `ca.buildnorth.realitycheck` (pick it once: it can't change after the first TestFlight upload);
   `"ios": { "config": { "usesNonExemptEncryption": false } }`, so every iOS upload skips the export
   question (we only use HTTPS through the system); and keep `"web": { "output": "static" }`, since SDK 58
   defaults to server output when it's unset.
4. **`npx expo install expo-updates`, then `npx eas-cli@latest update:configure`**, which sets the runtime
   version and the update URL. Use the `fingerprint` runtime policy, so an update only reaches builds
   with the same native code.
5. **`eas.json`**, in the shape the docs show:

   ```json
   {
     "cli": { "appVersionSource": "remote" },
     "build": {
       "development": { "developmentClient": true, "distribution": "internal", "environment": "development" },
       "preview": { "distribution": "internal", "android": { "buildType": "apk" }, "environment": "preview", "channel": "preview" },
       "production": { "environment": "production", "channel": "production", "autoIncrement": true }
     },
     "submit": { "production": {} }
   }
   ```

   `autoIncrement` with the remote version source bumps only the build number. That matters on iOS:
   a new `version` means a new full Beta App Review.
6. **EAS environment variables** for the `preview` and `production` environments:
   `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, as plain text (they end up in the app
   anyway). Never `EXPO_PUBLIC_DEV_KEY`.
7. **Builds**, started in the morning because the free queue can take over an hour:

   | Build | For | When |
   |---|---|---|
   | Android `development` | The team's phones (Expo Go can't run SDK 58) | Oct 21, first thing |
   | Android `preview` (APK) | Testers and judges: an install page anyone with the link can use | Oct 21, again at the freeze |
   | iOS `production` | TestFlight (Pillar 2), only with an Apple account | As soon as the account is approved |
   | Android `preview`, iOS `production` | The frozen build | Oct 24, 6 PM |

   About six Android and three iOS builds of the free 15 and 15 a month.
8. **Updates.** Every merged change to the app's JavaScript goes out with
   `eas update --channel preview --environment preview --message "<what changed>"` (the environment flag
   is required since SDK 55); installed builds pick it up after a relaunch or two. On tester night, each
   fix is one update, logged (Pillar 5).
9. **Web on EAS Hosting.** `npx expo export --platform web`, then `eas deploy --prod`, for
   `https://<name>.expo.app`. Only that production address goes in the API's `CORS_ORIGIN`: each preview
   deploy gets a new one.
10. **EAS Workflows** in `.eas/workflows/`, from the job types in Expo's docs:

    ```yaml
    # .eas/workflows/ship.yml: every merge to main reaches phones and the web
    name: Ship
    on:
      push:
        branches: ['main']
    jobs:
      update:
        name: Update the preview channel
        type: update
        environment: preview
        params:
          channel: preview
      deploy_web:
        name: Deploy the web build
        type: deploy
        environment: production
        params:
          prod: true
    ```

    ```yaml
    # .eas/workflows/preview-build.yml: run by hand; builds only when native code changed
    name: Preview build
    jobs:
      fingerprint:
        type: fingerprint
        environment: preview
      get_android_build:
        needs: [fingerprint]
        type: get-build
        params:
          fingerprint_hash: ${{ needs.fingerprint.outputs.android_fingerprint_hash }}
          profile: preview
      build_android:
        needs: [get_android_build]
        if: ${{ !needs.get_android_build.outputs.build_id }}
        type: build
        params:
          platform: android
          profile: preview
    ```

    ```yaml
    # .eas/workflows/testflight.yml: run by hand; needs the Apple account (Pillar 2)
    name: TestFlight
    jobs:
      build_ios:
        type: build
        params:
          platform: ios
          profile: production
      testflight:
        needs: [build_ios]
        type: testflight
        params:
          build_id: ${{ needs.build_ios.outputs.build_id }}
          external_groups: ['Judges']
    ```

    `eas workflow:run .eas/workflows/ship.yml` runs any of them today. The `on: push` trigger needs
    the Expo GitHub app, which only Cynthia can install, since the repo is on her personal account. The
    builds stay manual so they don't eat the free plan's 60 CI minutes and 15 builds.

## 4. Pillar 2: reach every judge

| A judge with | Gets the app through | What we give them |
|---|---|---|
| An Android phone | The `preview` APK (EAS internal distribution) | The install link and a QR code on Devpost and in the README, with one line about allowing the install |
| An iPhone | A TestFlight public link | The link on Devpost. Needs the Apple account below; iOS 16.4 or later (SDK 58's minimum) |
| A laptop | The web build on EAS Hosting | `https://<name>.expo.app`, with a page title and description from `generateMetadata()` (SDK 58's way to put metadata in static pages) so the link previews well |
| No time | The video | Three minutes at most |

### Signing in

Judges sign up with their own email and a code. Two limits of Clerk's development instance matter: it
sends at most 100 emails a calendar month (codes stop after that), and it holds at most 100 users. Two
fixes: ask Clerk support to raise the email limit before Oct 25 (they can), and put a fallback in
Devpost's testing notes. On a development instance, any address with `+clerk_test` in it (for example
`judge+clerk_test@example.com`) gets no email and signs in with the code `424242`. Anyone who reads the
notes can use it, so the instance should only ever hold demo data.

### TestFlight, step by step

1. **Tonight: decide who enrolls** in the Apple Developer Program as an individual: 18 or older, an
   Apple Account with two-factor authentication, their legal name (shown as the seller) and their own
   card. USD 99 a year; Apple shows the price in Canadian dollars, with tax, at checkout. Apple says to contact
   support if there's no confirmation 24 hours after paying, so it's about a day. The organization route
   needs a D-U-N-S number and takes over a week: not an option.
2. **While Apple confirms:** the export setting in `app.json` (Pillar 1, step 3); the EAS environment
   variables; in the Clerk dashboard, the Native API on and the iOS bundle id registered under Native
   applications; sign up `reviewer+clerk_test@example.com` once; a privacy page on the web build
   (`/privacy`) linked from the app; and account deletion in the app (#43: `DELETE /me/data`, then
   Clerk's `user.delete()`). Apple's guidelines ask for a privacy policy link and in-app account
   deletion; whether Beta App Review checks them isn't documented, so we add both.
3. **After approval:** the account holder accepts the latest agreement in App Store Connect (Apple won't
   create the app record until then).
4. **Build and upload:** `eas build -p ios --profile production --auto-submit` from Windows, or the
   `testflight` workflow. EAS creates the signing certificate and profile after an Apple ID login, and
   its first submit creates the App Store Connect app record. One to two hours with the queue, plus
   Apple's processing.
5. **In App Store Connect:** an internal group for the team (it has to exist before an external one);
   Test Information (the beta description, a feedback email, a contact); under sign-in,
   `reviewer+clerk_test@example.com` with `424242`, plus a note that the app asks for an email code and
   this address takes `424242`; then an external group, "Judges", with the build in it. That sends the
   first build to Beta App Review. Apple's general figure is half of reviews in 24 hours and 90% in 48.
6. **After review:** turn on the public link (limit it to about 100 testers), install it on a
   teammate's iPhone through the TestFlight app, then post it on Devpost.

Later builds of the same version usually skip the full review, so the Oct 24 freeze build only needs
the build number bumped. Keep the API on Render Starter while Apple reviews: a backend that's asleep can
get the build rejected. Without an Apple account, iPhone judges use the web build, and the write-up says
so.

## 5. Pillar 3: make it feel native

Each item is an Expo piece doing a job the learner notices.

| What | Expo piece | Why it helps | Effort | Proposed owner |
|---|---|---|---|---|
| The fact desk at level 5 as a half-height sheet over the map | Expo Router `presentation: "formSheet"` | The map stays on screen while the learner asks | Inside #26 | Cynthia |
| The brand: Newsreader for titles, questions and the conversation | `expo-font` with `@expo-google-fonts/newsreader` | The design's reading voice | 30 min | Jonathan |
| Brand icon, Android adaptive icon, splash | `app.json`, `expo-splash-screen` | The first thing a judge sees; the template's are still there | 1 h | Jonathan |
| A light tick when the guess changes, success at a level up, nothing else | `expo-haptics` | Feedback without noise | 30 min | Jonathan |
| Close, Help and the answer box float as glass on iOS 26 | `expo-glass-effect` (opaque on Android and the web) | The platform's own look | 1 h | Jonathan |
| The dawn after the guess; points casting into bronze at the end | Reanimated (already in the app) | The two moments the design plans; fades with Reduce Motion | 2 to 3 h | Cynthia or Jonathan |
| Read the question aloud | `expo-speech` | Learners who read slowly or in a second language | 30 min | anyone |
| "Update ready: restart" and an About screen with the version, channel and update id | `expo-updates` (`useUpdates()`, `Updates.updateId`) | Shows over-the-air updates working, and helps on tester night | 1 h | Leo |
| Page titles and descriptions on the web build | `generateMetadata()` from `expo-router/server` | Link previews on Devpost and Discord | 20 min | Leo |
| Dark mode from round 6's dark palette | `userInterfaceStyle: "automatic"` and the theme | Comfort at night | 1 to 2 h | Jonathan |
| Accessibility pass | Labels (already in the code), text that scales, contrast | Usable by everyone | 1 h | Cynthia |

## 6. Pillar 4: use what Expo just shipped

SDK 58 came out on Oct 15, and Expo's team will notice who used it well. Only take what serves the
learner: three cheap ones are worth doing, the widget only if there's time, and the rest is out.

| Feature | What it would do for us | Needs | Effort | Verdict |
|---|---|---|---|---|
| Expo UI (SwiftUI and Jetpack Compose components) | The 0 to 8 guess as a native control | A development build | Low per screen | Do: the guess picker |
| Expo Observe | Startup and navigation times, JavaScript errors and native crashes, compared release by release: a screenshot for the write-up and a crash watch on tester night. On the free plan it keeps startup metrics and release markers, 100,000 events a month | `expo-observe` in a build that isn't a debug build | Low | Do |
| EAS Update rollouts and the `useUpdates()` banner | A risky fix goes to some phones first; the banner shows updates arriving (Pillar 3) | `expo-updates` | Low | Do |
| A home screen widget on Android (`expo-widgets`) | "Resume inflation: 3 of 4 parts" and each part's stage: progress only, never a streak | A development build; the widget runs its own small JavaScript bundle | Medium | Do if Pillars 1 to 3 are done by Oct 23 |
| App Intents (Siri, Shortcuts, Spotlight) | "Check what I know about inflation" from Siri | Intents written in Swift, and an iPhone to test on | Medium to high | Only with the Apple account and spare time |
| PostHog through EAS | Analytics for each update | A third-party analytics account | Low | Skip: we promise to store only what learning needs |
| Native tabs, data loaders | Nothing: round 6 uses a home screen instead of a tab bar, and loaders are for the web | | | Skip |

## 7. Pillar 5: prove it

1. **An Expo log from day one**, `docs/expo-log.md`: one row per build, update, deploy and workflow run,
   with the date, what shipped, why, and its link on expo.dev. The write-up and the numbers come from it.
2. **The Devpost section "How Expo shaped Reality Check"**, in this order:
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
   hosting deployments, and the app on Android, iPhone and the web side by side.
4. **Twenty seconds of the video:** change one line of copy, run `eas update`, relaunch the phone, and
   the change is there. Then the same session on a phone and on the web.
5. **README:** a "Built with Expo" block at the top with the links and QR codes.
6. **One slide, "How we ship":** code, then EAS Build, Update and Hosting, then iOS, Android and the web.
7. **Demo Day:** the app on a phone, mirrored, and one planned update live. Fix something small on
   stage ("testers missed the Help button"), run `eas update`, and the phone shows "Update ready:
   restart". Rehearse it twice; if the network fails, play the same moment from the video.

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
TestFlight follows section 4 if one of us enrolls with Apple on Oct 21.

## 10. Owners (proposal)

- **Leo:** the EAS project, builds, updates, hosting and workflows, the TestFlight upload, the update
  banner and About screen, metadata, Expo Observe, the Android widget if there's time, and the Expo log.
- **Whoever enrolls with Apple:** the agreement and the App Store Connect setup, with Leo.
- **Cynthia:** the Expo GitHub app, the level-5 sheet in #26, reviews.
- **Jonathan:** the font, icon, splash, haptics, glass, the Expo UI guess picker and dark mode.
- **Kyle:** the Devpost section, the screenshots, the video segment and the slide.

## 11. Done means

Before we enter the Expo category:

- [ ] The `preview` APK installs from the Devpost link on a phone that has never seen it, and a whole
      session works with Claude.
- [ ] The web build at `<name>.expo.app` plays a whole session.
- [ ] iPhones: the TestFlight public link installs on a teammate's iPhone, or the write-up says iPhone
      users use the web build.
- [ ] At least one update shipped over the air and visible in the app.
- [ ] A workflow run published an update and deployed the web build.
- [ ] Nothing left from the template: icon, splash, Expo and React logos, tab icons.
- [ ] `expo-doctor` passes; the typecheck and the tests pass.
- [ ] The Expo log has every build, update and deploy.
- [ ] The Devpost section, the screenshots, the video segment and the README block are done.

## 12. Risks

| Risk | What we do |
|---|---|
| Apple takes longer to confirm the account, or to review | Enroll on Oct 21. The web build covers iPhones meanwhile |
| Beta App Review rejects the build | The reviewer account and its note, the privacy page, account deletion, the API awake on Starter |
| Clerk's 100 emails a month run out | The `+clerk_test` fallback in the testing notes; ask Clerk support to raise the limit |
| Clerk's 100-user cap on a development instance | Keep an eye on the user count; testers and judges fit, random sign-ups might not |
| The free build queue is slow | Builds in the morning; JavaScript changes go out as updates |
| The first EAS build fails to install the workspace | Build on Oct 21. Never commit a lockfile regenerated on Windows: it loses its `libc` fields, and EAS installs on Linux |
| A crash that only happens on a phone (Clerk's Native API, secure storage, Zod on the phone's JavaScript engine) | The development build on Oct 21 is the first real-phone test |
| An iPhone older than iOS 16.4 | It can't install SDK 58 apps; the web build works there |

## 13. Costs

- EAS on the free plan: 15 Android and 15 iOS builds a month, unlimited updates up to 1,000 monthly
  users, hosting up to 100,000 requests a month, 60 CI minutes for workflows.
- The Apple Developer Program: USD 99 a year, only if we go for TestFlight.
- Clerk: the free development instance, within the limits above.

## Sources

- What Expo rewards: [2025 Expo App Awards](https://expo.dev/blog/2025-expo-app-awards), [the 2026 awards](https://expo.dev/awards), the write-ups of [Callie](https://expo.dev/blog/making-ai-feel-human-in-a-mobile-app-with-expo-reanimated-and-skia), [Lingvano](https://expo.dev/blog/scaling-sign-language-education-to-4-million-learners-with-expo), [Partiful](https://expo.dev/customers/partiful) and [Phantom](https://expo.dev/blog/how-phantom-ships-a-secure-high-performance-crypto-wallet-with-expo), the hackathon winners [Cospray](https://devpost.com/software/fresco-b1riws) and [capitalX](https://devpost.com/software/capitalx)
- Expo: [SDK 58 changelog](https://expo.dev/changelog/sdk-58) (Expo Go timing, Observe, Android widgets, App Intents, Expo UI, office hours), [Expo Go loading changes, May 2026](https://expo.dev/changelog/expo-go-loading-changes-may-2026), [pricing](https://expo.dev/pricing), [SDK 58 minimum versions](https://docs.expo.dev/versions/latest/), [Expo Observe](https://docs.expo.dev/eas/observe/introduction/), [`expo-widgets`](https://docs.expo.dev/versions/v58.0.0/sdk/widgets/)
- EAS Build: [internal distribution](https://docs.expo.dev/build/internal-distribution/), [APKs](https://docs.expo.dev/build-reference/apk/), [app versions](https://docs.expo.dev/build-reference/app-versions), [managed credentials](https://docs.expo.dev/app-signing/managed-credentials/), [monorepos](https://docs.expo.dev/build-reference/build-with-monorepos/)
- EAS Update: [getting started](https://docs.expo.dev/eas-update/getting-started/), [runtime versions](https://docs.expo.dev/eas-update/runtime-versions/), [`expo-updates` API](https://docs.expo.dev/versions/latest/sdk/updates)
- EAS Hosting: [get started](https://docs.expo.dev/eas/hosting/get-started/), [deploy web](https://docs.expo.dev/deploy/web)
- EAS Workflows: [syntax](https://docs.expo.dev/eas/workflows/syntax/), [pre-packaged jobs](https://docs.expo.dev/eas/workflows/pre-packaged-jobs/), [preview builds with fingerprints](https://docs.expo.dev/tutorial/cicd/preview-builds), [building from GitHub](https://docs.expo.dev/build/building-from-github/)
- iOS: [submitting with EAS](https://docs.expo.dev/submit/ios/), [TestFlight with EAS](https://docs.expo.dev/submit/testflight/), [`usesNonExemptEncryption`](https://docs.expo.dev/versions/v58.0.0/config/app/#usesnonexemptencryption)
- Expo Router: [form sheets](https://docs.expo.dev/router/advanced/modals), [static rendering and `generateMetadata()`](https://docs.expo.dev/router/web/static-rendering)
- Apple: [enrollment](https://developer.apple.com/programs/enroll/), [enrollment help](https://developer.apple.com/help/account/membership/program-enrollment/), [external testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers/), [test information](https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-test-information/), [App Review times](https://developer.apple.com/distribute/app-review/), [guideline 2.1](https://developer.apple.com/app-store/review/guidelines/#2.1)
- Clerk: [Expo quickstart](https://clerk.com/docs/expo/getting-started/quickstart), [test emails and phones](https://clerk.com/docs/guides/development/testing/test-emails-and-phones), [environments and limits](https://clerk.com/docs/guides/development/managing-environments), [the user object](https://clerk.com/docs/expo/reference/objects/user)
