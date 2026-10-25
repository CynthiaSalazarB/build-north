// Optional reflection, opened by the learner. One reading surface, no scoring, editing or nested sheets.
import { StyleSheet, ScrollView, Text, View } from "react-native";
import { AREA_LABEL } from "../area-copy.ts";
import type { ComparisonArea } from "../session/comparison.ts";
import { radius, space, type } from "../theme.ts";
import { Body, Button, Sheet, Small, Title, useColors, useWide } from "./ui.tsx";

type Props = { open: boolean; onClose: () => void; concept: string; explanation: string; areas: readonly ComparisonArea[] };

export function ExplanationComparison({ open, onClose, concept, explanation, areas }: Props) {
  const c = useColors();
  const wide = useWide();
  return (
    <Sheet open={open} onClose={onClose} label="Compare with your first explanation" reading>
      <View style={styles.heading}>
        <Title>Compare your explanations</Title>
        <Small dim>{concept}</Small>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, wide && styles.columns]}>
        <View style={[styles.column, wide && styles.wideColumn]}>
          <Text accessibilityRole="header" style={[type.ui, styles.label, { color: c.onSurface }]}>Your first explanation</Text>
          <View style={[styles.card, { borderColor: c.partEdge, backgroundColor: c.partFill }]}>
            <Body>{explanation}</Body>
          </View>
        </View>
        <View style={[styles.column, wide && styles.wideColumn]}>
          <Text accessibilityRole="header" style={[type.ui, styles.label, { color: c.onSurface }]}>Your map after this session</Text>
          {areas.map((area) => (
            <View key={area.move} style={[styles.card, { borderColor: c.partEdge, backgroundColor: c.partFill }]}>
              <Text accessibilityRole="header" style={[type.ui, styles.label, { color: c.onSurface }]}>{AREA_LABEL[area.move]}</Text>
              <Small dim>{area.support === "revealed" ? "Answer shown to you" : area.support === "hint" ? "Answered with hints" : "Your answer"}</Small>
              {area.items.length ? area.items.map((item, i) => (
                <View key={i} style={styles.item}>
                  <Body>{item.value}</Body>
                  {area.move === "exclusion" && item.note && <Small dim>{`Key difference: ${item.note}`}</Small>}
                </View>
              )) : <Body dim>No answer recorded.</Body>}
            </View>
          ))}
        </View>
      </ScrollView>
      <Button kind="secondary" label="Back to results" onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  heading: { gap: space.xs },
  scroll: { flex: 1, minHeight: 0 },
  content: { gap: space.xl, paddingBottom: space.m },
  columns: { flexDirection: "row", alignItems: "flex-start" },
  column: { minWidth: 0, gap: space.m },
  wideColumn: { flex: 1 },
  label: { fontWeight: "700" },
  card: { borderWidth: 1, borderRadius: radius.card, padding: space.m, gap: space.s },
  item: { gap: space.xs },
});
