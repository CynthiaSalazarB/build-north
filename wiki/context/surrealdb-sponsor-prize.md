---
title: "SurrealDB sponsor prize: Agent Memory"
type: context
related: ["[[hosting-setup]]"]
created: 2026-10-19
updated: 2026-10-19
---

As relayed by Leo on Oct 19 from SurrealDB's Build North participant pack. Not re-checked against the sources.

## The prize

- SurrealDB sponsors Build North. The prize is $1,000 in Agent Memory credit.
- Judges want three things: facts that replace old facts without overwriting them, answers you can
  trace back to their source, and memory shared across more than one agent. A single-agent CRUD demo
  is unlikely to be competitive.
- Submissions close Oct 25, 11:59 PM ET. Chiru Boggavarapu from SurrealDB answers questions in the
  Build North Discord.

## Getting started

- Every participant gets $50 of Agent Memory credit: in Studio, Billing, code `BUILDNORTH50`, Redeem.
  Not redeemed yet as of Oct 19.
- Studio sidebar: Agent Memory, Deploy new context (name, region). Then API keys: the secret starts
  with `sp-` and shows once. Each context has its own host URL and context ID; there's no global endpoint.
- Env vars: `SPECTRON_URL`, `SPECTRON_CONTEXT_ID`, `SPECTRON_API_KEY`. Write with
  `POST $SPECTRON_URL/api/v1/$SPECTRON_CONTEXT_ID/facts`, read with `/query`.
- SDKs: `@surrealdb/memory` (JS/TS) and `surrealdb[memory]` (Python).

## Possible fit with Reality Check (Leo's read, not a team decision)

- Several agents already share one learner (questioner, evaluator, hint giver, fact desk, coach).
- Mastery per move changes over time: each level-up is a new fact that replaces the old one, with the
  history kept.
- The fact desk answers from the learner's pasted material, so each answer can point to its source.

## Sources

- [Build North resources](https://build-north.devpost.com/resources)
- [SurrealDB Build North participant pack](https://surrealdb.notion.site/Build-North-SurrealDB-participant-resources-pack-3edbfa44ae3e81a0a6ebd0b4fbb802d3)
- [Agent Memory hosted quickstart](https://surrealdb.com/docs/agent-memory/quickstarts/hosted.md)
- [Agent Memory on SurrealDB Cloud](https://surrealdb.com/docs/agent-memory/quickstarts/surrealdb-cloud.md)
