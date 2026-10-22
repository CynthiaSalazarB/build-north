// The app's icons (round 9 "Lumente"): one 24-unit line set, all drawn at the same stroke, plus the map's
// four part icons from the theme.
import { Platform } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

/** For a drawing the screen reader skips (the control around it carries the label). On the web it's
 * aria-hidden, since an <svg> element has no `accessible` attribute and React warns about it. */
export const decorative = Platform.select({ web: { "aria-hidden": true } as const, default: { accessible: false } as const });

export type IconName = "x" | "up" | "plus" | "minus" | "check" | "alert";

const PATHS: Record<Exclude<IconName, "alert">, string> = {
  x: "M6 6l12 12M18 6L6 18",
  up: "M12 19V5M6 11l6-6 6 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
};

/** A 24-unit icon. Decorative: the control around it carries the label. */
export function Icon({ name, color, size = 18 }: { name: IconName; color: string; size?: number }) {
  const stroke = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...decorative}>
      {name === "alert" ? (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} strokeWidth={1.8} />
          <Path d="M12 7.5v5.5" {...stroke} />
          <Circle cx={12} cy={16.3} r={1.2} fill={color} />
        </>
      ) : (
        <Path d={PATHS[name]} {...stroke} />
      )}
    </Svg>
  );
}

/** A part's icon on the map (13 px, from theme.parts). */
export function PartIcon({ d, color, size = 13 }: { d: string; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...decorative}>
      <Path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
