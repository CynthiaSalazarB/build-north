# Round 9: Lumente

The app's design from October 22, 2026, replacing round 8 (Open Box). **Lumente** is the working name
(*lumen*, the unit of light, plus *mente*, Spanish for mind).

- **Board:** [Lumente canvas](https://claude.ai/artifact/QmCoNJiS5w8tg3vkkGHeGw), page "v2 · Questions are the
  light". It holds every screen below, built on the demo's API session (guess 7, proved 5, gap +2).
- **Tokens:** [`lumente-tokens.ts`](lumente-tokens.ts), with the same role names as round 8 where a role still
  exists, so screens keep reading colors by name.

## The idea

**Understanding comes like a dawn, and questions bring the light.** The learner starts in the dark, even when they
feel they understand. Each question lights one part of the concept, and an answer in their own words keeps it lit.
The light arrives point by point, never all at once. Help is borrowed light, and it isn't needed once the learner's
own daylight arrives: *the help fades, the understanding stays.*

The metaphor needs no explanation because everyday language already treats understanding as light: "it dawned on
me", "shed some light on it", "I see". Linguists call this a conceptual metaphor (Lakoff and Johnson, *Metaphors We
Live By*, 1980).

## How it works on screen

| Element | What it does |
|---|---|
| **The map** | The concept sits in the middle with its four parts around it, each with one fixed icon: bigger group above, what it needs on the left, what it isn't on the right, types below. Each part is a question. Unasked parts are dashed "?" spots. |
| **The firefly** | The tutor, drawn small and 2D. It sits next to each question, and a soft amber beam points at the part being asked. Tapping it is Help (−1 point). It never reacts to the score. |
| **Points** | Two per part, drawn as two dots next to the part's label. A lit part shows the learner's own words. |
| **The sky** | The background moves one stage per point proved: night, pre-dawn, first light, dawn, sunrise (at 5 points, when the text turns dark), then morning. The exact score lives in the points, not in the sky. |
| **The guess** | No map. As the learner sets the number, the sky previews that much light. Locking in the guess returns to night for the first question. |
| **Not yet** | No red and no fail mark. The part stays amber because it is still being asked, the firefly gives a free nudge, and the second point turns dotted: "this part can now light 1 point at most". |
| **Help** | The firefly comes closer and burns brighter, and its light becomes an amber hint card. "More help" sits next to the input. |
| **Revealed** | When the hints run out, the answer appears in the part but stays dim and dashed: shown, 0 points. |
| **Result** | The map in the sky the learner reached. The gap is a coral number and a sentence ("You felt 2 points surer than you were"), with `Expected: 7  Received: 5` and dashed coral dots on the points claimed but not proved. |
| **Level 5** | Back to night. The learner asks and the firefly only answers facts. The input glows amber because the light is the learner's now, and small amber dots count the questions asked. |

## Colors: one meaning each

| Color | Hex | Means |
|---|---|---|
| Night | `#0d1736`, `#14234d`, `#1f3566` | What the learner can't explain yet |
| Amber | `#f2b84b` | Questions: the firefly's light, the part being asked, and Help |
| Daylight | `#f4f6fb`, `#fdfdfb` | What the learner understands: lit parts and the main action |
| Coral | `#ff9b80` at night, `#9e3420` by day | The overconfidence gap, and nothing else |

The sky stages in between come from these, listed in `sky` in the tokens. No green and no red: a part done alone
shows as two filled points.

## Type

- **Newsreader** for the tutor's voice and the learner's words (questions, lit parts, the result sentence).
- **Atkinson Hyperlegible Next** for the interface (buttons, labels, concept chips).
- **Atkinson Hyperlegible Mono** for code, points and the test readout.

All three come from `@expo-google-fonts` (`newsreader`, `atkinson-hyperlegible-next`, `atkinson-hyperlegible-mono`,
version 0.4.1). The rule behind it: technical where it's the AI's material, human where it's the learner's thinking.

## States

| Thing | States |
|---|---|
| Part | unasked (dashed "?"), asked (amber outline and beam), lit (daylight card, learner's words), just lit (two soft rings for 700 ms), revealed (dim, dashed, italic answer) |
| Point | earned (filled), open (ring), capped (dotted, after a retry or Help), claimed (amber, on the guess screen), missed (dashed coral, on the result) |
| Firefly | asks, checking (pulses while the answer is evaluated, 2 to 8 s, `role="status"`), helps (bigger and brighter), fades (faint on the result) |

## Contrast

Every text pair passes WCAG 2 AA, computed from the tokens: 4.5:1 for text, 3:1 for the 84 px numbers. Text sits on
the top and middle of each sky stage. The input and the buttons sit on their own surfaces.

| Where | Text | Colors | Ratio | Needs | AA |
|---|---|---|---|---|---|
| sky 0, top | text | `#f1f4fb` on `#0d1736` | 15.99:1 | 4.5:1 | Pass |
| sky 0, middle | text | `#f1f4fb` on `#14234d` | 13.85:1 | 4.5:1 | Pass |
| sky 0, middle | muted text | `#c4cde4` on `#14234d` | 9.58:1 | 4.5:1 | Pass |
| sky 0, middle | asked part, question color | `#f6c96e` on `#14234d` | 9.80:1 | 4.5:1 | Pass |
| sky 1, top | text | `#f1f4fb` on `#0f1a3c` | 15.47:1 | 4.5:1 | Pass |
| sky 1, middle | text | `#f1f4fb` on `#192b57` | 12.51:1 | 4.5:1 | Pass |
| sky 1, middle | muted text | `#c4cde4` on `#192b57` | 8.66:1 | 4.5:1 | Pass |
| sky 1, middle | asked part, question color | `#f6c96e` on `#192b57` | 8.85:1 | 4.5:1 | Pass |
| sky 2, top | text | `#f1f4fb` on `#13204a` | 14.31:1 | 4.5:1 | Pass |
| sky 2, middle | text | `#f1f4fb` on `#25366b` | 10.49:1 | 4.5:1 | Pass |
| sky 2, middle | muted text | `#c4cde4` on `#25366b` | 7.26:1 | 4.5:1 | Pass |
| sky 2, middle | asked part, question color | `#f6c96e` on `#25366b` | 7.42:1 | 4.5:1 | Pass |
| sky 3, top | text | `#f1f4fb` on `#1a2a5a` | 12.53:1 | 4.5:1 | Pass |
| sky 3, middle | text | `#f1f4fb` on `#3c4a80` | 7.68:1 | 4.5:1 | Pass |
| sky 3, middle | muted text | `#c4cde4` on `#3c4a80` | 5.32:1 | 4.5:1 | Pass |
| sky 3, middle | asked part, question color | `#f6c96e` on `#3c4a80` | 5.44:1 | 4.5:1 | Pass |
| sky 4, top | text | `#f1f4fb` on `#233466` | 10.87:1 | 4.5:1 | Pass |
| sky 4, middle | text | `#f1f4fb` on `#4b4f84` | 6.93:1 | 4.5:1 | Pass |
| sky 4, middle | muted text | `#c4cde4` on `#4b4f84` | 4.80:1 | 4.5:1 | Pass |
| sky 4, middle | asked part, question color | `#f6c96e` on `#4b4f84` | 4.91:1 | 4.5:1 | Pass |
| sky 5, top | text | `#0d1736` on `#a9bcdf` | 9.18:1 | 4.5:1 | Pass |
| sky 5, top | muted text | `#3a4459` on `#a9bcdf` | 5.09:1 | 4.5:1 | Pass |
| sky 5, middle | muted text | `#3a4459` on `#e7c9b0` | 6.22:1 | 4.5:1 | Pass |
| sky 5, bottom | muted text | `#3a4459` on `#f7d6a8` | 7.04:1 | 4.5:1 | Pass |
| sky 5, top | gap number (84 px) | `#9e3420` on `#a9bcdf` | 3.69:1 | 3:1 | Pass |
| sky 6, top | text | `#0d1736` on `#b8cae6` | 10.59:1 | 4.5:1 | Pass |
| sky 6, top | muted text | `#3a4459` on `#b8cae6` | 5.87:1 | 4.5:1 | Pass |
| sky 6, middle | muted text | `#3a4459` on `#efdcc8` | 7.32:1 | 4.5:1 | Pass |
| sky 6, bottom | muted text | `#3a4459` on `#f8e2bf` | 7.73:1 | 4.5:1 | Pass |
| sky 6, top | gap number (84 px) | `#9e3420` on `#b8cae6` | 4.26:1 | 3:1 | Pass |
| sky 7, top | text | `#0d1736` on `#cfdcef` | 12.69:1 | 4.5:1 | Pass |
| sky 7, top | muted text | `#3a4459` on `#cfdcef` | 7.04:1 | 4.5:1 | Pass |
| sky 7, middle | muted text | `#3a4459` on `#f3e9dc` | 8.14:1 | 4.5:1 | Pass |
| sky 7, bottom | muted text | `#3a4459` on `#f8ecd7` | 8.35:1 | 4.5:1 | Pass |
| sky 7, top | gap number (84 px) | `#9e3420` on `#cfdcef` | 5.10:1 | 3:1 | Pass |
| sky 8, top | text | `#0d1736` on `#e2ebf7` | 14.64:1 | 4.5:1 | Pass |
| sky 8, top | muted text | `#3a4459` on `#e2ebf7` | 8.12:1 | 4.5:1 | Pass |
| sky 8, middle | muted text | `#3a4459` on `#f6f2ea` | 8.74:1 | 4.5:1 | Pass |
| sky 8, bottom | muted text | `#3a4459` on `#f9f4ea` | 8.91:1 | 4.5:1 | Pass |
| sky 8, top | gap number (84 px) | `#9e3420` on `#e2ebf7` | 5.89:1 | 3:1 | Pass |
| night input | typed text | `#f1f4fb` on `#1a2a57` | 12.61:1 | 4.5:1 | Pass |
| night input | placeholder | `#c4cde4` on `#1a2a57` | 8.73:1 | 4.5:1 | Pass |
| night | main button | `#0d1736` on `#f4f6fb` | 16.28:1 | 4.5:1 | Pass |
| night, lit part | learner's words | `#0d1736` on `#f4f6fb` | 16.28:1 | 4.5:1 | Pass |
| night, lit part | part label | `#46526a` on `#f4f6fb` | 7.26:1 | 4.5:1 | Pass |
| night, sky 0 middle | gap number (84 px) | `#ff9b80` on `#14234d` | 7.44:1 | 3:1 | Pass |
| hint card | hint text | `#3a2a0e` on `#f6e3a8` | 10.85:1 | 4.5:1 | Pass |
| hint card | hint label | `#6e4604` on `#f6e3a8` | 6.48:1 | 4.5:1 | Pass |
| day | main button | `#f4f6fb` on `#0d1736` | 16.28:1 | 4.5:1 | Pass |
| day, lit part | part label | `#46526a` on `#fdfdfb` | 7.71:1 | 4.5:1 | Pass |
| day, sky 5 middle | asked part, question color | `#6e4604` on `#e9c6a0` | 5.14:1 | 4.5:1 | Pass |
| guess at 7, middle | guess number (84 px) | `#9a6408` on `#f3e9dc` | 4.17:1 | 3:1 | Pass |

Three colors in the board's mockups were darkened or lightened here to pass: muted text at night (`#b4c0dc` to
`#c4cde4`), muted text by day (`#46526a` to `#3a4459`) and the asked part's text by day (`#7a4f05` to `#6e4604`).
The tokens are the source of truth.

## Icon and splash

The firefly on night blue, one mark at every size, inside Android's adaptive-icon safe zone, plus a single-color
version for Android 13 themed icons. The splash is night with the firefly, the wordmark and the tagline. Both are on
the board ("Icon and splash").

## For the build

- Swap `app/src/theme.ts` to these tokens. `palette.night` and `palette.day` replace round 8's themes, and
  `skyFor(points)` picks the background and the mode.
- The phone's light or dark setting no longer drives session screens, because the sky is the progress. Sign-in and
  error screens can use `palette.night`.
- With reduced motion on, the sky still changes (it is the score) but without the crossfade. The firefly's pulse and
  the just-lit rings stop.
- The sky is a three-stop vertical gradient: `expo-linear-gradient` on native, CSS on web.

## Open

- The revealed screen says "it comes back next session". Keep that line only if revealed parts really return in a
  later session.

## Not chosen

- **Round 8, Open Box:** it mixed four round 7 directions (a terminal, a test file, a cube, a mascot) into a look
  with no single idea. Its result screen copy and `Expected / Received` readout carry over.
- **The cave** (round 6, and a "shadows become real" version on October 22): it needs Plato's allegory to be read,
  and blurred shadow cards read as loading placeholders (skeleton screens).
