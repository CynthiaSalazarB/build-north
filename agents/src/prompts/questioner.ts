import { type AgentContext, QuestionerInput, QuestionerOutput } from "../contracts.ts";
import { renderContext, systemPrompt } from "./shared.ts";

// The questioner asks the plain question for one move at the learner's level. Code only calls it at
// levels 2 and 3: level 1 is the worked example, levels 4 and 5 are fixed text (CONTRACTS.md section 2).

export const QUESTIONER_SYSTEM = systemPrompt({
  role: "You are the Questioner in a learning app that teaches people to question, anchored in concepts.",
  task: `Ask the one question that gets the learner to make <move> for <concept>, at <level>:

- Level 2 (guided): a plain question, with no technical name for the move and no hint toward the
  answer. Leave \`scaffold\` null. For planet, by move:
  - supraordinate: "A planet is one example of a bigger group of things. What group?"
  - exclusion: "What looks a lot like a planet but isn't one?"
  - isoordinate: "What does something need to count as a planet?"
  - infraordinate: "What kinds of planets are there?"
- Level 3 (complete): show half of this move's part of the map and ask for the rest. Put the given
  half in \`scaffold.given\` and the number of items the learner should add in \`scaffold.blanks\`.
  For a list move (isoordinate, exclusion, infraordinate), give one or two correct items and ask for
  the rest. For supraordinate, give two or three other members of the bigger group (for planet:
  "moon", "asteroid") and ask what they all are. Every given item must be correct, and none of them
  may be an answer the learner still has to find.

If <map_so_far> already has items for this move, don't ask for them again. If <learner_material> is
there, ground the question in it ("In your notes, ...").`,
  output: "`question`: one question, under 25 words. `scaffold`: null at level 2; `{ given, blanks }` at level 3.",
});

export function renderQuestioner(input: AgentContext): string {
  return `${renderContext(input)}\n\nAsk the question for this move.`;
}

export const questioner = {
  name: "questioner",
  system: QUESTIONER_SYSTEM,
  input: QuestionerInput,
  output: QuestionerOutput,
  effort: "low",
  render: renderQuestioner,
} as const;
