// The firefly (round 9 "Lumente"): the tutor that asks, and Help. It shines steadily, never blinks or pulses, and
// never reacts to the score. "asks" sits by each question, "helps" is closer and brighter once Help is tapped, and
// "fades" is barely there on the result, where the learner's own light fills the screen. Its light does answer the
// learner: under a finger or a pointer the halo spreads and the body warms (an asking firefly takes the "helps"
// look, a fading one wakes to "asks"), eased in over 150 ms and back out, and on the web the glow leans a little
// toward the pointer. Nothing moves on its own; with Reduce Motion the light still changes between the two looks,
// instantly, and never leans.
import { useEffect, useId, useState } from "react";
import { StyleSheet, type PointerEvent } from "react-native";
import Animated, { Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from "react-native-svg";
import { firefly, isWeb, motion } from "../theme.ts";
import { decorative } from "./icons.tsx";

export type FireflyState = keyof typeof firefly.states;

/** The halo reaches this far past the firefly's box on each side (the board's -18 px at 40 px, -30 px at 48 px). */
const haloReach = (state: FireflyState, size: number) => (state === "helps" ? size * 0.625 : state === "asks" ? size * 0.45 : 0);

/** The light under a finger or a pointer: a firefly that asks takes the "helps" look (its halo and its body); one
 * that already helps spreads its halo a little further; a fading one (level 5, the result) wakes to the "asks" look
 * and fades again when the finger leaves. */
function litLook(state: FireflyState, size: number): { halo: number; reach: number; body: string; opacity: number } {
  const { asks, helps } = firefly.states;
  if (state === "asks") return { halo: helps.halo, reach: haloReach("helps", size), body: helps.body, opacity: asks.opacity };
  if (state === "helps") return { halo: Math.min(1, helps.halo + 0.12), reach: haloReach("helps", size) * 1.12, body: helps.body, opacity: helps.opacity };
  return { halo: asks.halo, reach: haloReach("asks", size), body: asks.body, opacity: asks.opacity };
}

/** How far the glow leans toward the pointer at the firefly's edge, as a share of its size (4 px at 40 px). */
const LEAN = 0.1;

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

/** The firefly's box on the page, from the pointer event's element; null where the platform gives none. */
function rectOf(e: PointerEvent): { left: number; top: number; width: number; height: number } | null {
  const target = e.currentTarget as unknown as { getBoundingClientRect?: () => { left: number; top: number; width: number; height: number } } | null;
  return typeof target?.getBoundingClientRect === "function" ? target.getBoundingClientRect() : null;
}

type Props = {
  state?: FireflyState;
  size?: number;
  /** The control around the firefly is pressed or hovered (Help): its light answers. On the web the firefly also
   * feels the pointer over its own box. */
  glow?: boolean;
};

export function Firefly({ state = "asks", size, glow = false }: Props) {
  const look = firefly.states[state];
  const s = size ?? look.size;
  const reach = haloReach(state, s);
  const lit = litLook(state, s);
  const still = useReducedMotion();
  const id = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const [hover, setHover] = useState(false);
  const on = glow || hover;

  // 0 at rest, 1 lit; the halo and the warm body follow it on the UI thread
  const g = useSharedValue(0);
  const leanX = useSharedValue(0);
  const leanY = useSharedValue(0);
  useEffect(() => {
    const to = on ? 1 : 0;
    g.value = still ? to : withTiming(to, { duration: motion.hover, easing: Easing.out(Easing.quad) });
  }, [on, still, g]);
  const settle = (x: number, y: number) => {
    leanX.value = withTiming(x, { duration: motion.hover });
    leanY.value = withTiming(y, { duration: motion.hover });
  };

  // the halo is drawn at its lit size and opacity, and scaled and dimmed down to its resting look, so it never
  // blurs on the way up; a fading firefly's rests at nothing and comes up whole
  const haloReachMax = lit.reach;
  const haloOpacity = lit.halo;
  const box = s + haloReachMax * 2;
  const restScale = (s + reach * 2) / box;
  const restOpacity = look.halo / haloOpacity;
  const wholeStyle = useAnimatedStyle(() => ({ opacity: interpolate(g.value, [0, 1], [look.opacity, lit.opacity]) }), [look.opacity, lit.opacity]);
  const haloStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(g.value, [0, 1], [restOpacity, 1]),
      transform: [{ translateX: leanX.value }, { translateY: leanY.value }, { scale: interpolate(g.value, [0, 1], [restScale, 1]) }],
    }),
    [restOpacity, restScale],
  );
  const warmStyle = useAnimatedStyle(() => ({ opacity: g.value }));

  // the web's pointer: enter and leave light the firefly, and a move leans the glow toward the pointer (not with
  // Reduce Motion). Phones have no pointer; a finger comes through `glow`.
  const pointer =
    isWeb
      ? {
          onPointerEnter: () => setHover(true),
          onPointerLeave: () => {
            setHover(false);
            settle(0, 0);
          },
          onPointerMove: (e: PointerEvent) => {
            if (still) return;
            const rect = rectOf(e);
            if (!rect) return;
            const dx = (e.nativeEvent.clientX - (rect.left + rect.width / 2)) / Math.max(rect.width / 2, 1);
            const dy = (e.nativeEvent.clientY - (rect.top + rect.height / 2)) / Math.max(rect.height / 2, 1);
            settle(clamp(dx) * s * LEAN, clamp(dy) * s * LEAN);
          },
        }
      : {};

  const scale = `scale(${s / 56})`;
  const eyes = firefly.eyes.map((e) => <Circle key={e.cx} cx={e.cx} cy={e.cy} r={e.r} fill={firefly.eye} />);

  return (
    <Animated.View style={[{ width: s, height: s }, wholeStyle]} {...decorative} {...pointer}>
      <Animated.View style={[styles.layer, { left: -haloReachMax, top: -haloReachMax, width: box, height: box }, haloStyle]} pointerEvents="none">
        <Svg width={box} height={box} {...decorative}>
          <Defs>
            <RadialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={firefly.states.asks.body} stopOpacity={haloOpacity} />
              <Stop offset="1" stopColor={firefly.states.asks.body} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={box / 2} cy={box / 2} r={box / 2} fill={`url(#${id}-halo)`} />
        </Svg>
      </Animated.View>
      <Svg width={s} height={s} {...decorative}>
        <G transform={scale}>
          {firefly.wings.map((w) => (
            <Ellipse key={w.cx} cx={w.cx} cy={w.cy} rx={w.rx} ry={w.ry} transform={`rotate(${w.rotate} ${w.cx} ${w.cy})`} fill={firefly.wing} />
          ))}
          <Path d={firefly.antennae} stroke={firefly.antenna} strokeWidth={1.6} strokeLinecap="round" />
          <Circle cx={firefly.body.cx} cy={firefly.body.cy} r={firefly.body.r} fill={look.body} />
          {eyes}
        </G>
      </Svg>
      {/* the warmer body fades in over the resting one; the eyes come with it, so they stay on top */}
      {lit.body !== look.body && (
        <Animated.View style={[StyleSheet.absoluteFill, warmStyle]} pointerEvents="none">
          <Svg width={s} height={s} {...decorative}>
            <G transform={scale}>
              <Circle cx={firefly.body.cx} cy={firefly.body.cy} r={firefly.body.r} fill={lit.body} />
              {eyes}
            </G>
          </Svg>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { position: "absolute" },
});
