// The top of a session screen (round 8): Close, which saves; the concept as a file name ("jwt.spec"); and on
// the right the mini box with "3/4", which also opens the map. `end` replaces the right side (Submit, "done").
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fileNameOf } from "../session/present.ts";
import { size, space, type } from "../theme.ts";
import { MiniBox } from "./box.tsx";
import { IconButton, useColors } from "./ui.tsx";

type Props = {
  concept: string;
  onClose: () => void;
  /** The parts done and the one in progress, for the mini box; with `onMap` it opens the map. */
  progress?: { done: number; now: number | null; label: string };
  onMap?: () => void;
  end?: ReactNode;
};

export function SessionBar({ concept, onClose, progress, onMap, end }: Props) {
  const c = useColors();
  const name = fileNameOf(concept);
  const stem = name.slice(0, -".spec".length);
  return (
    <View style={styles.bar}>
      <IconButton icon="x" label="Close and save" onPress={onClose} />
      <Text style={[type.label, styles.file, { color: c.onSurfaceVariant }]} numberOfLines={1} accessibilityLabel={concept}>
        <Text style={[type.labelStrong, { color: c.onSurface }]}>{stem}</Text>.spec
      </Text>
      <View style={styles.side}>
        {end ??
          (progress && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Your map: ${progress.done} of 4 parts done. Show the map.`}
              disabled={!onMap}
              onPress={onMap}
              hitSlop={size.hitSlop}
              style={({ pressed }) => [styles.progress, pressed && styles.pressed]}
            >
              <MiniBox done={progress.done} now={progress.now} />
              <Text style={[type.label, { color: c.onSurfaceVariant }]}>{progress.label}</Text>
            </Pressable>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: space.s, minHeight: size.touch, paddingHorizontal: space.margin, marginTop: space.s },
  file: { flex: 1, textAlign: "center" },
  side: { minWidth: 72, alignItems: "flex-end" },
  progress: { flexDirection: "row", alignItems: "center", gap: space.s, minHeight: size.touch },
  pressed: { opacity: 0.7 },
});
