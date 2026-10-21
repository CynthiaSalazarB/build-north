// Sign-in on Android (#22), as round 6's first launch: the cave, the arch with daylight in it, and the
// way out. Clerk's hosted page opens in an in-app browser, on its sign-up or sign-in screen; the Clerk
// dashboard decides the methods it offers. The web build uses sign-in.web.tsx instead.
import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { ObserveInteractiveMarker } from "expo-observe";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Arch, Glow } from "../components/art.tsx";
import { Failure } from "../components/messages.tsx";
import { Body, BrandTitle, Button, Footnote, Screen } from "../components/ui.tsx";
import { space } from "../theme.ts";

const acropolis = require("../../assets/images/acropolis-columns.jpg");

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
    <Screen tone="cave">
      <Glow top="24%" />
      <View style={styles.art}>
        <Arch source={acropolis} label="The Acropolis in bright daylight, seen from the cave" width={188} height={268} />
      </View>
      <View style={styles.stack}>
        <Footnote strong dim>
          Step out of the shadows
        </Footnote>
        <BrandTitle splash />
        <Body>Can you explain the code your AI wrote? Map a concept, answer real questions, and see how close your guess was.</Body>
        <Footnote dim>Your tutor is an AI that asks questions and never hands you the answer.</Footnote>
        {error && <Failure message={error} />}
        <View style={styles.actions}>
          <Button label="Get Started" busy={busy === "sign-up"} disabled={busy !== null} onPress={() => go("sign-up")} />
          <Button kind="plain" label="I Have an Account" busy={busy === "sign-in"} disabled={busy !== null} onPress={() => go("sign-in")} style={styles.center} />
        </View>
      </View>
      <ObserveInteractiveMarker />
    </Screen>
  );
}

const styles = StyleSheet.create({
  art: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: space.xl },
  stack: { paddingHorizontal: space.margin, paddingBottom: space.m, gap: space.m },
  actions: { gap: space.xs, paddingTop: space.s },
  center: { alignSelf: "center" },
});
