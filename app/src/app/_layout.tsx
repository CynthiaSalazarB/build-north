import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { client } from "../session/config.ts";
import { SessionProvider } from "../session/session-context.tsx";
import { colors } from "../theme.ts";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider client={client}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
