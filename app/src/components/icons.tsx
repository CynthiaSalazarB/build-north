// The app's icons (round 8): one 24-unit line set from the board's symbols, all drawn at the same stroke.
import { Platform } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

/** For a drawing the screen reader skips (the control around it carries the label). On the web it's
 * aria-hidden, since an <svg> element has no `accessible` attribute and React warns about it. */
export const decorative = Platform.select({ web: { "aria-hidden": true } as const, default: { accessible: false } as const });

export type IconName = "x" | "up" | "plus" | "minus" | "check" | "bulb" | "alert";

const PATHS: Record<Exclude<IconName, "alert">, string> = {
  x: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  up: "M12 19V5M5.5 11.5 12 5l6.5 6.5",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  bulb: "M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.7 10.7c.8.7 1.2 1.4 1.2 2.3h5c0-.9.4-1.6 1.2-2.3A6 6 0 0 0 12 3z",
};

/** A 24-unit icon. Decorative: the control around it carries the label. */
export function Icon({ name, color, size = 22 }: { name: IconName; color: string; size?: number }) {
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
