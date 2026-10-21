// The session (#6, #7, round 6): the guess in the cave, then the work in daylight (the conversation, the
// one input the latest Turn asks for), then the result. A single route with no id in the path, so the web
// build stays static (decision 14, #27). Closing saves: the start screen offers to resume.
import type { Turn } from "@build-north/agents";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from "react-native";
import { Composer } from "../components/composer.tsx";
import { GuessScreen } from "../components/guess.tsx";
import { MapCard } from "../components/map-card.tsx";
import { AppMessage, Failure, LearnerMessage, Thinking } from "../components/messages.tsx";
import { ResultScreen } from "../components/result.tsx";
import { SessionBar } from "../components/session-bar.tsx";
import { Body, Button, KeyboardSafe, Screen, StageChip, Ui } from "../components/ui.tsx";
import { helpLabelOf, sinceLastQuestion, waitingLineOf } from "../session/present.ts";
import { useSession } from "../session/session-context.tsx";
import type { SessionState } from "../session/transcript.ts";
import { palette, radius, space } from "../theme.ts";

/** A reply that takes longer than this says so (NN/g: over 10 s, explain the wait). */
const SLOW_MS = 10_000;

export default function SessionScreen() {
  const router = useRouter();
  const { state, send, retry } = useSession();
  const { turn } = state;
  // The dawn plays once, between the guess and the first question.
  const [dawnDone, setDawnDone] = useState(() => turn?.phase !== "predict");
  if (!turn) return <Redirect href="/" />;

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (turn.phase === "predict" || !dawnDone) {
    return (
      <GuessScreen
        turn={turn}
        pending={state.pending !== null}
        failure={state.failure}
        onLock={(prediction) => {
          setDawnDone(false);
          send({ prediction });
        }}
        onRetry={() => {
          setDawnDone(false);
          retry();
        }}
        onClose={close}
        onDawnEnd={() => setDawnDone(true)}
      />
    );
  }
  if (turn.result && turn.expects === "none") {
    return <ResultScreen concept={turn.mentefacto.concept} result={turn.result} onDone={() => router.replace("/")} />;
  }
  return <WorkScreen turn={turn} state={state} send={send} retry={retry} onClose={close} />;
}

type WorkProps = { turn: Turn; state: SessionState; send: ReturnType<typeof useSession>["send"]; retry: () => void; onClose: () => void };

function WorkScreen({ turn, state, send, retry, onClose }: WorkProps) {
  const scroll = useRef<ScrollViewInstance>(null);
  // where the worked example's map starts: the example step opens on it, not on the last line
  const exampleTop = useRef<number | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const slow = useSlow(state.pending !== null);
  // the guess and its question stay on the guess screen
  const entries = state.entries.filter((e) => e.from !== "app" || e.phase !== "predict");
  const { failure } = state;
  const saved = failure && "text" in failure.body ? " Your answer is saved." : "";

  return (
    <Screen tone="day">
      <SessionBar turn={turn} onClose={onClose} onMap={() => setMapOpen(true)} />
      <KeyboardSafe>
        <ScrollView
          ref={scroll}
          style={styles.flex}
          contentContainerStyle={styles.transcript}
          onContentSizeChange={() =>
            turn.phase === "example" && exampleTop.current !== null
              ? scroll.current?.scrollTo({ y: exampleTop.current, animated: true })
              : scroll.current?.scrollToEnd({ animated: true })
          }
          keyboardShouldPersistTaps="handled"
        >
          {entries.map((entry) =>
            entry.from === "app" ? (
              <View key={entry.id} style={styles.entry}>
                {entry.message.kind === "question" && entry.phase === "move" && entry.level && <StageChip level={entry.level} />}
                <AppMessage message={entry.message} />
              </View>
            ) : entry.from === "map" ? (
              <View
                key={entry.id}
                onLayout={(e) => {
                  exampleTop.current = e.nativeEvent.layout.y;
                  if (turn.phase === "example") scroll.current?.scrollTo({ y: exampleTop.current, animated: true });
                }}
              >
                <MapCard map={entry.map} title={`Example: ${entry.map.concept}`} />
              </View>
            ) : (
              <LearnerMessage key={entry.id} text={entry.text} />
            ),
          )}
          {turn.phase === "move" && turn.scaffold && (
            <View style={styles.scaffold}>
              <Body>{`Already on your map: ${turn.scaffold.given.join(", ")}. ${turn.scaffold.blanks} more for you to find.`}</Body>
            </View>
          )}
          {state.pending && <Thinking line={slow ? "Taking longer than usual…" : waitingLineOf(state.pending)} />}
          {failure && (
            <Failure message={`${failure.message}${saved}`}>{failure.retryable && <Button kind="tonal" label="Try Again" onPress={retry} />}</Failure>
          )}
        </ScrollView>
        <Composer turn={turn} pending={state.pending !== null} helpLabel={helpLabelOf(sinceLastQuestion(state.entries))} onSend={send} />
      </KeyboardSafe>
      <MapSheet turn={turn} open={mapOpen} onClose={() => setMapOpen(false)} />
    </Screen>
  );
}

/** True once a call has been in flight for SLOW_MS. */
function useSlow(waiting: boolean): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (!waiting) return;
    const timer = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(timer);
  }, [waiting]);
  return slow;
}

/** The map so far, in a half-height sheet over the session (the Greek key opens it). */
function MapSheet({ turn, open, onClose }: { turn: Turn; open: boolean; onClose: () => void }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close the map" />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.sheetHead}>
          <Ui strong>Your map</Ui>
          <Button kind="tonal" label="Close" onPress={onClose} />
        </View>
        <MapCard map={turn.mentefacto} title={turn.mentefacto.concept} current={turn.phase === "move" ? turn.move : null} scaffold={turn.scaffold} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  transcript: { paddingHorizontal: space.margin, paddingTop: space.l, paddingBottom: space.xl, gap: space.l },
  entry: { gap: space.m },
  scaffold: { backgroundColor: palette.day.surfaceContainer, borderRadius: radius.card, padding: space.l },
  scrim: { flex: 1, backgroundColor: palette.day.scrim },
  sheet: {
    backgroundColor: palette.day.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space.l,
    paddingTop: space.m,
    paddingBottom: space.xxl,
    gap: space.m,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  grabber: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: palette.day.placeholder, opacity: 0.5 },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
