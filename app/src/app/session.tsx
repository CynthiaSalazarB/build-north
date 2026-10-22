// The session (#6, #7, round 9 "Lumente"): the guess, then the work (the map in the light the learner has earned,
// the firefly's question with the part it asks about, and the one input the latest Turn asks for), then the
// result. A single route with no id in the path, so the web build stays static (decision 14, #27). Closing saves:
// the start screen offers to resume.
import type { Turn } from "@build-north/agents";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from "react-native";
import { Composer } from "../components/composer.tsx";
import { ConceptMap } from "../components/concept-map.tsx";
import { GuessScreen } from "../components/guess.tsx";
import { Ask, Aside, FactCard, Failure, HintCard, LearnerMessage, Nudge, Revealed, useSlow, Waiting } from "../components/messages.tsx";
import { ResultScreen } from "../components/result.tsx";
import { SessionBar } from "../components/session-bar.tsx";
import { Body, Button, KeyboardSafe, Screen } from "../components/ui.tsx";
import { tick } from "../haptics.ts";
import {
  cappedOf,
  currentPartOf,
  exampleParts,
  eyebrowOf,
  helpOf,
  isReveal,
  justLitOf,
  partsOf,
  provedOf,
  revealHoldOf,
  waitingLineOf,
} from "../session/present.ts";
import { useSession } from "../session/session-context.tsx";
import type { Entry, SessionState } from "../session/transcript.ts";
import { size, space } from "../theme.ts";

export default function SessionScreen() {
  const router = useRouter();
  const { state, send, retry, start } = useSession();
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
    const tryAgain = async () => {
      setAgain({ busy: true, error: null });
      const problem = await start({ concept });
      setAgain({ busy: false, error: problem });
    };
    return (
      <ResultScreen
        concept={concept}
        result={turn.result}
        map={turn.mentefacto}
        onAgain={() => void tryAgain()}
        againBusy={again.busy}
        againError={again.error}
        onDone={home}
      />
    );
  }
  return <WorkScreen turn={turn} state={state} send={send} retry={retry} onClose={close} />;
}

type WorkProps = { turn: Turn; state: SessionState; send: ReturnType<typeof useSession>["send"]; retry: () => void; onClose: () => void };

function WorkScreen({ turn, state, send, retry, onClose }: WorkProps) {
  const scroll = useRef<ScrollViewInstance>(null);
  const [passed, setPassed] = useState<string | null>(null);
  const [place, setPlace] = useState({ map: 0, ask: 0 });
  const slow = useSlow(state.pending !== null);
  // the guess has its own screen; earlier parts are on the map
  const all = state.entries.filter((e) => e.from !== "app" || e.phase !== "predict");
  const hold = revealHoldOf(all);
  const held = hold !== null && hold.key !== passed;
  const entries = held ? hold.entries : currentPartOf(all);
  const example = turn.phase === "example" && turn.example ? turn.example : null;
  const parts = example ? exampleParts(example) : partsOf(turn, all, { held });
  const lit = held ? null : justLitOf(turn);
  const pending = state.pending !== null;

  useEffect(() => {
    if (lit) tick();
  }, [lit, turn.turn]);

  const { failure } = state;
  const saved = failure && "text" in failure.body ? " Your answer is saved." : "";
  const help = helpOf(entries);
  const askedNow = !held && turn.phase === "move" && parts.some((p) => p.state === "asked");
  const placeholder = help.more ? "Your answer" : turn.phase === "move" && cappedOf(entries) ? "Try again, in your own words" : "In your own words";

  return (
    <Screen light={provedOf(turn, all)}>
      <SessionBar concept={turn.mentefacto.concept} onClose={onClose} />
      <KeyboardSafe>
        <ScrollView
          ref={scroll}
          style={styles.flex}
          contentContainerStyle={styles.content}
          // the worked example opens on its map; everything else follows the newest line
          onContentSizeChange={() => (example ? scroll.current?.scrollTo({ y: 0, animated: true }) : scroll.current?.scrollToEnd({ animated: true }))}
          keyboardShouldPersistTaps="handled"
        >
          {/* the firefly's line starts below the map: its height (a size, which the web reports on every change, unlike
              a position) plus the gap, plus where the question sits in the conversation */}
          <View onLayout={(e) => setPlace((p) => (p.map === e.nativeEvent.layout.height ? p : { ...p, map: e.nativeEvent.layout.height }))}>
            <ConceptMap
              concept={example ? example.concept : turn.mentefacto.concept}
              parts={parts}
              justLit={lit}
              pulse={turn.turn}
              leaderFrom={askedNow ? { x: size.iconButton / 2, y: place.map + CONVERSATION_GAP + place.ask + 2 } : null}
            />
          </View>
          <View style={styles.conversation}>
            <Conversation
              entries={entries}
              turn={turn}
              held={held}
              pending={pending}
              help={help}
              onHelp={() => send({ action: "help" })}
              onAskLayout={(y) => setPlace((p) => (p.ask === y ? p : { ...p, ask: y }))}
            />
            {pending && <Waiting line={waitingLineOf(state.pending)} slow={slow} />}
            {failure && <Failure message={`${failure.message}${saved}`}>{failure.retryable && <Button kind="secondary" label="Try again" onPress={retry} />}</Failure>}
          </View>
        </ScrollView>
        <Composer
          turn={turn}
          pending={pending}
          placeholder={placeholder}
          moreHelp={help.more}
          onNext={held && hold ? () => setPassed(hold.key) : null}
          onSend={send}
        />
      </KeyboardSafe>
    </Screen>
  );
}

type ConversationProps = {
  entries: Entry[];
  turn: Turn;
  held: boolean;
  pending: boolean;
  help: ReturnType<typeof helpOf>;
  onHelp: () => void;
  onAskLayout: (y: number) => void;
};

/** The part on screen: the firefly's question, then the answers, nudges, hints, a revealed answer and facts after
 * it. What came before the question (the last part's feedback and its name) isn't repeated: the map shows how
 * that part ended, as the board does. */
function Conversation({ entries, turn, held, pending, help, onHelp, onAskLayout }: ConversationProps) {
  const asked = entries.findIndex((e) => e.from === "app" && e.message.kind === "question");
  const hints = entries.filter((e) => e.from === "app" && e.message.kind === "hint" && e.message.hintStep !== "reveal").map((e) => e.id);
  // the cap note goes with the first nudge or hint of the part, once
  const capAt = entries.findIndex((e, i) => i > asked && e.from === "app" && (e.message.kind === "feedback" || (e.message.kind === "hint" && e.message.hintStep !== "reveal")));
  const active = !held && turn.phase === "move";

  return (
    <>
      {entries.map((entry, i) => {
        if (entry.from === "map") return null;
        if (entry.from === "learner") return <LearnerMessage key={entry.id} text={entry.text} />;
        const { message } = entry;
        if (message.kind === "question") {
          const { eyebrow, text } = eyebrowOf(message.text);
          // Help is the firefly during a part; while an answer is checked it says so
          const firefly = pending
            ? { state: "asks" as const, tag: "checking", busy: true }
            : !active
              ? { state: "asks" as const, tag: null }
              : help.more
                ? { state: "helps" as const, tag: null }
                : { state: "asks" as const, tag: help.tag, label: help.label, onPress: onHelp };
          return (
            <View key={entry.id} onLayout={(e) => onAskLayout(e.nativeEvent.layout.y)}>
              <Ask text={text} eyebrow={eyebrow} firefly={firefly} />
              {active && turn.scaffold && (
                <Aside text={`Already on your map: ${turn.scaffold.given.join(", ")}. ${turn.scaffold.blanks} more for you to find.`} />
              )}
            </View>
          );
        }
        if (asked >= 0 && i < asked) return null;
        switch (message.kind) {
          case "feedback":
            return <Nudge key={entry.id} text={message.text} capNote={i === capAt} />;
          case "hint":
            return isReveal(entry) ? (
              <Revealed key={entry.id} text={message.text} />
            ) : (
              <HintCard key={entry.id} message={message} n={hints.indexOf(entry.id) + 1} capNote={i === capAt} />
            );
          case "example":
            return <Body key={entry.id}>{message.text}</Body>;
          case "fact":
          case "redirect":
            return <FactCard key={entry.id} kind={message.kind} text={message.text} />;
          default:
            return <Aside key={entry.id} text={message.text} />;
        }
      })}
    </>
  );
}

/** The map sits this far below the session bar, and the conversation this far below the map (the board). */
const MAP_TOP = 26;
const CONVERSATION_GAP = 32;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.margin, paddingTop: MAP_TOP, paddingBottom: space.xl },
  conversation: { marginTop: CONVERSATION_GAP, gap: space.l },
});
