// The start screen (round 9 "Lumente"): it opens on the learner's code, the concept's line lit in amber, over the
// empty map in the dark, with the firefly beside it. A concept is picked in one tap or typed, plus optionally the
// learner's notes (pasted text only, up to 8,000 characters: decision 12). "Ask your AI what to map" gives a
// prompt to paste into a coding agent, so the concepts come from the learner's own project; notes that look like a
// key or a password never leave the phone. "Test myself" starts a self-test instead: the whole map alone, the
// testers' pre-test and post-test. Every session the learner didn't finish (closed early, a reload, a killed app,
// another device) is offered back at the top, from the server's list, and the finished ones wait under "Your maps",
// each opening on its result (read-only: a finished session is never played again). In the website layout the
// choices are a column on the left and the code and the map stand on the right.
import type { SessionMode, SessionSummary } from "@build-north/agents";
import { useAuth } from "@clerk/expo";
import { ObserveInteractiveMarker } from "expo-observe";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { Platform, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { CodePreview } from "../components/code-preview.tsx";
import { MemorySheet } from "../components/memory-sheet.tsx";
import { Failure } from "../components/messages.tsx";
import { SiteHeader } from "../components/site-header.tsx";
import { Body, Button, Card, Chip, KeyboardSafe, Label, PromptField, Rise, Screen, Sheet, Small, Title, useColors, useWide } from "../components/ui.tsx";
import { UpdateNotice } from "../components/update-notice.tsx";
import { VersionLine } from "../components/version-line.tsx";
import { AI_PROMPT, CONCEPTS, filledOf, secretLineOf, shortDateOf } from "../session/present.ts";
import { clerkKey } from "../session/config.ts";
import { useSession } from "../session/session-context.tsx";
import { brand, page, pageMetadata, radius, size, space, type } from "../theme.ts";

const MAX_CONCEPT = 100;
const MAX_NOTES = 8000;

/** The web page's title, description and card, in the static HTML, so a shared link previews well. */
export function generateMetadata() {
  return pageMetadata(`${brand.name}: can you explain the ideas behind the code your AI wrote?`, `${SUBTITLE} ${GUIDED} Or you lead the investigation.`);
}

/** Start's words (Cynthia, Oct 23): the question, the line under it, and what each way to start means. */
const QUESTION = "Can you explain the ideas behind the code your AI wrote?";
const SUBTITLE = "Choose a concept and start figuring it out.";
const GUIDED = "Answer questions. Your map fills as you go.";
const ALONE = "Write on the map. Ask facts if you need them.";

/** One way to start, with what it means under it. */
function Choice({ line, children }: { line: string; children: ReactNode }) {
  return (
    <View style={styles.choice}>
      {children}
      <Small dim style={styles.choiceLine}>
        {line}
      </Small>
    </View>
  );
}

export default function StartScreen() {
  const router = useRouter();
  const c = useColors();
  const wide = useWide();
  const { start, offline, state, history, refresh, resume } = useSession();
  const [concept, setConcept] = useState<string>("API");
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [starting, setStarting] = useState<SessionMode | null>(null);
  const [resuming, setResuming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  // a result on screen is finished, even while the coach's words are on their way
  const unfinished = state.turn && state.turn.expects !== "none" && state.turn.phase !== "result" ? state.turn : null;
  // at level 5 the parts fill on the phone until the map is submitted
  const draft = unfinished?.expects === "map" ? state.draft : null;
  const done = draft ? filledOf(draft) : (unfinished?.progress.movesDone ?? 0);
  // the server's list, read again each time Start shows (a session just finished is on it), so the sessions
  // to pick up (the one on screen has its own card) and the finished maps are the learner's whole record
  useFocusEffect(
    useCallback(() => {
      void refresh().then(setListError);
    }, [refresh]),
  );
  const kept = history?.filter((s) => !s.finished && s.id !== state.turn?.sessionId) ?? [];
  const maps = history?.filter((s) => s.finished) ?? [];
  const busy = starting !== null || resuming !== null;
  const secretLine = secretLineOf(notes);
  const secret = secretLine !== null;
  const name = concept.trim();
  const picked = CONCEPTS.find((chip) => chip === name) ?? null;
  // A concept the learner already has a session going on, in the same mode, goes on from where it stopped instead of
  // starting over beside it (Leo, Oct 24: picking a topic he had worked on showed none of it). A finished one starts
  // fresh, and its map stays under "Your maps".
  const ongoing = (mode: SessionMode): "on screen" | SessionSummary | null => {
    const same = (other: string, otherMode: SessionMode) => otherMode === mode && other.trim().toLowerCase() === name.toLowerCase();
    if (unfinished && same(unfinished.mentefacto.concept, state.mode)) return "on screen";
    return kept.find((s) => same(s.concept, s.mode)) ?? null;
  };
  const going = { learn: ongoing("learn"), test: ongoing("test") };
  const pickingUp = (session: ReturnType<typeof ongoing>) => session !== null && session !== "on screen" && resuming === session.id;

  const begin = async (mode: SessionMode) => {
    if (!name || busy || secret) return;
    const session = going[mode];
    if (session === "on screen") return router.push("/session");
    if (session) return pickUp(session);
    setStarting(mode);
    setError(null);
    const problem = await start({ concept: name, ...(notes.trim() ? { material: notes } : {}), ...(mode === "test" ? { mode } : {}) });
    setStarting(null);
    if (problem) setError(problem);
    else router.push("/session");
  };
  const pickUp = async (session: SessionSummary) => {
    if (busy) return;
    setResuming(session.id);
    setError(null);
    const problem = await resume(session);
    setResuming(null);
    if (problem) setError(problem);
    else router.push("/session");
  };

  // the label says what the tap does: a concept with a session going on continues it
  const startButton = (
    <Button
      label={going.learn ? "Continue with guidance" : name ? "Explore with guidance" : "Pick a concept"}
      hint={going.learn ? `Picks up your ${name} session where you left it` : GUIDED}
      fit={wide}
      busy={starting === "learn" || pickingUp(going.learn)}
      disabled={!name || secret || busy}
      onPress={() => void begin("learn")}
    />
  );
  const testButton = !offline && (
    <Button
      kind={wide ? "secondary" : "text"}
      label={going.test ? "Continue self-test" : "Test myself"}
      hint={going.test ? `Picks up your ${name} self-test where you left it` : "Write your answers in the four map areas. The optional chat answers factual questions. Your levels don't change."}
      busy={starting === "test" || pickingUp(going.test)}
      disabled={!name || secret || busy}
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
            <Button kind="secondary" label="Resume" disabled={busy} onPress={() => router.push("/session")} />
          </Card>
        </Rise>
      )}
      {kept.map((session) => (
        <Rise key={session.id} order={1}>
          <Card style={styles.resume}>
            <View style={styles.resumeHead}>
              <Body style={styles.flex} numberOfLines={1}>
                {session.concept}
              </Body>
              <Label dim>{`${session.mode === "test" ? "self-test" : "session"} started${shortDateOf(session.createdAt) ? ` ${shortDateOf(session.createdAt)}` : ""}`}</Label>
            </View>
            <Button kind="secondary" label="Resume" hint="Picks the session up where you left it" busy={resuming === session.id} disabled={busy} onPress={() => void pickUp(session)} />
          </Card>
        </Rise>
      ))}
      {/* demo mode replays one recorded session, on API, whatever is picked (fixture-client.ts): it offers that
          concept alone, so a tap on "CORS" never opens a session about API */}
      {offline && <Label dim>Demo mode: a recorded session on API</Label>}
      <Rise order={2} style={styles.chips}>
        {(offline ? CONCEPTS.slice(0, 1) : CONCEPTS).map((chip) => (
          <Chip key={chip} label={chip} selected={picked === chip} onPress={() => setConcept(chip)} />
        ))}
      </Rise>
      {!offline && (
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
      )}
      <Rise order={4} style={styles.extras}>
        {!notesOpen && <Button kind="text" label="Add your notes" hint="Optional: paste text the firefly can draw on" onPress={() => setNotesOpen(true)} style={styles.left} />}
        <Button kind="text" label="Ask your AI what to map" hint="A prompt for your coding agent, so you map concepts from your own project" onPress={() => setAskOpen(true)} style={styles.left} />
      </Rise>
      {notesOpen && (
        <View style={styles.notesGroup}>
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
          {secret && <Failure message={`Line ${secretLine} looks like it has a key, a token or a password. Take it out before you start: your notes go to the AI.`} />}
        </View>
      )}
      {error && <Failure message={error} />}
      {/* every finished session, newest first: its result opens again, read-only (the thesis's "Your maps") */}
      {(maps.length > 0 || listError) && (
        <Rise order={5} style={styles.maps}>
          <Label dim>Your maps</Label>
          {listError && <Small dim>{`Couldn't load them: ${listError}`}</Small>}
          {maps.map((session) => (
            <Card key={session.id} style={styles.resume}>
              <View style={styles.resumeHead}>
                <Body style={styles.flex} numberOfLines={1}>
                  {session.concept}
                </Body>
                <Label dim>{`${session.score ?? 0} of 8${session.mode === "test" ? " · self-test" : ""}${shortDateOf(session.createdAt) ? ` · ${shortDateOf(session.createdAt)}` : ""}`}</Label>
              </View>
              <Button kind="text" label="Open" hint="Shows this map and its result again" busy={resuming === session.id} disabled={busy} onPress={() => void pickUp(session)} style={styles.left} />
            </Card>
          ))}
        </Rise>
      )}
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
        <SiteHeader end={<Account solid />} />
        <View style={styles.split}>
          <ScrollView style={styles.words} contentContainerStyle={styles.wordsContent} keyboardShouldPersistTaps="handled">
            {/* an Android tablet in the website layout still gets "Update ready"; the web never does */}
            <UpdateNotice />
            <Rise style={styles.heading}>
              <Text style={[type.display, { color: c.onSurface }]} accessibilityRole="header">
                {QUESTION}
              </Text>
              <Text style={[type.lead, { color: c.onSurfaceVariant }]}>{SUBTITLE}</Text>
            </Rise>
            {choices}
            <Rise order={5} style={styles.actions}>
              <Choice line={GUIDED}>{startButton}</Choice>
              {testButton && <Choice line={ALONE}>{testButton}</Choice>}
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
            <Account />
          </View>
          <Rise>
            <CodePreview concept={name} />
          </Rise>
          <Rise order={1} style={styles.heading}>
            <Title>{QUESTION}</Title>
            <Body dim>{SUBTITLE}</Body>
          </Rise>
          {choices}
        </ScrollView>
        <View style={styles.foot}>
          <Choice line={GUIDED}>{startButton}</Choice>
          {testButton && (
            <View style={styles.footRow}>
              <Choice line={ALONE}>{testButton}</Choice>
            </View>
          )}
        </View>
      </KeyboardSafe>
      {sheet}
      <ObserveInteractiveMarker />
    </Screen>
  );
}

/** The prompt for your coding agent: copied on the web, shared on a phone (the copy button needs a native
 * module, which waits for the next build). A browser that refuses the clipboard says so, and the text stays
 * selectable. */
function AskYourAi({ open, onClose, onPaste }: { open: boolean; onClose: () => void; onPaste: () => void }) {
  const c = useColors();
  const [copied, setCopied] = useState<"no" | "yes" | "refused">("no");
  const copy = async () => {
    if (Platform.OS === "web") {
      const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
      const ok = clipboard ? await clipboard.writeText(AI_PROMPT).then(() => true, () => false) : false;
      setCopied(ok ? "yes" : "refused");
    } else {
      await Share.share({ message: AI_PROMPT }).catch(() => undefined);
    }
  };
  const copyLabel = copied === "yes" ? "Copied" : copied === "refused" ? "Select the text and copy it" : "Copy";
  return (
    <Sheet open={open} onClose={onClose} label="the prompt">
      <Title style={styles.sheetTitle}>Ask your AI what to map</Title>
      <Small dim>Paste this into Claude Code, Cursor or Copilot inside your project.</Small>
      <View style={[styles.prompt, { backgroundColor: c.codeFill, borderColor: c.fieldEdge }]}>
        <Text selectable style={[type.label, styles.promptText, { color: c.onSurface }]}>
          {AI_PROMPT}
        </Text>
      </View>
      <Button label={Platform.OS === "web" ? copyLabel : "Share"} onPress={() => void copy()} />
      <Button kind="text" label="Paste its answer" onPress={onPaste} />
    </Sheet>
  );
}

/** The account's controls, at the top of Start: "Memory" (what Lumente remembers, #112), "Your data" (what is kept,
 * and the delete button, #43) and, with Clerk on, "Sign out". `solid` is the website header's opaque look. */
function Account({ solid = false }: { solid?: boolean }): ReactNode {
  // useAuth needs the ClerkProvider in the root layout, which is only there with a Clerk key (#22)
  return clerkKey ? <ClerkAccount solid={solid} /> : <AccountButtons solid={solid} signOut={null} />;
}

function ClerkAccount({ solid }: { solid: boolean }) {
  const { signOut } = useAuth();
  const { forget } = useSession();
  // a sign-out that fails (offline, say) leaves the learner signed in, with nothing to show for it; one that works
  // takes the session with it, since the next learner on this device isn't this one
  return <AccountButtons solid={solid} signOut={() => signOut().then(forget, () => undefined)} />;
}

function AccountButtons({ solid, signOut }: { solid: boolean; signOut: (() => Promise<void>) | null }) {
  const { offline, deleteData } = useSession();
  const [open, setOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  return (
    <View style={styles.account}>
      {!offline && <Button kind="text" label="Memory" onPress={() => setMemoryOpen(true)} style={!solid && styles.signOut} />}
      <MemorySheet open={memoryOpen} onClose={() => setMemoryOpen(false)} />
      <Button kind="text" label="Your data" onPress={() => setOpen(true)} style={!solid && styles.signOut} />
      {signOut && <Button kind={solid ? "secondary" : "text"} solid={solid} label="Sign out" onPress={() => void signOut()} style={!solid && styles.signOut} />}
      <YourData
        open={open}
        onClose={() => setOpen(false)}
        offline={offline}
        signsOut={signOut !== null}
        onDelete={async () => {
          const problem = await deleteData();
          // the data is gone either way: a sign-out that fails (offline, say) isn't a failed delete
          if (!problem && signOut) await signOut().catch(() => undefined);
          return problem;
        }}
      />
    </View>
  );
}

/** What the app keeps and where a learner's words go, in plain words (the privacy note, #43), and the way to
 * delete it all: one tap, then a confirmation that says what goes. Demo mode keeps nothing. */
const KEPT = "We keep each session (the concept, the notes you pasted, your guess, your answers and questions, the AI's replies and the score) and your level on each of the four parts.";
const TO_CLAUDE = "Your answers and questions go to Claude, Anthropic's model, through our server, which holds the key. The app never has it.";
const MEMORY_KEPT = "Lumente also keeps progress notes the app writes after each session (your level on each part, your guess against your score, how many Helps a part took): never your words. Memory shows them, and Delete my data removes them too.";
const VOICE = "While the mic is on, the audio goes to your device's speech service, which turns it into words: on most Android phones that is Google's, and in a browser the browser's own. Only the words reach us, and only when you send them. We never receive or keep the audio; the speech service handles it under its own terms.";
// what Expo Observe receives (app/_layout.tsx): launch times, each screen's time to interactive, crash reports; phones only
const OBSERVE = "On the Android app, Expo, the service that delivers the app's updates, gets crash reports and how fast the app starts and each screen opens, so we can fix what breaks. We don't send your answers or notes there.";
const DEMO = "Demo mode keeps nothing: this is a recorded session, and what you type stays on this device.";
const WHO_ASKS = "The questions come from an AI. It asks, and it never hands you the answer.";

function YourData({ open, onClose, offline, signsOut, onDelete }: { open: boolean; onClose: () => void; offline: boolean; signsOut: boolean; onDelete: () => Promise<string | null> }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const close = () => {
    if (busy) return;
    setConfirming(false);
    setError(null);
    onClose();
  };
  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const problem = await onDelete();
      if (problem) setError(problem);
      else close();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open={open} onClose={close} label="your data">
      <Title style={styles.sheetTitle}>Your data</Title>
      {offline ? (
        <Body>{DEMO}</Body>
      ) : (
        <>
          <Body>{KEPT}</Body>
          <Small dim>{MEMORY_KEPT}</Small>
          <Small dim>{TO_CLAUDE}</Small>
          <Small dim>{VOICE}</Small>
          <Small dim>{OBSERVE}</Small>
        </>
      )}
      <Small dim>{WHO_ASKS}</Small>
      {!offline &&
        (confirming ? (
          <View style={styles.confirm}>
            <Body>{`This deletes every session and your levels${signsOut ? ", and signs you out" : ""}. It can't be undone.`}</Body>
            {error && <Failure message={error} />}
            <Button label={signsOut ? "Delete and sign out" : "Delete my data"} busy={busy} onPress={() => void remove()} />
            <Button kind="text" label="Keep my data" disabled={busy} onPress={() => setConfirming(false)} />
          </View>
        ) : (
          <Button kind="secondary" label="Delete my data" onPress={() => setConfirming(true)} style={styles.left} />
        ))}
      {/* what is running, so a tester or a judge can say exactly what they saw */}
      <VersionLine />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.xl, gap: space.l },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: size.touch },
  account: { flexDirection: "row", alignItems: "center", gap: space.l },
  signOut: { paddingHorizontal: 0 },
  confirm: { gap: space.m, marginTop: space.s },
  flex: { flex: 1 },
  resume: { gap: space.m },
  resumeHead: { flexDirection: "row", alignItems: "center", gap: space.m },
  maps: { gap: space.m, marginTop: space.l },
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
  actions: { flexDirection: "row", alignItems: "flex-start", gap: space.m, marginTop: space.s },
  heading: { gap: space.m },
  choice: { gap: space.xs, alignItems: "center", flexShrink: 1 },
  choiceLine: { textAlign: "center" },
  tall: { height: 56 },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: page.header },
  spot: { width: "100%", maxWidth: page.map },
});
