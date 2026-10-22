// Every color, font and size the app uses (#4), so the brand kit (#14, #46) changes this file only.
import { Platform } from "react-native";

/** The working name until the brand kit (#14). */
export const brand = { name: "Reality Check", tagline: "Map a concept in 4 parts. The help fades as you get better." } as const;

export const colors = {
  background: "#F6F5F1",
  surface: "#FFFFFF",
  surfaceMuted: "#EFEDE7",
  border: "#DEDAD0",
  text: "#1D1B16",
  textMuted: "#6B675C",
  primary: "#2F4BD8",
  onPrimary: "#FFFFFF",
  // one accent per kind of message, so the learner can tell who is speaking at a glance
  question: "#2F4BD8",
  feedback: "#6B675C",
  hint: "#B26A00",
  hintBackground: "#FFF4E0",
  example: "#5B4BB0",
  exampleBackground: "#F1EEFB",
  found: "#1F7A4D",
  foundBackground: "#E6F4EC",
  coach: "#1D1B16",
  learner: "#2F4BD8",
  learnerText: "#FFFFFF",
  error: "#B3261E",
  errorBackground: "#FCEBEA",
} as const;

export const fonts = {
  body: Platform.select({ web: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", default: undefined }),
  size: { small: 13, body: 16, large: 19, title: 26 },
  weight: { regular: "400", medium: "600", bold: "700" },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

/** Phone-first: on the web the same column is centered at this width (decision 14). */
export const maxContentWidth = 520;
