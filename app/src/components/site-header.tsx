// The website layout's header (from `wideFrom`): the wordmark, then the concept of the session in progress, and
// the screen's own actions on the right. The light's corner sits behind those actions, so they are solid controls.
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { brand, page, radius, space, type } from "../theme.ts";
import { useColors } from "./ui.tsx";

export function SiteHeader({ concept, end }: { concept?: string; end?: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.bar}>
      <Text style={[type.wordmark, { color: c.onSurface }]} accessibilityRole={concept ? undefined : "header"}>
        {brand.name}
      </Text>
      {concept && (
        <>
          <Text style={[type.wordmark, styles.slash, { color: c.onSurfaceVariant }]} accessible={false}>
            /
          </Text>
          <Text style={[type.pill, styles.pill, { color: c.onSurface, backgroundColor: c.surfaceContainer, borderColor: c.fieldEdge }]} numberOfLines={1} accessibilityRole="header">
            {concept}
          </Text>
        </>
      )}
      <View style={styles.end}>{end}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: space.m, height: page.header, paddingHorizontal: page.gutter },
  slash: { opacity: 0.6 },
  pill: { paddingVertical: space.xs, paddingHorizontal: space.m, borderRadius: radius.chip, borderWidth: 1, overflow: "hidden", maxWidth: 360 },
  end: { flex: 1, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: space.m },
});
