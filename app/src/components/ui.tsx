// Small building blocks every screen uses, styled only from the theme.
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, maxContentWidth, radius, space } from "../theme.ts";

/** A phone-width column, centered on wider screens (decision 14). */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.column}>{children}</View>
    </SafeAreaView>
  );
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, muted && styles.muted, style]}>{children}</Text>;
}

export function Small({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.small, style]}>{children}</Text>;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary";
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, kind = "primary", disabled, busy, style }: ButtonProps) {
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [styles.button, kind === "secondary" && styles.secondary, off && styles.disabled, pressed && !off && styles.pressed, style]}
    >
      {busy ? (
        <ActivityIndicator color={kind === "primary" ? colors.onPrimary : colors.primary} />
      ) : (
        <Text style={[styles.buttonLabel, kind === "secondary" && styles.secondaryLabel]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  column: { flex: 1, width: "100%", maxWidth: maxContentWidth, alignSelf: "center" },
  title: { fontFamily: fonts.body, fontSize: fonts.size.title, fontWeight: fonts.weight.bold, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: fonts.size.body, lineHeight: 23, color: colors.text },
  muted: { color: colors.textMuted },
  small: { fontFamily: fonts.body, fontSize: fonts.size.small, color: colors.textMuted },
  button: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
  buttonLabel: { fontFamily: fonts.body, fontSize: fonts.size.body, fontWeight: fonts.weight.medium, color: colors.onPrimary },
  secondaryLabel: { color: colors.primary },
});
