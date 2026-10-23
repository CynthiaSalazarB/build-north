// What is running, in one line (the Expo plan's Pillar 5): the app's version and, on a phone, the EAS Update it
// is on, so a tester or a judge can say exactly what they saw and the team can find it in the EAS dashboard.
// Pure, so it's tested under Node; version-line.tsx reads the values from expo-updates and expo-constants.

export type Running = {
  name: string;
  /** `version` from app.json; null if the config isn't there. */
  version: string | null;
  web: boolean;
  /** expo-updates is on: release builds only, never a development build. */
  updates: boolean;
  /** The code embedded in the build runs, with no update applied yet. */
  embedded: boolean;
  /** When the update that runs was published. */
  createdAt: Date | null;
  channel: string | null;
  updateId: string | null;
};

/** "Oct 23, 1:15 PM", in the device's time zone. */
const whenOf = (date: Date) => date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function versionLineOf(running: Running): string {
  const app = running.version ? `${running.name} ${running.version}` : running.name;
  if (running.web) return `${app} · web build`;
  if (!running.updates) return `${app} · development build`;
  if (running.embedded || !running.updateId) return `${app} · as installed, no update applied yet`;
  const update = `update ${running.updateId.slice(0, 8)}`;
  const when = running.createdAt ? ` from ${whenOf(running.createdAt)}` : "";
  const channel = running.channel ? ` · ${running.channel}` : "";
  return `${app} · ${update}${when}${channel}`;
}
