// What the API checks on the coach's and the hint giver's answers when memory is on (CONTRACTS.md section 2,
// Memory): a message may cite only facts it was given. Pure, so the API calls it on each output it logs.
import type { CoachOutput, HintGiverOutput, LearnerMemory } from "./contracts.ts";

/** The output with only the cites whose id is a fact in `memory` (each once, in order), and the ids dropped,
 * for the log. An output with no `cites` comes back as it is. */
export function verifyCites<T extends CoachOutput | HintGiverOutput>(output: T, memory: LearnerMemory | undefined): { output: T; dropped: string[] } {
  if (!output.cites) return { output, dropped: [] };
  const given = new Set((memory?.facts ?? []).map((fact) => fact.id));
  const kept = [...new Set(output.cites)].filter((id) => given.has(id));
  const dropped = output.cites.filter((id) => !given.has(id));
  return { output: { ...output, cites: kept }, dropped };
}
