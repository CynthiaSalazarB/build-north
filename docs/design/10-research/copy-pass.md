# Copy pass: plainer words on every screen

A proposal, October 24, 2026, for after the freeze. The app's words are frozen for Demo Day; this lists what to
change in one pull request afterwards, string by string, so Cynthia can reply "do 1, 4 and 9". Every row names
the file and line the string lives in on `main` at `b73341d`.

What does not change: the method. The guess before anything, the first explanation in the learner's own
words, the four parts, the firefly asking and never writing the map, help that costs points, the levels that
fade the help per part, the fact desk at level 5, and the gap on the result (`wiki/synthesis/product-thesis.md`,
"How a session runs"). Every row below changes words, not what happens.

Rules behind the rewrites (the guide in `ui-ux-best-practices.md` has the sources):

- Reading grade 6 to 8: short words, one idea per sentence, the verb first on a button.
- One name per thing. The design calls the four boxes **parts**; the app calls them **areas**. Pick one. The
  rows below use "part", the word the round 9 design and the firefly use.
- No jargon on screen: "prediction", "rubric", "factual" and "optional chat" are our words, not the learner's.
  The learner "guesses", "gets points", "asks for a fact". "Level" stays, because the help fading level by
  level is the app's idea; it only needs the four words that say what a level is, the first time it appears.
- Say the cost before the action, in points, every time help is offered.
- A button says what happens next ("Save answer"), never what the system does ("Submit").

Not in this list: the two headlines Cynthia wrote on October 23 ("Can you explain the ideas behind the code your
AI wrote?" on Start, `app/src/app/index.tsx:36`, and "Build understanding, not dependence." on the web sign-in,
`app/src/app/sign-in.web.tsx:18`). `docs/ux-guidance.md` keeps them as hers; if she wants a plainer sign-in line,
"Understand the code you build with AI." says the same at grade 6.

## The guess

| # | Where | Now | Proposed | Why |
|---|---|---|---|---|
| 1 | `app/src/components/guess.tsx:95` | How much can you explain on your own? | How many points will you get? | The learner picks a number, so the question asks for a number. The old line is kept as the sentence under it. |
| 2 | `guess.tsx:96` | You'll explain {concept} across four areas of a concept map. Predict how many points your answers will earn. | You will explain 4 parts of {concept}. Each part is worth 2 points, so 8 in all. | The numbers the picker needs, in one breath. "Predict" and "concept map" go. |
| 3 | `guess.tsx:111` | No prediction selected / Your prediction: {n} of 8 points | Tap a number. / Your guess: {n} of 8 points | "Guess" is the word the result screen already uses ("the gap between your guess and your score"). "Tap a number" tells the learner what to do instead of what is missing. |
| 4 | `guess.tsx:59` | Save my prediction / Try saving my prediction again | Lock in my guess / Try again | Verb first, our word out. |
| 5 | `guess.tsx:114` | At the end, you'll compare this with your score. | At the end you see how close your guess was. | Shorter, and "see" instead of "compare". |
| 6 | `guess.tsx:135` | Predict {n} of 8 points (screen reader) | Guess {n} of 8 points | Same word as the visible text. |
| 7 | `app/src/components/scoring-guide.tsx:11` | Each area can earn: | Each part can get: | "Part", and "get" beats "earn" at grade 6. |
| 8 | `app/src/session/present.ts:312` to `314` | A clear, complete answer on your first try, without a hint. / A partly correct answer, or a correct one after a retry or hint. / An incorrect answer, an empty area, or an answer revealed to you. | 2 points: a full answer on the first try, no help. / 1 point: a partly right answer, or a right one after a retry or a hint. / 0 points: a wrong answer, an empty part, or an answer we showed you. | The number leads each line, and "revealed" becomes "showed you". |

## Start

| # | Where | Now | Proposed | Why |
|---|---|---|---|---|
| 9 | `app/src/app/index.tsx:38` | Answer questions. Your map fills as you go. | The firefly asks you questions. Your map fills in as you answer. | Names who asks, so the firefly on the next screen is no surprise (the conceptual model in one line). |
| 10 | `index.tsx:39` | Write on the map. Ask facts if you need them. | You explain each part on your own. You can ask a fact any time. | "Ask facts" is our shorthand; "ask a fact" with "any time" says what the chat is for. |
| 11 | `index.tsx:102` | Write your answers in the four map areas. The optional chat answers factual questions. Your levels don't change. | You write your own answers in the four parts. You can ask the firefly for a fact, never for an answer. Your levels (how much help each part gives you) stay the same. | "Optional" and "factual" go; "fact" stays, because the fact desk answering facts and never the map is the method (`wiki/synthesis/product-thesis.md`, "How a session runs", step 5). "Levels" stays too, with the four words that say what a level is: the fading help is the idea, and the learner should see it. |
| 12 | `index.tsx:97` | Pick a concept (the main button before a concept is chosen) | Pick a concept above | Says where to look. The button is disabled until a concept is picked; the words should point at the list. |
| 13 | `index.tsx:134` | Picks the session up where you left it | Continue where you left off | The phrase people know from games and apps. |
| 14 | `index.tsx:140` | Demo mode: a recorded session on API | Demo: a recorded session about "API". Nothing you type is saved. | Says what demo mode means for the learner, not what it is. |
| 15 | `index.tsx:161` | Optional: paste text the firefly can draw on | Optional: paste notes from your project. The firefly uses them to ask better questions. | "Draw on" is a figure of speech. |
| 16 | `index.tsx:3`, `162`, `279` | Ask your AI what to map | Ask your AI which concepts to explain | "Map" as a verb is our word. |
| 17 | `index.tsx:280` | Paste this into Claude Code, Cursor or Copilot inside your project. | Copy this and paste it into Claude Code, Cursor or Copilot, inside your project. Then paste its answer here. | The two steps in order, in one place. |

## The map and the help

| # | Where | Now | Proposed | Why |
|---|---|---|---|---|
| 18 | `app/src/components/concept-map.tsx:262` | Write here → / Write answer / Edit answer | Write here / Write your answer / Change your answer | The arrow glyph is read as "right arrow" by a screen reader, and "edit" is less plain than "change". |
| 19 | `concept-map.tsx:273` | Opens this area to write or edit your answer. Your map is scored when you submit it. | Opens this part so you can write or change your answer. You get your points when you hand in the whole map. | "Scored" and "submit" become what the learner does and gets. |
| 20 | `app/src/components/whole-map.tsx:136` | Get a hint · −1 point | Get a hint (costs 1 point) | A minus sign reads as "dash 1" on a phone and in a screen reader. Say "costs" everywhere help appears (the design's own rule). |
| 21 | `whole-map.tsx:137` | For {part}. See the scoring effect before you confirm. | This hint is about {part}. Read what it costs, then choose. | "Scoring effect" is our phrase. |
| 22 | `whole-map.tsx:361` | This hint limits this area to 1 point instead of 2. / This area is already limited to 1 point. This hint doesn't reduce it further. / This shows the answer. This area will score 0 points. | After this hint, this part can get 1 point, not 2. / This part can already get only 1 point. This hint costs nothing more. / This shows you the answer. This part gets 0 points. | Numbers and "get", not "limits" and "reduce". |
| 23 | `whole-map.tsx:362` | Hints follow the map's area order, even if you are editing another area. | Hints go in the map's order: bigger group, what it isn't, what it needs, types. The hint may be about a part other than the one you are writing in. | Says the order instead of pointing at it. (Longer, but the old line is the one testers asked about.) |
| 24 | `whole-map.tsx:363` | Reveal answer · 0 points | Show me the answer (0 points for this part) | Verb first, and the cost in words. |
| 25 | `whole-map.tsx:250`, `258` | Ask a factual question / Ask a fact | Ask for a fact / Ask | "Fact" stays (the fact desk answers facts, never a part of the map); "factual question" is the harder phrase. A line under the box says what the chat is for: "Facts only. It never writes your answer for you." |
| 26 | `whole-map.tsx:384` to `386` | Submitting ends the session. / Submit my map / Keep editing | Handing in ends this session. / Hand in my map / Keep writing | "Submit" is a form word; "hand in" is the school word. |
| 27 | `whole-map.tsx:379` | Left empty | Nothing written yet | Says the state, not a verdict. |
| 28 | `app/src/components/composer.tsx:16` | In your own words / Try again, in your own words | Write it in your own words / Try again in your own words | Verb first. |
| 29 | `app/src/components/messages.tsx:110` | this part can now light 1 point at most | this part can now get 1 point at most | "Light" is the design's metaphor; the learner reads points. The light itself still shows it. |
| 30 | `messages.tsx:172` | shown · 0 points | shown to you, 0 points | A middle dot reads badly on a phone and aloud. |
| 31 | `app/src/session/present.ts:399` | Help, costs a point / More help | Get help (costs 1 point) / More help (costs 1 point) | The cost on both, every time (one meaning per color, one wording per cost). |

## The result and the errors

| # | Where | Now | Proposed | Why |
|---|---|---|---|---|
| 32 | `present.ts:298` | Your prediction matched your score. / Your confidence matched what you could explain in this session. | Your guess matched your score. / You knew how much you knew. | "Guess" everywhere, and a sentence a learner can repeat. |
| 33 | `present.ts:296` | You felt {n} points surer than you could explain. That's normal: explaining is how you find out. | (keep) | Already plain, already kind. This is the line the whole app is built around. |
| 34 | `app/src/app/_layout.tsx:26` | Welcome back! Please sign in to continue | Sign in to continue | Drops the exclamation and the "please"; the headline above already greets. |
| 35 | `app/src/session/api-client.ts:17` to `22` | Can't reach the server. Check your connection and try again. (and the three lines after it) | (keep) | Plain already: what happened, what to do. |
| 36 | `app/src/session/session-context.tsx:124` | That session is gone. Start a new one. | (keep) | Plain already. |

## Two words that stay our own

- **Firefly**: the learner never needs the word; the drawing and "asks you questions" do the work. Keep it in the
  hint card's label ("The firefly asks:") because the audit's mockups show it reads well.
- **Concept**: CS students use it. Keep it; never "mentefact", which stays in code and `agents/CONTRACTS.md`.

## How to apply it

One pull request after Demo Day, strings only, with `docs/ux-guidance.md` updated to match, and the e2e and app
tests re-run (`app` tests check some of these strings by text). `MOVE_LABEL` in `agents/src/contracts.ts`
("Bigger group", "What it isn't", "What it needs", "Its types") already matches the plain names, so it stays.
