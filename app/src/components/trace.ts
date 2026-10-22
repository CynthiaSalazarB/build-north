// The firefly's line in the website layout: from the firefly beside the question, across the gap, to the part it
// asks about. It runs like a trace on the graph paper, straight runs with rounded corners, so it never crosses
// another part. Pure geometry (trace.test.ts).

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

/** How the trace reaches a part: a part with nothing to its left (the bigger group, what it needs, the types) is
 * entered from the left at its middle; what it isn't, right of the concept, from above, along the space over the
 * map. `gutter` is the x of the run down the gap; `above` the y of the run over the map. */
export function tracePoints(from: Point, part: Box, enter: "left" | "top", { gutter, above }: { gutter: number; above: number }): Point[] {
  if (enter === "left") {
    const y = part.y + part.h / 2;
    return [from, { x: gutter, y: from.y }, { x: gutter, y }, { x: part.x, y }];
  }
  const x = part.x + part.w / 2;
  return [from, { x: gutter, y: from.y }, { x: gutter, y: above }, { x, y: above }, { x, y: part.y }];
}

const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
const toward = (from: Point, to: Point, by: number): Point => {
  const d = dist(from, to);
  return d === 0 ? from : { x: from.x + ((to.x - from.x) * by) / d, y: from.y + ((to.y - from.y) * by) / d };
};
const round = (n: number) => Math.round(n * 10) / 10;

/** Drops runs shorter than a pixel and corners that aren't corners (three points in a line). */
function simplify(points: Point[]): Point[] {
  const kept: Point[] = [];
  for (const p of points) if (!kept.length || dist(kept[kept.length - 1]!, p) >= 1) kept.push(p);
  return kept.filter((p, i) => {
    const a = kept[i - 1];
    const b = kept[i + 1];
    return !a || !b || !((a.x === p.x && p.x === b.x) || (a.y === p.y && p.y === b.y));
  });
}

/** An SVG path through the points with each corner rounded (radius `r`, less where a run is short), and its
 * length, for drawing it in. A rounded corner's quadratic curve is about 1.62 times its radius long. */
export function roundedPath(points: Point[], r = 10): { d: string; length: number } {
  const pts = simplify(points);
  if (pts.length < 2) return { d: "", length: 0 };
  let cursor = pts[0]!;
  let d = `M${round(cursor.x)} ${round(cursor.y)}`;
  let length = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, p, b] = [pts[i - 1]!, pts[i]!, pts[i + 1]!];
    const k = Math.min(r, dist(a, p) / 2, dist(p, b) / 2);
    const enter = toward(p, a, k);
    const leave = toward(p, b, k);
    d += ` L${round(enter.x)} ${round(enter.y)} Q${round(p.x)} ${round(p.y)} ${round(leave.x)} ${round(leave.y)}`;
    length += dist(cursor, enter) + 1.62 * k;
    cursor = leave;
  }
  const last = pts[pts.length - 1]!;
  d += ` L${round(last.x)} ${round(last.y)}`;
  return { d, length: length + dist(cursor, last) };
}
