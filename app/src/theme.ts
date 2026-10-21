// Every color, font and size the app uses: round 8 "Open Box" (#14), from
// docs/design/08-open-box/open-box-tokens.ts on #72. Two themes, each with a day and a night mode; the app
// opens in Obsidian. Screens take colors only through useColors() in components/ui.tsx.
import Constants from "expo-constants";
import { Platform, useColorScheme } from "react-native";

export const brand = { name: "Reality Check" } as const;

/** 8A Cobalt, day: blue and white. */
const cobaltDay = {
  surface: "#f3f5fa",
  surfaceContainer: "#ffffff",
  surfaceHigh: "#e9edf7",
  onSurface: "#121a33",
  onSurfaceVariant: "#4b5470",
  placeholder: "#4b5470",
  separator: "#e3e8f2",
  outline: "#d3dae9",
  // your pair, and the main action
  primary: "#2a4fd0",
  primaryContainer: "#dfe6fd",
  onPrimary: "#ffffff",
  // the box: closed faces, and the glass a proved face turns into
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
  // a part done alone
  alone: "#135231",
  aloneContainer: "#d3f1e0",
  pair: "#2a4fd0",
  pairEye: "#ffffff",
  scrim: "rgba(18, 26, 51, 0.4)",
} as const;

export type Colors = { readonly [K in keyof typeof cobaltDay]: string };

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

/** 8B Obsidian, editor: black and white, the app's default. */
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

/** Two themes, each with a day and a night mode; `default` is the mode used when the phone has none. */
export const palette = {
  cobalt: { day: cobaltDay, night: cobaltNight, default: "day" },
  obsidian: { day: obsidianStudio, night: obsidianEditor, default: "night" },
} as const;
export type Theme = keyof typeof palette;
export type Mode = "day" | "night";

/** The theme the app opens in. Cobalt is the second theme: switching is this one constant, no picker. */
export const defaultTheme: Theme = "obsidian";

/** The phone decides day or night only once app.json lets it (`userInterfaceStyle: "automatic"`, which needs a
 * new native build). Until then, and when the phone has no setting, the theme's own mode. */
const followsPhone = Constants.expoConfig?.userInterfaceStyle === "automatic";

export function useMode(): Mode {
  const scheme = useColorScheme();
  if (followsPhone && scheme === "dark") return "night";
  if (followsPhone && scheme === "light") return "day";
  return palette[defaultTheme].default;
}

/** The box: 8 corners for 8 points, in a 210 x 214 viewBox, numbered as on the board. */
export const box = {
  width: 210,
  height: 214,
  corners: {
    1: [112, 22],
    2: [184, 60],
    3: [98, 104],
    4: [26, 66],
    5: [112, 114],
    6: [184, 152],
    7: [98, 196],
    8: [26, 158],
  },
  /** A face turns to glass once all four of its corners are proved. */
  faces: { top: [1, 2, 3, 4], left: [4, 3, 7, 8], right: [3, 2, 6, 7] },
  visibleEdges: [[1, 2], [2, 3], [3, 4], [4, 1], [2, 6], [3, 7], [4, 8], [7, 6], [7, 8]],
  /** Behind the box, dashed. */
  hiddenEdges: [[1, 5], [5, 6], [5, 8]],
  /** Point n of 8 is corner `cornerOrder[n - 1]`: a guess of 7 marks the first seven, a score of 5 proves the
   * first five, and the corners in between are the ones felt sure. */
  cornerOrder: [4, 8, 3, 7, 1, 2, 6, 5],
  /** The top bar's mini box: part n is edge `partEdges[n - 1]`. */
  partEdges: [[4, 8], [3, 7], [2, 6], [1, 5]],
} as const;
export type CornerId = keyof typeof box.corners;

/** Newsreader carries the tutor's voice; Atkinson Hyperlegible Mono carries code, chips, labels and numbers;
 * buttons use the phone's own font. */
export const serif = {
  regular: "Newsreader_400Regular",
  medium: "Newsreader_500Medium",
  italic: "Newsreader_400Regular_Italic",
} as const;
export const mono = {
  regular: "AtkinsonHyperlegibleMono_400Regular",
  semibold: "AtkinsonHyperlegibleMono_600SemiBold",
} as const;
/** The phone's own font: Roboto on Android, the system font on the web. */
export const systemFontStack = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const system = Platform.select({ web: systemFontStack, default: undefined });

/** Material 3 sp sizes, three a screen: a title, Body L 16 and Label M 12. */
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
  button: { fontFamily: system, fontSize: 16, lineHeight: 22, fontWeight: "600" },
} as const;

/** Spacing steps by 4 and 8; side margins are 20. */
export const space = { xs: 4, s: 8, m: 12, l: 16, margin: 20, xl: 24, xxl: 32, xxxl: 40 } as const;
export const radius = { chip: 10, field: 14, card: 16, bubble: 16, sheet: 28, iconButton: 12, button: 16 } as const;
/** 48dp touch targets: a 40dp control gets a hit slop of 4 on each side. */
export const size = { touch: 48, button: 56, smallButton: 40, chip: 38, avatar: 40, icon: 22, hitSlop: 4 } as const;
/** Milliseconds. Taps answer at once; a sheet slides in 240; the wave loops every 1.2 s. */
export const motion = { press: 120, feedback: 150, sheet: 240, corner: 280, open: 700, wave: 1200 } as const;

/** Phone-first: on the web the same column is centered at this width (decision 14). */
export const maxContentWidth = 520;
