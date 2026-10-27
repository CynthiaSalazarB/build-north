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

export function useVoice({ text, onText }: Field): { state: VoiceState; toggle: () => void; cancel: () => void } {
  const me = useId();
  const [state, dispatch] = useReducer(voiceReducer, available ? { kind: "idle" } : { kind: "unsupported" });
  const field = useRef({ text, onText });
  useEffect(() => {
    field.current = { text, onText };
  }, [text, onText]);
  // the field as it was when listening started: each interim result replaces the last one after its text, not
  // adds to it, and the words keep landing in that field even if focus moves to another one mid-phrase
  const target = useRef<Field>({ text: "", onText: () => {} });
  // a tap while the first one is still asking for the microphone starts nothing more
  const starting = useRef(false);
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
    target.current.onText(withHeard(target.current.text, heard));
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

  // a field that goes away while its mic is on (the part editor closing) takes the recognizer down with it; one
  // that goes away while the microphone permission is still being asked must not claim it afterwards (nothing
  // would be left to release it, and every mic would then wait on a recognizer nobody owns)
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (owner !== me) return;
      owner = null;
      ExpoSpeechRecognitionModule.abort();
    };
  }, [me]);

  const toggle = useCallback(() => {
    if (state.kind === "unsupported" || starting.current) return;
    if (state.kind === "listening") {
      tick();
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    if (state.kind === "denied" && !state.canAskAgain && Platform.OS !== "web") {
      void Linking.openSettings();
      return;
    }
    starting.current = true;
    void (async () => {
      // the web has no permission call: the browser asks at start(), and a refusal arrives as the not-allowed
      // error (docs/expo-log.md, Oct 22); the module's own web stub only logs a warning
      const permission = Platform.OS === "web" ? { granted: true, canAskAgain: true } : await ExpoSpeechRecognitionModule.requestPermissionsAsync().catch(() => null);
      starting.current = false;
      if (!mounted.current) return;
      if (!permission?.granted) {
        dispatch({ type: "denied", canAskAgain: permission?.canAskAgain ?? true });
        return;
      }
      // another field's mic still on: it stops (its own end event releases it), and the next tap starts this
      // one. Starting right over its abort would hand that abort's error and end events to this field.
      if (owner && owner !== me) {
        ExpoSpeechRecognitionModule.abort();
        return;
      }
      owner = me;
      target.current = field.current;
      // listening from the tap, not from the module's start event (the web waits for the microphone first, and
      // Chrome's permission prompt can hold it for seconds): a second tap stops, instead of starting a second
      // recognizer under the same owner
      dispatch({ type: "start" });
      try {
        ExpoSpeechRecognitionModule.start({ interimResults: true, continuous: false, maxAlternatives: 1 });
        tick();
      } catch {
        owner = null;
        dispatch({ type: "error", code: "client" });
      }
    })();
  }, [state, me]);

  // Send while listening, or typing in the field: what is on screen stands, and the recognizer stops without
  // delivering more, so a phrase still being heard can't land in the field after it was emptied, or rebuild it from
  // what it held when listening began over the learner's own edit (code review, Oct 26). Anything the recognizer
  // still sends goes nowhere; the abort's own events set the state to idle.
  const cancel = useCallback(() => {
    if (owner !== me) return;
    target.current = { text: "", onText: () => {} };
    ExpoSpeechRecognitionModule.abort();
  }, [me]);

  return { state, toggle, cancel };
}
