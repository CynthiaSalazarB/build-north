// Sign-in on iOS and Android (#22): Clerk's hosted page opens in an in-app browser, which also works in
// Expo Go. The Clerk dashboard decides the methods it offers. The look comes with the brand kit (#14);
// the web build uses sign-in.web.tsx instead.
import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Body, Button, Screen, Title } from "../components/ui.tsx";
import { brand, colors, fonts, space } from "../theme.ts";

export default function SignInScreen() {
  const { startHostedAuth } = useHostedAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      // once Clerk has a session, the root layout swaps this screen for the start screen
      await startHostedAuth();
    } catch {
      setError("Sign-in didn't finish. Try again.");
    }
    setBusy(false);
  };

  return (
    <Screen>
      <View style={styles.content}>
        <Title>{brand.name}</Title>
        <Body muted>Sign in with your email to start.</Body>
        <Button label="Sign in" busy={busy} onPress={signIn} />
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "center", padding: space.xl, gap: space.lg },
  error: { fontFamily: fonts.body, fontSize: fonts.size.body, color: colors.error },
});
