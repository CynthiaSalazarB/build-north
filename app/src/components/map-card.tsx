// The mentefacto so far, one row per part with its plain label (MOVE_LABEL). During the worked example
// it shows the planet map instead (Turn.example). At level 3 the current part shows the given half.
import { MOVE_LABEL, MOVE_ORDER, type Item, type Mentefacto, type MoveId, type Turn } from "@build-north/agents";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, space } from "../theme.ts";

const itemsOf = (map: Mentefacto, move: MoveId): Item[] => (move === "supraordinate" ? (map.supraordinate ? [map.supraordinate] : []) : map[move]);

type Props = { map: Mentefacto; title: string; current?: MoveId | null; scaffold?: Turn["scaffold"]; example?: boolean };

export function MapCard({ map, title, current = null, scaffold = null, example = false }: Props) {
  const [open, setOpen] = useState(true);
  return (
    <View style={[styles.card, example && styles.exampleCard]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${open ? "Hide" : "Show"} ${title}`} onPress={() => setOpen(!open)} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.toggle}>{open ? "Hide" : "Show"}</Text>
      </Pressable>
      {open &&
        MOVE_ORDER.map((move) => {
          const items = itemsOf(map, move);
          const here = move === current;
          return (
            <View key={move} style={[styles.row, here && styles.current]}>
              <Text style={[styles.label, here && styles.currentLabel]}>{MOVE_LABEL[move]}</Text>
              {items.length === 0 && !(here && scaffold) ? (
                <Text style={styles.empty}>{here ? "Working on it" : "Not yet"}</Text>
              ) : (
                <View style={styles.items}>
                  {items.map((item) => (
                    <Text key={item.value} style={styles.item}>
                      {item.value}
                      {item.note ? <Text style={styles.note}>{`: ${item.note}`}</Text> : null}
                    </Text>
                  ))}
                  {here && scaffold && (
                    <>
                      {scaffold.given.map((given) => (
                        <Text key={given} style={[styles.item, styles.given]}>
                          {given}
                        </Text>
                      ))}
                      <Text style={styles.blanks}>{`+ ${scaffold.blanks} more for you to find`}</Text>
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.md, gap: space.xs },
  exampleCard: { backgroundColor: colors.exampleBackground, borderColor: colors.exampleBackground },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: space.xs },
  title: { fontFamily: fonts.body, fontSize: fonts.size.body, fontWeight: fonts.weight.bold, color: colors.text },
  toggle: { fontFamily: fonts.body, fontSize: fonts.size.small, color: colors.primary },
  row: { flexDirection: "row", gap: space.md, paddingVertical: space.xs, paddingHorizontal: space.sm, borderRadius: radius.sm },
  current: { backgroundColor: colors.surfaceMuted },
  label: { width: 104, fontFamily: fonts.body, fontSize: fonts.size.small, color: colors.textMuted, paddingTop: 2 },
  currentLabel: { color: colors.text, fontWeight: fonts.weight.bold },
  items: { flex: 1, gap: 2 },
  item: { fontFamily: fonts.body, fontSize: fonts.size.body, color: colors.text },
  note: { color: colors.textMuted },
  given: { color: colors.textMuted, fontStyle: "italic" },
  blanks: { fontFamily: fonts.body, fontSize: fonts.size.small, color: colors.primary },
  empty: { flex: 1, fontFamily: fonts.body, fontSize: fonts.size.body, color: colors.textMuted },
});
