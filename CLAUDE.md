# Reality Check: notes for Claude

Read these before planning or starting a task, in this order:

1. [`wiki/synthesis/plan-to-win.md`](wiki/synthesis/plan-to-win.md): the team's plan until Demo Day
   (Oct 29): what to finish first, the Expo prize playbook, proposed owners, the cut list and the
   decisions still open. Check a task against it before starting, and flag anything that conflicts.
   For anything in `app/` or on EAS, read [`wiki/synthesis/expo-prize-plan.md`](wiki/synthesis/expo-prize-plan.md)
   too: the Expo prize plan, with the EAS setup and what the Expo judges look for.
2. [`agents/CONTRACTS.md`](agents/CONTRACTS.md): the contracts between the app, the API and the agents.
3. [`DECISIONS.md`](DECISIONS.md): every decision with a real trade-off, and why it was taken.
4. [`wiki/index.md`](wiki/index.md): project notes (hosting, the SurrealDB prize).

Rules the team already follows:

- The repo is public: no secrets, connection details, keys or tester names in any file.
- `main` is protected. Every change goes through a short branch and a pull request, docs included, and
  one teammate reviews. Changes to `agents/CONTRACTS.md` and new `DECISIONS.md` entries arrive the same
  way; the merge is the acceptance.
- Stand-in code says `Temporary:` in its comment.
- `api/` and `agents/` have no build step: Node 24 runs the TypeScript directly, so only erasable syntax
  (no `enum` or `namespace`), and local imports keep their `.ts` extension.
