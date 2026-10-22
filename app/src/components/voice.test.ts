import assert from "node:assert/strict";
import { test } from "node:test";
import { errorWords, voiceLabel, voiceReducer, withHeard, type VoiceState } from "./voice.ts";

const idle: VoiceState = { kind: "idle" };

test("start listens, interim text lands in the state, final and end go back to idle", () => {
  const listening = voiceReducer(idle, { type: "start" });
  assert.deepEqual(listening, { kind: "listening", interim: "" });
  const heard = voiceReducer(listening, { type: "interim", text: "a kind of" });
  assert.deepEqual(heard, { kind: "listening", interim: "a kind of" });
  assert.deepEqual(voiceReducer(heard, { type: "final", text: "a kind of security feature" }), idle);
  assert.deepEqual(voiceReducer(heard, { type: "end" }), idle);
});

test("interim, final and end outside listening change nothing", () => {
  assert.deepEqual(voiceReducer(idle, { type: "interim", text: "x" }), idle);
  assert.deepEqual(voiceReducer(idle, { type: "end" }), idle);
  const denied: VoiceState = { kind: "denied", canAskAgain: true };
  assert.deepEqual(voiceReducer(denied, { type: "final", text: "x" }), denied);
});

test("a refusal is denied, whether it comes from the permission call or as the not-allowed error", () => {
  assert.deepEqual(voiceReducer(idle, { type: "denied", canAskAgain: false }), { kind: "denied", canAskAgain: false });
  assert.deepEqual(voiceReducer({ kind: "listening", interim: "" }, { type: "error", code: "not-allowed" }), { kind: "denied", canAskAgain: true });
});

test("other errors keep their code, and a new start clears them", () => {
  const failed = voiceReducer({ kind: "listening", interim: "so" }, { type: "error", code: "network" });
  assert.deepEqual(failed, { kind: "error", code: "network" });
  assert.deepEqual(voiceReducer(failed, { type: "start" }), { kind: "listening", interim: "" });
});

test("unsupported is final", () => {
  const none = voiceReducer(idle, { type: "unavailable" });
  assert.deepEqual(none, { kind: "unsupported" });
  assert.deepEqual(voiceReducer(none, { type: "start" }), none);
});

test("heard words go after what was typed, and empty hearings change nothing", () => {
  assert.equal(withHeard("", "a browser rule"), "a browser rule");
  assert.equal(withHeard("CORS is ", "a browser rule"), "CORS is a browser rule");
  assert.equal(withHeard("CORS is", "  "), "CORS is");
});

test("labels say what the tap does, and the hint names the way out", () => {
  assert.equal(voiceLabel(idle).label, "Speak your answer");
  assert.equal(voiceLabel({ kind: "listening", interim: "" }).label, "Stop listening");
  assert.match(voiceLabel({ kind: "denied", canAskAgain: false }).label, /Settings/);
  assert.match(voiceLabel({ kind: "error", code: "network" }).hint ?? "", /no connection/);
  assert.equal(voiceLabel({ kind: "unsupported" }).hint, undefined);
});

test("every error code has plain words", () => {
  for (const code of ["no-speech", "speech-timeout", "network", "audio-capture", "service-not-allowed", "language-not-supported", "busy", "aborted", "client", "unknown"]) {
    assert.ok(errorWords(code).length > 0 && !errorWords(code).includes("-"), code);
  }
});
