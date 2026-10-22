// The session (#6, #7, round 9 "Lumente"): the guess, then the work (the map in the light the learner has earned,
// the firefly's question with the part it asks about, and the one input the latest Turn asks for, or at level 5
// the whole map with the fact desk), then the result. A single route with no id in the path, so the web build
// stays static (decision 14, #27). Closing saves: the start screen offers to resume. In the website layout the
// conversation is a column on the left, under its pinned question, and the map stands on the right, where the
// light falls; the firefly's line runs across the gap between them.
import type { MoveId, Turn } from "@build-north/agents";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View, type LayoutChangeEvent, type LayoutRectangle, type ScrollViewInstance } from "react-native";
import Animated from "react-native-reanimated";
import Svg from "react-native-svg";
import { Composer } from "../components/composer.tsx";
import { ConceptMap, Trace, type MapGeometry } from "../components/concept-map.tsx";
import { GuessScreen } from "../components/guess.tsx";
import { decorative } from "../components/icons.tsx";
import { Ask, Aside, ExampleIntro, ExampleSteps, FactCard, Failure, FlushReplies, HintCard, LearnerMessage, Nudge, Revealed, useSlow, Waiting } from "../components/messages.tsx";
import { ResultScreen } from "../components/result.tsx";
import { SessionBar } from "../components/session-bar.tsx";
import { SiteHeader } from "../components/site-header.tsx";
import { roundedPath, tracePoints } from "../components/trace.ts";
import { Body, Button, KeyboardSafe, Screen, useColors, useEntrance, useWide } from "../components/ui.tsx";
import { WholeMapScreen } from "../components/whole-map.tsx";
import { tick } from "../haptics.ts";
import {
  cappedOf,
  currentPartOf,
  exampleParts,
  exampleStepsOf,
  eyebrowOf,
  helpOf,
  isFollowUpFeedback,
  isReveal,
  justLitOf,
  partNotesOf,
  partsOf,
  provedOf,
  revealHoldOf,
  waitingLineOf,
} from "../session/present.ts";
import { useSession } from "../session/session-context.tsx";
import type { Entry, SessionState } from "../session/transcript.ts";
import { firefly as FIREFLY, page, size, space } from "../theme.ts";

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
  const wide = useWide();
  const scroll = useRef<ScrollViewInstance>(null);
  const [passed, setPassed] = useState<string | null>(null);
  const [place, setPlace] = useState({ map: 0, ask: 0 });
  const slow = useSlow(state.pending !== null);
  // the guess has its own screen; earlier parts are on the map
  const all = state.entries.filter((e) => e.from !== "app" || e.phase !== "predict");
  const hold = revealHoldOf(all);
  const held = hold !== null && hold.key !== passed;
  const entries = held ? hold.entries : currentPartOf(all);
  // The worked example is offered, not imposed (decided Oct 22): a "See an example" button opens the walkthrough
  // and the planet map. Continue moves on either way, so the session's steps and scores don't change.
  const [exampleOpen, setExampleOpen] = useState(false);
  const offered = turn.phase === "example" && !!turn.example && !exampleOpen;
  const shown = offered ? entries.filter((e) => !(e.from === "app" && e.phase === "example")) : entries;
  const example = turn.phase === "example" && turn.example && exampleOpen ? turn.example : null;
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
  const concept = example ? example.concept : turn.mentefacto.concept;

  const conversation = (show: Show) => (
    <Conversation
      show={show}
      entries={shown}
      turn={turn}
      held={held}
      pending={pending}
      help={help}
      fireflyAfter={wide}
      onHelp={() => send({ action: "help" })}
      onAskLayout={(y) => setPlace((p) => (p.ask === y ? p : { ...p, ask: y }))}
    />
  );
  const status = (
    <>
      {offered && (
        <View style={styles.offer}>
          <Button kind="secondary" label="See an example" onPress={() => setExampleOpen(true)} />
        </View>
      )}
      {pending && <Waiting line={waitingLineOf(state.pending)} slow={slow} />}
      {failure && <Failure message={`${failure.message}${saved}`}>{failure.retryable && <Button kind="secondary" label="Try again" onPress={retry} />}</Failure>}
    </>
  );
  const composer = (
    <Composer
      turn={turn}
      pending={pending}
      placeholder={placeholder}
      moreHelp={help.more}
      onNext={held && hold ? () => setPassed(hold.key) : null}
      onSend={send}
      flush={wide}
    />
  );
  // the worked example opens at its start; everything else follows the newest line
  const follow = () => (example ? scroll.current?.scrollTo({ y: 0, animated: true }) : scroll.current?.scrollToEnd({ animated: true }));
  const light = provedOf(turn, all);

  if (wide) {
    return (
      <Screen light={light}>
        <SiteHeader concept={turn.mentefacto.concept} end={<Button kind="secondary" solid label="Save and close" onPress={onClose} />} />
        <WideStage
          asked={askedNow ? (parts.find((p) => p.state === "asked")?.move ?? null) : null}
          fireflySize={help.more ? FIREFLY.states.helps.size : FIREFLY.states.asks.size}
          question={conversation("question")}
          thread={
            <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={styles.thread} onContentSizeChange={follow} keyboardShouldPersistTaps="handled">
              {conversation("thread")}
              {status}
            </ScrollView>
          }
          composer={composer}
          map={(onGeometry) => <ConceptMap concept={concept} parts={parts} justLit={lit} pulse={turn.turn} onGeometry={onGeometry} />}
        />
      </Screen>
    );
  }

  return (
    <Screen light={light}>
      <SessionBar concept={turn.mentefacto.concept} onClose={onClose} />
      <KeyboardSafe>
        <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={styles.content} onContentSizeChange={follow} keyboardShouldPersistTaps="handled">
          {/* the firefly's line starts below the map: its height (a size, which the web reports on every change, unlike
              a position) plus the gap, plus where the question sits in the conversation */}
          <View onLayout={(e) => setPlace((p) => (p.map === e.nativeEvent.layout.height ? p : { ...p, map: e.nativeEvent.layout.height }))}>
            <ConceptMap
              concept={concept}
              parts={parts}
              justLit={lit}
              pulse={turn.turn}
              leaderFrom={askedNow ? { x: size.iconButton / 2, y: place.map + CONVERSATION_GAP + place.ask + 2 } : null}
            />
          </View>
          <View style={styles.conversation}>
            {conversation("all")}
            {status}
          </View>
        </ScrollView>
        {composer}
      </KeyboardSafe>
    </Screen>
  );
}

type Box = { x: number; y: number; w: number; h: number };
const boxOf = (l: LayoutRectangle): Box => ({ x: l.x, y: l.y, w: l.width, h: l.height });
const sameBox = (a: Box | null, b: Box) => !!a && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

type StageProps = {
  /** The part being asked, the firefly's line runs to it; null while nothing is asked. */
  asked: MoveId | null;
  fireflySize: number;
  question: ReactNode;
  thread: ReactNode;
  composer: ReactNode;
  map: (onGeometry: (geometry: MapGeometry) => void) => ReactNode;
};

/** The website layout of the work: the words column (the pinned question, the thread, the input) on the left, the
 * map on the right, and over both the firefly's line, from the firefly at the column's edge down the gap and into
 * the part it asks about. Positions come from layout events, all relative to this row. */
function WideStage({ asked, fireflySize, question, thread, composer, map }: StageProps) {
  const c = useColors();
  const [words, setWords] = useState<Box | null>(null);
  const [ask, setAsk] = useState<Box | null>(null);
  const [stage, setStage] = useState<Box | null>(null);
  const [spot, setSpot] = useState<Box | null>(null);
  const [geometry, setGeometry] = useState<MapGeometry | null>(null);
  const keep = (set: (update: (b: Box | null) => Box | null) => void) => (e: LayoutChangeEvent) => {
    const next = boxOf(e.nativeEvent.layout);
    set((b) => (sameBox(b, next) ? b : next));
  };

  let trace: ReactNode = null;
  if (asked && words && ask && stage && spot && geometry) {
    const at = { x: stage.x + spot.x, y: stage.y + spot.y };
    const p = geometry.parts[asked];
    const part = { x: at.x + p.x, y: at.y + p.y, w: p.w, h: p.h };
    const from = { x: words.x + words.w, y: words.y + ask.y + fireflySize / 2 };
    const gutter = Math.round((from.x + at.x) / 2);
    const points = tracePoints(from, part, asked === "exclusion" ? "top" : "left", { gutter, above: at.y - space.l });
    const end = points[points.length - 1]!;
    const { d, length } = roundedPath(points, 12);
    trace = (
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none" {...decorative}>
        <Trace d={d} length={length} end={end} drawKey={asked} color={c.questionOutline} />
      </Svg>
    );
  }

  return (
    <View style={styles.wide}>
      <View style={styles.words} onLayout={keep(setWords)}>
        <KeyboardSafe>
          <FlushReplies value>
            <View style={styles.question}>
              <View onLayout={keep(setAsk)}>{question}</View>
            </View>
            {thread}
            {composer}
          </FlushReplies>
        </KeyboardSafe>
      </View>
      <View style={styles.stage} onLayout={keep(setStage)}>
        <View style={styles.spot} onLayout={keep(setSpot)}>
          {map((next) => setGeometry((g) => (g && JSON.stringify(g) === JSON.stringify(next) ? g : next)))}
        </View>
      </View>
      {trace}
    </View>
  );
}

/** Which lines a Conversation draws: all of them (the phone), or, in the website layout, the pinned question and
 * the thread under it. */
type Show = "all" | "question" | "thread";

type ConversationProps = {
  show: Show;
  entries: Entry[];
  turn: Turn;
  held: boolean;
  pending: boolean;
  help: ReturnType<typeof helpOf>;
  fireflyAfter: boolean;
  onHelp: () => void;
  onAskLayout: (y: number) => void;
};

/** The part on screen: the firefly's question, then the answers, nudges, hints, a revealed answer, facts and the
 * firefly's follow-up questions after it. What came before the question (the last part's feedback and its name)
 * isn't repeated: the map shows how that part ended, as the board does. Each line rises in once, when it arrives. */
function Conversation({ show, entries, turn, held, pending, help, fireflyAfter, onHelp, onAskLayout }: ConversationProps) {
  const entrance = useEntrance();
  const asked = entries.findIndex((e) => e.from === "app" && e.message.kind === "question");
  const hints = entries.filter((e) => e.from === "app" && e.message.kind === "hint" && e.message.hintStep !== "reveal").map((e) => e.id);
  // the cap note goes with the first retry's nudge or the first hint of the part, once
  const capAt = entries.findIndex(
    (e, i) => i > asked && e.from === "app" && ((e.message.kind === "feedback" && !isFollowUpFeedback(entries, i)) || (e.message.kind === "hint" && e.message.hintStep !== "reveal")),
  );
  const active = !held && turn.phase === "move";
  // the worked example's lines show as four steps, drawn where its first line is
  const thinking = entries.flatMap((e) => (e.from === "app" && e.message.kind === "example" && e.message.agent !== "app" ? [e] : []));
  const steps = exampleStepsOf(thinking.map((e) => e.message.text));

  const line = (entry: Entry, i: number): ReactNode => {
    if (entry.from === "map") return null;
    if (entry.from === "learner") return <LearnerMessage text={entry.text} />;
    const { message } = entry;
    if (message.kind === "question") {
      const { eyebrow, text } = eyebrowOf(message.text);
      // the part's first question carries Help, the firefly; a follow-up is the firefly asking again
      if (i !== asked) return <Ask text={text} eyebrow={eyebrow} firefly={{ state: "asks", tag: null }} fireflyAfter={fireflyAfter} />;
      // Help is the firefly during a part; while an answer is checked it says so
      const firefly = pending
        ? { state: "asks" as const, tag: "checking", busy: true }
        : !active
          ? { state: "asks" as const, tag: null }
          : help.more
            ? { state: "helps" as const, tag: null }
            : { state: "asks" as const, tag: help.tag, label: help.label, onPress: onHelp };
      return (
        <>
          <Ask text={text} eyebrow={eyebrow} firefly={firefly} fireflyAfter={fireflyAfter} />
          {active && turn.scaffold && <Aside text={`Already on your map: ${turn.scaffold.given.join(", ")}. ${turn.scaffold.blanks} more for you to find.`} />}
        </>
      );
    }
    if (asked >= 0 && i < asked) return null;
    switch (message.kind) {
      case "feedback":
        return <Nudge text={message.text} capNote={i === capAt} tag={isFollowUpFeedback(entries, i) ? "almost" : undefined} />;
      case "hint":
        return isReveal(entry) ? <Revealed text={message.text} /> : <HintCard message={message} n={hints.indexOf(entry.id) + 1} capNote={i === capAt} />;
      case "example":
        if (message.agent === "app") return <ExampleIntro text={message.text} />;
        if (!steps) return <Body>{message.text}</Body>;
        return entry.id === thinking[0]?.id ? <ExampleSteps steps={steps} /> : null;
      case "fact":
      case "redirect":
        return <FactCard kind={message.kind} text={message.text} />;
      default:
        return <Aside text={message.text} />;
    }
  };

  return (
    <>
      {entries.map((entry, i) => {
        const isQuestion = i === asked;
        if ((show === "question" && !isQuestion) || (show === "thread" && isQuestion)) return null;
        const drawn = line(entry, i);
        return drawn ? (
          // the question's place in the conversation is where the phone's firefly line starts
          <Animated.View key={entry.id} style={entrance()} onLayout={isQuestion ? (e) => onAskLayout(e.nativeEvent.layout.y) : undefined}>
            {drawn}
          </Animated.View>
        ) : null;
      })}
    </>
  );
}

/** The map sits this far below the session bar, and the conversation this far below the map (the board). */
const MAP_TOP = 26;
const CONVERSATION_GAP = 32;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  offer: { alignItems: "flex-start" },
  content: { paddingHorizontal: space.margin, paddingTop: MAP_TOP, paddingBottom: space.xl },
  conversation: { marginTop: CONVERSATION_GAP, gap: space.l },
  wide: { flex: 1, flexDirection: "row", gap: page.gap, paddingHorizontal: page.gutter },
  words: { width: page.words },
  question: { paddingTop: space.xl, paddingBottom: space.l },
  thread: { gap: space.l, paddingBottom: space.l },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: page.header },
  spot: { width: "100%", maxWidth: page.map },
});
