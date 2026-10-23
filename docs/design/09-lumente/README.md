# Round 9: Lumente

The app's design from October 22, 2026, replacing round 8 (Open Box). **Lumente** is the working name
(*lumen*, the unit of light, plus *mente*, Spanish for mind).

- **Board:** [Lumente canvas](https://claude.ai/artifact/QmCoNJiS5w8tg3vkkGHeGw), page "v4 · Lumente, black
  (current)". It holds every screen below, built on the demo's API session (guess 7, proved 5, gap +2). Pages v1 to
  v3 are earlier versions kept as history.
- **Tokens:** [`lumente-tokens.ts`](lumente-tokens.ts), with the same role names as round 8 where a role still
  exists, so screens keep reading colors by name.

## The idea

**Understanding comes like a light turning on, and questions bring the light.** The learner starts in the dark,
even when they feel they understand. Each question lights one part of the concept, and an answer in their own words
keeps it lit. The light arrives point by point, never all at once. Help is borrowed light, and it isn't needed once
the learner's own light fills the screen: *the help fades, the understanding stays.*

The metaphor needs no explanation because everyday language already treats understanding as light: "it dawned on
me", "shed some light on it", "I see". Linguists call this a conceptual metaphor (Lakoff and Johnson, *Metaphors We
Live By*, 1980).

## How it works on screen

| Element | What it does |
|---|---|
| **The light** | A warm light grows from the top-right corner, one stage per point proved. Since Oct 22 it grows over all 8 points: dark from 0 to 6 in smaller steps, light at 7 (the text turns dark), and full light at 8. The exact score lives in the points, not in the light. |
| **The map** | The concept sits in the middle with its four parts around it, each with one fixed icon: bigger group above, what it needs on the left, what it isn't on the right, types below. Each part is a question. Unasked parts are dashed "?" boxes. |
| **The firefly** | The tutor, drawn small and 2D. It sits next to each question, and a dashed amber line runs from it to the part being asked. Tapping it is Help (−1 point). It shines steadily, never blinks or pulses, and never reacts to the score. |
| **Points** | Two per part, drawn as two small squares next to the part's label. A lit part shows the learner's own words. |
| **Start** | Opens on code: an editor block with line numbers, the concept's line from the learner's project in amber, then the empty map, the question "Can you explain the ideas behind the code your AI wrote?" with "Choose a concept and start figuring it out." under it, the concepts to pick, and two ways to start: "Explore with guidance" (AI guides you with questions) and "Test myself" (you lead the investigation). On the web, the sign-in page leads with "Build understanding, not dependence." |
| **The guess** | No map. As the learner sets the number, the screen previews that much light. Locking in the guess returns to the dark for the first question. |
| **The moment** | The part that just lit gets an amber ring and six short amber sparks for 700 ms, like a bulb clicking on. |
| **Not yet** | No red and no fail mark. The part stays amber because it is still being asked, the firefly gives a free nudge, and the second point turns dotted: "this part can now light 1 point at most". |
| **Help** | The firefly comes closer and shines brighter, and its light becomes an amber hint card. "More help" sits next to the input. |
| **Revealed** | When the hints run out, the answer appears in the part but stays dim and dashed: shown, 0 points. |
| **Result** | The map in the light the learner reached. The gap is a coral number and a sentence ("You felt 2 points surer than you were"), with `Expected: 7  Received: 5` and dashed coral squares on the points claimed but not proved. |
| **Level 5** | Back to the dark. The learner asks and the firefly only answers facts. The input glows amber because the light is the learner's now, and small amber squares count the questions asked. |

## Colors: one meaning each

| Color | Hex | Means |
|---|---|---|
| Dark | `#111114`, `#16151a` | What the learner can't explain yet |
| Amber | `#f2b84b` | Questions: the firefly's light, the part being asked, and Help |
| Warm light | `#fbf6ee`, `#fffdf8`, and the light stages | What the learner understands: lit parts, the main action, the light itself |
| Coral | `#ff9b80` in the dark, `#9e3420` in the light | The overconfidence gap, and nothing else |

The light stages are listed in `light` in the tokens. No green and no red: a part done alone shows as two filled
points. A faint graph-paper grid (24 px, stronger every 96 px) sits over every screen.

## Shape and type

- **Crisp, not soft:** 8 px corners on parts and concept buttons, 12 px on buttons and the input, 2 px on points.
  Glows stay tight. The lines in the map are 1 px with a small dot where they meet a part.
- **Newsreader** for the tutor's voice and the learner's words, always upright (questions in medium weight).
- **Atkinson Hyperlegible Next** for the interface (buttons, labels, concept chips).
- **Atkinson Hyperlegible Mono** for code, points and the test readout.

All three come from `@expo-google-fonts` (`newsreader`, `atkinson-hyperlegible-next`, `atkinson-hyperlegible-mono`,
version 0.4.1). The rule behind it: technical where it's the AI's material, human where it's the learner's thinking.

## States

| Thing | States |
|---|---|
| Part | unasked (dashed "?"), asked (amber outline and leader line), lit (warm light card, learner's words), just lit (amber ring and sparks for 700 ms), revealed (dim, dashed, italic answer) |
| Point | earned (filled), open (outline), capped (dotted, after a retry or Help), claimed (amber, on the guess screen), missed (dashed coral, on the result) |
| Firefly | asks, checking (label "checking" while the answer is evaluated, 2 to 8 s, `role="status"`, input disabled), helps (bigger and brighter), fades (faint on the result) |

## Contrast

Every text pair passes WCAG 2 AA: 4.5:1 for text, 3:1 for the 30 px concept and the 84 px numbers. The light is a
gradient, so the check samples the real background color at the eight places where text sits directly on it (header,
concept, question left and right, bubble and nudge area, guess helper line, result sentence, result legend), at
every one of the 9 stages, plus the asked part, the gap number, the input, the buttons and the cards. 90 pairs in
all; the lowest is the header title at 4 points (4.83:1).

Since Oct 22 the app shows these nine stages at new points: the dark ones spread over 0 to 6, the first lit
stage at 7 and full light at 8, with the steps in between blending two stages, so every background sits between
two that pass. The table below still names each stage by its original number.

<details>
<summary>All 90 pairs</summary>

| Where | Text | Colors | Ratio | Needs | AA |
|---|---|---|---|---|---|
| light 0 | header title | `#f4efe8` on `#1e1817` | 15.30:1 | 4.5:1 | Pass |
| light 0 | concept in the map (30 px) | `#f4efe8` on `#121216` | 16.33:1 | 3:1 | Pass |
| light 0 | question, left | `#f4efe8` on `#131317` | 16.20:1 | 4.5:1 | Pass |
| light 0 | question, right | `#f4efe8` on `#141317` | 16.18:1 | 4.5:1 | Pass |
| light 0 | bubble and nudge area | `#f4efe8` on `#141318` | 16.12:1 | 4.5:1 | Pass |
| light 0 | guess helper line | `#c9c0b4` on `#141418` | 10.24:1 | 4.5:1 | Pass |
| light 0 | result sentence | `#f4efe8` on `#151419` | 16.02:1 | 4.5:1 | Pass |
| light 0 | result legend | `#c9c0b4` on `#141418` | 10.22:1 | 4.5:1 | Pass |
| light 0 | asked part, question color | `#f6c96e` on `#251b0f` | 10.91:1 | 4.5:1 | Pass |
| light 1 | header title | `#f4efe8` on `#2e211a` | 13.62:1 | 4.5:1 | Pass |
| light 1 | concept in the map (30 px) | `#f4efe8` on `#1c1717` | 15.51:1 | 3:1 | Pass |
| light 1 | question, left | `#f4efe8` on `#131317` | 16.20:1 | 4.5:1 | Pass |
| light 1 | question, right | `#f4efe8` on `#141317` | 16.18:1 | 4.5:1 | Pass |
| light 1 | bubble and nudge area | `#f4efe8` on `#141318` | 16.12:1 | 4.5:1 | Pass |
| light 1 | guess helper line | `#c9c0b4` on `#141418` | 10.24:1 | 4.5:1 | Pass |
| light 1 | result sentence | `#f4efe8` on `#151419` | 16.02:1 | 4.5:1 | Pass |
| light 1 | result legend | `#c9c0b4` on `#141418` | 10.22:1 | 4.5:1 | Pass |
| light 1 | asked part, question color | `#f6c96e` on `#251b0f` | 10.91:1 | 4.5:1 | Pass |
| light 2 | header title | `#f4efe8` on `#4e3523` | 9.91:1 | 4.5:1 | Pass |
| light 2 | concept in the map (30 px) | `#f4efe8` on `#2f201a` | 13.64:1 | 3:1 | Pass |
| light 2 | question, left | `#f4efe8` on `#131317` | 16.20:1 | 4.5:1 | Pass |
| light 2 | question, right | `#f4efe8` on `#191618` | 15.75:1 | 4.5:1 | Pass |
| light 2 | bubble and nudge area | `#f4efe8` on `#141318` | 16.12:1 | 4.5:1 | Pass |
| light 2 | guess helper line | `#c9c0b4` on `#141418` | 10.24:1 | 4.5:1 | Pass |
| light 2 | result sentence | `#f4efe8` on `#151419` | 16.02:1 | 4.5:1 | Pass |
| light 2 | result legend | `#c9c0b4` on `#141418` | 10.22:1 | 4.5:1 | Pass |
| light 2 | asked part, question color | `#f6c96e` on `#261b0f` | 10.79:1 | 4.5:1 | Pass |
| light 3 | header title | `#f4efe8` on `#5b3924` | 8.92:1 | 4.5:1 | Pass |
| light 3 | concept in the map (30 px) | `#f4efe8` on `#422a1d` | 11.63:1 | 3:1 | Pass |
| light 3 | question, left | `#f4efe8` on `#201818` | 15.19:1 | 4.5:1 | Pass |
| light 3 | question, right | `#f4efe8` on `#271c18` | 14.55:1 | 4.5:1 | Pass |
| light 3 | bubble and nudge area | `#f4efe8` on `#1a1618` | 15.63:1 | 4.5:1 | Pass |
| light 3 | guess helper line | `#c9c0b4` on `#161418` | 10.15:1 | 4.5:1 | Pass |
| light 3 | result sentence | `#f4efe8` on `#151419` | 16.02:1 | 4.5:1 | Pass |
| light 3 | result legend | `#c9c0b4` on `#141418` | 10.22:1 | 4.5:1 | Pass |
| light 3 | asked part, question color | `#f6c96e` on `#291c10` | 10.64:1 | 4.5:1 | Pass |
| light 4 | header title | `#f4efe8` on `#8b5f3b` | 4.83:1 | 4.5:1 | Pass |
| light 4 | concept in the map (30 px) | `#f4efe8` on `#573623` | 9.36:1 | 3:1 | Pass |
| light 4 | question, left | `#f4efe8` on `#2c1e19` | 14.03:1 | 4.5:1 | Pass |
| light 4 | question, right | `#f4efe8` on `#38251c` | 12.63:1 | 4.5:1 | Pass |
| light 4 | bubble and nudge area | `#f4efe8` on `#261c19` | 14.59:1 | 4.5:1 | Pass |
| light 4 | guess helper line | `#c9c0b4` on `#211a19` | 9.55:1 | 4.5:1 | Pass |
| light 4 | result sentence | `#f4efe8` on `#171519` | 15.84:1 | 4.5:1 | Pass |
| light 4 | result legend | `#c9c0b4` on `#1a1619` | 9.95:1 | 4.5:1 | Pass |
| light 4 | asked part, question color | `#f6c96e` on `#2c1e10` | 10.40:1 | 4.5:1 | Pass |
| light 5 | header title | `#17161a` on `#fde7c6` | 14.91:1 | 4.5:1 | Pass |
| light 5 | concept in the map (30 px) | `#17161a` on `#fbe0b9` | 14.16:1 | 3:1 | Pass |
| light 5 | question, left | `#17161a` on `#f3cd9f` | 12.08:1 | 4.5:1 | Pass |
| light 5 | question, right | `#17161a` on `#f6d3a7` | 12.72:1 | 4.5:1 | Pass |
| light 5 | bubble and nudge area | `#17161a` on `#f1c899` | 11.54:1 | 4.5:1 | Pass |
| light 5 | guess helper line | `#433c35` on `#efc494` | 6.72:1 | 4.5:1 | Pass |
| light 5 | result sentence | `#17161a` on `#ebbc8a` | 10.37:1 | 4.5:1 | Pass |
| light 5 | result legend | `#433c35` on `#ecbe8c` | 6.35:1 | 4.5:1 | Pass |
| light 5 | gap number (84 px) | `#9e3420` on `#fbddb3` | 5.42:1 | 3:1 | Pass |
| light 6 | header title | `#17161a` on `#fdeed5` | 15.77:1 | 4.5:1 | Pass |
| light 6 | concept in the map (30 px) | `#17161a` on `#fdeacb` | 15.23:1 | 3:1 | Pass |
| light 6 | question, left | `#17161a` on `#f8ddb6` | 13.70:1 | 4.5:1 | Pass |
| light 6 | question, right | `#17161a` on `#fae1bc` | 14.24:1 | 4.5:1 | Pass |
| light 6 | bubble and nudge area | `#17161a` on `#f7d8b0` | 13.23:1 | 4.5:1 | Pass |
| light 6 | guess helper line | `#433c35` on `#f5d5ac` | 7.77:1 | 4.5:1 | Pass |
| light 6 | result sentence | `#17161a` on `#f3cfa2` | 12.17:1 | 4.5:1 | Pass |
| light 6 | result legend | `#433c35` on `#f3d0a5` | 7.46:1 | 4.5:1 | Pass |
| light 6 | gap number (84 px) | `#9e3420` on `#fce8c7` | 5.89:1 | 3:1 | Pass |
| light 7 | header title | `#17161a` on `#fef4e3` | 16.56:1 | 4.5:1 | Pass |
| light 7 | concept in the map (30 px) | `#17161a` on `#fef2dc` | 16.20:1 | 3:1 | Pass |
| light 7 | question, left | `#17161a` on `#fbeacd` | 15.22:1 | 4.5:1 | Pass |
| light 7 | question, right | `#17161a` on `#fdedd3` | 15.64:1 | 4.5:1 | Pass |
| light 7 | bubble and nudge area | `#17161a` on `#fae7c9` | 14.85:1 | 4.5:1 | Pass |
| light 7 | guess helper line | `#433c35` on `#f9e5c5` | 8.79:1 | 4.5:1 | Pass |
| light 7 | result sentence | `#17161a` on `#f7e0be` | 14.01:1 | 4.5:1 | Pass |
| light 7 | result legend | `#433c35` on `#f8e1c0` | 8.54:1 | 4.5:1 | Pass |
| light 7 | gap number (84 px) | `#9e3420` on `#fdf0da` | 6.31:1 | 3:1 | Pass |
| light 8 | header title | `#17161a` on `#fff9ef` | 17.19:1 | 4.5:1 | Pass |
| light 8 | concept in the map (30 px) | `#17161a` on `#fef8ec` | 16.99:1 | 3:1 | Pass |
| light 8 | question, left | `#17161a` on `#fef4e4` | 16.52:1 | 4.5:1 | Pass |
| light 8 | question, right | `#17161a` on `#fef5e7` | 16.71:1 | 4.5:1 | Pass |
| light 8 | bubble and nudge area | `#17161a` on `#fdf2e1` | 16.28:1 | 4.5:1 | Pass |
| light 8 | guess helper line | `#433c35` on `#fcf1df` | 9.70:1 | 4.5:1 | Pass |
| light 8 | result sentence | `#17161a` on `#fbeeda` | 15.71:1 | 4.5:1 | Pass |
| light 8 | result legend | `#433c35` on `#fbefdc` | 9.53:1 | 4.5:1 | Pass |
| light 8 | gap number (84 px) | `#9e3420` on `#fef7ea` | 6.65:1 | 3:1 | Pass |
| dark input | typed text | `#f4efe8` on `#1f1d22` | 14.60:1 | 4.5:1 | Pass |
| dark input | placeholder | `#c9c0b4` on `#1f1d22` | 9.29:1 | 4.5:1 | Pass |
| dark | main button | `#111114` on `#f6f1ea` | 16.77:1 | 4.5:1 | Pass |
| lit part | learner's words | `#17161a` on `#fbf6ee` | 16.74:1 | 4.5:1 | Pass |
| lit part | part label | `#5a5248` on `#fbf6ee` | 7.14:1 | 4.5:1 | Pass |
| hint card | hint text | `#3a2a0e` on `#f6e3a8` | 10.85:1 | 4.5:1 | Pass |
| hint card | hint label | `#6e4604` on `#f6e3a8` | 6.48:1 | 4.5:1 | Pass |
| lit | main button | `#f6f1ea` on `#17161a` | 16.03:1 | 4.5:1 | Pass |
| lit, result card | part label | `#5a5248` on `#fffdf8` | 7.55:1 | 4.5:1 | Pass |

</details>

## Icon and splash

The firefly on near-black with a soft amber glow, one mark at every size, inside Android's adaptive-icon safe zone,
plus a single-color version for Android 13 themed icons. The splash is the dark screen with a warm corner light, the
firefly, the wordmark and the tagline. Both are on the board ("Icon and splash").

## For the build

- Swap `app/src/theme.ts` to these tokens. `palette.night` and `palette.day` replace round 8's themes;
  `lightFor(points)` gives the stage and its mode, and `lightCss(points)` the background on web.
- On native, draw `base` with `expo-linear-gradient` and the light on top (a radial gradient from the top-right
  corner, for example with `react-native-svg`).
- The phone's light or dark setting no longer drives session screens, because the light is the progress. Sign-in and
  error screens can use `palette.night` at stage 0.
- No blinking or pulsing anywhere. With reduced motion on, the light still changes (it is the score) but without the
  crossfade, and the sparks are skipped.

## Not chosen

- **Round 8, Open Box:** it mixed four round 7 directions (a terminal, a test file, a cube, a mascot) into a look
  with no single idea. Its result screen copy and `Expected / Received` readout carry over.
- **A night-blue sky** (the first version of this round, page v2 of the board): night to dawn to morning read as a
  sleep or meditation app. The dark is now near-black and the light comes from one corner.
- **The cave** (round 6, and a "shadows become real" version on October 22): it needs Plato's allegory to be read,
  and blurred shadow cards read as loading placeholders (skeleton screens).
