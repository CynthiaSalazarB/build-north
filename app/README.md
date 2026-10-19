# app

Expo + React Native (TypeScript, Expo Router). iOS, Android and web from one codebase.

Not scaffolded yet. To start, from the repo root (create-expo-app wants an empty folder, so this
README goes first; put its rules into the new README):

```bash
rm app/README.md
npx create-expo-app@latest app --template default
```

Note the template in the Devpost submission (templates are allowed if disclosed).

Rules:
- Read the API URL from `EXPO_PUBLIC_API_URL`. Nothing secret goes in `EXPO_PUBLIC_*`.
- Import from `agents` with `import type` only.
- Until the API exists, render the example `Turn` objects in [`../agents/CONTRACTS.md`](../agents/CONTRACTS.md).
