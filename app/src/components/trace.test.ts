import assert from "node:assert/strict";
import { test } from "node:test";
import { roundedPath, tracePoints } from "./trace.ts";

const part = { x: 600, y: 300, w: 200, h: 80 };

test("a part entered from the left: across, down the gutter, into its middle", () => {
  const points = tracePoints({ x: 500, y: 100 }, part, "left", { gutter: 560, above: 260 });
  assert.deepEqual(points, [
    { x: 500, y: 100 },
    { x: 560, y: 100 },
    { x: 560, y: 340 },
    { x: 600, y: 340 },
  ]);
});

test("what it isn't is entered from above, over the map", () => {
  const points = tracePoints({ x: 500, y: 100 }, part, "top", { gutter: 560, above: 260 });
  assert.deepEqual(points.at(-2), { x: 700, y: 260 });
  assert.deepEqual(points.at(-1), { x: 700, y: 300 });
});

test("corners are rounded, and the length counts the runs and the curves", () => {
  const { d, length } = roundedPath([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
  ]);
  assert.equal(d, "M0 0 L90 0 Q100 0 100 10 L100 100");
  assert.ok(Math.abs(length - (90 + 16.2 + 90)) < 0.01);
});

test("a run shorter than a pixel and a straight-through point are dropped", () => {
  const { d, length } = roundedPath([
    { x: 0, y: 50 },
    { x: 40, y: 50 },
    { x: 40, y: 50.4 },
    { x: 100, y: 50 },
  ]);
  assert.equal(d, "M0 50 L100 50");
  assert.equal(length, 100);
});

test("a short run gets a smaller corner, so curves never overlap", () => {
  const { d } = roundedPath([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 100 },
  ]);
  assert.match(d, /^M0 0 L4 0 Q8 0 8 4 /);
});
