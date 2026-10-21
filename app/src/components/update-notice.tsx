// "Update ready" on the start screen (E13): an update published with EAS Update downloads in the
// background, and this offers to restart into it. Release builds only: the web and development builds
// never get updates, so nothing shows there.
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { radius, space } from "../theme.ts";
import { Button, Ui, useColors } from "./ui.tsx";

export function UpdateNotice() {
  if (Platform.OS === "web" || !Updates.isEnabled) return null;
  return <Pending />;
}

function Pending() {
  const c = useColors();
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  // the launch check finds a new update; download it now so the notice can offer it this session
  useEffect(() => {
    if (isUpdateAvailable && !isUpdatePending) void Updates.fetchUpdateAsync().catch(() => undefined);
  }, [isUpdateAvailable, isUpdatePending]);
  if (!isUpdatePending) return null;
  return (
    <View style={[styles.card, { backgroundColor: c.surfaceContainer }]} accessibilityRole="alert">
      <Ui style={styles.text}>A new version is ready.</Ui>
      <Button kind="tonal" label="Restart" onPress={() => void Updates.reloadAsync()} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: space.m, borderRadius: radius.card, paddingVertical: space.m, paddingHorizontal: space.l },
  text: { flex: 1 },
});
