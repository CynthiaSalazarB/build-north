// Every agent the API can call, in one registry. callAgent (#10) looks an agent up by name, checks the
// input with `input`, sends `system` and `render(input)` to Claude with `output` as the structured
// output format, and returns the parsed result. The coach (#44) joins the registry the same way.
import type { z } from "zod";
import type { AgentName } from "./contracts.ts";
import { evaluator } from "./prompts/evaluator.ts";
import { evaluatorFull } from "./prompts/evaluator-full.ts";
import { factDesk } from "./prompts/fact-desk.ts";
import { hintGiver } from "./prompts/hint-giver.ts";
import { questioner } from "./prompts/questioner.ts";

export type Effort = "low" | "medium" | "high";

export type AgentDefinition<I = any, O = any> = {
  name: AgentName;
  system: string;
  input: z.ZodType<I>;
  output: z.ZodType<O>;
  /** `output_config.effort` for the call (CONTRACTS.md section 5). */
  effort: Effort;
  /** The user message for one call. */
  render(input: I): string;
};

export const AGENTS = { questioner, evaluator, evaluator_full: evaluatorFull, hint_giver: hintGiver, fact_desk: factDesk } satisfies Partial<Record<AgentName, AgentDefinition>>;
