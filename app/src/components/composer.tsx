// The bottom of a session screen: the one input the latest Turn asks for (`expects`), and Help during the
// moves with its price on it. Everything waits while a call is pending (decision 18). The guess has its
// own screen (guess.tsx).
import type { Turn } from "@build-north/agents";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import type { LearnerInput } from "../session/session-context.tsx";
import { radius, size, space, type } from "../theme.ts";
import { Icon } from "./icons.tsx";
import { Button, Footnote, useColors } from "./ui.tsx";

type Props = { turn: Turn; pending: boolean; helpLabel: string; onSend: (input: LearnerInput) => void };

export function Composer({ turn, pending, helpLabel, onSend }: Props) {
  switch (turn.expects) {
    case "text":
      return <AnswerBar pending={pending} help={turn.phase === "move" ? helpLabel : null} onSend={onSend} />;
    case "continue":
      return (
        <View style={styles.bar}>
          <Button label="Continue" busy={pending} onPress={() => onSend({ action: "continue" })} />
        </View>
      );
    case "map":
      // Building the whole map alone is the level-5 screen (#26).
      return (
        <View style={styles.bar}>
          <Footnote dim>Building the whole map yourself (level 5) isn't in this version yet.</Footnote>
        </View>
      );
    case "prediction":
    case "none":
      return null;
  }
}

function AnswerBar({ pending, help, onSend }: { pending: boolean; help: string | null; onSend: (input: LearnerInput) => void }) {
  const c = useColors();
  const [text, setText] = useState("");
  const answer = text.trim();
  const submit = () => {
    if (!answer || pending) return;
    onSend({ text: answer });
    setText("");
  };
  return (
    <View style={styles.bar}>
      {help && (
        <Button
          kind="hint"
          icon="sun"
          label={help}
          hint={help.includes("pt") ? "Costs a point: this part can then score 1 at most" : undefined}
          disabled={pending}
          onPress={() => onSend({ action: "help" })}
        />
      )}
      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Your answer"
          placeholderTextColor={c.placeholder}
          multiline
          editable={!pending}
          accessibilityLabel="Your answer"
          style={[styles.field, { color: c.onSurface, backgroundColor: c.surfaceContainer, borderColor: c.separator }]}
          onSubmitEditing={submit}
          submitBehavior="submit"
        />
        <SendButton busy={pending} disabled={!answer} onPress={submit} />
      </View>
    </View>
  );
}

/** The round bronze send button; it shows a spinner while the tutor answers. */
export function SendButton({ busy, disabled, onPress, label = "Send" }: { busy: boolean; disabled: boolean; onPress: () => void; label?: string }) {
  const c = useColors();
  const off = busy || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={busy ? "Sending" : label}
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [styles.send, { backgroundColor: c.primary }, disabled && !busy && styles.disabled, pressed && !off && styles.pressed]}
    >
      {busy ? <ActivityIndicator color={c.onPrimary} /> : <Icon name="up" color={c.onPrimary} size={22} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.m, gap: space.s },
  row: { flexDirection: "row", alignItems: "flex-end", gap: space.s },
  // grows with the answer up to about four lines; on Android a custom line height or centering makes a
  // multiline field show only its last line
  field: {
    ...type.ui,
    flex: 1,
    minHeight: size.button,
    maxHeight: 128,
    paddingHorizontal: space.margin,
    paddingVertical: space.m,
    borderRadius: radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    textAlignVertical: "top",
  },
  send: { width: size.button, height: size.button, borderRadius: radius.button, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.96 }] },
});
