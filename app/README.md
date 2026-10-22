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
EXPO_PUBLIC_DEV_USER=yourname               # until Clerk (#22)
EXPO_PUBLIC_DEV_KEY=                        # the API's DEV_KEY, from Leo; local only
```

`EXPO_PUBLIC_*` is bundled into the app, so nothing secret goes there, and `EXPO_PUBLIC_DEV_KEY` is
never set for the deployed web build.

## Commands

```bash
npm test -w app             # the session logic under Node: fixture replay, API client, transcript
npm run typecheck -w app
npm run export:web -w app   # the static web build in app/dist (Render Static Site, #27)
```

## Where things are

| Path | What |
|---|---|
| `src/app/` | The routes: `index.tsx` (start: concept + optional notes) and `session.tsx` (the session). No id in a path, so the web build stays static |
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
