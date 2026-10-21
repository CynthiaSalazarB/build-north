# agents

The thinking engine, as plain TypeScript with no server code. Package name: `@build-north/agents`.

- **Contracts**: the JSON the app, the API and the agents share, as Zod schemas in
  [`src/contracts.ts`](src/contracts.ts). [`CONTRACTS.md`](CONTRACTS.md) is the reference; the schemas
  follow it.
- **Fixtures**: [`fixtures/session-1.json`](fixtures/session-1.json) is the democracy session from the
  brief as 9 steps, each with the input the app sends and the `Turn` that comes back.
  [`fixtures/worked-example.json`](fixtures/worked-example.json) is the planet worked example (level 1),
  shipped as a file, not a Claude call.
  [`fixtures/demo-seed.json`](fixtures/demo-seed.json) is the demo profile (#32): the demo user at level 5
  on every move, the CORS session waiting at the whole map, and the script the presenter follows
  (3 questions, the map to submit, and the numbers it should give: 6/8, gap +1, no hints). The API loads
  it for the demo user (#44).
- **Prompts**: one file per agent in [`src/prompts/`](src/prompts/), all built from the shared skeleton in
  [`shared.ts`](src/prompts/shared.ts) (the method, the rules every agent follows, the task, the output
  line). [`src/agents.ts`](src/agents.ts) is the registry `callAgent` reads: each agent's `system`,
  `render(input)`, `input` and `output` schemas, and `effort`. Prompt examples use "planet" only, never a
  concept we measure (a test enforces it).
- The **orchestrator**: `advance(state, input, callAgent)` in [`src/orchestrator/`](src/orchestrator/)
  (#3). [`rules.ts`](src/orchestrator/rules.ts) holds the numbers (hint ladder, points, levels, mixed
  levels), [`texts.ts`](src/orchestrator/texts.ts) everything the app says without Claude, and
  [`advance.ts`](src/orchestrator/advance.ts) the flow. It reaches Claude only through `callAgent`.

## Use it

```ts
// API (runtime): schemas and types
import { Turn, TurnBody, EvaluatorOutput } from "@build-north/agents";

// App: types and values (no server code lives here); see app/README.md for the one tsconfig line
import { MOVE_LABEL, type Turn } from "@build-north/agents";

// Fixtures (in Node, JSON imports need the attribute; Metro in the app doesn't)
import session1 from "@build-north/agents/fixtures/session-1.json" with { type: "json" };
```

The agent output schemas (`QuestionerOutput`, `EvaluatorOutput`, `WholeMapEvaluatorOutput`,
`FactDeskOutput`, `HintGiverOutput`, `CoachOutput`) go straight into the SDK's `zodOutputFormat`.

## Commands

```bash
npm test                  # contracts, fixtures and prompt checks (no Claude calls)
npm run typecheck
npm run eval:evaluator    # Claude judges 6 answers for democracy's bigger group (#2: 5 of 6 right)
npm run eval:questioner   # Claude asks level-2 and level-3 questions; checks no jargon, no answer
npm run eval:hint-giver   # the 4 hint steps on "a law" (#21: no answer before reveal) + a counterexample
npm run eval:fact-desk    # 10 inflation questions, 5 asking for the structure (#25: 0 leaks, type 8/10)
npm run eval:whole-map    # the whole-map evaluator on the demo's CORS map (6/8) and a blank map (0/8) (#36)
npm run eval:coach        # the coach on 4 finished sessions (#44: no number it wasn't given, nextFocus a weakest part)
npm run play:session      # the whole democracy session against Claude: transcript, score, seconds per turn
npm run play:demo         # the demo's level-5 part against Claude: fact desk answers and the map's score
```

The `eval:*` scripts call Claude with `ANTHROPIC_API_KEY` from the repo's `.env` and print the cost.
[`scripts/run-agent.ts`](scripts/run-agent.ts) makes the call the way the API's `callAgent` should
(#10): the agent's `system`, `render(input)` as the user message, `output` through `zodOutputFormat`,
its `effort`, and `fallbacks: "default"` so a safety decline retries on another model.

There is no build step, the same convention as `api/`: Node 24 runs the `.ts` files directly by
stripping the types. So only write TypeScript that can be erased (no `enum`, `namespace` or constructor
parameter properties), import local files with their `.ts` extension, and use `import type` for types.
The type check catches the rest.
