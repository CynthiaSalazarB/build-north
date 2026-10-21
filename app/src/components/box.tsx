// The open box (round 8): 8 corners for the 8 points. Closed, it's the black box of code you can't explain
// yet; on the guess its corners are the points you expect; on the result each face you fully proved turns
// to glass. Drawn from the theme's box geometry, so one drawing serves every palette.
import { useId } from "react";
import Svg, { Circle, Defs, Ellipse, G, Line, Polygon, RadialGradient, Stop } from "react-native-svg";
import type { CornerState } from "../session/present.ts";
import { box, type CornerId } from "../theme.ts";
import { decorative } from "./icons.tsx";
import { useColors } from "./ui.tsx";

const ids = (n: number): CornerId => n as CornerId;
const pts = (...corners: readonly number[]) => corners.map((i) => box.corners[ids(i)].join(",")).join(" ");
const at = (i: number) => box.corners[ids(i)];

type Face = keyof typeof box.faces;
const FACES: readonly Face[] = ["top", "left", "right"];
/** The all-glass box of the guess keeps its shape by shading each face, as the board does. */
const GLASS_SHADE: Record<Face, number> = { top: 0.75, left: 1, right: 0.6 };

/** The closed box's creases: the edges you see between its faces. */
const CREASES = [[4, 3], [3, 2], [3, 7]] as const;
const isHidden = ([a, b]: readonly number[]) => box.hiddenEdges.some(([x, y]) => x === a && y === b);

/** The whole box. `corners` marks every corner (the guess, or the result); without it the box is closed.
 * `alone` are the parts done alone (indices into box.partEdges), whose edges show thick as in the top bar. */
export function OpenBox({ corners, alone = [], width = 180, label }: { corners?: Record<CornerId, CornerState>; alone?: readonly number[]; width?: number; label: string }) {
  const c = useColors();
  const shade = `box-shade-${useId().replace(/:/g, "")}`;
  const closedFill: Record<Face, string> = { top: c.box, left: c.boxDeep, right: c.boxSide };
  // on the guess the whole box is glass; on the result a face turns to glass once all four corners are proved
  const allGlass = !!corners && Object.values(corners).every((s) => s === "expected" || s === "empty");
  const glassFace = (face: Face) => !!corners && box.faces[face].every((i) => corners[ids(i)] === "proved");
  const thick = alone.flatMap((i) => (box.partEdges[i] ? [box.partEdges[i]] : []));
  const edge = ([a, b]: readonly number[], key: string, stroke: string, strokeWidth: number, opacity = 1) => (
    <Line key={key} x1={at(a!)[0]} y1={at(a!)[1]} x2={at(b!)[0]} y2={at(b!)[1]} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
  );
  return (
    <Svg width={width} height={(width * box.height) / box.width} viewBox={`0 0 ${box.width} ${box.height}`} accessibilityRole="image" accessibilityLabel={label}>
      <Defs>
        <RadialGradient id={shade} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#000" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={104} cy={200} rx={88} ry={10} fill={`url(#${shade})`} />
      {corners &&
        box.hiddenEdges.map(([a, b]) => (
          <Line key={`h${a}${b}`} x1={at(a)[0]} y1={at(a)[1]} x2={at(b)[0]} y2={at(b)[1]} stroke={c.glassEdge} strokeWidth={1.5} strokeDasharray="4 4" />
        ))}
      {thick.filter(isHidden).map((e) => edge(e, `t${e}`, c.onSurface, 3))}
      {FACES.map((face) =>
        allGlass ? (
          <Polygon key={face} points={pts(...box.faces[face])} fill={c.glass} opacity={GLASS_SHADE[face]} />
        ) : glassFace(face) ? (
          <Polygon key={face} points={pts(...box.faces[face])} fill={c.glass} stroke={c.glassEdge} strokeWidth={1.8} />
        ) : (
          <Polygon key={face} points={pts(...box.faces[face])} fill={closedFill[face]} />
        ),
      )}
      {allGlass
        ? box.visibleEdges.map((e) => edge(e, `v${e}`, c.glassEdge, 1.8))
        : CREASES.map((e) => edge(e, `c${e}`, c.boxEdge, 1.4, e[1] === 7 ? 0.6 : 1))}
      {thick.filter((e) => !isHidden(e)).map((e) => edge(e, `t${e}`, c.onSurface, 3))}
      {corners && (Object.keys(box.corners) as unknown as CornerId[]).map((i) => <Corner key={i} id={Number(i)} state={corners[ids(Number(i))]} />)}
    </Svg>
  );
}

function Corner({ id, state }: { id: number; state: CornerState }) {
  const c = useColors();
  const [x, y] = at(id);
  switch (state) {
    case "proved":
      return <Circle cx={x} cy={y} r={7} fill={c.onSurface} stroke={c.surface} strokeWidth={3} />;
    case "felt":
      return <Circle cx={x} cy={y} r={7} fill={c.surface} stroke={c.gap} strokeWidth={2.6} />;
    case "expected":
      return <Circle cx={x} cy={y} r={7} fill={c.surface} stroke={c.onSurface} strokeWidth={2.6} />;
    case "empty":
      return <Circle cx={x} cy={y} r={6.5} fill={c.surface} stroke={c.placeholder} strokeWidth={2} strokeDasharray="3 2.5" />;
  }
}

/** The top bar's mini box: part n is one vertical edge, thick when done and dashed while in progress. */
export function MiniBox({ done, now, width = 22 }: { done: number; now: number | null; width?: number }) {
  const c = useColors();
  return (
    <Svg width={width} height={(width * box.height) / box.width} viewBox={`0 0 ${box.width} ${box.height}`} {...decorative}>
      <G fill="none" strokeLinecap="round">
        {box.visibleEdges.map(([a, b]) => (
          <Line key={`v${a}${b}`} x1={at(a)[0]} y1={at(a)[1]} x2={at(b)[0]} y2={at(b)[1]} stroke={c.outline} strokeWidth={8} />
        ))}
        {box.partEdges.map(([a, b], i) =>
          i < done ? (
            <Line key={`p${i}`} x1={at(a)[0]} y1={at(a)[1]} x2={at(b)[0]} y2={at(b)[1]} stroke={c.onSurface} strokeWidth={14} />
          ) : i === now ? (
            <Line key={`p${i}`} x1={at(a)[0]} y1={at(a)[1]} x2={at(b)[0]} y2={at(b)[1]} stroke={c.primary} strokeWidth={10} strokeDasharray="14 12" />
          ) : null,
        )}
      </G>
    </Svg>
  );
}
