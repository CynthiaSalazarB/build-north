// The bottom of a session screen: the one input the latest Turn asks for (`expects`). The quiet help link opens
// the scoring preview, also reached through the firefly. A revealed answer holds the next question behind
// "Next question". Everything waits while a call is pending (decision 18). The guess has its
// own screen (guess.tsx), and so does the whole map at level 5 (whole-map.tsx).
import type { MoveId, Turn } from "@build-north/agents";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { LearnerInput } from "../session/session-context.tsx";
import { FIRST_EXPLANATION_NOTE } from "../session/comparison.ts";
import { answerLabelOf, categoryContextOf, type GuidedHelpView } from "../session/present.ts";
import { partOf } from "../session/transcript.ts";
import { space } from "../theme.ts";
import { Button, MicButton, PromptField, SendButton, Small, VoiceNote } from "./ui.tsx";
import { useVoice } from "./use-voice.ts";

type Props = {
  turn: Turn;
  pending: boolean;
  /** The words in the empty field: "In your own words", "Try again, in your own words", "Your answer". */
  placeholder: string;
  help: GuidedHelpView | null;
  onHelp: () => void;
  /** A revealed answer waits to be read: the button opens the next question. */
  onNext: (() => void) | null;
  onSend: (input: LearnerInput) => void;
  /** The words typed on this part and not sent, from before Save and close (`unsentOf`). */
  unsent: string;
  /** The answer field's words as they settle, with the part they're on, so Save and close keeps them (`typed`). */
  onType: (move: MoveId | null, text: string) => void;
  /** In the website layout's column, which sets its own edges. */
  flush?: boolean;
};

export function Composer({ turn, pending, placeholder, help, onHelp, onNext, onSend, unsent, onType, flush = false }: Props) {
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
      return <AnswerBar pending={pending} placeholder={placeholder} label={answerLabelOf(turn)} context={turn.phase === "attempt" ? FIRST_EXPLANATION_NOTE : turn.phase === "move" && turn.move === "exclusion" ? categoryContextOf(turn.mentefacto) : null} help={turn.phase === "move" ? help : null} onHelp={onHelp} onSend={onSend} initial={unsent} part={partOf(turn)} onType={onType} style={bar} />;
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

type AnswerProps = {
  pending: boolean;
  placeholder: string;
  label: string;
  context: string | null;
  help: GuidedHelpView | null;
  onHelp: () => void;
  onSend: (input: LearnerInput) => void;
  initial: string;
  part: MoveId | null;
  onType: (move: MoveId | null, text: string) => void;
  style: StyleProp<ViewStyle>;
};

/** How long the field waits after the last keystroke before its words go to the session (and from there the device). */
const KEEP_AFTER_MS = 400;

function AnswerBar({ pending, placeholder, label, context, help, onHelp, onSend, initial, part, onType, style }: AnswerProps) {
  const [text, setText] = useState(initial);
  const answer = text.trim();
  // speech lands in the same field, editable, and still needs Send
  const voice = useVoice({ text, onText: setText });
  // The words go to the session once typing settles, and at once when the bar goes (Save and close, or a reveal moving
  // on), with the part they were typed on, so the device keeps them and they come back on that part (code review, Oct 26).
  const kept = useRef({ text, part, onType });
  useEffect(() => {
    kept.current = { text, part, onType };
  }, [text, part, onType]);
  useEffect(() => {
    const timer = setTimeout(() => kept.current.onType(part, text), KEEP_AFTER_MS);
    return () => clearTimeout(timer);
  }, [text, part]);
  useEffect(() => () => kept.current.onType(kept.current.part, kept.current.text), []);
  const submit = () => {
    if (!answer || pending) return;
    // what is on screen is what goes; a phrase still being heard stops here instead of landing in the emptied field
    if (voice.state.kind === "listening") voice.cancel();
    onSend({ text: answer });
    setText("");
  };
  return (
    <View style={style}>
      <Small dim style={styles.label}>{label}</Small>
      {context && <Small dim style={styles.label}>{context}</Small>}
      {help && <Button kind="hintLink" label={help.label} disabled={pending} onPress={onHelp} />}
      <View style={styles.row}>
        <MicButton state={voice.state} onPress={voice.toggle} disabled={pending && voice.state.kind !== "listening"} />
        <PromptField
          value={text}
          onChangeText={(typed) => {
            // the learner's edit stands: listening stops instead of rebuilding the field over it
            voice.cancel();
            setText(typed);
          }}
          placeholder={voice.state.kind === "listening" ? "Listening" : placeholder}
          multiline
          maxLength={2000}
          editable={!pending}
          accessibilityLabel={label}
          onSubmitEditing={submit}
          submitBehavior="submit"
          style={[styles.flex, pending && styles.dim]}
          end={<SendButton busy={pending} disabled={!answer || pending} onPress={submit} />}
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
  label: { marginBottom: space.s },
});
