// One line of the conversation. The learner sees what kind of message it is (a question, a hint, the
// example...), never which agent wrote it.
import type { HintStep, Message } from "@build-north/agents";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, space } from "../theme.ts";

const HINT_STEP: Record<HintStep, string> = { nudge: "Nudge", hint: "Hint", partial: "Part of the answer", reveal: "The answer" };

type Look = { label: string | null; box: object; labelColor: string };

function lookOf(message: Message): Look {
  switch (message.kind) {
    case "question":
      return { label: null, box: styles.question, labelColor: colors.question };
    case "hint":
      return { label: message.hintStep ? HINT_STEP[message.hintStep] : "Hint", box: styles.hint, labelColor: colors.hint };
    case "example":
      return { label: message.agent === "app" ? null : "Example", box: styles.example, labelColor: colors.example };
    case "named_move":
      return { label: null, box: styles.found, labelColor: colors.found };
    case "summary":
      return { label: "Coach", box: styles.coach, labelColor: colors.coach };
    case "fact":
    case "redirect":
      return { label: "Fact desk", box: styles.feedback, labelColor: colors.textMuted };
    default:
      return { label: null, box: styles.feedback, labelColor: colors.feedback };
  }
}

export function AppMessage({ message }: { message: Message }) {
  const look = lookOf(message);
  return (
    <View style={[styles.bubble, look.box]}>
      {look.label && <Text style={[styles.label, { color: look.labelColor }]}>{look.label}</Text>}
      <Text style={[styles.text, message.kind === "question" && styles.questionText]}>{message.text}</Text>
    </View>
  );
}

export function LearnerMessage({ text }: { text: string }) {
  return (
    <View style={[styles.bubble, styles.learner]}>
      <Text style={[styles.text, styles.learnerText]}>{text}</Text>
    </View>
  );
}

export function Thinking() {
  return (
    <View style={[styles.bubble, styles.feedback, styles.thinking]} accessibilityLiveRegion="polite" accessibilityLabel="Thinking">
      <ActivityIndicator color={colors.textMuted} size="small" />
      <Text style={[styles.text, styles.mutedText]}>Thinking…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: "88%", alignSelf: "flex-start", paddingVertical: space.md, paddingHorizontal: space.lg, borderRadius: radius.md, gap: space.xs },
  label: { fontFamily: fonts.body, fontSize: fonts.size.small, fontWeight: fonts.weight.bold, textTransform: "uppercase", letterSpacing: 0.5 },
  text: { fontFamily: fonts.body, fontSize: fonts.size.body, lineHeight: 23, color: colors.text },
  questionText: { fontSize: fonts.size.large, lineHeight: 26, fontWeight: fonts.weight.medium },
  mutedText: { color: colors.textMuted },
  question: { maxWidth: "100%", alignSelf: "stretch", backgroundColor: colors.surface, borderLeftWidth: 4, borderLeftColor: colors.question },
  feedback: { backgroundColor: colors.surface },
  hint: { backgroundColor: colors.hintBackground },
  example: { backgroundColor: colors.exampleBackground },
  found: { backgroundColor: colors.foundBackground },
  coach: { maxWidth: "100%", alignSelf: "stretch", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  learner: { alignSelf: "flex-end", backgroundColor: colors.learner },
  learnerText: { color: colors.learnerText },
  thinking: { flexDirection: "row", alignItems: "center", gap: space.sm },
});
