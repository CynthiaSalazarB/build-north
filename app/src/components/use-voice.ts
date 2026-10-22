// Speech to text for one field: the module's events drive voice.ts's state, and the heard words go to the
// field through `onText` while listening. One phrase at a time (no continuous mode: Android 12 lacks it), the
// device's language, interim results so the learner sees the words land. Nothing here sends anything.
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useCallback, useEffect, useId, useReducer, useRef } from "react";
import { Linking, Platform } from "react-native";
import { tick } from "../haptics.ts";
import { voiceReducer, withHeard, type VoiceState } from "./voice.ts";

/** Checked once: the web has it only where the browser implements the Web Speech API (Chrome, Safari). */
const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();

/** The module has one recognizer and one stream of events, and more than one field can carry a mic (the answer,
 * a level-5 question, a part in its editor). Only the field whose mic started the recognizer reads its events. */
let owner: string | null = null;

type Field = { text: string; onText: (text: string) => void };

export function useVoice({ text, onText }: Field): { state: VoiceState; toggle: () => void } {
  const me = useId();
  const [state, dispatch] = useReducer(voiceReducer, available ? { kind: "idle" } : { kind: "unsupported" });
  const field = useRef({ text, onText });
  useEffect(() => {
    field.current = { text, onText };
  }, [text, onText]);
  // the field's text when listening started: each interim result replaces the last one after it, not adds to it
  const typedAt = useRef("");
  const mine = () => owner === me;
  const release = () => {
    if (mine()) owner = null;
  };

  useSpeechRecognitionEvent("start", () => {
    if (mine()) dispatch({ type: "start" });
  });
  useSpeechRecognitionEvent("result", (event) => {
    if (!mine()) return;
    const heard = event.results[0]?.transcript ?? "";
    field.current.onText(withHeard(typedAt.current, heard));
    dispatch({ type: event.isFinal ? "final" : "interim", text: heard });
  });
  useSpeechRecognitionEvent("error", (event) => {
    if (!mine()) return;
    release();
    dispatch({ type: "error", code: event.error });
  });
  useSpeechRecognitionEvent("end", () => {
    if (!mine()) return;
    release();
    dispatch({ type: "end" });
  });

  // a field that goes away while its mic is on (the part editor closing) takes the recognizer down with it
  useEffect(
    () => () => {
      if (owner !== me) return;
      owner = null;
      ExpoSpeechRecognitionModule.abort();
    },
    [me],
  );

  const toggle = useCallback(() => {
    if (state.kind === "unsupported") return;
    if (state.kind === "listening") {
      tick();
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    if (state.kind === "denied" && !state.canAskAgain && Platform.OS !== "web") {
      void Linking.openSettings();
      return;
    }
    void (async () => {
      // the web has no permission call: the browser asks at start(), and a refusal arrives as the not-allowed
      // error (docs/expo-log.md, Oct 22); the module's own web stub only logs a warning
      const permission = Platform.OS === "web" ? { granted: true, canAskAgain: true } : await ExpoSpeechRecognitionModule.requestPermissionsAsync().catch(() => null);
      if (!permission?.granted) {
        dispatch({ type: "denied", canAskAgain: permission?.canAskAgain ?? true });
        return;
      }
      // another field's mic still on: it stops, and this one takes over
      if (owner && owner !== me) ExpoSpeechRecognitionModule.abort();
      owner = me;
      typedAt.current = field.current.text;
      try {
        ExpoSpeechRecognitionModule.start({ interimResults: true, continuous: false, maxAlternatives: 1 });
        tick();
      } catch {
        owner = null;
        dispatch({ type: "error", code: "client" });
      }
    })();
  }, [state, me]);

  return { state, toggle };
}
