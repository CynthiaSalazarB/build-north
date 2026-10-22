// The bottom of a session screen (round 9 "Lumente"): the one input the latest Turn asks for (`expects`). Help is
// the firefly itself until the first hint; after it, "More help" sits by the input. A revealed answer holds the
// next question behind "Next question". Everything waits while a call is pending (decision 18).
import type { Turn } from "@build-north/agents";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { LearnerInput } from "../session/session-context.tsx";
import { space } from "../theme.ts";
import { Button, PromptField, SendButton } from "./ui.tsx";

type Props = {
  turn: Turn;
  pending: boolean;
  /** The words in the empty field: "In your own words", "Try again, in your own words", "Your answer". */
  placeholder: string;
  /** "More help" by the input, once the part has had a hint. */
  moreHelp: boolean;
  /** A revealed answer waits to be read: the button opens the next question. */
  onNext: (() => void) | null;
  onSend: (input: LearnerInput) => void;
};

export function Composer({ turn, pending, placeholder, moreHelp, onNext, onSend }: Props) {
  if (onNext) {
    return (
      <View style={styles.bar}>
        <Button label="Next question" onPress={onNext} />
      </View>
    );
  }
  switch (turn.expects) {
    case "text":
      return <AnswerBar pending={pending} placeholder={placeholder} moreHelp={turn.phase === "move" && moreHelp} onSend={onSend} />;
    case "continue":
      return (
        <View style={styles.bar}>
          <Button label="Continue" busy={pending} onPress={() => onSend({ action: "continue" })} />
        </View>
      );
    case "map":
      // Building the whole map alone is the level-5 screen (#26).
      return null;
    case "prediction":
    case "none":
      return null;
  }
}

function AnswerBar({ pending, placeholder, moreHelp, onSend }: { pending: boolean; placeholder: string; moreHelp: boolean; onSend: (input: LearnerInput) => void }) {
  const [text, setText] = useState("");
  const answer = text.trim();
  const submit = () => {
    if (!answer || pending) return;
    onSend({ text: answer });
    setText("");
  };
  return (
    <View style={[styles.bar, styles.row]}>
      {moreHelp && <Button kind="hint" label="More help" disabled={pending} onPress={() => onSend({ action: "help" })} />}
      <PromptField
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        multiline
        editable={!pending}
        accessibilityLabel="Your answer"
        onSubmitEditing={submit}
        submitBehavior="submit"
        style={[styles.flex, pending && styles.dim]}
        end={<SendButton busy={false} disabled={!answer || pending} onPress={submit} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.margin },
  row: { flexDirection: "row", alignItems: "flex-end", gap: space.s },
  flex: { flex: 1 },
  dim: { opacity: 0.55 },
});
