// The mentefacto so far, one row per part with its plain label (MOVE_LABEL). During the worked example
// it shows the planet map instead (Turn.example). At level 3 the current part shows the given half.
import { MOVE_LABEL, MOVE_ORDER, type Mentefacto, type MoveId, type Turn } from "@build-north/agents";
import { StyleSheet, Text, View } from "react-native";
import { itemsOf } from "../session/present.ts";
import { palette, radius, space, type } from "../theme.ts";
import { Body, Footnote, Ui, useColors } from "./ui.tsx";

type Props = { map: Mentefacto; title: string; current?: MoveId | null; scaffold?: Turn["scaffold"] };

export function MapCard({ map, title, current = null, scaffold = null }: Props) {
  const c = useColors();
  return (
    <View style={[styles.card, { backgroundColor: c.surfaceContainer }]}>
      <Ui strong>{title}</Ui>
      {MOVE_ORDER.map((move) => {
        const items = itemsOf(map, move);
        const here = move === current;
        return (
          <View key={move} style={[styles.row, here && { backgroundColor: palette.day.surface }]}>
            <Footnote strong={here} dim={!here} style={styles.label}>
              {MOVE_LABEL[move]}
            </Footnote>
            <View style={styles.items}>
              {items.length === 0 && !(here && scaffold) ? (
                <Body dim>{here ? "Working on it" : "Not yet"}</Body>
              ) : (
                <>
                  {items.map((item) => (
                    <Body key={item.value}>
                      {item.value}
                      {item.note ? <Text style={{ color: c.onSurfaceVariant }}>{`: ${item.note}`}</Text> : null}
                    </Body>
                  ))}
                  {here &&
                    scaffold?.given.map((given) => (
                      <Body key={given} italic dim>
                        {given}
                      </Body>
                    ))}
                  {here && scaffold && <Text style={[type.footnoteStrong, { color: c.primary }]}>{`+ ${scaffold.blanks} more for you to find`}</Text>}
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, padding: space.l, gap: space.xs },
  row: { flexDirection: "row", gap: space.m, paddingVertical: space.xs, paddingHorizontal: space.s, borderRadius: radius.block },
  label: { width: 104, paddingTop: space.xs },
  items: { flex: 1 },
});
