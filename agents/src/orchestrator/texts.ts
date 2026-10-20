// Everything the app says without a Claude call: fixed text from code (CONTRACTS.md sections 2 and 3).
import { MOVE_LABEL, type MoveId } from "../contracts.ts";

export const prediction = (concept: string) =>
  `You'll build the map of ${concept} in 4 parts, 2 points each. How many of the 8 points do you think you'll get?`;

export const attempt = (concept: string) => `Before any help: in your own words, what is ${concept}?`;

export const exampleIntro = (concept: string, exampleConcept: string) =>
  `Before ${concept}, watch the four moves on a simpler concept: ${exampleConcept}.`;

/** Level 5 (whole map): the learner asks the fact desk and builds the map alone. */
export const wholeMap = (concept: string) => `Build the mentefacto for ${concept}. Ask me any facts you need.`;

/** Level 4 (named only): the move's name and nothing else. */
const NAMED_ONLY: Record<MoveId, (concept: string) => string> = {
  supraordinate: (c) => `Now find the supraordinate class of ${c}.`,
  exclusion: (c) => `Now find an exclusion for ${c}, and the difference.`,
  isoordinate: (c) => `Now find the isoordinate characteristics of ${c}.`,
  infraordinate: (c) => `Now find the infraordinate classes of ${c}.`,
};
export const namedOnly = (move: MoveId, concept: string) => NAMED_ONLY[move](concept);

/** An exclusion named without its difference: asked once, not a hint. */
export const exclusionDifference = (concept: string, other: string) =>
  `What's the key difference between ${concept} and ${other}?`;

/** The move's name, said after the learner finds it (plain question first, name after). */
const NAMED: Record<MoveId, string> = {
  supraordinate: "That's called the supraordinate class: the closest bigger group.",
  exclusion: "That's called an exclusion: something close that it isn't, and why.",
  isoordinate: "Those are called isoordinate characteristics: what it needs to count.",
  infraordinate: "Those are called infraordinate classes: its types.",
};
const FOUND: Record<MoveId, string> = {
  supraordinate: "You found it.",
  exclusion: "You found it.",
  isoordinate: "You found them.",
  infraordinate: "You found them.",
};
export const named = (move: MoveId, revealed: boolean) => (revealed ? NAMED[move] : `${NAMED[move]} ${FOUND[move]}`);

/** Whole-map help when every move has already been revealed. */
export const noMoreHelp = "Every part of the map has been revealed. Finish it and submit.";

/** The coach's fixed text when its call fails (#44). Only numbers code computed. */
export const coachFallback = (score: number, hints: number, focus: MoveId | null) =>
  focus
    ? `You scored ${score} of 8 and used ${hints} hints. Next, work on "${MOVE_LABEL[focus]}".`
    : `You scored ${score} of 8 and used ${hints} hints.`;
