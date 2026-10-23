// "Update ready" on the start screen (E13): an update published with EAS Update downloads in the background,
// and this offers to restart into it. The build checks once at launch on its own; this also checks when the app
// comes back to the foreground and when Start is shown again after a session, at most once a minute, so a fix
// published while the app was open is offered without a relaunch (the fix a tester gets the same evening, and
// the update that arrives on stage). Release builds only: the web and development builds never get updates, so
// nothing shows there.
import { useFocusEffect } from "expo-router";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform, StyleSheet, View } from "react-native";
import { space } from "../theme.ts";
import { Body, Button, Card } from "./ui.tsx";

/** Expo rate-limits checks, and one a minute is plenty for a fix to arrive. */
const CHECK_EVERY_MS = 60_000;

export function UpdateNotice() {
  if (Platform.OS === "web" || !Updates.isEnabled) return null;
  return <Pending />;
}

function Pending() {
  const { isUpdateAvailable, isUpdatePending, isChecking, isDownloading } = Updates.useUpdates();
  // the launch already checked, so the first check here is a minute in at the earliest
  const checkedAt = useRef(Date.now());
  const check = useCallback(() => {
    const now = Date.now();
    // one check or download at a time, and a check that fails (offline, rate limited) changes nothing: the
    // next one tries again
    if (isChecking || isDownloading || now - checkedAt.current < CHECK_EVERY_MS) return;
    checkedAt.current = now;
    void Updates.checkForUpdateAsync().catch(() => undefined);
  }, [isChecking, isDownloading]);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => listener.remove();
  }, [check]);
  useFocusEffect(check);
  // a check finds a new update; download it now so the notice can offer it this session
  useEffect(() => {
    if (isUpdateAvailable && !isUpdatePending && !isDownloading) void Updates.fetchUpdateAsync().catch(() => undefined);
  }, [isUpdateAvailable, isUpdatePending, isDownloading]);
  if (!isUpdatePending) return null;
  return (
    <Card style={styles.card}>
      <View style={styles.text} accessibilityRole="alert">
        <Body>A new version is ready.</Body>
      </View>
      <Button kind="secondary" label="Restart" onPress={() => void Updates.reloadAsync()} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: space.m },
  text: { flex: 1 },
});
