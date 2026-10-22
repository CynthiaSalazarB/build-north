import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { AtkinsonHyperlegibleMono_400Regular, AtkinsonHyperlegibleMono_600SemiBold } from "@expo-google-fonts/atkinson-hyperlegible-mono";
import { AtkinsonHyperlegibleNext_400Regular, AtkinsonHyperlegibleNext_600SemiBold } from "@expo-google-fonts/atkinson-hyperlegible-next";
import { Newsreader_400Regular, Newsreader_400Regular_Italic, Newsreader_500Medium, useFonts } from "@expo-google-fonts/newsreader";
import { ObserveRoot } from "expo-observe";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Failure } from "../components/messages.tsx";
import { Button, Screen, Title } from "../components/ui.tsx";
import type { SessionClient } from "../session/client.ts";
import { clerkKey, createClient } from "../session/config.ts";
import { SessionProvider } from "../session/session-context.tsx";
import { base, space } from "../theme.ts";

// The splash stays up until the fonts and Clerk are ready, so the first frame is already in its own fonts.
void SplashScreen.preventAutoHideAsync();

// Without a Clerk key, everyone counts as signed in and API calls carry the dev headers (local dev).
const devClient = createClient();

// Expo Observe records launch times and crashes on phone release builds (it does nothing on the web)
export default ObserveRoot.wrap(RootLayout);

/** A crash in a screen shows this instead of a red screen, with a way to try again. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <Screen>
        <View style={styles.error}>
          <Title>Something broke on our side.</Title>
          <Failure message="Try again. If it keeps happening, restart the app.">
            <Button kind="secondary" label="Try again" onPress={() => void retry()} />
          </Failure>
        </View>
      </Screen>
    </SafeAreaProvider>
  );
}

function RootLayout() {
  const [loaded, failed] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_600SemiBold,
    AtkinsonHyperlegibleMono_400Regular,
    AtkinsonHyperlegibleMono_600SemiBold,
  });
  // a font that fails to load falls back to the system's rather than blocking the app
  if (!loaded && !failed) return null;
  return (
    <SafeAreaProvider>
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
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  return (
    <SessionProvider client={client}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: base.bottom } }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="index" />
          {/* a session rises from the start screen */}
          <Stack.Screen name="session" options={{ animation: "slide_from_bottom" }} />
        </Stack.Protected>
        <Stack.Protected guard={clerk && !signedIn}>
          <Stack.Screen name="sign-in" options={{ animation: "fade" }} />
        </Stack.Protected>
      </Stack>
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, justifyContent: "center", gap: space.xl, paddingHorizontal: space.margin },
});
