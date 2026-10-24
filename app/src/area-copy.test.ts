import assert from "node:assert/strict";
import { test } from "node:test";
import { MOVE_LABEL, MOVE_ORDER } from "@build-north/agents";
import { AREA_LABEL, areaCopyOf, areaNoteOf } from "./area-copy.ts";

test("one vocabulary names all four map areas without changing the server labels or move IDs", () => {
  assert.deepEqual(MOVE_ORDER.map(move => AREA_LABEL[move]), ["Category", "Similar concepts & differences", "Defining features", "Classification"]);
  assert.equal(MOVE_LABEL.supraordinate, "Bigger group");
});

test("notes from current or older sessions resolve to the same area and keep the original feedback", () => {
  for (const move of MOVE_ORDER) {
    for (const label of [MOVE_LABEL[move], AREA_LABEL[move]]) {
      assert.deepEqual(areaNoteOf(`${label}: Keep my 'what it needs' wording.\nNext line.`), { move, text: "Keep my 'what it needs' wording.\nNext line." });
    }
  }
  assert.equal(areaNoteOf("A normal question: how are they different?"), null);
  assert.equal(areaNoteOf("Category: "), null);
});

test("old tutor and memory references display current area names, including smart quotes and headings", () => {
  assert.equal(areaCopyOf("'Bigger group' and ‘What it needs’ are next. “What it isn't” differs from 'Its types'."), "'Category' and ‘Defining features’ are next. “Similar concepts & differences” differs from 'Classification'.");
  assert.equal(areaCopyOf("Bigger group: one\nWhat it needs: two\nWhat it isn't: three\nIts types: four"), "Category: one\nDefining features: two\nSimilar concepts & differences: three\nClassification: four");
  assert.equal(areaCopyOf("What bigger group does it belong to? Defensible bigger groups can differ."), "What category does it belong to? Defensible categories can differ.");
});

test("natural instructions, code and non-label uses of types keep their meaning", () => {
  assert.equal(areaCopyOf("Explain what it needs to do, then name at least two types using the same rule."), "Explain what it needs to do, then name at least two types using the same rule.");
  assert.equal(areaCopyOf("Use `bigger group` and ```What it needs: unchanged``` for this example."), "Use `bigger group` and ```What it needs: unchanged``` for this example.");
});
