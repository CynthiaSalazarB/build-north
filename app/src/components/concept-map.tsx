// The map (round 9 "Lumente"): the concept in the middle and its four parts around it, each with its icon, its
// label and two points. A part is a question in the dark ("?") until the learner's own words light it; the part
// being asked glows amber, with the firefly's dashed line running to it; a revealed answer stays dim and dashed
// (0 points); and the part that just lit gets an amber ring and six short sparks for 700 ms, like a bulb clicking
// on. The layout follows the text, so long answers and narrow phones never overlap. The rows rise in once when the
// map appears, a part eases into its new state, and the firefly's line draws itself to each new part.
import { MOVE_ORDER, type MoveId } from "@build-north/agents";
import { useEffect, useId, useState, type ReactNode } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent, type LayoutRectangle } from "react-native";
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type CSSTransitionProperties } from "react-native-reanimated";
import Svg, { Circle, Defs, Line, Mask, Path } from "react-native-svg";
import type { PartView, Pip } from "../session/present.ts";
import { firefly, map, motion, palette, parts as PARTS, radius, size, space, type } from "../theme.ts";
import { decorative, PartIcon } from "./icons.tsx";
import { roundedPath, tracePoints, type Box, type Point } from "./trace.ts";
import { AnimatedPressable, useColors, useEntrance, useMode, usePress } from "./ui.tsx";

const boxOf = (l: LayoutRectangle, dx = 0, dy = 0): Box => ({ x: l.x + dx, y: l.y + dy, w: l.width, h: l.height });
const sameLayout = (a: LayoutRectangle | undefined, b: LayoutRectangle) => !!a && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

/** Where everything sits, in the map's own coordinates: what the website layout needs to run the firefly's line in
 * from beside the map. */
export type MapGeometry = { parts: Record<MoveId, Box>; width: number; height: number };

type Props = {
  concept: string;
  parts: PartView[];
  /** The part that just lit: a ring and sparks for 700 ms, again whenever `pulse` changes. */
  justLit?: MoveId | null;
  pulse?: string | number;
  /** Where the firefly sits, in the map's coordinates (below it): the dashed line runs from there to the part
   * being asked. */
  leaderFrom?: Point | null;
  /** Level 5 and the self-test: a tap on a part opens it for editing. */
  onPartPress?: (move: MoveId) => void;
  /** A guided session and the result: a tap on a lit or revealed part opens it to be read again, nothing to edit. */
  onPartOpen?: (move: MoveId) => void;
  /** Navigation highlight in the self-test. It doesn't judge the answer or award points. */
  activePart?: MoveId | null;
  onGeometry?: (geometry: MapGeometry) => void;
};

export function ConceptMap({ concept, parts, justLit = null, pulse, leaderFrom = null, onPartPress, onPartOpen, activePart = null, onGeometry }: Props) {
  const c = useColors();
  const entrance = useEntrance();
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

  // the website layout draws the firefly's line itself, from beside the map, so it hears where the parts are
  const geometry = ready ? JSON.stringify({ parts: { supraordinate: top, isoordinate: left, exclusion: right, infraordinate: bottom }, width, height: bottom.y + bottom.h }) : null;
  useEffect(() => {
    if (geometry && onGeometry) onGeometry(JSON.parse(geometry) as MapGeometry);
  }, [geometry, onGeometry]);

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
    const asked = parts.find((p) => p.move === activePart) ?? parts.find((p) => p.state === "asked");
    // Run along the edge and between rows, so the phone's connection doesn't cross an answer's text.
    const boxes: Record<MoveId, Box> = { supraordinate: top, isoordinate: left, exclusion: right, infraordinate: bottom };
    const points = asked && leaderFrom ? tracePoints(leaderFrom, boxes[asked.move], asked.move === "exclusion" ? "top" : "left", { gutter: 4, above: top.y + top.h + space.s }) : null;
    const to = points?.at(-1);
    const path = points ? roundedPath(points, 8) : null;
    const height = Math.max(bottom.y + bottom.h, leaderFrom ? leaderFrom.y + 4 : 0);
    drawing = (
      <Svg width={width} height={height} style={styles.drawing} {...decorative}>
        {to && path && asked && (
          <Trace
            d={path.d}
            length={path.length}
            end={to}
            drawKey={asked.move}
            color={c.questionOutline}
          />
        )}
        {joins.map(({ move, x1, y1, x2, y2 }) => {
          const look = lineOf(move === activePart ? "asked" : view(move).state);
          return <Line key={move} x1={x1} y1={y1} x2={x2} y2={y2} stroke={look.stroke} strokeWidth={look.width} strokeDasharray={look.dash} />;
        })}
        {joins.map(({ move, x1, y1 }) => (
          <Circle key={`${move}-dot`} cx={x1} cy={y1} r={map.dot} fill={lineOf(move === activePart ? "asked" : view(move).state).dot} />
        ))}
      </Svg>
    );
  }

  const side = (width * map.side) / map.width;
  const middle = (width * map.middle) / map.width;
  const part = (move: MoveId, w: number) => {
    // a part only opens to be read once it has something to read: lit, or shown to the learner
    const reads = !onPartPress && !!onPartOpen && (view(move).state === "lit" || view(move).state === "revealed");
    const press = onPartPress ? () => onPartPress(move) : reads ? () => onPartOpen!(move) : undefined;
    return <PartBox key={move} view={view(move)} width={w} ring={ring === move} active={move === activePart} onPress={press} reads={reads} onLayout={keep(move)} />;
  };

  return (
    <View style={styles.map} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {drawing && (
        <Animated.View style={[StyleSheet.absoluteFill, entrance(3, "fade")]} pointerEvents="none">
          {drawing}
        </Animated.View>
      )}
      {width > 0 && (
        <>
          <Animated.View style={[styles.row, entrance(0)]} onLayout={keep("top")}>
            {part("supraordinate", middle)}
          </Animated.View>
          <Animated.View style={[styles.row, styles.middle, entrance(1)]} onLayout={keep("middle")}>
            {part("isoordinate", side)}
            <View style={styles.column} onLayout={keep("column")}>
              <Text style={[type.concept, styles.concept, { color: c.onSurface }, sizeFor(concept)]} onLayout={keep("word")} numberOfLines={3} accessibilityRole="header">
                {concept}
              </Text>
            </View>
            {part("exclusion", side)}
          </Animated.View>
          <Animated.View style={[styles.row, styles.bottom, entrance(2)]} onLayout={keep("bottom")}>
            {part("infraordinate", middle)}
          </Animated.View>
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

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A part or a point eases into its new state (amber when asked, warm light when lit) instead of snapping; with
 * Reduce Motion it snaps, as the light itself does. */
const stateEase: CSSTransitionProperties = { transitionProperty: ["backgroundColor", "borderColor"], transitionDuration: motion.lightStep / 2 };
const useStateEase = () => (useReducedMotion() ? null : stateEase);

/** The firefly's dashed amber line, drawn in from the firefly over 320 ms whenever it points somewhere new
 * (`drawKey`), with the dot at the part. With Reduce Motion it is simply there. Goes inside an <Svg>. */
export function Trace({ d, length, end, drawKey, color }: { d: string; length: number; end: Point; drawKey: string; color: string }) {
  const still = useReducedMotion();
  const id = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const drawn = useSharedValue(still ? 1 : 0);
  const run = length + firefly.leader.dot * 2;
  useEffect(() => {
    if (still) {
      drawn.value = 1;
      return;
    }
    drawn.value = 0;
    drawn.value = withTiming(1, { duration: motion.leader, easing: Easing.out(Easing.cubic) });
  }, [drawKey, still, drawn]);
  // the mask is a solid copy of the path, uncovered from the firefly's end
  const reveal = useAnimatedProps(() => ({ strokeDashoffset: run * (1 - drawn.value) }));
  const dot = useAnimatedProps(() => ({ opacity: drawn.value > 0.9 ? 1 : 0 }));
  return (
    <>
      <Defs>
        <Mask id={`${id}-draw`} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
          <AnimatedPath d={d} fill="none" stroke="white" strokeWidth={6} strokeDasharray={`${run} ${run}`} animatedProps={reveal} />
        </Mask>
      </Defs>
      <Path d={d} fill="none" stroke={color} strokeWidth={firefly.leader.width} strokeDasharray={firefly.leader.dash} mask={`url(#${id}-draw)`} />
      <AnimatedCircle cx={end.x} cy={end.y} r={firefly.leader.dot} fill={color} animatedProps={dot} />
    </>
  );
}

type PartProps = { view: PartView; width: number; ring: boolean; active: boolean; onPress?: () => void; reads?: boolean; onLayout: (e: LayoutChangeEvent) => void };

function PartBox({ view, width, ring, active, onPress, reads = false, onLayout }: PartProps) {
  const c = useColors();
  const night = useMode() === "night";
  const ease = useStateEase();
  const { hovered, bind, feel } = usePress();
  const { label, icon } = PARTS[view.move];
  // `hoverEdge` is the edge under a pointer (the web), when the part opens for editing: it firms up within the
  // state's own colour, so the suggested area stays amber and a lit card stays warm, and answers in 150 ms
  // instead of the state's 350
  const look = {
    unasked: { borderWidth: 1, borderStyle: "dashed", borderColor: c.partEdge, hoverEdge: c.onSurfaceVariant, backgroundColor: c.partFill, ink: c.onSurfaceVariant, labelInk: c.onSurfaceVariant, glow: undefined },
    asked: { borderWidth: 1.5, borderStyle: "solid", borderColor: c.questionOutline, hoverEdge: c.question, backgroundColor: c.questionContainer, ink: c.question, labelInk: c.question, glow: "0 0 14px rgba(242, 184, 75, 0.4)" },
    lit: { borderWidth: 1, borderStyle: "solid", borderColor: c.litEdge, hoverEdge: c.litLabel, backgroundColor: c.lit, ink: c.onLit, labelInk: c.litLabel, glow: c.litShadow },
    revealed: { borderWidth: 1, borderStyle: "dashed", borderColor: c.partEdge, hoverEdge: c.onSurfaceVariant, backgroundColor: c.partFill, ink: c.onSurface, labelInk: c.onSurfaceVariant, glow: undefined },
  }[active ? "asked" : view.state];
  const glow = ring ? "0 0 0 3px rgba(242, 184, 75, 0.6), 0 0 22px rgba(255, 236, 205, 0.45)" : look.glow;
  const points = view.pips ? `${view.pips.filter((p) => p === "earned").length} of 2 points` : "not scored yet";
  const said = view.text ?? (view.state === "asked" ? "being asked now" : "not answered yet");
  const narrow = width < 160;
  const pips = view.pips && (
    <View style={styles.pips}>
      {view.pips.map((pip, i) => (
        <PointSquare key={i} pip={pip} dark={view.state === "lit" || !night} />
      ))}
    </View>
  );
  const box = (
    <Animated.View
      style={[
        styles.part,
        ease,
        { width, borderWidth: look.borderWidth, borderStyle: look.borderStyle as "solid" | "dashed", borderColor: look.borderColor, backgroundColor: look.backgroundColor },
        glow ? { boxShadow: glow } : null,
        hovered && onPress ? { borderColor: look.hoverEdge, transitionDuration: motion.hover } : null,
      ]}
      onLayout={onPress ? undefined : onLayout}
      // a part that opens for editing is labeled by its button instead
      accessible={!onPress}
      accessibilityLabel={onPress ? undefined : `${label}: ${said}. ${points}${view.state === "revealed" ? ", shown to you" : ""}.${view.badge ? ` ${view.badge}.` : ""}`}
    >
      <View style={[styles.partHead, narrow && styles.narrowHead]}>
        {narrow ? <View style={styles.partSymbols}><PartIcon d={icon} color={look.labelInk} />{pips}</View> : <PartIcon d={icon} color={look.labelInk} />}
        <Text style={[type.partLabel, styles.partLabel, narrow && styles.narrowLabel, { color: look.labelInk }]}>{onPress && !reads ? `${MOVE_ORDER.indexOf(view.move) + 1} · ${label}` : label}</Text>
        {!narrow && pips}
      </View>
      {view.prompt && <Text style={[type.ui, { color: look.ink }]}>{view.prompt}</Text>}
      {view.context && <Text style={[type.partLabel, { color: look.labelInk }]}>{view.context}</Text>}
      {view.text ? (
        <Text style={[view.state === "revealed" ? type.revealedText : type.partText, { color: look.ink }, view.state === "revealed" && styles.dim]} numberOfLines={5}>
          {view.text}
        </Text>
      ) : !view.prompt ? (
        <Text style={[type.partUnknown, { color: look.ink }]}>?</Text>
      ) : null}
      {/* on the result, a part that moved up a level: the help fades there next time */}
      {view.badge && <Text style={[type.partLabel, styles.badge, { color: look.labelInk }]}>{`↑ ${view.badge}`}</Text>}
      {onPress && !reads && <Text style={[type.partLabel, { color: look.labelInk }]}>{view.text ? "Edit answer" : active ? "Write here →" : "Write answer"}</Text>}
      {ring && <Sparks />}
    </Animated.View>
  );
  if (!onPress) return box;
  return (
    <AnimatedPressable
      onPress={onPress}
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityLabel={`${label}${view.prompt ? `. ${view.prompt}` : ""}${view.context ? `. ${view.context}` : ""}: ${said}${active ? ". Suggested next area" : ""}`}
      accessibilityHint={reads ? "Opens this area to read it in full, with the feedback on it." : "Opens this area to write or edit your answer. Your map is scored when you submit it."}
      {...bind}
      style={feel()}
    >
      {box}
    </AnimatedPressable>
  );
}

/** A point: two per part. Earned is filled; open is an outline; capped is dotted (after a retry or a Help the part
 * can light 1 point at most); claimed is amber (the guess); missed is dashed coral (claimed, not proved). `dark`
 * draws it in dark ink, for a lit part or a lit screen. */
export function PointSquare({ pip, dark, big = false }: { pip: Pip; dark: boolean; big?: boolean }) {
  const c = useColors();
  const ease = useStateEase();
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
    <Animated.View
      style={[
        { width: side, height: side, borderRadius: big ? 3 : radius.point },
        ease,
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
  narrowHead: { flexDirection: "column", alignItems: "stretch", gap: space.xs },
  partSymbols: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  narrowLabel: { flex: 0 },
  partLabel: { flex: 1 },
  badge: { marginTop: 4 },
  pips: { flexDirection: "row", gap: 3 },
  dim: { opacity: 0.8 },
  spark: { position: "absolute", width: 2, height: 10, marginLeft: -1, borderRadius: 1, backgroundColor: firefly.states.asks.body },
});
