// The top of a session screen (round 9 "Lumente"): Close, which saves; the concept in a pill; and `end` on the
// right ("done" on the result, the questions asked at level 5).
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { radius, size, space, type } from "../theme.ts";
import { IconButton, useColors } from "./ui.tsx";

export function SessionBar({ concept, onClose, end }: { concept: string; onClose: () => void; end?: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.bar}>
      <IconButton icon="x" label="Close and save" onPress={onClose} />
      <View style={styles.middle}>
        <Text style={[type.pill, styles.pill, { color: c.onSurface, backgroundColor: c.controlFill }]} numberOfLines={1} accessibilityRole="header">
          {concept}
        </Text>
      </View>
      <View style={styles.side}>{end}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: space.s, minHeight: size.touch, paddingHorizontal: space.margin, marginTop: space.s },
  middle: { flex: 1, alignItems: "center" },
  pill: { paddingVertical: 2, paddingHorizontal: 10, borderRadius: radius.chip, overflow: "hidden", maxWidth: "100%" },
  // at least as wide as Close, so the concept stays centered; grows for the level-5 question squares
  side: { minWidth: size.iconButton, alignItems: "flex-end" },
});
