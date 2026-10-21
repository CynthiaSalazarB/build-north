// The start screen (round 8 "Open Box"): the closed box your AI's code is, a session to resume, and a new
// map: a concept picked from the folders coding agents write, or typed, plus optionally your notes (pasted
// text only, up to 8,000 characters: decision 12). "Ask your AI what to map" gives a prompt to paste into
// your coding agent, so the concepts come from your own project; notes that look like a key or a password
// never leave the phone. Test myself starts a self-test instead: the whole map alone (the testers'
// pre-test and post-test).
import type { SessionMode } from "@build-north/agents";
import type { Metadata } from "expo-router/server";
import { useAuth } from "@clerk/expo";
import { ObserveInteractiveMarker } from "expo-observe";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { MiniBox, OpenBox } from "../components/box.tsx";
import { Failure } from "../components/messages.tsx";
import { Pair } from "../components/pair.tsx";
import { Body, Button, Card, Chip, KeyboardSafe, Label, PromptField, Screen, SheetTitle, Title, useColors } from "../components/ui.tsx";
import { UpdateNotice } from "../components/update-notice.tsx";
import { AI_PROMPT, filledOf, secretLineOf } from "../session/present.ts";
import { clerkKey } from "../session/config.ts";
import { useSession } from "../session/session-context.tsx";
import { radius, space, type } from "../theme.ts";

const MAX_CONCEPT = 100;
const MAX_NOTES = 8000;
/** What coding agents put in student projects (the Oct 21 plan, section 2), by the folder they live in, plus
 * the AI concepts students wire into their own apps. Picked in one tap. */
const TREE = [
  { folder: "login/", concepts: ["JWT", "hashing"] },
  { folder: "data/", concepts: ["database index", "cache"] },
  { folder: "api/", concepts: ["REST API", "rate limiting"] },
  { folder: "deploy/", concepts: ["environment variable", "CORS"] },
  { folder: "ai/", concepts: ["RAG", "embeddings"] },
] as const;

/** The web page's title and description, in the static HTML, so a shared link previews well. */
export function generateMetadata(): Metadata {
  return {
    title: "Reality Check: can you explain the code your AI wrote?",
    description: "Map a concept from your project with an AI tutor that asks questions and never gives the answer, then see how close your guess was.",
    openGraph: { title: "Reality Check: can you explain the code your AI wrote?", description: "Map a concept from your project with an AI tutor that asks questions and never gives the answer, then see how close your guess was." },
  };
}

export default function StartScreen() {
  const router = useRouter();
  const c = useColors();
  const { start, offline, state } = useSession();
  const [concept, setConcept] = useState(offline ? "democracy" : "");
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

  const begin = async (mode: SessionMode) => {
    const name = concept.trim();
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
          <Label dim>$ reality-check</Label>
          <View style={styles.hero}>
            <OpenBox width={150} label="A closed box" />
            <View style={styles.peek}>
              <Pair look="asking" size={56} />
            </View>
          </View>
          <View style={styles.intro}>
            <Title>{"The code your AI wrote is a black box. Can you explain\u00a0it?"}</Title>
            <Body dim>Pick a concept your agent wrote. Guess your score, then open the box one part at a time.</Body>
          </View>

          {unfinished && (
            <Card style={styles.resume}>
              <View style={styles.resumeHead}>
                <MiniBox done={done} now={!draft && unfinished.phase === "move" ? done : null} />
                <Body strong style={styles.flex} numberOfLines={1}>
                  {unfinished.mentefacto.concept}
                </Body>
                <Label dim>{`${done}/${unfinished.progress.movesTotal}`}</Label>
              </View>
              <Button label="Resume" onPress={() => router.push("/session")} />
            </Card>
          )}

          {offline && <Label dim>{"// demo mode: no API is set, so this replays the democracy session"}</Label>}

          <Card style={styles.tree}>
            {TREE.map(({ folder, concepts }, i) => (
              <View key={folder} style={[styles.treeRow, i > 0 && { borderTopColor: c.separator, borderTopWidth: StyleSheet.hairlineWidth }]}>
                <Label dim style={styles.folder}>
                  {folder}
                </Label>
                <View style={styles.chips}>
                  {concepts.map((name) => (
                    <Chip key={name} label={name} selected={concept.trim() === name} onPress={() => setConcept(name)} />
                  ))}
                </View>
              </View>
            ))}
          </Card>

          <PromptField
            value={concept}
            onChangeText={setConcept}
            maxLength={MAX_CONCEPT}
            placeholder="Or type your own"
            autoCapitalize="none"
            accessibilityLabel="A concept to map"
            returnKeyType="go"
            onSubmitEditing={() => void begin("learn")}
          />

          <View style={styles.extras}>
            <Button kind="text" label="Ask your AI what to map" hint="A prompt for your coding agent, so you map concepts from your own project" onPress={() => setAskOpen(true)} style={styles.left} />
            {!notesOpen && <Button kind="text" label="Add your notes" hint="Optional: paste text the tutor can draw on" onPress={() => setNotesOpen(true)} style={styles.left} />}
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
                style={[type.body, styles.notes, { color: c.onSurface, backgroundColor: c.surfaceContainer, borderColor: secret ? c.gap : c.outline }]}
              />
              <Label dim style={styles.count}>{`${notes.length.toLocaleString("en-US")} / 8,000`}</Label>
              {secret && <Failure message={`Line ${secretLine} looks like it has a key, a token or a password. Take it out before you start: your notes go to the AI tutor.`} />}
            </View>
          )}

          {error && <Failure message={error} />}
        </ScrollView>

        <View style={styles.foot}>
          <Button label="Start mapping" busy={starting === "learn"} disabled={!concept.trim() || secret || starting !== null} onPress={() => void begin("learn")} />
          <View style={styles.footRow}>
            {!offline && (
              <Button
                kind="text"
                label="Test myself"
                hint="The whole map on your own, with only the fact desk. Your levels don't change."
                busy={starting === "test"}
                disabled={!concept.trim() || secret || starting !== null}
                onPress={() => void begin("test")}
              />
            )}
            {clerkKey && <SignOut />}
          </View>
          <Label dim style={styles.center}>
            {"// your pair is an AI. it asks, you\u00a0explain."}
          </Label>
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
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { backgroundColor: c.scrim }]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: c.surfaceContainer }]}>
        <View style={[styles.grabber, { backgroundColor: c.outline }]} />
        <SheetTitle>Ask your AI what to map</SheetTitle>
        <Body dim>Paste this into Claude Code, Cursor or Copilot inside your project. Then paste its answer into your notes and pick a concept from it.</Body>
        <View style={[styles.prompt, { backgroundColor: c.surfaceHigh, borderColor: c.outline }]}>
          <Text selectable style={[type.label, styles.promptText, { color: c.onSurface }]}>
            {AI_PROMPT}
          </Text>
        </View>
        <Button label={Platform.OS === "web" ? (copied ? "Copied" : "Copy the prompt") : "Share the prompt"} onPress={() => void copy()} />
        <Button kind="secondary" label="Paste its answer" onPress={onPaste} style={styles.center} />
      </View>
    </Modal>
  );
}

// Only rendered with Clerk on (#22), since useAuth needs the ClerkProvider in the root layout
function SignOut() {
  const { signOut } = useAuth();
  return <Button kind="text" label="Sign out" onPress={() => void signOut()} />;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.margin, paddingTop: space.xl, paddingBottom: space.xl, gap: space.l },
  hero: { alignItems: "center", paddingVertical: space.s },
  peek: { position: "absolute", left: "22%", bottom: space.xl },
  intro: { gap: space.m },
  flex: { flex: 1 },
  resume: { gap: space.m },
  resumeHead: { flexDirection: "row", alignItems: "center", gap: space.m },
  tree: { padding: 0, overflow: "hidden" },
  treeRow: { flexDirection: "row", alignItems: "flex-start", gap: space.s, paddingHorizontal: space.m, paddingVertical: space.m },
  folder: { width: 56, paddingTop: space.m },
  chips: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: space.s },
  extras: { gap: 0 },
  left: { alignSelf: "flex-start", paddingHorizontal: 0 },
  notesGroup: { gap: space.s },
  notes: { minHeight: 140, paddingHorizontal: space.l, paddingVertical: space.m, borderRadius: radius.field, borderWidth: StyleSheet.hairlineWidth, textAlignVertical: "top" },
  count: { alignSelf: "flex-end" },
  foot: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.m, gap: space.xs },
  footRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: space.xl },
  center: { alignSelf: "center", textAlign: "center" },
  scrim: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space.margin,
    paddingTop: space.m,
    paddingBottom: space.xxl,
    gap: space.m,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  grabber: { alignSelf: "center", width: 36, height: 4, borderRadius: 2 },
  prompt: { borderRadius: radius.field, borderWidth: StyleSheet.hairlineWidth, padding: space.l },
  promptText: { lineHeight: 18 },
});
