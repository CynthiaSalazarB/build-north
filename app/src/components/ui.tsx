// Small building blocks every screen uses, styled only from the theme (round 6). A screen picks its
// tone (daylight or the cave) once, and everything inside takes its colors from it.
import type { Level } from "@build-north/agents";
import { StatusBar } from "expo-status-bar";
import { createContext, useContext, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityRole,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { stageOf } from "../session/present.ts";
import { maxContentWidth, palette, radius, serif, size, space, stageColor, type, type Colors, type Tone } from "../theme.ts";
import { Icon, Laurel, type IconName } from "./icons.tsx";

const ToneContext = createContext<Tone>("day");

/** The colors of the screen this component sits in. */
export function useColors(): Colors {
  return palette[useContext(ToneContext)];
}

/** Gives everything inside the colors of daylight or the cave. */
export function ToneScope({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <ToneContext.Provider value={tone}>{children}</ToneContext.Provider>;
}

/** A phone-width column, centered on wider screens (decision 14), in daylight or the cave. */
export function Screen({ tone = "day", edges = ["top", "bottom"], children }: { tone?: Tone; edges?: Edge[]; children: ReactNode }) {
  return (
    <ToneScope tone={tone}>
      <SafeAreaView style={[styles.safe, { backgroundColor: palette[tone].surface }]} edges={edges}>
        <StatusBar style={tone === "cave" ? "light" : "dark"} />
        <View style={styles.column}>{children}</View>
      </SafeAreaView>
    </ToneScope>
  );
}

type TextProps = { children: ReactNode; style?: StyleProp<TextStyle>; dim?: boolean; numberOfLines?: number; role?: AccessibilityRole };

function Styled({ base, children, style, dim, numberOfLines, role }: TextProps & { base: TextStyle }) {
  const c = useColors();
  return (
    <Text style={[base, { color: dim ? c.onSurfaceVariant : c.onSurface }, style]} numberOfLines={numberOfLines} accessibilityRole={role}>
      {children}
    </Text>
  );
}

export const LargeTitle = (p: TextProps) => <Styled base={type.largeTitle} role="header" {...p} />;
export const Title = (p: TextProps) => <Styled base={type.title} role="header" {...p} />;
/** Every question the tutor asks is italic. */
export const Question = (p: TextProps) => <Styled base={type.question} role="header" {...p} />;
export const Body = ({ italic, strong, ...p }: TextProps & { italic?: boolean; strong?: boolean }) => (
  <Styled base={italic ? type.bodyItalic : strong ? type.bodyStrong : type.body} {...p} />
);
export const Ui = ({ strong, ...p }: TextProps & { strong?: boolean }) => <Styled base={strong ? type.uiStrong : type.ui} {...p} />;
export const Footnote = ({ strong, ...p }: TextProps & { strong?: boolean }) => (
  <Styled base={strong ? type.footnoteStrong : type.footnote} {...p} />
);

/** The name as the brand kit sets it: "Reality *Check*". */
export function BrandTitle({ splash, style }: { splash?: boolean; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return (
    <Text style={[splash ? type.splash : type.largeTitle, { color: c.onSurface }, style]} accessibilityRole="header">
      {"Reality "}
      <Text style={{ fontFamily: splash ? serif.italic : serif.mediumItalic }}>Check</Text>
    </Text>
  );
}

export type ButtonKind = "primary" | "plain" | "hint" | "tonal";

type ButtonProps = {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  disabled?: boolean;
  busy?: boolean;
  /** Read out instead of the label, when the label alone isn't clear. */
  hint?: string;
  style?: StyleProp<ViewStyle>;
};

/** A capsule: the main action is bronze and full width; the others size to their label. */
export function Button({ label, onPress, kind = "primary", icon, disabled, busy, hint, style }: ButtonProps) {
  const c = useColors();
  const off = disabled || busy;
  const look = {
    primary: { box: { backgroundColor: c.primary }, ink: c.onPrimary, iconInk: c.onPrimary },
    plain: { box: null, ink: c.onSurface, iconInk: c.onSurface },
    hint: { box: { backgroundColor: palette.day.hintContainer }, ink: palette.day.onHintContainer, iconInk: palette.day.hintIcon },
    tonal: { box: { backgroundColor: c.surfaceContainer, borderColor: c.separator, borderWidth: 1 }, ink: c.onSurface, iconInk: c.onSurface },
  }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      disabled={off}
      onPress={onPress}
      hitSlop={kind === "primary" ? undefined : size.hitSlop}
      style={({ pressed }) => [
        styles.button,
        kind === "primary" ? styles.primary : styles.small,
        look.box,
        off && styles.disabled,
        pressed && !off && styles.pressed,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={look.ink} />
      ) : (
        <>
          {icon && <Icon name={icon} color={look.iconInk} />}
          <Text style={[type.uiStrong, { color: look.ink }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** A round control with an icon only (Close, Send). */
export function CircleButton({ icon, label, onPress, filled, disabled }: { icon: IconName; label: string; onPress: () => void; filled?: boolean; disabled?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={size.hitSlop}
      style={({ pressed }) => [
        styles.circle,
        filled ? { backgroundColor: c.primary } : { backgroundColor: c.surfaceContainer, borderColor: c.separator, borderWidth: StyleSheet.hairlineWidth },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Icon name={icon} color={filled ? c.onPrimary : c.onSurface} />
    </Pressable>
  );
}

/** A part's stage, with what that level means: "Clay · Guided". */
export function StageChip({ level }: { level: Level }) {
  const stage = stageOf(level);
  const look = stageColor[level];
  return (
    <View
      style={[styles.chip, look.fill ? { backgroundColor: look.fill } : styles.sketchChip, level === 3 && styles.plasterChip]}
      accessibilityLabel={`Level ${level}, ${stage.name}: ${stage.does}`}
    >
      <View style={[styles.chipDot, { backgroundColor: look.ink }]} />
      <Text style={[type.footnoteStrong, { color: look.ink }]}>{`${stage.name} · ${stage.does}`}</Text>
    </View>
  );
}

/** Done alone: no hint and no retry. */
export function AloneTag() {
  return (
    <View style={styles.alone} accessibilityLabel="Done alone">
      <Laurel color={palette.day.onAloneContainer} />
      <Text style={[type.footnoteStrong, { color: palette.day.onAloneContainer }]}>Alone</Text>
    </View>
  );
}

/** Points as filled dots: 1 of 2 is one filled, one open. */
export function PointDots({ points, max = 2 }: { points: number; max?: number }) {
  const c = useColors();
  return (
    <View style={styles.dots} accessibilityLabel={`${points} of ${max} points`}>
      {Array.from({ length: max }, (_, i) => (
        <View key={i} style={[styles.dot, { borderColor: c.primary }, i < points && { backgroundColor: c.primary }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  column: { flex: 1, width: "100%", maxWidth: maxContentWidth, alignSelf: "center" },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.s },
  primary: { height: size.button, borderRadius: radius.button, paddingHorizontal: space.xl, alignSelf: "stretch" },
  small: { height: size.control, borderRadius: radius.control, paddingHorizontal: space.l, alignSelf: "flex-start" },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.96 }] },
  circle: { width: size.control, height: size.control, borderRadius: radius.control, alignItems: "center", justifyContent: "center" },
  chip: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: space.s, height: 28, paddingLeft: space.s, paddingRight: space.m, borderRadius: radius.chip },
  sketchChip: { borderWidth: 1.5, borderStyle: "dashed", borderColor: palette.day.onSurfaceVariant },
  plasterChip: { borderWidth: 1, borderColor: palette.day.separator },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  alone: { flexDirection: "row", alignItems: "center", gap: space.xs, height: 24, paddingHorizontal: space.s, borderRadius: 12, backgroundColor: palette.day.aloneContainer },
  dots: { flexDirection: "row", gap: space.xs },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
});
