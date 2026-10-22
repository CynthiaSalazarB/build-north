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
| Oct 22 | `expo-speech-recognition` 58.0.0 installed on `leo/voice` (not merged): config plugin in app.json, a throwaway `/voice-spike` screen | C1, the voice spike (plan-to-win: voice input for answers). A native module: it changes the fingerprint, so it merges either before the next Android build or after the testers finish on Oct 23, never during tester day | [package](https://www.npmjs.com/package/expo-speech-recognition) |
| Oct 22 | Production web deploy from `main` (cafb329): `eas env:exec production "expo export --platform web"` then `eas deploy --prod`, so the bundle carries the Render API URL and the Clerk key (a plain `expo export` would not) | A7, the judges' URL. The demo user is seeded in `prod`. First real session on it: `/turns` median 2.4 s, slowest 10.6 s (the final `evaluator_full`), $0.040 | [reality-check.expo.app](https://reality-check.expo.app) |
| Oct 22 | Web build on EAS Hosting, alias `polish`, demo mode (no API, no Clerk), from `leo/final-polish` (395bff9, PR #103) | Leo tests the website layout, "Your data" and the mic on the web before #103 merges. Demo mode because a new address would need its own `CORS_ORIGIN` row on Render | [reality-check--polish.expo.app](https://reality-check--polish.expo.app) |
| Oct 22 | Android `preview` APK from `leo/final-polish` (395bff9), versionCode 3, runtime `56eeb40f…`, the first build on the `lumente` project; queued 3:17 PM, finished 3:54 PM ([download](https://expo.dev/artifacts/eas/LVkBl_worJBs2ro5p6z9vFa1XtYyA992vF3QrkSzG_A.apk)) | Lumente's icon and name (#89) and voice's native module both changed the fingerprint, so the Oct 21 APK can't take an update to this code. 3 of this month's 15 free builds used after it | [build](https://expo.dev/accounts/lumente/projects/reality-check/builds/93910cdd-2d88-4da3-8250-a3de32cc4d46) |
| Oct 22 | EAS Update on the `preview` channel from `leo/final-polish` with `main` merged in (59316a1), runtime `56eeb40f…`, `--environment preview` so the bundle carries the same API URL and Clerk key as the build | Cynthia's worked example in four steps (#105) merged while build 3 ran; `eas fingerprint:compare` says the build and the tree match, so the APK takes this on its second launch instead of a fourth build | [update](https://expo.dev/accounts/lumente/projects/reality-check/updates/d4e50dc8-ae77-4d7d-b98b-40cf700196c9) |
| Oct 22 | Production web and the `testers` alias redeployed from `main` (c3e7556) with the `production` environment, about 6 PM | #108 changed the Turn contract (the result arrives with `coach: null` and a second Turn follows), and Render auto-deploys `main`, so the web builds still on cafb329 and 48dfb95 would have refused the result Turn at the end of every session. Web deploys use no build credit | [prod](https://reality-check.expo.app), [testers](https://reality-check--testers.expo.app) |

## Voice input: what `expo-speech-recognition` 58.0.0 does, and where the audio goes (Oct 22)

Read from the package's README at 58.0.0 (same text as the repository's `main` on Oct 22, platform table dated July 12, 2025) and from its `app.plugin.js`. For Cynthia's privacy note (#43) and the C2 design.

- **Versions:** npm tags track the Expo SDK (`sdk-54` 3.1.3, `56.0.4`, `57.1.1`, latest `58.0.0`). We use 58.0.0 with Expo SDK 58.
- **Needs a development or EAS build.** Expo Go can't run it (native code on Android and iOS). `npx expo install` added `"expo-speech-recognition"` to `app.json` plugins.
- **The config plugin** (`app.plugin.js`): adds `android.permission.RECORD_AUDIO`, a `<queries>` entry so the app can see Google's recognition service (`com.google.android.googlequicksearchbox`, overridable with `androidSpeechServicePackages`), and the two iOS usage strings (`microphonePermission`, `speechRecognitionPermission`; iOS is not built). Default strings are "Allow $(PRODUCT_NAME) to use the microphone." and "...speech recognition."; C3 replaces them with plain words.
- **Where the audio goes on Android:** to the device's speech service, which is Google's: on Android 13+ the "Speech Recognition & Synthesis" package `com.google.android.tts`, on Android 12 and lower the Google app. By default recognition is network-based, so the audio leaves the phone for Google's servers. `requiresOnDeviceRecognition: true` keeps it on the phone, but only on Android 13+ and only after the locale's offline model is downloaded (`androidTriggerOfflineModelDownload()`; `getSupportedLocales()` lists what's installed; an Android 12 emulator can't verify it). Decision for C2: ask for on-device when `supportsOnDeviceRecognition()` is true and fall back to network otherwise, and say so in the privacy note.
- **Where the audio goes on the web:** the browser's Web Speech API (`webkitSpeechRecognition`). Chrome desktop and Chrome on Android send it to Google (server-based); Safari 16+ sends it to Siri; Firefox and Brave have no implementation, and Edge needs its Azure speech component. So on the web the mic shows only when `isRecognitionAvailable()` is true.
- **API we use:** `requestPermissionsAsync()` (mic, plus speech recognition on iOS), `start({ lang, interimResults, continuous, maxAlternatives })`, `stop()` (emits the final result), `abort()` (drops it), `isRecognitionAvailable()`, `supportsOnDeviceRecognition()`; the `useSpeechRecognitionEvent` hook for `start`, `result` (with `isFinal`), `error`, `end`. Continuous mode needs Android 13+; we use one phrase at a time.
- **Errors** follow the Web Speech API codes: `not-allowed` (permission), `no-speech`, `network`, `audio-capture`, `service-not-allowed` (no recognizer), `busy`, `language-not-supported`, `speech-timeout` (Android), `aborted`, `client`, `unknown`. Each maps to one of C2's states: denied, error with a retry, unsupported.
- **Android gotchas from the README:** single words recognize poorly (the README suggests `androidIntentOptions: { EXTRA_LANGUAGE_MODEL: "web_search" }`); if recognition hangs, the Google speech package may be disabled on the device; the recognizer's beep can be muted by lowering the notification stream.
- **On the web, `requestPermissionsAsync()` is a no-op** (the module logs "not supported on web. Returning a granted permission response"): the browser asks for the microphone when `start()` runs, and a refusal arrives as the `error` event with code `not-allowed`. So C2 treats `not-allowed` as the denied state on every platform, not the permission call's answer. Seen in the desktop app's browser pane (microphone blocked there) on Oct 22.
- **The spike screen** `app/src/app/voice-spike.tsx` shows the platform and state, puts interim and final text in an editable field, and never sends anything. Checked: typecheck on the web build path; an Android check needs a development build with the module (C5's build, or a one-off development build with Leo's OK).
- **The final polish (Oct 22, PR #103):** the module has one recognizer and one stream of events, and three fields can carry a mic (the answer, the level-5 question, a part in its editor), so `use-voice.ts` lets one field own the recognizer at a time and the others ignore its events; a field that unmounts while listening aborts it. On the web the hook no longer calls `requestPermissionsAsync` (the stub only logs a warning); the browser asks at `start()`. A refusal or an error shows a note under the field; on the web it points at the site permission in the address bar, since there is no app settings page to open. Checked in the browser pane with a stand-in `SpeechRecognition` (the pane blocks the microphone): start, interim words, final text, idle; with two mics on screen only the dialog's field received the words. A real microphone on the web and Android are still unchecked.

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
