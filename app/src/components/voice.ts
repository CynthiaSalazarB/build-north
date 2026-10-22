// Voice input's state, pure: the mic button and the field read it, the hook (use-voice.ts) drives it from
// the speech module's events. The transcript is text in the learner's field, editable, never sent by itself.

export type VoiceState =
  | { kind: "unsupported" }
  | { kind: "idle" }
  | { kind: "listening"; interim: string }
  | { kind: "denied"; canAskAgain: boolean }
  | { kind: "error"; code: string };

export type VoiceEvent =
  | { type: "unavailable" }
  | { type: "start" }
  | { type: "interim"; text: string }
  | { type: "final"; text: string }
  | { type: "end" }
  | { type: "denied"; canAskAgain: boolean }
  | { type: "error"; code: string };

/** Permission refusals come as an error on the web (its permission call is a no-op) and on Android alike. */
const DENIED_CODE = "not-allowed";

export function voiceReducer(state: VoiceState, event: VoiceEvent): VoiceState {
  if (state.kind === "unsupported") return state;
  switch (event.type) {
    case "unavailable":
      return { kind: "unsupported" };
    case "start":
      return { kind: "listening", interim: "" };
    case "interim":
      return state.kind === "listening" ? { kind: "listening", interim: event.text } : state;
    case "final":
    case "end":
      return state.kind === "listening" ? { kind: "idle" } : state;
    case "denied":
      return { kind: "denied", canAskAgain: event.canAskAgain };
    case "error":
      return event.code === DENIED_CODE ? { kind: "denied", canAskAgain: true } : { kind: "error", code: event.code };
  }
}

/** The words the learner had typed stay; what was heard goes after them, on the same line. */
export function withHeard(typed: string, heard: string): string {
  const base = typed.trimEnd();
  const words = heard.trim();
  if (!words) return typed;
  return base ? `${base} ${words}` : words;
}

const HEARD = "Your words appear in the field. Nothing is sent until you tap Send.";

/** The mic button's accessibility label, and its hint when there is something to know. On the web a refusal
 * is the browser's, so the way out is the site's permission, not the app's settings. */
export function voiceLabel(state: VoiceState, web = false): { label: string; hint?: string } {
  switch (state.kind) {
    case "listening":
      return { label: "Stop listening", hint: HEARD };
    case "denied":
      if (web) return { label: "Speak your answer", hint: "The microphone was refused. Allow it for this site in the address bar, then tap again." };
      return state.canAskAgain
        ? { label: "Speak your answer", hint: "The microphone was refused. Tap to ask again." }
        : { label: "Allow the microphone in Settings", hint: "Opens this app's settings, where the microphone can be allowed." };
    case "error":
      return { label: "Speak your answer", hint: `Listening stopped (${errorWords(state.code)}). Tap to try again.` };
    case "idle":
      return { label: "Speak your answer", hint: HEARD };
    case "unsupported":
      return { label: "Speech recognition is not available here" };
  }
}

/** Plain words for the speech module's error codes (the Web Speech API's names). */
export function errorWords(code: string): string {
  switch (code) {
    case "no-speech":
    case "speech-timeout":
      return "no speech was heard";
    case "network":
      return "no connection to the speech service";
    case "audio-capture":
      return "the microphone could not record";
    case "service-not-allowed":
    case "language-not-supported":
      return "no speech service for this language";
    case "busy":
      return "the speech service is busy";
    case "interrupted":
      return "something else took the microphone";
    case "aborted":
      return "stopped";
    default:
      return "something went wrong";
  }
}
