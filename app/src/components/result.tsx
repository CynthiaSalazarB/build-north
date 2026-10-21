// The end of a session (round 6, #34): the guess and the score on one 0 to 8 scale, the gap as a number
// and one sentence, each proven point casting into bronze one by one, the points per part, and one next
// step. Every number comes from Turn.result, computed by code.
import { MOVE_LABEL, type Result } from "@build-north/agents";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { success } from "../haptics.ts";
import { blocksOf, gapOf, stageOf, type Block } from "../session/present.ts";
import { motion, palette, radius, size, space, type } from "../theme.ts";
import { Icon } from "./icons.tsx";
import { AloneTag, Body, Button, Footnote, PointDots, Screen, Ui } from "./ui.tsx";

const day = palette.day;
const GAP = space.s;

type Props = { concept: string; result: Result; onDone: () => void };

export function ResultScreen({ concept, result, onDone }: Props) {
  const gap = gapOf(result);
  const ink = gap.over ? day.gap : day.onSurface;
  const leveledUp = result.masteryChanges.length > 0;
  useEffect(() => {
    if (leveledUp) success();
  }, [leveledUp]);

  return (
    <Screen tone="day">
      <View style={styles.bar}>
        <View style={styles.side} />
        <Ui strong style={styles.concept} numberOfLines={1}>
          {concept}
        </Ui>
        <Button kind="tonal" label="Done" onPress={onDone} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.group}>
          <Footnote strong dim>
            Your guess vs. your score
          </Footnote>
          <View style={styles.gapRow} accessible accessibilityLabel={`${gap.sign === "−" ? "minus " : ""}${gap.amount}. ${gap.sentence}`}>
            <View style={styles.hero}>
              {gap.sign && <Icon name={gap.sign === "+" ? "plus" : "minus"} color={ink} size={40} />}
              <Text style={[type.hero, styles.heroNumber, { color: ink }]}>{gap.amount}</Text>
            </View>
            <Body strong style={[styles.sentence, { color: ink }]}>
              {gap.sentence}
            </Body>
          </View>
        </View>

        <Scale predicted={result.predictedScore} score={result.score} max={result.maxScore} />

        <View style={styles.list} accessibilityLabel="Points per part">
          {result.rubric.map((row, i) => (
            <View key={row.move} style={[styles.row, i > 0 && styles.rowLine]}>
              <Ui style={styles.part}>{MOVE_LABEL[row.move]}</Ui>
              {row.points === 2 && <AloneTag />}
              <PointDots points={row.points} />
            </View>
          ))}
        </View>

        <Footnote dim>
          {result.hintsUsed === 0 ? "You didn't use Help." : `You used Help ${result.hintsUsed} ${result.hintsUsed === 1 ? "time" : "times"}.`}
        </Footnote>
        {result.masteryChanges.map((change) => (
          <Footnote key={change.move}>{`${MOVE_LABEL[change.move]} moved up to ${stageOf(change.to).name}.`}</Footnote>
        ))}
        {result.questions.asked > 0 && (
          <Footnote dim>{`You asked ${result.questions.asked} ${result.questions.asked === 1 ? "question" : "questions"}, ${result.questions.testing} testing the idea.`}</Footnote>
        )}
        <Body>{result.coach.message}</Body>
      </ScrollView>

      <View style={styles.foot}>
        <Button label="Start a New Map" onPress={onDone} />
      </View>
    </Screen>
  );
}

/** The 0 to 8 scale: what you guessed above, what you scored below, the points cast in bronze. */
function Scale({ predicted, score, max }: { predicted: number; score: number; max: number }) {
  const [width, setWidth] = useState(0);
  const span = (n: number) => (n > 0 && width > 0 ? ((width + GAP) * n) / max - GAP : 0);
  const blocks = blocksOf(predicted, score, max);
  const felt = predicted - score;
  return (
    <View
      style={styles.scale}
      accessible
      accessibilityLabel={`Guessed ${predicted} of ${max}, scored ${score} of ${max}.${felt > 0 ? ` ${felt} felt sure but didn't hold.` : ""}`}
    >
      <Bracket label={`Guessed ${predicted}`} width={span(predicted)} />
      <View style={styles.blocks} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {blocks.map((block, i) => (
          <BlockView key={i} block={block} index={i} />
        ))}
      </View>
      <Bracket label={`Scored ${score}`} width={span(score)} below />
    </View>
  );
}

function Bracket({ label, width, below }: { label: string; width: number; below?: boolean }) {
  const line = width > 0 && <View style={[styles.bracket, below ? styles.bracketBelow : styles.bracketAbove, { width }]} />;
  return (
    <View style={[styles.bracketBox, { width: Math.max(width, 88) }]}>
      {below && line}
      <Footnote strong={below} dim={!below} style={styles.bracketLabel}>
        {label}
      </Footnote>
      {!below && line}
    </View>
  );
}

/** A proven point starts as a shadow and casts into bronze, 90 ms after the one before it. */
function BlockView({ block, index }: { block: Block; index: number }) {
  const still = useReducedMotion();
  const shadow = useSharedValue(block === "cast" && !still ? 1 : 0);
  useEffect(() => {
    if (block !== "cast" || still) return;
    shadow.value = withDelay(motion.castDelay + index * motion.castStagger, withTiming(0, { duration: motion.cast, easing: Easing.out(Easing.ease) }));
  }, [block, still, index, shadow]);
  const look = useAnimatedStyle(() => ({ opacity: shadow.value }));

  if (block !== "cast") return <View style={[styles.block, block === "shade" ? styles.shade : styles.empty]} />;
  return (
    <View style={styles.cast}>
      <View style={styles.castFloor} />
      <View style={styles.bronze}>
        <Svg width="100%" height="100%" viewBox="0 0 10 48" preserveAspectRatio="none" accessible={false}>
          <Defs>
            <LinearGradient id={`bronze-${index}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={day.primaryHigh} />
              <Stop offset="0.42" stopColor={day.primary} />
              <Stop offset="1" stopColor={day.primaryDeep} />
            </LinearGradient>
          </Defs>
          <Rect width={10} height={48} fill={`url(#bronze-${index})`} />
        </Svg>
      </View>
      <Animated.View style={[styles.block, styles.shadeOverlay, look]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: space.s, height: size.control, paddingHorizontal: space.margin, marginTop: space.s },
  side: { width: 64 },
  concept: { flex: 1, textAlign: "center", textTransform: "capitalize" },
  content: { paddingHorizontal: space.margin, paddingTop: space.xl, paddingBottom: space.xl, gap: space.margin },
  group: { gap: space.s },
  gapRow: { flexDirection: "row", alignItems: "flex-end", gap: space.l },
  hero: { flexDirection: "row", alignItems: "center" },
  heroNumber: { fontVariant: ["lining-nums", "tabular-nums"] },
  sentence: { flex: 1, maxWidth: 168, paddingBottom: space.s },
  scale: { gap: space.s },
  blocks: { flexDirection: "row", gap: GAP },
  block: { flex: 1, height: 48, borderRadius: radius.block },
  shade: { backgroundColor: day.shadowBlock, borderWidth: 1.5, borderStyle: "dashed", borderColor: day.gap },
  empty: { borderWidth: 1.5, borderStyle: "dotted", borderColor: day.placeholder, opacity: 0.6 },
  cast: { flex: 1, height: 48 },
  castFloor: { position: "absolute", left: 1, right: 1, top: space.xs, bottom: -space.xs, borderRadius: radius.block, backgroundColor: day.shadowBlock },
  bronze: { ...StyleSheet.absoluteFill, borderRadius: radius.block, overflow: "hidden" },
  shadeOverlay: { ...StyleSheet.absoluteFill, backgroundColor: day.surface, borderWidth: 1.5, borderStyle: "dashed", borderColor: day.gap },
  bracketBox: { gap: space.xs },
  bracket: { height: space.s, borderColor: day.placeholder, borderLeftWidth: 1.5, borderRightWidth: 1.5 },
  bracketAbove: { borderTopWidth: 1.5, borderTopLeftRadius: space.xs, borderTopRightRadius: space.xs },
  bracketBelow: { borderBottomWidth: 1.5, borderBottomLeftRadius: space.xs, borderBottomRightRadius: space.xs },
  bracketLabel: { textAlign: "center", alignSelf: "stretch" },
  list: { backgroundColor: day.surfaceContainer, borderRadius: radius.card, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: space.m, minHeight: 52, paddingHorizontal: space.l },
  rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: day.separator },
  part: { flex: 1 },
  foot: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.m },
});
