// The end of a session (round 9 "Lumente", #34): the gap in words, over the guess and the score side by side (a
// bare signed number read as a grade, decided Oct 22), the map in the light the learner reached with the points
// proved, the ones felt sure but not proved and the parts that moved up a level, how points work, and the coach's
// next step, which comes a moment after the numbers. Every number comes from Turn.result, computed by code. The
// firefly is barely there: it never reacts to a score. The gap arrives first, then the map, then the rest, one
// after another. In the website layout the words are a column on the left and the map stands on the right.
import type { Mentefacto, Message, MoveId, Result } from "@build-north/agents";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { success } from "../haptics.ts";
import { gapOf, POINTS_RULE, resultPartsOf, resultStepsOf, type Pip, type ResultStep } from "../session/present.ts";
import { page, parts as PARTS, radius, space, type } from "../theme.ts";
import { ConceptMap, PointSquare } from "./concept-map.tsx";
import { Firefly } from "./firefly.tsx";
import { Failure, Remembered } from "./messages.tsx";
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
  /** With memory on, the facts the coach's words rely on (the summary message's `sources`, #112). */
  coachSources?: Message["sources"];
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
function ResultBody({ concept, result, map, notes = {}, coachFailure, coachSources, onRetryCoach, onAgain, againBusy, againError, onDone }: Props) {
  const c = useColors();
  const wide = useWide();
  const lit = useMode() === "day";
  const gap = gapOf(result);
  const missed = Math.max(0, result.predictedScore - result.score);
  // eight points each: the guess in amber, as on the guess screen; the score filled, and the points the guess
  // claimed but didn't prove dashed coral, as on the map
  const guessed = Array.from({ length: 8 }, (_, i): Pip => (i < result.predictedScore ? "claimed" : "open"));
  const proved = Array.from({ length: 8 }, (_, i): Pip => (i < result.score ? "earned" : i < result.predictedScore ? "missed" : "open"));
  const steps = resultStepsOf(result, map, notes);

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
      {/* the gap in words, over the guess and the score side by side: a bare "0" or "−2" read as a grade */}
      <Rise>
        <View style={styles.headline} accessible accessibilityLabel={`You guessed ${result.predictedScore}. You proved ${result.score} of 8. ${gap.headline}${gap.note ? ` ${gap.note}` : ""}`}>
          <Text style={[type.question, { color: c.onSurface }]}>{gap.headline}</Text>
          <View style={styles.scales}>
            <Scale label="you guessed" value={result.predictedScore} pips={guessed} dark={lit} />
            <Scale label="you proved" value={result.score} pips={proved} dark={lit} />
          </View>
          {gap.note && <Body dim>{gap.note}</Body>}
        </View>
      </Rise>
      {!wide && <Rise order={1}>{figure}</Rise>}
      <Rise order={2} style={styles.facts}>
        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <PointSquare pip="earned" dark={lit} />
            <Label dim>proved</Label>
          </View>
          {missed > 0 && (
            <View style={styles.legendRow}>
              <PointSquare pip="missed" dark={lit} />
              <Label dim>felt sure, not proved</Label>
            </View>
          )}
        </View>
        <Label dim>{POINTS_RULE}</Label>
        {result.questions.asked > 0 && (
          <Label dim>{`you asked ${result.questions.asked} ${result.questions.asked === 1 ? "question" : "questions"}, ${result.questions.testing} testing the idea`}</Label>
        )}
      </Rise>
      {steps.length > 0 && (
        <Rise order={4}>
          <ResultSteps steps={steps} dark={lit} />
        </Rise>
      )}
      {/* the coach's words arrive a moment after the numbers; screen readers hear them when they do */}
      <View role="status" accessibilityLiveRegion="polite">
        <Rise key={result.coach ? "coach" : "waiting"} order={5} style={[styles.coach, { borderLeftColor: c.question }]}>
          <Tag style={{ color: c.question }}>for next time</Tag>
          {result.coach ? (
            <>
              <Body>{result.coach.message}</Body>
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

/** The whole-map evaluator's notes, part by part, the way the worked example reads: the part's name and its
 * points as on the map, the learner's words, then the note, dim. */
function ResultSteps({ steps, dark }: { steps: ResultStep[]; dark: boolean }) {
  const c = useColors();
  return (
    <View style={styles.steps}>
      {steps.map((step, i) => (
        <View key={step.move} style={[styles.step, { borderLeftColor: c.partEdge }]}>
          <View style={styles.stepHead} accessible accessibilityLabel={`${PARTS[step.move].label}: ${step.points} of 2 points`}>
            <Tag style={{ color: c.question }}>{`${i + 1} · ${PARTS[step.move].label}`}</Tag>
            <View style={styles.pips}>
              {step.pips.map((pip, k) => (
                <PointSquare key={k} pip={pip} dark={dark} />
              ))}
            </View>
          </View>
          {step.items.length > 0 ? (
            <View style={styles.items}>
              {step.items.map((item) => (
                <View key={item} style={[styles.item, { borderColor: c.partEdge, backgroundColor: c.partFill }]}>
                  <Text style={[type.ui, { color: c.onSurface }]}>{item}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Label dim>left empty</Label>
          )}
          {step.note && (
            <Body dim style={type.bubble}>
              {step.note}
            </Body>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.margin, paddingTop: 18, paddingBottom: space.xl, gap: space.l },
  headline: { gap: space.m },
  scales: { gap: space.s },
  scale: { flexDirection: "row", alignItems: "center", gap: space.m },
  scaleLabel: { width: 92 },
  pairs: { flexDirection: "row", gap: space.s },
  pair: { flexDirection: "row", gap: 3 },
  map: { marginTop: space.xs },
  firefly: { position: "absolute", right: 2, top: 4 },
  facts: { gap: space.l },
  legend: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: space.l, rowGap: 6 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  steps: { gap: space.xl },
  step: { gap: space.s, borderLeftWidth: 2, paddingLeft: space.l },
  stepHead: { flexDirection: "row", alignItems: "center", gap: space.s },
  pips: { flexDirection: "row", gap: space.xs },
  items: { flexDirection: "row", flexWrap: "wrap", gap: space.s },
  item: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderRadius: radius.chip },
  coach: { gap: space.xs, borderLeftWidth: 2, paddingLeft: space.l },
  foot: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.m, gap: space.xs },
  split: { flex: 1, flexDirection: "row", gap: page.gap, paddingHorizontal: page.gutter },
  words: { width: page.words, flexGrow: 0 },
  wordsContent: { flexGrow: 1, justifyContent: "center", paddingTop: space.xxl, paddingBottom: page.header, gap: space.xl },
  actions: { flexDirection: "row", alignItems: "center", gap: space.m, marginTop: space.s },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: page.header },
  spot: { width: "100%", maxWidth: page.map },
});
