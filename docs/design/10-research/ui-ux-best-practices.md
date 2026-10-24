# UI/UX best practices for the website and the app

What the research on usable, readable and good-looking screens says, checked against Lumente's own screens: the
sign-in page, Start, the guess, the map, the hint card and the result. Each rule has its source, the Lumente
example and a yes-or-no check, so a teammate can review any screen with section 6.

**This is research for after the Oct 24 freeze.** Nothing here changes `app/`, `api/` or `agents/`; it is the
reading list and the checklist for the next design round.

How to read it: every rule is one sentence, then why in one or two sentences with the source, then how it looks
in Lumente, then the check question. The screens named are the ones in [`docs/readme/`](../../readme/) (the
guess, the map, the hint, the score, the website result) and the current design in
[`09-lumente/README.md`](../09-lumente/README.md). "The firefly" is the tutor; "a part" is one of the four areas of
the map (bigger group, what it isn't, what it needs, its types); "the light" is the warm corner glow that grows one
stage per point proved. Where a source could not be opened from the build machine, section 7 says how it was
checked instead.

## 1. The user knows what to do without being told

The idea behind this section is Don Norman's: a good design tells you what it can do (affordances), shows you
where to act (signifiers), makes the control match the effect (mapping), answers every action (feedback), stops
the wrong moves (constraints) and lets you build a correct picture of how it works (a conceptual model). Steve
Krug's version for screens is shorter: don't make me think. A first-time user should get each screen at a glance.

**Every control shows what it does before it is touched.** Norman calls the physical possibility an affordance and
the visible cue a signifier; a screen needs the signifier, because a flat rectangle affords nothing on its own
(*The Design of Everyday Things*, revised edition, 2013, chapter 1; the 2008 essay [Signifiers, not
affordances](https://jnd.org/signifiers-not-affordances/)). In Lumente the unasked parts of the map are dashed
boxes with a "?", the asked part has an amber outline and a dashed line from the firefly, and the input says "In
your own words". Check: can a new user name every tappable thing on the screen without tapping it?

**The screen explains itself, with no instructions to read first.** Krug's first law is that a page should be
self-evident, and where it can't be, self-explanatory, because people scan, satisfice and muddle through rather
than read (*Don't Make Me Think, Revisited*, 3rd edition, New Riders, 2014, chapters 1 and 2). The guess screen
works this way: a heading that is the question ("How much can you explain on your own?"), nine number buttons,
and the anchors "0 · I can't explain it yet" and "8 · I can explain all four". The two paragraphs above the
numbers are the part a muddler skips. Check: if all body text were removed, would the heading, the controls and
their labels still carry the task?

**Controls sit where their effect happens.** Norman's natural mapping says the layout of the controls should
match the layout of what they control, so the relationship needs no label (DOET, chapter 1). The dashed line
from the firefly to the part being asked is a mapping: the question and the place it lights are tied by a line,
not by a sentence. Check: is each question, hint and answer visibly tied to the part it belongs to?

**Every action gets an answer within a tenth of a second, and a slow answer says it is slow.** Norman lists
feedback as a fundamental principle, and the first Nielsen heuristic, visibility of system status, asks the design
to keep people informed through appropriate feedback within a reasonable time ([NN/g, Visibility of system
status](https://www.nngroup.com/articles/visibility-system-status/)). In Lumente the firefly answers a touch in
150 ms, a part that lights gets a 700 ms ring, and while an answer is judged (2 to 8 s) the firefly shows
"checking" with `role="status"` and the input is disabled. Check: after every tap, does something change on the
screen at once, and does a wait longer than two seconds say so in words?

**The design blocks the wrong move instead of warning about it.** Norman's constraints (physical, cultural,
semantic, logical) prevent errors before they happen (DOET, chapter 4). The guess screen has no default number and
keeps "Save my prediction" disabled until one is chosen; Start shows "Pick a concept" in place of the start button
until a concept is picked. Check: is each button that cannot work yet disabled, and does its label say why?

**The screen lets the user build one simple, correct model of how the app works.** Norman's conceptual model is
the user's story of how the thing works, and a design communicates it through its image, not through a manual
(DOET, chapter 1; [NN/g, Mental models](https://www.nngroup.com/articles/mental-models/)). Lumente's model is one
sentence, "questions are the light": the screen is dark, each proved part lights, the help is borrowed light. The
risk is a second model fighting the first; "↑ less help next time" on a lit part introduces levels without ever
naming them. Check: can a tester say in one sentence what the light, the points and the firefly mean after one
session?

**Users recognize options; they never have to recall them.** Recognition is easier than recall because the cue
is on the screen, so interfaces should show choices and recent context rather than ask the user to remember
([NN/g, Memory recognition and recall in user interfaces](https://www.nngroup.com/articles/recognition-and-recall/),
Budiu, 2014). The result restates the rubric ("Each area can earn: 2 pts, 1 pt, 0 pts") so the score can be read
without remembering the guess screen; the hint card says "hint 1 of 3 · −1 pt" so the cost need not be recalled.
Check: does every number on the screen come with the scale it belongs to?

**The default is the choice most people would make, and a choice that must be the user's own has no default.**
Defaults carry authority and most users keep them, which is why NN/g's cognitive-load advice includes setting a
smart default to save a decision ([NN/g, Minimize cognitive load](https://www.nngroup.com/articles/minimize-cognitive-load/),
Whitenton, 2013). Lumente does both on purpose: Start preselects the concept "API" so a tester can begin in one
tap, and the guess has no default because the prediction has to be the learner's own. Check: is every default
either the best guess for most users, or absent because the answer must be the user's?

**Each screen has one primary action, drawn as the only filled button.** Apple's Simplicity principle asks that
every element earns its place and that hierarchy makes the next step apparent
([Apple, Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles)).
Lumente's screens do this: "Save my prediction", the send arrow, "Try API again" are the one filled control, and
"Map another concept" and "Share" stay as text. Check: is there exactly one filled button on the screen, and is it
the thing most people should do next?

**The way out is always visible and never loses work.** Apple's Agency principle: keep people informed, let them
recover from mistakes, make a guided flow easy to escape (same page). The session keeps a Close button in the top
corner on every screen, and closing saves the answers, so it needs no confirmation. Check: can the user leave this
screen in one tap without losing what they typed?

## 2. The classic rules, with their sources

**The screen passes Nielsen's ten heuristics.** The list is the standard checklist for interaction design: visibility
of system status, match between system and the real world, user control and freedom, consistency and standards,
error prevention, recognition rather than recall, flexibility and efficiency of use, aesthetic and minimalist design,
help users recognize, diagnose and recover from errors, and help and documentation
([NN/g, 10 usability heuristics for user interface design](https://www.nngroup.com/articles/ten-usability-heuristics/),
Nielsen, 1994, revised since). The map screen matches the real world (a map with four parts, a tutor that asks),
keeps the way out visible (Close), prevents the error of a blank guess, and keeps the help one tap away with its
price written on it. Check: run the ten names down the screen; does any one of them fail?

**Things that belong together sit close together.** The Gestalt proximity principle: elements near each other are
seen as a group, and proximity beats similarity of color or shape when the two conflict
([NN/g, The principle of proximity](https://www.nngroup.com/articles/gestalt-proximity/)). Lumente groups each
part's label, icon, points and text inside one card, and puts "Your answer · What it needs" directly above the
input it names. Check: is every label closer to its own control than to any other?

**Things that look alike are read as the same kind of thing.** The similarity principle: shared color, shape or
size says "same role" (Wertheimer, [Laws of organization in perceptual forms](https://psychclassics.yorku.ca/Wertheimer/Forms/forms),
1923, in the 1938 Ellis translation; [NN/g, Similarity principle](https://www.nngroup.com/articles/gestalt-similarity/)).
On the phone result, "Map another concept" and "Share" are both secondary actions, but one is plain and the other
underlined, so they read as two kinds of thing. Check: do controls with the same role share one look?

**A border or a background makes a group.** The common region principle: items inside the same boundary are
perceived as a group that shares a function ([NN/g, The principle of common region](https://www.nngroup.com/articles/common-region/)).
The hint card's pale amber box holds the label, the three cost squares and the hint; the lit parts are light cards
on the dark screen. Check: does every box on the screen contain only things that belong together?

**The eye follows a line, so lines connect what they touch.** The continuity principle: elements arranged on a
line or curve are seen as related, and the eye follows the path (Wertheimer, 1923; reviewed in Wagemans et al.,
[A century of Gestalt psychology in visual perception](https://pubmed.ncbi.nlm.nih.gov/22845751/), 2012). The 1 px
lines from the concept to its four parts, and the dashed line from the firefly to the asked part, are continuity
doing the work of a sentence. Check: does every line on the screen connect two things that are really related?

**People complete a shape they can see most of.** The closure principle: the mind fills in missing parts to see a
whole ([NN/g, Visual design cheat sheet](https://www.nngroup.com/articles/visual-design-cheat-sheet/)). The dashed
outline of an unasked part reads as a complete card that is not yet filled, which is exactly its state. Check:
does an incomplete or empty state still read as the whole thing, waiting?

**The most important thing is the figure; everything else is ground.** Figure-ground: the eye separates one object
from its background, and contrast decides which is which (Wertheimer, 1923; Wagemans et al., 2012). Lumente's
near-black screen is ground and the lit cards are figure; the faint 24 px grid stays ground because it is far below
3:1. Check: is there one obvious figure on the screen, and does nothing in the background compete with it?

**Big, close targets are fast; small, far ones are slow.** Fitts's law: the time to reach a target grows with the
distance to it and shrinks with its width (Fitts, [The information capacity of the human motor system](https://pubmed.ncbi.nlm.nih.gov/13174710/),
1954; [NN/g, Fitts's law and its applications in UX](https://www.nngroup.com/articles/fitts-law/)). The primary
button is full-width at the bottom of the phone screen, where the thumb rests; the firefly, the Help target, is a
small mark above the question with "help −1" under it. Check: is the most frequent action the biggest target, and
is any target smaller than 44 pt?

**Fewer choices mean faster decisions.** Hick's law: decision time grows with the log of the number of equally
likely options (Hick, [On the rate of gain of information](https://journals.sagepub.com/doi/10.1080/17470215208416600),
*Quarterly Journal of Experimental Psychology*, 1952; [NN/g, Hick's law: designing long menu lists](https://www.nngroup.com/videos/hicks-law-long-menus/)).
The guess offers nine numbers, which is a scale, not a menu; Start offers two ways to begin and a short list of
concepts. Check: does any screen ask the user to choose among more than five things of the same kind?

**Content comes in chunks a working memory can hold.** Miller found the span of immediate memory to be about seven
items, and that grouping items into chunks raises what can be held
([The magical number seven, plus or minus two](https://doi.org/10.1037/h0043158), *Psychological Review*, 1956);
NN/g turns this into short paragraphs, white space, short lines and visual hierarchy ([NN/g, How chunking helps
content processing](https://www.nngroup.com/articles/chunking/), Moran, 2016). The map is four chunks around one
concept, and the score is two rows of eight squares; the guess screen's three paragraphs are the least chunked
text in the app. Check: is any block of text longer than three lines without a break?

**Extra effort that is not learning is cut; the effort that is learning stays.** Sweller's cognitive load theory:
working memory is small, and load is intrinsic (the material), extraneous (the presentation) or germane (building
the schema), so design cuts the extraneous kind (Sweller, [Cognitive load during problem solving](https://doi.org/10.1207/s15516709cog1202_4),
1988; Sweller, van Merriënboer and Paas, [Cognitive architecture and instructional design](https://doi.org/10.1023/A:1022193728205),
1998; [NN/g, Minimize cognitive load](https://www.nngroup.com/articles/minimize-cognitive-load/)). In Lumente the
hard part is meant to be the question; the screen around it is dark and almost empty, and the nudge and the
previous part's feedback sit dim above the question so they can be skipped. Check: is everything on the screen
either the task or a cue for the task?

**Show the few things first and the rest on request.** Progressive disclosure defers advanced or rarely used
options to a second step, so the first screen stays simple and errors drop
([NN/g, Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/), Nielsen, 2006). Lumente
hides the notes field behind "Add your notes" on Start, keeps the fact chat collapsed in the self-test, and reveals
each hint only when the learner taps Help and confirms its cost. Check: does the first view of the screen show only
what most users need, with the rest one tap away?

**The first and the last items are remembered; the middle is forgotten.** The serial-position effect: in free
recall, early items (primacy) and late items (recency) are recalled better than the middle (Murdock,
[The serial position effect of free recall](https://doi.org/10.1037/h0045106), *Journal of Experimental Psychology*,
1962). The result opens with the gap sentence and closes with "Try API again"; the rubric and the coach's "for next
time" sit in the middle, where they are least remembered. Check: are the one thing to remember and the one thing
to do next the first and the last things on the screen?

## 3. What makes a screen beautiful

Beauty on a screen is mostly order: a type scale, a spacing unit, one hierarchy, colors with jobs, and motion with
a reason. The sources here are Material 3, Apple's Human Interface Guidelines, and *Refactoring UI* (Adam Wathan
and Steve Schoger, 2018), which turns the same ideas into tactics a developer can apply.

**Type comes from a scale, and the scale has few steps.** Material 3 defines five roles (display, headline, title,
body, label) in three sizes each, for example body large at 16 sp on a 24 sp line and body medium at 14 on 20
([Material 3, Type scale tokens](https://m3.material.io/styles/typography/type-scale-tokens)); Apple's default body
is 17 pt and its minimum 11 pt on iOS, and it asks designers to minimize the number of typefaces
([Apple, Typography](https://developer.apple.com/design/human-interface-guidelines/typography)). Lumente uses three
faces with three jobs (Newsreader for the voice, Atkinson Hyperlegible Next for the interface, the mono for code and
numbers), and the round 6 notes set three sizes per screen. Check: does the screen use at most three type sizes and three faces, each with
one job?

**Line height and line length make text restful.** Reading text wants a line height around 1.5 and lines under
about 80 characters ([WCAG 2.2, 1.4.8 Visual presentation](https://www.w3.org/TR/WCAG22/#visual-presentation), an
AAA criterion). The body style is 18 px on a 26 px line (1.44) and the phone keeps the question's lines short; the website
result keeps its text column narrow next to the map. Check: are lines of running text between 45 and 80 characters,
with line height near 1.5?

**Spacing comes from one unit, 4 or 8.** Material lays components on an 8 dp grid and type and icons on a 4 dp grid
([Material, Spacing methods](https://material.io/design/layout/spacing-methods.html)); Apple asks for consistent
spacing and for negative space, container shapes or separators to show which elements are related
([Apple, Layout](https://developer.apple.com/design/human-interface-guidelines/layout)). Lumente's spacing tokens are
4, 8, 12, 16, 20, 24 and 32, its corners 8, 10, 12 and 2 px, and the background grid 24 px with a stronger line every 96. Check: is
every margin, gap and radius a multiple of 4?

**Hierarchy comes from size, weight and contrast before color.** Apple's rule is to adjust weight, size and color to
show importance and to avoid light weights; *Refactoring UI* adds that a secondary line should be smaller or dimmer
rather than a different hue, so color keeps its meaning. The result does this with one large Newsreader sentence,
mono labels in a dim grey, and numbers in the body size; the amber is spent only on the prediction squares. Check:
if the screen were greyscale, would the order of importance still be clear?

**Each color has one meaning, and that meaning holds on every screen.** Apple's color guidance: avoid using the
same color to mean different things, and use color consistently when it carries status or interactivity
([Apple, Color](https://developer.apple.com/design/human-interface-guidelines/color)); Material gives every color a
role (primary, secondary, tertiary, error, surface) rather than a place
(Material 3's color roles, in Google's [token file](https://github.com/material-components/material-web/blob/main/tokens/_md-sys-color.scss)). Lumente has four: dark for what is not yet
explained, amber for questions and help, warm light for what the learner understands, coral for the gap and nothing
else; there is no red and no green. Check: can you write the meaning of every color on the screen in one word, with
no color used for two?

**Depth is rare, small and consistent.** Material 3 keeps six elevation levels, 0 to 12 dp, and shows them with
shadow and tonal color (Material 3's elevation levels, in Google's [token file](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-elevation.scss)); *Refactoring UI*
uses shadow to say "this is closer", so it belongs to the few things that float. Lumente keeps glows tight and gives
the lit cards a soft edge, while the hint card, the one thing that comes closer, gets the only big glow. Check: do at
most two things on the screen appear to float, and for a reason?

**White space is a tool, not a leftover.** Chunking and hierarchy both depend on space around groups (NN/g, chunking,
above); *Refactoring UI* starts with too much space and removes it. The map screen keeps the lower third empty
until the keyboard rises; the website result leaves the right half to the map. Check: is there more space between
groups than inside them?

**Everything aligns to a few lines.** Grids are columns, gutters and margins, and aligned elements read as related
([NN/g, Using grids in interface designs](https://www.nngroup.com/articles/using-grids-in-interface-designs/),
Gordon); Apple says people assume aligned items are related and indented items subordinate (Layout, above). The
result's prediction and map-score rows share one left edge for the labels, one for the squares, one for the totals.
Check: can you draw the screen's alignment lines, and does every element touch one?

**Pictures carry information or they go.** Eyetracking shows people study photos that carry content and skip
decorative ones ([NN/g, Photos as web content](https://www.nngroup.com/articles/photos-as-web-content/), Nielsen,
2010). Lumente's only drawings are the firefly and the four part icons, each with a meaning; the editor block on
Start shows the learner's own concept in code. Check: does every image on the screen tell the user something they
need?

**Motion is short, eased and has a job.** Material 3's duration tokens run from 50 ms to 1,000 ms (short 50 to 200,
medium 250 to 400, long 450 to 600, extra long 700 to 1,000) with a standard easing of
`cubic-bezier(0.2, 0, 0, 1)` ([Material 3, Applying easing and duration](https://m3.material.io/styles/motion/easing-and-duration/applying-easing-and-duration), values from Google's [token file](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-motion.scss));
NN/g puts most UI animation between 100 and 500 ms and simple feedback near 100 ms
([NN/g, Executing UX animations](https://www.nngroup.com/articles/animation-duration/)); Apple asks for motion that
is purposeful, brief, precise and never the only channel, and avoids motion on frequent interactions
([Apple, Motion](https://developer.apple.com/design/human-interface-guidelines/motion)). Lumente's firefly answers a
touch in 150 ms, the "bulb clicking on" lasts 700 ms and happens once per part, and nothing pulses or blinks.
Check: is every animation under 500 ms, except at most one celebration per screen, and does each one say
something?

**Small interactions confirm the user's action.** Feedback should match its weight: status near the thing it
describes, confirmation only for actions that matter, and more than one channel (color, text, sound, haptics)
([Apple, Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback)). The halo that spreads
under a finger on the firefly, the number button that fills when picked, the three squares on the hint card that
fill as hints are spent: each is a micro-interaction with a message. Check: does every control change under the
finger, and does the change mean something?

**Practical axioms from *Refactoring UI*.** Start with the feature, not the shell; design in greyscale first; use a
spacing and a type scale with few steps; use weight and color for hierarchy, not size alone; de-emphasize to
emphasize (dim the secondary instead of enlarging the primary); label less (show the value, not "Points: 5"); use
fewer borders (space, background, shadow instead); and pick colors with their shades planned
(*Refactoring UI*, 2018). Lumente already shows values without labels ("7 of 8") and
dims the secondary. Check: could a border on this screen be replaced by space or a background?

**What Lumente already does well, and what it does not.** From the five screenshots and the round 9 README:

- Done well: one meaning per color, no red or green; the gap shown as a number and a sentence, never by color
  alone; one filled button per screen; the cost of Help written on the control; three typefaces with three jobs; a
  4 and 8 px spacing system with 8, 12 and 2 px corners; 90 text pairs checked at 4.5:1 across the nine light
  stages; feedback at 150 ms and one 700 ms moment; a steady firefly; reduced motion respected.
- Not yet: the two secondary actions on the phone result look different ("Share" underlined, "Map another
  concept" plain); "↑ less help next time" is a hint about levels the app never names; the guess screen carries
  three paragraphs before the choice; the firefly's Help target is small next to a 44 pt rule; the small mono
  labels ("prediction", "map score", "nudge · free") are the lowest-weight text in the app and sit near the
  minimum size; the lit part on a phone truncates the learner's words ("a defined se…") with no way to read the
  rest on the result.

## 4. Accessibility that also helps everyone

The baseline is WCAG 2.2 level AA ([W3C Recommendation, October 2023, updated December 2024](https://www.w3.org/TR/WCAG22/)).
Each rule below names the criterion, so a reviewer can read the full text.

**Text has 4.5:1 contrast, large text and controls 3:1.** [1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
asks 4.5:1 for text and 3:1 for large-scale text (18 pt, or 14 pt bold); [1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
asks 3:1 for the parts of a control or graphic needed to identify it. Lumente's contrast table samples the real
gradient at eight places and nine stages, and its lowest pair is 4.83:1; the amber outline of the asked part and
the outline points still need the 3:1 check at every stage. Check: does every text pair pass 4.5:1 and every
control edge, focus ring and icon pass 3:1 on its real background?

**Every pointer target is at least 24 by 24 CSS pixels, and in practice 44.** [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
(new in 2.2, AA) sets 24 by 24 CSS px, with exceptions for spaced, inline and equivalent targets; Apple's default
control is 44 by 44 pt and its minimum 28 ([Apple, Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility));
Material's default touch target is 48 by 48 dp with 8 dp between targets ([Material, Applying density](https://material.io/design/layout/applying-density.html)).
The number buttons, the mic, the send arrow and Close are all large; the firefly as a Help target and the small
part cards on a 320 px screen need measuring. Check: does every target measure at least 44 by 44, including the
firefly and the part cards?

**Keyboard focus is visible, never hidden, and large enough to see.** [2.4.7 Focus Visible](https://www.w3.org/TR/WCAG22/#focus-visible)
(AA) requires a visible indicator; [2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum)
(new, AA) says the focused control is not entirely hidden by sticky bars or sheets; [2.4.13 Focus Appearance](https://www.w3.org/TR/WCAG22/#focus-appearance)
(new, AAA) sets the target: an indicator at least as large as a 2 px perimeter, at 3:1 against the unfocused
state. On the website the focus ring on a dark screen should be the warm light or amber, not the browser's blue,
and the pinned input must not cover a focused chat reply. Check: tab through the screen; is focus visible on every
stop, and never under a pinned bar?

**Every function works from the keyboard.** [2.1.1 Keyboard](https://www.w3.org/TR/WCAG22/#keyboard) (A): all
functionality is operable through a keyboard interface. The guess takes digits and arrows; the map, the hints and
the chat need the same path on the web. Check: can a session be completed with the keyboard alone, including Help,
the hint confirmation and Close?

**The layout reflows to 320 px with no sideways scroll.** [1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
(AA): no loss of content or function, and no two-dimensional scrolling, at 320 CSS px wide, which is a 1280 px
window at 400% zoom. The team already checks 320 px and no horizontal overflow; the website's two-column result
must stack. Check: at 320 px and at 400% zoom, is everything reachable with vertical scroll only?

**Motion the user did not ask for can be turned off.** [2.3.3 Animation from Interactions](https://www.w3.org/TR/WCAG22/#animation-from-interactions)
(AAA) asks that motion triggered by interaction can be disabled; the `prefers-reduced-motion` media feature
reports the device setting ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion));
Apple asks apps to replace transitions with fades and reduce automatic and repetitive animation when Reduce Motion
is on (Accessibility, above). Lumente skips the sparks and the crossfade under reduced motion; the firefly's few-pixel
drift, added on Oct 23, must stop too. Check: with Reduce Motion on, does anything still move on its own?

**Color is never the only cue.** [1.4.1 Use of Color](https://www.w3.org/TR/WCAG22/#use-of-color) (A): color is
not the only visual means of conveying information or state; Apple: convey information with more than color alone.
The gap is coral and also a number and a sentence; a capped point is dotted, a missed one dashed, a proved one
filled. Check: with the screen in greyscale, is every state still readable?

**Every input has a visible label, and every control a name a screen reader can say.** [3.3.2 Labels or Instructions](https://www.w3.org/TR/WCAG22/#labels-or-instructions)
(A) and [4.1.2 Name, Role, Value](https://www.w3.org/TR/WCAG22/#name-role-value) (A); Apple: label interface
elements appropriately for VoiceOver. "Your answer · What it needs" labels the input; the mic and the send arrow
are icon-only and need accessible names; the firefly needs a name that says "Help, costs 1 point". Check: does each
icon-only control have an accessible name that says what it does and what it costs?

**Errors are named in text, with the fix, and the typed answer stays.** [3.3.1 Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)
(A) and [3.3.3 Error Suggestion](https://www.w3.org/TR/WCAG22/#error-suggestion) (AA); GOV.UK adds: keep the
failing answer on the screen, say what happened and how to fix it, in plain words, without "sorry", "please" or
"invalid" ([GOV.UK Design System, Error message](https://design-system.service.gov.uk/components/error-message/)).
A failed reply keeps the answer and offers Try Again, and a failed hint never costs a point; the error text is
neutral, not coral, so coral keeps its one meaning. Check: after a failure, is the user's text still there, and does
the message say what to do?

**Nothing asks for the same thing twice, and help is in the same place on every screen.** [3.3.7 Redundant Entry](https://www.w3.org/TR/WCAG22/#redundant-entry)
(new, A) and [3.2.6 Consistent Help](https://www.w3.org/TR/WCAG22/#consistent-help) (new, A), with [3.2.4 Consistent Identification](https://www.w3.org/TR/WCAG22/#consistent-identification)
(AA). A session that survives a reload keeps the draft, so nothing is retyped; the firefly is Help on every screen
and should sit in the same place relative to the question. Check: is Help in the same place, with the same look, on
every screen of the session?

**No time limit the user cannot extend.** [2.2.1 Timing Adjustable](https://www.w3.org/TR/WCAG22/#timing-adjustable)
(A): a time limit can be turned off, adjusted or extended. Lumente has none: the learner answers when ready and the
session is saved. Check: is there any countdown, auto-advance or timeout anywhere?

## 5. Designing for slow learners, novices and low digital literacy

"Slow learner" here means anyone who needs more time, fewer things at once and plainer words: a first-year student,
someone reading in a second language, someone with dyslexia, ADHD or a memory impairment, or someone who rarely
uses apps. The W3C's note on cognitive accessibility organizes the needs into eight objectives: help users
understand what things are and how to use them, help them find what they need, use clear content, help them avoid
mistakes and correct them, help them focus, don't rely on memory, provide help, and support personalization
([W3C, Making content usable for people with cognitive and learning disabilities](https://www.w3.org/TR/coga-usable/),
Group Note, 2021). CAST's Universal Design for Learning asks for multiple means of engagement, representation and
action and expression, in nine guidelines ([CAST, UDL Guidelines 3.0](https://udlguidelines.cast.org/), 2024).
Microsoft's rule for all of it: solve for one, extend to many ([Microsoft Inclusive Design](https://inclusive.microsoft.design/)).

**Write at a reading grade of 6 to 8, one idea per sentence, in common words.** Nielsen's low-literacy study
recommends a 6th-grade level for the pages everyone lands on and no more than 8th grade elsewhere, because
lower-literacy users read word by word, don't scan and see a narrower part of the page
([NN/g, Lower-literacy users](https://www.nngroup.com/articles/writing-for-lower-literacy-users/), 2005); GOV.UK
writes for a reading age of 9 and has set 25 words as a sentence's upper limit
([Writing for GOV.UK](https://www.gov.uk/guidance/content-design/writing-for-gov-uk); [Inside GOV.UK, Sentence
length](https://insidegovuk.blog.gov.uk/2014/08/04/sentence-length-why-25-words-is-our-limit/), 2014); WCAG's
[3.1.5 Reading Level](https://www.w3.org/TR/WCAG22/#reading-level) (AAA) asks for a lower-secondary version of any
harder text; COGA's pattern is Use Clear Words. "You felt 2 points surer than you could explain" and "That's normal:
explaining is how you find out" meet this; "Your prediction captured your confidence. Your map score reflects what
you could explain in this session" is two abstractions in a row and could be "Your guess was 7. Your answers earned
5." Check: run the screen's text through a readability score; is it at grade 8 or below, with no sentence over
25 words?

**Verbs come first, and the label says the action, not the noun.** GOV.UK's style guide and its question pages
pattern: front-load, use the active voice, make the question the heading, label buttons with the action
([GOV.UK, Question pages](https://design-system.service.gov.uk/patterns/question-pages/); [GOV.UK style guide](https://www.gov.uk/guidance/style-guide/a-to-z)).
Lumente's buttons already lead with the verb: "Save my prediction", "Try API again", "Map another concept",
"Explore with guidance". Check: does every button start with a verb a 12-year-old knows?

**No jargon, and every term the app invents is explained where it first appears.** COGA, Use Clear Words; NN/g's
plain-language advice holds for experts too. "Bigger group", "what it isn't", "what it needs", "its types" are
plain; "prediction gap", "nudge", "level 5" and "mastery" are app words and need their one-line meaning on first
sight. Check: list every word on the screen that a new user has not seen before; does each get a plain gloss the
first time?

**One thing per screen.** GOV.UK starts every service with one question per page, because it helps users understand
what they are being asked and focus on the answer (Question pages, above); COGA asks for short critical paths and
to avoid too much content. The guess screen asks one thing (a number), the map screen asks one thing (this part's
answer), the hint card adds one thing (a clue); the result asks nothing and shows three. Check: is there exactly one
question on the screen, and one input for it?

**Things stay where they were.** COGA: Use a Consistent Visual Design, and Ensure Controls and Content Do Not Move
Unexpectedly; Nielsen's consistency heuristic; Apple's Familiarity principle. Close is top-left on every session
screen, the concept pill is centered in the header, the input is pinned at the bottom, the primary button sits above
the secondary ones on the result; the firefly should keep its place too, and a new chat line should not shift the map.
Check: between this screen and the last, has any control changed place, size or label?

**Every state has three cues: an icon, a word and a color.** Redundant cues cover color-blindness, a glance, and a
screen reader at once; COGA: Use Icons that Help the User, and Use Clear Visible Labels; UDL: multiple means of
representation. A part has an icon, a name and a state color; a point is a filled, outlined, dotted or dashed square,
in amber, light or coral; the hint shows "hint 1 of 3 · −1 pt" and three squares. The light alone is a single cue,
which is why the "5 of 8" numbers sit beside it. Check: does every state show as an icon or shape, a word, and a
color, never just one?

**Show a worked example before asking for the first answer.** Learners who study worked examples before solving
learn more and faster than those who only solve (Sweller and Cooper, [The use of worked examples as a substitute
for problem solving](https://doi.org/10.1207/s1532690xci0201_3), *Cognition and Instruction*, 1985); UDL asks to
build knowledge and guide practice. Lumente's level 1 is a worked example: the map for "planet" fills in step by
step before the learner's first question; the guess screen's anchors ("0 · I can't explain it yet") are a small
worked example of the scale. Check: before the first thing the user must produce, have they seen one done?

**Prevent the error rather than mark it: errorless learning.** People with impaired memory learn better when kept
from guessing wrong, because an error can be learned as if it were right (Baddeley and Wilson, [When implicit
learning fails: amnesia and the problem of error elimination](https://www.mrc-cbu.cam.ac.uk/bibliography/articles/3003),
*Neuropsychologia*, 1994); the design version is Norman's constraint and Nielsen's error prevention. The guess
cannot be saved empty, the hint confirmation names its cost before anything is sent, and a wrong answer gets a free
nudge rather than a fail mark; the self-test warns that an empty area scores zero before the map is submitted.
Check: can the user make a mistake here that the screen could have stopped?

**Feedback is immediate, specific and about the work, not the person.** Feedback is among the strongest influences
on learning when it answers "where am I going, how am I going, where next", at the task level rather than the self
(Hattie and Timperley, [The power of feedback](https://doi.org/10.3102/003465430298487), *Review of Educational
Research*, 2007); COGA: Provide Feedback. The nudge names what was off ("you named something it works with") and
asks the next question; the coach's "for next time" names the part to work on; the result says "That's normal",
not "you failed". Check: does every piece of feedback say what was right, what was missing and what to do next, in
that order?

**Input is forgiving, and anything can be undone.** Nielsen's user control and freedom; COGA: Let Users Go Back;
Apple: help people recover from mistakes. Any defensible answer passes, not one expected string; a saved area in the
self-test can be reopened and edited; closing a session saves it; a hint confirmation can be cancelled at no cost.
What cannot be undone is a spent hint, which is why the confirmation exists. Check: can every action on this screen
be reversed, or is its cost stated before it is taken?

**The learner sets the pace.** No timer, no auto-advance, no content that moves on its own (COGA: Let Users Control
When the Content Moves or Changes; WCAG 2.2.1; UDL: options for sustaining effort). The firefly waits; the "checking"
state is the only wait and it is the app's, not the learner's; a session resumes after a reload or a killed app.
Check: does the screen ever move on without a tap from the user?

**Help is one tap away, costs are visible, and asking is not shameful.** COGA: Make It Easy to Find Help; Apple: show
when a command can't be carried out and why. The firefly is Help on every screen with "help −1" under it, "More
help" sits next to the input, and the first hint explains the one-point cap. Check: can the user find help from this
screen without leaving it, and do they know what it costs before they tap?

**Screen by screen, what each should do for a slow learner:**

- The sign-in page: one headline, one line on what the app does, one form. Say what signing in gives ("so your maps
  are saved") in plain words above the form; keep Clerk's fields labeled, not placeholder-only; one primary button.
- Start: the question as the heading, the concept chips as recognition not recall, the two ways to start each with
  its one-line meaning (already there). Keep "Add your notes" collapsed and named as optional (it is).
- The guess: the heading, the rubric as four short lines, the nine numbers, the anchors, the running "Your
  prediction: 7 of 8 points" line, the button. Cut the two paragraphs to one sentence each or move them behind
  "Why predict?".
- The map: the asked part outlined, the line to the firefly, one question in the big serif, the labeled input. Keep
  the last part's feedback dim and short; let a lit part be tapped to read the whole answer.
- The hint card: the label "hint 1 of 3 · −1 pt" and squares, the hint in two sentences, "More help" and the input
  below. The nudge's "this part can now light 1 point at most" could say "1 point max now".
- The result: the gap sentence, the two rows, the one-line meaning of each, the map, one next step. Give "less help
  next time" its plain meaning once ("you'll get fewer hints on this part"), and make the two secondary actions look
  the same.

## 6. Review checklist

Run these on any screen. Each is yes or no; a no is a finding, not a failure.

**The user knows what to do**

1. Can a new user name every tappable thing on the screen without tapping it?
2. With the body text removed, do the heading, the controls and their labels still carry the task?
3. Is there exactly one filled button, and is it what most people should do next?
4. Does every button that cannot work yet say why it is disabled?
5. After every tap, does something change at once, and does a wait over two seconds say so?
6. Is the way out visible in one tap, and does leaving keep what was typed?

**The classic rules**

7. Is every label closer to its own control than to any other?
8. Do controls with the same role share one look?
9. Does every box contain only things that belong together, and every line connect two related things?
10. Is the most frequent action the biggest target, and is no target under 44 pt?
11. Is any block of text longer than three lines without a break, or any list of same-kind choices longer than five?
12. Does the first view show only what most users need, with the rest one tap away?
13. Are the one thing to remember and the one thing to do next the first and last things on the screen?

**Beauty**

14. Does the screen use at most three type sizes and three faces, each with one job?
15. Is every margin, gap and radius a multiple of 4?
16. In greyscale, is the order of importance still clear?
17. Does every color on the screen mean one thing, the same thing it means elsewhere?
18. Is every animation under 500 ms except at most one moment, and does each one say something?

**Accessibility**

19. Does every text pair pass 4.5:1 and every control edge, icon and focus ring 3:1 on its real background?
20. Can the whole screen be used with a keyboard, with focus visible at every stop and never under a pinned bar?
21. At 320 px wide and at 400% zoom, is everything reachable with vertical scroll only?
22. With Reduce Motion on, does anything still move on its own?
23. Does every icon-only control have an accessible name that says what it does and what it costs?

**Slow learners**

24. Is the text at reading grade 8 or below, with no sentence over 25 words and every app word glossed on first sight?
25. Is there exactly one question on the screen, and have users seen one done before they must do one?
26. Does every state show as a shape, a word and a color, never just one?
27. Does every piece of feedback say what was right, what was missing and what to do next?
28. Can every action be reversed, or is its cost stated before it is taken, and does nothing move on without a tap?

## 7. Sources

How they were verified, on Oct 24, 2026. The build machine's network policy allows only a few of these hosts, so
each entry says how it was checked: "read" means the page or the publisher's source file was opened; "search" means
the page could not be opened and its title, author, date and the quoted claims were confirmed from search results
and copies of the text. Nothing here is cited from memory alone.

Books

- Norman, D. *The Design of Everyday Things*, revised and expanded edition. Basic Books, 2013.
  [jnd.org](https://jnd.org/the-design-of-everyday-things-revised-and-expanded/) (search: publisher and edition).
- Norman, D. [Signifiers, not affordances](https://jnd.org/signifiers-not-affordances/). *ACM Interactions* 15(6),
  2008 (search).
- Krug, S. *Don't Make Me Think, Revisited: A Common Sense Approach to Web and Mobile Usability*, 3rd edition. New
  Riders, 2014. [sensible.com](https://www.sensible.com/buythebook.html) (search: edition, publisher, year).
- Wathan, A. and Schoger, S. *Refactoring UI*, 2018 (search: authors and year; the book's site could not be opened,
  so it is not linked).

Nielsen Norman Group (nngroup.com could not be opened; every page below was confirmed by search)

- [10 usability heuristics for user interface design](https://www.nngroup.com/articles/ten-usability-heuristics/), Nielsen, 1994, revised.
- [Visibility of system status](https://www.nngroup.com/articles/visibility-system-status/).
- [Memory recognition and recall in user interfaces](https://www.nngroup.com/articles/recognition-and-recall/), Budiu, 2014.
- [Mental models](https://www.nngroup.com/articles/mental-models/), Nielsen, 2010, updated.
- [Minimize cognitive load to maximize usability](https://www.nngroup.com/articles/minimize-cognitive-load/), Whitenton, 2013.
- [Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/), Nielsen, 2006.
- [The principle of proximity](https://www.nngroup.com/articles/gestalt-proximity/); [Similarity principle](https://www.nngroup.com/articles/gestalt-similarity/);
  [The principle of common region](https://www.nngroup.com/articles/common-region/); [Visual design cheat sheet](https://www.nngroup.com/articles/visual-design-cheat-sheet/) (closure).
- [Fitts's law and its applications in UX](https://www.nngroup.com/articles/fitts-law/).
- [Hick's law: designing long menu lists](https://www.nngroup.com/videos/hicks-law-long-menus/), Sherwin (video).
- [How chunking helps content processing](https://www.nngroup.com/articles/chunking/), Moran, 2016.
- [Executing UX animations: duration and motion characteristics](https://www.nngroup.com/articles/animation-duration/).
- [Using grids in interface designs](https://www.nngroup.com/articles/using-grids-in-interface-designs/), Gordon.
- [Photos as web content](https://www.nngroup.com/articles/photos-as-web-content/), Nielsen, 2010.
- [Lower-literacy users: writing for a broad consumer audience](https://www.nngroup.com/articles/writing-for-lower-literacy-users/), Nielsen, 2005.

Papers (search: journal, volume, pages and DOI confirmed; the 1994 paper has no DOI in the records found)

- Fitts, P. M. (1954). The information capacity of the human motor system in controlling the amplitude of movement.
  *Journal of Experimental Psychology* 47(6), 381-391. [PubMed 13174710](https://pubmed.ncbi.nlm.nih.gov/13174710/).
- Hick, W. E. (1952). [On the rate of gain of information](https://journals.sagepub.com/doi/10.1080/17470215208416600).
  *Quarterly Journal of Experimental Psychology* 4(1), 11-26.
- Miller, G. A. (1956). [The magical number seven, plus or minus two](https://doi.org/10.1037/h0043158). *Psychological Review* 63, 81-97.
- Murdock, B. B. (1962). [The serial position effect of free recall](https://doi.org/10.1037/h0045106). *Journal of Experimental Psychology* 64(5), 482-488.
- Sweller, J. (1988). [Cognitive load during problem solving: effects on learning](https://doi.org/10.1207/s15516709cog1202_4). *Cognitive Science* 12(2), 257-285.
- Sweller, J., van Merriënboer, J. and Paas, F. (1998). [Cognitive architecture and instructional design](https://doi.org/10.1023/A:1022193728205). *Educational Psychology Review* 10(3), 251-296.
- Sweller, J. and Cooper, G. A. (1985). [The use of worked examples as a substitute for problem solving in learning algebra](https://doi.org/10.1207/s1532690xci0201_3). *Cognition and Instruction* 2(1), 59-89.
- Hattie, J. and Timperley, H. (2007). [The power of feedback](https://doi.org/10.3102/003465430298487). *Review of Educational Research* 77(1), 81-112.
- Baddeley, A. and Wilson, B. (1994). [When implicit learning fails: amnesia and the problem of error elimination](https://www.mrc-cbu.cam.ac.uk/bibliography/articles/3003). *Neuropsychologia* 32(1), 53-68.
- Wertheimer, M. (1923). [Laws of organization in perceptual forms](https://psychclassics.yorku.ca/Wertheimer/Forms/forms), translated in Ellis, W. (1938), *A Source Book of Gestalt Psychology*.
- Wagemans, J. et al. (2012). [A century of Gestalt psychology in visual perception: I. Perceptual grouping and figure-ground organization](https://pubmed.ncbi.nlm.nih.gov/22845751/). *Psychological Bulletin* 138(6).

W3C (w3.org could not be opened; the success criteria were read from the W3C's own source files on GitHub,
`w3c/wcag` and `w3c/coga`, and the Understanding pages confirmed by search)

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), W3C Recommendation, 5 October 2023, updated 12 December 2024; the
  criteria cited: 1.4.1, 1.4.3, 1.4.8, 1.4.10, 1.4.11, 2.1.1, 2.2.1, 2.3.3, 2.4.7, 2.4.11, 2.4.13, 2.5.8, 3.1.5,
  3.2.4, 3.2.6, 3.3.1, 3.3.2, 3.3.3, 3.3.7, 4.1.2.
- [What's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) (the levels of the nine new criteria).
- [Making content usable for people with cognitive and learning disabilities](https://www.w3.org/TR/coga-usable/), W3C Group Note, 29 April 2021; the patterns named: Make the Purpose of Your Page Clear, Use a Familiar Hierarchy and Design, Use a Consistent Visual Design, Clearly Identify Controls and Their Use, Use Icons that Help the User, Use Clear Words, Keep Text Succinct, Use White Spacing, Let Users Go Back, Use Clear Visible Labels, Provide Feedback, Avoid Too Much Content, Make Short Critical Paths, Ensure Controls and Content Do Not Move Unexpectedly, Make It Easy to Find Help and Give Feedback, Let Users Control When the Content Moves or Changes.

Platform guidelines

- Apple Human Interface Guidelines (read, from the pages' published data): [Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles),
  [Typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Color](https://developer.apple.com/design/human-interface-guidelines/color),
  [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Motion](https://developer.apple.com/design/human-interface-guidelines/motion),
  [Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback), [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- Material 3 (m3.material.io could not be opened; the two page links below are confirmed by search, and the token
  values were read from Google's [`material-components/material-web` token files](https://github.com/material-components/material-web/tree/main/tokens),
  version 0.192): [Type scale tokens](https://m3.material.io/styles/typography/type-scale-tokens),
  [Applying easing and duration](https://m3.material.io/styles/motion/easing-and-duration/applying-easing-and-duration);
  color roles, elevation levels and motion tokens from `_md-sys-color.scss`, `_md-sys-elevation.scss` and `_md-sys-motion.scss`.
- Material (search): [Spacing methods](https://material.io/design/layout/spacing-methods.html) (the 8 dp and 4 dp grids),
  [Applying density](https://material.io/design/layout/applying-density.html) (48 dp targets).
- [MDN, prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) (read, from the `mdn/content` source).

Plain language and inclusive design

- GOV.UK Design System (read, from the `alphagov/govuk-design-system` source): [Question pages](https://design-system.service.gov.uk/patterns/question-pages/),
  [Error message](https://design-system.service.gov.uk/components/error-message/).
- GOV.UK (search): [Writing for GOV.UK](https://www.gov.uk/guidance/content-design/writing-for-gov-uk) (reading age 9),
  [Style guide A to Z](https://www.gov.uk/guidance/style-guide/a-to-z), [Sentence length: why 25 words is our limit](https://insidegovuk.blog.gov.uk/2014/08/04/sentence-length-why-25-words-is-our-limit/), 2014.
- [CAST, Universal Design for Learning Guidelines 3.0](https://udlguidelines.cast.org/), 2024 (search: the three principles and nine guidelines, from CAST's own graphic organizer).
- [Microsoft Inclusive Design](https://inclusive.microsoft.design/) (search: the three principles, from the toolkit manual).

Already in the repo: the round 6 notes in [`06-out-of-the-cave/design-principles.md`](../06-out-of-the-cave/design-principles.md)
carry the NN/g pages on response times, progress indicators, error messages, cancel versus close, wizards and
onboarding; this guide does not repeat them.
