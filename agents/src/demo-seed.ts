// The demo profile (#32): what fixtures/demo-seed.json holds and the API loads for the demo user (#44).
// The demo switches from session 1 (JWT, with hints) to this learner, at level 5 on every move, building
// CORS alone and asking the fact desk (decision 16).
import { z } from "zod";
import { Mastery, Mentefacto, Result, Session } from "./contracts.ts";

export const DemoSeed = z.strictObject({
  /** The demo user's id (the x-dev-user or Clerk user the API maps it to). */
  user: z.string(),
  mastery: Mastery,
  /** The CORS session, waiting at the whole-map Turn: prediction already made. */
  session: Session,
  /** What the presenter does live, and the numbers it should produce. */
  script: z.strictObject({
    questions: z.array(z.string()),
    map: Mentefacto,
    expected: Result.pick({ score: true, calibrationGap: true, hintsUsed: true, questions: true }),
  }),
});
export type DemoSeed = z.infer<typeof DemoSeed>;
