// One line of the conversation (round 8 "Open Box"): the tutor's question is italic beside your pair, its
// replies are plain serif text, a hint is an amber card that says what it costs, a fact is a labeled card,
// and your answers sit on the right. The learner sees what kind of message it is, never which agent wrote it.
import type { Message } from "@build-north/agents";
import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Line, Path } from "react-native-svg";
import { hintCardOf, splitTrailingQuestion } from "../session/present.ts";
import { motion, radius, serif, space, type } from "../theme.ts";
import { decorative, Icon } from "./icons.tsx";
import { Pair } from "./pair.tsx";
import { Body, Label, Question, useColors } from "./ui.tsx";

/** `label` goes over a question (the part, or "before any help"); `firstHint` puts the price on a hint card.
 * `part` names the part a hint is about where the screen doesn't show it (the fact desk, level 5). */
export function AppMessage({ message, label, firstHint = false, part }: { message: Message; label?: string | null; firstHint?: boolean; part?: string }) {
  switch (message.kind) {
    case "question":
      return <Ask label={label ?? null} text={message.text} />;
    case "hint":
      return <HintCard message={message} first={firstHint} part={part} />;
    case "fact":
    case "redirect":
      return <FactCard kind={message.kind} text={message.text} />;
    default:
      return <Reply text={message.text} />;
  }
}

/** The tutor's question, beside your pair. At level 5 your pair sits on the right and listens: you ask now. */
export function Ask({ label, text, pairSide = "left" }: { label: string | null; text: string; pairSide?: "left" | "right" }) {
  return (
    <View style={[styles.ask, pairSide === "right" && styles.askRight]}>
      <Pair look={pairSide === "right" ? "listening" : "asking"} size={40} />
      <View style={styles.askText}>
        {label && (
          <Label dim style={[styles.lower, pairSide === "right" && styles.end]}>
            {label}
          </Label>
        )}
        <Question style={pairSide === "right" ? styles.end : undefined}>{text}</Question>
      </View>
    </View>
  );
}

/** A reply that ends in a question sets the question in italic, as the tutor asks it. */
function Reply({ text }: { text: string }) {
  const { statement, question } = splitTrailingQuestion(text);
  return (
    <View style={styles.indent}>
      <Body>
        {statement}
        {statement && question ? " " : ""}
        {question && <Text style={{ fontFamily: serif.italic }}>{question}</Text>}
      </Body>
    </View>
  );
}

/** In the conversation a hint lines up past your pair; on the fact desk there's no pair, and it names its part. */
function HintCard({ message, first, part }: { message: Message; first: boolean; part?: string }) {
  const c = useColors();
  const card = hintCardOf(message.hintStep, first);
  const title = part ? `${part.toLowerCase()} · ${card.title}` : card.title;
  return (
    <View
      style={[!part && styles.indent, styles.card, { backgroundColor: c.hintContainer, borderColor: c.hintOutline }]}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${message.text} ${card.note}`}
    >
      <View style={styles.hintHead}>
        <Icon name="bulb" color={c.hint} size={16} />
        <Text style={[type.labelStrong, { color: c.hint }]}>{title}</Text>
      </View>
      <Text style={[type.body, { color: c.onHintContainer }]}>{message.text}</Text>
      <Text style={[type.label, { color: c.hint }]}>{card.note}</Text>
    </View>
  );
}

/** A fact desk answer: facts only, or the redirect when a question fishes for the map. */
export function FactCard({ kind, text }: { kind: "fact" | "redirect"; text: string }) {
  const c = useColors();
  return (
    <View style={[styles.card, { backgroundColor: c.surfaceHigh, borderColor: c.outline }]}>
      <Label dim>{kind}</Label>
      <Body>{text}</Body>
    </View>
  );
}

export function LearnerMessage({ text }: { text: string }) {
  const c = useColors();
  return (
    <View style={[styles.learner, { backgroundColor: c.surfaceHigh }]}>
      <Body>{text}</Body>
    </View>
  );
}

/** A reply that takes longer than this says so (NN/g: over 10 s, explain the wait). */
const SLOW_MS = 10_000;

/** True once a call has been in flight for SLOW_MS. */
export function useSlow(waiting: boolean): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (!waiting) return;
    const timer = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(timer);
  }, [waiting]);
  return slow;
}

const WAVE = { length: 20, height: 10 };
const wavePath = (width: number) => {
  let d = `M0 ${WAVE.height / 2}`;
  for (let x = 0; x < width + WAVE.length; x += WAVE.length) d += ` q5 -4 10 0 t10 0`;
  return d;
};

/** While the tutor answers: a wave moving along a progress line, and what is happening. With Reduce Motion
 * the wave stands still. */
export function Thinking({ line }: { line: string }) {
  const c = useColors();
  const still = useReducedMotion();
  const shift = useSharedValue(0);
  const [width, setWidth] = useState(0);
  const waveWidth = Math.round(width * 0.52);
  useEffect(() => {
    if (still) return;
    shift.value = withRepeat(withTiming(-WAVE.length, { duration: motion.wave / 2, easing: Easing.linear }), -1);
  }, [still, shift]);
  const flow = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value }] }));
  return (
    <View style={styles.thinking} role="status" accessibilityLiveRegion="polite" accessibilityLabel={line}>
      <View style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <>
            <View style={[styles.waveClip, { width: waveWidth }]}>
              <Animated.View style={flow}>
                <Svg width={waveWidth + WAVE.length} height={WAVE.height} {...decorative}>
                  <Path d={wavePath(waveWidth)} fill="none" stroke={c.primary} strokeWidth={4} strokeLinecap="round" />
                </Svg>
              </Animated.View>
            </View>
            <Svg width={width - waveWidth - space.m} height={WAVE.height} style={styles.track} {...decorative}>
              <Line x1={2} y1={WAVE.height / 2} x2={width - waveWidth - space.m - 2} y2={WAVE.height / 2} stroke={c.outline} strokeWidth={4} strokeLinecap="round" />
            </Svg>
          </>
        )}
      </View>
      <Label dim>{line}</Label>
    </View>
  );
}

/** A failed call: what happened, where it happened, and a way to try again. Never coral: that's the gap. */
export function Failure({ message, children }: { message: string; children?: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.failure} accessibilityRole="alert">
      <Icon name="alert" color={c.onSurfaceVariant} />
      <View style={styles.failureBody}>
        <Body>{message}</Body>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ask: { flexDirection: "row", alignItems: "flex-start", gap: space.m },
  askRight: { flexDirection: "row-reverse" },
  askText: { flex: 1, gap: space.xs },
  lower: { textTransform: "lowercase" },
  end: { textAlign: "right" },
  // replies and hints line up with the question's text, past the pair
  indent: { marginLeft: 40 + space.m },
  card: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, padding: space.l, gap: space.s },
  hintHead: { flexDirection: "row", alignItems: "center", gap: space.s },
  learner: { alignSelf: "flex-end", maxWidth: "82%", paddingVertical: space.m, paddingHorizontal: space.l, borderRadius: radius.bubble },
  thinking: { gap: space.s },
  bar: { flexDirection: "row", alignItems: "center", height: WAVE.height },
  waveClip: { overflow: "hidden", height: WAVE.height },
  track: { marginLeft: space.m },
  failure: { flexDirection: "row", alignItems: "flex-start", gap: space.m },
  failureBody: { flex: 1, gap: space.s },
});
