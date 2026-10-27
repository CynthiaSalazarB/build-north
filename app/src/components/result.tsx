// The end of a session (round 9 "Lumente", #34): the gap in words, over the guess and the score side by side (a
// bare signed number read as a grade, decided Oct 22), the map in the light the learner reached, and the coach's
// next step, which comes a moment after the numbers. How points work sits behind a tap (the same rubric as the
// guess). Each area's words open from the map, not as a second essay on the left. Every number comes from
// Turn.result, computed by code. The firefly is barely there: it never reacts to a score. Share hands the numbers
// (never the words) to a chat or a post: the phone's share sheet, the browser's where it has one, else the
// clipboard. In the website layout the words are a column on the left and the map stands on the right.
import type { Mentefacto, Message, MoveId, Result } from "@build-north/agents";
import { useEffect, useState } from "react";
import { Platform, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { areaCopyOf } from "../area-copy.ts";
import { success } from "../haptics.ts";
import type { ComparisonArea } from "../session/comparison.ts";
import { gapOf, POINTS_RULE, resultPartsOf, shareLineOf, withFeedbackToRead, type Pip } from "../session/present.ts";
import type { Entry } from "../session/transcript.ts";
import { brand, page, space, type } from "../theme.ts";
import { ConceptMap, PointSquare } from "./concept-map.tsx";
import { ConversationSheet } from "./conversation-sheet.tsx";
import { ExplanationComparison } from "./explanation-comparison.tsx";
import { Firefly } from "./firefly.tsx";
import { Failure, Remembered } from "./messages.tsx";
import { PartSheet, type PartClosing } from "./part-sheet.tsx";
import { SessionBar } from "./session-bar.tsx";
import { ScoringGuide } from "./scoring-guide.tsx";
import { SiteHeader } from "./site-header.tsx";
import { Body, Button, Label, Rise, Screen, Small, Tag, useColors, useMode, useWide } from "./ui.tsx";

type Props = {
  concept: string;
  result: Result;
  map: Mentefacto;
  firstExplanation: string | null;
  comparisonAreas: readonly ComparisonArea[];
  /** The whole-map evaluator's note per part, after level 5 or a self-test. */
  notes?: Partial<Record<MoveId, string>>;
  /** Levels 1 to 4: the evaluator's words on the part answered last, which came with the result (`lastPartNoteOf`). */
  lastPart?: Partial<Record<MoveId, string>>;
  /** A guided session: what closed each part, so a lit or revealed area opens to be read again (`partClosingsOf`). */
  closings?: Partial<Record<MoveId, PartClosing>>;
  /** The parts Help revealed (`revealedPartsOf`): only they read "Shown to you". */
  revealed?: ReadonlySet<MoveId>;
  /** The session's whole conversation, read again from here (`ConversationSheet`). */
  conversation?: readonly Entry[];
  /** The coach's words come after the result (`result.coach` is null until then); this is why they didn't. */
  coachFailure?: string | null;
  /** With memory on, the facts the coach's words rely on (the summary message's `sources`, #112). */
  coachSources?: Message["sources"];
  onRetryCoach?: () => void;
  onAgain: () => void;
  againBusy?: boolean;
  againError?: string | null;
  onDone: () => void;
  /** "Map another concept" lands on Start, where concepts are picked, even when the session opened from a folder. */
  onAnother: () => void;
};

export function ResultScreen(props: Props) {
  const leveledUp = props.result.masteryChanges.length > 0;
  useEffect(() => {
    if (leveledUp) success();
  }, [leveledUp]);
  return (
    <Screen light={props.result.score}>
      <ResultBody {...props} />
    </Screen>
  );
}

/** Inside the Screen, so the colors follow the light the score reached. */
function ResultBody({ concept, result, map, firstExplanation, comparisonAreas, notes = {}, lastPart = {}, closings = {}, revealed, conversation = [], coachFailure, coachSources, onRetryCoach, onAgain, againBusy, againError, onDone, onAnother }: Props) {
  const c = useColors();
  const wide = useWide();
  const lit = useMode() === "day";
  const gap = gapOf(result);
  const missed = Math.max(0, result.predictedScore - result.score);
  // eight points each: the guess in amber, as on the guess screen; the score filled, and the points the guess
  // claimed but didn't prove dashed coral on this total scale only
  const guessed = Array.from({ length: 8 }, (_, i): Pip => (i < result.predictedScore ? "claimed" : "open"));
  const proved = Array.from({ length: 8 }, (_, i): Pip => (i < result.score ? "earned" : i < result.predictedScore ? "missed" : "open"));
  // the extra line only when it isn't the headline again: felt-surer gets "That's normal…"; a match or a surplus
  // already said it
  const extra = gap.over ? gap.note : null;

  // a lit or revealed area opens to its full words and what closed it: the guided session's words on it, or the
  // self-test's note (Cynthia, Oct 24)
  const [openPart, setOpenPart] = useState<MoveId | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [pointsOpen, setPointsOpen] = useState(false);
  const closingOf = (move: MoveId): PartClosing | null => {
    const closing = closings[move];
    if (closing) return closing;
    const note = notes[move] ?? lastPart[move];
    return note ? { text: note, revealed: false } : null;
  };
  const parts = withFeedbackToRead(resultPartsOf(result, map, revealed), (move) => closingOf(move) !== null);
  const figure = (
    <View style={styles.map}>
      <ConceptMap concept={concept} parts={parts} onPartOpen={setOpenPart} />
      <View style={styles.firefly}>
        <Firefly state="fades" />
      </View>
    </View>
  );
  const words = (
    <>
      {/* the gap in words, over the guess and the score side by side: a bare "0" or "−2" read as a grade */}
      <Rise>
        <View style={styles.headline} accessible accessibilityLabel={`You guessed ${result.predictedScore}. You proved ${result.score} of 8. ${gap.headline}${extra ? ` ${extra}` : ""}`}>
          <Text style={[type.question, { color: c.onSurface }]}>{gap.headline}</Text>
          {/* the prediction, then the score, one step after the other: the comparison lands in order */}
          <View style={styles.scales}>
            <Rise order={1}>
              <Scale label="prediction" value={result.predictedScore} pips={guessed} dark={lit} />
            </Rise>
            <Rise order={2}>
              <Scale label="map score" value={result.score} pips={proved} dark={lit} />
            </Rise>
          </View>
          {missed > 0 && (
            <View style={styles.legend}>
              <View style={styles.legendRow}>
                <PointSquare pip="missed" dark={lit} />
                <Label dim>prediction gap</Label>
              </View>
            </View>
          )}
          {extra && <Body dim>{extra}</Body>}
        </View>
      </Rise>
      {firstExplanation && (
        <Button kind="text" wrap label="Compare with your first explanation" style={styles.compare} onPress={() => setComparisonOpen(true)} />
      )}
      {conversation.some((entry) => entry.from === "learner") && (
        <Button kind="text" wrap label="Read the whole conversation" style={styles.compare} onPress={() => setConversationOpen(true)} />
      )}
      {!wide && <Rise order={1}>{figure}</Rise>}
      <Rise order={2} style={styles.facts}>
        {pointsOpen ? (
          <View style={styles.points}>
            <Button kind="text" label="How points work" hint="Hide the scoring guide" style={styles.compare} onPress={() => setPointsOpen(false)} />
            <Small dim>{POINTS_RULE}</Small>
            <ScoringGuide />
          </View>
        ) : (
          <Button kind="text" label="How points work" hint="The same 2, 1 and 0 point guide as the prediction" style={styles.compare} onPress={() => setPointsOpen(true)} />
        )}
      </Rise>
      {/* the coach's words arrive a moment after the numbers; screen readers hear them when they do */}
      <View role="status" accessibilityLiveRegion="polite">
        <Rise key={result.coach ? "coach" : "waiting"} order={5} style={[styles.coach, { borderLeftColor: c.question }]}>
          <Tag style={{ color: c.question }}>for next time</Tag>
          {result.coach ? (
            <>
              <Body>{areaCopyOf(result.coach.message)}</Body>
              <Remembered sources={coachSources} concept={concept} />
            </>
          ) : coachFailure ? (
            <Failure message={coachFailure}>{onRetryCoach && <Button kind="secondary" label="Try again" onPress={onRetryCoach} />}</Failure>
          ) : (
            <Body dim>Reading your map…</Body>
          )}
        </Rise>
      </View>
      {againError && <Failure message={againError} />}
      <PartSheet view={openPart ? (parts.find((p) => p.move === openPart) ?? null) : null} closing={openPart ? closingOf(openPart) : null} onClose={() => setOpenPart(null)} />
      {firstExplanation && <ExplanationComparison open={comparisonOpen} onClose={() => setComparisonOpen(false)} concept={concept} explanation={firstExplanation} areas={comparisonAreas} />}
      <ConversationSheet open={conversationOpen} onClose={() => setConversationOpen(false)} concept={concept} entries={conversation} />
    </>
  );
  const again = <Button label={`Try ${concept} again`} fit={wide} busy={againBusy} onPress={onAgain} />;
  const another = <Button kind="text" label="Map another concept" onPress={onAnother} />;
  const share = <ShareButton concept={concept} result={result} />;

  if (wide) {
    return (
      <>
        <SiteHeader concept={concept} />
        <View style={styles.split}>
          <ScrollView style={styles.words} contentContainerStyle={styles.wordsContent}>
            {words}
            <Rise order={6} style={styles.actions}>
              {again}
              {another}
              {share}
            </Rise>
          </ScrollView>
          <View style={styles.stage}>
            <Rise order={1} style={styles.spot}>
              {figure}
            </Rise>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <SessionBar concept={concept} onClose={onDone} done />
      <ScrollView contentContainerStyle={styles.content}>{words}</ScrollView>
      <View style={styles.foot}>
        {again}
        <View style={styles.footRow}>
          {another}
          {share}
        </View>
      </View>
    </>
  );
}

/** Share the result's numbers: the phone's share sheet, the browser's where it has one, else the clipboard, and
 * the label says what happened. A share sheet the learner dismisses says nothing. */
function ShareButton({ concept, result }: { concept: string; result: Result }) {
  const [copied, setCopied] = useState<"no" | "yes" | "refused">("no");
  const share = async () => {
    const message = shareLineOf(concept, result, brand);
    if (Platform.OS !== "web") {
      await Share.share({ message }).catch(() => undefined);
      return;
    }
    const nav = typeof navigator === "undefined" ? undefined : navigator;
    if (nav?.share) {
      await nav.share({ text: message }).catch(() => undefined);
      return;
    }
    const ok = nav?.clipboard ? await nav.clipboard.writeText(message).then(() => true, () => false) : false;
    setCopied(ok ? "yes" : "refused");
  };
  const label = copied === "yes" ? "Copied" : copied === "refused" ? "Couldn't copy" : "Share";
  return <Button kind="text" label={label} hint="Shares your guess and your score, not your answers" onPress={() => void share()} />;
}

/** One row of the guess against the score: its label, the eight points in four pairs (one pair per part), the number. */
function Scale({ label, value, pips, dark }: { label: string; value: number; pips: Pip[]; dark: boolean }) {
  const c = useColors();
  return (
    <View style={styles.scale}>
      <Label dim style={styles.scaleLabel}>
        {label}
      </Label>
      <View style={styles.pairs}>
        {[0, 1, 2, 3].map((part) => (
          <View key={part} style={styles.pair}>
            {[0, 1].map((k) => (
              <PointSquare key={k} big pip={pips[part * 2 + k]!} dark={dark} />
            ))}
          </View>
        ))}
      </View>
      <Text style={[type.pill, { color: c.onSurface }]}>{`${value} of 8`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.margin, paddingTop: 18, paddingBottom: space.xl, gap: space.l },
  headline: { gap: space.m },
  compare: { alignSelf: "stretch", paddingHorizontal: 0 },
  scales: { gap: space.s },
  scale: { flexDirection: "row", alignItems: "center", gap: space.m },
  scaleLabel: { width: 92 },
  pairs: { flexDirection: "row", gap: space.s },
  pair: { flexDirection: "row", gap: 3 },
  map: { marginTop: space.xs },
  firefly: { position: "absolute", right: 2, top: 4 },
  facts: { gap: space.s },
  points: { gap: space.m },
  legend: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: space.l, rowGap: 6 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  coach: { gap: space.xs, borderLeftWidth: 2, paddingLeft: space.l },
  foot: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.m, gap: space.xs },
  footRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: space.s },
  split: { flex: 1, flexDirection: "row", gap: page.gap, paddingHorizontal: page.gutter },
  words: { width: page.words, flexGrow: 0 },
  wordsContent: { flexGrow: 1, justifyContent: "center", paddingTop: space.xxl, paddingBottom: page.header, gap: space.xl },
  // wraps: the three actions are 5 px wider than the words column, which clipped Share and let the column scroll
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.m, marginTop: space.s },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: page.header },
  spot: { width: "100%", maxWidth: page.map },
});
