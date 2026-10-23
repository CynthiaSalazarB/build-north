// The bottom of a session screen (round 9 "Lumente"): the one input the latest Turn asks for (`expects`). Help is
// the firefly itself until the first hint; after it, "More help" sits by the input. A revealed answer holds the
// next question behind "Next question". Everything waits while a call is pending (decision 18). The guess has its
// own screen (guess.tsx), and so does the whole map at level 5 (whole-map.tsx).
import type { Turn } from "@build-north/agents";
import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { LearnerInput } from "../session/session-context.tsx";
import { space } from "../theme.ts";
import { Button, MicButton, PromptField, SendButton, VoiceNote } from "./ui.tsx";
import { useVoice } from "./use-voice.ts";

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
  /** In the website layout's column, which sets its own edges. */
  flush?: boolean;
};

export function Composer({ turn, pending, placeholder, moreHelp, onNext, onSend, flush = false }: Props) {
  const bar = [styles.bar, flush && styles.flush];
  if (onNext) {
    return (
      <View style={bar}>
        <Button label="Next question" onPress={onNext} />
      </View>
    );
  }
  switch (turn.expects) {
    case "text":
      return <AnswerBar pending={pending} placeholder={placeholder} moreHelp={turn.phase === "move" && moreHelp} onSend={onSend} style={bar} />;
    case "continue":
      return (
        <View style={bar}>
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

type AnswerProps = { pending: boolean; placeholder: string; moreHelp: boolean; onSend: (input: LearnerInput) => void; style: StyleProp<ViewStyle> };

function AnswerBar({ pending, placeholder, moreHelp, onSend, style }: AnswerProps) {
  const [text, setText] = useState("");
  const answer = text.trim();
  // speech lands in the same field, editable, and still needs Send
  const voice = useVoice({ text, onText: setText });
  const submit = () => {
    if (!answer || pending) return;
    // what is on screen is what goes; a phrase still being heard stops here instead of landing in the emptied field
    if (voice.state.kind === "listening") voice.cancel();
    onSend({ text: answer });
    setText("");
  };
  return (
    <View style={style}>
      <View style={styles.row}>
        {moreHelp && <Button kind="hint" label="More help" disabled={pending} onPress={() => onSend({ action: "help" })} />}
        <MicButton state={voice.state} onPress={voice.toggle} disabled={pending && voice.state.kind !== "listening"} />
        <PromptField
          value={text}
          onChangeText={setText}
          placeholder={voice.state.kind === "listening" ? "Listening" : placeholder}
          multiline
          editable={!pending}
          accessibilityLabel="Your answer"
          onSubmitEditing={submit}
          submitBehavior="submit"
          style={[styles.flex, pending && styles.dim]}
          end={<SendButton busy={false} disabled={!answer || pending} onPress={submit} />}
        />
      </View>
      <VoiceNote state={voice.state} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.margin },
  flush: { paddingHorizontal: 0, paddingBottom: space.xl },
  row: { flexDirection: "row", alignItems: "flex-end", gap: space.s },
  flex: { flex: 1 },
  dim: { opacity: 0.55 },
});
