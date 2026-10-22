// The start screen (round 9 "Lumente"): it opens on the learner's code, the concept's line lit in amber, over the
// empty map in the dark, with the firefly beside it. A concept is picked in one tap or typed, plus optionally the
// learner's notes (pasted text only, up to 8,000 characters: decision 12). "Ask your AI what to map" gives a
// prompt to paste into a coding agent, so the concepts come from the learner's own project; notes that look like a
// key or a password never leave the phone. "Test myself" starts a self-test instead: the whole map alone, the
// testers' pre-test and post-test. In the website layout the choices are a column on the left and the code and
// the map stand on the right.
import type { SessionMode } from "@build-north/agents";
import type { Metadata } from "expo-router/server";
import { useAuth } from "@clerk/expo";
import { ObserveInteractiveMarker } from "expo-observe";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Platform, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { CodePreview } from "../components/code-preview.tsx";
import { Failure } from "../components/messages.tsx";
import { SiteHeader } from "../components/site-header.tsx";
import { Body, Button, Card, Chip, KeyboardSafe, Label, PromptField, Rise, Screen, Sheet, Small, Title, useColors, useWide } from "../components/ui.tsx";
import { UpdateNotice } from "../components/update-notice.tsx";
import { AI_PROMPT, CONCEPTS, filledOf, secretLineOf } from "../session/present.ts";
import { clerkKey } from "../session/config.ts";
import { useSession } from "../session/session-context.tsx";
import { brand, page, radius, size, space, type } from "../theme.ts";

const MAX_CONCEPT = 100;
const MAX_NOTES = 8000;

/** The web page's title and description, in the static HTML, so a shared link previews well. */
export function generateMetadata(): Metadata {
  const title = `${brand.name}: can you explain the code your AI wrote?`;
  const description = "Pick a concept from your project. An AI tutor asks questions and never hands you the answer; each answer in your own words brings more light.";
  return { title, description, openGraph: { title, description } };
}

export default function StartScreen() {
  const router = useRouter();
  const c = useColors();
  const wide = useWide();
  const { start, offline, state } = useSession();
  const [concept, setConcept] = useState<string>(offline ? "democracy" : "API");
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

  const startButton = <Button label={name ? `Start with ${name}` : "Pick a concept"} fit={wide} busy={starting === "learn"} disabled={!name || secret || starting !== null} onPress={() => void begin("learn")} />;
  const testButton = !offline && (
    <Button
      kind={wide ? "secondary" : "text"}
      label="Test myself"
      hint="The whole map on your own, with only the facts. Your levels don't change."
      busy={starting === "test"}
      disabled={!name || secret || starting !== null}
      onPress={() => void begin("test")}
      style={wide && styles.tall}
    />
  );
  // the choices, in the order both layouts read them
  const choices = (
    <>
      {unfinished && (
        <Rise order={1}>
          <Card style={styles.resume}>
            <View style={styles.resumeHead}>
              <Body style={styles.flex} numberOfLines={1}>
                {unfinished.mentefacto.concept}
              </Body>
              <Label dim>{`${done} of ${unfinished.progress.movesTotal} parts`}</Label>
            </View>
            <Button kind="secondary" label="Resume" onPress={() => router.push("/session")} />
          </Card>
        </Rise>
      )}
      {offline && <Label dim>Demo mode: a recorded session, no API</Label>}
      <Rise order={2} style={styles.chips}>
        {CONCEPTS.map((chip) => (
          <Chip key={chip} label={chip} selected={picked === chip} onPress={() => setConcept(chip)} />
        ))}
      </Rise>
      <Rise order={3}>
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
      </Rise>
      <Rise order={4} style={styles.extras}>
        {!notesOpen && <Button kind="text" label="Add your notes" hint="Optional: paste text the firefly can draw on" onPress={() => setNotesOpen(true)} style={styles.left} />}
        <Button kind="text" label="Ask your AI what to map" hint="A prompt for your coding agent, so you map concepts from your own project" onPress={() => setAskOpen(true)} style={styles.left} />
      </Rise>
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
    </>
  );
  const sheet = (
    <AskYourAi
      open={askOpen}
      onClose={() => setAskOpen(false)}
      onPaste={() => {
        setAskOpen(false);
        setNotesOpen(true);
      }}
    />
  );

  if (wide) {
    return (
      <Screen>
        <SiteHeader end={clerkKey && <SignOut solid />} />
        <View style={styles.split}>
          <ScrollView style={styles.words} contentContainerStyle={styles.wordsContent} keyboardShouldPersistTaps="handled">
            <Rise>
              <Text style={[type.display, { color: c.onSurface }]} accessibilityRole="header">
                Can you explain the code your AI wrote?
              </Text>
            </Rise>
            {choices}
            <Rise order={5} style={styles.actions}>
              {startButton}
              {testButton}
            </Rise>
          </ScrollView>
          <View style={styles.stage}>
            <Rise order={2} style={styles.spot}>
              <CodePreview concept={name} />
            </Rise>
          </View>
        </View>
        {sheet}
        <ObserveInteractiveMarker />
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardSafe>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <UpdateNotice />
          <View style={styles.top}>
            <Text style={[type.wordmark, { color: c.onSurface }]} accessibilityRole="header">
              {brand.name}
            </Text>
            {clerkKey && <SignOut />}
          </View>
          <Rise>
            <CodePreview concept={name} />
          </Rise>
          <Rise order={1}>
            <Title>Can you explain the code your AI wrote?</Title>
          </Rise>
          {choices}
        </ScrollView>
        <View style={styles.foot}>
          {startButton}
          {testButton && <View style={styles.footRow}>{testButton}</View>}
        </View>
      </KeyboardSafe>
      {sheet}
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
      <Small dim>Paste this into Claude Code, Cursor or Copilot inside your project, then paste its answer into your notes.</Small>
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
function SignOut({ solid = false }: { solid?: boolean }): ReactNode {
  const { signOut } = useAuth();
  return <Button kind={solid ? "secondary" : "text"} solid={solid} label="Sign out" onPress={() => void signOut()} style={!solid && styles.signOut} />;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.xl, gap: space.l },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: size.touch },
  signOut: { paddingHorizontal: 0 },
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
  footRow: { flexDirection: "row", justifyContent: "center" },
  sheetTitle: { fontSize: 24, lineHeight: 30 },
  prompt: { borderRadius: radius.field, borderWidth: 1, padding: space.l },
  promptText: { lineHeight: 18 },
  split: { flex: 1, flexDirection: "row", gap: page.gap, paddingHorizontal: page.gutter },
  words: { width: page.words, flexGrow: 0 },
  wordsContent: { flexGrow: 1, justifyContent: "center", paddingTop: space.xxl, paddingBottom: page.header, gap: space.xl },
  actions: { flexDirection: "row", alignItems: "center", gap: space.m, marginTop: space.s },
  tall: { height: 56 },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: page.header },
  spot: { width: "100%", maxWidth: page.map },
});
