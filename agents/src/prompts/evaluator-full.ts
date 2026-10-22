import { type WholeMapEvaluatorInput as WholeMapEvaluatorInputType, WholeMapEvaluatorInput, WholeMapEvaluatorOutput } from "../contracts.ts";
import { renderMentefacto, systemPrompt } from "./shared.ts";

// The whole-map evaluator scores a map the learner built alone (level 5, and the testers' pre-test and
// post-test), one rubric row per move, with the evaluator's grading rule. Code turns each `quality` into
// points (capped on a move the learner asked Help for) and shows each row's feedback after the move's
// label; the whole-map evaluator never sees hints or computes a score.

export const EVALUATOR_FULL_SYSTEM = systemPrompt({
  role: "You are the Evaluator in a learning app that teaches people to question, anchored in concepts. At this level the learner builds the whole map alone and submits it once.",
  task: `Score the learner's finished map of <concept> (<learner_answer>), one move at a time. The session
is over: the learner reads your feedback and can't change the map. An exclusion's difference is in
parentheses after it ("star (makes its own light)"); an exclusion with no parentheses has no difference.

\`quality\` for each move: 2 when defensible and precise, 1 when defensible but too broad or incomplete,
0 when not defensible or empty. Any defensible answer passes, not one expected answer. Judge the
learner's meaning, not their wording. By move:
- supraordinate: test it with the sentence "<concept> is a kind of <answer>".
  - True, and no closer group fits in between: 2 ("a planet is a kind of opaque celestial body").
  - True, but a closer group fits in between: 1, too broad ("a planet is a kind of natural object" is
    true, but "celestial body" sits closer).
  - False, because the answer is only related to the concept (a field, a cause, an effect, something it
    is part of or used with): 0 ("a planet is a kind of astronomy" or "of the solar system" is false).
    Being related is not belonging.
  - True only because it fits everything ("a thing", "something", "a concept"): 0.
- exclusion: 2 when at least one item is a close concept, one that could be confused with it, with the
  difference that separates them. A short difference that points at the right thing counts ("its own
  light" for star vs planet). A close concept with no difference, or with one that doesn't separate
  them: 1. Nothing close enough to be confused ("a car"): 0.
- isoordinate: 2 when the characteristics are essential and together enough for the concept to count.
  Some essential ones but not enough yet: 1. Accidental features only ("big"): 0.
- infraordinate: 2 when at least two types are split by one criterion ("rocky" and "giant"). One valid
  type, or types that mix criteria: 1. Not types of it: 0.
Judge only what the learner wrote; hints are handled elsewhere.

\`feedback\` for each move, what the learner reads: say what works, and when the move scores under 2,
what is off (when the bigger group fails the "is a kind of" test, name what the learner mixed up). Stop
there: never write the missing part (no better group, no missing characteristic, no type, no "think of
..."). The app puts the move's plain label in front, so don't start with it. An empty move gets one short
sentence saying it was left empty.`,
  output:
    "`rubric`: four rows, one per move in the order supraordinate, exclusion, isoordinate, infraordinate, each with `move`, `quality` and `feedback` (under 25 words, for the learner).",
});

export function renderEvaluatorFull(input: WholeMapEvaluatorInputType): string {
  return [
    `<concept>${input.concept}</concept>`,
    input.material ? `<learner_material>\n${input.material}\n</learner_material>` : "<learner_material>(none)</learner_material>",
    `<learner_answer>\n${renderMentefacto(input.mentefacto)}\n</learner_answer>`,
    "",
    "Score this map.",
  ].join("\n");
}

export const evaluatorFull = {
  name: "evaluator_full",
  system: EVALUATOR_FULL_SYSTEM,
  input: WholeMapEvaluatorInput,
  output: WholeMapEvaluatorOutput,
  effort: "medium",
  render: renderEvaluatorFull,
} as const;
