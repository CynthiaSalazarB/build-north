// The session screen (#6, #7): the conversation so far, the map, and the one input the latest Turn
// asks for. A single route with no id in the path, so the web build stays static (decision 14, #27).
import { MOVE_LABEL, type Turn } from "@build-north/agents";
import { Redirect, useRouter } from "expo-router";
import { useRef } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { Composer } from "../components/composer.tsx";
import { MapCard } from "../components/map-card.tsx";
import { AppMessage, LearnerMessage, Thinking } from "../components/messages.tsx";
import { ResultCard } from "../components/result-card.tsx";
import { Button, Screen, Small } from "../components/ui.tsx";
import { useSession } from "../session/session-context.tsx";
import { colors, fonts, radius, space } from "../theme.ts";

function statusOf(turn: Turn): string {
  switch (turn.phase) {
    case "predict":
      return "Your prediction";
    case "attempt":
      return "In your own words";
    case "example":
      return "Watch an example";
    case "move":
      return turn.move ? `${MOVE_LABEL[turn.move]} · level ${turn.level}` : "Build the whole map";
    case "result":
      return "Your result";
  }
}

export default function SessionScreen() {
  const router = useRouter();
  const { state, send, retry } = useSession();
  const scroll = useRef<ScrollViewInstance>(null);
  const { turn, entries, pending, failure } = state;
  if (!turn) return <Redirect href="/" />;

  const map = turn.phase === "example" && turn.example ? turn.example : turn.mentefacto;
  const showMap = turn.phase === "example" || turn.phase === "move" || turn.phase === "result";
  const done = turn.progress.movesDone;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.concept} numberOfLines={1}>
          {turn.mentefacto.concept}
        </Text>
        <Small>{statusOf(turn)}</Small>
        <View style={styles.progress} accessibilityLabel={`${done} of ${turn.progress.movesTotal} parts done, ${turn.progress.hintsUsed} help`}>
          {Array.from({ length: turn.progress.movesTotal }, (_, i) => (
            <View key={i} style={[styles.segment, i < done && styles.segmentDone]} />
          ))}
          <Small style={styles.help}>{`Help: ${turn.progress.hintsUsed}`}</Small>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* pinned above the conversation, so the map stays in sight while the learner works on it */}
        {showMap && (
          <View style={styles.pinned}>
            <MapCard
              map={map}
              title={turn.phase === "example" ? `Example: ${map.concept}` : "Your map"}
              current={turn.phase === "move" ? turn.move : null}
              scaffold={turn.scaffold}
              example={turn.phase === "example"}
            />
          </View>
        )}
        <ScrollView
          ref={scroll}
          style={styles.flex}
          contentContainerStyle={styles.transcript}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {entries.map((entry) =>
            entry.from === "app" ? <AppMessage key={entry.id} message={entry.message} /> : <LearnerMessage key={entry.id} text={entry.text} />,
          )}
          {pending && <Thinking />}
          {failure && (
            <View style={styles.failure} accessibilityLiveRegion="polite">
              <Text style={styles.failureText}>{failure.message}</Text>
              {failure.retryable && <Button label="Try again" kind="secondary" onPress={retry} />}
            </View>
          )}
          {turn.result && <ResultCard result={turn.result} />}
          {turn.expects === "none" && (
            <Button label="Start a new session" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
          )}
        </ScrollView>
        <Composer turn={turn} pending={pending !== null} onSend={send} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pinned: { paddingHorizontal: space.lg, paddingTop: space.md },
  header: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.md, gap: space.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  concept: { fontFamily: fonts.body, fontSize: fonts.size.large, fontWeight: fonts.weight.bold, color: colors.text, textTransform: "capitalize" },
  progress: { flexDirection: "row", alignItems: "center", gap: space.xs, paddingTop: space.xs },
  segment: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  segmentDone: { backgroundColor: colors.found },
  help: { marginLeft: space.sm },
  transcript: { padding: space.lg, gap: space.md },
  failure: { backgroundColor: colors.errorBackground, borderRadius: radius.md, padding: space.md, gap: space.sm },
  failureText: { fontFamily: fonts.body, fontSize: fonts.size.body, color: colors.error },
});
