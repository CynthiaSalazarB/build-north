import { loadAsync, useFonts, type FontSource } from "expo-font";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

/** Serialize web registration: WebKit can abandon earlier loads when the shared stylesheet moves. */
export function useBrandFonts(fonts: Record<string, FontSource>): [boolean, Error | null] {
  const browser = Platform.OS === "web" && typeof window !== "undefined";
  const [loaded, error] = useFonts(browser ? {} : fonts);
  const [webReady, setWebReady] = useState(false);
  const [webError, setWebError] = useState<Error | null>(null);
  useEffect(() => {
    if (!browser) return;
    let current = true;
    const load = async () => {
      for (const [name, source] of Object.entries(fonts)) await loadAsync(name, source);
    };
    // Match the static export's first frame, then show usable content as loading starts, not after a font timeout.
    void Promise.resolve().then(() => {
      if (!current) return;
      setWebReady(true);
      return load();
    }).catch((cause: unknown) => {
      if (current) setWebError(cause instanceof Error ? cause : new Error("Couldn't load the interface fonts."));
    });
    return () => { current = false; };
  }, [browser, fonts]);
  // Native keeps Expo's usual loading gate; the web swaps in fonts without blocking interaction.
  return Platform.OS === "web" ? [webReady, webError] : [loaded, error];
}
