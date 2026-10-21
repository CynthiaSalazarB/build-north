// One line of the conversation, in the round 6 voice: the tutor's questions are italic titles, its
// replies plain serif text, a hint is a lamp card that says what it costs, and the learner's answers sit
// on the right. The learner sees what kind of message it is, never which agent wrote it.
import type { Message } from "@build-north/agents";
import { useEffect, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { eyebrowOf, hintCardOf, splitTrailingQuestion } from "../session/present.ts";
import { motion, palette, radius, space, type } from "../theme.ts";
import { Icon } from "./icons.tsx";
import { Body, Footnote, Question, useColors } from "./ui.tsx";

export function AppMessage({ message }: { message: Message }) {
  switch (message.kind) {
    case "question": {
      const { eyebrow, text } = eyebrowOf(message.text);
      return (
        <View style={styles.question}>
          {eyebrow && <Footnote strong dim>{eyebrow}</Footnote>}
          <Question>{text}</Question>
        </View>
      );
    }
    case "hint":
      return <HintCard message={message} />;
    case "fact":
    case "redirect":
      return (
        <View style={styles.fact}>
          <Footnote strong dim>
            Fact desk
          </Footnote>
          <Body>{message.text}</Body>
        </View>
      );
    default:
      return <Reply text={message.text} />;
  }
}

/** A reply that ends in a question sets the question in italic, as the tutor asks it. */
function Reply({ text }: { text: string }) {
  const { statement, question } = splitTrailingQuestion(text);
  return (
    <Body>
      {statement}
      {statement && question ? " " : ""}
      {question && <Text style={type.bodyItalic}>{question}</Text>}
    </Body>
  );
}

function HintCard({ message }: { message: Message }) {
  const card = hintCardOf(message.hintStep);
  return (
    <View style={styles.hint} accessibilityRole="summary" accessibilityLabel={`${card.title}. ${message.text} ${card.note}`}>
      <View style={styles.hintHead}>
        <View style={styles.hintLabel}>
          <Icon name="sun" color={palette.day.hintIcon} size={18} />
          <Text style={[type.footnoteStrong, { color: palette.day.onHintContainer }]}>{card.title}</Text>
        </View>
        {card.pips !== null && (
          <View style={styles.pips}>
            {[1, 2, 3].map((n) => (
              <View key={n} style={[styles.pip, n <= card.pips! && styles.pipOn]} />
            ))}
          </View>
        )}
      </View>
      <Text style={[type.bodyItalic, { color: palette.day.onHintContainer }]}>{message.text}</Text>
      <Text style={[type.footnote, { color: palette.day.onHintContainer }]}>{card.note}</Text>
    </View>
  );
}

export function LearnerMessage({ text }: { text: string }) {
  const c = useColors();
  return (
    <View style={[styles.learner, { backgroundColor: c.surfaceContainer, borderColor: c.separator }]}>
      <Body>{text}</Body>
    </View>
  );
}

/** While the tutor answers: moving dots and what is happening (a fade only, with Reduce Motion). */
export function Thinking({ line }: { line: string }) {
  const c = useColors();
  return (
    <View style={styles.thinking} accessibilityLiveRegion="polite" accessibilityLabel={line}>
      <View style={[styles.dotsBox, { backgroundColor: c.surfaceContainer, borderColor: c.separator }]}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} delay={i * 200} />
        ))}
      </View>
      <Footnote dim>{line}</Footnote>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const c = useColors();
  const still = useReducedMotion();
  const opacity = useSharedValue(still ? 0.7 : 0.3);
  useEffect(() => {
    if (still) return;
    const half = motion.dots / 2;
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: delay }), withTiming(1, { duration: half - delay / 2 }), withTiming(0.3, { duration: half - delay / 2 })),
      -1,
    );
  }, [still, delay, opacity]);
  const look = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, { backgroundColor: c.onSurfaceVariant }, look]} />;
}

/** A failed call: what happened, where it happened, and a way to try again. Never terracotta. */
export function Failure({ message, children }: { message: string; children?: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.failure} accessibilityRole="alert">
      <Icon name="alert" color={c.onSurfaceVariant} />
      <View style={styles.failureBody}>
        <Text style={[type.ui, { color: c.onSurface }]}>{message}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  question: { gap: space.xs },
  fact: { gap: space.xs },
  hint: { backgroundColor: palette.day.hintContainer, borderRadius: radius.card, padding: space.l, gap: space.s },
  hintHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hintLabel: { flexDirection: "row", alignItems: "center", gap: space.s },
  pips: { flexDirection: "row", gap: space.xs },
  pip: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: palette.day.onHintContainer },
  pipOn: { backgroundColor: palette.day.onHintContainer },
  learner: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    paddingVertical: space.s,
    paddingHorizontal: space.l,
    borderRadius: radius.card,
    borderBottomRightRadius: space.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thinking: { flexDirection: "row", alignItems: "center", gap: space.m },
  dotsBox: {
    flexDirection: "row",
    gap: space.xs,
    paddingVertical: space.m,
    paddingHorizontal: space.l,
    borderRadius: radius.card,
    borderBottomLeftRadius: space.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  failure: { flexDirection: "row", alignItems: "flex-start", gap: space.m },
  failureBody: { flex: 1, gap: space.s },
});
