# Design directions

Branding and screen mockups for Reality Check, October 20 and 21, 2026. Leo picked round 6 on October 21 and #81
puts it in the app, waiting for Cynthia's review there. Round 7 shows six directions for the new user, CS students who
build with coding agents. A pick gets a line in [`DECISIONS.md`](../../DECISIONS.md), and its colors become the app's
theme in `app/`.

These are design boards (HTML pages), not app code. Open them in a browser: GitHub only shows their source.

**Start with [`all-designs.html`](all-designs.html).** It holds all seven rounds in one self-contained file
(images included), so it also works when sent on its own. Each round is saved as a standalone file below too.

## The rounds

| # | File | What it is |
|---|---|---|
| 1 | [`01-research/design-research.html`](01-research/design-research.html) | Research: three style directions with a reason for every color, six annotated references (Brilliant, Heptabase, Are.na, Fatebook, Headspace, Duolingo), and the color research behind them |
| 2 | [`02-ink-and-highlighter/ink-and-highlighter-mockups.html`](02-ink-and-highlighter/ink-and-highlighter-mockups.html) | The first app screens: predict, a move with a hint, level 5, the result, plus a small phone and dark mode |
| 3 | [`03-socratic-photo/socratic-photo-directions.html`](03-socratic-photo/socratic-photo-directions.html) | Six Socratic directions with photos and paintings: Engraving Light, Marble & Gold, Chiaroscuro, Fresco, Collage, Old Master |
| 4 | [`04-socratic-abstract/socratic-abstract-directions.html`](04-socratic-abstract/socratic-abstract-directions.html) | Six abstract directions drawn in code: Byrne's Euclid, Black-Figure, Plato's Cave, Verde & Gold, Ionic Order, Euler Circles |
| 5 | [`05-plaster-to-bronze/plaster-to-bronze.html`](05-plaster-to-bronze/plaster-to-bronze.html) | The direction built from what the app means: Rodin's Thinker, plaster for what you felt sure of, bronze for what you proved, across six screens |
| 6 | [`06-out-of-the-cave/out-of-the-cave.html`](06-out-of-the-cave/out-of-the-cave.html) | The mix of the picks from rounds 3 to 5 (Plato's Cave, Chiaroscuro, Fresco, Old Master, Plaster to Bronze): every session walks from the dark into daylight. Version 2 applies Apple's design principles and research on reading, navigation and learning: twelve screens with home, waiting and error states, a working guess-and-dawn prototype, and the brand kit for #14. The research is in [`design-principles.md`](06-out-of-the-cave/design-principles.md) |
| 7 | [`07-pivot-directions/pivot-directions.html`](07-pivot-directions/pivot-directions.html) | Six directions for CS students who build with coding agents, on Android-size screens next to the current app: Cave for Code, Red to Green, Whiteboard, Black Box, Your Pair and Warm Editor. Warm Editor (7F) is the recommendation: the session as a test run, in round 6's voice and colors. The research is in [`pivot-research.md`](07-pivot-directions/pivot-research.md) |

Rounds 2 to 6 use the democracy walk-through from [`agents/fixtures/session-1.json`](../../agents/fixtures/session-1.json)
(predicted 7, scored 5, so the calibration gap is +2). Rounds 2, 5 and 6 also show the level-5 inflation example from
[`agents/CONTRACTS.md`](../../agents/CONTRACTS.md). Round 7 uses the demo's concepts instead: a JWT session with the
same numbers, and a level-5 CORS profile.

## What stays the same in every direction

- Yellow or ochre always means hints and Help, which cost a point.
- Red or terracotta always means the overconfidence gap.
- One earned color (olive, blue or patina green, depending on the direction) marks a part done with no help.
- The calibration gap is always shown as a number and a sentence, never by color alone.
- Rounds 2 to 7 each end with a WCAG 2 contrast table. Every text pair passes AA (4.5:1). The thin divider lines
  are lighter than 3:1 on purpose: they only separate rows, and WCAG doesn't require contrast for decoration.

## Other files

- [`02-ink-and-highlighter/ink-and-highlighter-tokens.ts`](02-ink-and-highlighter/ink-and-highlighter-tokens.ts): light and
  dark color tokens for round 2, named by role (`surface`, `onSurface`, `hintContainer`, and so on), in the shape a React
  Native theme uses.
- [`06-out-of-the-cave/out-of-the-cave-tokens.ts`](06-out-of-the-cave/out-of-the-cave-tokens.ts): the same shape for round 6,
  with a third palette for the always-dark cave screens, increased-contrast values, the five stages, and the type scale. Rounds 3 to 5 keep their
  colors inside their boards.
- [`07-pivot-directions/warm-editor-tokens.ts`](07-pivot-directions/warm-editor-tokens.ts): the same roles for 7F, with an
  editor (dark) and a paper (light) palette, Material 3 sizes, springs and the check states. The other round 7
  directions keep their colors inside the board.

## Image credits and licenses

Every image here can be used in the app and the pitch. No AI-generated images are used. Screenshots of other
companies' sites from the research round are not in this repo; the research board links to the live sites instead.

| Image | Source | License |
|---|---|---|
| `david-death-of-socrates-detail.jpg` | Jacques-Louis David, *The Death of Socrates*, 1787, The Metropolitan Museum of Art | Public domain |
| `socrates-engraving-rijksmuseum.jpg` | Portrait of Socrates, engraving, Rijksmuseum RP-P-1907-4885 | CC0 |
| `byrne-euclid-1847-title-page.jpg` | Oliver Byrne, *The First Six Books of the Elements of Euclid*, 1847, title page | Public domain |
| `panathenaic-prize-amphora.jpg` | Terracotta Panathenaic prize amphora, The Metropolitan Museum of Art | CC0 |
| `thinker-bronze-met.jpg` | Auguste Rodin, *The Thinker*, cast by Alexis Rudier, The Metropolitan Museum of Art | CC0 |
| `thinker-plaster-1903.jpg` | Rodin's 1903 plaster *Thinker*, photographed at the Grand Palais, Paris, 2017, by Joe deSousa | CC0 |
| `thinker-patina-1901.jpg` | *The Thinker (Le Penseur)*, model 1880, cast 1901, National Gallery of Art | CC0 |
| `thinker-in-gates-of-hell.jpg` | *The Thinker*, detail of *The Gates of Hell*, Musée Rodin | CC0 |
| `socrates-bust-long-room.jpg` | Socrates bust in the Long Room, Trinity College Dublin, by Jameson Berrios | Unsplash License |
| `socrates-bust-dark.jpg` | Socrates bust by Andy Bodemer | Unsplash License |
| `marble-statue-sunlight.jpg` | Marble statue by Xinyi Wen | Unsplash License |
| `acropolis-columns.jpg` | The Acropolis by Alex Azabache | Unsplash License |
| `marble-texture.jpg` | Marble texture by H&CO | Unsplash License |
| `parchment-texture.jpg` | Parchment texture by Divya M | Unsplash License |
| `thinker-on-pedestal.jpg` | *The Thinker* at the Musée Rodin, by Richard Hedrick | Unsplash License |

Round 6 reuses six of these images; its folder holds its own copies. The public-domain and CC0 files came through Wikimedia Commons. The laurel and scales icons in rounds 3, 4 and 6 are from
[game-icons.net](https://game-icons.net) by Lorc (CC BY 3.0, credited on the boards). Fonts load from Google Fonts,
under their open licenses.

Round 7 uses no photos. Its "current" frames are screenshots of our own review build, and everything else is drawn
in code. The mascot in 7E is drawn with the engine from [Maskot](https://github.com/ExtraBinoss/Maskot), built on
Bloub by Jérémy Perret (both MIT).
