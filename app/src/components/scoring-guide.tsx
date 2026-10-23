import { StyleSheet, Text, View } from "react-native";
import { SCORING } from "../session/present.ts";
import { radius, space, type } from "../theme.ts";
import { Small, useColors } from "./ui.tsx";

/** The same rubric before the prediction and beside the result. The scoring itself stays in agents/. */
export function ScoringGuide() {
  const c = useColors();
  return (
    <View style={styles.guide}>
      <Small>Each area can earn:</Small>
      {SCORING.map(({ points, text }) => (
        <View key={points} style={styles.row}>
          <Text style={[type.label, styles.score, { color: c.question, borderColor: c.partEdge }]}>{`${points} pts`}</Text>
          <Small dim style={styles.text}>{text}</Small>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  guide: { gap: space.s },
  row: { flexDirection: "row", alignItems: "flex-start", gap: space.m },
  score: { width: 56, borderWidth: 1, borderRadius: radius.point, paddingVertical: 5, textAlign: "center" },
  text: { flex: 1 },
});
