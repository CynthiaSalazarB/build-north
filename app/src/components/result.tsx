// The end of a session (round 9 "Lumente", #34): the map in the light the learner reached, the gap as a coral
// number and one sentence, the points proved and the ones felt sure but not proved, the guess against the score,
// and the coach's next step. Every number comes from Turn.result, computed by code. The firefly is barely there:
// it never reacts to a score.
import type { Mentefacto, MoveId, Result } from "@build-north/agents";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { success } from "../haptics.ts";
import { gapOf, resultPartsOf } from "../session/present.ts";
import { space, type } from "../theme.ts";
import { ConceptMap, PointSquare } from "./concept-map.tsx";
import { Firefly } from "./firefly.tsx";
import { Failure } from "./messages.tsx";
import { SessionBar } from "./session-bar.tsx";
import { Body, Button, Label, Screen, Tag, useColors, useMode } from "./ui.tsx";

type Props = {
  concept: string;
  result: Result;
  map: Mentefacto;
  /** The whole-map evaluator's note per part, after level 5 or a self-test. */
  notes?: Partial<Record<MoveId, string>>;
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
function ResultBody({ concept, result, map, notes = {}, onAgain, againBusy, againError, onDone }: Props) {
  const c = useColors();
  const lit = useMode() === "day";
  const gap = gapOf(result);
  const missed = Math.max(0, result.predictedScore - result.score);
  const noted = Object.entries(notes).filter(([, note]) => note);
  return (
    <>
      <SessionBar concept={concept} onClose={onDone} end={<Label dim>done</Label>} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.gapRow} accessible accessibilityLabel={`${gap.sign === "−" ? "minus " : ""}${gap.amount}. ${gap.sentence}`}>
          <Text style={[type.gap, styles.gapNumber, { color: gap.over ? c.gap : c.onSurface }]}>{`${gap.sign ?? ""}${gap.amount}`}</Text>
          <Text style={[type.reply, styles.sentence, { color: c.onSurface }]}>{gap.sentence}</Text>
        </View>

        <View style={styles.map}>
          <ConceptMap concept={concept} parts={resultPartsOf(result, map)} />
          <View style={styles.firefly}>
            <Firefly state="fades" />
          </View>
        </View>

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
        <Body style={styles.normal}>Feeling surer than you can explain is normal. Explaining is how you find out.</Body>
        {noted.length > 0 && (
          <View style={styles.notes}>
            {noted.map(([move, note]) => (
              <Body key={move} dim>
                {note}
              </Body>
            ))}
          </View>
        )}
        <View style={styles.coach}>
          <Tag dim>next</Tag>
          <Body>{result.coach.message}</Body>
        </View>
        {againError && <Failure message={againError} />}
      </ScrollView>

      <View style={styles.foot}>
        <Button label={`Try ${concept} again`} busy={againBusy} onPress={onAgain} />
        <Button kind="text" label="Map another concept" onPress={onDone} />
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
  legend: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: space.l, rowGap: 6 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  normal: { marginTop: space.xs },
  notes: { gap: space.s },
  coach: { gap: 2 },
  foot: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.m, gap: space.xs },
});
