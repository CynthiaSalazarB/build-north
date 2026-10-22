# Research for the pivot directions

The research behind round 7 ([`pivot-directions.html`](pivot-directions.html)), read on October 21, 2026, after the
user narrowed to CS students who build projects with coding agents and can't explain the code. Each rule says what the
designs do and links its source. The recommended direction's colors and sizes are in
[`warm-editor-tokens.ts`](warm-editor-tokens.ts).

## What this user reads at a glance

Developer tools already have words and shapes for every meaning the app needs, so the dev directions borrow them
instead of inventing new ones.

- **Test output.** Jest prints `Expected: 7` above `Received: 5` when an assertion fails
  ([Jest expect](https://jestjs.io/docs/expect)). 7B and 7F show the calibration gap this way:
  `expect(proved).toBe(guess)`, Expected is your guess, Received is what you proved.
- **Status checks.** GitHub's check states are `queued` and `in progress`, then a conclusion
  ([status checks](https://docs.github.com/en/pull-requests/reference/status-checks)). The four parts of a map are four
  checks with those words.
- **REPL.** Python and Node prompt with `>>>` and `>` ([Python](https://docs.python.org/3/tutorial/interpreter.html),
  [Node](https://nodejs.org/api/repl.html)). At level 5 the learner types at a `›` prompt and the fact desk prints facts.
- **Diffs and linters.** `+` and `-` lines ([GNU diff](https://www.gnu.org/software/diffutils/manual/html_node/Detailed-Unified.html)),
  yellow warnings ([ESLint](https://eslint.org/docs/latest/use/formatters/)): yellow already means "look here", which
  fits Help.
- **Rubber duck debugging.** Explaining code line by line to an object, named in *The Pragmatic Programmer*
  ([overview](https://en.wikipedia.org/wiki/Rubber_duck_debugging)). It backs the method, but CS50's AI tutor is
  already a duck that leads students to answers instead of giving them, with a heart spent per question
  ([CS50.ai](https://cs50.readthedocs.io/cs50.ai/), [paper](https://cs.harvard.edu/malan/publications/V1fp0567-liu.pdf)),
  so no direction uses a duck.
- **Mentors with a face exist.** Boot.dev's mentor asks questions instead of giving answers ([Boot.dev](https://www.boot.dev)),
  and Brilliant has a tutor too ([Brilliant](https://brilliant.org)). A mascot (7E) is familiar here, not new.

## References

Links only: screenshots of other companies' products stay out of this public repo.

| Product | Borrow | Avoid |
|---|---|---|
| [Claude Code](https://code.claude.com/docs/en/terminal-config) | named color roles (success, error, warning), colorblind themes, an input border that changes with the mode | its sprite, clay color and fonts |
| [GitHub Mobile](https://docs.github.com/en/get-started/using-github/github-mobile) | check lists and review decisions | Octocat look-alikes |
| [CS50.ai](https://cs50.readthedocs.io/cs50.ai/) | a tutor that leads instead of answering, a visible cost for help | the duck, a chat-clone layout |
| [Cursor](https://cursor.com/mobile) | warm black and warm paper, sans with serif with mono | its own fonts |
| [Linear](https://linear.app/now/how-we-redesigned-the-linear-ui) | a calm dark theme with warmer, less saturated grays | faint grays |
| [Exercism](https://exercism.org) | locked and mastered states on a concept map | desktop density |

## Type

- People read proportional type about 5% faster than fixed-width type
  ([Mansfield, Legge and Bane, 1996](https://legge.dl8.umn.edu/sites/legge.psych.umn.edu/files/files/media/mansfield96_psychophysics_of_reading_xv-_font_effects_in_normal_and_low_vision.pdf)).
  Questions, hints and answers are proportional; mono is only for labels, chips, code and numbers.
- Material 3 sizes in sp: Body Large 16/24, Title Large 22/28, Headlines 24/32, 28/36 and 32/40, Display Large 57/64,
  Label Medium 12/16 ([M3 type scale](https://m3.material.io/styles/typography/type-scale-tokens)). Each screen uses three.
- Buttons are sentence case, one to three words, never wrapped: "Start mapping", "Lock in my guess"
  ([M3 buttons](https://m3.material.io/components/buttons/specs)).
- Android 14+ scales text up to 200% ([Android 14](https://developer.android.com/about/versions/14/features)), so
  screens are tested at 200% and the big numerals cap their scale.

## Android first, web for iPhones and laptops

- **Buttons:** the main action is an M3 medium button, 56dp tall ([M3 buttons](https://m3.material.io/components/buttons/specs)).
  Every touch target is at least 48dp ([Android accessibility](https://developer.android.com/guide/topics/ui/accessibility/apps)).
- **Edge to edge:** forced on Android 15 at target SDK 35, with no opt-out on Android 16
  ([Android 15](https://developer.android.com/about/versions/15/behavior-changes-15),
  [Android 16](https://developer.android.com/about/versions/16/behavior-changes-16)). Every screen draws under the
  status bar and pads the composer and the sheet by the system insets.
- **Waiting:** replies take 2 to 8 seconds, so one indeterminate wavy linear progress indicator
  ([M3 progress indicators](https://m3.material.io/components/progress-indicators/specs)), announced as a polite live
  region, since Android 16 deprecates `announceForAccessibility`
  ([Android 16](https://developer.android.com/about/versions/16/behavior-changes-all)).
- **Fact desk:** a modal bottom sheet opens at half the screen at most, with 28dp corners and a 32x4dp handle
  ([M3 bottom sheets](https://m3.material.io/components/bottom-sheets/guidelines)).
- **No glass on Android:** `GlassView` is iOS 26+ only and renders a plain view elsewhere
  ([Expo glass effect](https://docs.expo.dev/versions/latest/sdk/glass-effect/)). Depth comes from surface tones.
- **Native parts from Expo:** `@expo/ui/jetpack-compose` ships `LinearWavyProgressIndicator` and `ModalBottomSheet`
  on Android ([Expo UI](https://docs.expo.dev/versions/latest/sdk/ui/jetpack-compose/)), so the wait and the fact desk
  can be real Material components.
- **Themes:** offer light, dark and the system setting, with the system setting as the default
  ([Android dark theme](https://developer.android.com/develop/ui/views/theming/darktheme)).
- **Projector:** dark text on light in a lit room, light on dark in a dark room
  ([W3C](https://www.w3.org/WAI/teach-advocate/accessible-presentations/)). 7B and 7F each have both themes, so the
  demo phone matches the room.
- **Web build:** targets of at least 24 CSS px, reflow at 320 px, visible focus, `role="status"` while waiting and
  `role="alert"` on errors ([WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)).

## Color

- The meanings from earlier rounds stay: yellow or amber is Help (costs a point), red or terracotta is the gap and
  nothing else, one earned color marks a part done alone, and the gap is always a number plus a sentence.
- Never red and green alone: checks carry a glyph and a word ("alone", "1 hint", "answer shown"), and the felt-sure
  points are hatched ([Primer](https://primer.style/product/getting-started/foundations/typography/)).
- Every text pair on the board passes WCAG AA (4.5:1); the table is at the end of the board.

## The gap, and how students take it

- **The core idea has a name.** In 12 studies, people rated their understanding of how things work lower after
  writing a step-by-step explanation, and independent raters agreed with the lower rating, so the drop is real
  recalibration. A warning beforehand made the illusion smaller but didn't remove it (the illusion of explanatory
  depth: [Rozenblit and Keil, 2002](https://pmc.ncbi.nlm.nih.gov/articles/PMC3062901/)). No study tests it on code yet,
  so the pitch says the app applies it to code.
- **The link to code is indirect but consistent.** A third of intro students struggled to explain their own passing
  code, and answering questions about it tracked course success better than passing the tests
  ([Lehtinen, 2021](https://arxiv.org/abs/2104.06710)). Searching online makes people rate their own knowledge higher
  ([Fisher, 2015](https://www.apa.org/news/press/releases/2015/03/internet-knowledge)).
- **The tutor asks how, not why.** Explaining how something works shrank the illusion; listing reasons didn't
  ([Fernbach, 2013](https://www.hks.harvard.edu/publications/political-extremism-supported-illusion-understanding)).
  Questions read like "Who can read it?" or "What does the server check before trusting this token?".
- **No praise and no verdicts on the person.** Praise barely helped (effect size 0.09), feedback that threatened
  self-esteem helped least, and a third of feedback interventions lowered performance
  ([Hattie and Timperley, 2007](https://assess.ucr.edu/media/746/download)).
- **Confident misses come first.** Errors made with high confidence are the easiest to correct
  ([hypercorrection](https://pmc.ncbi.nlm.nih.gov/articles/PMC3079415/)), and overconfidence dropped only when students
  saw feedback on both their score and their prediction
  ([Callender, 2016](https://scholars.uky.edu/en/publications/improving-metacognition-in-the-classroom-through-instruction-trai/)).
- **Say up front that a gap is normal, then give one concrete next step.** Mindset slogans have mixed evidence
  ([review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10495100/)); training that treats errors as expected improved
  transfer ([meta-analysis](https://doi.org/10.1037/0021-9010.93.1.59)).
- **Asking back works.** Prompting learners to explain had an effect of 0.55 across 69 results
  ([meta-analysis](https://link.springer.com/article/10.1007/s10648-018-9434-x)), tutors who could only prompt taught as
  well as tutors who explained ([Chi, 2001](https://education.asu.edu/sites/default/files/lcl/image3_2.pdf)), and
  training students to write their own questions raised comprehension, which backs level 5
  ([review](https://doi.org/10.3102/00346543066002181)).
- **Hints-only tutors still leak.** 22% of CS50.ai's replies contained code
  ([CS50 study](https://cs.harvard.edu/malan/publications/fp0627-liu.pdf)), and an unguarded chatbot raised practice
  scores but cut exam scores, while a hints-only tutor avoided that loss
  ([trial](https://pmc.ncbi.nlm.nih.gov/articles/PMC12232635/)). The no-answer rule stays enforced in code, not only
  in the prompt.
- **A mascot is optional.** On-screen tutor characters had a small effect on learning (g = 0.20), larger for younger
  learners than college students ([meta-analysis](https://research.birmingham.ac.uk/en/publications/effectiveness-of-multimedia-pedagogical-agents-predicted-by-diver/)).
  If one is used (7E), it stays quiet and 2D and never reacts to the score.
- **Developers mostly code in the dark.** 77% of 6,000 developers used a dark editor theme
  ([JetBrains, 2018](https://www.jetbrains.com/research/devecosystem-2018/)), while dark text on light proofreads better
  at small sizes ([study](https://doi.org/10.1177/0018720813515509)). 7B and 7F default to the editor theme,
  follow the system setting, and keep body text at 16sp.

### What the result screen does with this

- The gap is a forecast error, not a grade: "You felt 2 points surer than you were", `Expected: 7` and `Received: 5`
  in a neutral panel, and no red fail mark. Terracotta stays on the number only, its one meaning.
- "Where the gap came from" comes next: each missed part with its right answer.
- No praise, no ranking, and no character emotion. Parts done alone are listed as a fact.
- One line says the gap is normal ("Feeling surer than you can explain is normal. Explaining is how you find out."),
  then one next step: Try JWT again.
- The research puts the map before the number. 7F keeps the number on top on purpose, because the gap reveal is the
  demo's key moment; the forecast wording and the misses right under it do the same work.

## Why 7F

- **The user knows it in one look.** A spec file, four checks, `Expected` and `Received`, a REPL at level 5: the
  conventions above, with nothing to learn.
- **It keeps what round 6 settled.** Newsreader is the tutor's voice, and bronze, lamp gold, terracotta and patina
  keep their meanings. Only the material changes, from cave and statue to editor and test run.
- **It is the cheapest to build.** The app already loads Newsreader and reads colors by role, so the work is the
  palette, one font package (Atkinson Hyperlegible Mono), four components and a new icon. No photos, no drawings.
- **It reads well.** Proportional serif for reading and mono for labels, M3 sizes, both themes.
- **Its result follows the research.** The gap reads as a forecast error with no fail mark, the misses come with
  their right answers, and the screen ends on one next step.
