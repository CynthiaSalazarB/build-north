// Small building blocks every screen uses (round 9 "Lumente"). A Screen sets the light (the points proved, 0 to
// 8); everything inside reads its colors from that light's mode, dark ink once the light fills the screen at 5.
// Nothing here holds a color of its own.
import { StatusBar } from "expo-status-bar";
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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
import { lightFor, maxContentWidth, palette, radius, size, space, type, type Colors, type Mode } from "../theme.ts";
import { Icon, type IconName } from "./icons.tsx";
import { Light } from "./light.tsx";

const LightContext = createContext(0);

/** Dark (0 to 4 points) or lit (5 to 8): the light of the screen this is drawn on. */
export function useMode(): Mode {
  return lightFor(useContext(LightContext)).mode;
}

/** The colors for the light of the screen this is drawn on. */
export function useColors(): Colors {
  return palette[useMode()];
}

/** A phone-width column over the light, centered on wider screens (decision 14). `light` is the points proved:
 * the session's light grows with them; Start, sign-in and errors stay at 0. */
export function Screen({ light = 0, edges = ["top", "bottom"], children }: { light?: number; edges?: Edge[]; children: ReactNode }) {
  const mode = lightFor(light).mode;
  return (
    <LightContext.Provider value={light}>
      <View style={styles.flex}>
        <Light points={light} />
        <SafeAreaView style={styles.flex} edges={edges}>
          <StatusBar style={mode === "night" ? "light" : "dark"} />
          <View style={styles.column}>{children}</View>
        </SafeAreaView>
      </View>
    </LightContext.Provider>
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
/** The firefly's questions: Newsreader, medium, upright. */
export const Question = (p: TextProps) => <Styled base={type.question} {...p} />;
/** The firefly's other lines: a nudge, a revealed answer, "You ask now". */
export const Reply = (p: TextProps) => <Styled base={type.reply} {...p} />;
export const Body = (p: TextProps) => <Styled base={type.body} {...p} />;
/** The interface's own words, in Atkinson Hyperlegible Next. */
export const Small = (p: TextProps) => <Styled base={type.ui} {...p} />;
/** Mono, for points, the test readout and the labels above things. */
export const Label = (p: TextProps) => <Styled base={type.label} {...p} />;
export const Tag = (p: TextProps) => <Styled base={type.tag} {...p} />;

export type ButtonKind = "primary" | "secondary" | "text" | "hint";

type ButtonProps = {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  busy?: boolean;
  /** Read out instead of the label, when the label alone isn't clear. */
  hint?: string;
  style?: StyleProp<ViewStyle>;
};

/** The main action is a full-width 56 px button in warm light (dark ink once the screen is lit). Secondary and
 * "More help" are outlines that size to their label; text buttons have no box. */
export function Button({ label, onPress, kind = "primary", disabled, busy, hint, style }: ButtonProps) {
  const c = useColors();
  const off = disabled || busy;
  const look = {
    primary: { box: [styles.full, { backgroundColor: c.primary }], ink: c.onPrimary },
    secondary: { box: [styles.small, { backgroundColor: c.controlFill, borderColor: c.outline, borderWidth: 1 }], ink: c.onSurface },
    text: { box: [styles.textButton], ink: c.onSurface },
    hint: { box: [styles.small, { backgroundColor: c.controlFill, borderColor: "rgba(242, 184, 75, 0.6)", borderWidth: 1 }], ink: c.question },
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
      style={({ pressed }) => [styles.button, look.box, off && styles.disabled, pressed && !off && styles.pressed, style]}
    >
      {busy ? (
        <ActivityIndicator color={look.ink} />
      ) : (
        <Text style={[type.button, kind === "hint" && styles.hintLabel, { color: look.ink }]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** A square control with an icon only (Close, −, +). */
export function IconButton({ icon, label, onPress, disabled, big = false }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; big?: boolean }) {
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
        styles.iconButton,
        big && styles.bigIcon,
        { backgroundColor: c.controlFill, borderColor: c.outline },
        disabled && styles.faint,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Icon name={icon} color={c.onSurface} size={big ? 20 : 18} />
    </Pressable>
  );
}

/** A concept, picked in one tap; the picked one is amber. */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? { backgroundColor: "rgba(242, 184, 75, 0.16)", borderColor: c.firefly } : { backgroundColor: c.controlFill, borderColor: c.outline },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[type.ui, { color: selected ? c.question : c.onSurface }]}>{label}</Text>
    </Pressable>
  );
}

/** A panel on the light. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.surfaceContainer, borderColor: c.fieldEdge }, style]}>{children}</View>;
}

/** A web textarea is two rows tall and never grows, so a multiline field there takes its rows from its text:
 * about 8 px a character, up to 4 rows (then it scrolls). Android sizes the field itself. */
const webRows = (text: string, width: number) =>
  Math.min(4, text.split("\n").reduce((rows, line) => rows + Math.max(1, Math.ceil((line.length * 8) / Math.max(width, 1))), 0));

/** The input bar: a field with `end` (the send button) inside it on the right. `glow` is level 5's amber, where
 * the light is the learner's own. */
export function PromptField({ end, style, glow = false, onFocus, onBlur, ...input }: TextInputProps & { end?: ReactNode; glow?: boolean }) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  // the whole field shows focus, so the browser's own ring around the inner text area goes
  const [focused, setFocused] = useState(false);
  const web = Platform.OS === "web" && input.multiline ? { rows: webRows(input.value ?? "", width), onLayout: (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width) } : null;
  const edge = glow ? { borderColor: c.firefly, borderWidth: 1.5, boxShadow: "0 0 18px rgba(242, 184, 75, 0.25)" } : { borderColor: focused ? c.outline : c.fieldEdge, borderWidth: 1 };
  return (
    <View style={[styles.field, { backgroundColor: c.surfaceContainer }, edge, style]}>
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
        // no custom line height: on Android it hides all but the last line of a long answer
        style={[styles.input, { color: c.onSurface, fontFamily: type.input.fontFamily, fontSize: type.input.fontSize }, Platform.OS === "web" && styles.noRing]}
      />
      {end}
    </View>
  );
}

/** The square send button inside the input bar; amber at level 5. */
export function SendButton({ busy, disabled, onPress, label = "Send", amber = false }: { busy: boolean; disabled: boolean; onPress: () => void; label?: string; amber?: boolean }) {
  const c = useColors();
  const off = busy || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={busy ? "Sending" : label}
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      hitSlop={size.hitSlop}
      style={({ pressed }) => [styles.send, { backgroundColor: amber ? c.firefly : c.primary }, off && styles.faint, pressed && !off && styles.pressed]}
    >
      {busy ? <ActivityIndicator color={c.onPrimary} /> : <Icon name="up" color={amber ? palette.night.onPrimary : c.onPrimary} />}
    </Pressable>
  );
}

/** A sheet that rises over the screen, with a scrim that closes it. */
export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const c = useColors();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.flex, { backgroundColor: c.scrim }]} onPress={onClose} accessibilityRole="button" accessibilityLabel={`Close ${label}`} />
      <View style={[styles.sheet, { backgroundColor: c.surfaceContainer, borderColor: c.fieldEdge }]} accessibilityViewIsModal>
        <View style={[styles.grabber, { backgroundColor: c.outline }]} />
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  column: { flex: 1, width: "100%", maxWidth: maxContentWidth, alignSelf: "center" },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.s },
  full: { height: size.button, borderRadius: radius.button, paddingHorizontal: space.xl, alignSelf: "stretch" },
  small: { height: size.touch, borderRadius: radius.button, paddingHorizontal: 14, alignSelf: "flex-start" },
  textButton: { height: size.touch, paddingHorizontal: space.l, alignSelf: "center" },
  hintLabel: { fontSize: 15 },
  disabled: { opacity: 0.45 },
  faint: { opacity: 0.35 },
  pressed: { transform: [{ scale: 0.97 }] },
  iconButton: { width: size.iconButton, height: size.iconButton, borderRadius: radius.iconButton, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  bigIcon: { width: size.button, height: size.button },
  chip: { height: size.iconButton, borderRadius: radius.chip, borderWidth: 1, paddingHorizontal: 14, justifyContent: "center" },
  card: { borderRadius: radius.card, borderWidth: 1, padding: space.l },
  field: { flexDirection: "row", alignItems: "flex-end", borderRadius: radius.field, padding: 6, gap: space.s },
  // grows with a long answer; on Android a custom line height or centering hides all but the last line
  input: { flex: 1, minHeight: size.iconButton, maxHeight: 132, paddingHorizontal: space.m, paddingVertical: 11, textAlignVertical: "top" },
  // a browser's "auto" ring ignores a width of 0, so the style is solid
  noRing: { outlineStyle: "solid", outlineWidth: 0 },
  send: { width: size.iconButton, height: size.iconButton, borderRadius: radius.part, alignItems: "center", justifyContent: "center" },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: space.margin,
    paddingTop: space.m,
    paddingBottom: space.xxl,
    gap: space.m,
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
  },
  grabber: { alignSelf: "center", width: 36, height: 4, borderRadius: 2 },
});
