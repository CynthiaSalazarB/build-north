# Stitch mockups

Google Stitch mockups of Lumente's screens redrawn for first-time users and slow learners, October 24, 2026.
They are references for `design-check`, not app code: each HTML file loads Tailwind and Google Fonts from the
web, so open the PNG for the picture and the HTML only to read the structure.

How they were made: [`DESIGN.md`](DESIGN.md) (round 9's tokens from
[`../../09-lumente/lumente-tokens.ts`](../../09-lumente/lumente-tokens.ts), written as a Stitch design system)
was uploaded to a Stitch project and turned into its design system, then each screen was generated from a prompt
that applies the guide's rules: one primary action, plain words at reading grade 6 to 8, every icon with a label,
no jargon, the cost of help stated before it is used, and a step indicator so the learner knows where they are.
The prompts are in each screen's row.

| # | Screen | Files | The prompt, in short | What to fix before it is a reference |
|---|---|---|---|---|
| 1 | Start | [`01-start.png`](01-start.png), [`01-start.html`](01-start.html) | One line that says what the app does, the code block with the concept's line in amber and the caption "This line uses a concept. Can you explain it?", "Pick one concept" as three cards with a one-line plain meaning each, "How do you want to start?" as two options with one sentence each, one Start button, and "About 10 minutes. 2 points per part, 8 in all." | Stitch added "Step 1 of 2" and "Step 2 of 2" inside the one screen; drop them, the steps are the guess, the map and the result. The help icon in the top bar has no label. |
| 2 | The guess | [`02-guess.png`](02-guess.png), [`02-guess.html`](02-guess.html) | "Step 1 of 3: your guess", "How many points will you get?", one sentence that explains 4 parts at 2 points each, nine round buttons 0 to 8 with nothing selected and "Tap a number." under them, a note that the screen lights up per point proved, "What is a good guess?" in two plain sentences, and "Lock in my guess" dimmed with "Pick a number first." under it. | The nine buttons wrap to two rows on a 390 px phone; the app's row of nine small buttons is tighter but under 44 px. Decide between two rows and a slider with big ends. |
| 3 | The map while asking | [`03-map-asking.png`](03-map-asking.png), [`03-map-asking.html`](03-map-asking.html) | "Step 2 of 3: explain", "2 of 8 points", the map with one lit part holding the learner's words, the asked part in amber with the firefly's dashed line, the question in plain words, a text box with "Write it in your own words", "Save answer", then "Get help (costs 1 point)" and "Skip for now", and "You can come back to any part." | The first generation overlapped the concept box with the side parts and added a tab bar the app does not have; one `edit_screens` pass fixed both. Still to check against round 9: the firefly's dashed line to the asked part, and the two point squares on every part. |
| 4 | The hint card | [`04-hint-card.png`](04-hint-card.png), [`04-hint-card.html`](04-hint-card.html) | The same map after Help: the asked part's second point dotted with "this part can now get 1 point at most", the firefly closer and brighter, an amber card "Hint 1 of 3: where to look" with one plain sentence and "More help (costs 1 point)", the question and the text box under it, and "Hints cost points. Your own words earn them." | After one `edit_screens` pass: the badge says "costs 1 point", the second point square is dotted, and the free nudge and the word-count line are gone. Still to decide: "Hint active" under the button is Stitch's; the app shows the state on the part itself. |
| 5 | The result | [`05-result.png`](05-result.png), [`05-result.html`](05-result.html) | Light mode at 5 of 8: "You proved 5 of 8 points.", the gap card with "Your guess 7" and "Your score 5", "+2" in coral and the sentence "You felt 2 points surer than you could explain. That's normal: explaining is how you find out.", the map with the learner's words in every part, "types" dashed coral and "shown to you, 0 points", a "What this means" card, "Try another concept" and "Share my map". | The strongest screen: the gap is the first thing read, coral means the gap and nothing else, and the lit map matches the round 9 day palette. After one `edit_screens` pass the labels are lowercase, "CORE" is gone, and a small amber dot rests at the map's corner where the real firefly goes. Still to decide: the whole gap sentence is coral; round 9 colors the number and keeps the sentence in ink. |
| 6 | Level 5 | [`06-level-5.png`](06-level-5.png), [`06-level-5.html`](06-level-5.html) | Back in the dark: "Level 5: you ask now", "You lead now. Ask for facts, then write each part yourself.", the four parts open with "Write here", the fact desk with two earlier questions, an input that glows because the light is the learner's, "Questions asked: 2" as amber squares, "Ask", and "Facts only. It never writes your answer for you." | After one `edit_screens` pass: the input has the amber outline and glow, the Help button is gone (level 5 has the fact desk, not the hint ladder), and amber dots stand where the firefly goes. The real firefly replaces the dots. |
| 7 | Web sign-in | [`07-sign-in-web.png`](07-sign-in-web.png), [`07-sign-in-web.html`](07-sign-in-web.html) | Desktop, 1440 px: Cynthia's headline "Build understanding, not dependence.", one sentence under it, "Get started" and "I have an account", "Free. Takes about 10 minutes.", three steps with icon and label (guess, explain, see the gap), a phone preview of the map with "API", and the data line in the footer. | The footer's "Privacy Policy", "Terms" and "Server Status" links do not exist; the app has the "Your data" sheet. The "How it works" link needs a target (the README's "How it works" section). "About 10 minutes" is question 7 below. |

## Where the mockups differ from how Lumente works: questions for the team

Stitch drew what the prompts asked for, and a few things the prompts did not say. None of these is a decision;
each is a question for Leo and Cynthia before any screen is built from these mockups. The method in
`wiki/synthesis/product-thesis.md` ("How a session runs") is the reference.

1. **The firefly stays as it is.** Stitch drew a generic sparkle where the firefly goes. The real one is the
   drawing in `app/src/components/firefly.tsx` (small, 2D, steady, the amber halo on hover), and every mockup
   here should be read with that firefly in its place. The mascot is not up for redesign.
2. **The step count.** The mockups say "Step 1 of 3" and "Step 2 of 3". The session has more steps than that:
   the guess, the first explanation in the learner's own words, the map part by part, the result, and level 5.
   Question: do we show steps at all, and if so, which ones count?
3. **Start's concept list.** The Start mockup shows three ready concepts (Recursion, Promises, Closures). The
   app's concepts come from the learner's own project ("Ask your AI what to map", then paste its answer) or
   are typed. Question: keep the typed-or-pasted flow, with example chips only as a hint of what a concept is?
4. **"Skip for now" on the map.** In Test myself every part is open; in Explore with guidance the firefly asks
   in the map's order and the hint ladder follows it (`docs/ux-guidance.md`). Question: is a skip button right
   in guided mode, or only free navigation on the map as today?
5. **A free nudge under the question.** The map mockup added "Think about how a countdown knows when to hit
   stop." under the firefly's question. The thesis gives a free nudge only at levels 2 and 3; everywhere else
   help costs a point. Question: show the nudge only on those levels, and label it as the free one?
6. **"At least 5 words suggested."** Stitch invented the word count. The app has no minimum. Question: drop it.
7. **"About 10 minutes" on Start.** A guess at the session length; the pilot's timings decide the number.

Screens 4 to 7 were drawn from `wiki/synthesis/product-thesis.md` and `docs/ux-guidance.md` before the audit
(`../lumente-ux-audit.md`) landed; its Stitch briefs may ask for a second pass on any of them. Not drawn yet: the
first explanation (between the guess and the map), the hint confirmation sheet, the revealed answer, and the
states (loading, error, empty, 320 px).

The Stitch project is private to Leo's Google account; the files here are the shared copy. Generations on the
free tier are limited per month (Google does not publish the number), so edits go through `edit_screens` on an
existing screen rather than a fresh generation.
