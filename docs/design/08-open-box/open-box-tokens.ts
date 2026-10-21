// Round 8 "Open Box", the app's design (picked Oct 21): one direction in two color themes, each with a day and a night mode.
// Same roles as app/src/theme.ts and round 7's warm-editor-tokens.ts, so screens keep reading colors by name.
export const brand = { name: "Reality Check" } as const;

/** 8A Cobalt, day: blue and white, the default of the blue theme. */
const cobaltDay = {
  surface: "#f3f5fa",
  surfaceContainer: "#ffffff",
  surfaceHigh: "#e9edf7",
  onSurface: "#121a33",
  onSurfaceVariant: "#4b5470",
  placeholder: "#4b5470",
  separator: "#e3e8f2",
  outline: "#d3dae9",
  // cobalt: your pair, and the main action
  primary: "#2a4fd0",
  primaryContainer: "#dfe6fd",
  onPrimary: "#ffffff",
  // the box: closed faces, and the glass a proved corner turns into
  box: "#1b2d7a",
  boxDeep: "#0f1a48",
  boxSide: "#16235c",
  boxEdge: "#4a63c4",
  glass: "rgba(223, 230, 253, 0.75)",
  glassEdge: "#8fa3e3",
  // amber: hints and Help, which cost a point
  hintContainer: "#ffe8a8",
  hintOutline: "#efd48a",
  onHintContainer: "#4a3500",
  hint: "#7a5300",
  // coral: the overconfidence gap, and nothing else
  gap: "#c0402a",
  gapContainer: "#fbe7e1",
  // mint: a part done alone
  alone: "#135231",
  aloneContainer: "#d3f1e0",
  // the pair: pair/*.svg are filled #2f55d4 and #fbfcfe; draw them in pair and pairEye instead
  pair: "#2a4fd0",
  pairEye: "#ffffff",
  scrim: "rgba(18, 26, 51, 0.4)",
} as const;

/** 8A Cobalt, night: the same blue on a navy editor. */
const cobaltNight: Colors = {
  surface: "#0d1324",
  surfaceContainer: "#151d36",
  surfaceHigh: "#1c2746",
  onSurface: "#e9edf8",
  onSurfaceVariant: "#a6afc9",
  placeholder: "#a6afc9",
  separator: "#222d4e",
  outline: "#2c3a62",
  primary: "#8fa6ff",
  primaryContainer: "#22306a",
  onPrimary: "#0d1324",
  box: "#2b3f8f",
  boxDeep: "#141f52",
  boxSide: "#1f2f73",
  boxEdge: "#6b84e0",
  glass: "rgba(143, 166, 255, 0.3)",
  glassEdge: "#8fa6ff",
  hintContainer: "#2b2414",
  hintOutline: "#4a3c1c",
  onHintContainer: "#ece4d2",
  hint: "#f2c662",
  gap: "#ff8f72",
  gapContainer: "#33201a",
  alone: "#6fcf97",
  aloneContainer: "#183326",
  pair: "#8fa6ff",
  pairEye: "#0d1324",
  scrim: "rgba(5, 8, 20, 0.6)",
};

/** 8B Obsidian, editor: black and white, the default of the black theme. */
const obsidianEditor: Colors = {
  surface: "#15171a",
  surfaceContainer: "#1d2024",
  surfaceHigh: "#23272c",
  onSurface: "#e8eaed",
  onSurfaceVariant: "#9aa3ad",
  placeholder: "#9aa3ad",
  separator: "#2a2e34",
  outline: "#343a41",
  primary: "#e8eaed",
  primaryContainer: "#2b3036",
  onPrimary: "#15171a",
  box: "#35383e",
  boxDeep: "#0f1012",
  boxSide: "#22252a",
  boxEdge: "#7d838b",
  glass: "rgba(205, 221, 226, 0.42)",
  glassEdge: "#9fb0b7",
  hintContainer: "#2b2414",
  hintOutline: "#4a3c1c",
  onHintContainer: "#ece4d2",
  hint: "#f2c662",
  gap: "#ff8a6b",
  gapContainer: "#2c1c18",
  alone: "#6fcf97",
  aloneContainer: "#183326",
  pair: "#e8eaed",
  pairEye: "#15171a",
  scrim: "rgba(5, 6, 8, 0.6)",
};

/** 8B Obsidian, studio: the same black and white in daylight. */
const obsidianStudio: Colors = {
  surface: "#f1f1ee",
  surfaceContainer: "#fbfbfa",
  surfaceHigh: "#e8e8e3",
  onSurface: "#141518",
  onSurfaceVariant: "#55585e",
  placeholder: "#55585e",
  separator: "#e6e6e1",
  outline: "#d9d9d4",
  primary: "#0f1012",
  primaryContainer: "#e2e3e0",
  onPrimary: "#f1f1ee",
  box: "#2b2d31",
  boxDeep: "#0f1012",
  boxSide: "#1c1d21",
  boxEdge: "#55585e",
  glass: "rgba(205, 221, 226, 0.6)",
  glassEdge: "#8d969c",
  hintContainer: "#f5e4b8",
  hintOutline: "#e6cf8f",
  onHintContainer: "#3a2a05",
  hint: "#7a5300",
  gap: "#b13a22",
  gapContainer: "#f6e3dd",
  alone: "#11463e",
  aloneContainer: "#d2e8e3",
  pair: "#0f1012",
  pairEye: "#f1f1ee",
  scrim: "rgba(20, 21, 24, 0.35)",
};

export type Colors = { readonly [K in keyof typeof cobaltDay]: string };

/** Two themes, each with a day and a night mode. The mode follows the phone's light or dark setting; `default` is the
 *  mode used when the phone has none. */
export const palette = {
  cobalt: { day: cobaltDay, night: cobaltNight, default: "day" },
  obsidian: { day: obsidianStudio, night: obsidianEditor, default: "night" },
} as const;
export type Theme = keyof typeof palette;

/** The theme the app opens in. Cobalt is the second theme: switching is this one constant. */
export const defaultTheme: Theme = "obsidian";
export type Mode = "day" | "night";

/** A part's state as a check run, in GitHub's words: queued, in progress, then how it ended. */
export const checkState = {
  queued: { glyph: "○", label: "queued" },
  inProgress: { glyph: "◐", label: "in progress" },
  alone: { glyph: "✓", label: "alone" },
  hinted: { glyph: "✓", label: "hint" },
  shown: { glyph: "○", label: "answer shown" },
} as const;

/** The box: 8 corners for 8 points. A corner is expected (the guess), proved, felt sure (guessed but not proved), or never expected. */
export const corner = {
  expected: "ring in onSurface",
  proved: "filled with onSurface; its face turns to glass",
  feltSure: "ring in gap",
  neverExpected: "dashed ring in placeholder",
} as const;

/** The box, drawn in a 210 x 214 viewBox, with corners numbered as on the board. */
export const box = {
  viewBox: { width: 210, height: 214 },
  corners: {
    1: [112, 22], 2: [184, 60], 3: [98, 104], 4: [26, 66],
    5: [112, 114], 6: [184, 152], 7: [98, 196], 8: [26, 158],
  },
  /** Closed, the top is filled `box`, the left `boxDeep` and the right `boxSide`. A face turns to glass once all
   *  four of its corners are proved. */
  faces: { top: [1, 2, 3, 4], left: [4, 3, 7, 8], right: [3, 2, 6, 7] },
  visibleEdges: [[1, 2], [2, 3], [3, 4], [4, 1], [2, 6], [3, 7], [4, 8], [7, 6], [7, 8]],
  /** Behind the box, drawn dashed in `glassEdge`. */
  hiddenEdges: [[1, 5], [5, 6], [5, 8]],
  /** Point n of 8 is corner `cornerOrder[n - 1]`: a guess of 7 marks the first seven, a score of 5 proves the first
   *  five, and the corners in between are the ones felt sure. */
  cornerOrder: [4, 8, 3, 7, 1, 2, 6, 5],
  /** The top bar's mini box: part n is edge `partEdges[n - 1]`, thick when done and dashed in `primary` while in
   *  progress. */
  partEdges: [[4, 8], [3, 7], [2, 6], [1, 5]],
} as const;

/** Newsreader carries the tutor's voice (already loaded by the app); Atkinson Hyperlegible Mono carries code,
 *  chips, labels and numbers (@expo-google-fonts/atkinson-hyperlegible-mono); buttons use the platform font. */
export const serif = {
  regular: "Newsreader_400Regular",
  medium: "Newsreader_500Medium",
  italic: "Newsreader_400Regular_Italic",
} as const;
export const mono = {
  regular: "AtkinsonHyperlegibleMono_400Regular",
  semibold: "AtkinsonHyperlegibleMono_600SemiBold",
} as const;

/** Material 3 sp sizes, three a screen: a title, Body L 16, Label M 12. */
export const type = {
  title: { fontFamily: serif.medium, fontSize: 30, lineHeight: 36 },
  question: { fontFamily: serif.italic, fontSize: 23, lineHeight: 30 },
  sheetTitle: { fontFamily: serif.medium, fontSize: 22, lineHeight: 28 },
  gap: { fontFamily: serif.regular, fontSize: 64, lineHeight: 64 },
  guess: { fontFamily: serif.medium, fontSize: 57, lineHeight: 64 },
  body: { fontFamily: serif.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: serif.medium, fontSize: 16, lineHeight: 22 },
  code: { fontFamily: mono.regular, fontSize: 16, lineHeight: 24 },
  chip: { fontFamily: mono.regular, fontSize: 15, lineHeight: 20 },
  label: { fontFamily: mono.regular, fontSize: 12, lineHeight: 16 },
  labelStrong: { fontFamily: mono.semibold, fontSize: 12, lineHeight: 16 },
  button: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
} as const;

export const space = { xs: 4, s: 8, m: 12, l: 16, margin: 20, xl: 24 } as const;
export const radius = { chip: 10, field: 14, card: 16, bubble: 16, sheet: 28, iconButton: 12, button: 16 } as const;
export const size = { touch: 48, button: 56, smallButton: 40, chip: 38, avatar: 40, icon: 22 } as const;
/** Springs for the box: a corner turns to glass per proved part, the whole box opens once on the result. */
export const motion = { press: 120, feedback: 150, sheet: 240, corner: 280, open: 700, wave: 1200 } as const;
