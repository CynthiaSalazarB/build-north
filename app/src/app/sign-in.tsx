// Sign-in on Android (#22), in round 8's first frame: the closed box, your pair beside it, and the way in.
// Clerk's hosted page opens in an in-app browser, on its sign-up or sign-in screen; the Clerk dashboard
// decides the methods it offers. The web build uses sign-in.web.tsx instead.
import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { ObserveInteractiveMarker } from "expo-observe";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { OpenBox } from "../components/box.tsx";
import { Failure } from "../components/messages.tsx";
import { Pair } from "../components/pair.tsx";
import { Body, Button, Label, Screen, Title } from "../components/ui.tsx";
import { space } from "../theme.ts";

export default function SignInScreen() {
  const { startHostedAuth } = useHostedAuth();
  const [busy, setBusy] = useState<"sign-up" | "sign-in" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const go = async (mode: "sign-up" | "sign-in") => {
    setBusy(mode);
    setError(null);
    try {
      // once Clerk has a session, the root layout swaps this screen for the start screen
      await startHostedAuth({ mode });
    } catch {
      setError("Sign-in didn't finish. Try again.");
    }
    setBusy(null);
  };

  return (
    <Screen>
      <View style={styles.top}>
        <Label dim>$ reality-check</Label>
      </View>
      <View style={styles.art}>
        <OpenBox width={170} label="A closed box" />
        <View style={styles.peek}>
          <Pair look="asking" size={60} />
        </View>
      </View>
      <View style={styles.stack}>
        <Title>{"The code your AI wrote is a black box. Can you explain\u00a0it?"}</Title>
        <Body dim>Pick a concept your agent wrote, guess your score, then open the box one part at a time.</Body>
        {error && <Failure message={error} />}
        <View style={styles.actions}>
          <Button label="Get started" busy={busy === "sign-up"} disabled={busy !== null} onPress={() => go("sign-up")} />
          <Button kind="text" label="I have an account" busy={busy === "sign-in"} disabled={busy !== null} onPress={() => go("sign-in")} />
          <Label dim style={styles.center}>
            {"// your pair is an AI. it asks, you\u00a0explain."}
          </Label>
        </View>
      </View>
      <ObserveInteractiveMarker />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: space.margin, paddingTop: space.xl },
  art: { flex: 1, alignItems: "center", justifyContent: "center" },
  peek: { position: "absolute", left: "20%", top: "56%" },
  stack: { paddingHorizontal: space.margin, paddingBottom: space.m, gap: space.m },
  actions: { gap: space.xs, paddingTop: space.s },
  center: { alignSelf: "center", textAlign: "center" },
});
