// The start screen (round 6, daylight): what the app does, a session to resume, and a new map: an idea,
// and optionally the learner's own notes (pasted text only, up to 8,000 characters: decision 12).
import { useAuth } from "@clerk/expo";
import { ObserveInteractiveMarker } from "expo-observe";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { KeyUnit } from "../components/icons.tsx";
import { Failure } from "../components/messages.tsx";
import { Body, BrandTitle, Button, Footnote, Screen, Ui, useColors } from "../components/ui.tsx";
import { keysOf } from "../session/present.ts";
import { clerkKey } from "../session/config.ts";
import { useSession } from "../session/session-context.tsx";
import { radius, size, space, type } from "../theme.ts";

const MAX_CONCEPT = 100;
const MAX_NOTES = 8000;

export default function StartScreen() {
  const router = useRouter();
  const c = useColors();
  const { start, offline, state } = useSession();
  const [concept, setConcept] = useState(offline ? "democracy" : "");
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unfinished = state.turn && state.turn.expects !== "none" ? state.turn : null;

  const begin = async () => {
    const name = concept.trim();
    if (!name || starting) return;
    setStarting(true);
    setError(null);
    const problem = await start({ concept: name, ...(notes.trim() ? { material: notes } : {}) });
    setStarting(false);
    if (problem) setError(problem);
    else router.push("/session");
  };

  const field = { color: c.onSurface, backgroundColor: c.surfaceContainer, borderColor: c.separator };

  return (
    <Screen tone="day">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <BrandTitle />
            <Body>Feeling sure isn't knowing. Map an idea, answer real questions, and see how close your guess was.</Body>
            <Footnote dim>Your tutor is an AI that asks questions and never hands you the answer.</Footnote>
          </View>

          {unfinished && (
            <View style={[styles.card, { backgroundColor: c.surfaceContainer }]}>
              <View style={styles.cardText}>
                <Ui strong style={styles.capitalized}>
                  {unfinished.mentefacto.concept}
                </Ui>
                <Footnote dim>{`${unfinished.progress.movesDone} of ${unfinished.progress.movesTotal} parts built`}</Footnote>
                <View style={styles.keys} accessible={false}>
                  {keysOf(unfinished).map((unit, i) => (
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
              An idea to map
            </Footnote>
            <TextInput
              value={concept}
              onChangeText={setConcept}
              maxLength={MAX_CONCEPT}
              placeholder="For example: democracy"
              placeholderTextColor={c.placeholder}
              autoCapitalize="none"
              accessibilityLabel="An idea to map"
              style={[styles.input, field]}
              returnKeyType="go"
              onSubmitEditing={begin}
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
          <Button label="Start Mapping" busy={starting} disabled={!concept.trim()} onPress={begin} />
          {clerkKey && <SignOut />}
        </View>
      </KeyboardAvoidingView>
      <ObserveInteractiveMarker />
    </Screen>
  );
}

// Only rendered with Clerk on (#22), since useAuth needs the ClerkProvider in the root layout
function SignOut() {
  const { signOut } = useAuth();
  return <Button kind="plain" label="Sign Out" onPress={() => void signOut()} style={styles.signOut} />;
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
  signOut: { alignSelf: "center" },
});
