// A link to a page that doesn't exist (a mistyped web address, an old link): say so, and offer the way in.
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SiteHeader } from "../components/site-header.tsx";
import { Button, Label, Screen, Title, useWide } from "../components/ui.tsx";
import { brand, space } from "../theme.ts";

export default function NotFoundScreen() {
  const router = useRouter();
  const wide = useWide();
  return (
    <Screen>
      {wide && <SiteHeader />}
      <View style={styles.content}>
        <Label dim>404</Label>
        <Title>This page doesn't exist.</Title>
        <Button label={`Go to ${brand.name}`} fit={wide} onPress={() => router.replace("/")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "center", gap: space.l, paddingHorizontal: space.margin, width: "100%", maxWidth: 560, alignSelf: "center" },
});
