// Dev harness for the eval scripts: runs one agent from the registry against Claude, the way the API's
// callAgent (#10) does. Not part of the package: nothing under src/ imports it, and the SDK is a
// devDependency. Needs ANTHROPIC_API_KEY (the eval scripts load ../.env).
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { AgentDefinition } from "../src/index.ts";

const client = new Anthropic();
export const MODEL = process.env.AGENT_MODEL || "claude-opus-5-5";

export type AgentRun<O> = { output: O; ms: number; inputTokens: number; outputTokens: number };

export async function runAgent<I, O>(agent: AgentDefinition<I, O>, rawInput: I): Promise<AgentRun<O>> {
  const input = agent.input.parse(rawInput);
  const started = performance.now();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: agent.system,
    messages: [{ role: "user", content: agent.render(input) }],
    output_config: { format: zodOutputFormat(agent.output), effort: agent.effort },
    // If a safety classifier declines, the API retries on the model Anthropic recommends for that case.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  const ms = Math.round(performance.now() - started);
  if (response.stop_reason === "refusal") throw new Error(`${agent.name}: Claude declined (${response.stop_details?.category ?? "no category"})`);
  if (response.stop_reason === "max_tokens") throw new Error(`${agent.name}: output cut off at max_tokens`);
  if (!response.parsed_output) throw new Error(`${agent.name}: no structured output (stop_reason ${response.stop_reason})`);
  return {
    output: response.parsed_output as O,
    ms,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

/** Rough cost on Opus 5.5 ($4 in / $20 out per million tokens), for the summary line. */
export function dollars(runs: { inputTokens: number; outputTokens: number }[]): string {
  const cost = runs.reduce((sum, r) => sum + (r.inputTokens * 4 + r.outputTokens * 20) / 1_000_000, 0);
  return `$${cost.toFixed(3)}`;
}
