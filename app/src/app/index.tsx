// The start screen (round 9 "Lumente"): it opens on the learner's code, the concept's line lit in amber, over the
// empty map in the dark, with the firefly beside it. A concept is picked in one tap or typed, plus optionally the
// learner's notes (pasted text only, up to 8,000 characters: decision 12). "Ask your AI what to map" gives a
// prompt to paste into a coding agent, so the concepts come from the learner's own project; notes that look like a
// key or a password never leave the phone. "Test myself" starts a self-test instead: the whole map alone, the
// testers' pre-test and post-test.
import type { SessionMode } from "@build-north/agents";
import type { Metadata } from "expo-router/server";
import { useAuth } from "@clerk/expo";
import { ObserveInteractiveMarker } from "expo-observe";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { ConceptMap } from "../components/concept-map.tsx";
import { Firefly } from "../components/firefly.tsx";
import { Failure } from "../components/messages.tsx";
import { Body, Button, Card, Chip, KeyboardSafe, Label, PromptField, Screen, Sheet, Small, Title, useColors } from "../components/ui.tsx";
import { UpdateNotice } from "../components/update-notice.tsx";
import { AI_PROMPT, CONCEPTS, editorLinesOf, filledOf, secretLineOf, type PartView } from "../session/present.ts";
import { clerkKey } from "../session/config.ts";
import { useSession } from "../session/session-context.tsx";
import { brand, editor, radius, space, type } from "../theme.ts";

const MAX_CONCEPT = 100;
const MAX_NOTES = 8000;
const EMPTY: PartView[] = (["supraordinate", "exclusion", "isoordinate", "infraordinate"] as const).map((move) => ({ move, state: "unasked", text: null, pips: ["open", "open"] }));

/** The web page's title and description, in the static HTML, so a shared link previews well. */
export function generateMetadata(): Metadata {
  const title = `${brand.name}: can you explain the code your AI wrote?`;
  const description = "Pick a concept from your project. A firefly asks questions and never hands you the answer; each answer in your own words brings more light.";
  return { title, description, openGraph: { title, description } };
}

export default function StartScreen() {
  const router = useRouter();
  const c = useColors();
  const { start, offline, state } = useSession();
  const [concept, setConcept] = useState<string>("API");
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [starting, setStarting] = useState<SessionMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unfinished = state.turn && state.turn.expects !== "none" ? state.turn : null;
  // at level 5 the parts fill on the phone until the map is submitted
  const draft = unfinished?.expects === "map" ? state.draft : null;
  const done = draft ? filledOf(draft) : (unfinished?.progress.movesDone ?? 0);
  const secretLine = secretLineOf(notes);
  const secret = secretLine !== null;
  const name = concept.trim();
  const picked = CONCEPTS.find((chip) => chip === name) ?? null;

  const begin = async (mode: SessionMode) => {
    if (!name || starting || secret) return;
    setStarting(mode);
    setError(null);
    const problem = await start({ concept: name, ...(notes.trim() ? { material: notes } : {}), ...(mode === "test" ? { mode } : {}) });
    setStarting(null);
    if (problem) setError(problem);
    else router.push("/session");
  };

  return (
    <Screen>
      <KeyboardSafe>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <UpdateNotice />
          <Text style={[type.wordmark, { color: c.onSurface }]} accessibilityRole="header">
            {brand.name}
          </Text>

          <View style={[styles.editor, { backgroundColor: c.codeFill, borderColor: c.fieldEdge }]} accessible accessibilityLabel={`Code from your project that uses ${name || "a concept"}`}>
            {editorLinesOf(name).map((line) => (
              <View key={line.n} style={[styles.line, line.current && { backgroundColor: "rgba(242, 184, 75, 0.1)" }]}>
                <Text style={[type.code, styles.gutter, { color: line.current ? c.question : "#7d7469" }]}>{line.n}</Text>
                <Text style={[type.code, styles.code, { color: line.current ? c.question : "rgba(244, 239, 232, 0.4)" }]} numberOfLines={1}>
                  {line.text}
                </Text>
                {line.current && <View style={[styles.cursor, { backgroundColor: c.firefly }]} />}
              </View>
            ))}
          </View>

          <View style={styles.map} accessible={false} importantForAccessibility="no-hide-descendants">
            <ConceptMap concept={name || "?"} parts={EMPTY} />
            <View style={styles.firefly}>
              <Firefly state="asks" />
            </View>
          </View>

          <View style={styles.intro}>
            <Title>Can you explain the code your AI wrote?</Title>
            <Small dim>A firefly asks. You explain. It never hands you the answer.</Small>
          </View>

          {unfinished && (
            <Card style={styles.resume}>
              <View style={styles.resumeHead}>
                <Body style={styles.flex} numberOfLines={1}>
                  {unfinished.mentefacto.concept}
                </Body>
                <Label dim>{`${done} of ${unfinished.progress.movesTotal} parts`}</Label>
              </View>
              <Button kind="secondary" label="Resume" onPress={() => router.push("/session")} />
            </Card>
          )}

          {offline && <Label dim>demo mode: no API is set, so this replays the democracy session</Label>}

          <View style={styles.chips}>
            {CONCEPTS.map((chip) => (
              <Chip key={chip} label={chip} selected={picked === chip} onPress={() => setConcept(chip)} />
            ))}
          </View>

          <PromptField
            value={picked ? "" : concept}
            onChangeText={setConcept}
            maxLength={MAX_CONCEPT}
            placeholder="Or type your own"
            autoCapitalize="none"
            accessibilityLabel="A concept to map"
            returnKeyType="go"
            onSubmitEditing={() => void begin("learn")}
          />

          <View style={styles.extras}>
            {!notesOpen && <Button kind="text" label="Add your notes" hint="Optional: paste text the firefly can draw on" onPress={() => setNotesOpen(true)} style={styles.left} />}
            <Button kind="text" label="Ask your AI what to map" hint="A prompt for your coding agent, so you map concepts from your own project" onPress={() => setAskOpen(true)} style={styles.left} />
          </View>

          {notesOpen && (
            <View style={styles.notesGroup}>
              <Label dim>your notes</Label>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                maxLength={MAX_NOTES}
                placeholder="Paste your AI's answer, or text from your class"
                placeholderTextColor={c.placeholder}
                multiline
                accessibilityLabel="Your notes"
                style={[styles.notes, { color: c.onSurface, backgroundColor: c.surfaceContainer, borderColor: secret ? c.gap : c.fieldEdge }]}
              />
              <Label dim style={styles.count}>{`${notes.length.toLocaleString("en-US")} / 8,000`}</Label>
              {secret && <Failure message={`Line ${secretLine} looks like it has a key, a token or a password. Take it out before you start: your notes go to the AI tutor.`} />}
            </View>
          )}

          {error && <Failure message={error} />}
        </ScrollView>

        <View style={styles.foot}>
          <Button label={name ? `Start with ${name}` : "Pick a concept"} busy={starting === "learn"} disabled={!name || secret || starting !== null} onPress={() => void begin("learn")} />
          <View style={styles.footRow}>
            {!offline && (
              <Button
                kind="text"
                label="Test myself"
                hint="The whole map on your own, with only the facts. Your levels don't change."
                busy={starting === "test"}
                disabled={!name || secret || starting !== null}
                onPress={() => void begin("test")}
              />
            )}
            {clerkKey && <SignOut />}
          </View>
        </View>
      </KeyboardSafe>
      <AskYourAi
        open={askOpen}
        onClose={() => setAskOpen(false)}
        onPaste={() => {
          setAskOpen(false);
          setNotesOpen(true);
        }}
      />
      <ObserveInteractiveMarker />
    </Screen>
  );
}

/** The prompt for your coding agent: copied on the web, shared on a phone (the copy button needs a native
 * module, which waits for the next build). */
function AskYourAi({ open, onClose, onPaste }: { open: boolean; onClose: () => void; onPaste: () => void }) {
  const c = useColors();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(AI_PROMPT).then(() => setCopied(true), () => setCopied(false));
    } else {
      await Share.share({ message: AI_PROMPT }).catch(() => undefined);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} label="the prompt">
      <Title style={styles.sheetTitle}>Ask your AI what to map</Title>
      <Small dim>Paste this into Claude Code, Cursor or Copilot inside your project. Then paste its answer into your notes and pick a concept from it.</Small>
      <View style={[styles.prompt, { backgroundColor: c.codeFill, borderColor: c.fieldEdge }]}>
        <Text selectable style={[type.label, styles.promptText, { color: c.onSurface }]}>
          {AI_PROMPT}
        </Text>
      </View>
      <Button label={Platform.OS === "web" ? (copied ? "Copied" : "Copy the prompt") : "Share the prompt"} onPress={() => void copy()} />
      <Button kind="text" label="Paste its answer" onPress={onPaste} />
    </Sheet>
  );
}

// Only rendered with Clerk on (#22), since useAuth needs the ClerkProvider in the root layout
function SignOut() {
  const { signOut } = useAuth();
  return <Button kind="text" label="Sign out" onPress={() => void signOut()} />;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.margin, paddingTop: 22, paddingBottom: space.xl, gap: space.l },
  editor: { borderRadius: editor.radius, borderWidth: 1, paddingVertical: 10, overflow: "hidden" },
  line: { flexDirection: "row", alignItems: "center" },
  gutter: { width: editor.gutter, paddingRight: space.m, textAlign: "right" },
  code: { flexShrink: 1 },
  cursor: { width: 8, height: 17, marginLeft: 2 },
  map: { paddingHorizontal: 26 },
  firefly: { position: "absolute", left: 40, top: 6 },
  intro: { gap: space.s },
  flex: { flex: 1 },
  resume: { gap: space.m },
  resumeHead: { flexDirection: "row", alignItems: "center", gap: space.m },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.s },
  extras: { flexDirection: "row", flexWrap: "wrap", columnGap: space.l },
  left: { alignSelf: "flex-start", paddingHorizontal: 0 },
  notesGroup: { gap: space.s },
  // no custom line height on a multiline field: Android would show only its last line
  notes: { fontFamily: type.input.fontFamily, fontSize: type.input.fontSize, minHeight: 140, paddingHorizontal: space.l, paddingVertical: space.m, borderRadius: radius.field, borderWidth: 1, textAlignVertical: "top" },
  count: { alignSelf: "flex-end" },
  foot: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.m, gap: space.xs },
  footRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: space.xl },
  sheetTitle: { fontSize: 24, lineHeight: 30 },
  prompt: { borderRadius: radius.field, borderWidth: 1, padding: space.l },
  promptText: { lineHeight: 18 },
});
