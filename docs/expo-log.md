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
