// Every color, font and size the app uses: round 9 "Lumente" (#14), Cynthia's design, from
// docs/design/09-lumente/lumente-tokens.ts. Questions are the light: a near-black screen with a warm light that
// grows from the top-right corner, one stage per point proved, and the ink turns dark at 7 points, when the light
// fills the screen (full light at 8). Nothing blinks or pulses. Screens take colors only through useColors() in components/ui.tsx.
import type { Metadata } from "expo-router/server";
import { Platform } from "react-native";

/** `site` is the production web build on EAS Hosting: link previews need absolute image addresses. */
export const brand = { name: "Lumente", tagline: "Build with AI. Understand the concepts yourself.", site: "https://reality-check.expo.app" } as const;

/** A web page's metadata, in the static HTML: the title and description, and the same card (`public/og.png`) for a
 *  link shared in a chat or a post. Called only in Node, when the pages are exported. */
export function pageMetadata(title: string, description: string): Metadata {
  const image = { url: `${brand.site}/og.png`, width: 1200, height: 630, alt: `${brand.name}: can you explain the ideas behind the code your AI wrote?` };
  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: brand.name, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** Dark (0 to 6 points): light ink on near-black. */
const night = {
  surface: "#16151a",
  surfaceContainer: "#1f1d22",
  onSurface: "#f4efe8",
  onSurfaceVariant: "#c9c0b4",
  placeholder: "#c9c0b4",
  separator: "rgba(255, 240, 225, 0.14)",
  outline: "rgba(255, 240, 225, 0.22)",
  // warm light: the main action, and a part the learner lit
  primary: "#f6f1ea",
  onPrimary: "#111114",
  lit: "#fbf6ee",
  onLit: "#17161a",
  litLabel: "#5a5248",
  litEdge: "#fbf6ee",
  litShadow: "0 0 12px rgba(255, 236, 205, 0.3)",
  // amber: questions (the firefly's light), the part being asked, and Help
  firefly: "#f2b84b",
  question: "#f6c96e",
  questionContainer: "rgba(40, 28, 14, 0.85)",
  questionOutline: "#f2b84b",
  hintContainer: "#f6e3a8",
  onHintContainer: "#3a2a0e",
  hint: "#6e4604",
  hintNote: "#5c3a03",
  // coral: the overconfidence gap, and nothing else
  gap: "#ff9b80",
  // a part not asked yet, the lines that join the parts, and the controls drawn on the light
  partFill: "rgba(17, 17, 20, 0.65)",
  partEdge: "rgba(255, 240, 225, 0.34)",
  line: "rgba(255, 240, 225, 0.75)",
  lineFaint: "rgba(255, 240, 225, 0.3)",
  controlFill: "rgba(0, 0, 0, 0.35)",
  fieldEdge: "rgba(255, 240, 225, 0.16)",
  codeFill: "rgba(0, 0, 0, 0.45)",
  // Start's code: the concept's line tinted amber, the lines around it dim
  codeLine: "rgba(242, 184, 75, 0.1)",
  codeDim: "rgba(244, 239, 232, 0.4)",
  codeGutter: "#7d7469",
  bubble: "rgba(255, 240, 225, 0.1)",
  bubbleEdge: "rgba(255, 240, 225, 0.2)",
  guessNumber: "#f6c96e",
  gridMajor: "rgba(255, 240, 225, 0.07)",
  gridMinor: "rgba(255, 240, 225, 0.03)",
  scrim: "rgba(0, 0, 0, 0.6)",
} as const;

export type Colors = { readonly [K in keyof typeof night]: string };

/** Lit (7 and 8 points): dark ink on warm light. */
const day: Colors = {
  surface: "#fbdeb4",
  surfaceContainer: "#fffaf2",
  onSurface: "#17161a",
  onSurfaceVariant: "#433c35",
  placeholder: "#433c35",
  separator: "rgba(23, 22, 26, 0.1)",
  outline: "rgba(23, 22, 26, 0.22)",
  primary: "#17161a",
  onPrimary: "#f6f1ea",
  lit: "#fffdf8",
  onLit: "#17161a",
  litLabel: "#5a5248",
  litEdge: "rgba(23, 22, 26, 0.1)",
  litShadow: "0 6px 16px rgba(80, 45, 15, 0.12)",
  firefly: "#f2b84b",
  question: "#6e4604",
  questionContainer: "rgba(242, 184, 75, 0.18)",
  questionOutline: "#a8740f",
  hintContainer: "#f6e3a8",
  onHintContainer: "#3a2a0e",
  hint: "#6e4604",
  hintNote: "#5c3a03",
  gap: "#9e3420",
  partFill: "rgba(255, 255, 255, 0.4)",
  partEdge: "rgba(23, 22, 26, 0.3)",
  line: "rgba(23, 22, 26, 0.45)",
  lineFaint: "rgba(23, 22, 26, 0.25)",
  controlFill: "rgba(255, 255, 255, 0.35)",
  fieldEdge: "rgba(23, 22, 26, 0.16)",
  codeFill: "rgba(255, 255, 255, 0.5)",
  codeLine: "rgba(242, 184, 75, 0.18)",
  codeDim: "rgba(23, 22, 26, 0.45)",
  codeGutter: "#6b6259",
  bubble: "rgba(23, 22, 26, 0.06)",
  bubbleEdge: "rgba(23, 22, 26, 0.14)",
  guessNumber: "#8a5a06",
  gridMajor: "rgba(23, 22, 26, 0.06)",
  gridMinor: "rgba(23, 22, 26, 0.025)",
  scrim: "rgba(23, 22, 26, 0.35)",
};

export const palette = { night, day } as const;
export type Mode = keyof typeof palette;

/** The near-black under the light, top to bottom. */
export const base = { top: "#111114", bottom: "#16151a" } as const;

/** A gradient stop: a color and where it sits, in percent of the distance to the far corner. */
type LightStop = readonly [color: string, at: number];
type DesignedStage = { readonly name: string; readonly mode: Mode; readonly stops: readonly LightStop[] };

/** The nine stages from the design board, each one contrast-checked (docs/design/09-lumente/README.md): a radial
 *  gradient from the top-right corner (`circle at 100% 0%`). Dark stages sit over `base`; lit stages are opaque. */
const designed: readonly DesignedStage[] = [
  { name: "dark", mode: "night", stops: [["rgba(255, 210, 150, 0.5)", 0], ["rgba(200, 120, 60, 0.22)", 10], ["rgba(17, 17, 20, 0)", 26]] },
  { name: "dark", mode: "night", stops: [["rgba(255, 214, 158, 0.65)", 0], ["rgba(210, 130, 66, 0.35)", 10], ["rgba(120, 68, 36, 0.18)", 24], ["rgba(17, 17, 20, 0)", 40]] },
  { name: "first light", mode: "night", stops: [["rgba(255, 218, 164, 0.8)", 0], ["rgba(224, 148, 80, 0.55)", 10], ["rgba(140, 80, 42, 0.3)", 26], ["rgba(17, 17, 20, 0)", 50]] },
  { name: "spreading", mode: "night", stops: [["rgba(255, 222, 170, 0.95)", 0], ["rgba(236, 165, 95, 0.75)", 9], ["rgba(150, 85, 45, 0.5)", 22], ["rgba(90, 50, 28, 0.3)", 45], ["rgba(17, 17, 20, 0)", 65]] },
  { name: "most of the map", mode: "night", stops: [["rgba(255, 230, 185, 1)", 0], ["rgba(242, 175, 105, 0.8)", 12], ["rgba(170, 98, 52, 0.5)", 28], ["rgba(100, 56, 30, 0.32)", 52], ["rgba(17, 17, 20, 0)", 75]] },
  { name: "lit", mode: "day", stops: [["#fff4e0", 0], ["#fbdeb4", 35], ["#ecbe8c", 70], ["#deaa7a", 100]] },
  { name: "lit", mode: "day", stops: [["#fff7e8", 0], ["#fce6c3", 40], ["#f2cda0", 75], ["#e8bc8e", 100]] },
  { name: "lit", mode: "day", stops: [["#fffaf0", 0], ["#fdeed4", 45], ["#f6dcb8", 80], ["#eecea6", 100]] },
  { name: "full light", mode: "day", stops: [["#fffcf6", 0], ["#fef5e6", 50], ["#f9ead4", 85], ["#f4e0c4", 100]] },
];

/** What the screen shows at a number of points: a designed stage, or two blended, the second over the first at `mix`. */
export type LightStage = DesignedStage & { readonly points: number; readonly over?: { readonly stops: readonly LightStop[]; readonly mix: number } };

const at = (points: number, stage: number): LightStage => ({ ...designed[stage]!, points });
const blend = (points: number, from: number, to: number, mix: number): LightStage => ({ ...at(points, from), over: { stops: designed[to]!.stops, mix } });

/** One step per point proved, over all 8 (decided Oct 22). The turn to dark ink has no readable in-between: light
 *  ink needs the background behind the words to stay dark, and the darkest text on the light (the question color)
 *  needs it about half as bright as white. So the dark stages spread over 0 to 6 points in smaller steps, and the
 *  screen turns light at 7, the last step before full light at 8. A step between two designed stages blends them,
 *  so every pixel sits between two backgrounds that already pass. */
export const light: readonly LightStage[] = [
  at(0, 0),
  blend(1, 0, 1, 2 / 3),
  blend(2, 1, 2, 1 / 3),
  at(3, 2),
  blend(4, 2, 3, 2 / 3),
  blend(5, 3, 4, 1 / 3),
  at(6, 4),
  at(7, 5),
  at(8, 8),
];

export const lightFor = (points: number): LightStage => light[Math.max(0, Math.min(8, Math.round(points)))]!;

/** The light reaches the farthest corner, but no farther than this: on a wide screen the stops would otherwise
 *  stretch over the words on the left, which sit in the dark the contrast was checked against. */
export const lightReachMax = 1300;

/** A faint graph-paper grid over every screen: 1px lines every 24px, stronger every 96px. */
export const grid = { minor: 24, major: 96, offset: { x: 13, y: 9 } } as const;

/** The map's four parts, in the mentefacto layout: the bigger group above the concept, what it needs on the
 *  left, what it isn't on the right, its types below. Icons are 24 x 24 stroke paths. */
export const parts = {
  supraordinate: { label: "bigger group", icon: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 11a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z" },
  exclusion: { label: "what it isn't", icon: "M5 9h14M5 15h14M16 4L8 20" },
  isoordinate: { label: "what it needs", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  infraordinate: { label: "types", icon: "M12 3v7M12 10L5 20M12 10v10M12 10l7 10" },
} as const;

/** The map's proportions, from the board's 372 x 296 box: the side parts take 128 of 372, the top and bottom 180. */
export const map = { width: 372, side: 128, middle: 180, partMinHeight: 72, rowGap: 34, line: 1, dot: 2.5 } as const;

/** The firefly: the tutor that asks, and Help. It shines steadily (no blinking or pulsing) and never reacts to the
 *  score. Drawn in a 56 x 56 viewBox: two wings, two antennae, a round amber body, two eyes. */
export const firefly = {
  states: {
    asks: { size: 40, halo: 0.55, body: "#f2b84b", opacity: 1 },
    helps: { size: 48, halo: 0.78, body: "#f6c662", opacity: 1 },
    fades: { size: 26, halo: 0, body: "#d9a64a", opacity: 0.4 },
  },
  wings: [
    { cx: 19, cy: 20, rx: 8, ry: 4.5, rotate: -28 },
    { cx: 37, cy: 20, rx: 8, ry: 4.5, rotate: 28 },
  ],
  wing: "rgba(255, 240, 225, 0.4)",
  antennae: "M24 18 L21 10 M32 18 L35 10",
  antenna: "#c9c0b4",
  body: { cx: 28, cy: 30, r: 10.5 },
  eyes: [
    { cx: 24.6, cy: 28.6, r: 1.7 },
    { cx: 31.4, cy: 28.6, r: 1.7 },
  ],
  eye: "#111114",
  /** From the firefly to the asked part: 1.5px, dashed 4 4, amber, with a 3px dot at the part. */
  leader: { width: 1.5, dash: "4 4", dot: 3 },
} as const;

/** Start opens on the learner's code: an editor block with line numbers, the concept's line in amber with a
 *  static amber cursor at the end, one dim line above and below. */
export const editor = { gutter: 34, radius: 8 } as const;

/** Newsreader carries the tutor's voice and the learner's words, always upright; Atkinson Hyperlegible Next carries
 *  the interface; Atkinson Hyperlegible Mono carries code, points and the test readout. */
export const serif = {
  regular: "Newsreader_400Regular",
  medium: "Newsreader_500Medium",
  italic: "Newsreader_400Regular_Italic",
} as const;
export const sans = {
  regular: "AtkinsonHyperlegibleNext_400Regular",
  semibold: "AtkinsonHyperlegibleNext_600SemiBold",
} as const;
export const mono = {
  regular: "AtkinsonHyperlegibleMono_400Regular",
  semibold: "AtkinsonHyperlegibleMono_600SemiBold",
} as const;

export const type = {
  wordmark: { fontFamily: serif.regular, fontSize: 24, lineHeight: 32 },
  /** The website layout's headline: Start's and the landing page's question. */
  display: { fontFamily: serif.medium, fontSize: 44, lineHeight: 52 },
  title: { fontFamily: serif.medium, fontSize: 30, lineHeight: 36 },
  question: { fontFamily: serif.medium, fontSize: 22, lineHeight: 30 },
  /** The tutor's other lines: a nudge, a revealed part, "You ask now". */
  reply: { fontFamily: serif.medium, fontSize: 19, lineHeight: 27 },
  concept: { fontFamily: serif.regular, fontSize: 30, lineHeight: 36 },
  partText: { fontFamily: serif.regular, fontSize: 15, lineHeight: 18 },
  partUnknown: { fontFamily: serif.regular, fontSize: 22, lineHeight: 26 },
  revealedText: { fontFamily: serif.italic, fontSize: 14, lineHeight: 17 },
  gap: { fontFamily: serif.regular, fontSize: 84, lineHeight: 88 },
  guess: { fontFamily: serif.regular, fontSize: 84, lineHeight: 88 },
  body: { fontFamily: serif.regular, fontSize: 18, lineHeight: 26 },
  bubble: { fontFamily: serif.regular, fontSize: 17, lineHeight: 24 },
  ui: { fontFamily: sans.regular, fontSize: 15, lineHeight: 22 },
  /** The website layout's line under a headline. */
  lead: { fontFamily: sans.regular, fontSize: 18, lineHeight: 28 },
  input: { fontFamily: sans.regular, fontSize: 16, lineHeight: 22 },
  button: { fontFamily: sans.semibold, fontSize: 16, lineHeight: 22 },
  pill: { fontFamily: sans.semibold, fontSize: 17, lineHeight: 22 },
  partLabel: { fontFamily: sans.regular, fontSize: 11, lineHeight: 14 },
  code: { fontFamily: mono.regular, fontSize: 14, lineHeight: 23 },
  inlineCode: { fontFamily: mono.regular, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: mono.regular, fontSize: 12, lineHeight: 16 },
  tag: { fontFamily: mono.regular, fontSize: 11, lineHeight: 16 },
} as const;

export const space = { xs: 4, s: 8, m: 12, l: 16, margin: 20, xl: 24, xxl: 32 } as const;
export const radius = { part: 8, chip: 8, bubble: 10, card: 10, field: 12, button: 12, iconButton: 12, point: 2, sheet: 20 } as const;
export const size = { touch: 48, button: 56, iconButton: 44, firefly: 40, point: 9, hitSlop: 4 } as const;
/** Milliseconds. The light changes one stage per proved point over 700 ms, and the just-lit sparks last 700 ms.
 *  Everything else moves once and briefly: a screen's blocks rise 12 px into place 60 ms apart, a new line of the
 *  conversation rises in, the firefly's line draws to the part it asks about, and controls answer hover and
 *  press. Nothing loops, blinks or pulses. With Reduce Motion on, the light still changes (it is the score) but
 *  without the crossfade, and the sparks, entrances and drawing are skipped. */
export const motion = { press: 120, feedback: 150, hover: 150, lightStep: 700, justLit: 700, sheet: 240, enter: 280, stagger: 60, rise: 12, leader: 320, typing: 18 } as const;

/** From this width the app lays out as a website: a header, the words on the left and the map on the right,
 *  where the light falls. Below it, the phone layout. */
export const wideFrom = 1000;
export const page = { max: 1320, gutter: 40, gap: 64, words: 480, header: 72, map: 600 } as const;

/** The phone layout's column, centered on a tablet or a narrow window. */
export const maxContentWidth = 520;

/** The interface font on the web, before Atkinson Hyperlegible Next loads (Clerk's form uses it too). */
export const webSans = "'AtkinsonHyperlegibleNext_400Regular', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const isWeb = Platform.OS === "web";
