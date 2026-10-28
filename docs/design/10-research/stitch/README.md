# Stitch mockups

Google Stitch mockups of Lumente's screens redrawn for first-time users and slow learners, October 24, 2026.
They are references for `design-check`, not app code: each HTML file loads Tailwind and Google Fonts from the
web, so open the PNG for the picture and the HTML only to read the structure.

How they were made: [`DESIGN.md`](DESIGN.md) (round 9's tokens from
[`../../09-lumente/lumente-tokens.ts`](../../09-lumente/lumente-tokens.ts), written as a Stitch design system,
plus the words `DECISIONS.md` fixed on October 22 and 23) was uploaded to a Stitch project and turned into its
design system. Each screen was generated from a prompt that applies the guide's rules (one primary action, plain
words at reading grade 6 to 8, every icon with a label, no jargon, the cost of help stated before it is used),
then corrected in one to three `edit_screens` passes until it showed the decided screen and nothing Stitch
invented. The thesis and the decisions set the screens; Stitch only draws them.

| # | Screen | Files | What it shows | Still Stitch's, to ignore or decide |
|---|---|---|---|---|
| 1 | Start | [`01-start.png`](01-start.png), [`01-start.html`](01-start.html) | One line that says what the app does; the code block with the concept's line in amber and "This line uses a concept. Can you explain it?"; "Pick one concept" as cards with a one-line plain meaning each; "How do you want to start?" as two options with one sentence each ("The firefly asks you questions." / "You write each area yourself. You can ask for a fact any time."); one Start button; "About 10 minutes. 4 areas, 2 points each, 8 in all." | The three ready-made concepts (question 3) and "About 10 minutes" (question 7). |
| 2 | The prediction | [`02-guess.png`](02-guess.png), [`02-guess.html`](02-guess.html) | As decided October 23: "How much can you explain on your own?", the task in one breath ("4 areas of Recursion. Each area is worth 2 points, so 8 in all. Predict how many points you will get."), the 2/1/0 rubric before the numbers, nine round buttons 0 to 8 with nothing selected and the two anchors, "Tap a number to predict.", the note that the screen lights up per point, and "Save my prediction" dimmed with "Pick a number first." | The nine buttons wrap to two rows at 390 px; the app's single row is tighter but under 44 px targets. Two rows or a bigger row is the team's call. The step chip is question 2. |
| 3 | The map while asking | [`03-map-asking.png`](03-map-asking.png), [`03-map-asking.html`](03-map-asking.html) | Levels 2 to 4: "2 of 8 proved", "1 of 4 areas lit", the map with one lit area holding the learner's words, the asked area in amber with the firefly's dashed line, the firefly as Help with "Help, costs a point" beside it, the question in plain words, "Write it in your own words", "Save answer", "Skip for now", "You can come back to any area." | "Skip for now" is question 4. The firefly is a sparkle icon; the real one goes in its place (question 1). |
| 4 | The hint card | [`04-hint-card.png`](04-hint-card.png), [`04-hint-card.html`](04-hint-card.html) | The same screen after Help: the asked area's second point dotted with "this area can now get 1 point at most", "Hint 1 of 3: where to look" with "costs 1 point", one plain sentence, "More help (costs 1 point)", and "Hints cost points. Your own words earn them." "1 of 3" is right for levels 2 and 3, where the free nudge came first and Help gives hint, partial, reveal (`agents/CONTRACTS.md`, "Hint ladder"); at level 4 it would be 1 of 4. | The hint sentence is invented for the example; real hints come from the hint giver. |
| 5 | The result | [`05-result.png`](05-result.png), [`05-result.html`](05-result.html) | As decided October 22 and 23: the headline is the gap in words ("You felt 2 points surer than you could explain." / "That's normal: explaining is how you find out."), two rows of eight squares labelled "Prediction" and "Map score" with the two unproved points dashed coral on the map-score row only and the legend "prediction gap", the sentence under the rows, the lit map with each area's earned points (never coral), "types" as "shown to you, 0 points", "What this means", "Try another concept" and "Share my map". | The "What this means" card is an addition for slow learners (two plain lines); the app today has the coach's words there. Keep, merge or drop is the team's call. |
| 6 | Level 5 | [`06-level-5.png`](06-level-5.png), [`06-level-5.html`](06-level-5.html) | As decided October 23: "Build your map", "Area 1 of 4 · Start with Bigger group", the first area numbered and outlined in amber with the firefly's dashed line, "Write here" in every area, "Start: Bigger group" as the one primary action, the chat collapsed behind "Ask a fact (optional)" with "Facts only. It never writes your answer for you.", "Get a hint · −1 point" as an underlined link with its line, and "Review & submit". | The firefly is an amber dot; the real one goes there. |
| 8 | The first explanation | [`08-first-explanation.png`](08-first-explanation.png), [`08-first-explanation.html`](08-first-explanation.html) | From the audit's brief: the session bar with "Save" beside the X and the concept pill, the empty map with nothing asked, the firefly beside "before any help" and the question in a serif face ("In your own words, what is API?"), the line "No points for this one. It is your starting point; the map is where you earn them.", and one field labelled "Your first explanation" with "Speak" and "Send" labelled. | Nothing invented. The "Saved." reply and the "See an example first" line after Send are the audit's next state, not drawn. |
| 9 | The hint confirmation | [`09-hint-confirm.png`](09-hint-confirm.png), [`09-hint-confirm.html`](09-hint-confirm.html) | From the audit's brief, with the decided words: the level 5 map dimmed behind, a sheet titled "A hint for Bigger group?", "This hint limits this area to 1 point instead of 2.", the map's order in one line, "Hint 1 of 3" as squares, "Get hint" as the one primary action, "Keep working" and a visible "Close". | The copy pass (rows 19 to 22) proposes plainer lines for this sheet; the mockup keeps the decided ones. |
| 10 | The revealed answer | [`10-revealed.png`](10-revealed.png), [`10-revealed.html`](10-revealed.html) | From the audit's brief: the revealed area dim, dashed and italic with "shown, 0 points", a lit area beside it, nothing asked, the firefly beside "Here's this part, so you can keep going: a software interface." and the dim line "Shown to you: 0 points for this area. The next area starts fresh at 2.", and "Next question" as the only control. | The centre box carries a node icon Stitch added. |
| 7 | Web sign-in | [`07-sign-in-web.png`](07-sign-in-web.png), [`07-sign-in-web.html`](07-sign-in-web.html) | Desktop, 1440 px: Cynthia's headline "Build understanding, not dependence.", one sentence under it, "Get started" and "I have an account", "Free. Takes about 10 minutes.", three steps with icon and label (predict, explain, see the gap), a phone preview of the map with "API", and the data line in the footer. | The footer's "Privacy Policy", "Terms" and "Server Status" links do not exist; the app has the "Your data" sheet. "How it works" needs a target. "About 10 minutes" is question 7. |

## Where the mockups differ from how Lumente works: questions for the team

Stitch drew what the prompts asked for, and a few things the prompts did not say. None of these is a decision;
each is a question for Leo and Cynthia before any screen is built from these mockups. The method in
`wiki/synthesis/product-thesis.md` ("How a session runs") and `DECISIONS.md` are the reference.

1. **The firefly stays as it is.** Stitch drew a sparkle icon or an amber dot where the firefly goes. The real
   one is the drawing in `app/src/components/firefly.tsx` (small, 2D, hovering a few pixels, never pulsing;
   `DECISIONS.md` 2026-10-23, "The firefly hovers in place"). Every mockup here should be read with that firefly
   in its place. The mascot is not up for redesign.
2. **The step count.** The mockups say "Step 1 of 3", "Step 2 of 3", "Step 3 of 3". The session has more steps
   than that: the prediction, the first explanation, the map area by area, the result, and level 5 sessions.
   Question: show steps at all, and if so, which ones count?
3. **Start's concept list.** The Start mockup shows three ready concepts (Recursion, Promises, Closures). The
   app's concepts come from the learner's own project ("Ask your AI what to map", then paste its answer) or are
   typed. Question: keep the typed-or-pasted flow, with example chips only as a hint of what a concept is?
4. **"Skip for now" on the map.** In Test myself every area is open; in Explore with guidance the firefly asks
   in the map's order and the hint ladder follows it (`docs/ux-guidance.md`). Question: is a skip button right in
   guided mode, or only free navigation on the map as today?
5. **A free nudge under the question.** Removed from the mockups. The thesis and `DECISIONS.md` (2026-10-20)
   give a free nudge only at levels 2 and 3 after a wrong answer, inside the evaluator's feedback; everywhere
   else help costs a point. Question: when the nudge does appear, label it as the free one?
6. **"At least 5 words suggested."** Removed; Stitch invented the word count and the app has no minimum.
7. **"About 10 minutes."** On Start and the sign-in page: a guess at the session length. The pilot's timings
   decide the number, or the line goes.
8. **"What this means" on the result.** Two plain lines under the map (the unproved points; the areas that now
   give less help). The app shows the coach's words there (`DECISIONS.md` 2026-10-22, "The result shows first;
   the coach's words come right after"). Question: keep the coach's words, add the two lines, or neither?

Not drawn: the states (loading, error, empty) and the 320 px map; the audit (`../lumente-ux-audit.md`) carries a
written brief for the 320 px map. Two of the audit's five changes are on the mockups already: the cost of help in
words on every control (screens 3, 4, 6, 9) and each area's meaning in plain words under the question (screens 3
and 4); the other three (feedback within a second, 12 px labels and real cues, the worked example one part per tap)
are states and motion, so they stay in the audit's findings.

The Stitch project is private to Leo's Google account; the files here are the shared copy. Generations on the
free tier are limited per month (Google does not publish the number), so edits go through `edit_screens` on an
existing screen rather than a fresh generation. One lesson from this round: an edit must target the newest
version of a screen (each edit returns a new screen id), or it silently reapplies on an older one and the earlier
fixes are lost.
