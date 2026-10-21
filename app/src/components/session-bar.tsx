// The top of a session screen (round 6): Close, which saves; the Greek key, one unit per part of the map,
// which also opens the map; and "1 of 4" while the learner works on a part.
import type { Turn } from "@build-north/agents";
import { Pressable, StyleSheet, View } from "react-native";
import { keysOf, partLabelOf } from "../session/present.ts";
import { size, space } from "../theme.ts";
import { KeyUnit } from "./icons.tsx";
import { CircleButton, Footnote, useColors } from "./ui.tsx";

export function SessionBar({ turn, onClose, onMap }: { turn: Turn; onClose: () => void; onMap: () => void }) {
  const c = useColors();
  const part = partLabelOf(turn);
  const { movesDone, movesTotal } = turn.progress;
  return (
    <View style={styles.bar}>
      <CircleButton icon="x" label="Close and save" onPress={onClose} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Your map: ${movesDone} of ${movesTotal} parts built. Show the map.`}
        onPress={onMap}
        hitSlop={size.hitSlop}
        style={({ pressed }) => [styles.keys, pressed && styles.pressed]}
      >
        {keysOf(turn).map((state, i) => (
          <KeyUnit key={i} color={state === "done" ? c.primary : state === "now" ? c.onSurface : c.onSurfaceVariant} opacity={state === "todo" ? 0.35 : 1} />
        ))}
      </Pressable>
      <View style={styles.side}>{part && <Footnote dim>{part}</Footnote>}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: space.s, height: size.control, paddingHorizontal: space.margin, marginTop: space.s },
  keys: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: space.xs, height: size.control },
  side: { width: size.control, alignItems: "flex-end" },
  pressed: { transform: [{ scale: 0.96 }] },
});
