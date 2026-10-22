// Haptics are rare (round 6): a tick when the guess changes, a success at a level-up, nothing else.
// Android has its own haptic constants; the web uses the Vibration API, which iPhone Safari lacks, and
// a phone that can't vibrate just stays still.
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const quietly = (feel: Promise<void>) => void feel.catch(() => undefined);

export function tick() {
  quietly(Platform.OS === "android" ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick) : Haptics.selectionAsync());
}

export function success() {
  quietly(
    Platform.OS === "android"
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
}
