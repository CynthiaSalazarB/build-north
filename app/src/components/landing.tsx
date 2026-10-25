// The web build's landing page (#22), around Clerk's sign-in or sign-up form: what Lumente is for, one line on how
// it works (Cynthia's words, Oct 23) and the form in round 9's dark colors; in the website layout, beside the code
// and the map the learner is about to light. sign-in.web.tsx and sign-up.web.tsx are the two pages; Android uses
// sign-in.tsx instead.
import type { ReactNode } from "react";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { brand, page, radius, space, type, webSans } from "../theme.ts";
import { CodePreview } from "./code-preview.tsx";
import { Firefly } from "./firefly.tsx";
import { SiteHeader } from "./site-header.tsx";
import { Rise, Screen, Small, Title, useColors, useWide } from "./ui.tsx";

/** The landing page's headline and the line under it (Cynthia, Oct 23). */
export const HEADLINE = "Build understanding, not dependence.";
export const HOW = "Unravel concepts one question at a time, connect the ideas, and figure things out for yourself.";

/** Clerk's components in Lumente's colors; `routing="hash"` keeps every step of the form on this one page, since the
 * web build is static and has no `/sign-in/factor-one` to serve on a reload. */
export function useClerkAppearance() {
  const c = useColors();
  return {
    // Temporary: hides the "Development mode" badge (B1, Oct 24 web test) while the site runs on Clerk's development
    // instance; a production instance needs a domain of our own with DNS records, so drop this once we move to one.
    options: { unsafe_disableDevelopmentModeWarnings: true },
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
}

/** Keep account switching on Lumente and make the two routes easy to find above Clerk's form. */
export function AuthSwitch({ mode }: { mode: "sign-in" | "sign-up" }) {
  const c = useColors();
  const signingIn = mode === "sign-in";
  return (
    <View style={styles.authSwitch}>
      <Small dim>{signingIn ? "New to Lumente?" : "Already have an account?"}</Small>
      <Link
        href={signingIn ? "/sign-up" : "/sign-in"}
        accessibilityLabel={signingIn ? "Get started and create an account" : "I have an account, sign in"}
        style={[type.button, styles.authSwitchLink, { color: c.onSurface, backgroundColor: c.controlFill, borderColor: c.outline }]}
      >
        {signingIn ? "Get started" : "I have an account"}
      </Link>
    </View>
  );
}

export function Landing({ form }: { form: ReactNode }) {
  const c = useColors();
  const wide = useWide();

  if (wide) {
    return (
      <Screen>
        <SiteHeader />
        <View style={styles.split}>
          <ScrollView style={styles.words} contentContainerStyle={styles.wordsContent}>
            <Rise style={styles.intro}>
              <Text style={[type.display, { color: c.onSurface }]} accessibilityRole="header">
                {HEADLINE}
              </Text>
              <Text style={[type.lead, { color: c.onSurfaceVariant }]}>{HOW}</Text>
            </Rise>
            <Rise order={2}>
              <View style={styles.authForm}>{form}</View>
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
            <Title style={styles.flex}>{HEADLINE}</Title>
          </View>
          <Small dim>{HOW}</Small>
        </Rise>
        <Rise order={1}>
          <View style={styles.authForm}>{form}</View>
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
  authForm: { gap: space.m },
  // on a narrow phone the link drops under the question instead of both breaking across two lines
  authSwitch: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", columnGap: space.s, rowGap: space.xs },
  authSwitchLink: { flexShrink: 0, borderWidth: 1, borderRadius: radius.field, paddingHorizontal: space.m, paddingVertical: space.xs, overflow: "hidden" },
});
