// Sign-in on the web build (#22): Clerk's prebuilt SignIn in the brand's colors and fonts, under round 6's
// first launch line. The methods come from the Clerk dashboard. Android uses sign-in.tsx.
import { SignIn } from "@clerk/expo/web";
import { ScrollView, StyleSheet, View } from "react-native";
import { Glow } from "../components/art.tsx";
import { Body, BrandTitle, Footnote, Screen } from "../components/ui.tsx";
import { palette, radius, space, systemFontStack } from "../theme.ts";

const day = palette.day;

const appearance = {
  variables: {
    colorPrimary: day.primary,
    colorPrimaryForeground: day.onPrimary,
    colorBackground: day.surfaceContainer,
    colorForeground: day.onSurface,
    colorMutedForeground: day.onSurfaceVariant,
    colorNeutral: day.onSurface,
    colorInput: day.surfaceContainer,
    colorInputForeground: day.onSurface,
    colorBorder: day.separator,
    fontFamily: systemFontStack,
    borderRadius: `${radius.control / 2}px`,
  },
} as const;

export default function SignInScreen() {
  return (
    <Screen tone="cave">
      <Glow top="12%" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Footnote strong dim>
            Step out of the shadows
          </Footnote>
          <BrandTitle splash />
          <Body>Can you explain the code your AI wrote? Map a concept, answer real questions, and see how close your guess was.</Body>
          <Footnote dim>Your tutor is an AI that asks questions and never hands you the answer.</Footnote>
        </View>
        <SignIn appearance={appearance} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: space.margin, gap: space.xxl },
  intro: { gap: space.m, alignSelf: "stretch" },
});
