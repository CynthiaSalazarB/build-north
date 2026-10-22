// "Update ready" on the start screen (E13): an update published with EAS Update downloads in the
// background, and this offers to restart into it. Release builds only: the web and development builds
// never get updates, so nothing shows there.
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { space } from "../theme.ts";
import { Body, Button, Card, Label } from "./ui.tsx";

export function UpdateNotice() {
  if (Platform.OS === "web" || !Updates.isEnabled) return null;
  return <Pending />;
}

function Pending() {
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  // the launch check finds a new update; download it now so the notice can offer it this session
  useEffect(() => {
    if (isUpdateAvailable && !isUpdatePending) void Updates.fetchUpdateAsync().catch(() => undefined);
  }, [isUpdateAvailable, isUpdatePending]);
  if (!isUpdatePending) return null;
  return (
    <Card style={styles.card}>
      <View style={styles.text} accessibilityRole="alert">
        <Label dim>update ready</Label>
        <Body>A new version is ready.</Body>
      </View>
      <Button kind="secondary" label="Restart" onPress={() => void Updates.reloadAsync()} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: space.m },
  text: { flex: 1, gap: space.xs },
});
