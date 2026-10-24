# UI and UX best practices for Lumente

The rules that make a screen understood at a glance, beautiful, accessible and usable by slow learners, each
with its source and with the Lumente screen it applies to. Ends with a checklist a teammate can run on any screen.

Research for after the October 24 freeze. Nothing here ships before Demo Day.

How to read it: each rule is four lines. The rule. Why, with its source. How it looks in Lumente, on a named
screen. A check question. The screens are the ones decided in `DECISIONS.md` (October 22 and 23) and shown in
`docs/readme/` and `docs/design/10-research/stitch/`; where a rule argues against one of those decisions, the
rule says so and names the decision, and the call stays with the team. The method in
`wiki/synthesis/product-thesis.md` is fixed: the guess before anything, the first explanation in the learner's
own words, the four areas of the map, hints that cost points, help that fades level by level, the fact desk at
level 5, the gap on the result. The firefly stays as it is drawn in `app/src/components/firefly.tsx`.

The screens named below: Start (the code block, the concepts, "Explore with guidance" and "Test myself"), the
guess (nine numbers, the 2/1/0 rubric, "Save my prediction"), the first explanation ("In your own words", then
"See an example"), the map while asking (the firefly, its dashed line, the amber area, the question, the input),
the hint card (nudge, hints 1 to 3, "More help"), the result (the gap in words, the "prediction" and "map score"
rows, the lit map, "Try API again"), level 5 (the whole map, "Ask a fact (optional)", the Help link and its
sheet, "Review & submit") and the web sign-in ("Build understanding, not dependence.").

## 1. The user knows what to do without being told

**Every control shows what it lets you do, and a visible cue says so.**
Why: Norman separates the affordance (what a thing lets you do) from the signifier (the cue that tells you); he
says what people need, and design must provide, are signifiers ([Norman, Signifiers, not affordances](https://jnd.org/signifiers-not-affordances/); [The Design of Everyday Things, revised edition](https://jnd.org/the-design-of-everyday-things-revised-and-expanded-edition/)).
In Lumente: on level 5 each empty area says "Write here →" or "Write answer" instead of a dashed box with a "?",
because the box did not read as something to open (2026-10-23, "At level 5 the map is the task").
Check: can a first-time user name every tappable thing on this screen without tapping it?

**Mapping: a control sits where its effect happens, and a cue connects them.**
Why: Norman's mapping is the relation between a control and its result; a natural mapping needs no label
([The Design of Everyday Things](https://jnd.org/the-design-of-everyday-things-revised-and-expanded-edition/)).
In Lumente: on the map while asking, a dashed amber line runs from the firefly to the area being asked, and the
input is labelled "Your answer · What it needs", so the question, the area and the box are one line.
Check: is it clear which area this input writes into?

**Feedback: every action gets a visible answer, at once.**
Why: Norman's feedback and Nielsen's first heuristic say the same thing: the system shows what happened
([Visibility of system status](https://www.nngroup.com/articles/visibility-system-status/)). A reply within
0.1 s feels instant, within 1 s keeps the flow, and over 10 s needs an indicator and a way out
([Response times](https://www.nngroup.com/articles/response-times-3-important-limits/)).
In Lumente: the learner's answer appears at once, the firefly shows "checking" for the 2 to 8 s the evaluator
takes, with `role="status"` and the input disabled; after 10 s the round 6 principles ask for "Taking longer
than usual" with Retry.
Check: between tapping Send and the next question, does the screen say what it is doing the whole time?

**Constraints: make the wrong action impossible, not just discouraged.**
Why: physical, cultural, semantic and logical constraints cut the number of possible actions to the right ones
([The Design of Everyday Things](https://jnd.org/the-design-of-everyday-things-revised-and-expanded-edition/)).
In Lumente: "Save my prediction" stays disabled until a number is picked, and "Review & submit" is disabled
while the map is empty or busy.
Check: can the main button be tapped in a state where it would do nothing useful?

**Conceptual model: give the user one picture of how the app works.**
Why: people act on a mental model of the system; a design that matches it reduces mistakes
([Mental models](https://www.nngroup.com/articles/mental-models/)). Norman calls the designer's version the
conceptual model ([The Design of Everyday Things](https://jnd.org/the-design-of-everyday-things-revised-and-expanded-edition/)).
In Lumente: the whole app runs on one picture, questions are the light: the map is dark, each question lights
one area, and help is borrowed light (2026-10-22, "The app's design is Lumente (round 9)"). Start's two mode
lines are where the picture is first told in words.
Check: does the first line of this screen fit "questions are the light"?

**Don't make me think: a screen is understood without conscious effort.**
Why: Krug's first law is the title of his book, and chapter 1 is "Don't make me think!"
([Don't Make Me Think, Revisited, 2014, contents](https://www.pearson.com/en-ca/subject-catalog/p/don-t-make-me-think-revisited-a-common-sense-approach-to-web-usability/P200000000385/9780133597264); [the book's page](https://sensible.com/dont-make-me-think/)).
In Lumente: the guess screen asks one question in the headline, "How much can you explain on your own?", and
the nine numbers under it are the answer.
Check: read only the biggest text on the screen; is it clear what to do?

**Recognition over recall: show the options, never ask the user to remember them.**
Why: recognizing a familiar thing is easier than recalling it from nothing, so interfaces should show choices
([Recognition and recall](https://www.nngroup.com/articles/recognition-and-recall/); heuristic 6 in the
[10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)).
In Lumente: the Help sheet on level 5 names the area the hint goes to and its cost before anything is sent,
because the server's hint order can differ from the highlighted area (2026-10-23, "At level 5 the firefly is a
guide, not Help"); the learner never has to remember the order.
Check: does the user need to remember anything from an earlier screen to use this one?

**Sensible defaults: preselect the common case, unless the choice is the point.**
Why: people stick with defaults, so the default should be the most common or safest value
([The power of defaults](https://www.nngroup.com/articles/the-power-of-defaults/)).
In Lumente: the guess has no default on purpose: a preselected 4 would anchor people to the middle
(2026-10-23, "The prediction is picked from 0 to 8, with nothing selected first"). The rule argues for a default;
the decision argues the guess is the one choice that must be deliberate, and the call stays with the team.
Check: where there is no default, is the reason written down?

**One primary action per screen.**
Why: a page with more than one main call to action weakens each
([GOV.UK button](https://design-system.service.gov.uk/components/button/)); primary and secondary actions must
look different ([Wroblewski, Primary and secondary actions](https://www.lukew.com/ff/entry.asp?571)).
In Lumente: on level 5 testers typed their answers into the fact chat because the chat field was the strongest
action, so the map got the primary action and the chat collapsed behind "Ask a fact (optional)" (2026-10-23,
"At level 5 the map is the task"). The result still has one filled button, "Try API again", and two text links.
Check: is there exactly one filled button on this screen, and is it the task?

**Visible system status: where am I, what is done, what is next.**
Why: heuristic 1 ([Visibility of system status](https://www.nngroup.com/articles/visibility-system-status/));
in multi-step flows, show the steps and mark the current one ([Wizards](https://www.nngroup.com/articles/wizards/)).
In Lumente: progress is the light that grows one stage per point, and the exact score is in the point squares
(2026-10-22, "Progress is the light"). The light is ambient and less exact than a step indicator; the Stitch
mockups add "Step 1 of 3" and `stitch/README.md` lists it as question 2 for the team.
Check: can the user say how far they are and what comes next without tapping anything?

## 2. The classic rules

**Nielsen's 10 heuristics are the review vocabulary.**
Why: visibility of system status, match with the real world, user control and freedom, consistency and
standards, error prevention, recognition rather than recall, flexibility and efficiency, aesthetic and minimalist
design, help users recover from errors, help and documentation
([10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)).
In Lumente: `docs/ux-guidance.md` already reviews each screen by state; this list gives the review its names.
Check: which of the 10 does this finding belong to?

**Match the real world: the learner's words, not ours.**
Why: speak the user's language and avoid system terms ([Match between system and real world](https://www.nngroup.com/articles/match-system-real-world/)).
In Lumente: on screen the four boxes are "areas", a word for a place you can write in; "mentefact" stays in
code (2026-10-23, "The points rule is a shared 2/1/0 rubric, and the parts are called areas"). "Prediction" and
"rubric" are still ours; `copy-pass.md` proposes "guess" and "points".
Check: would a CS student say this word to a friend?

**Proximity: things that belong together sit together.**
Why: nearby elements read as related, far ones as separate ([Gestalt proximity](https://www.nngroup.com/articles/gestalt-proximity/)).
In Lumente: on the result, the two rows "prediction" and "map score" sit directly under the gap headline, and
the rubric sits apart below them.
Check: is anything placed next to something it is not related to?

**Similarity: things that look alike are read as the same kind of thing.**
Why: matching color, shape or size signals matching behavior ([Gestalt similarity](https://www.nngroup.com/articles/gestalt-similarity/)).
In Lumente: every lit area is the same warm card with the same label style, so one glance separates lit from
unlit; on the hint card the amber of the card matches the amber of "More help", so help looks like one thing.
Check: do two elements look alike but behave differently?

**Common region: a border or background makes a group.**
Why: items inside one boundary are read as connected; too many boxes clutter ([Common region](https://www.nngroup.com/articles/common-region/)).
In Lumente: the hint card is one amber region holding the hint label, the text and its point squares; the code
block on Start is one region with its filename and the amber line.
Check: does every box on this screen hold one idea, and could one box go?

**Continuity: the eye follows a line.**
Why: aligned elements are grouped along an implied line, and contours are completed across gaps
([Wagemans et al., A century of Gestalt psychology, 2012](https://pmc.ncbi.nlm.nih.gov/articles/PMC3482144/)).
In Lumente: the firefly's dashed line leads the eye from the question to the area being asked, and on the web
it runs down the gap between the words column and the map (2026-10-22, "From 1,000 px the web build is laid
out as a website").
Check: does the line from the firefly reach the right area without crossing text?

**Closure: a shape that is partly drawn still reads as whole.**
Why: people complete partial shapes, so a dashed or cut shape can hint at something not yet there
([Principle of closure](https://www.nngroup.com/articles/principle-closure/)).
In Lumente: an unasked area is a dashed box with a "?" and an open point is an outlined square: the shape of
what will be there, not yet filled.
Check: does every dashed or outlined thing mean "not yet", and nothing else?

**Figure and ground: one thing in front, the rest behind.**
Why: perception splits a scene into figure and ground, and the figure gets the attention
([Wagemans et al., 2012](https://pmc.ncbi.nlm.nih.gov/articles/PMC3482144/)).
In Lumente: the faint graph-paper grid and the near-black are ground; the lit cards and the amber area are
figure. On the result the lit map sits on the light, so the words column must stay the figure there.
Check: is the most important element the one that stands out from the background most?

**Fitts's law: big, close targets are fast; small, far ones are slow.**
Why: the time to hit a target grows with its distance and shrinks with its size, so key targets should be
large and near the pointer ([Fitts's law](https://www.nngroup.com/articles/fitts-law/); [Laws of UX](https://lawsofux.com/fittss-law/)).
In Lumente: "Save my prediction" and "Try API again" are full-width buttons at the bottom, where thumbs are;
the nine number buttons on the phone are tighter and under 44 px (`stitch/README.md`, screen 2), the weakest
targets in the app.
Check: is the main action the biggest target, and does every target meet the size rules in section 4?

**Hick's law: more choices, slower decisions.**
Why: decision time grows with the number and complexity of options ([Hick's law](https://lawsofux.com/hicks-law/)).
In Lumente: the guess shows nine numbers at once; the decision accepted the density because the whole scale
must be visible and anchored at both ends (2026-10-23, "The prediction is picked from 0 to 8"). Start's three
concept chips and two modes are the only other choice lists.
Check: could this list be shorter without hiding a real option?

**Chunking: group information into a few meaningful units.**
Why: Miller's span of immediate memory is about seven items, and recoding into larger chunks raises what it
holds ([Miller, 1956](http://psychclassics.yorku.ca/Miller/)); the number is not a design limit, the grouping is
([Chunking](https://www.nngroup.com/articles/chunking/)).
In Lumente: eight points are two squares on each of four areas, and the rubric is three lines, 2, 1 and 0.
Check: is any list on this screen longer than five items without a grouping?

**Cognitive load: cut the extraneous, respect the intrinsic, leave room for the germane.**
Why: intrinsic load is the difficulty of the material itself, extraneous load is effort spent on the
presentation, germane load is the effort of building understanding; instruction should cut the extraneous
([Sweller, 2010](https://link.springer.com/article/10.1007/s10648-010-9128-5); [Debue and van de Leemput, 2014](https://www.frontiersin.org/articles/10.3389/fpsyg.2014.01099/full); [Minimize cognitive load](https://www.nngroup.com/articles/minimize-cognitive-load/)).
In Lumente: the concept is the intrinsic load and must stay; the guess screen's two paragraphs, the rubric
and the anchors before the first tap are extraneous load the decision accepted ("more text to read before the
first tap", 2026-10-23); the copy pass shortens them.
Check: what on this screen is neither the concept nor the next action?

**Progressive disclosure: show the core first, the rest on request.**
Why: start with the few important options and move the rest to a second screen the user opens
([Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/)).
In Lumente: the worked example sits behind "See an example" (2026-10-22, "The worked example is behind a
button") and the fact chat behind "Ask a fact (optional)". The decision itself notes the risk: a collapsed
chat could mean fewer questions, which is what the self-test measures; the testers decide.
Check: is anything hidden that the user needs on the first pass?

**Serial position: the first and last things are remembered best.**
Why: people remember the first and last items in a series better than the middle
([Serial position effect](https://lawsofux.com/serial-position-effect/)).
In Lumente: the result opens with the gap in words and closes with "Try API again"; the coach's "for next
time" sits just above the buttons, in the last position the learner reads.
Check: are the first and last things on this screen the two things the user should keep?

## 3. What makes a screen beautiful

**A type scale with few sizes, used the same way everywhere.**
Why: one scale with named roles (display, headline, title, body, label) keeps hierarchy consistent
([Material type scale](https://m3.material.io/styles/typography/type-scale-tokens)); establish a type scale
([Refactoring UI](https://www.refactoringui.com/)); keep few typefaces and adjust weight, size and color for
hierarchy ([Apple typography](https://developer.apple.com/design/human-interface-guidelines/typography)).
In Lumente: three families with fixed jobs: Newsreader for the tutor's voice and the learner's words,
Atkinson Hyperlegible Next for the interface, Atkinson Hyperlegible Mono for code and points
(`docs/design/09-lumente/README.md`). Done well.
Check: does this screen use more than three text sizes, or a size no other screen uses?

**Rhythm: consistent spacing between related things.**
Why: consistent spacing makes groups easy to follow with the eye, and spacing both groups content and directs
attention ([Material spacing](https://m3.material.io/foundations/layout/understanding-layout/spacing)); line
height is proportional to size ([Refactoring UI](https://www.refactoringui.com/)).
In Lumente: the round 6 principles set spacing in steps of 4 and 8 and the map's 24 px grid repeats the rhythm
on every screen. Done well on the result; the guess screen's stack of paragraphs has uneven gaps.
Check: are the gaps between blocks from one small set of values?

**A spacing system of 4 or 8 pt steps.**
Why: a fixed set of spacing values removes the per-screen guess ("Establish a spacing and sizing system",
[Refactoring UI](https://www.refactoringui.com/)). Material's spacing page no longer states a number; the 4 and 8
step is the app's own rule from round 6.
In Lumente: `lumente-tokens.ts` carries the values; a new screen reads them instead of typing numbers.
Check: is every margin and gap a token?

**Hierarchy through size, weight and contrast before color.**
Why: visual hierarchy comes from scale, contrast and grouping ([Visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/));
size is not everything, and labels are a last resort ([Refactoring UI](https://www.refactoringui.com/)).
In Lumente: the result's headline is large Newsreader, the rows are small mono, the rubric is dim body text;
color is not what makes the headline first. Done well.
Check: in grayscale, is the order of importance still the same?

**One meaning per color.**
Why: do not use the same color to mean different things, and do not rely on color alone
([Apple color](https://developer.apple.com/design/human-interface-guidelines/color)); color roles say what color
goes where ([Material color roles](https://m3.material.io/styles/color/roles)).
In Lumente: dark is what the learner can't explain yet, amber is questions and help, warm light is what they
understand, coral is the gap and nothing else; no green and no red (`docs/design/09-lumente/README.md`). Done
well, and the Stitch result keeps it: coral only on the dashed squares of the map-score row.
Check: does every color on this screen mean what the table says, and only that?

**Depth and elevation: a few levels, used to say what is in front.**
Why: elevation is the distance between surfaces, shown as shadows or tonal color, and tokens keep it consistent
([Material elevation](https://m3.material.io/styles/elevation/overview)); emulate a light source and use shadows
to convey elevation ([Refactoring UI](https://www.refactoringui.com/)).
In Lumente: lit cards carry a tight glow, the hint card a brighter one, and glows stay tight by rule ("Crisp,
not soft"). Done well; the one light source is the corner, so shadows must fall away from it.
Check: are there more than three levels of depth on this screen?

**Whitespace is a tool, not leftover.**
Why: space groups and separates ([Gestalt proximity](https://www.nngroup.com/articles/gestalt-proximity/));
drop what does not serve the task, because every extra element competes with the needed ones
([Aesthetic and minimalist design](https://www.nngroup.com/articles/aesthetic-minimalist-design/)).
In Lumente: the map while asking leaves most of the screen dark around the question, which is right; the
guess screen fills the height with text. Not yet done on the guess.
Check: could one block leave this screen and nothing be lost?

**Alignment and a grid.**
Why: aligned elements are easier to scan and read as related; indentation reads as subordinate
([Apple layout](https://developer.apple.com/design/human-interface-guidelines/layout)); grids are overrated,
but a consistent column is not ([Refactoring UI](https://www.refactoringui.com/)).
In Lumente: the web layout from 1,000 px is two columns, words on the left at 480 px, the map on the right
(2026-10-22); on the phone everything hangs from one left edge. Done well.
Check: do all left edges on this screen line up on one or two columns?

**Imagery that carries information; nothing decorative.**
Why: users skip ornamental images and study informative ones ([Photos as web content](https://www.nngroup.com/articles/photos-as-web-content/));
use good photos or none ([Refactoring UI](https://www.refactoringui.com/)).
In Lumente: there are no photos; the code block on Start and the map are the imagery, and both are content.
Done well.
Check: does every picture on this screen tell the user something?

**Motion timing: 100 to 500 ms, eased, and only with a purpose.**
Why: most interface animations belong between 100 and 500 ms ([Animation duration](https://www.nngroup.com/articles/animation-duration/));
Material's tokens run from 50 ms (short) to 600 ms (long), with standard easing for small components and
emphasized easing for big transitions ([Material easing and duration](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs);
that page says Material now prefers its spring-based motion physics system and keeps the tokens for transitions,
[Material motion overview](https://m3.material.io/styles/motion/overview));
add motion purposefully, keep feedback animations brief and precise
([Apple motion](https://developer.apple.com/design/human-interface-guidelines/motion)).
In Lumente: the hover look on the firefly eases over 150 ms, the lit moment is 700 ms, and nothing loops,
blinks or pulses (2026-10-22, website layout; 2026-10-23, "The firefly hovers in place"). The firefly's
drift is the one exception, a few pixels, slow enough to read as holding still. Done well.
Check: is every animation on this screen under 500 ms, or the one 700 ms moment, and does it answer an action?

**Micro-interactions: a trigger and a small, precise response.**
Why: a microinteraction pairs a trigger with narrow feedback and shows status, prevents errors and carries
personality ([Microinteractions](https://www.nngroup.com/articles/microinteractions/)).
In Lumente: an area that just lit gets an amber ring and six sparks for 700 ms; the firefly's halo spreads under
a finger. Done well, and with Reduce Motion the sparks are skipped.
Check: does the response say what happened, and does it stop on its own?

**Flat design needs clickability cues.**
Why: flat elements without borders, shadows or underlines lose the cues that say "tap me", and users slow down
([Flat design](https://www.nngroup.com/articles/flat-design/)).
In Lumente: Help on level 5 is an underlined link, buttons have fills or outlines, areas have a border. The
firefly on the guided levels is tappable Help with "help −1" under it; without that tag it would be a drawing.
Check: does every tappable thing have a border, a fill, an underline or a label that says it is tappable?

**Refactoring UI's axioms, the ones the app lives by.**
Why: start with a feature, not a layout; labels are a last resort; use fewer borders; don't overlook empty
states ([Refactoring UI](https://www.refactoringui.com/)).
In Lumente: the lit area shows the learner's words with a small label above, not a form field; "Nothing written
yet" is the proposed empty state for an area on review (`copy-pass.md`, row 27). Not yet done: the first
explanation screen and the 320 px states have no mockup (`stitch/README.md`).
Check: is there an empty, loading and error state for this screen?

## 4. Accessibility that also helps everyone

**Text contrast 4.5:1, large text 3:1.**
Why: WCAG 2.2 success criterion 1.4.3, level AA; large text is 18 pt or 14 pt bold
([Understanding contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); [WCAG 2.2](https://www.w3.org/TR/WCAG22/#contrast-minimum)).
In Lumente: the light is a gradient, so round 9 checked 90 text pairs against the real background at all nine
stages; the lowest is 4.83:1 (`docs/design/09-lumente/README.md`). Done well; a new screen must add its pairs.
Check: has every new text color on this screen been checked at the darkest and lightest stage it can sit on?

**Non-text contrast 3:1 for controls and their states.**
Why: criterion 1.4.11, level AA: borders, focus rings and the parts of graphics needed to understand them
([Understanding non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)).
In Lumente: the outlined point squares, the dashed "?" boxes and the dotted "capped" point are the controls
whose meaning is in a thin line; the dim grey outlines on the dark screens are the pairs to measure.
Check: does the outline of every square, box and button reach 3:1 against what is behind it?

**Targets at least 24 by 24 CSS px, and 44 pt on Apple platforms.**
Why: criterion 2.5.8, level AA, with a spacing exception ([Understanding target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html));
Apple's minimum is 44 by 44 pt ([Apple accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).
In Lumente: the nine number buttons on the phone are under 44 px (`stitch/README.md`, screen 2); the mic and
send buttons on the input are small. Two rows of larger numbers, or a slider with big ends, is the open choice.
Check: measure the smallest tappable thing on this screen; is it 24 px with space around it, and 44 on iOS?

**Focus is visible, never hidden, and on the web a keyboard reaches everything.**
Why: criteria 2.4.7 Focus visible (AA) and 2.4.11 Focus not obscured (AA); 2.4.13 Focus appearance is AAA and
asks for a 2 px perimeter at 3:1 ([Understanding focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html); [Understanding focus appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html));
all functionality from the keyboard, criterion 2.1.1 (A) ([Understanding keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)).
In Lumente: on the web the digits 0 to 8, the arrows and Enter work the guess, Enter sends and Shift+Enter
starts a new line (2026-10-22, website layout; 2026-10-23, the prediction). The focus ring on the dark screens
is not in the contrast table yet.
Check: tab through the whole screen; is the focused thing always visible, and does every action work by key?

**Reflow at 320 CSS px, text at 200 percent.**
Why: criterion 1.4.10 (AA): content reflows at 320 px without two-dimensional scrolling
([Understanding reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)); 1.4.4 (AA): text enlarges
to twice its size without loss ([Understanding resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html));
support larger text sizes ([Apple accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).
In Lumente: the browser checks passed at 320 px with no horizontal overflow, and long concepts and answers were
tried (`docs/ux-guidance.md`); the Stitch mockups have no 320 px state yet.
Check: at 320 px and at 200 percent zoom, does the map still fit and the input still show?

**Color is never the only cue.**
Why: criterion 1.4.1 (A): color is not the only means of conveying information or state
([Understanding use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)); instructions
must not rely on shape, size or position alone, 1.3.3 (A) ([Understanding sensory characteristics](https://www.w3.org/WAI/WCAG22/Understanding/sensory-characteristics.html)).
In Lumente: a missed point is coral and dashed and has the legend "prediction gap"; the asked area is amber and
outlined and has the firefly's line; a lit area is light and holds words. Done well.
Check: cover the colors; can every state on this screen still be told apart?

**Reduced motion is honoured, and the app still works without the motion.**
Why: criterion 2.3.3 (AAA): motion triggered by interaction can be turned off, with `prefers-reduced-motion` as
the technique ([Understanding animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html); [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion));
on phones, `AccessibilityInfo.isReduceMotionEnabled` and `reduceMotionChanged` ([React Native AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo));
Apple asks apps to cut automatic and repetitive animation when Reduce Motion is on ([Apple accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).
In Lumente: with Reduce Motion the light still changes, because it is the score, but without the crossfade;
the sparks are skipped and the firefly stays still (2026-10-23, "The firefly hovers in place"). Done well.
Check: with Reduce Motion on, does this screen still show every state change?

**Every input has a visible label, and every control a name.**
Why: criterion 3.3.2 (A): labels or instructions wherever input is needed ([Understanding labels or instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html));
4.1.2 (A): a name and role software can read ([WCAG 2.2](https://www.w3.org/TR/WCAG22/#name-role-value));
placeholder text is not a label, because it disappears when typing starts ([Placeholders in form fields](https://www.nngroup.com/articles/form-design-placeholders/)).
In Lumente: the input carries "Your answer · What it needs" above it, so "In your own words" inside the box is a
hint, not the label. The mic and the send arrow have no visible name, and the "→" in "Write here →" is read
aloud as "right arrow" (`copy-pass.md`, row 18).
Check: does every field have a label outside it, and every icon button a name a screen reader says?

**Errors are named in text, next to the thing, and the work is kept.**
Why: criterion 3.3.1 (A): the item in error is identified and described in text
([Understanding error identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html));
error messages are explicit, human, polite, precise, constructive, and preserve the user's work
([Error message guidelines](https://www.nngroup.com/articles/error-message-guidelines/)).
In Lumente: "Can't reach the server. Check your connection and try again." keeps the answer in the box and
offers Try again; a failed hint never costs a point (round 6 principles). Done well.
Check: after an error, is the user's text still there and the next step one tap away?

**Repeated controls stay in the same place and order.**
Why: criterion 3.2.3 (AA): repeated navigation keeps the same relative order
([Understanding consistent navigation](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html));
internal consistency means the same patterns throughout ([Consistency and standards](https://www.nngroup.com/articles/consistency-and-standards/)).
In Lumente: Close is top-left and the concept chip top-centre on every session screen; the input is at the
bottom; the four areas keep their positions and icons. Done well.
Check: is anything on this screen in a different place than on the screen before it?

## 5. Designing for slow learners, novices and low digital literacy

**Plain language: reading grade 6 to 8, one idea per sentence, verbs first, no jargon.**
Why: lower-literacy users read word by word and miss what sits outside the text flow; a rewrite to about grade
6 on key pages and grade 8 elsewhere raised their task success from 46 to 82 percent, and higher-literacy users
gained too ([Writing for lower-literacy users](https://www.nngroup.com/articles/writing-for-lower-literacy-users/));
plain English is mandatory, split sentences over 25 words, use the active voice, explain a specialist term the
first time ([GOV.UK, Use clear language](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/));
use clear words, a simple tense and voice, keep text succinct, separate each instruction
([W3C COGA, Making content usable](https://www.w3.org/TR/coga-usable/)); one idea per paragraph, half the words
([How users read on the web](https://www.nngroup.com/articles/how-users-read-on-the-web/)).
In Lumente: "You felt 2 points surer than you could explain." is grade-6 ready and stays (`copy-pass.md`,
row 33); "Your prediction captured your confidence. Your map score reflects what you could explain in this
session." is the decided wording (2026-10-23, "The result says prediction and map score") and the rule argues
for shorter words; the copy pass lists the options and the team picks. The sign-in headline is Cynthia's and
stays.
Check: read the screen aloud; is any sentence over 25 words, and is any word one you would explain to a friend?

**One thing per screen.**
Why: asking one question per page helps users understand what they are asked to do
([GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/)); make short critical
paths and avoid too much content ([W3C COGA](https://www.w3.org/TR/coga-usable/)).
In Lumente: the guess asks for one number, the map asks one area at a time, the first explanation asks for one
paragraph. Start asks two things, the concept and the mode, on one screen; the Stitch Start mockup stacks them
with "Step 1 of 2" and "Step 2 of 2", which the README says to drop. Splitting Start into two screens is a
question for the team, not a decision here.
Check: how many decisions does this screen ask for?

**Consistent placement, so the hands learn the app.**
Why: controls and content should not move unexpectedly, and the relation between a control and what it
affects must be clear ([W3C COGA](https://www.w3.org/TR/coga-usable/));
same patterns throughout ([Consistency and standards](https://www.nngroup.com/articles/consistency-and-standards/)).
In Lumente: the input is always at the bottom, Help always costs and always says so, the firefly's line always
points at the area in play. On level 5 the firefly moved from Help to guide; the decision keeps the same visual
language, a line to the area being worked on (2026-10-23, "At level 5 the firefly is a guide, not Help").
Check: does the same element do the same thing on every screen it appears on?

**Redundant cues: icon plus label plus color.**
Why: a text label must be present alongside an icon, visible without hovering
([Icon usability](https://www.nngroup.com/articles/icon-usability/)); add familiar icons to important content
([W3C COGA](https://www.w3.org/TR/coga-usable/)); offer graphic symbols with text alternatives
([CAST UDL 2.1](https://udlguidelines.cast.org/representation/language-symbols/vocabulary-symbols/)).
In Lumente: each area has an icon, a name and a color state, and the points have a shape state (filled, open,
dotted, dashed) with a legend. Not yet done: the mic and send icons on the input, and the "?" help icon in the
Stitch Start top bar has no label.
Check: does every icon on this screen have a word next to it?

**Worked examples first, then fade them.**
Why: the worked example effect is one of the best-known cognitive load effects, and it reverses for people
who already know the material ([Sweller, 2010](https://link.springer.com/article/10.1007/s10648-010-9128-5));
use scaffolds that can be gradually released with growing independence, and models to emulate
([CAST UDL 5.3](https://udlguidelines.cast.org/action-expression/expression-communication/fluencies-practice-performance/)).
In Lumente: the "planet" example sits behind "See an example" after the first attempt, offered, not imposed
(2026-10-22, "The worked example is behind a button"), and the five levels fade the help per area. The rule
argues for showing the example to a learner at level 1 without asking; the decision chose the button so the
first attempt captures the learner's own words first, and that stays the method.
Check: can a novice see a finished example of this task before doing it, in one tap?

**Errorless where it can be: a nudge before a mark, and no fail state.**
Why: errorless learning keeps the learner from practising mistakes; the evidence is from memory rehabilitation
and is mixed across groups ([Clare and Jones, 2008](https://link.springer.com/article/10.1007/s11065-008-9051-4));
prevent slips with constraints, suggestions and good defaults ([Slips](https://www.nngroup.com/articles/slips/)).
In Lumente: there is no red and no fail mark; a wrong answer gets a free nudge from the firefly and the second
point turns dotted, "this part can now light 1 point at most"; the hint ladder goes from "where to look" to the
answer. The method keeps the attempt first; the rule only shapes what happens after a miss.
Check: after a wrong answer, does the screen show a way forward before it shows a cost?

**Immediate and specific feedback.**
Why: feedback is among the strongest influences on learning, and its type and delivery decide whether it helps
([Hattie and Timperley, 2007](https://assess.ucr.edu/media/746/download)); offer feedback that is frequent,
timely and specific, informative rather than comparative ([CAST UDL 8.5](https://udlguidelines.cast.org/engagement/effort-persistence/feedback/));
provide recognizable success or failure feedback with every action ([W3C COGA](https://www.w3.org/TR/coga-usable/)).
In Lumente: when an area is right, its feedback names what makes it right and what was left out, up to 45
words, dim above the next question (2026-10-23, "After a part is right"); the points light the moment the move
ends (2026-10-22, "Each Turn carries the points"). Done well.
Check: after each answer, does the learner learn one specific thing, not only a score?

**Forgiving input and a way back.**
Why: users need to go back, cancel and undo without feeling trapped ([User control and freedom](https://www.nngroup.com/articles/user-control-and-freedom/));
accept different input formats and make it easy to undo form errors ([W3C COGA](https://www.w3.org/TR/coga-usable/));
make the safer option the default and confirm what cannot be undone ([Error prevention](https://www.nngroup.com/articles/error-prevention/)).
In Lumente: any defensible answer passes, not one expected answer; a failed save keeps the number; every area
on level 5 stays editable in any order; "Review & submit" shows all four answers before the one action that
ends the session, and the Help sheet's "Keep working" sends nothing (2026-10-23). A hint cannot be undone,
which is why it is confirmed first. Done well.
Check: can the user change their mind at every step but the last, and is the last one confirmed?

**Pacing under the learner's control.**
Why: avoid timeouts and let people save as they go; give unlimited time when possible
([W3C COGA](https://www.w3.org/TR/coga-usable/)); criterion 2.2.1 (A): time limits can be turned off or extended
([Understanding timing adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html));
hold the user's attention with an indicator for waits over a few seconds ([Progress indicators](https://www.nngroup.com/articles/progress-indicators/)).
In Lumente: a session has no timer, and it survives a reload or a killed app (2026-10-23, "A session survives a
reload"); the only wait is the evaluator's, shown as "checking". Done well.
Check: is there any clock on this screen, and can the learner leave and come back?

**Vocabulary taught where it appears.**
Why: pre-teach vocabulary and symbols, and embed support in the text ([CAST UDL 2.1](https://udlguidelines.cast.org/representation/language-symbols/vocabulary-symbols/));
explain a specialist term the first time ([GOV.UK, Use clear language](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/)).
In Lumente: "level" is the app's own idea and stays, with the four words that say what a level is the first
time it appears (`copy-pass.md`, row 11); "Bigger group" gets its sentence in the question itself, "An API is
one example of a bigger group of things. What group does it belong to?". Done well on the map.
Check: is every word of ours explained on the screen where the learner first meets it?

**The cost of help is said before the help, in numbers.**
Why: clearly state the results and disadvantages of actions before they are taken ([W3C COGA](https://www.w3.org/TR/coga-usable/));
error prevention means a confirmation people will not tune out ([Error prevention](https://www.nngroup.com/articles/error-prevention/)).
In Lumente: the Help sheet says "This hint limits this area to 1 point instead of 2." before sending; the
guided levels show "help −1" under the firefly and "hint 1 of 3 · −1 pt" on the card. The minus sign reads as
"dash 1" on a phone and aloud (`copy-pass.md`, rows 20 and 31); the decided label is "Get a hint · −1 point"
(2026-10-23, "At level 5 the firefly is a guide, not Help") and the rule argues for "costs 1 point".
Check: can the learner say what a hint costs before tapping it, in words a screen reader reads right?

**Solve for one, extend to many.**
Why: designing for a permanent disability produces results that help everyone, and a situational one (a noisy
room, one hand) meets the same design ([Microsoft Inclusive Design](https://inclusive.microsoft.design/)).
In Lumente: Atkinson Hyperlegible was made for low vision and reads better for everyone; the mic on the input
helps a learner who thinks faster than they type and one who cannot type. Done well.
Check: who is excluded from this screen, and what one change for them helps the rest?

**Novices get the signed-in path in one step.**
Why: a login that does not rely on memory, in a single step ([W3C COGA](https://www.w3.org/TR/coga-usable/)).
In Lumente: the web sign-in offers Google in one tap and an email code with no password
(2026-10-22, "Sign-in by email code and Google"); the Stitch sign-in's footer links ("Privacy Policy",
"Terms", "Server Status") do not exist and go. Done well on the method; the headline stays as written.
Check: can someone sign in without remembering anything?

## 6. Review checklist

Run it on one screen at a time. Every "no" is a finding for `lumente-ux-audit.md`.

### Understood without being told

1. Can a first-time user name every tappable thing without tapping it?
2. Is it clear which area the input writes into?
3. Between an action and its result, does the screen say what it is doing?
4. Is the main button disabled in every state where it would do nothing?
5. Is there exactly one filled button, and is it the task?
6. Can the user say where they are and what comes next?

### The classic rules

7. Is every word on the screen one a CS student would say?
8. Do things that belong together sit together, and apart from the rest?
9. Does every dashed, outlined or dotted shape mean "not yet", and nothing else?
10. Is the main action the biggest target?
11. Could any list be shorter without hiding a real option?
12. What on the screen is neither the concept nor the next action?
13. Are the first and last things on the screen the two the user should keep?

### Beautiful

14. Does the screen use at most three text sizes, all from the scale?
15. Are the gaps from one small set of values?
16. In grayscale, is the order of importance unchanged?
17. Does every color mean what the table says, and only that?
18. Is every animation under 500 ms, or the one 700 ms moment, and tied to an action?
19. Does every tappable thing look tappable?
20. Does the screen have an empty, a loading and an error state?

### Accessible

21. Does every text pair reach 4.5:1 at the darkest and lightest stage it can sit on, and every outline 3:1?
22. Is the smallest target 24 px with space around it, and 44 on iOS?
23. Does the keyboard reach everything, with focus always visible?
24. At 320 px and 200 percent zoom, does everything still fit?
25. With the colors covered, can every state still be told apart?
26. With Reduce Motion on, does every state change still show?
27. Does every field have a label outside it, and every icon a name?

### For slow learners

28. Is every sentence under 25 words, with the verb first on buttons?
29. How many decisions does the screen ask for?
30. Does every icon have a word next to it?
31. Can a novice see a finished example in one tap?
32. After a miss, does the screen show a way forward before a cost?
33. Does the learner learn one specific thing after each answer?
34. Can the user change their mind at every step but the last, and is the last confirmed?
35. Is the cost of help said in words before the help?

## 7. Sources

Every page was opened on October 24, 2026 and read far enough to confirm the claim it supports.

Section 1

- Norman, D. *The Design of Everyday Things, revised and expanded edition* (2013). [jnd.org](https://jnd.org/the-design-of-everyday-things-revised-and-expanded-edition/)
- Norman, D. Signifiers, not affordances (2008). [jnd.org](https://jnd.org/signifiers-not-affordances/)
- Krug, S. *Don't Make Me Think, Revisited* (2014). [Pearson, contents](https://www.pearson.com/en-ca/subject-catalog/p/don-t-make-me-think-revisited-a-common-sense-approach-to-web-usability/P200000000385/9780133597264); [sensible.com](https://sensible.com/dont-make-me-think/)
- Nielsen Norman Group. [Recognition and recall](https://www.nngroup.com/articles/recognition-and-recall/); [Visibility of system status](https://www.nngroup.com/articles/visibility-system-status/); [The power of defaults](https://www.nngroup.com/articles/the-power-of-defaults/); [Mental models](https://www.nngroup.com/articles/mental-models/); [Response times: the 3 important limits](https://www.nngroup.com/articles/response-times-3-important-limits/); [Wizards](https://www.nngroup.com/articles/wizards/)
- GOV.UK Design System. [Button](https://design-system.service.gov.uk/components/button/)
- Wroblewski, L. [Primary and secondary actions in web forms](https://www.lukew.com/ff/entry.asp?571)

Section 2

- Nielsen Norman Group. [10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/); [Match between system and real world](https://www.nngroup.com/articles/match-system-real-world/); [Gestalt proximity](https://www.nngroup.com/articles/gestalt-proximity/); [Gestalt similarity](https://www.nngroup.com/articles/gestalt-similarity/); [Common region](https://www.nngroup.com/articles/common-region/); [Principle of closure](https://www.nngroup.com/articles/principle-closure/); [Fitts's law](https://www.nngroup.com/articles/fitts-law/); [Chunking](https://www.nngroup.com/articles/chunking/); [Minimize cognitive load](https://www.nngroup.com/articles/minimize-cognitive-load/); [Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- Wagemans, J. et al. A century of Gestalt psychology in visual perception I (2012), *Psychological Bulletin* 138(6). [PubMed Central](https://pmc.ncbi.nlm.nih.gov/articles/PMC3482144/)
- Laws of UX. [Fitts's law](https://lawsofux.com/fittss-law/); [Hick's law](https://lawsofux.com/hicks-law/); [Serial position effect](https://lawsofux.com/serial-position-effect/)
- Miller, G. A. The magical number seven, plus or minus two (1956), *Psychological Review*. [Classics in the History of Psychology](http://psychclassics.yorku.ca/Miller/)
- Sweller, J. Element interactivity and intrinsic, extraneous, and germane cognitive load (2010), *Educational Psychology Review* 22. [Springer](https://link.springer.com/article/10.1007/s10648-010-9128-5)
- Debue, N. and van de Leemput, C. What does germane load mean? (2014), *Frontiers in Psychology*. [Frontiers](https://www.frontiersin.org/articles/10.3389/fpsyg.2014.01099/full)

Section 3

- Wathan, A. and Schoger, S. *Refactoring UI*. [refactoringui.com](https://www.refactoringui.com/)
- Material Design 3. [Type scale tokens](https://m3.material.io/styles/typography/type-scale-tokens); [Spacing](https://m3.material.io/foundations/layout/understanding-layout/spacing); [Elevation](https://m3.material.io/styles/elevation/overview); [Color roles](https://m3.material.io/styles/color/roles); [Easing and duration tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs); [Motion overview](https://m3.material.io/styles/motion/overview)
- Apple Human Interface Guidelines. [Typography](https://developer.apple.com/design/human-interface-guidelines/typography); [Color](https://developer.apple.com/design/human-interface-guidelines/color); [Layout](https://developer.apple.com/design/human-interface-guidelines/layout); [Motion](https://developer.apple.com/design/human-interface-guidelines/motion); [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- Nielsen Norman Group. [Visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/); [Aesthetic and minimalist design](https://www.nngroup.com/articles/aesthetic-minimalist-design/); [Photos as web content](https://www.nngroup.com/articles/photos-as-web-content/); [Animation duration](https://www.nngroup.com/articles/animation-duration/); [Microinteractions](https://www.nngroup.com/articles/microinteractions/); [Flat design](https://www.nngroup.com/articles/flat-design/)

Section 4

- W3C. [WCAG 2.2](https://www.w3.org/TR/WCAG22/), and the Understanding pages: [Contrast (minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); [Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html); [Target size (minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html); [Focus not obscured (minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html); [Focus appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html); [Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html); [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html); [Resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html); [Use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html); [Sensory characteristics](https://www.w3.org/WAI/WCAG22/Understanding/sensory-characteristics.html); [Animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html); [Labels or instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html); [Error identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html); [Consistent navigation](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html); [Timing adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)
- MDN. [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- React Native. [AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo)
- Nielsen Norman Group. [Placeholders in form fields are harmful](https://www.nngroup.com/articles/form-design-placeholders/); [Error message guidelines](https://www.nngroup.com/articles/error-message-guidelines/); [Consistency and standards](https://www.nngroup.com/articles/consistency-and-standards/)

Section 5

- W3C. [Making content usable for people with cognitive and learning disabilities](https://www.w3.org/TR/coga-usable/) (Working Group Note, 2021)
- CAST. [Universal Design for Learning Guidelines 3.0](https://udlguidelines.cast.org/); [2.1 Clarify vocabulary, symbols, and language structures](https://udlguidelines.cast.org/representation/language-symbols/vocabulary-symbols/); [5.3 Build fluencies with graduated support](https://udlguidelines.cast.org/action-expression/expression-communication/fluencies-practice-performance/); [8.5 Offer action-oriented feedback](https://udlguidelines.cast.org/engagement/effort-persistence/feedback/)
- GOV.UK. [Design System](https://design-system.service.gov.uk/); [Question pages](https://design-system.service.gov.uk/patterns/question-pages/); [Use clear language](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/)
- Nielsen Norman Group. [Writing for lower-literacy users](https://www.nngroup.com/articles/writing-for-lower-literacy-users/); [How users read on the web](https://www.nngroup.com/articles/how-users-read-on-the-web/); [Icon usability](https://www.nngroup.com/articles/icon-usability/); [User control and freedom](https://www.nngroup.com/articles/user-control-and-freedom/); [Slips](https://www.nngroup.com/articles/slips/); [Error prevention](https://www.nngroup.com/articles/error-prevention/); [Progress indicators](https://www.nngroup.com/articles/progress-indicators/)
- Microsoft. [Inclusive Design](https://inclusive.microsoft.design/)
- Hattie, J. and Timperley, H. The power of feedback (2007), *Review of Educational Research* 77(1), DOI 10.3102/003465430298487. [PDF at UC Riverside](https://assess.ucr.edu/media/746/download)
- Clare, L. and Jones, R. S. P. Errorless learning in the rehabilitation of memory impairment: a critical review (2008), *Neuropsychology Review* 18(1). [Springer](https://link.springer.com/article/10.1007/s11065-008-9051-4)

### Not verified

Pages that would not load on October 24, 2026, so nothing above rests on them:

- `https://journals.sagepub.com/doi/10.3102/003465430298487` (Hattie and Timperley at Sage: 403; the UC Riverside PDF above was read instead)
- `https://journals.sagepub.com/doi/10.3102/00346543070002181` (Atkinson et al., Learning from examples, 2000: 403; the worked-example claim rests on Sweller 2010 instead)
- `https://link.springer.com/article/10.1007/s10648-019-09465-5` (Sweller, van Merriënboer and Paas, 2019: redirected to a login page)
- `https://www.oreilly.com/library/view/dont-make-me/9780133597271/` (403; the Pearson contents page was read instead)
- `https://www.nngroup.com/articles/whitespace/` and `https://www.nngroup.com/articles/reading-level/` (404; no NN/g page on either topic was found)
- `https://www.gov.uk/guidance/content-design/writing-for-gov-uk` (redirects to a stub; the "Use clear language" page above replaces it)
- `https://www.plainlanguage.gov/guidelines/` (redirects to digital.gov, whose guide has no numbers; not cited)
- `https://www.uky.edu/~gmswan3/575/Hattie_Timperly_2007.pdf` (invalid certificate)

Two claims rest on the app's own documents rather than an outside page: the 4 and 8 pt spacing step (round 6
`design-principles.md`; Material's spacing page no longer states a number) and the 700 ms lit moment
(`docs/design/09-lumente/README.md`). Krug's phrase "self-evident" is in the book, not on either page cited, so
the rule above uses the book's title instead.
