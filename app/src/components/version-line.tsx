// The line at the bottom of Your data that says what is running: the version, and on a phone the EAS Update it
// is on (version.ts has the words). Nothing personal: every phone on the same update shows the same line.
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Platform } from "react-native";
import { brand } from "../theme.ts";
import { Label } from "./ui.tsx";
import { versionLineOf } from "./version.ts";

export function VersionLine() {
  const line = versionLineOf({
    name: brand.name,
    version: Constants.expoConfig?.version ?? null,
    web: Platform.OS === "web",
    updates: Updates.isEnabled,
    embedded: Updates.isEmbeddedLaunch,
    createdAt: Updates.createdAt,
    channel: Updates.channel,
    updateId: Updates.updateId,
  });
  return <Label dim>{line}</Label>;
}
