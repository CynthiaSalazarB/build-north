# agents

The thinking engine, as plain TypeScript with no server code:

- **Contracts**: the JSON each agent receives and returns, as Zod schemas (draft in
  [`CONTRACTS.md`](CONTRACTS.md)).
- **Prompts**: one per agent.
- **Orchestrator + ladder rules**: pure functions. Given the session state, they decide which agent
  speaks next, the hint step, the points, and the mastery update.

The API imports this package and supplies the Claude client and the database. Because nothing here
depends on Express or SurrealDB, the agents can be tried from a script, and the API host can change
without touching this folder.
