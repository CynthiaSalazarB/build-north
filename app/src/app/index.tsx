// The start screen: a concept, and optionally the learner's own notes (pasted text only, up to 8,000
// characters: decision 12).
import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Body, Button, Screen, Small, Title } from "../components/ui.tsx";
import { clerkKey } from "../session/config.ts";
import { useSession } from "../session/session-context.tsx";
import { brand, colors, fonts, radius, space } from "../theme.ts";

const MAX_CONCEPT = 100;
const MAX_NOTES = 8000;

export default function StartScreen() {
  const router = useRouter();
  const { start, offline } = useSession();
  const [concept, setConcept] = useState(offline ? "democracy" : "");
  const [notes, setNotes] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Title>{brand.name}</Title>
            <Body muted>{brand.tagline}</Body>
          </View>

          {offline && (
            <View style={styles.banner}>
              <Small style={styles.bannerText}>Demo mode: there's no API set, so this replays the democracy session.</Small>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Concept</Text>
            <TextInput
              value={concept}
              onChangeText={setConcept}
              maxLength={MAX_CONCEPT}
              placeholder="For example: democracy"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              accessibilityLabel="Concept"
              style={styles.input}
              returnKeyType="go"
              onSubmitEditing={begin}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Your notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              maxLength={MAX_NOTES}
              placeholder="Paste text from your class or reading"
              placeholderTextColor={colors.textMuted}
              multiline
              accessibilityLabel="Your notes"
              style={[styles.input, styles.notes]}
            />
            <Small style={styles.count}>{`${notes.length.toLocaleString("en-US")} / 8,000`}</Small>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Start" busy={starting} disabled={!concept.trim()} onPress={begin} />
          {clerkKey && <SignOut />}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// Only rendered with Clerk on (#22), since useAuth needs the ClerkProvider in the root layout
function SignOut() {
  const { signOut } = useAuth();
  return <Button label="Sign out" kind="secondary" onPress={() => void signOut()} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.xl, gap: space.xl },
  intro: { gap: space.sm, paddingTop: space.xl },
  banner: { backgroundColor: colors.hintBackground, borderRadius: radius.md, padding: space.md },
  bannerText: { color: colors.hint },
  field: { gap: space.sm },
  label: { fontFamily: fonts.body, fontSize: fonts.size.body, fontWeight: fonts.weight.medium, color: colors.text },
  input: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontFamily: fonts.body,
    fontSize: fonts.size.body,
    color: colors.text,
  },
  notes: { minHeight: 140, textAlignVertical: "top" },
  count: { alignSelf: "flex-end" },
  error: { fontFamily: fonts.body, fontSize: fonts.size.body, color: colors.error },
});
