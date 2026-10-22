// Sign-in on the web build (#22), which is also its landing page: the start screen's question, one line on how it
// works, and Clerk's prebuilt SignIn in round 9's dark colors; in the website layout, beside the code and the map
// the learner is about to light. The methods come from the Clerk dashboard. Android uses sign-in.tsx.
import type { Metadata } from "expo-router/server";
import { SignIn } from "@clerk/expo/web";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CodePreview } from "../components/code-preview.tsx";
import { Firefly } from "../components/firefly.tsx";
import { SiteHeader } from "../components/site-header.tsx";
import { Rise, Screen, Small, Title, useColors, useWide } from "../components/ui.tsx";
import { brand, page, radius, space, type, webSans } from "../theme.ts";

/** The web page's title and description, in the static HTML, so a shared link previews well. */
export function generateMetadata(): Metadata {
  const title = `${brand.name}: can you explain the code your AI wrote?`;
  const description = "Pick a concept from your project. An AI tutor asks questions and never hands you the answer; each answer in your own words brings more light.";
  return { title, description, openGraph: { title, description } };
}

/** What the landing page says under its question: the tutor is an AI, and it won't think for you. */
const HOW = "An AI tutor asks. You explain. It never hands you the answer.";

export default function SignInScreen() {
  const c = useColors();
  const wide = useWide();
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

  if (wide) {
    return (
      <Screen>
        <SiteHeader />
        <View style={styles.split}>
          <ScrollView style={styles.words} contentContainerStyle={styles.wordsContent}>
            <Rise style={styles.intro}>
              <Small dim>{brand.tagline}</Small>
              <Text style={[type.display, { color: c.onSurface }]} accessibilityRole="header">
                Can you explain the code your AI wrote?
              </Text>
              <Text style={[type.lead, { color: c.onSurfaceVariant }]}>{HOW}</Text>
            </Rise>
            <Rise order={2}>
              <SignIn appearance={appearance} />
            </Rise>
          </ScrollView>
          <View style={styles.stage}>
            <Rise order={1} style={styles.spot}>
              <CodePreview concept="API" />
            </Rise>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Rise style={styles.intro}>
          <Text style={[type.wordmark, { color: c.onSurface }]}>{brand.name}</Text>
          <View style={styles.head}>
            <Firefly state="asks" />
            <Title style={styles.flex}>Can you explain the code your AI wrote?</Title>
          </View>
          <Small dim>{HOW}</Small>
        </Rise>
        <Rise order={1}>
          <SignIn appearance={appearance} />
        </Rise>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: space.margin, gap: space.xl },
  intro: { gap: space.m, alignSelf: "stretch" },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  flex: { flex: 1 },
  split: { flex: 1, flexDirection: "row", gap: page.gap, paddingHorizontal: page.gutter },
  words: { width: page.words, flexGrow: 0 },
  wordsContent: { flexGrow: 1, justifyContent: "center", paddingVertical: space.xxl, gap: space.xxl },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: page.header },
  spot: { width: "100%", maxWidth: page.map },
});
