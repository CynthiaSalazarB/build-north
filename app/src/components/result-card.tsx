// The end of a session: the score against the prediction (the calibration gap), points per part,
// help asked for and levels gained. The full result screen is #34; every number here comes from
// Turn.result, computed by code.
import { MOVE_LABEL, type Result } from "@build-north/agents";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, space } from "../theme.ts";

/** The calibration gap in words: predicted minus scored, positive when overconfident. */
function gapLine(predicted: number, gap: number): string {
  if (gap > 0) return `You predicted ${predicted}. That's ${gap} more than you got.`;
  if (gap < 0) return `You predicted ${predicted}. You got ${-gap} more than that.`;
  return `You predicted ${predicted}. Exactly right.`;
}

export function ResultCard({ result }: { result: Result }) {
  return (
    <View style={styles.card} accessibilityLabel={`You scored ${result.score} of ${result.maxScore}`}>
      <Text style={styles.score}>
        {result.score}
        <Text style={styles.max}>{` / ${result.maxScore}`}</Text>
      </Text>
      <Text style={styles.line}>{gapLine(result.predictedScore, result.calibrationGap)}</Text>
      <View style={styles.rows}>
        {result.rubric.map((row) => (
          <View key={row.move} style={styles.row}>
            <Text style={styles.label}>{MOVE_LABEL[row.move]}</Text>
            <Text style={styles.points}>{`${row.points} / 2`}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.small}>{`Help asked for: ${result.hintsUsed}`}</Text>
      {result.questions.asked > 0 && (
        <Text style={styles.small}>{`Questions asked: ${result.questions.asked}, ${result.questions.testing} testing the concept`}</Text>
      )}
      {result.masteryChanges.map((change) => (
        <Text key={change.move} style={styles.levelUp}>{`${MOVE_LABEL[change.move]}: level ${change.from} → ${change.to}`}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: "stretch", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: space.sm },
  score: { fontFamily: fonts.body, fontSize: 44, fontWeight: fonts.weight.bold, color: colors.text },
  max: { fontSize: fonts.size.large, color: colors.textMuted, fontWeight: fonts.weight.regular },
  line: { fontFamily: fonts.body, fontSize: fonts.size.body, color: colors.text },
  rows: { gap: space.xs, paddingVertical: space.sm },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontFamily: fonts.body, fontSize: fonts.size.body, color: colors.text },
  points: { fontFamily: fonts.body, fontSize: fonts.size.body, fontWeight: fonts.weight.medium, color: colors.text },
  small: { fontFamily: fonts.body, fontSize: fonts.size.small, color: colors.textMuted },
  levelUp: { fontFamily: fonts.body, fontSize: fonts.size.small, color: colors.found, fontWeight: fonts.weight.medium },
});
