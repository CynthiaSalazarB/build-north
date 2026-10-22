# Design principles for Reality Check

The research behind round 6, version 2 ([`out-of-the-cave.html`](out-of-the-cave.html)), read on October 20, 2026.
Each rule says what the app does and links its source. The colors and sizes are in
[`out-of-the-cave-tokens.ts`](out-of-the-cave-tokens.ts).

## Apple's eight principles, applied

Apple's [design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles) (updated June 8, 2026):

- **Purpose.** One job: check what you really know about an idea. Every screen serves the session or the progress it leaves.
- **Agency.** A session is a guided flow, so Close is always visible and closing saves the answers.
- **Responsibility.** The welcome says the tutor is an AI that asks questions and never hands over the answer.
- **Familiarity.** Standard patterns: a home list, a full-screen session, a half-height sheet, a chat-style conversation.
- **Flexibility.** Text scales with the phone's text size, every color pair passes contrast, and motion respects Reduce Motion.
- **Simplicity.** One main action per screen; the cost of Help is written on the button.
- **Craft.** Every state is designed: waiting for the tutor, a failed reply, the small phone, dark mode.
- **Delight.** One defining moment per session: the arch opening into daylight after the guess, and the points casting into bronze at the end.

## Type

- Body text is 17 pt, the iOS default; nothing under 400 weight ([Apple typography](https://developer.apple.com/design/human-interface-guidelines/typography)).
- Newsreader carries the voice: titles, questions and the conversation. Buttons, labels and lists use the phone's own font (SF Pro on iPhone, Roboto on Android), as Apple and Material both suggest ([Apple](https://developer.apple.com/design/human-interface-guidelines/typography), [Material](https://m3.material.io/styles/typography/type-scale-tokens)).
- A serif body is fine on phone screens: a 2022 review found no legibility difference between serif and sans serif ([Richardson](https://link.springer.com/chapter/10.1007/978-3-030-90984-0_16)).
- Reading text uses a line height of about 1.5 (17/26) and stays under 80 characters a line ([WCAG 1.4.8](https://www.w3.org/TR/WCAG22/#visual-presentation)).
- Sizes come from Apple's text styles: 34 large title, 28 title, 17 body and headline, 13 footnote. Each screen uses three.
- No all-caps labels (Apple's lists now use title case). Italic only for short runs: every question the tutor asks is italic.
- Buttons are 1–3 words, verb first, in title case: Lock In My Guess, Try Again.

## Color and comfort

- Every color has one meaning: bronze for proven points and the main action, lamp gold for Help, terracotta only for the overconfidence gap, patina for done alone ([Apple color](https://developer.apple.com/design/human-interface-guidelines/color)).
- Errors use neutral text and an icon, never terracotta, so the gap color keeps its single meaning.
- Text passes 4.5:1; small secondary text aims for 7:1 ([Apple dark mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode), [WCAG 2.2](https://www.w3.org/TR/WCAG22/#contrast-minimum)).
- Dark mode is warm dark grey, never pure black, with muted accents ([Material dark theme](https://m2.material.io/design/color/dark-theme.html)).
- Highlights use soft containers with dark text, not large saturated areas: the hint card moved from bright gold to a pale one ([Material color roles](https://m3.material.io/styles/color/roles)).
- Every custom color also has an increased-contrast value (`increasedContrast` in the tokens).

## Layout and shape

- Side margins are 20 pt; spacing steps by 4 and 8 ([Material spacing](https://m3.material.io/styles/spacing/tokens)).
- Buttons are capsules (radius = height ÷ 2), and an inner corner equals the outer corner minus the padding ([WWDC25, the new design system](https://developer.apple.com/videos/play/wwdc2025/356/)).
- Touch targets are at least 44 pt on iOS and 48 dp on Android ([Apple accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Material](https://m3.material.io/foundations/designing/structure)).
- Controls float above content as glass on iOS (Close, Skip, Done, the answer box); content stays opaque, and brand color stays in the content ([Apple materials](https://developer.apple.com/design/human-interface-guidelines/materials)).
- Main actions sit low on the screen, where thumbs reach ([Apple, designing for iOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ios)).

## Navigation

- No tab bar: tab bars are for 3–5 peer sections, and the app has two. Home lists the maps, Progress is one tap away, settings sit in the corner ([Material navigation bar](https://m3.material.io/components/navigation-bar/guidelines), [Apple tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)).
- A session is a full-screen modal with one path and an obvious way out ([Apple modality](https://developer.apple.com/design/human-interface-guidelines/modality)). Closing saves, so it needs no confirmation ([NN/g](https://www.nngroup.com/articles/cancel-vs-close/)).
- Progress shows all session: the Greek key, one unit per part, plus "1 of 4" ([NN/g wizards](https://www.nngroup.com/articles/wizards/)).
- At level 5 the map owns the screen and the fact desk is a half-height sheet with a grabber ([Apple sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), [NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/)).

## Waiting and errors

- The learner's answer appears at once and Send waits. During the 2–8 s reply: moving dots and "Checking your answer…". After 10 s: "Taking longer than usual", with Retry ([NN/g response times](https://www.nngroup.com/articles/response-times-3-important-limits/), [progress indicators](https://www.nngroup.com/articles/progress-indicators/)).
- A failed reply shows under the answer, keeps it, and offers Try Again. A failed hint never costs a point ([NN/g error messages](https://www.nngroup.com/articles/error-message-guidelines/)).
- Tutor replies stay short: what was off, then one question ([NN/g](https://www.nngroup.com/articles/less-chat-more-answer/)).

## Learning and motivation

- No streaks, day counters or missed-day messages; progress only goes up ([Deci, Koestner & Ryan 2001](https://www.selfdeterminationtheory.org/SDT/documents/2001_DeciKoestnerRyan.pdf)).
- Progress says what moves a part up a stage: finish it with at most one retry or hint.
- Home leads with one thing to resume, one next move and one to revisit ([Duolingo](https://blog.duolingo.com/new-duolingo-home-screen-design/), [Zeigarnik effect](https://lawsofux.com/zeigarnik-effect/)).
- Help shows its price and never opens on its own; trying first helps learning ([Koedinger & Aleven 2007](https://link.springer.com/article/10.1007/s10648-007-9049-0)).
- The result puts the guess and the score on one 0–8 scale and ends with one next step ([peak-end rule](https://lawsofux.com/peak-end-rule/)). The gap is never framed as failure.
- One skippable welcome. Help and level 5 explain themselves the first time they appear ([Apple onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding), [NN/g](https://www.nngroup.com/articles/mobile-app-onboarding/)).

## Motion and haptics

- Taps answer within 0.1 s; per-turn feedback lasts 150 ms or less ([NN/g animation duration](https://www.nngroup.com/articles/animation-duration/)).
- Two bigger moments a session: the dawn (700 ms) and the bronze cast at the end. Nothing celebrates every turn.
- Haptics are rare and optional: selection when the guess changes, success at a level-up ([Apple haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)).
- With Reduce Motion on, the dawn and the cast become fades ([Apple motion](https://developer.apple.com/design/human-interface-guidelines/motion)).

## What not to copy from Apple

- SF Pro, New York and SF Symbols stay on Apple devices; the Android and web builds use Newsreader, the platform font and the app's own icons.
- Liquid Glass is iOS only (`expo-glass-effect`). Android and web get opaque warm surfaces.
- On Android, the system back gesture closes sheets and sessions; no iOS-style Cancel and Done in the top bar.

## Not verified

- Apple's pages give no numbers for margins; the 20 pt margin is a choice between Material's 16 dp and wider iOS layouts.
- Newsreader at 17 pt has not been tested on a real phone yet, in either theme.
