// The guess (round 9 "Lumente"): before any help, the learner says how many of the 8 points they'll prove. The
// screen previews that much light as the number changes, and the number rolls the way it went; locking it in goes
// back to the dark for the first question. A failed call keeps the guess and offers to try again. In the website
// layout the words are the column on the left and the map stands on the right, where the light falls, with the
// guessed points claimed in amber on its parts; the keyboard works it: the arrow keys or + and − change the
// number, Enter locks it in.
import { MOVE_ORDER, type Turn } from "@build-north/agents";
import { useEffect, useState, type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { css, useReducedMotion } from "react-native-reanimated";
import { tick } from "../haptics.ts";
import { POINTS_RULE, type PartView } from "../session/present.ts";
import type { Failure as CallFailure } from "../session/transcript.ts";
import { motion, page, space, type } from "../theme.ts";
import { ConceptMap, PointSquare } from "./concept-map.tsx";
import { Failure } from "./messages.tsx";
import { SessionBar } from "./session-bar.tsx";
import { SiteHeader } from "./site-header.tsx";
import { Body, Button, easeOut, IconButton, Label, Rise, Screen, Title, useColors, useMode, useWide } from "./ui.tsx";

const MAX = 8;

/** The new number comes in from the side it moved toward: up from below, down from above. */
const rollUp = css.keyframes({ from: { opacity: 0, transform: [{ translateY: 14 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } });
const rollDown = css.keyframes({ from: { opacity: 0, transform: [{ translateY: -14 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } });

/** The empty map with the guess claimed on it: the first `guess` points, in the parts' order, in amber. */
const claimedParts = (guess: number): PartView[] =>
  MOVE_ORDER.map((move, i) => ({ move, state: "unasked", text: null, pips: [i * 2 < guess ? "claimed" : "open", i * 2 + 1 < guess ? "claimed" : "open"] }));

type Props = {
  turn: Turn;
  pending: boolean;
  failure: CallFailure | null;
  onLock: (prediction: number) => void;
  onClose: () => void;
};

export function GuessScreen({ turn, pending, failure, onLock, onClose }: Props) {
  const wide = useWide();
  const [guess, setGuess] = useState(4);
  const [went, setWent] = useState<"up" | "down" | null>(null);
  // the buttons are disabled while the lock is in flight; the keyboard goes through here too
  const step = (by: number) => {
    if (pending) return;
    const next = Math.max(0, Math.min(MAX, guess + by));
    if (next === guess) return;
    setGuess(next);
    setWent(by > 0 ? "up" : "down");
    tick();
  };
  // after a failed lock the number can still change, so Try again sends the guess on screen, not the old one
  const lock = () => {
    if (!pending) onLock(guess);
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
    <Failure message={failure.message}>{failure.retryable && <Button kind="secondary" label="Try again" onPress={lock} />}</Failure>
  ) : (
    <Button label="Lock in my guess" fit={wide} busy={pending} onPress={lock} />
  );

  if (wide) {
    return (
      <Screen light={guess}>
        <SiteHeader concept={turn.mentefacto.concept} end={<Button kind="secondary" solid label="Save and close" onPress={onClose} />} />
        <View style={styles.split}>
          <ScrollView style={styles.words} contentContainerStyle={styles.wordsContent}>
            <Guess guess={guess} went={went} pending={pending} onStep={step} footer={action} wide />
          </ScrollView>
          <View style={styles.stage}>
            <Rise order={1} style={styles.spot}>
              <ConceptMap concept={turn.mentefacto.concept} parts={claimedParts(guess)} />
            </Rise>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen light={guess}>
      <SessionBar concept={turn.mentefacto.concept} onClose={onClose} />
      <ScrollView contentContainerStyle={styles.content}>
        <Guess guess={guess} went={went} pending={pending} onStep={step} footer={null} />
      </ScrollView>
      <View style={styles.foot}>{action}</View>
    </Screen>
  );
}

type GuessProps = { guess: number; went: "up" | "down" | null; pending: boolean; onStep: (by: number) => void; footer: ReactNode; wide?: boolean };

/** Inside the Screen, so the colors follow the light the guess previews. Centered on a phone; in the website
 * layout's column it starts at the left edge, like the words on every other screen. */
function Guess({ guess, went, pending, onStep, footer, wide = false }: GuessProps) {
  const c = useColors();
  const still = useReducedMotion();
  const lit = useMode() === "day";
  const roll = went && !still ? { animationName: went === "up" ? rollUp : rollDown, animationDuration: motion.feedback * 1.4, animationTimingFunction: easeOut } : null;
  const start = wide && styles.fromLeft;
  return (
    <Rise style={wide ? styles.wordsColumn : styles.column}>
      <Body dim>The map has 4 parts.</Body>
      <Title style={[styles.question, wide && styles.display]}>How many points will you prove?</Title>
      <View style={[styles.stepper, start]}>
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
      <View style={[styles.points, start]} accessible={false}>
        {[0, 1, 2, 3].map((part) => (
          <View key={part} style={styles.pair}>
            {[0, 1].map((k) => (
              <PointSquare key={k} big dark={lit} pip={part * 2 + k < guess ? "claimed" : "open"} />
            ))}
          </View>
        ))}
      </View>
      {/* how a part earns its points, the same line the result shows (decided Oct 22) */}
      <Label dim style={[styles.rule, wide && styles.ruleLeft]}>
        {POINTS_RULE}
      </Label>
      {footer && <View style={[styles.footer, start]}>{footer}</View>}
    </Rise>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: space.margin, paddingVertical: space.xl },
  column: { width: "100%", maxWidth: 520, alignSelf: "center" },
  wordsColumn: { width: "100%" },
  question: { marginTop: space.xs, fontSize: 27, lineHeight: 34 },
  display: { fontSize: type.display.fontSize, lineHeight: type.display.lineHeight, marginTop: space.s },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xxl, marginTop: 28 },
  number: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 6, minWidth: 96 },
  digits: { fontVariant: ["lining-nums", "tabular-nums"] },
  points: { flexDirection: "row", justifyContent: "center", gap: space.l, marginTop: 26 },
  pair: { flexDirection: "row", gap: 6 },
  rule: { marginTop: space.l, textAlign: "center" },
  ruleLeft: { textAlign: "left" },
  footer: { marginTop: space.xxl, alignItems: "center" },
  fromLeft: { justifyContent: "flex-start", alignItems: "flex-start" },
  foot: { paddingHorizontal: space.margin, paddingBottom: space.margin },
  split: { flex: 1, flexDirection: "row", gap: page.gap, paddingHorizontal: page.gutter },
  words: { width: page.words, flexGrow: 0 },
  wordsContent: { flexGrow: 1, justifyContent: "center", paddingTop: space.xxl, paddingBottom: page.header },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: page.header },
  spot: { width: "100%", maxWidth: page.map },
});
