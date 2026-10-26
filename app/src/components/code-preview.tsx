// The picture on Start and the web's landing page (round 9 "Lumente"): the learner's code, the concept's line lit
// in amber with a static cursor, over the empty map in the dark, with the firefly beside it. When the concept
// changes, its line types itself in, the way the agent wrote it; with Reduce Motion it is simply there.
import type { MoveId } from "@build-north/agents";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { editorLinesOf, type PartView } from "../session/present.ts";
import { editor, motion, space, type } from "../theme.ts";
import { ConceptMap } from "./concept-map.tsx";
import { Firefly } from "./firefly.tsx";
import { useColors } from "./ui.tsx";

const EMPTY: PartView[] = (["supraordinate", "exclusion", "isoordinate", "infraordinate"] as MoveId[]).map((move) => ({ move, state: "unasked", text: null, pips: ["open", "open"] }));

/** The typing takes at most this long, however long the line. */
const TYPING_MAX = 420;

/** How much of `text` is typed so far: all of it at first and with Reduce Motion, else it retypes on each change. */
function useTyped(text: string): string {
  const still = useReducedMotion();
  const [shown, setShown] = useState(text.length);
  const [typing, setTyping] = useState(text);
  useEffect(() => {
    setTyping(text);
    if (still) {
      setShown(text.length);
      return;
    }
    setShown(0);
    const step = Math.min(motion.typing, TYPING_MAX / Math.max(text.length, 1));
    // the timer stops with the last character, not only when the text changes or the preview unmounts
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= text.length) clearInterval(timer);
    }, step);
    return () => clearInterval(timer);
  }, [text, still]);
  return typing.slice(0, shown);
}

export function CodePreview({ concept }: { concept: string }) {
  const c = useColors();
  const lines = editorLinesOf(concept);
  const current = lines.find((line) => line.current)!;
  const typed = useTyped(current.text);
  return (
    <View style={styles.preview}>
      <View style={[styles.editor, { backgroundColor: c.codeFill, borderColor: c.fieldEdge }]} accessible accessibilityLabel={`Code from your project that uses ${concept || "a concept"}`}>
        {lines.map((line) => (
          <View key={line.n} style={[styles.line, line.current && { backgroundColor: c.codeLine }]}>
            <Text style={[type.code, styles.gutter, { color: line.current ? c.question : c.codeGutter }]}>{line.n}</Text>
            <Text style={[type.code, styles.code, { color: line.current ? c.question : c.codeDim }]} numberOfLines={1}>
              {line.current ? typed : line.text}
            </Text>
            {line.current && <View style={[styles.cursor, { backgroundColor: c.firefly }]} />}
          </View>
        ))}
      </View>
      <View style={styles.map} accessible={false} importantForAccessibility="no-hide-descendants">
        <ConceptMap concept={concept || "?"} parts={EMPTY} />
        <View style={styles.firefly}>
          <Firefly state="asks" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { gap: space.l, alignSelf: "stretch" },
  editor: { borderRadius: editor.radius, borderWidth: 1, paddingVertical: 10, overflow: "hidden" },
  line: { flexDirection: "row", alignItems: "center" },
  gutter: { width: editor.gutter, paddingRight: space.m, textAlign: "right" },
  code: { flexShrink: 1 },
  cursor: { width: 8, height: 17, marginLeft: 2 },
  map: { paddingHorizontal: 26 },
  firefly: { position: "absolute", left: 40, top: 6 },
});
