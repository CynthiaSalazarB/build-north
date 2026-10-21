// The session (#6, #7, round 8): the guess, then the work (the checks list, the part you're on, the one
// input the latest Turn asks for, or at level 5 the whole map with the fact desk), then the result. A
// single route with no id in the path, so the web build stays static (decision 14, #27). Closing saves:
// the start screen offers to resume.
import { MOVE_LABEL, type Turn } from "@build-north/agents";
import { Redirect, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from "react-native";
import { ChecksList } from "../components/checks.tsx";
import { Composer } from "../components/composer.tsx";
import { GuessScreen } from "../components/guess.tsx";
import { MapCard } from "../components/map-card.tsx";
import { AppMessage, Failure, LearnerMessage, Thinking, useSlow } from "../components/messages.tsx";
import { ResultScreen } from "../components/result.tsx";
import { SessionBar } from "../components/session-bar.tsx";
import { WholeMapScreen } from "../components/whole-map.tsx";
import { Body, Button, Card, KeyboardSafe, Label, Screen, SheetTitle, useColors } from "../components/ui.tsx";
import { checksOf, currentPartOf, eyebrowOf, helpLabelOf, partLabelOf, partNotesOf, sinceLastQuestion, waitingLineOf } from "../session/present.ts";
import { useSession } from "../session/session-context.tsx";
import type { Entry, SessionState } from "../session/transcript.ts";
import { radius, space } from "../theme.ts";

export default function SessionScreen() {
  const router = useRouter();
  const { state, send, retry, start, edit } = useSession();
  const [again, setAgain] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });
  const { turn } = state;
  if (!turn) return <Redirect href="/" />;

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const home = () => router.replace("/");

  if (turn.phase === "predict") {
    return (
      <GuessScreen
        turn={turn}
        pending={state.pending !== null}
        failure={state.failure}
        onLock={(prediction) => send({ prediction })}
        onRetry={retry}
        onClose={close}
      />
    );
  }
  if (turn.result && turn.expects === "none") {
    const concept = turn.mentefacto.concept;
    // a self-test is tried again as a self-test
    const tryAgain = async () => {
      setAgain({ busy: true, error: null });
      const problem = await start({ concept, ...(state.mode === "test" ? { mode: state.mode } : {}) });
      setAgain({ busy: false, error: problem });
    };
    return (
      <ResultScreen
        concept={concept}
        result={turn.result}
        map={turn.mentefacto}
        entries={state.entries}
        notes={partNotesOf(turn.messages)}
        onAgain={() => void tryAgain()}
        againBusy={again.busy}
        againError={again.error}
        onDone={home}
      />
    );
  }
  if (turn.expects === "map") {
    return <WholeMapScreen turn={turn} state={state} send={send} retry={retry} edit={edit} onClose={close} />;
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
  // the guess has its own screen; earlier parts are in the checks list
  const entries = currentPartOf(state.entries.filter((e) => e.from !== "app" || e.phase !== "predict"));
  const firstHint = entries.find((e) => e.from === "app" && e.message.kind === "hint")?.id;
  const { failure } = state;
  const saved = failure && "text" in failure.body ? " Your answer is saved." : "";
  const done = turn.progress.movesDone;
  const label = partLabelOf(turn);

  return (
    <Screen>
      <SessionBar
        concept={turn.mentefacto.concept}
        onClose={onClose}
        progress={{ done, now: turn.phase === "move" ? done : null, label: label ?? `${done}/${turn.progress.movesTotal}` }}
        onMap={() => setMapOpen(true)}
      />
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
          <ChecksList checks={checksOf(turn, state.entries)} />
          {entries.map((entry) => (
            <EntryView
              key={entry.id}
              entry={entry}
              firstHint={entry.id === firstHint}
              onExampleLayout={(y) => {
                exampleTop.current = y;
                if (turn.phase === "example") scroll.current?.scrollTo({ y, animated: true });
              }}
            />
          ))}
          {turn.phase === "move" && turn.scaffold && (
            <Card style={styles.indent}>
              <Body>{`Already on your map: ${turn.scaffold.given.join(", ")}. ${turn.scaffold.blanks} more for you to find.`}</Body>
            </Card>
          )}
          {state.pending && <Thinking line={slow ? "taking longer than usual…" : waitingLineOf(state.pending)} />}
          {failure && (
            <Failure message={`${failure.message}${saved}`}>{failure.retryable && <Button kind="secondary" label="Try again" onPress={retry} />}</Failure>
          )}
        </ScrollView>
        <Composer turn={turn} pending={state.pending !== null} helpLabel={helpLabelOf(sinceLastQuestion(state.entries))} onSend={send} />
      </KeyboardSafe>
      <MapSheet turn={turn} open={mapOpen} onClose={() => setMapOpen(false)} />
    </Screen>
  );
}

/** One line of the part you're on: the tutor's question gets the part's name (or "before any help") above it. */
function EntryView({ entry, firstHint, onExampleLayout }: { entry: Entry; firstHint: boolean; onExampleLayout: (y: number) => void }) {
  if (entry.from === "learner") return <LearnerMessage text={entry.text} />;
  if (entry.from === "map") {
    return (
      <View onLayout={(e) => onExampleLayout(e.nativeEvent.layout.y)}>
        <MapCard map={entry.map} title={`example: ${entry.map.concept}`} />
      </View>
    );
  }
  if (entry.message.kind === "question") {
    const { eyebrow, text } = eyebrowOf(entry.message.text);
    const label = eyebrow ?? (entry.phase === "move" && entry.move ? MOVE_LABEL[entry.move] : null);
    return <AppMessage message={{ ...entry.message, text }} label={label} />;
  }
  return <AppMessage message={entry.message} firstHint={firstHint} />;
}

/** The map so far, in a sheet over the session (the mini box opens it). */
function MapSheet({ turn, open, onClose }: { turn: Turn; open: boolean; onClose: () => void }) {
  const c = useColors();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { backgroundColor: c.scrim }]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close the map" />
      <View style={[styles.sheet, { backgroundColor: c.surfaceContainer }]}>
        <View style={[styles.grabber, { backgroundColor: c.outline }]} />
        <View style={styles.sheetHead}>
          <View style={styles.flex}>
            <SheetTitle>Your map</SheetTitle>
            <Label dim>{turn.mentefacto.concept}</Label>
          </View>
          <Button kind="secondary" label="Close" onPress={onClose} />
        </View>
        <MapCard map={turn.mentefacto} title="so far" current={turn.phase === "move" ? turn.move : null} scaffold={turn.scaffold} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  transcript: { paddingHorizontal: space.margin, paddingTop: space.m, paddingBottom: space.xl, gap: space.l },
  indent: { marginLeft: 40 + space.m },
  scrim: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space.margin,
    paddingTop: space.m,
    paddingBottom: space.xxl,
    gap: space.m,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  grabber: { alignSelf: "center", width: 36, height: 4, borderRadius: 2 },
  sheetHead: { flexDirection: "row", alignItems: "center", gap: space.m },
});
