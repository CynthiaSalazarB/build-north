// The guess (round 6): in the cave, before any help, the learner says how many of the 8 points they
// expect. Locking it in opens the door into daylight (the dawn, 700 ms; a fade with Reduce Motion), where
// the work happens. A failed call brings the cave back with the guess kept.
import type { Turn } from "@build-north/agents";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { tick } from "../haptics.ts";
import { splitTrailingQuestion, waitingLineOf } from "../session/present.ts";
import type { Failure as CallFailure } from "../session/transcript.ts";
import { motion, palette, radius, size, space, type } from "../theme.ts";
import { Beam, Glow } from "./art.tsx";
import { decorative, Icon } from "./icons.tsx";
import { Failure, Thinking } from "./messages.tsx";
import { Body, Button, CircleButton, Footnote, Screen, ToneScope, Ui } from "./ui.tsx";

const cave = palette.cave;
const MAX = 8;
const DOOR = { width: 128, height: 164 };
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

type Props = {
  turn: Turn;
  pending: boolean;
  failure: CallFailure | null;
  onLock: (prediction: number) => void;
  onRetry: () => void;
  onClose: () => void;
  /** Daylight has filled the screen: the session screen can take over. */
  onDawnEnd: () => void;
};

export function GuessScreen({ turn, pending, failure, onLock, onRetry, onClose, onDawnEnd }: Props) {
  const [guess, setGuess] = useState(4);
  const still = useReducedMotion();
  const dawn = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prompt = turn.messages.find((m) => m.kind === "question") ?? turn.messages[0];
  const { statement, question } = splitTrailingQuestion(prompt?.text ?? "");

  const open = () => {
    const duration = still ? motion.fade : motion.dawn;
    dawn.value = withTiming(1, { duration, easing: easeInOut });
    timer.current = setTimeout(onDawnEnd, duration);
  };
  const lock = () => {
    onLock(guess);
    open();
  };
  const retry = () => {
    onRetry();
    open();
  };

  // A failed call: back into the cave, so the learner can try again.
  useEffect(() => {
    if (!failure) return;
    if (timer.current) clearTimeout(timer.current);
    dawn.value = withTiming(0, { duration: motion.fade });
  }, [failure, dawn]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const step = (by: number) => {
    const next = Math.max(0, Math.min(MAX, guess + by));
    if (next === guess) return;
    setGuess(next);
    tick();
  };

  // The cave fades in the first 150 ms; the door grows into daylight; plaster takes over at the end.
  const caveLook = useAnimatedStyle(() => ({ opacity: interpolate(dawn.value, [0, 0.2], [1, 0], "clamp") }));
  const doorLook = useAnimatedStyle(() => ({ transform: [{ scale: still ? 1 : interpolate(dawn.value, [0, 1], [1, 13]) }] }));
  const dayLook = useAnimatedStyle(() => ({ opacity: interpolate(dawn.value, still ? [0, 1] : [0.8, 1], [0, 1], "clamp") }));

  return (
    <Screen tone="cave">
      <Animated.View style={[StyleSheet.absoluteFill, caveLook]} pointerEvents="none">
        <Glow />
      </Animated.View>
      <Animated.View style={[styles.bar, caveLook]}>
        <CircleButton icon="x" label="Close and save" onPress={onClose} />
        <Ui strong style={styles.concept} numberOfLines={1}>
          {turn.mentefacto.concept}
        </Ui>
        <View style={styles.side} />
      </Animated.View>

      <View style={styles.middle}>
        <Animated.View style={[styles.lead, caveLook]}>
          {statement !== "" && <Body dim>{statement}</Body>}
          {question && <Body strong>{question}</Body>}
        </Animated.View>

        <View style={styles.stepper}>
          <Animated.View style={caveLook}>
            <StepButton icon="minus" label="One point fewer" disabled={guess === 0 || pending} onPress={() => step(-1)} />
          </Animated.View>
          <View style={styles.doorWrap}>
            <Animated.View style={[styles.beam, caveLook]} pointerEvents="none">
              <Beam />
            </Animated.View>
            <Animated.View style={[styles.door, doorLook]}>
            <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${DOOR.width} ${DOOR.height}`} preserveAspectRatio="none" {...decorative}>
              <Defs>
                <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={cave.archTop} />
                  <Stop offset="1" stopColor={cave.archBottom} />
                </LinearGradient>
              </Defs>
              <Rect width={DOOR.width} height={DOOR.height} fill="url(#sky)" />
            </Svg>
            <Animated.View style={[styles.doorText, caveLook]} accessibilityLiveRegion="polite" accessibilityLabel={`Your guess: ${guess} of ${MAX} points`}>
              <Text style={[type.hero, styles.hero]} maxFontSizeMultiplier={1.2}>
                {guess}
              </Text>
              <Text style={[type.footnote, { color: cave.onArchVariant }]}>{`of ${MAX} points`}</Text>
            </Animated.View>
            </Animated.View>
          </View>
          <Animated.View style={caveLook}>
            <StepButton icon="plus" label="One point more" disabled={guess === MAX || pending} onPress={() => step(1)} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.blocks, caveLook]} accessible accessibilityLabel={`Your guess: ${guess} of ${MAX}`}>
          {Array.from({ length: MAX }, (_, i) => (
            <View key={i} style={[styles.block, i < guess ? styles.shade : styles.empty]} />
          ))}
        </Animated.View>
        <Animated.View style={caveLook}>
          <Footnote dim style={styles.center}>
            {"You'll see how close you were at the end."}
          </Footnote>
        </Animated.View>
      </View>

      <Animated.View style={[styles.foot, caveLook]}>
        {failure ? (
          <Failure message={failure.message}>{failure.retryable && <Button kind="tonal" label="Try Again" onPress={retry} />}</Failure>
        ) : (
          <Button label="Lock In My Guess" busy={pending} onPress={lock} />
        )}
      </Animated.View>

      {/* daylight: the screen the work happens on, until the next Turn takes over */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.day, dayLook]} pointerEvents="none">
        {pending && (
          <ToneScope tone="day">
            <View style={styles.dayWait}>
              <Thinking line={waitingLineOf({ turn: turn.turn, prediction: guess })} />
            </View>
          </ToneScope>
        )}
      </Animated.View>
    </Screen>
  );
}

function StepButton({ icon, label, disabled, onPress }: { icon: "minus" | "plus"; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.step, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <Icon name={icon} color={cave.onSurface} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: space.s, height: size.control, paddingHorizontal: space.margin, marginTop: space.s },
  concept: { flex: 1, textAlign: "center", textTransform: "capitalize" },
  side: { width: size.control },
  middle: { flex: 1, justifyContent: "center", gap: space.xl, paddingHorizontal: space.margin },
  lead: { gap: space.xs },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xl },
  step: {
    width: size.step,
    height: size.step,
    borderRadius: size.step / 2,
    borderWidth: 1.5,
    borderColor: cave.onSurface,
    backgroundColor: cave.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  door: {
    width: DOOR.width,
    height: DOOR.height,
    borderTopLeftRadius: DOOR.width / 2,
    borderTopRightRadius: DOOR.width / 2,
    borderBottomLeftRadius: space.xs,
    borderBottomRightRadius: space.xs,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: space.l,
  },
  doorWrap: { width: DOOR.width, height: DOOR.height },
  beam: { position: "absolute", top: DOOR.height, left: -132, width: 392, height: 440 },
  doorText: { alignItems: "center", gap: space.xs },
  hero: { color: cave.onArch, fontVariant: ["lining-nums", "tabular-nums"] },
  blocks: { flexDirection: "row", gap: space.s },
  block: { flex: 1, height: 48, borderRadius: radius.block, borderWidth: 1.5 },
  shade: { backgroundColor: cave.shadowBlock, borderStyle: "dashed", borderColor: cave.shadowOutline },
  empty: { borderStyle: "dotted", borderColor: cave.placeholder, opacity: 0.6 },
  center: { textAlign: "center" },
  foot: { paddingHorizontal: space.margin, paddingBottom: space.m },
  day: { backgroundColor: palette.day.surface },
  dayWait: { flex: 1, justifyContent: "center", paddingHorizontal: space.margin },
  disabled: { opacity: 0.35 },
  pressed: { transform: [{ scale: 0.96 }] },
});
