// Sign-in on the web build (#22): Clerk's prebuilt SignIn in round 8's colors, under the start screen's
// line. The methods come from the Clerk dashboard. Android uses sign-in.tsx.
import type { Metadata } from "expo-router/server";
import { SignIn } from "@clerk/expo/web";
import { ScrollView, StyleSheet, View } from "react-native";
import { Pair } from "../components/pair.tsx";
import { Body, Label, Screen, Title, useColors } from "../components/ui.tsx";
import { radius, space, systemFontStack } from "../theme.ts";

/** The web page's title and description, in the static HTML, so a shared link previews well. */
export function generateMetadata(): Metadata {
  return {
    title: "Reality Check: can you explain the code your AI wrote?",
    description: "Map a concept from your project with an AI tutor that asks questions and never gives the answer, then see how close your guess was.",
    openGraph: { title: "Reality Check: can you explain the code your AI wrote?", description: "Map a concept from your project with an AI tutor that asks questions and never gives the answer, then see how close your guess was." },
  };
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
      colorInput: c.surfaceHigh,
      colorInputForeground: c.onSurface,
      colorBorder: c.outline,
      fontFamily: systemFontStack,
      borderRadius: `${radius.field}px`,
    },
  } as const;
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Label dim>$ reality-check</Label>
          <View style={styles.head}>
            <Pair look="asking" size={48} />
            <Title style={styles.flex}>{"The code your AI wrote is a black box. Can you explain\u00a0it?"}</Title>
          </View>
          <Body dim>Pick a concept your agent wrote, guess your score, then open the box one part at a time.</Body>
        </View>
        <SignIn appearance={appearance} />
        <Label dim>{"// your pair is an AI. it asks, you\u00a0explain."}</Label>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: space.margin, gap: space.xl },
  intro: { gap: space.m, alignSelf: "stretch" },
  head: { flexDirection: "row", alignItems: "flex-start", gap: space.m },
  flex: { flex: 1 },
});
