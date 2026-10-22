// The map (round 9 "Lumente"): the concept in the middle and its four parts around it, each with its icon, its
// label and two points. A part is a question in the dark ("?") until the learner's own words light it; the part
// being asked glows amber, with the firefly's dashed line running to it; a revealed answer stays dim and dashed
// (0 points); and the part that just lit gets an amber ring and six short sparks for 700 ms, like a bulb clicking
// on. The layout follows the text, so long answers and narrow phones never overlap.
import type { MoveId } from "@build-north/agents";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type LayoutRectangle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, Line } from "react-native-svg";
import type { PartView, Pip } from "../session/present.ts";
import { firefly, map, motion, palette, parts as PARTS, radius, size, space, type } from "../theme.ts";
import { decorative, PartIcon } from "./icons.tsx";
import { useColors, useMode } from "./ui.tsx";

type Box = { x: number; y: number; w: number; h: number };
const boxOf = (l: LayoutRectangle, dx = 0, dy = 0): Box => ({ x: l.x + dx, y: l.y + dy, w: l.width, h: l.height });
const sameLayout = (a: LayoutRectangle | undefined, b: LayoutRectangle) => !!a && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

type Props = {
  concept: string;
  parts: PartView[];
  /** The part that just lit: a ring and sparks for 700 ms, again whenever `pulse` changes. */
  justLit?: MoveId | null;
  pulse?: string | number;
  /** Where the firefly sits, in the map's coordinates (below it): the dashed line runs from there to the part
   * being asked. */
  leaderFrom?: { x: number; y: number } | null;
  /** Level 5 and the self-test: a tap on a part opens it for editing. */
  onPartPress?: (move: MoveId) => void;
};

export function ConceptMap({ concept, parts, justLit = null, pulse, leaderFrom = null, onPartPress }: Props) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});
  const [ring, setRing] = useState<MoveId | null>(null);

  useEffect(() => {
    if (!justLit) return;
    setRing(justLit);
    const off = setTimeout(() => setRing(null), motion.justLit);
    return () => clearTimeout(off);
  }, [justLit, pulse]);

  const keep = (key: string) => (e: LayoutChangeEvent) => {
    const layout = e.nativeEvent.layout;
    setLayouts((all) => (sameLayout(all[key], layout) ? all : { ...all, [key]: layout }));
  };
  const at = layouts;
  // every box in the map's coordinates: a part's layout is relative to its row
  const top = at.top && at.supraordinate && boxOf(at.supraordinate, 0, at.top.y);
  const left = at.middle && at.isoordinate && boxOf(at.isoordinate, 0, at.middle.y);
  const right = at.middle && at.exclusion && boxOf(at.exclusion, 0, at.middle.y);
  const bottom = at.bottom && at.infraordinate && boxOf(at.infraordinate, 0, at.bottom.y);
  const word = at.middle && at.column && at.word && boxOf(at.word, at.column.x, at.middle.y + at.column.y);
  const ready = top && left && right && bottom && word;

  const view = (move: MoveId) => parts.find((p) => p.move === move)!;
  const lineOf = (state: PartView["state"]) =>
    state === "asked"
      ? { stroke: c.questionOutline, width: 1.2, dash: undefined, dot: c.questionOutline }
      : state === "lit"
        ? { stroke: c.line, width: map.line, dash: undefined, dot: c.primary }
        : { stroke: c.lineFaint, width: map.line, dash: "3 4", dot: c.lineFaint };

  let drawing: ReactNode = null;
  if (ready) {
    const midY = at.middle!.y + at.middle!.height / 2;
    const joins = [
      { move: "supraordinate" as const, x1: width / 2, y1: top.y + top.h, x2: width / 2, y2: word.y - 2 },
      { move: "isoordinate" as const, x1: left.x + left.w, y1: midY, x2: word.x - space.s, y2: midY },
      { move: "exclusion" as const, x1: right.x, y1: midY, x2: word.x + word.w + space.s, y2: midY },
      { move: "infraordinate" as const, x1: width / 2, y1: bottom.y, x2: width / 2, y2: word.y + word.h + 2 },
    ];
    // the firefly's line meets the asked part just below it; the bigger group's, at its lower-left corner
    const anchors: Record<MoveId, { x: number; y: number }> = {
      supraordinate: { x: top.x + 18, y: top.y + top.h + 6 },
      isoordinate: { x: left.x + left.w / 2, y: left.y + left.h + 6 },
      exclusion: { x: right.x + right.w / 2, y: right.y + right.h + 6 },
      infraordinate: { x: bottom.x + bottom.w / 2, y: bottom.y + bottom.h + 6 },
    };
    const asked = parts.find((p) => p.state === "asked");
    const to = asked && leaderFrom ? anchors[asked.move] : null;
    const height = Math.max(bottom.y + bottom.h, leaderFrom ? leaderFrom.y + 4 : 0);
    drawing = (
      <Svg width={width} height={height} style={styles.drawing} {...decorative}>
        {to && leaderFrom && (
          <>
            <Line x1={leaderFrom.x} y1={leaderFrom.y} x2={to.x} y2={to.y} stroke={c.questionOutline} strokeWidth={firefly.leader.width} strokeDasharray={firefly.leader.dash} />
            <Circle cx={to.x} cy={to.y} r={firefly.leader.dot} fill={c.questionOutline} />
          </>
        )}
        {joins.map(({ move, x1, y1, x2, y2 }) => {
          const look = lineOf(view(move).state);
          return <Line key={move} x1={x1} y1={y1} x2={x2} y2={y2} stroke={look.stroke} strokeWidth={look.width} strokeDasharray={look.dash} />;
        })}
        {joins.map(({ move, x1, y1 }) => (
          <Circle key={`${move}-dot`} cx={x1} cy={y1} r={map.dot} fill={lineOf(view(move).state).dot} />
        ))}
      </Svg>
    );
  }

  const side = (width * map.side) / map.width;
  const middle = (width * map.middle) / map.width;
  const part = (move: MoveId, w: number) => (
    <PartBox key={move} view={view(move)} width={w} ring={ring === move} onPress={onPartPress && (() => onPartPress(move))} onLayout={keep(move)} />
  );

  return (
    <View style={styles.map} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {drawing}
      {width > 0 && (
        <>
          <View style={styles.row} onLayout={keep("top")}>
            {part("supraordinate", middle)}
          </View>
          <View style={[styles.row, styles.middle]} onLayout={keep("middle")}>
            {part("isoordinate", side)}
            <View style={styles.column} onLayout={keep("column")}>
              <Text style={[type.concept, styles.concept, { color: c.onSurface }, sizeFor(concept)]} onLayout={keep("word")} numberOfLines={3} accessibilityRole="header">
                {concept}
              </Text>
            </View>
            {part("exclusion", side)}
          </View>
          <View style={[styles.row, styles.bottom]} onLayout={keep("bottom")}>
            {part("infraordinate", middle)}
          </View>
        </>
      )}
    </View>
  );
}

/** A long concept gets a smaller size, so it fits between the side parts (the board's rule). */
function sizeFor(concept: string) {
  const n = concept.trim().length;
  const fontSize = n <= 5 ? 30 : n <= 8 ? 22 : 17;
  return { fontSize, lineHeight: Math.round(fontSize * 1.2) };
}

type PartProps = { view: PartView; width: number; ring: boolean; onPress?: () => void; onLayout: (e: LayoutChangeEvent) => void };

function PartBox({ view, width, ring, onPress, onLayout }: PartProps) {
  const c = useColors();
  const night = useMode() === "night";
  const { label, icon } = PARTS[view.move];
  const look = {
    unasked: { borderWidth: 1, borderStyle: "dashed", borderColor: c.partEdge, backgroundColor: c.partFill, ink: c.onSurfaceVariant, labelInk: c.onSurfaceVariant, glow: undefined },
    asked: { borderWidth: 1.5, borderStyle: "solid", borderColor: c.questionOutline, backgroundColor: c.questionContainer, ink: c.question, labelInk: c.question, glow: "0 0 14px rgba(242, 184, 75, 0.4)" },
    lit: { borderWidth: 1, borderStyle: "solid", borderColor: c.litEdge, backgroundColor: c.lit, ink: c.onLit, labelInk: c.litLabel, glow: c.litShadow },
    revealed: { borderWidth: 1, borderStyle: "dashed", borderColor: c.partEdge, backgroundColor: c.partFill, ink: c.onSurface, labelInk: c.onSurfaceVariant, glow: undefined },
  }[view.state];
  const glow = ring ? "0 0 0 3px rgba(242, 184, 75, 0.6), 0 0 22px rgba(255, 236, 205, 0.45)" : look.glow;
  const earned = view.pips.filter((p) => p === "earned").length;
  const said = view.text ?? (view.state === "asked" ? "being asked now" : "not answered yet");
  const box = (
    <View
      style={[
        styles.part,
        { width, borderWidth: look.borderWidth, borderStyle: look.borderStyle as "solid" | "dashed", borderColor: look.borderColor, backgroundColor: look.backgroundColor },
        glow ? { boxShadow: glow } : null,
      ]}
      onLayout={onPress ? undefined : onLayout}
      accessible={!onPress}
      accessibilityLabel={`${label}: ${said}. ${earned} of 2 points${view.state === "revealed" ? ", shown to you" : ""}.`}
    >
      <View style={styles.partHead}>
        <PartIcon d={icon} color={look.labelInk} />
        <Text style={[type.partLabel, styles.partLabel, { color: look.labelInk }]}>{label}</Text>
        <View style={styles.pips}>
          {view.pips.map((pip, i) => (
            // points on a lit part, or on any part once the light fills the screen, are dark ink
            <PointSquare key={i} pip={pip} dark={view.state === "lit" || !night} />
          ))}
        </View>
      </View>
      {view.text ? (
        <Text style={[view.state === "revealed" ? type.revealedText : type.partText, { color: look.ink }, view.state === "revealed" && styles.dim]} numberOfLines={5}>
          {view.text}
        </Text>
      ) : (
        <Text style={[type.partUnknown, { color: look.ink }]}>?</Text>
      )}
      {ring && <Sparks />}
    </View>
  );
  if (!onPress) return box;
  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${said}`}
      accessibilityHint="Opens this part, so you can fill it in"
      style={({ pressed }) => pressed && styles.pressed}
    >
      {box}
    </Pressable>
  );
}

/** A point: two per part. Earned is filled; open is an outline; capped is dotted (after a retry or a Help the part
 * can light 1 point at most); claimed is amber (the guess); missed is dashed coral (claimed, not proved). `dark`
 * draws it in dark ink, for a lit part or a lit screen. */
export function PointSquare({ pip, dark, big = false }: { pip: Pip; dark: boolean; big?: boolean }) {
  const c = useColors();
  const ink = dark ? palette.day.onSurface : palette.night.lit;
  const faint = dark ? "rgba(23, 22, 26, 0.35)" : "rgba(255, 240, 225, 0.45)";
  const look = {
    earned: { backgroundColor: ink, borderColor: ink, borderStyle: "solid", borderWidth: 1 },
    open: { borderColor: faint, borderStyle: "solid", borderWidth: 1 },
    capped: { borderColor: faint, borderStyle: "dotted", borderWidth: 1 },
    claimed: { backgroundColor: c.firefly, borderColor: dark ? palette.day.questionOutline : c.firefly, borderStyle: "solid", borderWidth: 1 },
    missed: { borderColor: c.gap, borderStyle: "dashed", borderWidth: 1.5 },
  }[pip];
  const side = big ? 14 : size.point;
  return (
    <View
      style={[
        { width: side, height: side, borderRadius: big ? 3 : radius.point },
        look as object,
        pip === "claimed" && !dark ? { boxShadow: "0 0 10px rgba(242, 184, 75, 0.6)" } : null,
      ]}
    />
  );
}

/** Six short amber sparks around the part that just lit, fading over 700 ms; none with Reduce Motion. */
function Sparks() {
  const still = useReducedMotion();
  const fade = useSharedValue(1);
  useEffect(() => {
    fade.value = withTiming(0, { duration: motion.justLit });
  }, [fade]);
  const style = useAnimatedStyle(() => ({ opacity: fade.value }));
  if (still) return null;
  const spark = (key: string, place: object, rotate: string) => <View key={key} style={[styles.spark, place, { transform: [{ rotate }] }]} />;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {spark("tl", { left: -14, top: -16 }, "-45deg")}
      {spark("t", { left: "50%", top: -24 }, "0deg")}
      {spark("tr", { right: -14, top: -16 }, "45deg")}
      {spark("bl", { left: -14, bottom: -16 }, "45deg")}
      {spark("b", { left: "50%", bottom: -24 }, "0deg")}
      {spark("br", { right: -14, bottom: -16 }, "-45deg")}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  map: { alignSelf: "stretch" },
  drawing: { position: "absolute", left: 0, top: 0 },
  row: { alignItems: "center" },
  middle: { flexDirection: "row", alignItems: "center", marginTop: map.rowGap },
  bottom: { marginTop: map.rowGap },
  column: { flex: 1, alignItems: "center", paddingHorizontal: space.xs },
  concept: { textAlign: "center" },
  part: { minHeight: map.partMinHeight, borderRadius: radius.part, paddingTop: space.s, paddingHorizontal: 10, paddingBottom: 10, gap: space.xs },
  partHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  partLabel: { flex: 1 },
  pips: { flexDirection: "row", gap: 3 },
  dim: { opacity: 0.8 },
  pressed: { opacity: 0.8 },
  spark: { position: "absolute", width: 2, height: 10, marginLeft: -1, borderRadius: 1, backgroundColor: firefly.states.asks.body },
});
