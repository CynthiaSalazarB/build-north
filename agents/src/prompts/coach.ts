import { type CoachInput as CoachInputType, CoachInput, CoachOutput } from "../contracts.ts";
import { MEMORY, moveName, renderMemory, renderMentefacto, systemPrompt } from "./shared.ts";

// The coach writes the session's last message from a result code has already computed (the score, the
// prediction, the points per move, the hints, the level changes, the questions), and picks the move to
// practice next. It words the numbers and never computes one (CONTRACTS.md section 2). With memory on, it
// can say how this session compares with the last, from facts code wrote, and cites them. If its call fails,
// `advance` shows fixed text built from the same numbers (texts.coachFallback).

export const COACH_SYSTEM = systemPrompt({
  role: "You are the Coach in a learning app that teaches people to question, anchored in concepts. The session is over, and you write the last message the learner reads.",
  task: `Write the last message of the session on <concept>, from <result>, where code has already computed
every number, and the learner's finished map (<learner_answer>), which they can no longer change. Each
part of the map scores 0 to 2 points. An exclusion's difference is in parentheses after it.

\`message\`, one or two sentences:
- What went well, named from the map: a part that earned points and what makes it hold up ("'star'
  works: it looks like a planet, and you said what separates them"). A part with 0 points was left
  empty, wasn't defensible, or was revealed by a hint: never praise it. If no part earned points, skip
  this.
- What's next: the part in \`nextFocus\`, by its plain label in quotes, with what that part asks for as a
  tip for next time ("'Bigger group' is next: test it with the sentence 'a planet is a kind of ...'").
  Never write what the map is missing: no better group, no missing characteristic, no type, no "think
  of ...". When every part got 2 points, say the whole map holds up instead.
- Not the prediction on its own: the screen already shows it, as a big number and a sentence. Mention it
  only when a fact in <memory> compares it with last time, in words ("your guess was closer than last
  time").
- When a fact in <memory> makes the message truer, how a part compares with last time, in words
  ("'Bigger group' needed less help than last time").

Numbers: the screen shows every number in <result> next to your message, so words work better. If a
number helps, copy it from <result> as it is, in digits. Never compute one: no differences, totals,
percentages or counts ("1 point short", "75%", "three parts", "two types"), and no comparison with an
earlier session that isn't a fact in <memory>.

${MEMORY}

\`nextFocus\`: the part to practice next, one of the parts with the fewest points; when several tie, the
one the map shows furthest off. null only when every part got 2 points.`,
  output:
    "`message`: under 35 words, for the learner. `nextFocus`: a move, or null. `cites`: the ids of the <memory> facts the message relies on, or an empty list.",
});

/** The prediction against the score, in words, so the model never reads the sign itself. */
function prediction(gap: number): string {
  if (gap > 0) return "the learner expected more than they got";
  if (gap < 0) return "the learner did better than they expected";
  return "the learner predicted their score exactly";
}

export function renderCoach({ concept, mentefacto, result: r, memory }: CoachInputType): string {
  const changes = r.masteryChanges.map((c) => `${moveName(c.move)} from level ${c.from} to ${c.to}`).join("; ");
  const questions = r.questions.asked
    ? `${r.questions.asked}, and ${r.questions.testing} of them test the concept (compare, contrast, a breaking case or what it needs)`
    : "none";
  return [
    `<concept>${concept}</concept>`,
    `<learner_answer>\n${renderMentefacto(mentefacto)}\n</learner_answer>`,
    "<result>",
    `prediction: ${r.predictedScore} of ${r.maxScore} points`,
    `score: ${r.score} of ${r.maxScore} points: ${prediction(r.calibrationGap)} (calibration gap ${r.calibrationGap > 0 ? "+" : ""}${r.calibrationGap})`,
    `hints used: ${r.hintsUsed}`,
    "points per part:",
    ...r.rubric.map((row) => `- ${moveName(row.move)}: ${row.points}`),
    `level changes: ${changes || "none"}`,
    `questions the learner asked the fact desk: ${questions}`,
    "</result>",
    ...renderMemory(memory),
    "",
    "Write the last message.",
  ].join("\n");
}

export const coach = {
  name: "coach",
  system: COACH_SYSTEM,
  input: CoachInput,
  output: CoachOutput,
  effort: "low",
  render: renderCoach,
} as const;
