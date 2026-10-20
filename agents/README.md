# agents

The thinking engine, as plain TypeScript with no server code. Package name: `@build-north/agents`.

- **Contracts**: the JSON the app, the API and the agents share, as Zod schemas in
  [`src/contracts.ts`](src/contracts.ts). [`CONTRACTS.md`](CONTRACTS.md) is the reference; the schemas
  follow it.
- **Fixtures**: [`fixtures/session-1.json`](fixtures/session-1.json) is the democracy session from the
  brief as 8 steps, each with the input the app sends and the `Turn` that comes back.
  [`fixtures/worked-example.json`](fixtures/worked-example.json) is the planet worked example (level 1),
  shipped as a file, not a Claude call.
- **Prompts** and the **orchestrator** (`advance`) come next (#2, #3).

## Use it

```ts
// API (runtime): schemas and types
import { Turn, TurnBody, EvaluatorOutput } from "@build-north/agents";

// App: types only, so no server code ends up in the bundle
import type { Turn } from "@build-north/agents";

// Fixtures (in Node, JSON imports need the attribute; Metro in the app doesn't)
import session1 from "@build-north/agents/fixtures/session-1.json" with { type: "json" };
```

The agent output schemas (`QuestionerOutput`, `EvaluatorOutput`, `WholeMapEvaluatorOutput`,
`FactDeskOutput`, `HintGiverOutput`, `CoachOutput`) go straight into the SDK's `zodOutputFormat`.

## Commands

```bash
npm test            # every JSON example in CONTRACTS.md and every fixture parses
npm run typecheck
```

There is no build step, the same convention as `api/`: Node 24 runs the `.ts` files directly by
stripping the types. So only write TypeScript that can be erased (no `enum`, `namespace` or constructor
parameter properties), import local files with their `.ts` extension, and use `import type` for types.
The type check catches the rest.
