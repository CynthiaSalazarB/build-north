// Round 7F "Warm Editor": the session as a test run you write about yourself, in round 6's voice and colors.
// Same roles as app/src/theme.ts, so screens keep reading colors by name. Editor is the default; paper is light.
export const brand = { name: "Reality Check" } as const;

/** Editor: the dark default. */
const editor = {
  surface: "#17140f",
  surfaceContainer: "#211d17",
  surfaceHigh: "#2a251e",
  onSurface: "#efe7da",
  onSurfaceVariant: "#b5a993",
  placeholder: "#b5a993",
  separator: "#2f2a22",
  outline: "#3d362c",
  // bronze: a point you proved, and the main action
  primary: "#c98c4f",
  primaryHigh: "#e2ad72",
  onPrimary: "#1a1108",
  // lamp: hints and Help, which cost a point
  hintContainer: "#2d2413",
  hintOutline: "#4b3c1c",
  onHintContainer: "#efe3cb",
  hint: "#f0c46a",
  // terracotta: the overconfidence gap, and nothing else
  gap: "#ee8b6a",
  gapContainer: "#2e1b14",
  gapOutline: "#5a3022",
  // patina: a part done alone
  alone: "#8fd1b5",
  aloneContainer: "#18302a",
  scrim: "rgba(8, 6, 4, 0.55)",
} as const;

/** Paper: the light theme, for daylight and a lit demo room. */
const paper = {
  surface: "#f6f5f1",
  surfaceContainer: "#fdfcfa",
  surfaceHigh: "#efede7",
  onSurface: "#1b1812",
  onSurfaceVariant: "#5b5347",
  placeholder: "#5b5347",
  separator: "#e6e2da",
  outline: "#d8d3c9",
  primary: "#7a4a22",
  primaryHigh: "#a8703f",
  onPrimary: "#fbf4e8",
  hintContainer: "#f8ebc8",
  hintOutline: "#ead7a6",
  onHintContainer: "#3a2c08",
  hint: "#7a5300",
  gap: "#a63a1e",
  gapContainer: "#f8e4dc",
  gapOutline: "#eec5b8",
  alone: "#1f5a4b",
  aloneContainer: "#d6e9e1",
  scrim: "rgba(27, 24, 18, 0.32)",
} as const;

export const palette = { editor, paper } as const;
export type Tone = keyof typeof palette;
export type Colors = { readonly [K in keyof typeof editor]: string };

/** A part's state as a check run, in GitHub's words: queued, in progress, then how it ended. */
export const checkState = {
  queued: { glyph: "○", label: "queued" },
  inProgress: { glyph: "◐", label: "in progress" },
  alone: { glyph: "✓", label: "alone" },
  hinted: { glyph: "✓", label: "hint" },
  shown: { glyph: "○", label: "answer shown" },
} as const;

/** Newsreader carries the tutor's voice (already loaded by the app); Atkinson Hyperlegible Mono carries code,
 *  chips and numbers (@expo-google-fonts/atkinson-hyperlegible-mono). */
export const serif = {
  regular: "Newsreader_400Regular",
  italic: "Newsreader_400Regular_Italic",
  medium: "Newsreader_500Medium",
} as const;
export const mono = {
  regular: "AtkinsonHyperlegibleMono_400Regular",
  semibold: "AtkinsonHyperlegibleMono_600SemiBold",
} as const;

/** Material 3 sp sizes, three a screen: a display (Headline L 32, Headline S 24 or the 64 numeral), Body L 16, Label M 12. */
export const type = {
  title: { fontFamily: serif.medium, fontSize: 32, lineHeight: 40 },
  question: { fontFamily: serif.italic, fontSize: 24, lineHeight: 32 },
  hero: { fontFamily: serif.regular, fontSize: 64, lineHeight: 64 },
  body: { fontFamily: serif.regular, fontSize: 16, lineHeight: 24 },
  code: { fontFamily: mono.regular, fontSize: 16, lineHeight: 24 },
  numeral: { fontFamily: mono.semibold, fontSize: 57, lineHeight: 64 },
  label: { fontFamily: mono.regular, fontSize: 12, lineHeight: 16 },
  /** Buttons use the phone's own font (Roboto on Android, the system font on the web), as in round 6. */
  button: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  labelStrong: { fontFamily: mono.semibold, fontSize: 12, lineHeight: 16 },
} as const;

/** Spacing steps by 4 and 8; side margins are 20. */
export const space = { xs: 4, s: 8, m: 12, l: 16, margin: 20, xl: 24, xxl: 32 } as const;
/** Panels and controls 16, chips 10, round M3 buttons (28 at 56dp), sheets 28. */
export const radius = { cell: 8, chip: 10, control: 16, panel: 16, button: 28, sheet: 28 } as const;
/** Android's touch minimum is 48 dp: buttons are M3 medium (56), 40-high chips get a hit slop of 4. */
export const size = { control: 56, chip: 40, icon: 18, cell: 36, hitSlop: 4, handle: { width: 32, height: 4 } } as const;
/** M3 Expressive springs (damping ratio, stiffness); milliseconds for the result, where the cells fill one by one. */
export const spring = {
  fast: { dampingRatio: 0.6, stiffness: 800 },
  standard: { dampingRatio: 0.8, stiffness: 380 },
  slow: { dampingRatio: 0.8, stiffness: 200 },
} as const;
export const motion = { cellStagger: 70, cell: 160, wave: 1200 } as const;

/** The fact desk opens as a modal sheet at half the screen at most. */
export const sheet = { maxInitialHeight: 0.5 } as const;

/** Phone-first: on the web the same column is centered at this width (decision 14). */
export const maxContentWidth = 520;
