# Lumente UX audit: every screen against the guide

The method is sound and the screens are consistent and often beautiful; what a first-time or slow learner misses is
the cost of help in words, the meaning of each part when it is asked, and a visible answer within a second of every
action. 36 findings: 0 Blocker, 13 Major, 20 Minor, 3 Polish.

Research for after the October 24 freeze. Findings only; nothing here ships before Demo Day.

How it was done, October 24, 2026: the files named in `docs/design/10-research/README.md` were read first, then the
screens in `app/src/app/` and `app/src/components/` on `leo/ux-research-stitch` (code at `904d1b3`, the app files
unchanged since `b73341d`). The web build was exported in demo mode (`npx expo export --platform web` from `app/`
with no env file: exit 0, 2 minutes) and served on port 8097; the demo session (guess 7, one retry, one hint, 5 of 8)
was clicked through at 390 and 320 px wide and in the website layout at 1280 px. Saved screenshots are in
`C:/Users/leooa/AppData/Local/Temp/claude/C--Users-leooa-Documents-Hackathons-build-north/78253c4d-3dc6-415b-ab5f-b98170731ac7/scratchpad/audit-shots/`
(`start-1280.png`, `start-320.png`, `not-found-390.png`); the other states were seen in the browser pane and are
cited by their `file:line`. The contrast ratios come from a node script over the real tokens in `app/src/theme.ts`
(the table is under finding 11). `DECISIONS.md` entries of October 22 and 23 were read before writing any fix: a fix
that would reverse one of them is a question for the team, not a finding.

What the demo could not show, so it is audited from the code only: the native sign-in (`sign-in.tsx`), the web
sign-in with Clerk (the export has no Clerk key, so `/sign-in` goes home), "Test myself" and the whole-map screen at
level 5 (hidden in demo mode, `index.tsx:98`), a revealed answer, the Memory sheet with data, the Android keyboard,
a failed call, and the "Update ready" card. The `docs/readme/` pictures are from an earlier build (their guess screen
has an eyebrow and a per-area list that `guess.tsx` no longer draws), so no finding rests on them.

Three things that are not bugs, to save the team a reply: the free nudge comes only at levels 2 and 3 after a wrong
answer (DECISIONS 2026-10-20); Help on the whole map goes to the first area in order whose hints have not run out
(`agents/CONTRACTS.md`, section 3), which is why the confirmation names a different area from the highlight; and the
guided levels keep the firefly as Help (DECISIONS 2026-10-23, "At level 5 the firefly is a guide, not Help").

## Findings, most severe first

Each one: severity; the screen and state; the evidence; the rule it breaks (the lens, then the source); the fix in a
sentence or two that keeps the method; the cost (S under a day, M a few days, L more).

### Major

**1. The cost of help is never said in words on the guided screen, and the fourth "More help" shows the answer with no warning.**
Screen: the map while asking, any part, levels 2 to 4. Evidence: the only price on screen is the tag under the firefly,
"help −1" in 11 px mono (`messages.tsx:65`, `theme.ts:255`, `present.ts:260`); a tap sends the hint at once
(`session.tsx:169`); after the first hint the control is "More help" by the input (`composer.tsx:71`) and says nothing
about cost; the third hint is the last before the reveal (`present.ts:245`, three steps), and the reveal scores the
area 0 (`present.ts:117`). Rule: lens 2, Nielsen 5 (error prevention) and 1 (visible status); lens 5, errorless paths
and the cost before the action. The level-5 screen already does it right (`whole-map.tsx:360-363`). Fix: put the cost
on the control itself as the ladder moves: "Help (costs 1 point)", then "More help (free now)", then "Show me the
answer (0 points for this area)" on the last step, with the firefly's tag in words under it. A confirmation sheet in
guided mode is question 1 below. Cost: S.

**2. The hint card charges a point that was already spent.**
Screen: the hint card after a retry (the demo's own path: a wrong answer, then Help). Evidence: `messages.tsx:119`
passes `n === 1` as "first", so the card reads "hint 1 of 3 · −1 pt" (`present.ts:245`) even when the retry had
already capped the area and the firefly's own tag had dropped to "help" (`present.ts:259`, "Help costs nothing more").
Seen in the pane: the tag said "help", the card said "−1 pt". Rule: lens 2, Nielsen 4 (consistency); lens 5, specific
feedback. Fix: compute "first" from `cappedOf` before the hint, so the card says "costs 1 point" only when it does and
"free now, this area is at 1 point" otherwise. Cost: S.

**3. "Answers go on the map." reads as "the chat's answers go on the map", the opposite of the method.**
Screen: level 5 and the self-test, the chat open. Evidence: `whole-map.tsx:131`, "Asking costs nothing. Answers go on
the map." under "Ask a fact (optional)". The testers already typed their answers into the chat (DECISIONS 2026-10-23,
"At level 5 the map is the task"), so this is the exact line that has to say who writes what. Rule: lens 1, the
conceptual model (Norman); lens 5, plain language with one reading. Not in the copy pass (row 25 is the field's
placeholder). Fix: "Asking costs nothing. The firefly gives facts only. You write every answer on the map yourself."
Cost: S.

**4. The first explanation gets no answer at all.**
Screen: the first explanation, after Send. Evidence: the learner's bubble appears and the next Turn brings only "See
an example" and "Continue" (`session.tsx:177`, `composer.tsx:42`; the recorded Turn 2 has no feedback line). Nothing
says whether the words were kept, scored or ignored. Rule: lens 2, Nielsen 1 (visibility of status); lens 5,
immediate and specific feedback. Fix: one dim line under the bubble, "Saved. No points for this one: it is your
starting point. The map is where you earn them.", and a question for later (question 10) about showing it on the
result. Cost: S.

**5. While the firefly checks an answer, the phone shows almost nothing for 2 to 8 seconds.**
Screen: the map while asking, saving an answer. Evidence: `Waiting` renders no visible text until 10 s
(`messages.tsx:264-265`); the send button never shows busy (`composer.tsx:83`, `busy={false}`); the field empties and
dims (`composer.tsx:82`); the only signal is "checking" in 11 px under the firefly (`session.tsx:295`), which the
phone scrolls past because the view follows the newest line (`session.tsx:196`). Seen in the pane: after Send the
screen looked the same minus the typed words. Rule: lens 2, Nielsen 1; lens 5, immediate feedback (NN/g: under 1 s
needs a signal, over 10 s an explanation, both missing in between). Fix: spin the send button while pending, and draw
"Checking your answer…" where the reply will land, from the first second. Cost: S.

**6. In guided mode the four parts are never explained in plain words.**
Screen: the map while asking, every part. Evidence: `partMeaningOf` (`present.ts:359-369`, "The closest bigger group
that API belongs to.") is shown only inside the level-5 editor (`whole-map.tsx:297`); on the map the part has an 11 px
label (`theme.ts:251`, `concept-map.tsx:243`) and a "?"; the part sheet opens only once a part is lit
(`concept-map.tsx:126`); the guess screen names the four areas in one line on phones only (`guess.tsx:99`). The
firefly's question carries the meaning, but in the agent's words, which change each time. Rule: lens 4, what is
missing that the learner needs now; lens 5, worked examples and plain language; lens 1, mapping between the box on the
map and the question. Fix: the first time a part is asked, set `partMeaningOf` as a dim line between the firefly's
question and the input, and in the asked part's box under its label. Cost: S.

**7. The level, the idea the whole app is built on, is invisible while it runs.**
Screen: every session screen. Evidence: the only explanation of a level is in the Memory sheet
(`memory-sheet.tsx:13`); on Start the sentence "Your levels don't change" is a screen-reader hint, never drawn
(`index.tsx:102`, `ui.tsx:206`); the result marks a level-up as "↑ less help next time" (`present.ts:211`,
`concept-map.tsx:261`) with no word on what a level is; nothing on the asked part says "level 2 of 5" or "this part
gives you a question" versus "this part names itself only". Rule: lens 2, Nielsen 1 (status) and the conceptual
model (lens 1): the learner cannot see the help fading, so they cannot feel the competence the thesis counts on.
DECISIONS 2026-10-22 ("No mastery screen") cut a screen, not a word. Fix that keeps the decision: on the result, one
sentence next to the first "less help next time" badge, "A level is how much help a part gives you, from 1 (watch an
example) to 5 (on your own)."; showing the level on the asked part during the session is question 3. Cost: S.

**8. The explanations on five buttons exist only for screen readers.**
Screen: Start, level 5, the result. Evidence: `Button`'s `hint` becomes `accessibilityHint` and nothing visible
(`ui.tsx:206`); so "Optional: paste text the firefly can draw on" (`index.tsx:161`), "A prompt for your coding agent,
so you map concepts from your own project" (`index.tsx:162`), "Write your answers in the four map areas. The optional
chat answers factual questions. Your levels don't change." (`index.tsx:102`), "Review your answers before submitting
your map for scoring." (`whole-map.tsx:81`) and "Shares your guess and your score, not your answers" (`result.tsx:215`)
never reach a sighted learner. Copy pass rows 11 and 15 rewrite two strings nobody sees. Rule: lens 1, signifiers; lens
5, redundant cues (the same words for everyone). Fix: draw each hint as a dim line under its button, the way `Choice`
already does for the two modes (`index.tsx:42-50`), and keep the accessibility hint. Cost: S.

**9. On a phone, Start opens on a picture and the question is below the fold.**
Screen: Start, phone layout. Evidence: the code block and the empty map come first (`index.tsx:238`), the headline
after (`index.tsx:241`); `start-320.png` shows the headline cut at "behind the" with the chips and the modes under it;
at 390 px the question's first line shows at the bottom. The picture is hidden from screen readers as decoration
(`code-preview.tsx:56`), which says what it is. Rule: lens 1, the first thing seen should be the thing to do (Krug);
lens 3, Gestalt figure and ground (the decoration is the figure). Fix: on phones, the question and the chips first,
the code and the map under them at a smaller height, or the map alone; the website layout can stay as it is. Cost: S.

**10. At 320 px the map's labels and the result's numbers break.**
Screen: the map (any state) and the result, 320 px. Evidence: the side parts are 128/372 of the width
(`theme.ts:182`), 96 px at 320; "what it needs" in 11 px wraps to three lines with the icon on its own row
(`concept-map.tsx:241-243`, seen at 320 in the pane, the same at 390 in `docs/readme/step-2-map.jpg`); on the result
the scale label is a fixed 92 px (`result.tsx:283`) and "7 of 8" (`result.tsx:235`) wraps to "7 of / 8"; the legend
"proved · prediction gap" wraps too (`result.tsx:111-121`). Rule: lens 3, Gestalt proximity (a label split from its
icon reads as two things); lens 6, reflow (WCAG 1.4.10). Fix: at narrow widths put the label under the icon and the
points on one row of their own; shrink the scale label column to 72 px and give the number `flexShrink: 0`. Cost: S.

**11. The resting edges of controls and parts fail the non-text contrast rule.**
Screen: every screen. Evidence (computed): dark mode, the outline of secondary buttons, the nine number buttons and
the icon buttons 1.92:1 (`theme.ts:31`); the input edge at rest 1.57:1 (`theme.ts:57`); the dashed edge of an unasked
part 2.90:1 (`theme.ts:53`). Light mode (7 and 8 points): outline 1.58:1, input edge 1.39:1, part edge 1.90:1
(`theme.ts:81`, `:103`, `:99`); the amber "claimed" points and the firefly's body on `day.surface` 1.38:1 (the
point's darker edge saves it at 3.14:1); an open point's edge on a lit part 2.23:1. Rule: lens 6, WCAG 2.2 1.4.11
(3:1 for the parts of a control a user needs to see). Fix: raise the edge alphas (about 0.45 in the dark, 0.5 in the
light) or give the number buttons and the inputs a filled surface that contrasts on its own; keep the amber points
with their darker edge. Cost: S.

The whole table (60 pairs, 19 fail; the round 9 README checked 90 text pairs against the gradient, this one adds the
edges, the corner, the code block and the light stages' darkest bands):

| Where | Pair | Colors | Ratio | Needs | Result |
|---|---|---|---|---|---|
| night | body / question text (onSurface) on base | `#f4efe8` on `#16151a` | 15.88:1 | 4.5:1 | Pass |
| night | dim text (onSurfaceVariant: Small dim, Label dim, part label on an unasked part) on base | `#c9c0b4` on `#16151a` | 10.10:1 | 4.5:1 | Pass |
| night | amber tags and eyebrows (question, 11 px mono) on base | `#f6c96e` on `#16151a` | 11.67:1 | 4.5:1 | Pass |
| night | coral gap text on base | `#ff9b80` on `#16151a` | 8.87:1 | 4.5:1 | Pass |
| night | placeholder on an input (surfaceContainer) | `#c9c0b4` on `#1f1d22` | 9.29:1 | 4.5:1 | Pass |
| night | typed text on an input | `#f4efe8` on `#1f1d22` | 14.60:1 | 4.5:1 | Pass |
| night | main button ink on primary | `#111114` on `#f6f1ea` | 16.77:1 | 4.5:1 | Pass |
| night | lit part: learner's words (onLit on lit) | `#17161a` on `#fbf6ee` | 16.74:1 | 4.5:1 | Pass |
| night | lit part: 11 px label (litLabel on lit) | `#5a5248` on `#fbf6ee` | 7.14:1 | 4.5:1 | Pass |
| night | asked part: question ink on questionContainer over base | `#f6c96e` on `#251b10` | 10.86:1 | 4.5:1 | Pass |
| night | unasked part: dim ink on partFill over base | `#c9c0b4` on `#131216` | 10.38:1 | 4.5:1 | Pass |
| night | revealed part: onSurface at 0.8 on partFill over base | `#c7c3be` on `#131216` | 10.64:1 | 4.5:1 | Pass |
| night | hint card text (onHintContainer on hintContainer) | `#3a2a0e` on `#f6e3a8` | 10.85:1 | 4.5:1 | Pass |
| night | hint card label 12 px mono (hint on hintContainer) | `#6e4604` on `#f6e3a8` | 6.48:1 | 4.5:1 | Pass |
| night | hint card cap note (hintNote on hintContainer) | `#5c3a03` on `#f6e3a8` | 7.99:1 | 4.5:1 | Pass |
| night | hint button label (question on controlFill over base) | `#f6c96e` on `#0e0e11` | 12.39:1 | 4.5:1 | Pass |
| night | code gutter number (codeGutter on codeFill over base) | `#7d7469` on `#0c0c0e` | 4.26:1 | 4.5:1 | FAIL |
| night | dim code lines (codeDim on codeFill over base) | `#696765` on `#0c0c0e` | 3.47:1 | 4.5:1 | FAIL |
| night | level-5 question bubble ink #f8e3b6 on amber 0.1 over base | `#f8e3b6` on `#2c251f` | 11.97:1 | 4.5:1 | Pass |
| night | selected chip ink (question on amber 0.16 over base) | `#f6c96e` on `#392f22` | 8.42:1 | 4.5:1 | Pass |
| night | learner bubble ink (onSurface on bubble over base) | `#f4efe8` on `#2d2b2e` | 12.27:1 | 4.5:1 | Pass |
| night | stage 0 corner: amber tag (question) on the corner light | `#f6c96e` on `#8b7458` | 2.85:1 | 4.5:1 | FAIL |
| night | stage 0 corner: onSurface on the corner light | `#f4efe8` on `#8b7458` | 3.88:1 | 4.5:1 | FAIL |
| night | stage 6 corner: onSurface on the 12% stop | `#f4efe8` on `#c69059` | 2.44:1 | 4.5:1 | FAIL |
| night | stage 6 corner: question on the 12% stop | `#f6c96e` on `#c69059` | 1.79:1 | 4.5:1 | FAIL |
| night non-text | outline (secondary button, number choice, icon button edge) over base | `#494546` on `#16151a` | 1.92:1 | 3:1 | FAIL |
| night non-text | fieldEdge (input edge at rest) over base | `#3b383a` on `#16151a` | 1.57:1 | 3:1 | FAIL |
| night non-text | focused field edge (onSurfaceVariant) over surfaceContainer | `#c9c0b4` on `#1f1d22` | 9.29:1 | 3:1 | Pass |
| night non-text | partEdge (unasked part's dashed edge) over base | `#655f5e` on `#16151a` | 2.90:1 | 3:1 | FAIL |
| night non-text | open pip edge rgba(255,240,225,0.45) over partFill | `#7d7671` on `#131216` | 4.18:1 | 3:1 | Pass |
| night non-text | amber asked edge / leader line / claimed pip on base | `#f2b84b` on `#16151a` | 10.15:1 | 3:1 | Pass |
| night non-text | coral missed pip edge on base | `#ff9b80` on `#16151a` | 8.87:1 | 3:1 | Pass |
| night non-text | disabled main button (primary at 0.45) on base | `#7b7878` on `#16151a` | 4.15:1 | 3:1 | Pass |
| night non-text | hint step dot empty: hint edge on hintContainer | `#6e4604` on `#f6e3a8` | 6.48:1 | 3:1 | Pass |
| day | body text (onSurface) on day.surface | `#17161a` on `#fbdeb4` | 13.90:1 | 4.5:1 | Pass |
| day | body text (onSurface) on stage 7's far corner | `#17161a` on `#deaa7a` | 8.69:1 | 4.5:1 | Pass |
| day | dim text (onSurfaceVariant) on day.surface | `#433c35` on `#fbdeb4` | 8.37:1 | 4.5:1 | Pass |
| day | dim text (onSurfaceVariant) on stage 7's far corner | `#433c35` on `#deaa7a` | 5.23:1 | 4.5:1 | Pass |
| day | amber tags (question, 11 px mono) on day.surface | `#6e4604` on `#fbdeb4` | 6.38:1 | 4.5:1 | Pass |
| day | amber tags (question) on stage 7's far corner | `#6e4604` on `#deaa7a` | 3.99:1 | 4.5:1 | FAIL |
| day | coral gap text on day.surface | `#9e3420` on `#fbdeb4` | 5.47:1 | 4.5:1 | Pass |
| day | coral gap text on stage 7's far corner | `#9e3420` on `#deaa7a` | 3.42:1 | 4.5:1 | FAIL |
| day | coral gap text on stage 7's middle | `#9e3420` on `#ecbe8c` | 4.15:1 | 4.5:1 | FAIL |
| day | main button ink (onPrimary on primary) | `#f6f1ea` on `#17161a` | 16.03:1 | 4.5:1 | Pass |
| day | lit part label (litLabel on lit) | `#5a5248` on `#fffdf8` | 7.55:1 | 4.5:1 | Pass |
| day | placeholder on an input (surfaceContainer) | `#433c35` on `#fffaf2` | 10.44:1 | 4.5:1 | Pass |
| day | code gutter on codeFill over day.surface | `#6b6259` on `#fdefda` | 5.27:1 | 4.5:1 | Pass |
| day | dim code lines on codeFill over day.surface | `#968d84` on `#fdefda` | 2.88:1 | 4.5:1 | FAIL |
| day | unasked part dim ink on partFill over day.surface | `#433c35` on `#fdebd2` | 9.29:1 | 4.5:1 | Pass |
| day | asked part ink (question on questionContainer over day.surface) | `#6e4604` on `#f9d7a1` | 6.01:1 | 4.5:1 | Pass |
| day non-text | outline (button edges) over day.surface | `#c9b292` on `#fbdeb4` | 1.58:1 | 3:1 | FAIL |
| day non-text | fieldEdge (input edge at rest) over surfaceContainer | `#dad6cf` on `#fffaf2` | 1.39:1 | 3:1 | FAIL |
| day non-text | partEdge over day.surface | `#b7a286` on `#fbdeb4` | 1.90:1 | 3:1 | FAIL |
| day non-text | coral missed pip edge (gap) on day.surface | `#9e3420` on `#fbdeb4` | 5.47:1 | 3:1 | Pass |
| day non-text | coral missed pip edge on stage 8's far corner | `#9e3420` on `#f4e0c4` | 5.50:1 | 3:1 | Pass |
| day non-text | claimed pip: amber fill on day.surface | `#f2b84b` on `#fbdeb4` | 1.38:1 | 3:1 | FAIL |
| day non-text | claimed pip: its questionOutline edge on day.surface | `#a8740f` on `#fbdeb4` | 3.14:1 | 3:1 | Pass |
| day non-text | firefly body on day.surface (the resting firefly on the result) | `#f2b84b` on `#fbdeb4` | 1.38:1 | 3:1 | FAIL |
| day non-text | amber asked edge (questionOutline) on day.surface | `#a8740f` on `#fbdeb4` | 3.14:1 | 3:1 | Pass |
| day non-text | open pip edge rgba(23,22,26,0.35) over lit | `#aeacaa` on `#fffdf8` | 2.23:1 | 3:1 | FAIL |

Read with care: the stage 0 and stage 6 corner rows matter only where text sits in the top-right corner (finding
13); the dark stages blend between designed stages (`theme.ts:151-161`), so a text pair that passes on both
neighbours passes in between; the gradient's far corner is reached on a phone (the diagonal is under the 1300 px
cap, `theme.ts:167`), so the "far corner" rows are real on phones at 7 points.

**12. On the lit stages, the amber tags, the coral gap and the code's dim lines fall under 4.5:1.**
Screen: the result and the map at 7 and 8 points; Start's code block at every stage. Evidence (computed, table
above): `day.question` on stage 7's darkest band 3.99:1 (the "for next time" tag, `result.tsx:137`, the eyebrows and
part tags, all 11 px); `day.gap` 3.42:1 and 4.15:1 on stage 7's corner and middle (today coral is only a 9 px edge on
the result, `result.tsx:67`, so this is a rule for the future, not a live failure); the code block's dim lines 3.47:1
in the dark and 2.88:1 in the light (`theme.ts:61`, `:106`), the gutter 4.26:1 in the dark (`theme.ts:62`). Rule: lens
6, WCAG 1.4.3 (4.5:1; 3:1 only from 24 px, or 19 px bold). Fix: `day.question` to about `#5a3a03`, `day.gap` to about
`#8a2c1a` wherever either is drawn as text; code dim lines at 0.6 alpha in the dark and `#5e5650` in the light. Cost: S.

**13. The worked example is a text list beside a map that is already full.**
Screen: "See an example", level 1 ("Watch"). Evidence: `exampleParts` marks all four planet parts revealed at once
(`present.ts:168-169`); the four steps are text under it (`messages.tsx:192-216`); nothing lights one part per step,
and the learner can only read or press Continue. Seen in the pane: the full planet map on top, 2.5 screens of text
under it. Rule: lens 5, worked examples and pacing under the learner's control (a step at a time, the learner taps
for the next); lens 4, cognitive load (everything at once). DECISIONS 2026-10-22 put the example behind a button;
this keeps that. Fix: "Next step" lights one planet part and shows its one step, four taps in all, Continue available
at any time; with Reduce Motion the parts simply appear. Cost: M.

### Minor

**14. Text that carries meaning is set at 11 and 12 px.**
Screen: every session screen. Evidence: `type.tag` 11 px (`theme.ts:255`) carries "help −1", "nudge · free", "hint 1
of 3 · −1 pt", "for next time", "worked example", "1 · bigger group"; `type.partLabel` 11 px (`theme.ts:251`) carries
the four part names on the map; `type.label` 12 px (`theme.ts:254`) carries "this part can now light 1 point at most"
and "shown · 0 points". Rule: lens 5, legibility for slow readers (the guide's 16 px body, 14 px floor for labels);
lens 7, the type scale jumps from 11 to 15. Fix: tags and labels at 13 to 14 px, part labels at 12 px with the icon
above them on narrow maps (finding 10). Cost: S.

**15. The "capped" point looks like an open one.**
Screen: the map after a retry or a hint ("not yet", the dotted second point). Evidence: both are 9 px squares with a
1 px edge, one solid and one dotted (`concept-map.tsx:292-293`, `theme.ts:260` `point: 9`); at 320 and 390 px in the
pane the two were not tellable apart; the 12 px note under the nudge carries the meaning (`messages.tsx:110`). Rule:
lens 5, redundant cues (shape plus words, not a dot pattern alone); lens 6, 1.4.1 use of color and pattern. Fix: draw
a capped point half filled, or crossed, and write "1 point max" in the asked part's label row. Cost: S.

**16. Jargon that reaches the screen, not in the copy pass.**
Screen and evidence: "nudge · free" (`messages.tsx:108`); "Independent practice" (`whole-map.tsx:86`); "prediction
gap" as the legend (`result.tsx:119`); "N testing the idea" (`result.tsx:126`); "worked example" (`messages.tsx:183`);
"1 pts" (`scoring-guide.tsx:14`, the plural on 1 and 0); "404" (`+not-found.tsx:18`); "Reading your map…"
(`result.tsx:146`, the AI reads, the learner waits); on the web sign-in, "Learn to investigate concepts through
guided questions, make connections, and figure things out for yourself." (`sign-in.web.tsx:19`) is Cynthia's line of
October 23, flagged only: at about grade 10, with "investigate" and "make connections". Rule: lens 5, reading grade 6
to 8, one name per thing. Fix: "a free tip", "On your own", "guessed, not proved", "N that tested the idea", "An
example first", "1 point" / "0 points", drop "404", "Writing your next step…". Cost: S.

**17. Glyphs that a screen reader spells out and a phone shrinks.**
Evidence: the middle dot in `composer.tsx:38` ("Your answer · Bigger group"), `present.ts:245`, `concept-map.tsx:243`
("1 · bigger group"), `part-sheet.tsx:23` and `:32`, `result.tsx:249`, `whole-map.tsx:117`, `guess.tsx:107-108`,
`messages.tsx:198`; the minus sign in `present.ts:245`, `:260`, `:399`; the arrow in `concept-map.tsx:261-262` and
`part-sheet.tsx:40`; the em dash joining an exclusion and its difference in the review sheet (`whole-map.tsx:379`).
Copy pass rows 18, 20 and 30 cover three places; the rest are here. Rule: lens 6, 1.3.1 and 1.1.1 (the dot reads as
"middle dot", the minus as "dash", the arrow as "upwards arrow"); lens 5, plain punctuation. Fix: a colon or a comma
for the dot, "costs 1 point" for the minus, "up a level:" for the arrow, "is not X: how it differs" for the dash.
Cost: S.

**18. One number, four names.**
Evidence: "prediction" (`guess.tsx:111`, `result.tsx:99`), "confidence" (`present.ts:309`, `result.tsx:105`),
"guessed" in the share line (`present.ts:305`) and in Memory (`present.ts:475`), "felt" in the headline
(`present.ts:296`). DECISIONS 2026-10-23 ("The result says prediction and map score") chose the row labels; the
share line and Memory were not part of it. Rule: lens 2, Nielsen 4; lens 5, one term per thing. Fix: make the share
line and the Memory line say "predicted" to match the decision; whether "guess" wins instead is question 4. Cost: S.

**19. A lit part can be reopened, and nothing says so.**
Screen: the map while asking, after a part lights. Evidence: the conversation keeps only the current part
(`session.tsx:132`, `present.ts:49-63`), so the answer, the nudge and the hint card disappear when the part lights;
the lit part is pressable (`concept-map.tsx:126-128`) but its only signifier is an accessibility hint
(`concept-map.tsx:273`); level 5's parts say "Edit answer" (`concept-map.tsx:262`), guided parts say nothing. Rule:
lens 1, affordance needs a signifier (Norman). Fix: a small "read" word or a chevron in the lit part's label row on
the guided screen and on the result. Cost: S.

**20. Close is an icon alone on the phone and words on the web.**
Evidence: `session-bar.tsx:12`, an X labelled "Close and save" for screen readers only; the website header says
"Save and close" in words (`session.tsx:202`). A first-time learner cannot know the X keeps the session. Rule: lens 5,
icon plus label; lens 2, Nielsen 4 across layouts. Fix: "Save" next to the X on phones, or a one-line toast after
closing ("Saved. Resume from Start."). Cost: S.

**21. The result repeats the rubric in the middle of the page.**
Screen: the result, phone layout. Evidence: after the map come the legend, `POINTS_RULE` and the three rubric rows
(`result.tsx:111-124`), then the part notes and the coach's words (`:129-149`); 11 blocks before "Try API again". The
same rubric on both screens is decided (DECISIONS 2026-10-23, "The points rule is a shared 2/1/0 rubric"); its place
is not. Rule: lens 4, progressive disclosure; lens 3, Hick's law on a long scroll. Fix: keep the headline, the rows,
the map and "for next time" first; the rubric last, under a "How points work" label. Cost: S.

**22. At narrow widths the nine numbers wrap and the end labels lose their ends.**
Screen: the guess, 390 and 320 px. Evidence: the row wraps (`guess.tsx:154`), 6 and 3 at 390, 5 and 4 at 320 (seen
in the pane); "8 · I can explain all four" sits under the short second row, no longer under the 8
(`guess.tsx:106-109`). Nine numbers with nothing selected is decided (DECISIONS 2026-10-23); the wrap is layout.
Rule: lens 3, Gestalt alignment (the anchors belong to the ends of the scale). Fix: three rows of three on phones
with the two anchors as a line above the grid, or the anchors inside the 0 and 8 buttons as a second line. Cost: S.

**23. Coral gets a second meaning on Start.**
Evidence: the notes field's edge turns `c.gap` when a line looks like a key (`index.tsx:174`); `Failure` deliberately
never uses coral (`messages.tsx:270`). Rule: lens 7, one meaning per color (round 9 README, "Coral: the
overconfidence gap, and nothing else"). Fix: the amber question outline, or the failure icon alone. Cost: S.

**24. The web page is empty while fonts and Clerk load.**
Evidence: `_layout.tsx:71` returns null until the fonts load; `:90` returns null until Clerk knows who is signed in;
the HTML's only paint is the dark background (`+html.tsx`, the inline style). On a slow connection the judge sees a
black page with no sign of life. Not measured on production. Rule: lens 2, Nielsen 1. Fix: render the wordmark and
a `role="status"` "Loading" in the system font during both waits. Cost: S.

**25. "More help" sits in the send row, 8 px from the mic and the field.**
Evidence: `composer.tsx:71-83`, the hint button first in the row, then the mic, then the field with Send inside. A
control that ends in the reveal (0 points) is the nearest neighbour of the control used most. Rule: lens 3, Fitts's law
and error-prone adjacency; lens 5, errorless paths. Fix: the hint link above the field, left aligned and underlined,
as level 5 already draws it (`whole-map.tsx:136`). Cost: S.

**26. Two sheets have no visible Close.**
Evidence: "Your data" (`index.tsx:366-394`) and "Ask your AI what to map" (`index.tsx:278-288`) close only by the
scrim (`ui.tsx:399`, a button for screen readers) or Escape; the grabber is decoration; Memory (`memory-sheet.tsx:103`)
and the part sheet (`part-sheet.tsx:41`) have one. Rule: lens 2, Nielsen 3 (user control, a visible exit); lens 5,
redundant cues. Fix: a text "Close" at the end of both. Cost: S.

**27. "Your data" is six paragraphs with no headings.**
Evidence: `index.tsx:335-342`; `VOICE` is one 70-word paragraph; `KEPT` lists seven things in one sentence. Rule:
lens 5, reading grade and chunking; lens 4, progressive disclosure. Fix: a bold label per topic (What we keep, Where
your words go, Voice, Crash reports, Who asks) with one or two short sentences each. Cost: S.

**28. Disabled main buttons give no reason.**
Evidence: "Save my prediction" is disabled until a number is picked (`guess.tsx:59`) and shows only opacity 0.45
(`ui.tsx:424`); "Review & submit" is disabled at 0 areas filled (`whole-map.tsx:81`) with the same look; "Pick a
concept" (`index.tsx:97`) is the one disabled button whose label says why. Rule: lens 2, Nielsen 1 and 9 (say what
to do); lens 5, specific feedback. Fix: a dim line under each disabled button: "Pick a number first.", "Fill at least
one area first." Cost: S.

**29. Level 5 is never called level 5, and the self-test is never told apart from it on screen.**
Evidence: the intro label is "Independent practice" or "Test myself" (`whole-map.tsx:86`), then "Build your map" and
"Fill the four areas, then submit." (`:87-89`); nothing says the learner reached the last level or that the four
parts did. Rule: lens 2, Nielsen 1; lens 1, the conceptual model (the thesis's "the roles flip" moment). Fix:
"Level 5: you lead now." as the label in a level-5 session, "Self-test" for the test, with one sentence each. Cost: S.

**30. The text before the numbers on the guess is four blocks tall.**
Screen: the guess, phone. Evidence: title at 28 px, the task paragraph, `POINTS_RULE`, "The four areas" line
(`guess.tsx:95-99`), then the numbers, then two more lines (`:107-114`) and the rubric (`:116`); at 320 px the
numbers start at half the screen. The order (task, rule, rubric, numbers) is decided (DECISIONS 2026-10-23). Rule:
lens 4, cognitive load before the one action. Fix: copy pass rows 1, 2 and 5 shorten the words; set "The four areas"
as four small chips in one row, and fold the rubric under a "How points work" label that opens on tap. Cost: S.

**31. Nothing tells a first-time learner which way to start.**
Screen: Start. Evidence: "Explore with guidance" is the main button and "Test myself" a text button (`index.tsx:97-108`),
each with one line under it; neither says "start here" or "for your first time", and "Test myself" is the testers'
pre-test, which a newcomer could pick first. Rule: lens 1, constraints and defaults; lens 4. Fix: a dim "Start here
on your first session" above the main button, shown until the learner has finished one session. Cost: S.

**32. The top-right corner of the light sits under text on two screens.**
Evidence: at level 5 the question count sits at the session bar's right end (`whole-map.tsx:198`, `:226`, "+N" in
`question` color on the stage 0 corner, 2.85:1); on the result the resting firefly sits in the map's top-right
(`result.tsx:287`, opacity 0.4, `theme.ts:190`) where the light is brightest at 7 and 8 points (1.38:1 on
`day.surface`). The firefly is decoration and stays as it is; the count is text. Rule: lens 6, 1.4.3. Fix: move the
count to the left of the concept pill, or give it a solid pill like the header's buttons. Cost: S.

**33. Keyboard focus on the web is unverified on three inputs.**
Evidence: the focus ring covers `[role="button"]` only (`+html.tsx:15`); `PromptField` removes the browser ring and
shows focus on its edge (`ui.tsx:346`, 9.29:1, fine); the notes field (`index.tsx:166`) and the part editor's fields
(`whole-map.tsx:307`, `:321`) are raw `TextInput`s with no focus style of their own. Not tabbed through in this
audit. Rule: lens 6, 2.4.7 and 2.4.11. Fix: give the three raw fields the same focused edge as `PromptField`, then
tab through Start, the editor and the sheets once. Cost: S.

### Polish

**34. The picked concept chip is amber.**
Evidence: `ui.tsx:301`, amber edge and ink for the selected chip; amber means "the question being asked, and Help"
(round 9 README). The picked number uses warm light instead (`guess.tsx:140`). Fix: the chip takes the number's look.
Cost: S.

**35. The native sign-in shows the firefly in its Help look.**
Evidence: `sign-in.tsx:34`, `state="helps"` at 72 px, the brighter, closer look that means "a hint is coming". Fix:
`state="asks"` at the same size. Cost: S.

**36. The question count at level 5 is amber squares with no number until the seventh.**
Evidence: `whole-map.tsx:217-228`, one 8 px square per question, "+N" after six; a screen reader gets the count
(`:222`), a sighted learner counts squares. Fix: the number next to the squares ("3 asked"). Cost: S.

## What to keep

- The light as progress, with every text pair re-checked on the real gradient (`docs/design/09-lumente/README.md`,
  90 pairs; this audit's text pairs on the solid tokens all pass, finding 12 names the only soft bands). The dark ink
  turning at 7 points reads well in the pane at 320, 390 and 1280 px.
- The firefly: the drawing, the steady light, the hover that answers a finger (`firefly.tsx:21-29`), the drift that
  stops with Reduce Motion (`firefly.tsx:88`), the dashed line drawn to the asked part (`concept-map.tsx:178-205`,
  `work-stage.tsx:49-65`). It is the one element that tells a newcomer who is asking.
- Reduce Motion is honoured everywhere it matters: sparks (`concept-map.tsx:318`), state eases (`:174`), the light's
  crossfade (`light.tsx:84`), entrances (`ui.tsx:91-94`), the chosen number's settle (`guess.tsx:132`), the code's
  typing (`code-preview.tsx:26`), the firefly's lean (`firefly.tsx:141`).
- Target sizes: every control is 44 px or more (`theme.ts:260`, `ui.tsx:432-443`, `guess.tsx:155`, the "Remembered"
  link padded to 44 px in `messages.tsx:140`); WCAG 2.5.8 asks for 24.
- Labels: every icon button has one (`ui.tsx:231`, `:256`, `:378`, `session-bar.tsx:12`), every part on the map
  reads its name, its words and its points (`concept-map.tsx:239`), the hint card is a note (`messages.tsx:123`), the
  wait is a status (`messages.tsx:264`), a failure is an alert (`messages.tsx:274`), the guess number buttons carry
  their value and selected state (`guess.tsx:135-136`).
- The result's first sentence and its two rows: "You felt 2 points surer than you could explain." then "That's
  normal: explaining is how you find out." (`present.ts:296`), the guess in amber over the score with coral only on
  the points claimed and not proved (`result.tsx:66-67`); the coach's words arriving a moment later in their own
  block (`result.tsx:135-149`).
- The free nudge marked free and the cap said once (`messages.tsx:108-110`), the revealed answer held behind "Next
  question" so it is read before the next part (`composer.tsx:29-35`, `present.ts:92-95`), the evaluator's words on a
  finished part set dim above the next question (`session.tsx:310`).
- Level 5's hierarchy: "Build your map", the numbered next area, "Start: Bigger group", "Save answer", the collapsed
  chat and the hint as a link with a confirmation that names the area and the cost (`whole-map.tsx:84-104`,
  `:355-367`); the review sheet that warns which areas are empty before the one action that ends the session
  (`whole-map.tsx:370-389`).
- Error prevention on the costly things outside the session: the secret-shaped line stops the notes from leaving the
  phone (`index.tsx:177`, `present.ts:320-328`); "Delete my data" asks once and says what goes (`index.tsx:381-387`).
- Errors and empty states in plain words: "Something broke on our side." (`_layout.tsx:50`), "Can't reach the
  server. Check your connection and try again." (copy pass row 35), "Nothing yet. Finish a session and come back."
  (`memory-sheet.tsx:15`), "A new version is ready." with Restart (`update-notice.tsx:49-51`), "This page doesn't
  exist." with one button (`+not-found.tsx:19-20`, `not-found-390.png`).
- Type: Newsreader for the firefly's voice and the learner's words, Atkinson Hyperlegible for the interface, the 8 px
  spacing rhythm (`theme.ts:258`), 8 and 12 px corners, no green and no red anywhere.
- The website layout at 1000 px and up: the question and the input on the left, the map on the right where the light
  falls, the firefly's line running across (`work-stage.tsx`); the main buttons sized to their label (`ui.tsx:419`).

## Questions for the team

Each would change how the app works or reverse a decision, so none is a finding.

1. A confirmation before a hint in the guided levels too: the firefly's tap and "More help" send at once
   (`session.tsx:169`, `composer.tsx:71`), while level 5 confirms with the cost named. DECISIONS 2026-10-23 ("At level
   5 the firefly is a guide, not Help; Help is a link with a confirmation") kept the firefly as Help at levels 2 to 4
   without a sheet. Add the sheet there, at least before the reveal?
2. The worked example open by default on a learner's first session, closed by a button after that: DECISIONS
   2026-10-22 ("The worked example is behind a button") chose offered, not imposed, for everyone. Does a first
   session count as everyone?
3. The level on the asked part during a session ("level 2 of 5: a question for you"): DECISIONS 2026-10-22 ("No
   mastery screen: a level-up shows on the result, the levels live in the Memory sheet"). A word on the part is not a
   screen, but it is a second home for the levels. Yes or no?
4. "Prediction" (DECISIONS 2026-10-23, "The result says prediction and map score") or "guess" (copy pass rows 1 to
   6, the share line, Memory)? One word has to win on every screen.
5. "Area" (DECISIONS 2026-10-23, "the parts are called areas") or "part" (the round 9 design, the firefly's lines,
   the copy pass)? Same rule.
6. The fact chat open by default at level 5: DECISIONS 2026-10-23 collapsed it and named the risk (fewer questions,
   which the self-test measures). Did the pilot's question counts settle it?
7. The first explanation on the result, next to the map, so the learner sees how far their own words came. A new
   block on the result; nothing else changes.
8. A step indicator and "Skip for now" on the map: `stitch/README.md`, questions 2 and 4. Not answered here.
9. The rubric on the guess screen folded behind "How points work" on phones (finding 30 proposes a tap to open it):
   DECISIONS 2026-10-23 wants the rubric before the numbers so the learner predicts against the rules. Is a tap away
   still before?
10. A "Help" entry that costs nothing on the first question of a first session, so a slow learner tries the ladder
    once without losing a point: this changes the scoring (thesis, "each one costs points"). Probably no; asked so
    it is on record.

## Stitch briefs

### The first explanation (phone)

Top: the session bar (Close with "Save", the concept pill). Then the empty map, all four parts dashed with "?", no
firefly line: nothing is being asked yet. Under the map, the firefly (asks look, no tag) beside the eyebrow "before
any help" and the question in Newsreader: "In your own words, what is API?". A dim line under it: "No points for
this one. It is your starting point; the map is where you earn them." The one primary action is the field at the
bottom, labelled "Your first explanation", placeholder "Write it in your own words", with the mic and the send arrow.
Nothing else: no rubric, no help. After Send: the bubble on the right, then "Saved." dim, then "Continue" as the main
button with "See an example first" as a secondary line above it, explained: "Watch the four parts on a simpler idea.
Free." Colors: near-black, amber only on the firefly, warm light only on the button.

### The hint confirmation sheet (phone and website)

A sheet from the bottom (a dialog in the website layout) over the map while asking, the firefly in its helps look
behind the scrim. Title in Newsreader: "A hint for Bigger group?". One sentence in plain words, picked by the state:
"After this hint, this area can get 1 point, not 2." or "This area is already at 1 point. This hint costs nothing
more." or "This shows you the answer. This area gets 0 points." Under it, dim: "Hints go in the map's order: bigger
group, what it isn't, what it needs, types." A row of three small squares with the ones used filled: "Hint 2 of 3".
The one primary action: "Get the hint" (or "Show me the answer" on the last step), full width, warm light. Under it
a text button "Keep trying" and a visible "Close". The firefly stays where it is, bigger and brighter, not inside the
sheet. Amber for the title and the squares, coral nowhere.

### The revealed answer (phone)

The map with the revealed part in its dim, dashed, italic look, and a small label in its row: "shown, 0 points". Both
of its points open, one crossed. Under the map, the firefly (asks look) beside: "Here's this part, so you can keep
going: a software interface." Then dim: "Shown to you: 0 points for this area. The next area starts fresh at 2."
The one primary action is "Next question", full width; nothing else can be pressed, so the answer is read before
the next part. On the website layout the same lines sit in the left column with the map on the right and the
firefly's line gone (nothing is being asked). Amber only on the firefly; the revealed part is grey ink on the dark,
never coral (coral is the gap on the result, nothing else).

### The 320 px map while asking

Top to bottom: the session bar (X with "Save", the concept pill, nothing on the right). The map, built for 320:
the top part full width, the two side parts each 96 px wide with the icon on the first row and the label under it
at 12 px ("what it needs", two lines at most), the two points on the label's row; the concept at 30 px for short
words, 17 px for long ones; the bottom part full width. The asked part in amber with the firefly's dashed line
running down the left gutter. Under the map: the firefly (asks look) with "costs 1 point" in words under it, the
question in Newsreader at 22 px, then one dim line with the part's meaning: "The closest bigger group that API
belongs to." Then the learner's bubble and the nudge if any, with "free tip" as its tag. Pinned at the bottom: the
label "Your answer: Bigger group", the mic, the field, the send arrow, and the hint link above the field, not beside
it. One primary action: the field.

## The five changes that would help slow learners most

1. Say the cost of help in words on every help control, every time, and make the hint card's price match it
   (findings 1, 2 and 17).
2. Put each part's meaning in plain words on screen the moment it is asked, on the map and under the question
   (finding 6).
3. Answer every action within a second: a busy send button and a "Checking your answer…" line, and a "Saved" line
   after the first explanation (findings 4 and 5).
4. Make the small cues real: tags and labels at 13 to 14 px, a capped point that looks different, a "read" cue on
   lit parts, "Save" next to the X (findings 14, 15, 19 and 20).
5. Pace the worked example one part per tap, so a first-time learner watches the map light up before building their
   own (finding 13).
