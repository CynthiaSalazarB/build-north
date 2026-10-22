// The guess (round 9 "Lumente"): before any help, the learner says how many of the 8 points they'll prove. The
// screen previews that much light as the number changes; locking it in goes back to the dark for the first
// question. A failed call keeps the guess and offers to try again.
import type { Turn } from "@build-north/agents";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { tick } from "../haptics.ts";
import type { Failure as CallFailure } from "../session/transcript.ts";
import { space, type } from "../theme.ts";
import { PointSquare } from "./concept-map.tsx";
import { Failure } from "./messages.tsx";
import { SessionBar } from "./session-bar.tsx";
import { Body, Button, IconButton, Screen, Small, Title, useColors, useMode } from "./ui.tsx";

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
  const [guess, setGuess] = useState(4);
  const step = (by: number) => {
    const next = Math.max(0, Math.min(MAX, guess + by));
    if (next === guess) return;
    setGuess(next);
    tick();
  };
  return (
    <Screen light={guess}>
      <SessionBar concept={turn.mentefacto.concept} onClose={onClose} />
      <Guess guess={guess} pending={pending} onStep={step} />
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

/** Inside the Screen, so the colors follow the light the guess previews. */
function Guess({ guess, pending, onStep }: { guess: number; pending: boolean; onStep: (by: number) => void }) {
  const c = useColors();
  const lit = useMode() === "day";
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Body dim>4 questions, 2 points each.</Body>
      <Title style={styles.question}>How many points will you prove?</Title>
      <View style={styles.stepper}>
        <IconButton big icon="minus" label="One point less" disabled={guess === 0 || pending} onPress={() => onStep(-1)} />
        <View style={styles.number} accessible accessibilityLabel={`Your guess: ${guess} of ${MAX} points`} accessibilityLiveRegion="polite">
          <Text style={[type.guess, styles.digits, { color: c.guessNumber }]} maxFontSizeMultiplier={1.2}>
            {guess}
          </Text>
          <Text style={[type.label, { color: c.onSurfaceVariant }]}>/ 8</Text>
        </View>
        <IconButton big icon="plus" label="One point more" disabled={guess === MAX || pending} onPress={() => onStep(1)} />
      </View>
      <View style={styles.points} accessible={false}>
        {[0, 1, 2, 3].map((part) => (
          <View key={part} style={styles.pair}>
            {[0, 1].map((k) => (
              <PointSquare key={k} big dark={lit} pip={part * 2 + k < guess ? "claimed" : "open"} />
            ))}
          </View>
        ))}
      </View>
      <Small dim style={styles.center}>
        Each question you answer brings more light.
      </Small>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: space.margin, paddingVertical: space.xl },
  question: { marginTop: space.xs, fontSize: 27, lineHeight: 34 },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xxl, marginTop: 28 },
  number: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 6, minWidth: 96 },
  digits: { fontVariant: ["lining-nums", "tabular-nums"] },
  points: { flexDirection: "row", justifyContent: "center", gap: space.l, marginTop: 26 },
  pair: { flexDirection: "row", gap: 6 },
  center: { textAlign: "center", marginTop: space.l },
  foot: { paddingHorizontal: space.margin, paddingBottom: space.margin },
});
