// Start (round 9 "Lumente"): one task, pick a concept and start. The top bar holds the two places to go, "Your
// concepts" and "Account" (Memory, Your data, Sign out in one sheet). A concept is picked from four chips or typed;
// "Use your own project (optional)" opens, in place, the prompt for a coding agent and the notes field (pasted text
// only, up to 8,000 characters: decision 12), so the concepts can come from the learner's own project; notes that
// look like a key or a password never leave the phone. The learner picks how to start, guided by default or "Test
// myself" (the whole map alone, the testers' pre-test and post-test), and one button starts it, naming the mode.
// Every session the learner didn't finish is in Your concepts, alongside completed maps for read-only review; Start
// keeps one quick resume. In the website layout the choices are a column on the left and the code and the map stand
// on the right; on a phone the code and the map follow the choices.
import type { SessionMode, SessionSummary } from "@build-north/agents";
import { useAuth } from "@clerk/expo";
import { ObserveInteractiveMarker } from "expo-observe";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Platform, ScrollView, Share, StyleSheet, Text, TextInput, View, type ViewStyle } from "react-native";
import { CodePreview } from "../components/code-preview.tsx";
import { Icon } from "../components/icons.tsx";
import { MemorySheet } from "../components/memory-sheet.tsx";
import { Failure } from "../components/messages.tsx";
import { SiteHeader } from "../components/site-header.tsx";
import { AnimatedPressable, Body, Button, Card, Chip, KeyboardSafe, Label, PromptField, Rise, Screen, Sheet, Small, Title, useColors, usePageTitle, usePress, useWide } from "../components/ui.tsx";
import { UpdateNotice } from "../components/update-notice.tsx";
import { VersionLine } from "../components/version-line.tsx";
import { AI_PROMPT, CHIPS, resumeLineOf, secretLineOf } from "../session/present.ts";
import { clerkKey } from "../session/config.ts";
import { useSession } from "../session/session-context.tsx";
import { brand, page, pageMetadata, radius, size, space, type } from "../theme.ts";

const MAX_CONCEPT = 100;
const MAX_NOTES = 8000;

const TITLE = `${brand.name}: can you explain the ideas behind the code your AI wrote?`;

/** The web page's title, description and card, in the static HTML, so a shared link previews well. */
export function generateMetadata() {
  return pageMetadata(TITLE, `${SUBTITLE} ${GUIDED} Or you lead the investigation.`);
}

/** Start's words (Cynthia, Oct 23): the question, the line under it, and what each way to start means. */
const QUESTION = "Can you explain the ideas behind the code your AI wrote?";
const SUBTITLE = "Choose a concept and start figuring it out.";
const GUIDED = "Answer questions. Your map fills as you go.";
const ALONE = "Write on the map. Ask facts if you need them.";
// Your concepts says the same while an answer is on its way
const STILL_SAVING = "Your current answer is still being saved. Wait for it before starting another session.";
const ALONE_HINT = "Write your answers in the four map areas. The optional chat answers factual questions. Your levels don't change.";

/** One way to start, picked before the one Start button, with what it means under its name. The picked one is amber,
 * like a picked chip. */
function ModeOption({ label, line, hint, selected, onPress, style }: { label: string; line: string; hint: string; selected: boolean; onPress: () => void; style?: ViewStyle | false }) {
  const c = useColors();
  const { hovered, bind, feel } = usePress();
  return (
    <AnimatedPressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: selected }}
      // react-native-web drops accessibilityState, as on Chip
      {...(Platform.OS === "web" ? ({ "aria-checked": selected } as object) : {})}
      onPress={onPress}
      {...bind}
      style={[styles.row, style, selected ? { backgroundColor: "rgba(242, 184, 75, 0.16)", borderColor: c.firefly } : { backgroundColor: c.controlFill, borderColor: hovered ? c.onSurfaceVariant : c.outline }, feel(true, hovered)]}
    >
      <View style={[styles.dot, { borderColor: selected ? c.firefly : c.onSurfaceVariant }]}>{selected && <View style={[styles.dotFill, { backgroundColor: c.firefly }]} />}</View>
      <View style={styles.rowWords}>
        <Text style={[type.button, { color: selected ? c.question : c.onSurface }]}>{label}</Text>
        <Small dim>{line}</Small>
      </View>
    </AnimatedPressable>
  );
}

/** The prompt for a coding agent: copied on the web, shared on a phone (the copy button needs a native module, which
 * waits for the next build). */
async function copyPrompt(): Promise<"copied" | "refused" | "shared"> {
  if (Platform.OS !== "web") {
    await Share.share({ message: AI_PROMPT }).catch(() => undefined);
    return "shared";
  }
  const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
  const ok = clipboard ? await clipboard.writeText(AI_PROMPT).then(() => true, () => false) : false;
  return ok ? "copied" : "refused";
}

export default function StartScreen() {
  usePageTitle(TITLE);
  const router = useRouter();
  const c = useColors();
  const wide = useWide();
  const { start, offline, state, history, refresh, resume, sessionsNow } = useSession();
  const [concept, setConcept] = useState<string>("API");
  const [notes, setNotes] = useState("");
  const [ownOpen, setOwnOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<SessionMode>("learn");
  const [starting, setStarting] = useState<SessionMode | null>(null);
  const [resuming, setResuming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  // a result on screen is finished, even while the coach's words are on their way
  const unfinished = state.turn && state.turn.expects !== "none" && state.turn.phase !== "result" ? state.turn : null;
  // the card on screen says what the listed ones say, so a reload doesn't change it (B12); a session started since the
  // list was read isn't on it yet, and it started today
  const onScreenLine = unfinished ? resumeLineOf(history?.find((s) => s.id === unfinished.sessionId) ?? { mode: state.mode, createdAt: new Date().toISOString() }) : "";
  // A Start or a Resume that finishes after the learner has left Start (Your concepts, a session) opens nothing: leaving
  // moves `navigation` on, and coming back clears the busy buttons (code review, Oct 26; Your concepts does the same).
  const focused = useRef(false);
  const navigation = useRef(0);
  const current = (version: number) => focused.current && version === navigation.current;
  // a read a newer one replaced answers undefined: the newer one's answer is the one to show
  const listRead = useCallback((problem: string | null | undefined) => {
    if (problem !== undefined) setListError(problem);
  }, []);
  // the server's list, read again each time Start shows (a session just finished is on it), so the sessions
  // to pick up (the one on screen has its own card) and the finished maps are the learner's whole record
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setStarting(null);
      setResuming(null);
      void refresh().then(listRead);
      return () => {
        focused.current = false;
        navigation.current++;
      };
    }, [refresh, listRead]),
  );
  const keptOf = (list: readonly SessionSummary[] | null) => list?.filter((s) => !s.finished && s.id !== state.turn?.sessionId) ?? [];
  const kept = keptOf(history);
  const recent = kept[0];
  const busy = starting !== null || resuming !== null;
  const secretLine = secretLineOf(notes);
  const secret = secretLine !== null;
  const name = concept.trim();
  const picked = CHIPS.find((chip) => chip === name) ?? null;
  // A concept the learner already has a session going on, in the same mode, goes on from where it stopped instead of
  // starting over beside it (Leo, Oct 24: picking a topic he had worked on showed none of it). A finished one starts
  // fresh, and its map stays under "Your maps".
  const ongoing = (mode: SessionMode, list = kept): "on screen" | SessionSummary | null => {
    const same = (other: string, otherMode: SessionMode) => otherMode === mode && other.trim().toLowerCase() === name.toLowerCase();
    if (unfinished && same(unfinished.mentefacto.concept, state.mode)) return "on screen";
    return list.find((s) => same(s.concept, s.mode)) ?? null;
  };
  const going = { learn: ongoing("learn"), test: ongoing("test") };
  const pickingUp = (session: ReturnType<typeof ongoing>) => session !== null && session !== "on screen" && resuming === session.id;

  const begin = async (mode: SessionMode) => {
    if (!name || busy || secret) return;
    // the session on screen goes on, its answer on its way or not
    if (ongoing(mode) === "on screen") return router.push("/session");
    // another one would take its place, and an answer still on its way would have nowhere to come back to (code review, Oct 28)
    if (state.pending) {
      setError(STILL_SAVING);
      return;
    }
    const version = ++navigation.current;
    setStarting(mode);
    setError(null);
    // Going on with an unfinished session of this concept or starting one depends on the list, so a list Start doesn't
    // have yet (still loading, or its read failed) is read first: starting blind would put a second unfinished
    // session beside the first (code review, Oct 26). A read that fails starts one anyway: a second session beats
    // none at all (code review, Oct 28).
    let list = kept;
    if (history === null && !offline) {
      const read = await sessionsNow();
      if (!current(version)) return;
      if ("sessions" in read) list = keptOf(read.sessions);
    }
    const session = ongoing(mode, list);
    if (session) setStarting(null);
    if (session === "on screen") return router.push("/session");
    if (session) return pickUp(session);
    const problem = await start({ concept: name, ...(notes.trim() ? { material: notes } : {}), ...(mode === "test" ? { mode } : {}) });
    if (!current(version)) return;
    setStarting(null);
    if (problem) setError(problem);
    else router.push("/session");
  };
  const pickUp = async (session: SessionSummary) => {
    if (busy) return;
    if (state.pending) {
      setError(STILL_SAVING);
      return;
    }
    const version = ++navigation.current;
    setResuming(session.id);
    setError(null);
    const problem = await resume(session);
    if (!current(version)) return;
    setResuming(null);
    if (problem) setError(problem);
    else router.push("/session");
  };

  // demo mode has no self-test (fixture-client.ts replays one guided session)
  const chosen: SessionMode = offline ? "learn" : mode;
  const session = going[chosen];
  // the one button names the mode it starts, so it stays clear when the choices scroll away on a phone; a concept
  // with a session going on in that mode continues it
  const startLabel = !name ? "Pick a concept" : chosen === "test" ? (session ? "Continue self-test" : "Start self-test") : session ? "Continue with guidance" : "Start with guidance";
  const startButton = (
    <Button
      label={startLabel}
      hint={session ? `Picks up your ${name} ${chosen === "test" ? "self-test" : "session"} where you left it` : chosen === "test" ? ALONE_HINT : GUIDED}
      fit={wide}
      busy={starting === chosen || pickingUp(session)}
      disabled={!name || secret || busy}
      onPress={() => void begin(chosen)}
    />
  );
  const modes = !offline && (
    <Rise order={4}>
      <View accessibilityRole="radiogroup" accessibilityLabel="How do you want to start?" style={styles.modes}>
        <Label dim>How do you want to start?</Label>
        {/* side by side in the website layout, so the Start button stays above a laptop's fold */}
        <View style={[styles.modes, wide && styles.modeRow]}>
          <ModeOption label="Explore with guidance" line={GUIDED} hint={GUIDED} selected={mode === "learn"} onPress={() => setMode("learn")} style={wide && styles.modeWide} />
          <ModeOption label="Test myself" line={ALONE} hint={ALONE_HINT} selected={mode === "test"} onPress={() => setMode("test")} style={wide && styles.modeWide} />
        </View>
      </View>
    </Rise>
  );
  const copyLabel = Platform.OS !== "web" ? "Share the prompt" : copied ? "Copied" : "Copy the prompt";
  const getPrompt = async () => {
    const outcome = await copyPrompt();
    // a browser that refuses the clipboard gets the prompt to select by hand
    if (outcome === "refused") setAskOpen(true);
    setCopied(outcome === "copied");
  };
  const keyWarning = secret && <Failure message={`Line ${secretLine} looks like it has a key, a token or a password. Take it out before you start: your notes go to the AI.`} />;
  // the choices, in the order both layouts read them
  const choices = (
    <>
      {listError && (
        <View style={styles.resume}>
          <Small dim>{`Couldn't load saved concepts. ${listError}`}</Small>
          <Button kind="text" label="Try again" onPress={() => void refresh().then(listRead)} style={styles.left} />
        </View>
      )}
      {unfinished && (
        <Rise order={1}>
          <Card style={styles.resumeCard}>
            <View style={styles.resumeWords}>
              <Body>{unfinished.mentefacto.concept}</Body>
              <Small dim>{onScreenLine}</Small>
            </View>
            <Button kind="secondary" label="Resume" disabled={busy} onPress={() => router.push("/session")} />
          </Card>
        </Rise>
      )}
      {!unfinished && recent && (
        <Rise order={1}>
          <Card style={styles.resumeCard}>
            <View style={styles.resumeWords}>
              <Body>{recent.concept}</Body>
              <Small dim>{resumeLineOf(recent)}</Small>
            </View>
            <Button kind="secondary" label="Resume" hint={`Continue your ${recent.concept} session`} busy={resuming === recent.id} disabled={busy} onPress={() => void pickUp(recent)} />
          </Card>
        </Rise>
      )}
      {/* demo mode replays one recorded session, on API, whatever is picked (fixture-client.ts): it offers that
          concept alone, so a tap on "CORS" never opens a session about API */}
      {offline && <Label dim>Demo mode: a recorded session on API</Label>}
      <Rise order={2} style={styles.chips}>
        {(offline ? CHIPS.slice(0, 1) : CHIPS).map((chip) => (
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
            onSubmitEditing={() => void begin(chosen)}
          />
        </Rise>
      )}
      {/* one optional path, opened in place: the two steps belong to the form the Start button sends, so what was
          pasted stays in view (a sheet would hide it); once open it stays open */}
      {ownOpen ? (
        <View style={styles.own}>
          <Label dim>Use your own project (optional)</Label>
          <Small dim>1. Ask your coding agent which concepts your project uses. Paste the prompt into Claude Code, Cursor or Copilot inside your project.</Small>
          <Button kind="secondary" label={copyLabel} onPress={() => void getPrompt()} />
          <Small dim>2. Paste its answer here, or notes from your class.</Small>
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
          {wide && keyWarning}
        </View>
      ) : (
        <Rise order={3}>
          <Button kind="text" label="Use your own project (optional)" hint="A prompt for your coding agent, then a place to paste its answer or your notes" onPress={() => setOwnOpen(true)} style={styles.left} />
        </Rise>
      )}
      {modes}
      {error && <Failure message={error} />}
    </>
  );
  const sheet = <AskYourAi open={askOpen} onClose={() => setAskOpen(false)} />;
  // the two places to go from Start, in its top bar: with two, both stay in sight (a menu would hide them)
  const places = (
    <View style={styles.places}>
      {!offline && <ConceptsEntry wide={wide} />}
      <Account solid={wide} />
    </View>
  );

  if (wide) {
    return (
      <Screen>
        <SiteHeader end={places} />
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
              {startButton}
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
            {places}
          </View>
          <Rise order={1} style={styles.heading}>
            <Title>{QUESTION}</Title>
            <Body dim>{SUBTITLE}</Body>
          </Rise>
          {choices}
          <Rise order={5} style={styles.preview}>
            <CodePreview concept={name} />
          </Rise>
        </ScrollView>
        <View style={styles.foot}>
          {/* on the phone the key warning sits by the button it turns off: under the notes, the sticky foot hid it (B18) */}
          {keyWarning}
          {startButton}
        </View>
      </KeyboardSafe>
      {sheet}
      <ObserveInteractiveMarker />
    </Screen>
  );
}

/** The prompt for a browser that refused the clipboard: the text to select and copy by hand. */
function AskYourAi({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = useColors();
  return (
    <Sheet open={open} onClose={onClose} label="the prompt">
      <Title style={styles.sheetTitle}>Copy the prompt</Title>
      <Small dim>{"Your browser didn't let us copy it. Select the text and copy it, then paste it into Claude Code, Cursor or Copilot inside your project."}</Small>
      <View style={[styles.prompt, { backgroundColor: c.codeFill, borderColor: c.fieldEdge }]}>
        <Text selectable style={[type.label, styles.promptText, { color: c.onSurface }]}>
          {AI_PROMPT}
        </Text>
      </View>
      <Button label="Done" onPress={onClose} />
    </Sheet>
  );
}

/** Same control as Account, so the two sit on one line in the header. */
function ConceptsEntry({ wide }: { wide: boolean }) {
  const router = useRouter();
  return <Button kind={wide ? "secondary" : "text"} solid={wide} label="Your concepts" hint="Resume a session or review a completed map" onPress={() => router.push("/concepts")} style={!wide && styles.bare} />;
}

/** One place in the Account sheet, with what it holds under its name. */
function AccountItem({ label, line, onPress }: { label: string; line: string; onPress: () => void }) {
  const c = useColors();
  const { hovered, bind, feel } = usePress();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={line}
      onPress={onPress}
      {...bind}
      style={[styles.row, { backgroundColor: c.controlFill, borderColor: hovered ? c.onSurfaceVariant : c.outline }, feel(true, hovered)]}
    >
      <View style={styles.rowWords}>
        <Text style={[type.button, { color: c.onSurface }]}>{label}</Text>
        <Small dim>{line}</Small>
      </View>
      <Icon name="right" color={c.onSurfaceVariant} />
    </AnimatedPressable>
  );
}

/** "Account" in Start's top bar opens one sheet: "Memory" (what Lumente remembers, #112), "Your data" (what is kept,
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
  return <AccountButtons solid={solid} signOut={() => signOut().then(forget)} />;
}

function AccountButtons({ solid, signOut }: { solid: boolean; signOut: (() => Promise<void>) | null }) {
  const { offline, deleteData } = useSession();
  const [accountOpen, setAccountOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const leave = async (dataDeleted = false) => {
    if (!signOut || signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
    } catch {
      setAccountOpen(false);
      setSignOutError(dataDeleted ? "Your data was deleted, but we couldn't sign you out. Try signing out again." : "Couldn't sign out. Check your connection and try again.");
    } finally {
      setSigningOut(false);
    }
  };
  // one sheet at a time: the account sheet closes before the one it opens
  const go = (next: () => void) => {
    setAccountOpen(false);
    next();
  };
  return (
    <>
      <Button kind={solid ? "secondary" : "text"} solid={solid} label="Account" hint={offline ? "Your data" : signOut ? "Memory, your data and sign out" : "Memory and your data"} onPress={() => setAccountOpen(true)} style={!solid && styles.bare} />
      <Sheet open={accountOpen} onClose={() => setAccountOpen(false)} label="your account">
        <Title style={styles.sheetTitle}>Account</Title>
        {!offline && <AccountItem label="Memory" line="What Lumente remembers about your progress" onPress={() => go(() => setMemoryOpen(true))} />}
        <AccountItem label="Your data" line="What we keep, and how to delete it" onPress={() => go(() => setOpen(true))} />
        {signOut && <Button kind="secondary" label="Sign out" busy={signingOut} onPress={() => void leave()} />}
      </Sheet>
      <MemorySheet open={memoryOpen} onClose={() => setMemoryOpen(false)} />
      <Sheet open={signOutError !== null} onClose={() => setSignOutError(null)} label="Sign out">
        <Title style={styles.sheetTitle}>Sign out</Title>
        {signOutError && <Failure message={signOutError} />}
        <Button label="Try signing out again" busy={signingOut} onPress={() => void leave()} />
      </Sheet>
      <YourData
        open={open}
        onClose={() => setOpen(false)}
        offline={offline}
        signsOut={signOut !== null}
        onDelete={async () => {
          const problem = await deleteData();
          // the data is gone either way: a sign-out that fails (offline, say) isn't a failed delete
          if (!problem && signOut) await leave(true);
          return problem;
        }}
      />
    </>
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
    <Sheet open={open} onClose={close} label="your data" reading>
      <Title style={styles.sheetTitle}>Your data</Title>
      <ScrollView style={styles.dataScroll} contentContainerStyle={styles.dataContent}>
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
              <Body>{`This deletes every session, your levels and progress memory${signsOut ? ", and signs you out" : ""}. It can't be undone.${signsOut ? " Your sign-in account stays." : ""}`}</Body>
              {error && <Failure message={error} />}
              <Button label={signsOut ? "Delete and sign out" : "Delete my data"} busy={busy} onPress={() => void remove()} />
              <Button kind="text" label="Keep my data" disabled={busy} onPress={() => setConfirming(false)} />
            </View>
          ) : (
            <Button kind="secondary" label="Delete my data" onPress={() => setConfirming(true)} style={styles.left} />
          ))}
        {/* what is running, so a tester or a judge can say exactly what they saw */}
        <VersionLine />
      </ScrollView>
      <Button kind="secondary" label="Back to Start" disabled={busy} onPress={close} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.xl, gap: space.l },
  top: { flexDirection: "row", flexWrap: "wrap", columnGap: space.l, rowGap: space.xs, alignItems: "center", justifyContent: "space-between", minHeight: size.touch },
  places: { flexDirection: "row", alignItems: "center", gap: space.s },
  bare: { paddingHorizontal: 0 },
  confirm: { gap: space.m, marginTop: space.s },
  resume: { gap: space.m },
  resumeCard: { flexDirection: "row", alignItems: "center", gap: space.l },
  resumeWords: { flex: 1, minWidth: 0, gap: space.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.s },
  left: { alignSelf: "flex-start", paddingHorizontal: 0 },
  own: { gap: space.s },
  modes: { gap: space.s },
  modeRow: { flexDirection: "row" },
  modeWide: { flex: 1, flexBasis: 0, alignItems: "flex-start", paddingHorizontal: space.m },
  row: { flexDirection: "row", alignItems: "center", gap: space.m, minHeight: size.touch, paddingHorizontal: space.l, paddingVertical: space.m, borderRadius: radius.field, borderWidth: 1 },
  rowWords: { flex: 1, minWidth: 0, gap: space.xs },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  dotFill: { width: 10, height: 10, borderRadius: 5 },
  // no custom line height on a multiline field: Android would show only its last line
  notes: { fontFamily: type.input.fontFamily, fontSize: type.input.fontSize, minHeight: 140, paddingHorizontal: space.l, paddingVertical: space.m, borderRadius: radius.field, borderWidth: 1, textAlignVertical: "top" },
  count: { alignSelf: "flex-end" },
  foot: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.m, gap: space.xs },
  sheetTitle: { fontSize: 24, lineHeight: 30 },
  dataScroll: { flex: 1, minHeight: 0 },
  dataContent: { gap: space.l, paddingBottom: space.s },
  prompt: { borderRadius: radius.field, borderWidth: 1, padding: space.l },
  promptText: { lineHeight: 18 },
  split: { flex: 1, flexDirection: "row", gap: page.gap, paddingHorizontal: page.gutter },
  words: { width: page.words, flexGrow: 0 },
  wordsContent: { flexGrow: 1, justifyContent: "center", paddingTop: space.xxl, paddingBottom: page.header, gap: space.l },
  actions: { flexDirection: "row", alignItems: "flex-start", gap: space.m, marginTop: space.s },
  heading: { gap: space.m },
  preview: { marginTop: space.l },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: page.header },
  spot: { width: "100%", maxWidth: page.map },
});
