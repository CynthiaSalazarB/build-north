// The guess (round 8): before any help, the learner says how many of the 8 points they expect. The box is
// glass, and the corners they expect are ringed; the stepper sits in the code it's a test for
// (`expect(explain("JWT")).toScore(7)`). A failed call keeps the guess and offers to try again.
import type { Turn } from "@build-north/agents";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { tick } from "../haptics.ts";
import { guessCornersOf } from "../session/present.ts";
import type { Failure as CallFailure } from "../session/transcript.ts";
import { box, radius, size, space, type } from "../theme.ts";
import { OpenBox } from "./box.tsx";
import { Icon } from "./icons.tsx";
import { Failure } from "./messages.tsx";
import { SessionBar } from "./session-bar.tsx";
import { Body, Button, Card, Label, Screen, useColors } from "./ui.tsx";

const MAX = 8;

type Props = {
  turn: Turn;
  pending: boolean;
  failure: CallFailure | null;
  onLock: (prediction: number) => void;
  onRetry: () => void;
  onClose: () => void;
};

export function GuessScreen({ turn, pending, failure, onLock, onRetry, onClose }: Props) {
  const c = useColors();
  const [guess, setGuess] = useState(4);
  const concept = turn.mentefacto.concept;

  const step = (by: number) => {
    const next = Math.max(0, Math.min(MAX, guess + by));
    if (next === guess) return;
    setGuess(next);
    tick();
  };

  const code = (text: string, color: string) => <Text style={{ color }}>{text}</Text>;

  return (
    <Screen>
      <SessionBar concept={concept} onClose={onClose} />
      <ScrollView contentContainerStyle={styles.content}>
        <OpenBox corners={guessCornersOf(box.cornerOrder, guess)} width={176} label={`A glass box with ${guess} of its 8 corners marked`} />
        <Body style={styles.center}>8 points, one for each corner of the box. How many will you prove?</Body>
        <Card style={styles.code}>
          <Line n={1}>
            {code("expect", c.onSurface)}
            {code("(", c.onSurfaceVariant)}
            {code("explain", c.onSurface)}
            {code(`(${JSON.stringify(concept)}))`, c.onSurfaceVariant)}
          </Line>
          <Line n={2}>
            {code("  .", c.onSurfaceVariant)}
            {code("toScore", c.onSurface)}
            {code("(", c.onSurfaceVariant)}
          </Line>
          <View style={styles.stepper}>
            <StepButton icon="minus" label="One point fewer" disabled={guess === 0 || pending} onPress={() => step(-1)} />
            <Text
              style={[type.guess, styles.number, { color: c.onSurface }]}
              maxFontSizeMultiplier={1.2}
              accessibilityLiveRegion="polite"
              accessibilityLabel={`Your guess: ${guess} of ${MAX} points`}
            >
              {guess}
            </Text>
            <StepButton icon="plus" label="One point more" disabled={guess === MAX || pending} onPress={() => step(1)} />
          </View>
          <Line n={3}>{code("  )", c.onSurfaceVariant)}</Line>
        </Card>
        <Label dim style={styles.note}>
          {"// you'll see how close you were at the end"}
        </Label>
      </ScrollView>

      <View style={styles.foot}>
        {failure ? (
          <Failure message={failure.message}>{failure.retryable && <Button kind="secondary" label="Try again" onPress={onRetry} />}</Failure>
        ) : (
          <Button label="Lock in my guess" busy={pending} onPress={() => onLock(guess)} />
        )}
      </View>
    </Screen>
  );
}

function Line({ n, children }: { n: number; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.line} accessible={false}>
      <Text style={[type.label, styles.ln, { color: c.onSurfaceVariant }]}>{n}</Text>
      <Text style={[type.code, styles.lineText]}>{children}</Text>
    </View>
  );
}

function StepButton({ icon, label, disabled, onPress }: { icon: "minus" | "plus"; label: string; disabled: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.step, { backgroundColor: c.surfaceHigh, borderColor: c.outline }, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <Icon name={icon} color={c.onSurface} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: "center", justifyContent: "center", gap: space.xl, paddingHorizontal: space.margin, paddingVertical: space.xl },
  center: { textAlign: "center", maxWidth: 320 },
  note: { alignSelf: "stretch" },
  code: { alignSelf: "stretch", gap: space.s },
  line: { flexDirection: "row", alignItems: "center", gap: space.m },
  ln: { width: 12, textAlign: "right" },
  lineText: { flex: 1 },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: space.xl, paddingLeft: space.xl + space.s },
  number: { minWidth: 48, textAlign: "center", fontVariant: ["lining-nums", "tabular-nums"] },
  step: { width: size.touch, height: size.touch, borderRadius: radius.iconButton, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  foot: { paddingHorizontal: space.margin, paddingBottom: space.m },
  disabled: { opacity: 0.35 },
  pressed: { transform: [{ scale: 0.95 }] },
});
