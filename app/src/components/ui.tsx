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
  useWindowDimensions,
  View,
  type AccessibilityRole,
  type LayoutChangeEvent,
  type PressableStateCallbackType,
  type StyleProp,
  type TextInputKeyPressEvent,
  type TextInputProps,
  type TextInputSubmitEditingEvent,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, { css, cubicBezier, useReducedMotion, type CSSAnimationProperties } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets, type Edge } from "react-native-safe-area-context";
import { isWeb, lightFor, maxContentWidth, motion, page, palette, radius, size, space, type, wideFrom, type Colors, type Mode } from "../theme.ts";
import { Icon, type IconName } from "./icons.tsx";
import { Light } from "./light.tsx";
import { voiceLabel, type VoiceState } from "./voice.ts";

const LightContext = createContext(0);

/** The website layout: a header, and the words beside the map. Below `wideFrom`, the phone layout. */
export function useWide(): boolean {
  return useWindowDimensions().width >= wideFrom;
}

/** A Pressable's state; react-native-web adds hover and focus to the press. */
type Interaction = PressableStateCallbackType & { hovered?: boolean; focused?: boolean };

/** On the web a control eases between rest, hover and press instead of snapping (react-native-web passes these
 * style properties through to CSS; React Native's own types don't list them). */
const easeOnWeb = isWeb
  ? (({ transitionProperty: "transform, background-color, border-color, box-shadow, opacity", transitionDuration: `${motion.hover}ms`, transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)" }) as unknown as ViewStyle)
  : null;

/** Entrances are CSS animations (Reanimated's on a phone, the browser's own on the web), which run once when a
 * block mounts and leave its layout alone. */
const riseIn = css.keyframes({ from: { opacity: 0, transform: [{ translateY: motion.rise }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } });
const fadeIn = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
export const easeOut = cubicBezier(0.16, 1, 0.3, 1);

/** The style that brings a block in when it mounts, `order` steps (60 ms each) after the screen's first: rising
 * 12 px, or only fading for a drawing. Nothing with Reduce Motion: the block is simply there. */
export function useEntrance(): (order?: number, kind?: "rise" | "fade") => CSSAnimationProperties | null {
  const still = useReducedMotion();
  return (order = 0, kind = "rise") =>
    still
      ? null
      : { animationName: kind === "rise" ? riseIn : fadeIn, animationDuration: motion.enter, animationDelay: order * motion.stagger, animationTimingFunction: easeOut, animationFillMode: "backwards" };
}

export function Rise({ order = 0, style, children }: { order?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const entrance = useEntrance();
  return <Animated.View style={[style, entrance(order)]}>{children}</Animated.View>;
}

/** Dark (0 to 4 points) or lit (5 to 8): the light of the screen this is drawn on. */
export function useMode(): Mode {
  return lightFor(useContext(LightContext)).mode;
}

/** The colors for the light of the screen this is drawn on. */
export function useColors(): Colors {
  return palette[useMode()];
}

/** A screen over the light: a phone-width column, centered on a tablet or a narrow window; from `wideFrom`, a page
 * up to `page.max` wide. `light` is the points proved: the session's light grows with them; Start, sign-in and
 * errors stay at 0. */
export function Screen({ light = 0, edges = ["top", "bottom"], children }: { light?: number; edges?: Edge[]; children: ReactNode }) {
  const mode = lightFor(light).mode;
  const wide = useWide();
  return (
    <LightContext.Provider value={light}>
      <View style={styles.flex}>
        <Light points={light} />
        <SafeAreaView style={styles.flex} edges={edges}>
          <StatusBar style={mode === "night" ? "light" : "dark"} />
          <View style={[styles.column, { maxWidth: wide ? page.max : maxContentWidth }]}>{children}</View>
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
  /** A main action sized to its label instead of the full width: the website layout's buttons. */
  fit?: boolean;
  /** An opaque secondary button, for the header, where the light's corner would wash out a see-through one. */
  solid?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** The main action is a 56 px button in warm light (dark ink once the screen is lit), full width on a phone.
 * Secondary and "More help" are outlines that size to their label; text buttons have no box. On the web each
 * answers hover: the main action glows, an outline firms up, a text button underlines. */
export function Button({ label, onPress, kind = "primary", disabled, busy, hint, fit = false, solid = false, style }: ButtonProps) {
  const c = useColors();
  const off = disabled || busy;
  const look = {
    primary: { box: [fit ? styles.fit : styles.full, { backgroundColor: c.primary }], ink: c.onPrimary, hover: { boxShadow: c.litShadow } },
    secondary: { box: [styles.small, { backgroundColor: solid ? c.surfaceContainer : c.controlFill, borderColor: c.outline, borderWidth: 1 }], ink: c.onSurface, hover: { borderColor: c.onSurfaceVariant } },
    text: { box: [styles.textButton], ink: c.onSurface, hover: null },
    hint: { box: [styles.small, { backgroundColor: c.controlFill, borderColor: "rgba(242, 184, 75, 0.6)", borderWidth: 1 }], ink: c.question, hover: { borderColor: c.firefly } },
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
      style={({ pressed, hovered }: Interaction) => [
        styles.button,
        look.box,
        easeOnWeb,
        off && styles.disabled,
        hovered && !off && [styles.lift, look.hover],
        pressed && !off && styles.pressed,
        style,
      ]}
    >
      {({ hovered }: Interaction) =>
        busy ? (
          <ActivityIndicator color={look.ink} />
        ) : (
          <Text style={[type.button, kind === "hint" && styles.hintLabel, kind === "text" && hovered && !off && styles.underline, { color: look.ink }]} numberOfLines={1}>
            {label}
          </Text>
        )
      }
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
      style={({ pressed, hovered }: Interaction) => [
        styles.iconButton,
        big && styles.bigIcon,
        { backgroundColor: c.controlFill, borderColor: hovered && !disabled ? c.onSurfaceVariant : c.outline },
        easeOnWeb,
        disabled && styles.faint,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Icon name={icon} color={c.onSurface} size={big ? 20 : 18} />
    </Pressable>
  );
}

/** The mic beside a field: an icon button that turns amber with a stop square while listening. Hidden where there
 * is no speech recognition. The field itself shows the words; this never sends. */
export function MicButton({ state, onPress }: { state: VoiceState; onPress: () => void }) {
  const c = useColors();
  if (state.kind === "unsupported") return null;
  const listening = state.kind === "listening";
  const { label, hint } = voiceLabel(state);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ selected: listening }}
      onPress={onPress}
      hitSlop={size.hitSlop}
      style={({ pressed, hovered }: Interaction) => [
        styles.iconButton,
        { backgroundColor: c.controlFill, borderColor: listening ? c.questionOutline : hovered ? c.onSurfaceVariant : c.outline },
        listening && styles.listening,
        easeOnWeb,
        pressed && styles.pressed,
      ]}
    >
      <Icon name={listening ? "stop" : "mic"} color={listening ? c.firefly : c.onSurface} />
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
      style={({ pressed, hovered }: Interaction) => [
        styles.chip,
        selected ? { backgroundColor: "rgba(242, 184, 75, 0.16)", borderColor: c.firefly } : { backgroundColor: c.controlFill, borderColor: hovered ? c.onSurfaceVariant : c.outline },
        easeOnWeb,
        hovered && !selected && styles.lift,
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
  const web =
    Platform.OS === "web" && input.multiline
      ? {
          rows: webRows(input.value ?? "", width),
          onLayout: (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width),
          // a web text area takes Enter as a new line and never submits (react-native-web ignores
          // submitBehavior), so Enter sends, as in a chat, and Shift+Enter or a word being composed doesn't
          onKeyPress: (e: TextInputKeyPressEvent) => {
            const key = e as unknown as { key: string; shiftKey: boolean; nativeEvent: { isComposing?: boolean }; preventDefault: () => void };
            if (key.key !== "Enter" || key.shiftKey || key.nativeEvent.isComposing || !input.onSubmitEditing) return;
            key.preventDefault();
            input.onSubmitEditing(e as unknown as TextInputSubmitEditingEvent);
          },
        }
      : null;
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

/** A sheet that rises over the screen, with a scrim that closes it; in the website layout, a dialog in the middle
 * that fades in. Escape closes either on the web. */
export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const c = useColors();
  const wide = useWide();
  const scrim = <Pressable style={[wide ? StyleSheet.absoluteFill : styles.flex, { backgroundColor: c.scrim }]} onPress={onClose} accessibilityRole="button" accessibilityLabel={`Close ${label}`} />;
  const panel = [wide ? styles.dialog : styles.sheet, { backgroundColor: c.surfaceContainer, borderColor: c.fieldEdge }];
  return (
    <Modal visible={open} transparent animationType={wide ? "fade" : "slide"} onRequestClose={onClose}>
      {wide ? (
        <View style={[styles.flex, styles.center]}>
          {scrim}
          <View style={panel} accessibilityViewIsModal>
            {children}
          </View>
        </View>
      ) : (
        <>
          {scrim}
          <View style={panel} accessibilityViewIsModal>
            <View style={[styles.grabber, { backgroundColor: c.outline }]} />
            {children}
          </View>
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  column: { flex: 1, width: "100%", maxWidth: maxContentWidth, alignSelf: "center" },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.s },
  full: { height: size.button, borderRadius: radius.button, paddingHorizontal: space.xl, alignSelf: "stretch" },
  fit: { height: size.button, borderRadius: radius.button, paddingHorizontal: space.xxl, minWidth: 200, alignSelf: "flex-start" },
  small: { height: size.touch, borderRadius: radius.button, paddingHorizontal: 14, alignSelf: "flex-start" },
  textButton: { height: size.touch, paddingHorizontal: space.l, alignSelf: "center" },
  hintLabel: { fontSize: 15 },
  underline: { textDecorationLine: "underline" },
  disabled: { opacity: 0.45 },
  faint: { opacity: 0.35 },
  lift: { transform: [{ translateY: -1 }] },
  pressed: { transform: [{ scale: 0.97 }] },
  center: { alignItems: "center", justifyContent: "center", padding: space.xl },
  iconButton: { width: size.iconButton, height: size.iconButton, borderRadius: radius.iconButton, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  listening: { borderWidth: 1.5 },
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
  dialog: { borderRadius: radius.sheet, borderWidth: 1, padding: space.xxl, gap: space.m, width: "100%", maxWidth: 560, maxHeight: "90%" },
});
