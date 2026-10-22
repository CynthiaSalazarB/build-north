# Expo log

One row per EAS build, update, deploy and workflow run. The "How we used Expo" section on Devpost and
in the README (#30, #55) takes its numbers from here. The links open in the EAS dashboard, so they need
an Expo login with access to the project.

| Date | What | Why | Link |
|---|---|---|---|
| Oct 21 | EAS project `@leo_atienza/reality-check`, EAS Update with the fingerprint runtime | E1, E3 in the Expo plan | [project](https://expo.dev/accounts/leo_atienza/projects/reality-check) |
| Oct 21 | Android development build | Our own phones: Expo Go can't run SDK 58 yet | [build](https://expo.dev/accounts/leo_atienza/projects/reality-check/builds/2c5d0603-e0bf-45dc-b277-e6526eeea346) |
| Oct 21 | Android `preview` APK | Testers, judges and the demo phone | [build](https://expo.dev/accounts/leo_atienza/projects/reality-check/builds/6ad806f5-6d5e-4254-a12f-6e65da0141dc) |
| Oct 21 | Web build on EAS Hosting, demo mode, alias `review` | The design review of #81 | [reality-check--review.expo.app](https://reality-check--review.expo.app) |
| Oct 21 | Both Android builds finished (development 1:29 PM, `preview` 1:32 PM) and ran on an Android 16 emulator | The first check on a phone: the keyboard covered the answer field, since the app draws edge to edge. Fixed in #81 and shipped as the update below | [development](https://expo.dev/accounts/leo_atienza/projects/reality-check/builds/2c5d0603-e0bf-45dc-b277-e6526eeea346) · [preview](https://expo.dev/accounts/leo_atienza/projects/reality-check/builds/6ad806f5-6d5e-4254-a12f-6e65da0141dc) |
| Oct 21 | First EAS Update on the `preview` channel, from `leo/round-6` (2738344), runtime `48fe75a4…` | The P7 start screen, the update notice and the keyboard fixes, without a new build. The `preview` APK showed them on its second launch | [update](https://expo.dev/accounts/leo_atienza/projects/reality-check/updates/2067f807-9440-4a72-a052-9d014e7ca6b0) |
| Oct 22 | Web build on EAS Hosting, alias `testers`, from `leo/lumente-native` (48dfb95: #81, #82 and #89 in Lumente) with the API URL and the Clerk key from the `production` environment | The testers' link for Oct 23: sign-in by email code against the live API. Render's `CORS_ORIGIN` lists this address and `reality-check.expo.app`, so a production deploy from `main` after the merges needs no Render change | [reality-check--testers.expo.app](https://reality-check--testers.expo.app) |
| Oct 22 | The EAS project moved from Leo's personal account to the `lumente` organization, and Cynthia was invited as Admin; `app.json` `owner` is `lumente` | Personal Expo accounts can't have members. The project ID, environment variables, builds, updates and hosting moved with it. The `owner` change moves the Android runtime from `6cd8d03f…` to `6a55ca65…`; no APK was built on `6cd8d03f`, so the next build is the one that matters | [project](https://expo.dev/accounts/lumente/projects/reality-check) |

## How Expo shaped Lumente (Oct 22)

One row per Expo or EAS piece: the job it does for the learner, the file, the PR. For Devpost's "Best
Use of Expo" section and the README (#30, #55). Voice input (`expo-speech-recognition`) is on #101 and
joins the table when it merges.

| Piece | The job for the learner | Where | PR |
|---|---|---|---|
| Expo Router, one codebase | The same screens on Android and the web; `sign-in.tsx` and `sign-in.web.tsx` give each platform its own sign-in, and `generateMetadata()` writes the page title and description into the static HTML so a shared link previews | `app/src/app/` | #54, #64, #92 |
| EAS Build, profiles `development`, `preview`, `production` | A development client for our phones, an APK for testers and judges, a production APK for Demo Day; `autoIncrement` numbers the builds | `app/eas.json` | #80 |
| Runtime policy `fingerprint` | An update reaches only builds with the same native code, so a JavaScript fix can never land on an APK that can't run it | `app/app.json` | #80 |
| EAS Update, `channel` per profile | Fixes reach the testers' phones without a reinstall; the first one reached the `preview` APK on Oct 21 | `app/eas.json`, the Expo log above | #80, #81 |
| `expo-updates`, the update notice | "Update ready: restart" when a new update is downloaded, so nobody runs stale code on Demo Day | `app/src/components/update-notice.tsx` (`useUpdates`) | #81 |
| EAS Hosting | The web build at reality-check.expo.app, with `testers` and `review` aliases for the tester day and the design review | `npx expo export --platform web`, `eas deploy` | #89, #92 |
| EAS Workflows | `ship.yml` publishes an update and deploys the web build on every merge to main; `preview-build.yml` builds the APK on demand | `app/.eas/workflows/` | #80 |
| `expo-dev-client` | A development build of our own, since Expo Go can't run SDK 58 or native modules | `app/eas.json` `development` profile | #80 |
| `expo-observe` | Launch times and crashes on phone release builds, interactive markers on the session screen | `app/src/app/_layout.tsx` (`ObserveRoot`), `sign-in.tsx` | #80 |
| `expo-haptics` | A tick when the guess changes and on the mic, a success at a level-up, nothing else | `app/src/haptics.ts` | #81 |
| `expo-secure-store` | Clerk's session token cache on Android | `app/src/app/_layout.tsx` (`tokenCache`) | #64 |
| `expo-auth-session`, `expo-web-browser` | Clerk's hosted sign-in in an in-app browser on Android, and the return to the app | `app/src/app/sign-in.tsx` | #64 |
| `expo-font`, `@expo-google-fonts` | Newsreader and Atkinson Hyperlegible loaded before the first frame | `app/src/app/_layout.tsx` (`useFonts`) | #81 |
| `expo-splash-screen` | The splash stays up until the fonts and Clerk are ready, in Lumente's colors | `app/app.json`, `_layout.tsx` | #81, #89 |
| `react-native-reanimated` | The light that grows with each point, one-shot entrances, the firefly's line drawing itself; nothing loops, and Reduce Motion leaves only the light | `app/src/components/light.tsx`, `concept-map.tsx` | #81, #92 |
| `react-native-svg` | The concept map's parts, the firefly, the icons | `app/src/components/` | #81 |
| `expo-speech-recognition` (community) | Answer by voice; the words land in the field, editable, never sent by themselves | `app/src/components/use-voice.ts` | #101 (draft) |

### Challenges we ran into

Real ones, with the cause and the fix, the way the Hack the North winner's page lists them.

1. **The keyboard covered every bottom input on Android.** Since SDK 54 the app draws edge to edge, so
   Android no longer shrinks the window for the keyboard. Fix: `KeyboardSafe` in `app/src/components/ui.tsx`,
   a `KeyboardAvoidingView` with the top inset as its offset, around every screen with a bottom field (#81).
2. **Multiline fields lost lines on Android.** A custom `lineHeight` with `numberOfLines={1}` showed only
   the last line of a long answer. Fix: no custom line height on inputs (#81, `ui.tsx` comment).
3. **Metro with `CI=1` never reloaded.** The scripted dev server for the emulator ran with `CI=1`, which
   turns off the interactive watcher. Fix: run it without `CI`, or restart it per change.
4. **The first update arrived on the second launch.** EAS Update downloads in the background and applies
   on the next start, so the `preview` APK showed the Oct 21 update only after a restart. Fix: the update
   notice (`useUpdates`) tells the learner "Update ready: restart" instead of leaving them on old code.
5. **Windows npm strips `libc` fields from the lockfile.** Every `npm install` on Windows rewrote 40 lines
   of `package-lock.json` for Linux-only packages, which then broke `npm ci` on Render and EAS. Fix: merge
   new lockfile entries by hand and check them with a script that runs `npm install --package-lock-only`
   in a temp dir and diffs the result (0 differences on every PR since).
6. **Moving the project to an organization changed the runtime.** `app.json` `owner` is part of the
   fingerprint, so the move to `@lumente/reality-check` (#94) gave a new runtime version: builds from
   before it can't take updates from after it. Fix: documented in the log above; the next Android build is
   the one testers get.
7. **Enter on the web added a line and never sent.** react-native-web ignores `submitBehavior`. Fix:
   `PromptField` handles the Enter key on the web (Shift+Enter is a new line) (#92).

## Which Expo skill, doc or tool shaped which change (Oct 22)

Evidence that the platform shaped the build, dated.

| Date | Change | What shaped it |
|---|---|---|
| Oct 21 | `eas.json` profiles, `fingerprint` runtime, channels per profile | The `expo-deployment` and `expo-cicd-workflows` skills (Expo's agent skills, docs.expo.dev/agents) and the EAS Update docs on runtime policies |
| Oct 21 | `ship.yml` and `preview-build.yml` | The `expo-cicd-workflows` skill's `update` and `deploy` job types |
| Oct 21 | `KeyboardSafe` for the edge-to-edge keyboard | The SDK 54 release notes on edge-to-edge, read after the first emulator check |
| Oct 21 | Expo Observe root and markers | The `expo-observe` docs (SDK 58) |
| Oct 22 | `sign-in.web.tsx` beside `sign-in.tsx`, `generateMetadata()` | Expo Router docs on platform-specific routes and static metadata (`expo-router/server`) |
| Oct 22 | The website layout from 1,000 px | The `building-native-ui` skill on one codebase with a width breakpoint |
| Oct 22 | `expo-speech-recognition` with its config plugin and permission strings | The module's README at 58.0.0 and `app.plugin.js`; `npx expo config --type introspect` to prove the manifest and Info.plist changes |
