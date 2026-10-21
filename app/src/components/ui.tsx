// Small building blocks every screen uses, styled only from the theme (round 8 "Open Box"). Colors come
// from the theme's current mode, so nothing here holds a color of its own.
import { StatusBar } from "expo-status-bar";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type AccessibilityRole,
  type LayoutChangeEvent,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets, type Edge } from "react-native-safe-area-context";
import { defaultTheme, maxContentWidth, palette, radius, size, space, type, useMode, type Colors } from "../theme.ts";
import { Icon, type IconName } from "./icons.tsx";

/** The colors of the theme's current mode (day or night). */
export function useColors(): Colors {
  return palette[defaultTheme][useMode()];
}

/** A phone-width column, centered on wider screens (decision 14). */
export function Screen({ edges = ["top", "bottom"], children }: { edges?: Edge[]; children: ReactNode }) {
  const c = useColors();
  const night = useMode() === "night";
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.surface }]} edges={edges}>
      <StatusBar style={night ? "light" : "dark"} />
      <View style={styles.column}>{children}</View>
    </SafeAreaView>
  );
}

/** Keeps a screen's bottom input above the keyboard, inside a Screen. The app draws edge to edge (SDK 54
 * and later), so Android no longer shrinks the window for the keyboard. React Native measures this view
 * from its parent, the column below the status bar, so the top inset is the offset. */
export function KeyboardSafe({ children }: { children: ReactNode }) {
  const { top } = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={top}>
      {children}
    </KeyboardAvoidingView>
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

export const Title = (p: TextProps) => <Styled base={type.title} role="header" {...p} />;
export const SheetTitle = (p: TextProps) => <Styled base={type.sheetTitle} role="header" {...p} />;
/** Every question the tutor asks is italic. */
export const Question = (p: TextProps) => <Styled base={type.question} role="header" {...p} />;
export const Body = ({ strong, ...p }: TextProps & { strong?: boolean }) => <Styled base={strong ? type.bodyStrong : type.body} {...p} />;
/** Mono, for code, file names and the labels above things. */
export const Label = ({ strong, ...p }: TextProps & { strong?: boolean }) => <Styled base={strong ? type.labelStrong : type.label} {...p} />;
export const Code = (p: TextProps) => <Styled base={type.code} {...p} />;

export type ButtonKind = "primary" | "secondary" | "text" | "hint";

type ButtonProps = {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  disabled?: boolean;
  busy?: boolean;
  /** Read out instead of the label, when the label alone isn't clear. */
  hint?: string;
  /** A main-action button that sizes to its label, for a bar (Submit). */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** The main action is a full-width 56dp button; the others size to their label. Help is the amber outline. */
export function Button({ label, onPress, kind = "primary", icon, disabled, busy, hint, compact, style }: ButtonProps) {
  const c = useColors();
  const off = disabled || busy;
  const look = {
    primary: { box: { backgroundColor: c.primary }, ink: c.onPrimary },
    secondary: { box: { backgroundColor: c.surfaceHigh, borderColor: c.outline, borderWidth: 1 }, ink: c.onSurface },
    text: { box: null, ink: c.onSurface },
    hint: { box: { borderColor: c.hintOutline, borderWidth: 1 }, ink: c.hint },
  }[kind];
  const full = kind === "primary" && !compact;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      disabled={off}
      onPress={onPress}
      hitSlop={full ? undefined : size.hitSlop}
      style={({ pressed }) => [
        styles.button,
        full ? styles.full : kind === "text" ? styles.textButton : styles.small,
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
          {icon && <Icon name={icon} color={look.ink} size={18} />}
          <Text style={[kind === "hint" ? type.labelStrong : type.button, { color: look.ink }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** A square control with an icon only (Close). */
export function IconButton({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={size.hitSlop}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: c.surfaceHigh }, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <Icon name={icon} color={c.onSurface} />
    </Pressable>
  );
}

/** A concept in mono, picked in one tap; the picked one is filled. */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={size.hitSlop}
      style={({ pressed }) => [
        styles.chip,
        selected ? { backgroundColor: c.primary } : { backgroundColor: c.surfaceHigh, borderColor: c.outline, borderWidth: StyleSheet.hairlineWidth },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[type.chip, { color: selected ? c.onPrimary : c.onSurface }]}>{label}</Text>
    </Pressable>
  );
}

/** A rounded panel on the surface. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.surfaceContainer, borderColor: c.outline }, style]}>{children}</View>;
}

/** A web textarea is two rows tall and never grows, so a multiline field there takes its rows from its text:
 * about 8 px a character, up to 4 rows (then it scrolls). Android sizes the field itself. */
const webRows = (text: string, width: number) =>
  Math.min(4, text.split("\n").reduce((rows, line) => rows + Math.max(1, Math.ceil((line.length * 8) / Math.max(width, 1))), 0));

/** A one-line field that starts with a `›` prompt, like a terminal; `end` sits inside it on the right. */
export function PromptField({ end, style, onFocus, onBlur, ...input }: TextInputProps & { end?: ReactNode }) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  // the whole field shows focus, so the browser's own ring around the inner text area goes
  const [focused, setFocused] = useState(false);
  const web = Platform.OS === "web" && input.multiline ? { rows: webRows(input.value ?? "", width), onLayout: (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width) } : null;
  return (
    <View style={[styles.field, { backgroundColor: c.surfaceContainer, borderColor: focused ? c.onSurfaceVariant : c.outline }, style]}>
      <Text style={[type.code, styles.prompt, { color: c.onSurfaceVariant }]} accessible={false}>
        ›
      </Text>
      <TextInput
        placeholderTextColor={c.placeholder}
        {...input}
        {...web}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[type.body, styles.input, { color: c.onSurface }, Platform.OS === "web" && styles.noRing]}
      />
      {end}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  column: { flex: 1, width: "100%", maxWidth: maxContentWidth, alignSelf: "center" },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.s },
  full: { height: size.button, borderRadius: radius.button, paddingHorizontal: space.xl, alignSelf: "stretch" },
  small: { height: size.smallButton, borderRadius: radius.iconButton, paddingHorizontal: space.l, alignSelf: "flex-start" },
  textButton: { height: size.touch, paddingHorizontal: space.l, alignSelf: "center" },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.97 }] },
  iconButton: { width: 44, height: 44, borderRadius: radius.iconButton, alignItems: "center", justifyContent: "center" },
  chip: { height: size.chip, borderRadius: radius.chip, paddingHorizontal: space.m, justifyContent: "center" },
  card: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, padding: space.l },
  field: {
    flexDirection: "row",
    alignItems: "flex-end",
    minHeight: size.button,
    borderRadius: radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: space.l,
    paddingRight: space.s,
    paddingVertical: space.s,
    gap: space.s,
  },
  prompt: { paddingBottom: space.s },
  // grows with a long answer; on Android a custom line height or centering hides all but the last line
  input: { flex: 1, maxHeight: 128, paddingVertical: space.s, textAlignVertical: "top" },
  // a browser's "auto" ring ignores a width of 0, so the style is solid
  noRing: { outlineStyle: "solid", outlineWidth: 0 },
});
