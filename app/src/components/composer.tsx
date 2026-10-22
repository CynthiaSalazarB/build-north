// The bottom of the session screen: the one input the latest Turn asks for (`expects`), and Help
// during the moves. Everything is disabled while a call is pending (decision 18).
import type { Turn } from "@build-north/agents";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { LearnerInput } from "../session/session-context.tsx";
import { colors, fonts, radius, space } from "../theme.ts";
import { Button, Small } from "./ui.tsx";

type Props = { turn: Turn; pending: boolean; onSend: (input: LearnerInput) => void };

export function Composer({ turn, pending, onSend }: Props) {
  switch (turn.expects) {
    case "prediction":
      return <PredictionPicker pending={pending} onPick={(prediction) => onSend({ prediction })} />;
    case "text":
      return <TextComposer pending={pending} canHelp={turn.phase === "move"} onSend={onSend} />;
    case "continue":
      return (
        <View style={styles.bar}>
          <Button label="Continue" busy={pending} onPress={() => onSend({ action: "continue" })} />
        </View>
      );
    case "map":
      // The whole-map screen (level 5) is #26.
      return (
        <View style={styles.bar}>
          <Small>The whole-map screen is coming soon.</Small>
        </View>
      );
    case "none":
      return null;
  }
}

function PredictionPicker({ pending, onPick }: { pending: boolean; onPick: (n: number) => void }) {
  return (
    <View style={styles.bar}>
      <View style={styles.numbers}>
        {Array.from({ length: 9 }, (_, n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} of 8`}
            disabled={pending}
            onPress={() => onPick(n)}
            style={({ pressed }) => [styles.number, pending && styles.disabled, pressed && styles.numberPressed]}
          >
            <Text style={styles.numberLabel}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <Small style={styles.center}>Points out of 8</Small>
    </View>
  );
}

function TextComposer({ pending, canHelp, onSend }: { pending: boolean; canHelp: boolean; onSend: (input: LearnerInput) => void }) {
  const [text, setText] = useState("");
  const answer = text.trim();
  const submit = () => {
    if (!answer || pending) return;
    onSend({ text: answer });
    setText("");
  };
  return (
    <View style={styles.bar}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Your answer"
        placeholderTextColor={colors.textMuted}
        multiline
        editable={!pending}
        accessibilityLabel="Your answer"
        style={styles.input}
        onSubmitEditing={submit}
        submitBehavior="submit"
      />
      <View style={styles.actions}>
        {canHelp && <Button label="Help" kind="secondary" disabled={pending} onPress={() => onSend({ action: "help" })} style={styles.help} />}
        <Button label="Send" busy={pending} disabled={!answer} onPress={submit} style={styles.send} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { padding: space.md, gap: space.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  numbers: { flexDirection: "row", justifyContent: "space-between", gap: space.xs },
  number: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  numberPressed: { backgroundColor: colors.primary },
  numberLabel: { fontFamily: fonts.body, fontSize: fonts.size.large, fontWeight: fonts.weight.medium, color: colors.text },
  disabled: { opacity: 0.45 },
  center: { textAlign: "center" },
  input: {
    minHeight: 48,
    maxHeight: 140,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontFamily: fonts.body,
    fontSize: fonts.size.body,
    color: colors.text,
  },
  actions: { flexDirection: "row", gap: space.sm },
  help: { flex: 1 },
  send: { flex: 2 },
});
