// A link to a page that doesn't exist (a mistyped web address, an old link): say so, and offer the way in.
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Body, Button, Label, Screen, Title } from "../components/ui.tsx";
import { brand, space } from "../theme.ts";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.content}>
        <Label dim>404</Label>
        <Title>This page doesn't exist.</Title>
        <Body dim>The link may be old or mistyped.</Body>
        <Button label={`Go to ${brand.name}`} onPress={() => router.replace("/")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "center", gap: space.l, paddingHorizontal: space.margin },
});
