// Sign-in on Android (#22), in round 9's first frame: the dark with its corner light, the firefly, the wordmark and
// the tagline, then the way in. Clerk's hosted page opens in an in-app browser, on its sign-up or sign-in screen;
// the Clerk dashboard decides the methods it offers (email code and Google). The web build uses sign-in.web.tsx instead.
import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { ObserveInteractiveMarker } from "expo-observe";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Firefly } from "../components/firefly.tsx";
import { Failure } from "../components/messages.tsx";
import { Button, Screen, Small, useColors } from "../components/ui.tsx";
import { brand, space, type } from "../theme.ts";

export default function SignInScreen() {
  const c = useColors();
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
      <View style={styles.brand}>
        <Firefly state="helps" size={72} />
        <Text style={[type.wordmark, styles.wordmark, { color: c.onSurface }]} accessibilityRole="header">
          {brand.name}
        </Text>
        <Small dim style={styles.center}>
          {brand.tagline}
        </Small>
      </View>
      <View style={styles.actions}>
        {error && <Failure message={error} />}
        <Button label="Get started" busy={busy === "sign-up"} disabled={busy !== null} onPress={() => go("sign-up")} />
        <Button kind="text" label="I have an account" busy={busy === "sign-in"} disabled={busy !== null} onPress={() => go("sign-in")} />
      </View>
      <ObserveInteractiveMarker />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.l, paddingHorizontal: space.margin },
  wordmark: { fontSize: 40, lineHeight: 48, marginTop: space.xl },
  center: { textAlign: "center" },
  actions: { paddingHorizontal: space.margin, paddingBottom: space.m, gap: space.xs },
});
