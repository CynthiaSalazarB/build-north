---
title: Project Wiki Index
type: index
updated: 2026-10-20
total_pages: 3
---

# Build North project wiki

Shared notes for Reality Check: context, research and analysis that don't belong in the code.
Decisions go in [`DECISIONS.md`](../DECISIONS.md) and nowhere else. Longer reasoning behind one goes
in the entry itself, or in a `context/` page the entry links to. Connection details and secrets never
go here: the repo is public.

To add a page, put it in `context/` or `synthesis/` with this frontmatter, then add a row below and a
line in [`log.md`](log.md):

```yaml
---
title: "Page title"
type: context | synthesis
related: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Source documents (PDFs, saved articles) stay out of the repo, since it's public. Link to them from the
page under a Sources heading, the way the SurrealDB prize page does.

## Context

| Page | Summary | Updated |
|------|---------|---------|
| [SurrealDB sponsor prize](context/surrealdb-sponsor-prize.md) | SurrealDB sponsors the Agent Memory prize: what judges want, the $50 credit code, the Oct 25 deadline | 2026-10-19 |
| [Hosting setup](context/hosting-setup.md) | The SurrealDB Cloud instance and the Render service for the API: plans, regions, settings, the #8 numbers | 2026-10-20 |

## Synthesis

| Page | Summary | Updated |
|------|---------|---------|
| [Plan to win](synthesis/plan-to-win.md) | Where the project stands on Oct 20, the Expo prize playbook (EAS Build, Update, Hosting, Workflows), each judging criterion, the days to Oct 29, owners, the cut list and the decisions to take | 2026-10-20 |
