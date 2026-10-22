// The light behind every screen (round 9 "Lumente"): near-black, a warm light from the top-right corner that
// grows one stage per point proved, and a faint graph-paper grid. Drawn with react-native-svg, so Android and the
// web look the same and no native module is added. A new stage crossfades in over 700 ms; with Reduce Motion
// on it just changes, since the light is the score.
import { useEffect, useId, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { base, grid, lightFor, lightReachMax, motion, palette, type LightStage } from "../theme.ts";
import { decorative } from "./icons.tsx";

/** An SVG stop takes its color and its opacity apart: "rgba(255, 210, 150, 0.5)" or "#fff4e0". */
function stopOf(color: string): { color: string; opacity: number } {
  const rgba = /^rgba\(([^)]+)\)$/.exec(color);
  if (!rgba) return { color, opacity: 1 };
  const [r, g, b, a] = rgba[1]!.split(",").map((part) => part.trim());
  return { color: `rgb(${r}, ${g}, ${b})`, opacity: Number(a) };
}

/** One family of grid lines, 1 px wide, every `step` px from the grid's offset. */
function gridPath(width: number, height: number, step: number): string {
  let d = "";
  for (let x = grid.offset.x % step; x < width; x += step) d += `M${x + 0.5} 0V${height}`;
  for (let y = grid.offset.y % step; y < height; y += step) d += `M0 ${y + 0.5}H${width}`;
  return d;
}

function Stage({ stage, width, height }: { stage: LightStage; width: number; height: number }) {
  // ids are global on the web, and the screen under this one draws a light too
  const id = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const colors = palette[stage.mode];
  // CSS's "circle at 100% 0%" reaches the farthest corner, so the stops are percent of the diagonal (capped)
  const reach = Math.min(Math.hypot(width, height), lightReachMax);
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} {...decorative}>
      <Defs>
        <LinearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={base.top} />
          <Stop offset="1" stopColor={base.bottom} />
        </LinearGradient>
        <RadialGradient id={`${id}-glow`} cx={width} cy={0} fx={width} fy={0} r={reach} gradientUnits="userSpaceOnUse">
          {stage.stops.map(([color, at]) => {
            const stop = stopOf(color);
            return <Stop key={at} offset={at / 100} stopColor={stop.color} stopOpacity={stop.opacity} />;
          })}
        </RadialGradient>
      </Defs>
      {stage.mode === "night" && <Rect width={width} height={height} fill={`url(#${id}-base)`} />}
      <Rect width={width} height={height} fill={`url(#${id}-glow)`} />
      <Path d={gridPath(width, height, grid.minor)} stroke={colors.gridMinor} strokeWidth={1} fill="none" />
      <Path d={gridPath(width, height, grid.major)} stroke={colors.gridMajor} strokeWidth={1} fill="none" />
    </Svg>
  );
}

/** A designed stage, or two blended: the second drawn over the first at `mix`. Both layers are opaque, so the
 *  result is a mix of two backgrounds that each passed the contrast check. */
function Layers({ stage, width, height }: { stage: LightStage; width: number; height: number }) {
  return (
    <>
      <Stage stage={stage} width={width} height={height} />
      {stage.over && (
        <View style={[StyleSheet.absoluteFill, { opacity: stage.over.mix }]}>
          <Stage stage={{ ...stage, stops: stage.over.stops }} width={width} height={height} />
        </View>
      )}
    </>
  );
}

/** Fills its parent, under everything else. `points` is the stage: 0 to 8. */
export function Light({ points }: { points: number }) {
  const stage = lightFor(points);
  const still = useReducedMotion();
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [under, setUnder] = useState<LightStage | null>(null);
  const shown = useRef(stage);
  const fade = useSharedValue(1);

  useEffect(() => {
    if (shown.current === stage) return;
    const before = shown.current;
    shown.current = stage;
    if (still) return;
    setUnder(before);
    fade.value = 0;
    fade.value = withTiming(1, { duration: motion.lightStep, easing: Easing.out(Easing.quad) });
    const done = setTimeout(() => setUnder(null), motion.lightStep + 50);
    return () => clearTimeout(done);
  }, [stage, still, fade]);

  const over = useAnimatedStyle(() => ({ opacity: fade.value }));
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: stage.mode === "night" ? base.bottom : palette.day.surface }]}
      pointerEvents="none"
      onLayout={(e) => setBox({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {box.width > 0 && (
        <>
          {under && <Layers stage={under} {...box} />}
          <Animated.View style={[StyleSheet.absoluteFill, over]}>
            <Layers stage={stage} {...box} />
          </Animated.View>
        </>
      )}
    </View>
  );
}
