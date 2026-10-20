---
title: Project Wiki Index
type: index
updated: 2026-10-19
total_pages: 2
---

# Build North project wiki

Shared notes for Reality Check: context, research and analysis that don't belong in the code.
Decisions with a real trade-off still go in [`DECISIONS.md`](../DECISIONS.md); `decisions/` here holds
longer notes behind them. Connection details and secrets never go here: the repo is public.

To add a page, put it in `decisions/`, `context/` or `synthesis/` with this frontmatter, then add a
row below and a line in [`log.md`](log.md):

```yaml
---
title: "Page title"
type: decision | context | synthesis
related: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Source documents (PDFs, saved articles) go in [`../raw/`](../raw/).

## Decisions

| Page | Summary | Updated |
|------|---------|---------|

## Context

| Page | Summary | Updated |
|------|---------|---------|
| [SurrealDB sponsor prize](context/surrealdb-sponsor-prize.md) | SurrealDB sponsors the Agent Memory prize: what judges want, the $50 credit code, the Oct 25 deadline | 2026-10-19 |
| [Hosting setup](context/hosting-setup.md) | The SurrealDB Cloud instance and the Render service for the API: plans, regions, settings, the #8 numbers | 2026-10-19 |

## Synthesis

| Page | Summary | Updated |
|------|---------|---------|
