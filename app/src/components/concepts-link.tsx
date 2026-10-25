import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius, size, space, type } from "../theme.ts";
import { Icon } from "./icons.tsx";
import { Small, useColors, usePress } from "./ui.tsx";

/** One doorway to saved work, reused for its two folders. Link keeps normal web navigation and native back. */
export function ConceptsLink({ folder, count }: { folder?: "in-progress" | "completed"; count?: number }) {
  const c = useColors();
  const { hovered, pressed, bind } = usePress();
  const title = folder === "in-progress" ? "In progress" : folder === "completed" ? "Completed" : "View your concepts";
  const description = folder === "in-progress" ? "Pick up where you left off." : folder === "completed" ? "Revisit your maps, feedback and results." : "Resume a session or review a completed map.";
  const href: Href = folder ? { pathname: "/concepts", params: { folder } } : "/concepts";
  return (
    <Link href={href} push asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${title}${count === undefined ? "" : `, ${count} ${count === 1 ? "session" : "sessions"}`}`}
        accessibilityHint={description}
        {...bind}
        style={StyleSheet.flatten([styles.link, { backgroundColor: c.surfaceContainer, borderColor: hovered ? c.onSurfaceVariant : c.fieldEdge }, pressed && styles.pressed])}
      >
        <View style={[styles.icon, { backgroundColor: c.controlFill }]}>
          <Icon name={folder === "completed" ? "folder-check" : "folder"} color={folder === "in-progress" ? c.question : c.onSurface} size={24} />
        </View>
        <View style={styles.words}>
          <View style={styles.titleRow}>
            <Text style={[type.button, styles.title, { color: c.onSurface }]}>{title}</Text>
            {count !== undefined && <Text style={[type.button, { color: c.onSurfaceVariant }]}>{count}</Text>}
          </View>
          <Small dim>{description}</Small>
        </View>
        <Icon name="right" color={c.onSurfaceVariant} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: { flexDirection: "row", alignItems: "center", gap: space.m, padding: space.l, minHeight: size.button, borderRadius: radius.card, borderWidth: 1 },
  icon: { width: size.touch, height: size.touch, borderRadius: radius.part, alignItems: "center", justifyContent: "center" },
  words: { flex: 1, gap: space.xs, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: space.m },
  title: { flex: 1 },
  pressed: { opacity: 0.85 },
});
