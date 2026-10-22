# app

Expo + React Native (Expo SDK 58, TypeScript, Expo Router). iOS, Android and web from one codebase.
Created with `create-expo-app` and its default template (disclose it on Devpost: templates are
allowed if disclosed), with the template's demo screens removed.

## Run it

From the repo root (npm workspaces install everything there):

```bash
npm install
npm run start -w app        # then scan the QR code with Expo Go, or press w for the browser
```

With no `app/.env`, the app runs in **demo mode**: it replays the democracy session from
`agents/fixtures/session-1.json`, one Turn per action, whatever you type (#6). To use the API, create
`app/.env` (Expo reads the `.env` in this folder, not the repo root's):

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000   # on a phone, use your computer's LAN address instead of localhost
EXPO_PUBLIC_DEV_USER=yourname               # without Clerk only
EXPO_PUBLIC_DEV_KEY=                        # the API's DEV_KEY, from Leo; local only, without Clerk
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=          # pk_test_..., turns on sign-in (#22)
```

`EXPO_PUBLIC_*` is bundled into the app, so nothing secret goes there, and `EXPO_PUBLIC_DEV_KEY` is
never set for the deployed web build.

### Sign-in (#22)

With `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` set, a signed-out learner only sees the sign-in screen, and
every API call sends the Clerk session token as `Authorization: Bearer` instead of the dev headers. The
API checks it with `CLERK_JWT_KEY` from the same Clerk application (#23). Without the key, nobody
signs in and the app works as before.

- Web: `src/app/sign-in.web.tsx` shows Clerk's prebuilt `<SignIn />`.
- iOS and Android: `src/app/sign-in.tsx` opens Clerk's hosted sign-in in an in-app browser, which also
  works in Expo Go.
- The Clerk Dashboard decides the sign-in methods (email and Google for now), with no code change.
  Enable the Native API on its **Native applications** page so the phone apps can sign in.
- To try the web build with sign-in locally, use `npx expo serve` on the export: Clerk's Google
  sign-in comes back to `/sign-in`, which a plain static server can't map to `sign-in.html`.

## Commands

```bash
npm test -w app             # the session logic under Node: fixture replay, API client, transcript
npm run typecheck -w app
npm run export:web -w app   # the static web build in app/dist
```

## Builds and updates (EAS)

The EAS project is `@leo_atienza/reality-check`, and it moves to the team's Expo organization later.
Run these from `app/`:

```bash
npx eas-cli@latest build --platform android --profile development   # the dev client, for our own phones
npx eas-cli@latest build --platform android --profile preview       # the APK testers and judges install
npx eas-cli@latest update --channel preview --environment preview --platform android --message "what changed"
npx expo export --platform web && npx eas-cli@latest deploy --prod  # the web build on EAS Hosting
```

- `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` come from the EAS environments, not
  `app/.env`.
- The free plan has 15 Android builds a month. JavaScript changes go out as updates, and a new APK is
  only for a native change (the Preview build workflow checks the fingerprint first).
- Every build, update and deploy goes in `docs/expo-log.md`, for the "How we used Expo" write-up.

## Where things are

| Path | What |
|---|---|
| `src/app/` | The routes: `index.tsx` (start: concept + optional notes), `session.tsx` (the session) and `sign-in.tsx` / `sign-in.web.tsx` (#22). No id in a path, so the web build stays static |
| `src/session/` | The session logic, no React: the two clients (`api-client.ts`, `fixture-client.ts`), what the transcript shows (`transcript.ts`), and the tests |
| `src/components/` | Messages, the map card, the input for each `expects`, the result card |
| `src/theme.ts` | Every color, font and size, so the brand kit (#46) changes one file |

## Rules

- Read the API URL from `EXPO_PUBLIC_API_URL`. Nothing secret goes in `EXPO_PUBLIC_*`.
- Import from `@build-north/agents` freely (types, `MOVE_LABEL`, the fixtures): it holds no server code.
  Its files import each other with a `.ts` extension, so `app/tsconfig.json` sets
  `"allowImportingTsExtensions": true`, and this app's own files do the same, so the session logic
  runs under Node for the tests.
- The screen draws whatever the latest `Turn` says (CONTRACTS.md section 1): the messages, the map, and
  the one input `expects` names. Every `/turns` call sends the `turn` it answers, and Send is disabled
  while a call is pending (decision 18). A 409 answers with the latest Turn, which the app just draws.
- Add packages with `npx expo install <package>` from `app/`, so the versions match the SDK.
