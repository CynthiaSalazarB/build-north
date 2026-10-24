# How we used Clerk

For the Best Use of Clerk entry and the README (#55). Every claim names the file it lives in. No keys or
secrets here: the repo is public.

## What the learner sees

- **Android:** Clerk's hosted sign-in opens in an in-app browser from `app/src/app/sign-in.tsx`
  (`useHostedAuth` from `@clerk/expo/hosted-auth`), on its sign-up or sign-in screen. The methods come
  from the Clerk dashboard, so the app ships no sign-in form of its own.
- **The web:** the landing page is the sign-in. `app/src/app/sign-in.web.tsx` renders Clerk's prebuilt
  `<SignIn />` (`@clerk/expo/web`) in Lumente's colors, next to the code and the empty map the learner is
  about to light. Expo Router picks the `.web.tsx` file on the web and `sign-in.tsx` on Android: one
  route, two platforms.
- **Methods:** email verification code and Google (DECISIONS.md, 2026-10-22, "Sign-in by email code and
  Google"). Google sign-ins don't count against the development instance's 100 emails a month.
- **Only signed-in learners see the app.** `app/src/app/_layout.tsx` wraps the screens in
  `<Stack.Protected guard={signedIn}>` and the sign-in route in `<Stack.Protected guard={clerk && !signedIn}>`,
  so a signed-out learner can't reach a session and a signed-in one never sees the sign-in page.
- **Copy:** Clerk's "Welcome back! Please sign in to continue" is replaced through the `localization`
  prop in `_layout.tsx`: "Sign in to Lumente", "Join Lumente".

## How the API trusts a learner

- **The token travels with every call.** `app/src/session/api-client.ts` asks Clerk for the session token
  (`getToken` from `useAuth`) and sends it as `Authorization: Bearer <token>`. On Android the token cache
  is `expo-secure-store` (`tokenCache` from `@clerk/expo/token-cache`), so it survives a restart and
  never sits in plain storage.
- **Checked without a network call.** `api/src/clerk.ts` verifies the token with the instance's PEM
  public key (`verifyToken` from `@clerk/backend`, the `jwtKey` option). The key comes from the
  `CLERK_JWT_KEY` environment variable (Clerk dashboard → API keys → "Show JWT public key"); there is no
  `CLERK_SECRET_KEY` on the server, so the API can't call Clerk's backend even if it wanted to, and a
  turn never waits on Clerk.
- **A web build's token must come from a site we serve.** A token made on the web names its origin in
  `azp`; `clerkUserFromToken` refuses any `azp` not in `CORS_ORIGIN`. The native app's token has no
  `azp` and passes on the signature alone.
- **The Clerk user id is the row key.** Sessions and mastery are stored under `claims.sub`
  (`api/src/store.ts`: `session.user`, `mastery.user`, both indexed). No email, no name, nothing else
  about the person is stored on our side.
- **No token, no answer.** Every route except `/health` and `/health/db` answers `401` without a valid
  token (`api/src/app.ts`), and `429` past the rate limit: 60 requests a minute from one address by default
  (`REQUESTS_PER_MINUTE`; 240 on Render since Oct 23, for a room on one Wi-Fi).

## Deleting yourself

`DELETE /me/data` (`api/src/app.ts`) purges the caller's Agent Memory scope first, then removes every
session, agent log and mastery row keyed by the caller's Clerk user id; if the purge fails, nothing is deleted
and the answer is a `500`, so the learner can try again. The app's "Delete my data" button (#43, shipped in
#103) calls it, then signs out. The Clerk account itself is the learner's to delete in Clerk's own account page.

## For judges: signing in without an inbox

Clerk's development instances treat any address with the `+clerk_test` subaddress as a test address:
no email is sent, and the verification code is `424242`
([Clerk docs, "Test emails and phones"](https://clerk.com/docs/guides/development/testing/test-emails-and-phones)).
So `judge+clerk_test@example.com` with code `424242` signs in on the web build and on the APK. Each
judge can use their own `<name>+clerk_test@example.com`.

## Where Clerk shaped the build

| Decision | Why Clerk | Where |
|---|---|---|
| Hosted sign-in on Android, prebuilt `<SignIn />` on the web | Nothing to build or test on two platforms the week before the freeze | `sign-in.tsx`, `sign-in.web.tsx` |
| Networkless token check | A turn's budget is 8 s; a Clerk round trip per request would eat it | `api/src/clerk.ts` |
| `azp` against `CORS_ORIGIN` | The same check that gates browsers gates tokens, one list to maintain | `api/src/clerk.ts`, `CORS_ORIGIN` on Render |
| Rows keyed by the Clerk id | No personal data in our database; delete is one query | `api/src/store.ts` |
| Email code plus Google | Judges and testers in one tap; Google sign-ins don't count against the email cap | Clerk dashboard |
| `+clerk_test` for judges | Judges sign in without an inbox, on a development instance | this page |

Checks: `api/src/app.test.ts` signs tokens with a stand-in Clerk key pair (RS256) and covers the missing
token, a wrong key and the dev headers in production, all 401; the live check is `/me/mastery` without a
token on https://build-north-api.onrender.com, which answers 401 (Oct 22).
