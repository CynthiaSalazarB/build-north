# Lumente design system (for Stitch)

Lumente helps CS students who build with coding agents prove they understand the concepts in their own code.
The design idea: **questions are the light.** The learner starts on a near-black screen. Each point they prove
grows a warm light from the top-right corner. At 5 of 8 points the screen is lit and the ink turns dark.
Nothing blinks or pulses. The tutor is a small, steady firefly.

This file describes round 9 (October 22, 2026) as tokens for Stitch. Source of truth:
`docs/design/09-lumente/lumente-tokens.ts`.

## Audience and tone

- Users: students in their first years of computer science, many of them first-time users and slow learners.
- Words on screen: reading grade 6 to 8, one idea per sentence, verbs first ("Pick a concept", "Save answer").
- Never jargon on screen: say "bigger group", "what it isn't", "what it needs", "types", not the Latin names.
- One primary action per screen. Everything else is quieter.

## Colors: one meaning each

| Role | Dark mode (0 to 4 points) | Light mode (5 to 8 points) | Meaning |
|---|---|---|---|
| surface | `#16151a` | `#fbdeb4` | the background under the light |
| surfaceContainer | `#1f1d22` | `#fffaf2` | cards, the editor block |
| onSurface | `#f4efe8` | `#17161a` | main text |
| onSurfaceVariant | `#c9c0b4` | `#433c35` | secondary text, placeholders |
| primary | `#f6f1ea` | `#17161a` | the one main action button |
| onPrimary | `#111114` | `#f6f1ea` | text on the main action |
| lit | `#fbf6ee` | `#fffdf8` | a part the learner explained (filled with their words) |
| onLit | `#17161a` | `#17161a` | text inside a lit part |
| firefly / question | `#f2b84b` | `#f2b84b` (ink `#6e4604`) | the tutor's light, the part being asked, Help |
| questionContainer | `rgba(40,28,14,0.85)` | `rgba(242,184,75,0.18)` | the asked part's fill |
| hintContainer / onHintContainer | `#f6e3a8` / `#3a2a0e` | same | the hint card |
| gap | `#ff9b80` | `#9e3420` | the overconfidence gap, and nothing else |
| outline | `rgba(255,240,225,0.22)` | `rgba(23,22,26,0.22)` | borders |

Rules:
- Amber means a question or help. Warm light means understanding. Coral means the gap. No red, no green, no fail marks.
- The light is a radial gradient from the top-right corner (`circle at 100% 0%`); dark stages sit over a
  `#111114` to `#16151a` vertical gradient. A faint graph-paper grid (1 px lines every 24 px, stronger every 96 px,
  7% and 3% white in the dark) sits over every screen.
- Contrast: body text at least 4.5:1, large text and icons at least 3:1, on the actual background stage.

## Typography

- One sans family with a clear, humanist feel (Inter or similar). Headlines 28 to 32 px, semibold. Body 16 to
  17 px, regular, line height 1.5. Labels 13 to 14 px, medium, never all caps for long labels.
- The concept's line of code shows in a monospace block with line numbers; the concept's own line is amber.
- Minimum text size on screen: 14 px. Minimum tap target: 44 by 44 px; minimum pointer target 24 by 24 px.

## Spacing and shape

- 8 pt grid: 8, 16, 24, 32, 40. Screen padding 24 px. 40 px between distinct sections. 16 px inside cards.
- Corners: cards 16 px, buttons 12 px, the map's parts 12 px, chips 999 px. Borders 1 px, the asked part 1.5 px.
- Depth comes from the light and from 1 px outlines, not from drop shadows.

## Components

- **Primary button**: full width on phones, 52 px tall, `primary` fill, `onPrimary` text, one per screen.
- **Secondary button**: outlined with `outline`, `onSurface` text, 48 px tall.
- **Help**: in the guided levels (2 to 4) the firefly itself is Help, amber, with "Help, costs a point" next to
  it. On the whole-map screen (level 5 and Test myself) the firefly is a guide that cannot be tapped; Help is an
  underlined link ("Get a hint · −1 point") that opens a confirmation naming the area and the cost
  (`DECISIONS.md`, 2026-10-23, "At level 5 the firefly is a guide, not Help").
- **Words that are decided** (`DECISIONS.md`, October 22 and 23): the four places on the map are "areas" on
  screen; the result's two rows are "prediction" and "map score" and its headline is the gap in words; the guess
  screen says "How much can you explain on your own?", shows the 2/1/0 rubric before nine numbers with nothing
  selected, and its button is "Save my prediction"; on the whole-map screen the intro is "Build your map", the
  chat is collapsed behind "Ask a fact (optional)", and the last action is "Review & submit".
- **The map**: the concept in a box in the middle, four parts around it in fixed places: bigger group above,
  what it needs on the left, what it isn't on the right, types below. Each part has a fixed 24 px icon and a
  label. Unasked parts are dashed boxes with a "?". The asked part has an amber outline, an amber glow and a
  dashed amber line from the firefly. A lit part is filled with `lit` and holds the learner's own words. Two
  small squares next to each label are its two points.
- **Hint card**: `hintContainer` fill, `onHintContainer` text, the firefly at its top-left corner, one hint in
  plain words, a "More help" link.
- **Points**: small 8 px squares; filled when proved, dotted when "this part can now light 1 point at most",
  dashed coral when claimed in the guess but not proved.
- **Result**: the headline is the gap in words ("You felt 2 points surer than you could explain."), then two
  rows of eight small squares labelled "prediction" and "map score"; the points the prediction claimed but the
  map did not prove are dashed coral squares on the map-score row only, with the legend "prediction gap". The
  map below shows each area's earned points, filled or open, never coral.

## Motion

- Nothing moves on its own. The firefly shines steadily; on hover or touch its halo spreads over 150 ms.
- A part that just lit gets a 3 px amber ring and six short amber sparks for 700 ms, like a bulb clicking on.
- Reduce Motion: every transition becomes an instant swap.
