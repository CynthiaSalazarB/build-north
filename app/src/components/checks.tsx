// The checks list (round 8): one row per part of the map, like a pull request's checks. Done alone is a
// check, done with help is the amber bulb, the current part is half filled, the rest are queued.
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import type { Check } from "../session/present.ts";
import { space } from "../theme.ts";
import { decorative, Icon } from "./icons.tsx";
import { Body, Card, Label, useColors } from "./ui.tsx";

/** `onPress` makes every row a button (level 5 edits a part from here). */
export function ChecksList({ checks, onPress }: { checks: readonly Check[]; onPress?: (check: Check) => void }) {
  const c = useColors();
  return (
    <Card style={styles.list}>
      {checks.map((check, i) => {
        const row: ReactNode = (
          <View style={[styles.row, i > 0 && { borderTopColor: c.separator, borderTopWidth: StyleSheet.hairlineWidth }, check.state === "now" && { backgroundColor: c.surfaceHigh }]}>
            <Glyph state={check.state} />
            <Body dim={check.state === "queued"} style={styles.label} numberOfLines={1}>
              {check.label}
            </Body>
            <Label style={{ color: metaColor(check.state, c) }} numberOfLines={1}>
              {check.meta}
            </Label>
          </View>
        );
        return onPress ? (
          <Pressable
            key={check.move}
            accessibilityRole="button"
            accessibilityLabel={`${check.label}: ${check.meta}`}
            onPress={() => onPress(check)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            {row}
          </Pressable>
        ) : (
          <View key={check.move} accessible accessibilityLabel={`${check.label}: ${check.meta}`}>
            {row}
          </View>
        );
      })}
    </Card>
  );
}

const metaColor = (state: Check["state"], c: ReturnType<typeof useColors>) =>
  state === "done" ? c.alone : state === "hinted" ? c.hint : c.onSurfaceVariant;

function Glyph({ state }: { state: Check["state"] }) {
  const c = useColors();
  if (state === "done") return <Icon name="check" color={c.alone} size={18} />;
  if (state === "hinted") return <Icon name="bulb" color={c.hint} size={18} />;
  if (state === "now") {
    // ◐: a ring with its right half filled
    return (
      <Svg width={18} height={18} viewBox="0 0 18 18" {...decorative}>
        <Circle cx={9} cy={9} r={7} fill="none" stroke={c.onSurface} strokeWidth={2} />
        <Path d="M9 2a7 7 0 0 1 0 14z" fill={c.onSurface} />
      </Svg>
    );
  }
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" {...decorative}>
      <Circle cx={9} cy={9} r={6.5} fill="none" stroke={c.onSurfaceVariant} strokeWidth={1.6} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  list: { padding: 0, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: space.m, minHeight: 44, paddingHorizontal: space.l },
  label: { flex: 1 },
  pressed: { opacity: 0.7 },
});
