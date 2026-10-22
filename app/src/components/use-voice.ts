// Speech to text for one field: the module's events drive voice.ts's state, and the heard words go to the
// field through `onText` while listening. One phrase at a time (no continuous mode: Android 12 lacks it), the
// device's language, interim results so the learner sees the words land. Nothing here sends anything.
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { Linking } from "react-native";
import { tick } from "../haptics.ts";
import { voiceReducer, withHeard, type VoiceState } from "./voice.ts";

/** Checked once: the web has it only where the browser implements the Web Speech API (Chrome, Safari). */
const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();

type Field = { text: string; onText: (text: string) => void };

export function useVoice({ text, onText }: Field): { state: VoiceState; toggle: () => void } {
  const [state, dispatch] = useReducer(voiceReducer, available ? { kind: "idle" } : { kind: "unsupported" });
  const field = useRef({ text, onText });
  useEffect(() => {
    field.current = { text, onText };
  }, [text, onText]);
  // the field's text when listening started: each interim result replaces the last one after it, not adds to it
  const typedAt = useRef("");

  useSpeechRecognitionEvent("start", () => dispatch({ type: "start" }));
  useSpeechRecognitionEvent("result", (event) => {
    const heard = event.results[0]?.transcript ?? "";
    field.current.onText(withHeard(typedAt.current, heard));
    dispatch({ type: event.isFinal ? "final" : "interim", text: heard });
  });
  useSpeechRecognitionEvent("error", (event) => dispatch({ type: "error", code: event.error }));
  useSpeechRecognitionEvent("end", () => dispatch({ type: "end" }));

  const toggle = useCallback(() => {
    if (state.kind === "unsupported") return;
    if (state.kind === "listening") {
      tick();
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    if (state.kind === "denied" && !state.canAskAgain) {
      void Linking.openSettings();
      return;
    }
    void (async () => {
      // on the web this answers granted without asking; the browser asks at start(), and a refusal arrives
      // as the not-allowed error (docs/expo-log.md, Oct 22)
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        dispatch({ type: "denied", canAskAgain: permission.canAskAgain });
        return;
      }
      typedAt.current = field.current.text;
      tick();
      ExpoSpeechRecognitionModule.start({ interimResults: true, continuous: false, maxAlternatives: 1 });
    })();
  }, [state]);

  return { state, toggle };
}
