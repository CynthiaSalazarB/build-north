// Sign-in on the web build (#22): the firefly and the start screen's question over Clerk's prebuilt SignIn, in
// round 9's dark colors. The methods come from the Clerk dashboard (email code only). Android uses sign-in.tsx.
import type { Metadata } from "expo-router/server";
import { SignIn } from "@clerk/expo/web";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Firefly } from "../components/firefly.tsx";
import { Screen, Small, Title, useColors } from "../components/ui.tsx";
import { brand, radius, space, type, webSans } from "../theme.ts";

/** The web page's title and description, in the static HTML, so a shared link previews well. */
export function generateMetadata(): Metadata {
  const title = `${brand.name}: can you explain the code your AI wrote?`;
  const description = "Pick a concept from your project. A firefly asks questions and never hands you the answer; each answer in your own words brings more light.";
  return { title, description, openGraph: { title, description } };
}

export default function SignInScreen() {
  const c = useColors();
  const appearance = {
    variables: {
      colorPrimary: c.primary,
      colorPrimaryForeground: c.onPrimary,
      colorBackground: c.surfaceContainer,
      colorForeground: c.onSurface,
      colorMutedForeground: c.onSurfaceVariant,
      colorNeutral: c.onSurface,
      colorInput: c.surface,
      colorInputForeground: c.onSurface,
      colorBorder: c.outline,
      fontFamily: webSans,
      borderRadius: `${radius.field}px`,
    },
  } as const;
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={[type.wordmark, { color: c.onSurface }]}>{brand.name}</Text>
          <View style={styles.head}>
            <Firefly state="asks" />
            <Title style={styles.flex}>Can you explain the code your AI wrote?</Title>
          </View>
          <Small dim>A firefly asks. You explain. It never hands you the answer.</Small>
        </View>
        <SignIn appearance={appearance} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: space.margin, gap: space.xl },
  intro: { gap: space.m, alignSelf: "stretch" },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  flex: { flex: 1 },
});
