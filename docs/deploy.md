# Path to production

How a change merged into `main` reaches the people using Lumente: where each piece runs, what each kind
of change needs, and in what order. Merging into `main` updates the API by itself (Render's Auto-Deploy);
every other step below is started by a person.

## Where each piece runs

| Piece | Runs on | How it gets a new version |
|---|---|---|
| The API and the agents (prompts, orchestrator, scoring rules) | Render, service `build-north-api` | **By itself on every merge** into `main` (Auto-Deploy, on since Oct 22; off again from the freeze, Oct 24, and then a Manual Deploy). The agents package runs inside the API, on the server, never on the phone |
| The database | SurrealDB Cloud, database `prod` | Never deployed. Its data stays; the rules for its tables come from the API (next section) |
| Agent Memory | SurrealDB Agent Memory | Set up once; after that the API reads and writes it |
| The app on Android | the `preview` APK, installed on each phone | JavaScript changes: an **update** over the air (Ship). Native changes: a **new build** |
| The website | EAS Hosting, `reality-check.expo.app` | Ship deploys it together with the phones' update |
| The testers' website | EAS Hosting, alias `testers` | Deployed by hand from `main` before a test, then left alone until the test is over |

## The database: the data stays, the rules come from the code

SurrealDB stores the data: every session and every learner's levels live in its tables, and a deploy
never touches them. What lives in the code is the **definition** of those tables: which tables exist,
the type of some fields ("a level is a whole number from 1 to 5"), and the indexes. Those definitions are
the `DEFINE TABLE`, `DEFINE FIELD` and `DEFINE INDEX` lines at the top of `api/src/store.ts`.

Every time the API starts, it sends those lines to SurrealDB. They're written to be safe to send again
(`IF NOT EXISTS`, `OVERWRITE`), so nothing changes when they're the same, and the database follows when
they're new. The tables are `SCHEMALESS`: a session can hold fields no line defines, so most new fields
only need the API's save code to include them.

So any change to the database is a change to `api/src/store.ts`, and it reaches production with the next
Render deploy. A picture: the database is a filing cabinet that never moves; the files inside are the
data. The API is the clerk, and the labels on the drawers are the table definitions. The clerk puts the
labels up every morning when they start work. To change a label, change the clerk's instructions (the
code); the next start (the deploy) puts the new label up, and the files inside stay where they are.

This is "schema as code": the table definitions are reviewed in pull requests like any other code,
instead of typed by hand into the database's console, where nobody would see them change.

## What a change needs

| What changed | What to do |
|---|---|
| Prompts, orchestrator, scoring rules (`agents/`) | Render deploy |
| API code or table definitions (`api/`) | Render deploy |
| A secret or a switch on the server (the Claude key, Clerk, the database password, the memory flag) | Edit it in Render's Environment page; saving it starts a new deploy. No code change |
| Screens, wording, styles (`app/src`) | Ship |
| An app setting in EAS (an `EXPO_PUBLIC_` value, like the API's address) | Ship again: these values are copied into the app when the update or the website is made. They're readable by anyone, so never a secret |
| Icon, splash screen, app name, `app.json`, a native library, an Expo SDK upgrade, or the `scripts` in `app/package.json` (Expo hashes them into the fingerprint; #136 dropped a `lint` script for that) | New build, install it on the phones, then Ship |
| Docs, README, DECISIONS.md | Nothing |

## When a change touches both the app and the API

Some changes alter what the API sends back (the shape of a `Turn`, for example), so the app and the API
both have to update. They never update at the same moment, so the order matters: **first update the side
that works with both the old and the new version of the other.**

Example, #108 (the result shows before the coach's words): the new app works with the old API and the new
one, while the old app with the new API would show a stray Continue button. So: Ship first, then the
Render deploy. The same order holds for #130's memory fields: Ship first (a build without `cites` and `sources`
rejects a Turn that carries them), then `AGENT_MEMORY_ENABLED=true` on Render.

With Auto-Deploy on, the API changes the moment the pull request merges, before anyone can Ship. So when
the app has to go first, split the change in two pull requests: the app's part first (merge it and Ship),
then the API's part.

## Update or new build?

An Android app has two layers. The JavaScript layer (screens, text, logic) can be replaced over the air:
the app downloads the update when it opens and uses it the next time it opens. The native layer (the code
compiled into the APK: icon, splash, name, native libraries, the SDK) can only change with a new APK. The
fingerprint also covers the `scripts` in `app/package.json`, so a new script counts as a native change (#136).

EAS takes a **fingerprint** of the native layer. An update only reaches APKs with the same fingerprint, so
after a native change, phones with the old APK stop getting updates until they install the new build. The
free plan has 15 Android builds a month. The Preview build workflow checks the fingerprint first and only
builds when it changed, so running it when unsure costs nothing. An update also has to be made from code with
the same native layer as the APK on the phones: Ship from a branch whose `app.json` or native libraries
differ, and the update goes to a fingerprint no installed APK has.

## Commands

All EAS commands run from `app/` and need `npx eas-cli login` once, with an account in the `lumente`
organization.

- **Ship** (the phones' update and the website):
  `npx eas-cli workflow:run .eas/workflows/ship.yml`. Then close and open the app twice: the first launch
  downloads the update, the second uses it.
- **New build:** `npx eas-cli workflow:run .eas/workflows/preview-build.yml`. Install the new APK on the
  phones, then Ship.
- **Render deploy:** automatic on every merge while Auto-Deploy is on. When it's off: Render dashboard →
  `build-north-api` → Manual Deploy → Deploy latest commit (`main`). `/health` answering `{ "ok": true }`
  means it's up; it doesn't say which version.
- **The testers' website:** `npx eas-cli env:pull --environment production` (it writes `app/.env.local`),
  `npx expo export --platform web --clear`, `npx eas-cli deploy --alias testers`. Then delete `app/.env.local`:
  Expo reads it before `app/.env`, so local runs would otherwise talk to the production API.
- **Always `--clear`, and check the bundle before `eas deploy` or `eas update`.** On Oct 23 an export
  reused its cache after an env pull that printed nothing, so a web deploy went out in demo mode (no API
  URL, no Clerk key) for about five minutes on production and `testers`. Export with `--clear`, then make sure
  the API host is in the bundle before deploying; from `app/`:

  ```bash
  grep -l "build-north-api.onrender.com" dist/_expo/static/js/web/*.js
  ```

  In PowerShell: `Select-String -List -Path dist/_expo/static/js/web/*.js -Pattern "build-north-api.onrender.com"`.
  No file listed means the environment wasn't inlined: don't deploy. The same check applies to an Android
  export before `eas update --skip-bundler`: the host string sits in `dist/_expo/static/js/android/entry-*.hbc`
  (checked Oct 23 on an export with the URL set).

## What could be automatic

- **Ship on every merge:** the Ship workflow already says `on: push: main`; it only needs the Expo GitHub
  app installed on the repository (the owner installs it).
- **Render on every merge:** already on (Auto-Deploy). It goes off at the freeze (Oct 24), so nothing
  changes production during the demo unless a person chooses it.

Every deploy, update and build goes in [`expo-log.md`](expo-log.md) (EAS) or the Render dashboard's event
list (Render).
