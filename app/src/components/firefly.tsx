// The firefly (round 9 "Lumente"): the tutor that asks, and Help. It shines steadily, never blinks or pulses, and
// never reacts to the score. "asks" sits by each question, "helps" is closer and brighter once Help is tapped, and
// "fades" is barely there on the result, where the learner's own light fills the screen.
import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from "react-native-svg";
import { firefly } from "../theme.ts";
import { decorative } from "./icons.tsx";

export type FireflyState = keyof typeof firefly.states;

/** The halo reaches this far past the firefly's box on each side (the board's -18 px at 40 px, -30 px at 48 px). */
const haloReach = (state: FireflyState, size: number) => (state === "helps" ? size * 0.625 : state === "asks" ? size * 0.45 : 0);

export function Firefly({ state = "asks", size }: { state?: FireflyState; size?: number }) {
  const look = firefly.states[state];
  const s = size ?? look.size;
  const reach = haloReach(state, s);
  const box = s + reach * 2;
  const id = useId().replace(/[^A-Za-z0-9_-]/g, "");
  return (
    <View style={{ width: s, height: s, opacity: look.opacity }} {...decorative}>
      <Svg width={box} height={box} style={[styles.drawing, { left: -reach, top: -reach }]} {...decorative}>
        {look.halo > 0 && (
          <>
            <Defs>
              <RadialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="rgb(242, 184, 75)" stopOpacity={look.halo} />
                <Stop offset="1" stopColor="rgb(242, 184, 75)" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={box / 2} cy={box / 2} r={box / 2} fill={`url(#${id}-halo)`} />
          </>
        )}
        <G transform={`translate(${reach} ${reach}) scale(${s / 56})`}>
          {firefly.wings.map((w) => (
            <Ellipse key={w.cx} cx={w.cx} cy={w.cy} rx={w.rx} ry={w.ry} transform={`rotate(${w.rotate} ${w.cx} ${w.cy})`} fill={firefly.wing} />
          ))}
          <Path d={firefly.antennae} stroke={firefly.antenna} strokeWidth={1.6} strokeLinecap="round" />
          <Circle cx={firefly.body.cx} cy={firefly.body.cy} r={firefly.body.r} fill={look.body} />
          {firefly.eyes.map((e) => (
            <Circle key={e.cx} cx={e.cx} cy={e.cy} r={e.r} fill={firefly.eye} />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  drawing: { position: "absolute" },
});
