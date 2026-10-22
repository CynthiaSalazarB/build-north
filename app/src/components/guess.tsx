// The guess (round 9 "Lumente"): before any help, the learner says how many of the 8 points they'll prove. The
// screen previews that much light as the number changes, and the number rolls the way it went; locking it in goes
// back to the dark for the first question. A failed call keeps the guess and offers to try again. In the website
// layout it is the same column in the middle of the page, under the header, and the keyboard works it: the arrow
// keys or + and − change the number, Enter locks it in.
import type { Turn } from "@build-north/agents";
import { useEffect, useState, type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { css, useReducedMotion } from "react-native-reanimated";
import { tick } from "../haptics.ts";
import { POINTS_RULE } from "../session/present.ts";
import type { Failure as CallFailure } from "../session/transcript.ts";
import { motion, space, type } from "../theme.ts";
import { PointSquare } from "./concept-map.tsx";
import { Failure } from "./messages.tsx";
import { SessionBar } from "./session-bar.tsx";
import { SiteHeader } from "./site-header.tsx";
import { Body, Button, easeOut, IconButton, Label, Rise, Screen, Title, useColors, useMode, useWide } from "./ui.tsx";

const MAX = 8;

/** The new number comes in from the side it moved toward: up from below, down from above. */
const rollUp = css.keyframes({ from: { opacity: 0, transform: [{ translateY: 14 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } });
const rollDown = css.keyframes({ from: { opacity: 0, transform: [{ translateY: -14 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } });

type Props = {
  turn: Turn;
  pending: boolean;
  failure: CallFailure | null;
  onLock: (prediction: number) => void;
  onRetry: () => void;
  onClose: () => void;
};

export function GuessScreen({ turn, pending, failure, onLock, onRetry, onClose }: Props) {
  const wide = useWide();
  const [guess, setGuess] = useState(4);
  const [went, setWent] = useState<"up" | "down" | null>(null);
  const step = (by: number) => {
    const next = Math.max(0, Math.min(MAX, guess + by));
    if (next === guess) return;
    setGuess(next);
    setWent(by > 0 ? "up" : "down");
    tick();
  };
  const lock = () => {
    if (!pending && !failure) onLock(guess);
  };

  // the website layout's keyboard: arrows or + and − change the guess, Enter locks it in
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "+" || e.key === "=") step(1);
      else if (e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "-") step(-1);
      else if (e.key === "Enter" && !(e.target instanceof HTMLElement && e.target.getAttribute("role") === "button")) lock();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const action = failure ? (
    <Failure message={failure.message}>{failure.retryable && <Button kind="secondary" label="Try again" onPress={onRetry} />}</Failure>
  ) : (
    <Button label="Lock in my guess" fit={wide} busy={pending} onPress={lock} style={wide && styles.centered} />
  );

  return (
    <Screen light={guess}>
      {wide ? (
        <SiteHeader concept={turn.mentefacto.concept} end={<Button kind="secondary" solid label="Save and close" onPress={onClose} />} />
      ) : (
        <SessionBar concept={turn.mentefacto.concept} onClose={onClose} />
      )}
      <Guess guess={guess} went={went} pending={pending} onStep={step} footer={wide ? action : null} />
      {!wide && <View style={styles.foot}>{action}</View>}
    </Screen>
  );
}

type GuessProps = { guess: number; went: "up" | "down" | null; pending: boolean; onStep: (by: number) => void; footer: ReactNode };

/** Inside the Screen, so the colors follow the light the guess previews. */
function Guess({ guess, went, pending, onStep, footer }: GuessProps) {
  const c = useColors();
  const still = useReducedMotion();
  const lit = useMode() === "day";
  const roll = went && !still ? { animationName: went === "up" ? rollUp : rollDown, animationDuration: motion.feedback * 1.4, animationTimingFunction: easeOut } : null;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Rise style={styles.column}>
        <Body dim>The map has 4 parts.</Body>
        <Title style={styles.question}>How many points will you prove?</Title>
        <View style={styles.stepper}>
          <IconButton big icon="minus" label="One point less" disabled={guess === 0 || pending} onPress={() => onStep(-1)} />
          <View style={styles.number} accessible accessibilityLabel={`Your guess: ${guess} of ${MAX} points`} accessibilityLiveRegion="polite">
            <Animated.View key={guess} style={roll}>
              <Text style={[type.guess, styles.digits, { color: c.guessNumber }]} maxFontSizeMultiplier={1.2}>
                {guess}
              </Text>
            </Animated.View>
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
        {/* how a part earns its points, the same line the result shows (decided Oct 22) */}
        <Label dim style={styles.rule}>
          {POINTS_RULE}
        </Label>
        {footer && <View style={styles.footer}>{footer}</View>}
      </Rise>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: space.margin, paddingVertical: space.xl },
  column: { width: "100%", maxWidth: 520, alignSelf: "center" },
  question: { marginTop: space.xs, fontSize: 27, lineHeight: 34 },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xxl, marginTop: 28 },
  number: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 6, minWidth: 96 },
  digits: { fontVariant: ["lining-nums", "tabular-nums"] },
  points: { flexDirection: "row", justifyContent: "center", gap: space.l, marginTop: 26 },
  pair: { flexDirection: "row", gap: 6 },
  rule: { marginTop: space.l, textAlign: "center" },
  footer: { marginTop: space.xxl, alignItems: "center" },
  centered: { alignSelf: "center" },
  foot: { paddingHorizontal: space.margin, paddingBottom: space.margin },
});
