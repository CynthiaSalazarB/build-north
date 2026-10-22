// Round 9 "Lumente", the app's design (picked Oct 22): questions are the light. A near-black screen with a warm
// light that grows from the top-right corner, one stage per point proved; the text switches from light to dark ink
// at 5 points, when the light fills the screen. Nothing blinks or pulses: the firefly shines steadily.
// Same role names as round 8's open-box-tokens.ts where a role still exists, so screens keep reading colors by name.
export const brand = { name: "Lumente", tagline: "Build with AI. Understand the concepts yourself." } as const;

/** Dark (0 to 4 points): light ink on near-black. */
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
  // amber: questions (the firefly's light), the part being asked, and Help
  firefly: "#f2b84b",
  question: "#f6c96e",
  questionContainer: "rgba(40, 28, 14, 0.85)",
  questionOutline: "#f2b84b",
  hintContainer: "#f6e3a8",
  onHintContainer: "#3a2a0e",
  hint: "#6e4604",
  // coral: the overconfidence gap, and nothing else
  gap: "#ff9b80",
  gridMajor: "rgba(255, 240, 225, 0.07)",
  gridMinor: "rgba(255, 240, 225, 0.03)",
  scrim: "rgba(0, 0, 0, 0.6)",
} as const;

export type Colors = { readonly [K in keyof typeof night]: string };

/** Lit (5 to 8 points): dark ink on warm light. */
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
  firefly: "#f2b84b",
  question: "#6e4604",
  questionContainer: "rgba(242, 184, 75, 0.18)",
  questionOutline: "#a8740f",
  hintContainer: "#f6e3a8",
  onHintContainer: "#3a2a0e",
  hint: "#6e4604",
  gap: "#9e3420",
  gridMajor: "rgba(23, 22, 26, 0.06)",
  gridMinor: "rgba(23, 22, 26, 0.025)",
  scrim: "rgba(23, 22, 26, 0.35)",
};

export const palette = { night, day } as const;
export type Mode = keyof typeof palette;

/** The near-black under the light, top to bottom. */
export const base = { top: "#111114", bottom: "#16151a" } as const;

/** The light, one stage per point proved: a radial gradient from the top-right corner (`circle at 100% 0%`),
 *  stops in percent of the distance to the far corner. Dark stages sit over `base`; lit stages are opaque. */
export const light = [
  { points: 0, name: "dark", mode: "night", stops: [["rgba(255, 210, 150, 0.5)", 0], ["rgba(200, 120, 60, 0.22)", 10], ["rgba(17, 17, 20, 0)", 26]] },
  { points: 1, name: "dark", mode: "night", stops: [["rgba(255, 214, 158, 0.65)", 0], ["rgba(210, 130, 66, 0.35)", 10], ["rgba(120, 68, 36, 0.18)", 24], ["rgba(17, 17, 20, 0)", 40]] },
  { points: 2, name: "first light", mode: "night", stops: [["rgba(255, 218, 164, 0.8)", 0], ["rgba(224, 148, 80, 0.55)", 10], ["rgba(140, 80, 42, 0.3)", 26], ["rgba(17, 17, 20, 0)", 50]] },
  { points: 3, name: "spreading", mode: "night", stops: [["rgba(255, 222, 170, 0.95)", 0], ["rgba(236, 165, 95, 0.75)", 9], ["rgba(150, 85, 45, 0.5)", 22], ["rgba(90, 50, 28, 0.3)", 45], ["rgba(17, 17, 20, 0)", 65]] },
  { points: 4, name: "most of the map", mode: "night", stops: [["rgba(255, 230, 185, 1)", 0], ["rgba(242, 175, 105, 0.8)", 12], ["rgba(170, 98, 52, 0.5)", 28], ["rgba(100, 56, 30, 0.32)", 52], ["rgba(17, 17, 20, 0)", 75]] },
  { points: 5, name: "lit", mode: "day", stops: [["#fff4e0", 0], ["#fbdeb4", 35], ["#ecbe8c", 70], ["#deaa7a", 100]] },
  { points: 6, name: "lit", mode: "day", stops: [["#fff7e8", 0], ["#fce6c3", 40], ["#f2cda0", 75], ["#e8bc8e", 100]] },
  { points: 7, name: "lit", mode: "day", stops: [["#fffaf0", 0], ["#fdeed4", 45], ["#f6dcb8", 80], ["#eecea6", 100]] },
  { points: 8, name: "full light", mode: "day", stops: [["#fffcf6", 0], ["#fef5e6", 50], ["#f9ead4", 85], ["#f4e0c4", 100]] },
] as const;

export const lightFor = (points: number) => light[Math.max(0, Math.min(8, Math.round(points)))];

/** The background for a stage, as CSS (web). On native, draw `base` with expo-linear-gradient, then the light on top. */
export const lightCss = (points: number) => {
  const stage = lightFor(points);
  const glow = `radial-gradient(circle at 100% 0%, ${stage.stops.map(([c, at]) => `${c} ${at}%`).join(", ")})`;
  return stage.mode === "night" ? `${glow}, linear-gradient(180deg, ${base.top} 0%, ${base.bottom} 100%)` : glow;
};

/** A faint graph-paper grid over every screen: 1px lines every 24px, stronger every 96px. */
export const grid = { minor: 24, major: 96, offset: { x: 13, y: 9 } } as const;

/** The map: the concept in the middle, one part on each side, in the mentefact layout. Positions are in a
 *  372 x 296 box; the parts are asked in MOVE_ORDER (agents/src/contracts.ts). Icons are 24 x 24 stroke paths. */
export const map = {
  box: { width: 372, height: 296 },
  concept: { x: 134, y: 128, width: 104 },
  parts: {
    supraordinate: { label: "bigger group", x: 96, y: 0, width: 180, icon: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 11a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z" },
    exclusion: { label: "what it isn't", x: 244, y: 106, width: 128, icon: "M5 9h14M5 15h14M16 4L8 20" },
    isoordinate: { label: "what it needs", x: 0, y: 106, width: 128, icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
    infraordinate: { label: "types", x: 96, y: 212, width: 180, icon: "M12 3v7M12 10L5 20M12 10v10M12 10l7 10" },
  },
  /** A 1px line joins the concept to each part, with a 2.5px dot where it meets the part: dashed while the part is
   *  unasked, amber while it is asked, solid once lit. */
  line: { width: 1, dot: 2.5 },
} as const;

/** A part's look. "?" until answered; the learner's own words once lit. */
export const partState = {
  unasked: { border: "1px dashed onSurfaceVariant at 34%", fill: "surface at 65%", text: "?" },
  asked: { border: "1.5px solid questionOutline", fill: "questionContainer", glow: "firefly at 40%, 14px", text: "?" },
  lit: { border: "1px solid lit", fill: "lit", text: "the learner's words", ink: "onLit" },
  justLit: { same: "lit", plus: "a 3px amber ring and six short amber sparks around the part, for 700 ms" },
  revealed: { border: "1px dashed onSurfaceVariant at 50%", fill: "onSurface at 8%", text: "the answer, italic", note: "shown, 0 points: its light was not earned" },
} as const;

/** Two points per part, drawn as two small squares (2px corners) next to its label. */
export const pointState = {
  earned: "filled with onLit",
  open: "outline at 35-45%",
  capped: "dotted outline: after a retry or Help the part can light 1 point at most",
  claimed: "amber square on the guess screen: a point the learner expects to prove",
  missed: "dashed coral outline on the result: claimed in the guess, not proved",
} as const;

/** The firefly: the tutor that asks, and Help. It shines steadily (no blinking or pulsing) and never reacts to the score. */
export const firefly = {
  asks: { size: 40, halo: 0.55, body: "#f2b84b", note: "next to each question; a dashed amber line runs from it to the asked part" },
  checking: { size: 40, halo: 0.55, body: "#f2b84b", label: "checking", note: "while the answer is evaluated (2 to 8 s); role=status; the input is disabled" },
  helps: { size: 48, halo: 0.78, body: "#f6c662", note: "tapped: closer and brighter; its light becomes the hint card" },
  fades: { size: 26, halo: 0, opacity: 0.4, body: "#d9a64a", note: "on the result, once the light fills the screen, it is barely there" },
  /** Drawn in a 56 x 56 viewBox: two wings, two antennae, a round amber body, two eyes in the base color. */
  drawing: {
    wings: [{ cx: 19, cy: 20, rx: 8, ry: 4.5, rotate: -28 }, { cx: 37, cy: 20, rx: 8, ry: 4.5, rotate: 28 }],
    antennae: "M24 18 L21 10 M32 18 L35 10",
    body: { cx: 28, cy: 30, r: 10.5 },
    eyes: [{ cx: 24.6, cy: 28.6, r: 1.7 }, { cx: 31.4, cy: 28.6, r: 1.7 }],
  },
  /** From the firefly to the asked part: 1.5px, dashed 4 4, amber, with a 3px dot at the part. */
  leader: { width: 1.5, dash: [4, 4], dot: 3 },
} as const;

/** Start opens on the learner's code: an editor block with line numbers, the concept's line in amber with a
 *  static amber cursor at the end, one dim line above and below. */
export const editor = { fontSize: 14, lineHeight: 23, gutter: 34, radius: 8 } as const;

/** Newsreader carries the tutor's voice and the learner's words, always upright; Atkinson Hyperlegible Next carries
 *  the interface; Atkinson Hyperlegible Mono carries code, points and the test readout. All from @expo-google-fonts. */
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
  title: { fontFamily: serif.medium, fontSize: 30, lineHeight: 36 },
  question: { fontFamily: serif.medium, fontSize: 22, lineHeight: 30 },
  concept: { fontFamily: serif.regular, fontSize: 30, lineHeight: 36 },
  partText: { fontFamily: serif.regular, fontSize: 15, lineHeight: 18 },
  revealedText: { fontFamily: serif.italic, fontSize: 14, lineHeight: 17 },
  gap: { fontFamily: serif.regular, fontSize: 84, lineHeight: 80 },
  guess: { fontFamily: serif.regular, fontSize: 84, lineHeight: 88 },
  body: { fontFamily: serif.regular, fontSize: 18, lineHeight: 26 },
  ui: { fontFamily: sans.regular, fontSize: 15, lineHeight: 22 },
  button: { fontFamily: sans.semibold, fontSize: 16, lineHeight: 22 },
  partLabel: { fontFamily: sans.regular, fontSize: 11, lineHeight: 14 },
  code: { fontFamily: mono.regular, fontSize: 14, lineHeight: 23 },
  label: { fontFamily: mono.regular, fontSize: 12, lineHeight: 16 },
} as const;

export const space = { xs: 4, s: 8, m: 12, l: 16, margin: 20, xl: 24, xxl: 32 } as const;
export const radius = { part: 8, chip: 8, bubble: 10, card: 10, field: 12, button: 12, iconButton: 12, point: 2 } as const;
export const size = { touch: 48, button: 56, iconButton: 44, firefly: 40, point: 9 } as const;
/** The light changes one stage per proved point, and the just-lit sparks last 700 ms. Nothing else moves: no
 *  blinking, no pulsing. With reduced motion on, the light still changes (it is the score) but without the crossfade. */
export const motion = { press: 120, feedback: 150, lightStep: 700, justLit: 700 } as const;
