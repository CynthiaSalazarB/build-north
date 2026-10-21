// The mentefacto so far, one row per part with its plain label (MOVE_LABEL). During the worked example
// it shows the planet map instead (Turn.example). At level 3 the current part shows the given half.
import { MOVE_LABEL, MOVE_ORDER, type Mentefacto, type MoveId, type Turn } from "@build-north/agents";
import { StyleSheet, View } from "react-native";
import { itemsOf } from "../session/present.ts";
import { space } from "../theme.ts";
import { Body, Card, Label, useColors } from "./ui.tsx";

type Props = { map: Mentefacto; title: string; current?: MoveId | null; scaffold?: Turn["scaffold"] };

export function MapCard({ map, title, current = null, scaffold = null }: Props) {
  const c = useColors();
  return (
    <Card style={styles.card}>
      <Label dim>{title}</Label>
      {MOVE_ORDER.map((move) => {
        const items = itemsOf(map, move);
        const here = move === current;
        return (
          <View key={move} style={[styles.row, { borderTopColor: c.separator }]}>
            <Label strong={here} dim={!here} style={styles.part}>
              {MOVE_LABEL[move]}
            </Label>
            <View style={styles.items}>
              {items.length === 0 && !(here && scaffold) ? (
                <Body dim>{here ? "working on it" : "not yet"}</Body>
              ) : (
                <>
                  {items.map((item) => (
                    <Body key={item.value}>{item.note ? `${item.value}: ${item.note}` : item.value}</Body>
                  ))}
                  {here && scaffold?.given.map((given) => <Body key={given} dim>{given}</Body>)}
                  {here && scaffold && <Label style={{ color: c.onSurface }}>{`+ ${scaffold.blanks} more for you to find`}</Label>}
                </>
              )}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.s },
  row: { flexDirection: "row", gap: space.m, paddingTop: space.s, borderTopWidth: StyleSheet.hairlineWidth },
  part: { width: 104, paddingTop: space.xs },
  items: { flex: 1 },
});
