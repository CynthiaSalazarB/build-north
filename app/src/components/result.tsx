// The end of a session (round 8, #34): the gap as a signed number and one sentence, the guess against the
// score as a failed or passed assertion, the box opened (each fully proved face turned to glass), where the
// gap came from part by part, the parts done alone, and the coach's next step. Every number comes from
// Turn.result, computed by code. Your pair isn't here: it never reacts to a score.
import { MOVE_ORDER, type Mentefacto, type MoveId, type Result } from "@build-north/agents";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { success } from "../haptics.ts";
import { aloneOf, gapOf, missesOf, resultCornersOf } from "../session/present.ts";
import type { Entry } from "../session/transcript.ts";
import { box, space, type } from "../theme.ts";
import { OpenBox } from "./box.tsx";
import { Icon } from "./icons.tsx";
import { Failure } from "./messages.tsx";
import { SessionBar } from "./session-bar.tsx";
import { Body, Button, Card, Label, Screen, useColors } from "./ui.tsx";

type Props = {
  concept: string;
  result: Result;
  map: Mentefacto;
  entries: readonly Entry[];
  /** The whole-map evaluator's note per part, after level 5 or a self-test. */
  notes?: Partial<Record<MoveId, string>>;
  onAgain: () => void;
  againBusy?: boolean;
  againError?: string | null;
  onDone: () => void;
};

export function ResultScreen({ concept, result, map, entries, notes = {}, onAgain, againBusy, againError, onDone }: Props) {
  const c = useColors();
  const gap = gapOf(result);
  const ink = gap.over ? c.gap : c.onSurface;
  const misses = missesOf(result, entries, map, notes);
  const alone = aloneOf(result);
  const leveledUp = result.masteryChanges.length > 0;
  useEffect(() => {
    if (leveledUp) success();
  }, [leveledUp]);

  return (
    <Screen>
      <SessionBar concept={concept} onClose={onDone} end={<Label dim>done</Label>} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.gapRow} accessible accessibilityLabel={`${gap.sign === "−" ? "minus " : ""}${gap.amount}. ${gap.sentence}`}>
          <Text style={[type.gap, styles.gapNumber, { color: ink }]}>{`${gap.sign ?? ""}${gap.amount}`}</Text>
          <Body style={styles.sentence}>{gap.sentence}</Body>
        </View>

        <Card style={styles.assert}>
          <Label dim>expect(proved).toBe(guess)</Label>
          <AssertLine name="Expected:" value={result.predictedScore} />
          <AssertLine name="Received:" value={result.score} />
        </Card>

        <View style={styles.opened}>
          <OpenBox
            corners={resultCornersOf(box.cornerOrder, result.predictedScore, result.score)}
            alone={MOVE_ORDER.flatMap((move, i) => (result.rubric.find((row) => row.move === move)?.points === 2 ? [i] : []))}
            width={132}
            label={`The box with ${result.score} corners proved and ${Math.max(result.predictedScore - result.score, 0)} felt sure`}
          />
          <View style={styles.legend}>
            <LegendRow kind="proved" text={`proved ${result.score}`} />
            <LegendRow kind="felt" text={`felt sure ${result.predictedScore}`} />
            <LegendRow kind="never" text={`never expected ${result.maxScore - result.predictedScore}`} />
          </View>
        </View>

        {misses.length > 0 && (
          <Card style={styles.why}>
            <Label dim>where the gap came from</Label>
            {misses.map((miss) => (
              <View key={miss.move} style={styles.miss}>
                <View style={styles.missHead}>
                  <Body strong style={styles.flex}>
                    {miss.label}
                  </Body>
                  <Label dim>{miss.meta}</Label>
                </View>
                {miss.detail && <Body dim>{miss.detail}</Body>}
              </View>
            ))}
          </Card>
        )}

        {alone.length > 0 && (
          <View style={styles.alone}>
            <Icon name="check" color={c.alone} size={16} />
            <Label style={[styles.flex, { color: c.alone }]}>{`done alone: ${alone.join(", ")}`}</Label>
          </View>
        )}
        {result.questions.asked > 0 && <Label dim>{`you asked ${result.questions.asked} ${result.questions.asked === 1 ? "question" : "questions"}, ${result.questions.testing} testing the idea`}</Label>}
        <Body dim>Feeling surer than you can explain is normal. Explaining is how you find out.</Body>
        <Body>{result.coach.message}</Body>
        {againError && <Failure message={againError} />}
      </ScrollView>

      <View style={styles.foot}>
        <Button label={`Try ${concept} again`} busy={againBusy} onPress={onAgain} />
        <Button kind="text" label="Map another concept" onPress={onDone} />
      </View>
    </Screen>
  );
}

function AssertLine({ name, value }: { name: string; value: number }) {
  const c = useColors();
  return (
    <Text style={[type.code, { color: c.onSurfaceVariant }]}>
      {`${name} `}
      <Text style={{ color: c.onSurface, fontFamily: type.labelStrong.fontFamily }}>{value}</Text>
    </Text>
  );
}

function LegendRow({ kind, text }: { kind: "proved" | "felt" | "never"; text: string }) {
  const c = useColors();
  const dot =
    kind === "proved"
      ? { backgroundColor: c.onSurface }
      : kind === "felt"
        ? { borderColor: c.gap, borderWidth: 2 }
        : { borderColor: c.placeholder, borderWidth: 1.5, borderStyle: "dashed" as const };
  return (
    <View style={styles.legendRow}>
      <View style={[styles.dot, dot]} />
      <Label dim>{text}</Label>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.margin, paddingTop: space.l, paddingBottom: space.xl, gap: space.l },
  gapRow: { flexDirection: "row", alignItems: "center", gap: space.l },
  gapNumber: { fontVariant: ["lining-nums", "tabular-nums"] },
  sentence: { flex: 1 },
  assert: { gap: space.xs },
  opened: { flexDirection: "row", alignItems: "center", gap: space.l },
  legend: { flex: 1, gap: space.s },
  legendRow: { flexDirection: "row", alignItems: "center", gap: space.s },
  dot: { width: 12, height: 12, borderRadius: 6 },
  why: { gap: space.m },
  miss: { gap: space.xs },
  missHead: { flexDirection: "row", alignItems: "baseline", gap: space.s },
  flex: { flex: 1 },
  alone: { flexDirection: "row", alignItems: "center", gap: space.s },
  foot: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.m, gap: space.xs },
});
