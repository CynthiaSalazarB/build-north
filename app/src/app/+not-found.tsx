// A link to a page that doesn't exist. On the web (a mistyped address, an old link): say so, and offer the way
// in. On a phone there are no pages to mistype: an unknown path is a deep link the app has no screen for, such
// as Clerk's `hosted-auth-callback` after the hosted sign-in returns, so the app just goes home.
import { Redirect, useRouter } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { SiteHeader } from "../components/site-header.tsx";
import { Button, Label, Screen, Title, usePageTitle, useWide } from "../components/ui.tsx";
import { brand, space } from "../theme.ts";

// The tab's title comes from here alone: the export doesn't run generateMetadata for +not-found
const TITLE = `This page doesn't exist · ${brand.name}`;

export default function NotFoundScreen() {
  const router = useRouter();
  const wide = useWide();
  usePageTitle(TITLE);
  if (Platform.OS !== "web") return <Redirect href="/" />;
  return (
    <Screen>
      {wide && <SiteHeader />}
      <View style={styles.content}>
        <Label dim>404</Label>
        <Title>{"This page doesn't exist."}</Title>
        <Button label={`Go to ${brand.name}`} fit={wide} onPress={() => router.replace("/")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "center", gap: space.l, paddingHorizontal: space.margin, width: "100%", maxWidth: 560, alignSelf: "center" },
});
