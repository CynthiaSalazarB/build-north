// A finished area, read again (Cynthia, Oct 24). In a guided session and on the result, a lit or revealed area of
// the map opens to its full words (the map cuts a long one after five lines) and to what closed it: the evaluator's
// words on the right answer, or the answer the learner was shown. Nothing here can be edited or costs a point.
import { MOVE_ORDER } from "@build-north/agents";
import { StyleSheet, View } from "react-native";
import { areaCopyOf } from "../area-copy.ts";
import type { PartView } from "../session/present.ts";
import { parts as PARTS, space } from "../theme.ts";
import { PointSquare } from "./concept-map.tsx";
import { Body, Button, Label, Sheet, Small, Tag, useColors, useMode } from "./ui.tsx";

export type PartClosing = { text: string; revealed: boolean };

export function PartSheet({ view, closing, onClose }: { view: PartView | null; closing: PartClosing | null; onClose: () => void }) {
  const c = useColors();
  const lit = useMode() === "day";
  const label = view ? PARTS[view.move].label : "";
  const points = view?.pips ? view.pips.filter((pip) => pip === "earned").length : null;
  return (
    <Sheet open={view !== null} onClose={onClose} label={label}>
      {view && (
        <View style={styles.body}>
          <View style={styles.head} accessible accessibilityLabel={`${label}${points === null ? "" : `: ${points} of 2 points`}`}>
            <Tag style={{ color: c.question }}>{`${MOVE_ORDER.indexOf(view.move) + 1} · ${label}`}</Tag>
            {view.pips && (
              <View style={styles.pips}>
                {view.pips.map((pip, i) => (
                  <PointSquare key={i} pip={pip} dark={lit} />
                ))}
              </View>
            )}
          </View>
          {view.prompt && <Body>{view.prompt}</Body>}
          {view.context && <Small dim>{view.context}</Small>}
          <Label dim>{view.state === "revealed" ? "Shown to you · 0 points" : "Your answer"}</Label>
          <Body>{view.text ?? "Nothing on this area yet."}</Body>
          {closing && !closing.revealed && (
            <>
              <Label dim>What the AI said</Label>
              <Small dim>{areaCopyOf(closing.text)}</Small>
            </>
          )}
          {view.badge && <Small dim>{`↑ ${view.badge}`}</Small>}
          <Button kind="secondary" label="Close" onPress={onClose} />
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.m },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s },
  pips: { flexDirection: "row", gap: space.xs },
});
