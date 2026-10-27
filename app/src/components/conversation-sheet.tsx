// A finished session's whole conversation, read again from its result (code review, Oct 26): every question, the
// learner's answers and questions, the feedback, the hints and the facts, in the order they came. One reading surface,
// like the explanation comparison: nothing here can be edited or sent, and nothing opens another sheet.
import { ScrollView, StyleSheet, View } from "react-native";
import { areaCopyOf } from "../area-copy.ts";
import { eyebrowOf, isReveal } from "../session/present.ts";
import type { Entry } from "../session/transcript.ts";
import { space } from "../theme.ts";
import { Aside, FactCard, HintCard, LearnerMessage, Revealed } from "./messages.tsx";
import { Body, Button, Sheet, Small, Title } from "./ui.tsx";

export function ConversationSheet({ open, onClose, concept, entries }: { open: boolean; onClose: () => void; concept: string; entries: readonly Entry[] }) {
  return (
    <Sheet open={open} onClose={onClose} label="The whole conversation" reading>
      <View style={styles.heading}>
        <Title>The whole conversation</Title>
        <Small dim>{`Your ${concept} session, from the first question to the result.`}</Small>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {entries.map((entry) => {
          const line = lineOf(entry, concept);
          return line && <View key={entry.id}>{line}</View>;
        })}
      </ScrollView>
      <Button kind="secondary" label="Back to results" onPress={onClose} />
    </Sheet>
  );
}

function lineOf(entry: Entry, concept: string) {
  // the worked example's map is the example's, not the learner's
  if (entry.from === "map") return null;
  if (entry.from === "learner") return <LearnerMessage text={entry.text} />;
  const { message } = entry;
  switch (message.kind) {
    case "question":
      return <Body>{areaCopyOf(eyebrowOf(message.text).text)}</Body>;
    case "hint":
      // the remembered line under a hint opens the Memory sheet, so it stays on the hint as the session showed it
      return isReveal(entry) ? <Revealed text={message.text} /> : <HintCard message={{ ...message, sources: undefined }} capNote={false} concept={concept} />;
    case "fact":
    case "redirect":
      return <FactCard kind={message.kind} text={message.text} />;
    default:
      return <Aside text={message.text} />;
  }
}

const styles = StyleSheet.create({
  heading: { gap: space.xs },
  scroll: { flex: 1, minHeight: 0 },
  content: { gap: space.l, paddingBottom: space.m },
});
