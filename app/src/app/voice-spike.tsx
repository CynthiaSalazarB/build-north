// Temporary: the C1 voice spike, a throwaway screen at /voice-spike that turns speech into editable text.
// C2 replaces it with the mic button in the composer; delete this file then. Nothing here sends anything.
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Body, Button, PromptField, Screen, Small, Title } from "../components/ui.tsx";
import { space } from "../theme.ts";

type State = "unsupported" | "idle" | "listening" | "denied" | "error";

export default function VoiceSpike() {
  const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
  const [state, setState] = useState<State>(available ? "idle" : "unsupported");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");

  useSpeechRecognitionEvent("start", () => setState("listening"));
  useSpeechRecognitionEvent("end", () => setState((s) => (s === "listening" ? "idle" : s)));
  useSpeechRecognitionEvent("result", (event) => {
    const heard = event.results[0]?.transcript ?? "";
    setText(heard);
    setNote(event.isFinal ? "final" : "interim");
  });
  useSpeechRecognitionEvent("error", (event) => {
    setState(event.error === "not-allowed" ? "denied" : "error");
    setNote(`${event.error}: ${event.message}`);
  });

  const start = async () => {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setState("denied");
      setNote(permission.canAskAgain ? "microphone permission not granted" : "microphone permission refused; open Settings to allow it");
      return;
    }
    setNote("");
    ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true, continuous: false, maxAlternatives: 1 });
  };

  return (
    <Screen>
      <View style={styles.column}>
        <Title>Voice spike</Title>
        <Small dim>
          {Platform.OS} · state: {state}
          {note ? ` · ${note}` : ""}
        </Small>
        {state === "unsupported" ? (
          <Body>Speech recognition is not available here (Firefox, Brave, Expo Go, or no speech service on this device).</Body>
        ) : (
          <>
            <PromptField value={text} onChangeText={setText} placeholder="What you say appears here, and you can edit it" multiline />
            {state === "listening" ? (
              <Button label="Stop" onPress={() => ExpoSpeechRecognitionModule.stop()} />
            ) : (
              <Button label={state === "denied" ? "Try the microphone again" : "Hold on, speak"} onPress={() => void start()} />
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, gap: space.l, padding: space.margin },
});
