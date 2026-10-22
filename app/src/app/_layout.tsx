import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { SessionClient } from "../session/client.ts";
import { clerkKey, createClient } from "../session/config.ts";
import { SessionProvider } from "../session/session-context.tsx";
import { colors } from "../theme.ts";

// Without a Clerk key, everyone counts as signed in and API calls carry the dev headers (local dev).
const devClient = createClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {clerkKey ? (
        <ClerkProvider publishableKey={clerkKey} tokenCache={tokenCache}>
          <ClerkApp />
        </ClerkProvider>
      ) : (
        <App client={devClient} signedIn clerk={false} />
      )}
    </SafeAreaProvider>
  );
}

// #22: every API call carries the Clerk session token, and a signed-out learner only sees sign-in.
function ClerkApp() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const client = useMemo(() => createClient(() => getToken()), [getToken]);
  // nothing to show until Clerk knows whether someone is signed in
  if (!isLoaded) return null;
  return <App client={client} signedIn={!!isSignedIn} clerk />;
}

function App({ client, signedIn, clerk }: { client: SessionClient; signedIn: boolean; clerk: boolean }) {
  return (
    <SessionProvider client={client}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="index" />
          <Stack.Screen name="session" />
        </Stack.Protected>
        <Stack.Protected guard={clerk && !signedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
    </SessionProvider>
  );
}
