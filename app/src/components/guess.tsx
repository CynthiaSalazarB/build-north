// Confidence is an explicit prediction on the same 0–8 scale as the map's score. No preselected answer.
import { MOVE_ORDER, type Turn } from "@build-north/agents";
import { AREA_LABEL } from "../area-copy.ts";
import { useEffect, useState, type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { css, useReducedMotion } from "react-native-reanimated";
import { tick } from "../haptics.ts";
import { POINTS_RULE, type PartView } from "../session/present.ts";
import type { Failure as CallFailure } from "../session/transcript.ts";
import { motion, page, radius, size, space, type } from "../theme.ts";
import { ConceptMap } from "./concept-map.tsx";
import { Failure } from "./messages.tsx";
import { ScoringGuide } from "./scoring-guide.tsx";
import { SessionBar } from "./session-bar.tsx";
import { SiteHeader } from "./site-header.tsx";
import { AnimatedPressable, Body, Button, easeOut, Label, Rise, Screen, Small, Title, useColors, usePress, useWide } from "./ui.tsx";

const MAX = 8;
// A total prediction doesn't identify confidence in any particular area. Every area's two points stay open.
const preview: PartView[] = MOVE_ORDER.map((move) => ({ move, state: "unasked", text: null, pips: ["open", "open"] }));

type Props = {
  turn: Turn;
  pending: boolean;
  failure: CallFailure | null;
  onLock: (prediction: number) => void;
  onClose: () => void;
};

export function GuessScreen({ turn, pending, failure, onLock, onClose }: Props) {
  const wide = useWide();
  const [guess, setGuess] = useState<number | null>(null);
  const choose = (value: number) => {
    if (pending) return;
    setGuess(Math.max(0, Math.min(MAX, value)));
    tick();
  };
  const lock = () => {
    if (!pending && guess !== null) onLock(guess);
  };

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (/^[0-8]$/.test(e.key)) choose(Number(e.key));
      else if (["ArrowUp", "ArrowRight", "+", "="].includes(e.key)) choose(guess === null ? 0 : guess + 1);
      else if (["ArrowDown", "ArrowLeft", "-"].includes(e.key)) choose(guess === null ? MAX : guess - 1);
      else if (e.key === "Enter" && !(e.target instanceof HTMLElement && e.target.closest('[role="button"], button'))) lock();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const action = (
    <View style={styles.action}>
      {failure && <Failure message={failure.message} />}
      <Button label={failure ? "Try saving my prediction again" : "Save my prediction"} fit={wide} disabled={guess === null || (!!failure && !failure.retryable)} busy={pending} onPress={lock} />
    </View>
  );
  const form = <Prediction concept={turn.mentefacto.concept} guess={guess} pending={pending} onChoose={choose} footer={wide ? action : null} wide={wide} />;

  // the screen previews the light of the chosen number (none until one is picked); the map's areas stay open
  return (
    <Screen light={guess ?? 0}>
      {wide ? (
        <>
          <SiteHeader concept={turn.mentefacto.concept} end={<Button kind="secondary" solid label="Save and close" onPress={onClose} />} />
          <View style={styles.split}>
            <ScrollView style={styles.words} contentContainerStyle={styles.wordsContent}>{form}</ScrollView>
            <View style={styles.stage}>
              <Rise order={1} style={styles.spot}>
                <Label dim>Your map</Label>
                <ConceptMap concept={turn.mentefacto.concept} parts={preview} />
              </Rise>
            </View>
          </View>
        </>
      ) : (
        <>
          <SessionBar concept={turn.mentefacto.concept} onClose={onClose} />
          <ScrollView contentContainerStyle={styles.content}>{form}</ScrollView>
          <View style={styles.foot}>{action}</View>
        </>
      )}
    </Screen>
  );
}

function Prediction({ concept, guess, pending, onChoose, footer, wide }: { concept: string; guess: number | null; pending: boolean; onChoose: (score: number) => void; footer: ReactNode; wide: boolean }) {
  const c = useColors();
  return (
    <Rise style={styles.column}>
      <Title style={wide ? styles.display : styles.question}>How much can you explain on your own?</Title>
      <Body dim>{`You'll explain ${concept} across four areas of a concept map. Predict how many points your answers will earn.`}</Body>
      <Small>{POINTS_RULE}</Small>
      {/* the phone has no map beside the numbers, so the areas are named once */}
      {!wide && <Small dim>{`The four areas: ${MOVE_ORDER.map((move) => AREA_LABEL[move].toLowerCase()).join(", ")}.`}</Small>}
      <View style={styles.picker}>
        <View style={styles.numbers}>
          {Array.from({ length: MAX + 1 }, (_, value) => (
            <NumberChoice key={value} value={value} chosen={guess === value} pending={pending} onChoose={onChoose} />
          ))}
        </View>
        <View style={styles.anchors}>
          <Small dim>{"0 · I can't explain it yet"}</Small>
          <Small dim>8 · I can explain all four</Small>
        </View>
        <View accessibilityLiveRegion="polite">
          <Small style={{ color: c.question }}>{guess === null ? "No prediction selected" : `Your prediction: ${guess} of 8 points`}</Small>
        </View>
        {/* why the learner guesses at all: the comparison at the end is the reality check (Cynthia, Oct 24) */}
        <Small dim>{"At the end, you'll compare this with your score."}</Small>
      </View>
      <ScoringGuide />
      {footer}
    </Rise>
  );
}

/** The chosen number settles: it lands from a touch larger over 150 ms, once, the moment it is picked. */
const settle = css.keyframes({ from: { transform: [{ scale: 1.04 }] }, to: { transform: [{ scale: 1 }] } });

/** One of the nine numbers. The chosen one fills with warm light (its fill and ink swap at once, so the digit never
 * sits on a half-faded fill) and settles into place; on the web a hover firms up the edge of the others. */
function NumberChoice({ value, chosen, pending, onChoose }: { value: number; chosen: boolean; pending: boolean; onChoose: (score: number) => void }) {
  const c = useColors();
  const still = useReducedMotion();
  const { hovered, bind, feel } = usePress({ colors: false });
  return (
    <Animated.View style={chosen && !still ? { animationName: settle, animationDuration: motion.feedback, animationTimingFunction: easeOut } : null}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={`Predict ${value} of 8 points`}
        accessibilityState={{ selected: chosen, disabled: pending }}
        disabled={pending}
        onPress={() => onChoose(value)}
        {...bind}
        style={[styles.number, { backgroundColor: chosen ? c.primary : c.controlFill, borderColor: chosen ? c.primary : hovered && !pending ? c.onSurfaceVariant : c.outline }, feel(!pending)]}
      >
        <Text style={[type.pill, { color: chosen ? c.onPrimary : c.onSurface }]}>{value}</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: space.margin, paddingVertical: space.xl },
  column: { width: "100%", gap: space.l },
  question: { fontSize: 28, lineHeight: 34 },
  display: { fontSize: 42, lineHeight: 46 },
  picker: { gap: space.m, marginVertical: space.s },
  numbers: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  number: { minWidth: size.touch, minHeight: size.touch, borderWidth: 1, borderRadius: radius.button, alignItems: "center", justifyContent: "center" },
  anchors: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: space.s },
  action: { gap: space.s },
  foot: { paddingHorizontal: space.margin, paddingVertical: space.m },
  split: { flex: 1, flexDirection: "row", gap: page.gap, paddingHorizontal: page.gutter },
  words: { width: page.words, flexGrow: 0 },
  wordsContent: { flexGrow: 1, justifyContent: "center", paddingTop: space.xl, paddingBottom: space.xxl },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: page.header },
  spot: { width: "100%", maxWidth: page.map, gap: space.xl },
});
