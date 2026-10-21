// Every color, font and size the app uses: round 6 "Out of the Cave" (#14, #46), from
// docs/design/06-out-of-the-cave/out-of-the-cave-tokens.ts. Screens take colors only from here.
import { Platform } from "react-native";

export const brand = { name: "Reality Check" } as const;

/** Daylight: where the work happens (the start screen, every question, the result). */
const day = {
  surface: "#efe5d3",
  surfaceContainer: "#faf6ee",
  onSurface: "#1e1712",
  onSurfaceVariant: "#4e443a",
  placeholder: "#74685b",
  separator: "#dccfba",
  // bronze: a point you proved, and the main action
  primary: "#7a4a22",
  primaryHigh: "#a8703f",
  primaryDeep: "#4e2e14",
  onPrimary: "#fbf4e8",
  // lamp: hints and Help, which cost a point
  hintContainer: "#f3dfb0",
  onHintContainer: "#3a2a0e",
  hintIcon: "#94600f",
  // terracotta: the overconfidence gap, and nothing else
  gap: "#9a3820",
  shadowBlock: "rgba(30, 23, 18, 0.12)",
  // patina: done alone
  aloneContainer: "#d6e7df",
  onAloneContainer: "#1f4a3f",
  scrim: "rgba(30, 23, 18, 0.32)",
} as const;

/** The cave: first launch and the guess, what you haven't checked yet. */
const cave = {
  surface: "#14100c",
  surfaceContainer: "#221b15",
  onSurface: "#ece3d3",
  onSurfaceVariant: "#b1a28e",
  placeholder: "#8c7d6a",
  separator: "#3a3028",
  // the daylight slab
  primary: "#f1e8d8",
  onPrimary: "#1e1712",
  shadowBlock: "#2e251d",
  shadowOutline: "#8c7d6a",
  // the lit arch, and the light it throws
  archTop: "#fff6e3",
  archBottom: "#f3d9a4",
  onArch: "#1e1712",
  onArchVariant: "#4e443a",
  beam: "#f3d9a4",
  gilt: "#c9a25a",
} as const;

export const palette = { day, cave } as const;
export type Tone = keyof typeof palette;
export type Colors = (typeof palette)[Tone];

/** The five levels of a part as stages of a statue: Sketch, Clay, Plaster, Bronze, Patina. */
export const stageColor = {
  1: { fill: null, ink: day.onSurface },
  2: { fill: "#7a6555", ink: day.onPrimary },
  3: { fill: "#fbf8f2", ink: day.onSurface },
  4: { fill: day.primary, ink: day.onPrimary },
  5: { fill: "#2f6a5b", ink: day.onPrimary },
} as const;

/** The Newsreader faces the root layout loads (@expo-google-fonts/newsreader). */
export const serif = {
  regular: "Newsreader_400Regular",
  italic: "Newsreader_400Regular_Italic",
  medium: "Newsreader_500Medium",
  mediumItalic: "Newsreader_500Medium_Italic",
  semibold: "Newsreader_600SemiBold",
} as const;
/** The phone's own font for controls: Roboto on Android, the system font on the web. */
export const systemFontStack = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const system = Platform.select({ web: systemFontStack, default: undefined });

/** Newsreader carries the voice (titles, questions, the conversation); the system font carries controls. */
export const type = {
  splash: { fontFamily: serif.regular, fontSize: 48, lineHeight: 52 },
  largeTitle: { fontFamily: serif.medium, fontSize: 34, lineHeight: 41 },
  title: { fontFamily: serif.regular, fontSize: 28, lineHeight: 34 },
  question: { fontFamily: serif.italic, fontSize: 28, lineHeight: 34 },
  hero: { fontFamily: serif.regular, fontSize: 88, lineHeight: 92 },
  body: { fontFamily: serif.regular, fontSize: 17, lineHeight: 26 },
  bodyItalic: { fontFamily: serif.italic, fontSize: 17, lineHeight: 26 },
  bodyStrong: { fontFamily: serif.semibold, fontSize: 17, lineHeight: 26 },
  ui: { fontFamily: system, fontSize: 17, lineHeight: 22 },
  uiStrong: { fontFamily: system, fontSize: 17, lineHeight: 22, fontWeight: "600" },
  footnote: { fontFamily: system, fontSize: 13, lineHeight: 18 },
  footnoteStrong: { fontFamily: system, fontSize: 13, lineHeight: 18, fontWeight: "600" },
} as const;

/** Spacing steps by 4 and 8; side margins are 20. */
export const space = { xs: 4, s: 8, m: 12, l: 16, margin: 20, xl: 24, xxl: 32, xxxl: 40 } as const;
export const radius = { block: 8, chip: 14, card: 20, cardLarge: 24, sheet: 32, control: 22, button: 26 } as const;
/** Android's touch minimum is 48 dp: 44-high controls get a hit slop of 2 on each side. */
export const size = { control: 44, button: 52, step: 56, icon: 20, hitSlop: 2 } as const;
/** Milliseconds. Taps answer at once; two bigger moments a session (the dawn, the cast). */
export const motion = { dawn: 700, fade: 300, castStagger: 90, cast: 280, castDelay: 250, dots: 1200 } as const;

/** Phone-first: on the web the same column is centered at this width (decision 14). */
export const maxContentWidth = 520;
