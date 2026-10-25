# Copy pass: plainer words on every screen

A proposal, October 24, 2026, for after the freeze. The app's words are frozen for Demo Day; this lists what to
change in one pull request afterwards, string by string, so Cynthia can reply "do 1, 4 and 9". Every row names
the file and line the string lives in on `main` at `b73341d`.

What does not change: the method, and the words already decided. The guess before anything, the first
explanation in the learner's own words, the four areas, the firefly asking and never writing the map, help that
costs points, the levels that fade the help per area, the fact desk at level 5, and the gap on the result
(`wiki/synthesis/product-thesis.md`, "How a session runs"). The words chosen in `DECISIONS.md` on October 22
and 23 stay: "prediction" and "map score" on the result, "areas" for the four places on the map, the shared
2/1/0 rubric, "Save my prediction", "Ask a fact (optional)", "Get a hint" as a link with a confirmation, and
Cynthia's two headlines from October 23. Every row below changes words inside those decisions, not the
decisions. The three places where a plainer word would need a decision reopened are at the end, as questions.

Rules behind the rewrites (the guide in `ui-ux-best-practices.md` has the sources):

- Reading grade 6 to 8: short words, one idea per sentence, the verb first on a button.
- One name per thing: "area" on every screen (decided October 23, "the parts are called areas").
- Say the cost before the action, in words and points, every time help is offered.
- A button says what happens next ("Save answer"), and a disabled button says why it is disabled.
- No symbol where a word will do: a minus sign or a middle dot reads badly on a small phone and aloud.
- "Level" stays, with the four words that say what a level is the first time it appears: the help fading
  level by level is the app's idea, and the learner should see it.

## The guess

| # | Where | Now | Proposed | Why |
|---|---|---|---|---|
| 1 | `app/src/components/guess.tsx:96` | You'll explain {concept} across four areas of a concept map. Predict how many points your answers will earn. | You will explain {concept} in 4 areas. Each area is worth 2 points, so 8 in all. Predict how many points you will get. | The numbers the picker needs, in one breath; "across" and "concept map" go. The heading above it stays as decided. |
| 2 | `guess.tsx:111` | No prediction selected | Tap a number to predict. | Says what to do instead of what is missing. "Your prediction: {n} of 8 points" stays. |
| 3 | `guess.tsx:59` | Try saving my prediction again | Try again | Shorter. "Save my prediction" stays (decided October 23). |
| 4 | `guess.tsx:114` | At the end, you'll compare this with your score. | At the end you see how close your prediction was. | "See" instead of "compare". |
| 5 | `app/src/components/scoring-guide.tsx:11` | Each area can earn: | Each area can get: | "Get" beats "earn" at grade 6. |
| 6 | `app/src/session/present.ts:312` to `314` | A clear, complete answer on your first try, without a hint. / A partly correct answer, or a correct one after a retry or hint. / An incorrect answer, an empty area, or an answer revealed to you. | A full answer on the first try, no hint. / A partly right answer, or a right one after a retry or a hint. / A wrong answer, an empty area, or an answer shown to you. | Shorter words; "revealed" becomes "shown to you". The rubric stays three lines, shown before the guess and on the result (decided October 23). |

## Start

| # | Where | Now | Proposed | Why |
|---|---|---|---|---|
| 7 | `app/src/app/index.tsx:38` | Answer questions. Your map fills as you go. | The firefly asks you questions. Your map fills in as you answer. | Names who asks, so the firefly on the next screen is no surprise. |
| 8 | `index.tsx:39` | Write on the map. Ask facts if you need them. | You write each area yourself. You can ask for a fact any time. | "Ask facts" is our shorthand. |
| 9 | `index.tsx:102` | Write your answers in the four map areas. The optional chat answers factual questions. Your levels don't change. | You write your own answers in the four map areas. You can ask for a fact, never for an answer. Your levels (how much help each area gives you) stay the same. | "Optional" and "factual" go; "fact" stays, because the fact desk answering facts and never the map is the method. "Levels" stays, with the four words that say what a level is. |
| 10 | `index.tsx:97` | Pick a concept (the main button before a concept is chosen) | Pick a concept above | The button is disabled until a concept is picked; the words point at the list. |
| 11 | `index.tsx:134` | Picks the session up where you left it | Continue where you left off | The phrase people know. |
| 12 | `index.tsx:140` | Demo mode: a recorded session on API | Demo: a recorded session about API. Nothing you type is saved. | Says what demo mode means for the learner. |
| 13 | `index.tsx:161` | Optional: paste text the firefly can draw on | Optional: paste notes from your project. The firefly uses them to ask better questions. | "Draw on" is a figure of speech. |
| 14 | `index.tsx:3`, `162`, `279` | Ask your AI what to map | Ask your AI which concepts to explain | "Map" as a verb is our word. |
| 15 | `index.tsx:280` | Paste this into Claude Code, Cursor or Copilot inside your project. | Copy this and paste it into Claude Code, Cursor or Copilot, inside your project. Then paste its answer here. | The two steps in order, in one place. |

## The map and the help

| # | Where | Now | Proposed | Why |
|---|---|---|---|---|
| 16 | `app/src/components/concept-map.tsx:262` | Write here → / Write answer / Edit answer | Write here / Write your answer / Change your answer | The arrow glyph is read as "right arrow" by a screen reader; "change" is plainer than "edit". The three labels were chosen on October 23 ("At level 5 the map is the task"); only the glyph and one word change. |
| 17 | `concept-map.tsx:273` | Opens this area to write or edit your answer. Your map is scored when you submit it. | Opens this area so you can write or change your answer. You get your points when you submit the whole map. | "Scored" becomes what the learner gets. |
| 18 | `app/src/components/whole-map.tsx:136` | Get a hint · −1 point | Get a hint (costs 1 point) | A minus sign reads as "dash 1" on a phone and aloud. Help stays a link with a confirmation (decided October 23); only the cost's spelling changes. |
| 19 | `whole-map.tsx:137` | For {area}. See the scoring effect before you confirm. | This hint is about {area}. Read what it costs, then choose. | "Scoring effect" is our phrase. |
| 20 | `whole-map.tsx:361` | This hint limits this area to 1 point instead of 2. / This area is already limited to 1 point. This hint doesn't reduce it further. / This shows the answer. This area will score 0 points. | After this hint, this area can get 1 point, not 2. / This area can already get only 1 point. This hint costs nothing more. / This shows you the answer. This area gets 0 points. | Numbers and "get", not "limits" and "reduce". |
| 21 | `whole-map.tsx:362` | Hints follow the map's area order, even if you are editing another area. | Hints go in the map's order: bigger group, what it isn't, what it needs, its types. The hint may be about an area other than the one you are writing in. | Says the order instead of pointing at it. The rule itself is the contract's (`agents/CONTRACTS.md`, "Help on the whole map"). |
| 22 | `whole-map.tsx:363` | Reveal answer · 0 points | Show me the answer (0 points for this area) | Verb first, the cost in words. |
| 23 | `whole-map.tsx:250`, `258` | Ask a factual question / Ask a fact | Ask for a fact / Ask | "Factual question" is the harder phrase; "fact" stays. The collapsed label "Ask a fact (optional)" stays as decided. A line under the box says what the chat is for: "Facts only. It never writes your answer for you." |
| 24 | `whole-map.tsx:384` | Submitting ends the session. | Submitting sends your map and ends this session. | Says what submit does. "Submit my map" and "Keep editing" stay. |
| 25 | `whole-map.tsx:379` | Left empty | Nothing written yet | Says the state, not a verdict. |
| 26 | `app/src/components/composer.tsx:16` | In your own words / Try again, in your own words | Write it in your own words / Try again in your own words | Verb first. |
| 27 | `app/src/components/messages.tsx:110` | this part can now light 1 point at most | this area can now get 1 point at most | "Area" (decided), and the learner reads points; the light itself still shows it. |
| 28 | `messages.tsx:172` | shown · 0 points | shown to you, 0 points | A middle dot reads badly on a phone and aloud. |
| 29 | `app/src/session/present.ts:399` | Help, costs a point / More help | Help (costs 1 point) / More help (costs 1 point) | The cost on both, every time, in the same words as row 18. |

## The result and the errors

| # | Where | Now | Proposed | Why |
|---|---|---|---|---|
| 30 | `app/src/app/_layout.tsx:26` | Welcome back! Please sign in to continue | Sign in to continue | Drops the exclamation and the "please"; the headline above already greets. |
| 31 | `present.ts:296` | You felt {n} points surer than you could explain. That's normal: explaining is how you find out. | (keep) | Already plain, already kind, and the result's headline by decision (October 22). |
| 32 | `present.ts:298` | Your prediction matched your score. / Your confidence matched what you could explain in this session. | (keep) | Decided October 23 ("The result says prediction and map score"). |
| 33 | `app/src/session/api-client.ts:17` to `22` | Can't reach the server. Check your connection and try again. (and the three lines after it) | (keep) | Plain already: what happened, what to do. |
| 34 | `app/src/session/session-context.tsx:124` | That session is gone. Start a new one. | (keep) | Plain already. |

## Three questions for Cynthia

These would reopen a decision, so they are questions, not rows.

1. **"Prediction" or "guess" for slow learners?** "The result says prediction and map score" (October 23) chose
   "prediction" because "you guessed" and "you proved" read like right and wrong. "Guess" is the grade-3 word and
   "prediction" is grade 7. A middle path keeps "prediction" as the label on the rows and says "your guess" once in
   the sentence that explains it ("Your prediction is your guess of how many points you will get."). Worth it, or
   leave as is?
2. **"Area" on screen, "part" in the design docs.** The screens say "areas" (October 23); `docs/design/09-lumente/README.md`,
   the thesis and the firefly's questions say "parts". One word everywhere would help a learner who reads the
   README after the app. Change the docs to "areas", or leave the two worlds apart?
3. **"Submit" or "hand in"?** "Review & submit" and "Submit my map" are the decided labels. "Hand in my map" is the
   school word and tests at a lower grade, but it changes a label that is also in the review sheet's title.

## Two words that stay our own

- **Firefly**: the learner never needs the word; the drawing and "asks you questions" do the work. Keep it in the
  hint card's label ("The firefly asks:") because the mockups show it reads well.
- **Concept**: CS students use it. Keep it; never "mentefact", which stays in code and `agents/CONTRACTS.md`.

## How to apply it

One pull request after Demo Day, strings only, with `docs/ux-guidance.md` updated to match, and the app, API and
agents tests re-run (`app/src/session/present.test.ts` and `session.test.ts` check some of these strings by
text). `MOVE_LABEL` in `agents/src/contracts.ts` ("Bigger group", "What it isn't", "What it needs", "Its types")
already matches the plain names, so it stays.
