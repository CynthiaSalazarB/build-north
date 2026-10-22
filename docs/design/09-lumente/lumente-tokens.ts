// Round 9 "Lumente", the app's design (picked Oct 22): questions are the light. One theme whose background moves
// through the sky as points are proved; the text switches from light to dark ink at sunrise (5 points).
// Same role names as round 8's open-box-tokens.ts where a role still exists, so screens keep reading colors by name.
export const brand = { name: "Lumente", tagline: "Build with AI. Understand the concepts yourself." } as const;

/** Night to dawn (0 to 4 points): light ink on blue. */
const night = {
  surface: "#14234d",
  surfaceContainer: "#1a2a57",
  onSurface: "#f1f4fb",
  onSurfaceVariant: "#c4cde4",
  placeholder: "#c4cde4",
  separator: "rgba(241, 244, 251, 0.14)",
  outline: "rgba(241, 244, 251, 0.2)",
  // daylight white: the main action, and a part the learner lit
  primary: "#f4f6fb",
  onPrimary: "#0d1736",
  lit: "#f4f6fb",
  onLit: "#0d1736",
  litLabel: "#46526a",
  // amber: questions (the firefly's light), the part being asked, and Help
  firefly: "#f2b84b",
  question: "#f6c96e",
  questionContainer: "rgba(242, 184, 75, 0.12)",
  questionOutline: "#f2b84b",
  hintContainer: "#f6e3a8",
  onHintContainer: "#3a2a0e",
  hint: "#6e4604",
  // coral: the overconfidence gap, and nothing else
  gap: "#ff9b80",
  scrim: "rgba(5, 10, 26, 0.6)",
} as const;

export type Colors = { readonly [K in keyof typeof night]: string };

/** Sunrise to morning (5 to 8 points): dark ink on daylight. */
const day: Colors = {
  surface: "#f3e9dc",
  surfaceContainer: "#fdfdfb",
  onSurface: "#0d1736",
  onSurfaceVariant: "#3a4459",
  placeholder: "#3a4459",
  separator: "rgba(13, 23, 54, 0.1)",
  outline: "rgba(13, 23, 54, 0.2)",
  primary: "#0d1736",
  onPrimary: "#f4f6fb",
  lit: "#fdfdfb",
  onLit: "#0d1736",
  litLabel: "#46526a",
  firefly: "#f2b84b",
  question: "#6e4604",
  questionContainer: "rgba(242, 184, 75, 0.16)",
  questionOutline: "#c98a17",
  hintContainer: "#f6e3a8",
  onHintContainer: "#3a2a0e",
  hint: "#6e4604",
  gap: "#9e3420",
  scrim: "rgba(13, 23, 54, 0.35)",
};

export const palette = { night, day } as const;
export type Mode = keyof typeof palette;

/** The sky, one stage per point proved. Each stage is a vertical gradient: top, middle (at 55%) and bottom.
 *  Text sits on the top half and the middle; the input sits on its own surface at the bottom. */
export const sky = [
  { points: 0, name: "night", top: "#0d1736", mid: "#14234d", low: "#1f3566", mode: "night" },
  { points: 1, name: "night", top: "#0f1a3c", mid: "#192b57", low: "#2f4170", mode: "night" },
  { points: 2, name: "pre-dawn", top: "#13204a", mid: "#25366b", low: "#5a5684", mode: "night" },
  { points: 3, name: "first light", top: "#1a2a5a", mid: "#3c4a80", low: "#b07a6a", mode: "night" },
  { points: 4, name: "dawn", top: "#233466", mid: "#4b4f84", low: "#e3956f", mode: "night" },
  { points: 5, name: "sunrise", top: "#a9bcdf", mid: "#e7c9b0", low: "#f7d6a8", mode: "day" },
  { points: 6, name: "morning", top: "#b8cae6", mid: "#efdcc8", low: "#f8e2bf", mode: "day" },
  { points: 7, name: "morning", top: "#cfdcef", mid: "#f3e9dc", low: "#f8ecd7", mode: "day" },
  { points: 8, name: "morning", top: "#e2ebf7", mid: "#f6f2ea", low: "#f9f4ea", mode: "day" },
] as const;

/** Start, the guess (before locking it in), every session screen until the fifth point, and level 5 open at night. */
export const skyFor = (points: number) => sky[Math.max(0, Math.min(8, Math.round(points)))];

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
  /** A thin line joins the concept to each part: dashed while the part is unasked, amber while it is asked, solid once lit. */
  lineWidth: 1.2,
} as const;

/** A part's look. "?" until answered; the learner's own words once lit. */
export const partState = {
  unasked: { border: "1px dashed onSurfaceVariant at 32%", fill: "surface at 45%", text: "?" },
  asked: { border: "1.5px solid questionOutline", fill: "questionContainer", glow: "firefly at 35%", text: "?" },
  lit: { border: "1px solid lit", fill: "lit", text: "the learner's words", ink: "onLit" },
  justLit: { same: "lit", plus: "two soft rings and a glow for 700 ms, the moment a part is proved" },
  revealed: { border: "1px dashed onSurfaceVariant at 50%", fill: "onSurface at 10%", text: "the answer, italic", note: "shown, 0 points: its light was not earned" },
} as const;

/** Two points per part, drawn as two dots next to its label. */
export const pointState = {
  earned: "filled with onLit",
  open: "ring at 35-45%",
  capped: "dotted ring: after a retry or Help the part can light 1 point at most",
  claimed: "amber dot on the guess screen: a point the learner expects to prove",
  missed: "dashed coral ring on the result: claimed in the guess, not proved",
} as const;

/** The firefly: the tutor that asks, and Help. It never reacts to the score. */
export const firefly = {
  asks: { size: 40, halo: 0.5, body: "#f2b84b", note: "next to each question; a soft amber beam points at the asked part" },
  checking: { size: 40, halo: 0.6, body: "#f2b84b", pulseMs: 1600, label: "checking", note: "while the answer is evaluated (2 to 8 s); role=status" },
  helps: { size: 48, halo: 0.75, body: "#f6c662", note: "tapped: closer and brighter; its light becomes the hint card" },
  fades: { size: 28, halo: 0, opacity: 0.4, body: "#d9b25e", note: "on the result, in daylight, it is barely there" },
  /** Drawn in a 56 x 56 viewBox: two wings, two antennae, a round amber body, two eyes in the night color. */
  drawing: {
    wings: [{ cx: 19, cy: 20, rx: 8, ry: 4.5, rotate: -28 }, { cx: 37, cy: 20, rx: 8, ry: 4.5, rotate: 28 }],
    antennae: "M24 18 L21 10 M32 18 L35 10",
    body: { cx: 28, cy: 30, r: 10.5 },
    eyes: [{ cx: 24.6, cy: 28.6, r: 1.7 }, { cx: 31.4, cy: 28.6, r: 1.7 }],
  },
} as const;

/** Newsreader carries the tutor's voice and the learner's words; Atkinson Hyperlegible Next carries the interface;
 *  Atkinson Hyperlegible Mono carries code, points and the test readout. All three from @expo-google-fonts. */
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
  title: { fontFamily: serif.regular, fontSize: 30, lineHeight: 36 },
  question: { fontFamily: serif.italic, fontSize: 23, lineHeight: 30 },
  concept: { fontFamily: serif.regular, fontSize: 30, lineHeight: 36 },
  partText: { fontFamily: serif.regular, fontSize: 15, lineHeight: 18 },
  gap: { fontFamily: serif.regular, fontSize: 84, lineHeight: 80 },
  guess: { fontFamily: serif.regular, fontSize: 84, lineHeight: 88 },
  body: { fontFamily: serif.regular, fontSize: 18, lineHeight: 26 },
  ui: { fontFamily: sans.regular, fontSize: 15, lineHeight: 22 },
  button: { fontFamily: sans.semibold, fontSize: 16, lineHeight: 22 },
  partLabel: { fontFamily: sans.regular, fontSize: 11, lineHeight: 14 },
  code: { fontFamily: mono.regular, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: mono.regular, fontSize: 12, lineHeight: 16 },
} as const;

export const space = { xs: 4, s: 8, m: 12, l: 16, margin: 20, xl: 24, xxl: 32 } as const;
export const radius = { part: 14, bubble: 18, card: 18, field: 30, button: 28, iconButton: 22 } as const;
export const size = { touch: 48, button: 56, iconButton: 44, firefly: 40, point: 9 } as const;
/** The sky changes one stage per proved point; the just-lit glow and the firefly's pulse are the only other motion.
 *  With reduced motion on, the sky still changes (it is the score) but without the crossfade. */
export const motion = { press: 120, feedback: 150, skyStep: 700, justLit: 700, pulse: 1600 } as const;
