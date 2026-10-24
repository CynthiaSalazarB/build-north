# Handoff: important web-test fixes

## Completed

- Added a first-attempt acknowledgment before the worked example or first move.
- Scoped mastery to user plus normalized concept; new concepts now begin at level 1.
- Saved each session's move order and seed it from the previous coach `nextFocus` for that concept.
- Rejects a coach's unsupported prior-session comparison when no memory facts were supplied; normal fallback finishes the session.
- Production web Ship hook rejects missing or test Clerk publishable keys.
- Updated contracts, deploy notes, smoke checks, fixtures and regression coverage.

## Decisions

- Do not strip Clerk callback tokens from URLs by hand. Clerk's development-instance query tokens are removed by using a production instance; the SDK owns the handshake.
- B5 and B11 already have resume/session-list support in this checkout; avoid duplicating those changes.
- Existing global mastery rows have no concept attribution, so the new concept-scoped reads don't guess where to assign them.

## Open item: production Clerk configuration

- Set EAS `production` variable `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` to the real production Clerk `pk_live_...$` value.
- Set matching production JWT public key as Render `CLERK_JWT_KEY`.
- Run Ship only after both settings are in place. Until then the live site remains on its current deployment; the new hook blocks another development-key production deploy.

## Verification

- `npm test` -> pass (app 77, API 73, agents 111; one real-SurrealDB integration test skipped because `SURREAL_TEST_URL` is unset).
- `npm run typecheck --workspace app` -> pass.
- `npm run typecheck --workspace api` -> pass.
- `npm run typecheck --workspace agents` -> pass.
- `npx eas-cli@latest workflow:validate .eas/workflows/ship.yml --non-interactive` -> valid.
