// The start screen (round 6, daylight): what the app does, a session to resume, and a new map: an idea,
// and optionally the learner's own notes (pasted text only, up to 8,000 characters: decision 12). Test
// Myself starts a self-test instead: the whole map alone (the testers' pre-test and post-test).
import { MOVE_ORDER, type SessionMode } from "@build-north/agents";
import type { Metadata } from "expo-router/server";
import { useAuth } from "@clerk/expo";
import { ObserveInteractiveMarker } from "expo-observe";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyUnit } from "../components/icons.tsx";
import { Failure } from "../components/messages.tsx";
import { Body, BrandTitle, Button, Footnote, Screen, Ui, useColors } from "../components/ui.tsx";
import { UpdateNotice } from "../components/update-notice.tsx";
import { filledOf, itemsOf, keysOf } from "../session/present.ts";
import { clerkKey } from "../session/config.ts";
import { useSession } from "../session/session-context.tsx";
import { radius, size, space, type } from "../theme.ts";

const MAX_CONCEPT = 100;
const MAX_NOTES = 8000;
/** What coding agents put in student projects (the Oct 21 plan, section 2), to pick in one tap. */
const CONCEPTS = ["JWT", "hashing", "database index", "cache", "REST API", "rate limiting", "environment variable", "CORS"] as const;

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
  const [starting, setStarting] = useState<SessionMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unfinished = state.turn && state.turn.expects !== "none" ? state.turn : null;
  // at level 5 the parts fill on the phone until the map is submitted
  const draft = unfinished?.expects === "map" ? state.draft : null;

  const begin = async (mode: SessionMode) => {
    const name = concept.trim();
    if (!name || starting) return;
    setStarting(mode);
    setError(null);
    const problem = await start({ concept: name, ...(notes.trim() ? { material: notes } : {}), ...(mode === "test" ? { mode } : {}) });
    setStarting(null);
    if (problem) setError(problem);
    else router.push("/session");
  };

  const field = { color: c.onSurface, backgroundColor: c.surfaceContainer, borderColor: c.separator };

  return (
    <Screen tone="day">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <UpdateNotice />
          <View style={styles.intro}>
            <BrandTitle />
            <Body>Can you explain the code your AI wrote? Pick a concept from your project, guess your score, then build its map yourself.</Body>
            <Footnote dim>Your tutor is an AI that asks questions and never hands you the answer.</Footnote>
          </View>

          {unfinished && (
            <View style={[styles.card, { backgroundColor: c.surfaceContainer }]}>
              <View style={styles.cardText}>
                <Ui strong style={styles.capitalized}>
                  {unfinished.mentefacto.concept}
                </Ui>
                <Footnote dim>
                  {draft ? `${filledOf(draft)} of 4 parts filled` : `${unfinished.progress.movesDone} of ${unfinished.progress.movesTotal} parts built`}
                </Footnote>
                <View style={styles.keys} accessible={false}>
                  {(draft ? MOVE_ORDER.map((move) => (itemsOf(draft, move).length > 0 ? "done" : "todo")) : keysOf(unfinished)).map((unit, i) => (
                    <KeyUnit key={i} color={unit === "done" ? c.primary : c.onSurfaceVariant} opacity={unit === "done" ? 1 : 0.35} />
                  ))}
                </View>
              </View>
              <Button label="Resume" onPress={() => router.push("/session")} />
            </View>
          )}

          {offline && (
            <View style={[styles.note, { backgroundColor: c.surfaceContainer }]}>
              <Footnote dim>Demo mode: no API is set, so this replays the democracy session.</Footnote>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Footnote strong dim>
              A concept from your code
            </Footnote>
            <View style={styles.chips}>
              {CONCEPTS.map((name) => (
                <Choice key={name} label={name} selected={concept.trim() === name} onPress={() => setConcept(name)} />
              ))}
            </View>
            <TextInput
              value={concept}
              onChangeText={setConcept}
              maxLength={MAX_CONCEPT}
              placeholder="Or type your own. For example: JWT"
              placeholderTextColor={c.placeholder}
              autoCapitalize="none"
              accessibilityLabel="A concept to map"
              style={[styles.input, field]}
              returnKeyType="go"
              onSubmitEditing={() => void begin("learn")}
            />
          </View>

          {notesOpen ? (
            <View style={styles.fieldGroup}>
              <Footnote strong dim>
                Your notes
              </Footnote>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                maxLength={MAX_NOTES}
                placeholder="Paste text from your class or reading"
                placeholderTextColor={c.placeholder}
                multiline
                accessibilityLabel="Your notes"
                style={[styles.notes, field]}
              />
              <Footnote dim style={styles.count}>{`${notes.length.toLocaleString("en-US")} / 8,000`}</Footnote>
            </View>
          ) : (
            <Button kind="plain" icon="plus" label="Add Your Notes" hint="Optional: paste text the tutor can draw on" onPress={() => setNotesOpen(true)} />
          )}

          {error && <Failure message={error} />}
        </ScrollView>

        <View style={styles.foot}>
          <Button label="Start Mapping" busy={starting === "learn"} disabled={!concept.trim() || starting !== null} onPress={() => void begin("learn")} />
          <View style={styles.footRow}>
            {!offline && (
              <Button
                kind="plain"
                label="Test Myself"
                hint="The whole map on your own, with only the fact desk. Your levels don't change."
                busy={starting === "test"}
                disabled={!concept.trim() || starting !== null}
                onPress={() => void begin("test")}
              />
            )}
            {clerkKey && <SignOut />}
          </View>
        </View>
      </KeyboardAvoidingView>
      <ObserveInteractiveMarker />
    </Screen>
  );
}

/** A concept to pick in one tap; the picked one turns bronze. */
function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={size.hitSlop}
      style={({ pressed }) => [
        styles.choice,
        selected ? { backgroundColor: c.primary } : { backgroundColor: c.surfaceContainer, borderColor: c.separator, borderWidth: StyleSheet.hairlineWidth },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[type.ui, { color: selected ? c.onPrimary : c.onSurface }]}>{label}</Text>
    </Pressable>
  );
}

// Only rendered with Clerk on (#22), since useAuth needs the ClerkProvider in the root layout
function SignOut() {
  const { signOut } = useAuth();
  return <Button kind="plain" label="Sign Out" onPress={() => void signOut()} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.margin, paddingTop: space.xxl, paddingBottom: space.xl, gap: space.xl },
  intro: { gap: space.m },
  card: { borderRadius: radius.cardLarge, padding: space.l, gap: space.l },
  cardText: { gap: space.xs },
  capitalized: { textTransform: "capitalize" },
  keys: { flexDirection: "row", gap: space.xs, paddingTop: space.xs },
  note: { borderRadius: radius.card, paddingVertical: space.m, paddingHorizontal: space.l },
  fieldGroup: { gap: space.s },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.s, paddingBottom: space.xs },
  choice: { height: size.control, borderRadius: radius.control, paddingHorizontal: space.l, justifyContent: "center" },
  pressed: { transform: [{ scale: 0.96 }] },
  input: {
    ...type.ui,
    lineHeight: 20,
    height: size.button,
    paddingHorizontal: space.margin,
    borderRadius: radius.button,
    borderWidth: StyleSheet.hairlineWidth,
  },
  notes: {
    ...type.ui,
    minHeight: 140,
    paddingHorizontal: space.l,
    paddingVertical: space.m,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    textAlignVertical: "top",
  },
  count: { alignSelf: "flex-end" },
  foot: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.m, gap: space.xs },
  footRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: space.xl },
});
