// The bottom of a session screen (round 8): the one input the latest Turn asks for (`expects`), with Help
// above it during the moves, as an amber outline that says what it costs. Everything waits while a call is
// pending (decision 18). The guess has its own screen (guess.tsx), and so does the whole map at level 5
// (whole-map.tsx).
import type { Turn } from "@build-north/agents";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import type { LearnerInput } from "../session/session-context.tsx";
import { radius, size, space } from "../theme.ts";
import { Icon } from "./icons.tsx";
import { Button, PromptField, useColors } from "./ui.tsx";

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
    // the guess and the whole map (level 5) have their own screens
    case "map":
    case "prediction":
    case "none":
      return null;
  }
}

function AnswerBar({ pending, help, onSend }: { pending: boolean; help: string | null; onSend: (input: LearnerInput) => void }) {
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
          icon="bulb"
          label={help}
          hint={help.includes("pt") ? "Costs a point: this part can then score 1 at most" : undefined}
          disabled={pending}
          onPress={() => onSend({ action: "help" })}
        />
      )}
      <PromptField
        value={text}
        onChangeText={setText}
        placeholder="Your answer"
        multiline
        editable={!pending}
        accessibilityLabel="Your answer"
        onSubmitEditing={submit}
        submitBehavior="submit"
        style={pending ? styles.dim : undefined}
        end={<SendButton busy={pending} disabled={!answer} onPress={submit} />}
      />
    </View>
  );
}

/** The square send button inside a field; it shows a spinner while the tutor answers. */
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
      hitSlop={size.hitSlop}
      style={({ pressed }) => [
        styles.send,
        { backgroundColor: off ? c.surfaceHigh : c.primary },
        pressed && !off && styles.pressed,
      ]}
    >
      {busy ? <ActivityIndicator color={c.onSurfaceVariant} /> : <Icon name="up" color={off ? c.onSurfaceVariant : c.onPrimary} size={20} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.m, gap: space.s },
  dim: { opacity: 0.55 },
  send: { width: size.smallButton, height: size.smallButton, borderRadius: radius.iconButton, alignItems: "center", justifyContent: "center" },
  pressed: { transform: [{ scale: 0.95 }] },
});
