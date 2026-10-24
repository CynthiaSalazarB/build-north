import assert from "node:assert/strict";
import { test } from "node:test";
import { versionLineOf, type Running } from "./version.ts";

const phone: Running = {
  name: "Lumente",
  version: "1.0.0",
  web: false,
  updates: true,
  embedded: false,
  createdAt: new Date(2026, 9, 23, 13, 15),
  channel: "preview",
  updateId: "a13043a6-34c8-4e67-a561-912611dc791a",
};

test("a phone on an EAS Update names the update, when it was published and its channel", () => {
  assert.equal(versionLineOf(phone), "Lumente 1.0.0 · update a13043a6 from Oct 23, 1:15 PM · preview");
});

test("the build as installed says no update has been applied yet", () => {
  assert.equal(versionLineOf({ ...phone, embedded: true }), "Lumente 1.0.0 · as installed, no update applied yet");
  assert.equal(versionLineOf({ ...phone, updateId: null }), "Lumente 1.0.0 · as installed, no update applied yet");
});

test("the web and a development build say what they are, and a missing version or date is left out", () => {
  assert.equal(versionLineOf({ ...phone, web: true }), "Lumente 1.0.0 · web build");
  assert.equal(versionLineOf({ ...phone, updates: false }), "Lumente 1.0.0 · development build");
  assert.equal(versionLineOf({ ...phone, version: null, createdAt: null, channel: null }), "Lumente · update a13043a6");
});
