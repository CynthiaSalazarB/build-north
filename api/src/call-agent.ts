import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  CoachInput,
  CoachOutput,
  EvaluatorInput,
  EvaluatorOutput,
  FactDeskInput,
  FactDeskOutput,
  HintGiverInput,
  HintGiverOutput,
  QuestionerInput,
  QuestionerOutput,
  WholeMapEvaluatorInput,
  WholeMapEvaluatorOutput,
  type AgentName,
  type CallAgent,
} from "@build-north/agents";
import type { AgentLogEntry } from "./store.ts";

// The only code that talks to Claude (#10). CONTRACTS.md section 2: one structured-output call per
// agent, with the agent's prompt as the system prompt and its input as JSON in the user message.
// The reply is checked here rather than by the SDK's parse(), which throws on a reply that breaks the
// schema: that loses the billed usage, and the failure is worth a retry.

type Schema = Parameters<typeof zodOutputFormat>[0];
type Effort = NonNullable<Anthropic.OutputConfig["effort"]>;
type Usage = Pick<Anthropic.Usage, "input_tokens" | "output_tokens" | "cache_creation_input_tokens" | "cache_read_input_tokens">;

// CONTRACTS.md sections 2 and 5: what each agent takes and returns, and how hard it thinks. The coach
// only words numbers it is given, so it gets the lowest effort too.
export const AGENTS: Record<AgentName, { input: Schema; output: Schema; effort: Effort }> = {
  questioner: { input: QuestionerInput, output: QuestionerOutput, effort: "low" },
  evaluator: { input: EvaluatorInput, output: EvaluatorOutput, effort: "medium" },
  evaluator_full: { input: WholeMapEvaluatorInput, output: WholeMapEvaluatorOutput, effort: "medium" },
  hint_giver: { input: HintGiverInput, output: HintGiverOutput, effort: "low" },
  fact_desk: { input: FactDeskInput, output: FactDeskOutput, effort: "low" },
  coach: { input: CoachInput, output: CoachOutput, effort: "low" },
};

// Dollars per million tokens (platform.claude.com/docs/en/about-claude/pricing, Oct 2026). cacheWrite
// is the 5-minute cache. AGENT_MODEL can only name a model listed here, so every call has a price.
const PRICES: Record<string, { input: number; cacheWrite: number; cacheRead: number; output: number }> = {
  "claude-opus-5-5": { input: 4, cacheWrite: 5, cacheRead: 0.2, output: 20 },
  "claude-sonnet-5-5": { input: 2, cacheWrite: 2.5, cacheRead: 0.1, output: 10 },
};

// DECISIONS.md, Oct 20: stop at 95% of the rate limits and of the budget; the rest covers calls in flight
const STOP_AT = 0.95;
// A ceiling, not a target: thinking counts toward it, and the JSON itself is short
const MAX_TOKENS = 16_000;
// The anthropic-ratelimit-* header families (platform.claude.com/docs/en/api/rate-limits)
const WINDOWS = ["requests", "tokens", "input-tokens", "output-tokens"] as const;

export type AgentConfig = { model: string; budgetUsd: number };

// Null without ANTHROPIC_API_KEY: the API still starts, with the stand-in that fails loudly.
export function agentConfigFromEnv(env: NodeJS.ProcessEnv = process.env): AgentConfig | null {
  if (!env.ANTHROPIC_API_KEY?.trim()) return null;
  const model = env.AGENT_MODEL?.trim() || "claude-opus-5-5";
  if (!PRICES[model]) throw new Error(`AGENT_MODEL must be one of: ${Object.keys(PRICES).join(", ")}`);
  const budgetUsd = Number(env.AGENT_BUDGET_USD);
  if (!(budgetUsd > 0)) {
    throw new Error("ANTHROPIC_API_KEY is set, so AGENT_BUDGET_USD (the Claude budget in dollars) is required");
  }
  return { model, budgetUsd };
}

// What callAgent throws: the two fields of Turn.error (CONTRACTS.md section 3), so `advance` can copy
// them into the Turn it returns.
export class AgentCallError extends Error {
  readonly code: "agent_failed" | "rate_limited";
  readonly retryable: boolean;

  constructor(code: AgentCallError["code"], retryable: boolean, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AgentCallError";
    this.code = code;
    this.retryable = retryable;
  }
}

// What one call gives back, as far as callAgent cares. The real one is sendWith(client); tests fake it.
export type ClaudeReply = {
  message: { content: readonly { type: string; text?: string }[]; stop_reason: string | null; usage: Usage };
  headers: Headers;
};
export type SendToClaude = (params: Anthropic.MessageCreateParamsNonStreaming) => Promise<ClaudeReply>;

export const sendWith =
  (client: Anthropic): SendToClaude =>
  async (params) => {
    const { data, response } = await client.messages.create(params).withResponse();
    return { message: data, headers: response.headers };
  };

export type CallAgentOptions = AgentConfig & {
  send: SendToClaude;
  // the system prompt per agent; an agent without one fails before any call
  prompts: Partial<Record<AgentName, string>>;
  log: (entry: AgentLogEntry) => Promise<void>;
};

type Window = { used: number; resetsAt: number };

// For each rate-limit window the response reports: the share already used, and when it refills.
function windowsFrom(headers: Headers): Window[] {
  const windows: Window[] = [];
  for (const name of WINDOWS) {
    const [limit, remaining, reset] = ["limit", "remaining", "reset"].map((part) => headers.get(`anthropic-ratelimit-${name}-${part}`));
    if (limit == null || remaining == null || reset == null) continue;
    const resetsAt = Date.parse(reset);
    if (Number(limit) > 0 && Number.isFinite(Number(remaining)) && Number.isFinite(resetsAt)) {
      windows.push({ used: 1 - Number(remaining) / Number(limit), resetsAt });
    }
  }
  return windows;
}

const dollars = (usage: Usage, price: (typeof PRICES)[string]) =>
  (usage.input_tokens * price.input +
    (usage.cache_creation_input_tokens ?? 0) * price.cacheWrite +
    (usage.cache_read_input_tokens ?? 0) * price.cacheRead +
    usage.output_tokens * price.output) /
  1_000_000;

// Worth a retry: rate limits, timeouts, dropped connections and Anthropic's own errors. A 4xx means
// the request itself is wrong, and a retry would send the same request.
function failure(agent: AgentName, error: unknown): AgentCallError {
  const message = `The ${agent} call failed: ${error instanceof Error ? error.message : String(error)}`;
  if (error instanceof Anthropic.RateLimitError) return new AgentCallError("rate_limited", true, message, { cause: error });
  if (error instanceof Anthropic.APIConnectionError) return new AgentCallError("agent_failed", true, message, { cause: error });
  if (error instanceof Anthropic.APIError) {
    return new AgentCallError("agent_failed", (error.status ?? 500) >= 500, message, { cause: error });
  }
  return new AgentCallError("agent_failed", false, message, { cause: error });
}

// One callAgent per session, so every agent_log row names its session. The spend and the rate-limit
// windows are shared by all sessions.
export function createCallAgent({ send, model, budgetUsd, prompts, log }: CallAgentOptions): (sessionId: string) => CallAgent {
  const price = PRICES[model];
  if (!price) throw new Error(`There's no price for ${model}, so the budget can't be counted`);
  // Counted in memory, so it starts again at $0 after a restart; the account's own balance, with
  // auto-reload off (#20), is the hard stop.
  let spentUsd = 0;
  let windows: Window[] = [];

  const call = async (sessionId: string, agent: AgentName, input: unknown): Promise<unknown> => {
    const spec = AGENTS[agent];
    const prompt = prompts[agent];
    if (!prompt) throw new AgentCallError("agent_failed", false, `There's no ${agent} prompt yet (#2)`);
    const parsed = spec.input.safeParse(input);
    if (!parsed.success) {
      throw new AgentCallError("agent_failed", false, `The ${agent} input doesn't fit its schema: ${parsed.error.message}`);
    }
    if (spentUsd >= STOP_AT * budgetUsd) {
      throw new AgentCallError("rate_limited", false, `$${spentUsd.toFixed(2)} of the $${budgetUsd} Claude budget is spent`);
    }
    const full = windows.find((window) => window.used >= STOP_AT && window.resetsAt > Date.now());
    if (full) {
      throw new AgentCallError("rate_limited", true, `A Claude rate limit is ${Math.round(full.used * 100)}% used until ${new Date(full.resetsAt).toISOString()}`);
    }

    const started = performance.now();
    let reply: ClaudeReply;
    try {
      reply = await send({
        model,
        max_tokens: MAX_TOKENS,
        system: prompt,
        messages: [{ role: "user", content: JSON.stringify(parsed.data) }],
        output_config: { effort: spec.effort, format: zodOutputFormat(spec.output) },
      });
    } catch (error) {
      if (error instanceof Anthropic.APIError && error.headers) windows = windowsFrom(error.headers);
      throw failure(agent, error);
    }
    const ms = performance.now() - started;
    windows = windowsFrom(reply.headers);
    // a refusal, or a reply cut off or off the schema, is billed too
    const usd = dollars(reply.message.usage, price);
    spentUsd += usd;

    const { content, stop_reason } = reply.message;
    if (stop_reason === "refusal") throw new AgentCallError("agent_failed", false, `Claude declined the ${agent} call`);
    let output: unknown;
    try {
      // thinking blocks may come first; the JSON is in the text block
      output = spec.output.parse(JSON.parse(content.find((block) => block.type === "text")?.text ?? ""));
    } catch (error) {
      const reason = `The ${agent} reply didn't fit its schema (stop reason: ${stop_reason})`;
      throw new AgentCallError("agent_failed", true, reason, { cause: error });
    }
    // a lost log row shouldn't cost the learner their turn
    log({ session: sessionId, agent, input: parsed.data, output, ms, usd }).catch((error: unknown) => {
      console.error("agent_log write failed:", error);
    });
    return output;
  };

  return (sessionId) => async (agent, input) => {
    try {
      return await call(sessionId, agent, input);
    } catch (error) {
      console.error(`callAgent (${agent}, session ${sessionId}):`, error);
      throw error;
    }
  };
}
