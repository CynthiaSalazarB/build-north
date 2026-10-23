// Where the device keeps the saved session (saved.ts): the browser's storage on the web, a file in the app's own
// documents folder on a phone (expo-file-system, which every Expo build already carries, so the fingerprint doesn't
// change). Every call swallows its errors: a device that can't keep the record just can't offer to resume, and the
// session itself is never affected.
import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

const KEY = "lumente.session";
const NAME = "session.json";

const web = Platform.OS === "web";
// the web's File is a stub that only warns, so it is never built there
const file = () => new File(Paths.document, NAME);
const store = () => (typeof localStorage === "undefined" ? null : localStorage);

export async function readSaved(): Promise<string | null> {
  try {
    if (web) return store()?.getItem(KEY) ?? null;
    const f = file();
    return f.exists ? await f.text() : null;
  } catch {
    return null;
  }
}

export async function writeSaved(text: string): Promise<void> {
  try {
    if (web) {
      store()?.setItem(KEY, text);
      return;
    }
    const f = file();
    if (!f.exists) f.create();
    await f.write(text);
  } catch {
    // nothing to do: the next Turn tries again
  }
}

export async function clearSaved(): Promise<void> {
  try {
    if (web) {
      store()?.removeItem(KEY);
      return;
    }
    const f = file();
    if (f.exists) f.delete();
  } catch {
    // a record that can't be removed is dropped on the next read instead (the server answers 404 for it)
  }
}
