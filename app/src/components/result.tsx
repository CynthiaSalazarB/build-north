// The end of a session (round 9 "Lumente", #34): the map in the light the learner reached, the gap as a coral
// number and one sentence, the points proved and the ones felt sure but not proved, the guess against the score,
// and the coach's next step, which comes a moment after the numbers. Every number comes from Turn.result,
// computed by code. The firefly is barely there: it never reacts to a score. The gap arrives first, then the map,
// then the rest, one after another. In the website layout the words are a column on the left and the map stands
// on the right.
import type { Mentefacto, MoveId, Result } from "@build-north/agents";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { success } from "../haptics.ts";
import { gapOf, resultPartsOf } from "../session/present.ts";
import { page, parts as PARTS, space, type } from "../theme.ts";
import { ConceptMap, PointSquare } from "./concept-map.tsx";
import { Firefly } from "./firefly.tsx";
import { Failure } from "./messages.tsx";
import { SessionBar } from "./session-bar.tsx";
import { SiteHeader } from "./site-header.tsx";
import { Body, Button, Label, Rise, Screen, Tag, useColors, useMode, useWide } from "./ui.tsx";

type Props = {
  concept: string;
  result: Result;
  map: Mentefacto;
  /** The whole-map evaluator's note per part, after level 5 or a self-test. */
  notes?: Partial<Record<MoveId, string>>;
  /** The coach's words come after the result (`result.coach` is null until then); this is why they didn't. */
  coachFailure?: string | null;
  onRetryCoach?: () => void;
  onAgain: () => void;
  againBusy?: boolean;
  againError?: string | null;
  onDone: () => void;
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
function ResultBody({ concept, result, map, notes = {}, coachFailure, onRetryCoach, onAgain, againBusy, againError, onDone }: Props) {
  const c = useColors();
  const wide = useWide();
  const lit = useMode() === "day";
  const gap = gapOf(result);
  const missed = Math.max(0, result.predictedScore - result.score);
  const noted = Object.entries(notes).filter(([, note]) => note);

  const figure = (
    <View style={styles.map}>
      <ConceptMap concept={concept} parts={resultPartsOf(result, map)} />
      <View style={styles.firefly}>
        <Firefly state="fades" />
      </View>
    </View>
  );
  const words = (
    <>
      <Rise>
        <View style={styles.gapRow} accessible accessibilityLabel={`${gap.sign === "−" ? "minus " : ""}${gap.amount}. ${gap.sentence}`}>
          <Text style={[type.gap, styles.gapNumber, { color: gap.over ? c.gap : c.onSurface }]}>{`${gap.sign ?? ""}${gap.amount}`}</Text>
          <Text style={[type.reply, styles.sentence, { color: c.onSurface }]}>{gap.sentence}</Text>
        </View>
      </Rise>
      {!wide && <Rise order={1}>{figure}</Rise>}
      <Rise order={2} style={styles.facts}>
        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <PointSquare pip="earned" dark={lit} />
            <Label dim>{`proved ${result.score}`}</Label>
          </View>
          {missed > 0 && (
            <View style={styles.legendRow}>
              <PointSquare pip="missed" dark={lit} />
              <Label dim>{`felt sure, not proved ${missed}`}</Label>
            </View>
          )}
        </View>
        <Text style={[type.code, { color: c.onSurface }]}>{`Expected: ${result.predictedScore}   Received: ${result.score}`}</Text>
        {result.questions.asked > 0 && (
          <Label dim>{`you asked ${result.questions.asked} ${result.questions.asked === 1 ? "question" : "questions"}, ${result.questions.testing} testing the idea`}</Label>
        )}
      </Rise>
      <Rise order={3}>
        <Body>Feeling surer than you can explain is normal. Explaining is how you find out.</Body>
      </Rise>
      {noted.length > 0 && (
        <Rise order={4} style={styles.notes}>
          {/* the whole-map evaluator's note on each part, under the part's name */}
          {noted.map(([move, note]) => (
            <View key={move} style={styles.note}>
              <Tag dim>{PARTS[move as MoveId].label}</Tag>
              <Body dim>{note}</Body>
            </View>
          ))}
        </Rise>
      )}
      {/* the coach's words arrive a moment after the numbers; screen readers hear them when they do */}
      <View role="status" accessibilityLiveRegion="polite">
        <Rise key={result.coach ? "coach" : "waiting"} order={5} style={styles.coach}>
          <Tag dim>next</Tag>
          {result.coach ? (
            <Body>{result.coach.message}</Body>
          ) : coachFailure ? (
            <Failure message={coachFailure}>{onRetryCoach && <Button kind="secondary" label="Try again" onPress={onRetryCoach} />}</Failure>
          ) : (
            <Body dim>Writing your next step…</Body>
          )}
        </Rise>
      </View>
      {againError && <Failure message={againError} />}
    </>
  );
  const again = <Button label={`Try ${concept} again`} fit={wide} busy={againBusy} onPress={onAgain} />;
  const another = <Button kind="text" label="Map another concept" onPress={onDone} />;

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
      <SessionBar concept={concept} onClose={onDone} />
      <ScrollView contentContainerStyle={styles.content}>{words}</ScrollView>
      <View style={styles.foot}>
        {again}
        {another}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.margin, paddingTop: 18, paddingBottom: space.xl, gap: space.l },
  gapRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  gapNumber: { lineHeight: 80, letterSpacing: -1.5, fontVariant: ["lining-nums", "tabular-nums"] },
  sentence: { flex: 1, fontSize: 21, lineHeight: 28 },
  map: { marginTop: space.xs },
  firefly: { position: "absolute", right: 2, top: 4 },
  facts: { gap: space.l },
  legend: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: space.l, rowGap: 6 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  notes: { gap: space.m },
  note: { gap: 2 },
  coach: { gap: 2 },
  foot: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.m, gap: space.xs },
  split: { flex: 1, flexDirection: "row", gap: page.gap, paddingHorizontal: page.gutter },
  words: { width: page.words, flexGrow: 0 },
  wordsContent: { flexGrow: 1, justifyContent: "center", paddingTop: space.xxl, paddingBottom: page.header, gap: space.xl },
  actions: { flexDirection: "row", alignItems: "center", gap: space.m, marginTop: space.s },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: page.header },
  spot: { width: "100%", maxWidth: page.map },
});
