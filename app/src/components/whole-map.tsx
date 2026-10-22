// Level 5 (#26, round 9 "Lumente"): back in the dark, the learner builds the whole map alone. The firefly only
// answers facts now ("You ask now"), the learner's questions glow amber, and a tap on a part opens it for writing.
// Help, tapping the firefly, costs a point and gives a hint on the first part that still has one. Submit sends
// the map to the whole-map evaluator. A self-test (the testers' pre-test and post-test) runs here from the start.
import { MOVE_LABEL, MOVE_ORDER, type Item, type Mentefacto, type MoveId, type Turn } from "@build-north/agents";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from "react-native";
import { filledOf, hintPartOf, itemsOf, partMeaningOf, waitingLineOf, wholeMapHelpOf, wholeMapPartsOf, withPart } from "../session/present.ts";
import type { LearnerInput } from "../session/session-context.tsx";
import type { Entry, SessionState } from "../session/transcript.ts";
import { maxContentWidth, parts as PARTS, radius, size, space, type } from "../theme.ts";
import { ConceptMap } from "./concept-map.tsx";
import { Firefly } from "./firefly.tsx";
import { FactCard, Failure, HintCard, LearnerMessage, useSlow, Waiting } from "./messages.tsx";
import { SessionBar } from "./session-bar.tsx";
import { Body, Button, IconButton, KeyboardSafe, Label, PromptField, Reply, Screen, SendButton, Sheet, Small, Title, useColors } from "./ui.tsx";

/** Rows a list part can hold in the editor. */
const MAX_ITEMS = 6;

type Props = {
  turn: Turn;
  state: SessionState;
  send: (input: LearnerInput) => void;
  retry: () => void;
  edit: (draft: Mentefacto) => void;
  onClose: () => void;
};

export function WholeMapScreen({ turn, state, send, retry, edit, onClose }: Props) {
  const scroll = useRef<ScrollViewInstance>(null);
  const [editing, setEditing] = useState<MoveId | null>(null);
  const [confirming, setConfirming] = useState(false);
  const pending = state.pending !== null;
  const slow = useSlow(pending);
  const map = state.draft ?? turn.mentefacto;
  const concept = turn.mentefacto.concept;
  const filled = filledOf(map);
  const submitting = state.pending !== null && "mentefacto" in state.pending;
  const help = wholeMapHelpOf(turn.progress.hintsUsed);
  const desk = deskOf(state.entries);
  // the n-th hint of the session is about a known part, so its card can say which and show the price once
  const hints = desk.filter((e) => e.from === "app" && e.message.kind === "hint").map((e) => e.id);
  const asked = desk.filter((e) => e.from === "learner").length;
  const { failure } = state;
  const saved = failure && "mentefacto" in failure.body ? " Your map is saved." : "";

  return (
    <Screen>
      <SessionBar concept={concept} onClose={onClose} end={<Asked n={asked} />} />
      <KeyboardSafe>
        <ScrollView
          ref={scroll}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        >
          <ConceptMap concept={concept} parts={wholeMapPartsOf(map, turn.mentefacto)} onPartPress={pending ? undefined : setEditing} />
          <View style={styles.status}>
            <Label dim style={styles.flex}>{`${filled} of 4 parts filled. Tap a part to write it.`}</Label>
            <Button kind="secondary" label="Submit" busy={submitting} disabled={pending || filled === 0} hint="Send your map to be scored. The session ends." onPress={() => setConfirming(true)} />
          </View>

          <View style={styles.you}>
            <FireflyHelp help={help} pending={pending} onHelp={() => send({ action: "help" })} />
            <Reply style={styles.flex}>{state.mode === "test" ? "Self-test: you build the map alone. I only answer facts." : "You ask now. I only answer facts."}</Reply>
          </View>

          {desk.map((entry) => {
            if (entry.from === "learner") return <LearnerMessage key={entry.id} text={entry.text} asking />;
            if (entry.from !== "app") return null;
            const { message } = entry;
            if (message.kind === "fact" || message.kind === "redirect") return <FactCard key={entry.id} kind={message.kind} text={message.text} />;
            if (message.kind === "hint") {
              const n = hints.indexOf(entry.id);
              return <HintCard key={entry.id} message={message} n={(n % 4) + 1} capNote={n % 4 === 0} part={PARTS[hintPartOf(n)].label} />;
            }
            return <Body key={entry.id}>{message.text}</Body>;
          })}
          {pending && <Waiting line={waitingLineOf(state.pending)} slow={slow} />}
          {failure && <Failure message={`${failure.message}${saved}`}>{failure.retryable && <Button kind="secondary" label="Try again" onPress={retry} />}</Failure>}
        </ScrollView>
        <AskBar concept={concept} pending={pending} asking={state.pending !== null && "question" in state.pending} onAsk={(question) => send({ question })} />
      </KeyboardSafe>

      {editing && (
        <PartEditor
          key={editing}
          move={editing}
          concept={concept}
          items={itemsOf(map, editing)}
          onDone={(items) => {
            edit(withPart(map, editing, items));
            setEditing(null);
          }}
        />
      )}
      <SubmitSheet
        open={confirming}
        map={map}
        onClose={() => setConfirming(false)}
        onSubmit={() => {
          setConfirming(false);
          send({ mentefacto: { ...map, concept } });
        }}
      />
    </Screen>
  );
}

/** The fact desk's side of the session: the learner's questions, its answers, the hints. The opening instruction
 * is the firefly's line under the map, so it isn't repeated. */
function deskOf(entries: readonly Entry[]): Entry[] {
  return entries.filter((e) => e.from === "learner" || (e.from === "app" && e.phase === "move" && e.message.kind !== "question"));
}

/** One small amber square per question asked, in the top bar. */
function Asked({ n }: { n: number }) {
  const c = useColors();
  if (n === 0) return null;
  const shown = Math.min(n, 6);
  return (
    <View style={styles.asked} role="img" accessibilityLabel={`${n} ${n === 1 ? "question" : "questions"} asked`}>
      {Array.from({ length: shown }, (_, i) => (
        <View key={i} style={[styles.square, { backgroundColor: c.firefly }]} />
      ))}
      {n > shown && <Label style={{ color: c.question }}>{`+${n - shown}`}</Label>}
    </View>
  );
}

/** The firefly beside "You ask now": dim, since the learner leads now, and still Help when tapped. */
function FireflyHelp({ help, pending, onHelp }: { help: ReturnType<typeof wholeMapHelpOf>; pending: boolean; onHelp: () => void }) {
  const c = useColors();
  const drawing = (
    <>
      <Firefly state="fades" size={30} />
      {help && <Text style={[type.tag, { color: c.question }]}>{pending ? "checking" : help.tag}</Text>}
    </>
  );
  if (!help || pending) {
    return (
      <View style={styles.firefly} role={pending ? "status" : undefined}>
        {drawing}
      </View>
    );
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={help.label} onPress={onHelp} hitSlop={size.hitSlop} style={({ pressed }) => [styles.firefly, pressed && styles.pressed]}>
      {drawing}
    </Pressable>
  );
}

/** The question field: it glows amber, because the light is the learner's own now. */
function AskBar({ concept, pending, asking, onAsk }: { concept: string; pending: boolean; asking: boolean; onAsk: (question: string) => void }) {
  const [text, setText] = useState("");
  const question = text.trim();
  const submit = () => {
    if (!question || pending) return;
    onAsk(question);
    setText("");
  };
  return (
    <View style={styles.bar}>
      <PromptField
        glow
        value={text}
        onChangeText={setText}
        placeholder="Ask a question"
        multiline
        maxLength={500}
        editable={!pending}
        accessibilityLabel={`Your question about ${concept}`}
        onSubmitEditing={submit}
        submitBehavior="submit"
        style={pending && styles.dim}
        end={<SendButton amber busy={asking} disabled={!question || pending} onPress={submit} label="Ask" />}
      />
    </View>
  );
}

/** One part of the map, in a sheet: the bigger group is one field; the other parts are lists, and each thing it
 * isn't carries how it differs. Closing the sheet keeps what was typed. */
function PartEditor({ move, concept, items, onDone }: { move: MoveId; concept: string; items: Item[]; onDone: (items: Item[]) => void }) {
  const c = useColors();
  const single = move === "supraordinate";
  const [rows, setRows] = useState<Item[]>(() => (items.length > 0 ? items.map((i) => ({ ...i })) : [{ value: "", note: null }]));
  const change = (i: number, patch: Partial<Item>) => setRows((now) => now.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const remove = (i: number) => setRows((now) => (now.length > 1 ? now.filter((_, j) => j !== i) : [{ value: "", note: null }]));
  const done = () => onDone(rows);
  // no custom line height on these fields: on Android a multiline one would show only its last line
  const field = [styles.input, { fontFamily: type.input.fontFamily, fontSize: type.input.fontSize, color: c.onSurface, backgroundColor: c.surface, borderColor: c.fieldEdge }];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={done}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <Pressable style={[styles.flex, { backgroundColor: c.scrim }]} onPress={done} accessibilityRole="button" accessibilityLabel="Save and close" />
        <View style={[styles.sheet, { backgroundColor: c.surfaceContainer, borderColor: c.fieldEdge }]}>
          <View style={[styles.grabber, { backgroundColor: c.outline }]} />
          <View style={styles.sheetHead}>
            <View style={[styles.flex, styles.sheetTitle]}>
              <Title style={styles.title}>{PARTS[move].label}</Title>
              <Small dim>{partMeaningOf(move, concept)}</Small>
            </View>
            <Button kind="secondary" label="Done" onPress={done} />
          </View>
          <ScrollView contentContainerStyle={styles.rows} keyboardShouldPersistTaps="handled">
            {rows.map((row, i) => (
              <View key={i} style={styles.row}>
                <View style={styles.rowFields}>
                  <TextInput
                    value={row.value}
                    onChangeText={(value) => change(i, { value })}
                    placeholder={PLACEHOLDER[move]}
                    placeholderTextColor={c.placeholder}
                    maxLength={120}
                    autoFocus={i === 0 && row.value === ""}
                    accessibilityLabel={single ? MOVE_LABEL[move] : `${MOVE_LABEL[move]}, item ${i + 1}`}
                    style={field}
                    returnKeyType="done"
                    onSubmitEditing={done}
                  />
                  {move === "exclusion" && (
                    <TextInput
                      value={row.note ?? ""}
                      onChangeText={(note) => change(i, { note })}
                      placeholder="How it's different"
                      placeholderTextColor={c.placeholder}
                      maxLength={200}
                      multiline
                      accessibilityLabel={`How item ${i + 1} is different`}
                      style={[field, styles.note]}
                    />
                  )}
                </View>
                {!single && (rows.length > 1 || row.value !== "") && <IconButton icon="x" label={`Remove item ${i + 1}`} onPress={() => remove(i)} />}
              </View>
            ))}
            {!single && rows.length < MAX_ITEMS && (
              <Button kind="text" label="+ Add another" onPress={() => setRows((now) => [...now, { value: "", note: null }])} style={styles.start} />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const PLACEHOLDER: Record<MoveId, string> = {
  supraordinate: "The group it belongs to",
  exclusion: "Something close that it isn't",
  isoordinate: "Something it needs",
  infraordinate: "One kind of it",
};

/** Submitting ends the session, so it asks once and names the parts still empty. */
function SubmitSheet({ open, map, onClose, onSubmit }: { open: boolean; map: Mentefacto; onClose: () => void; onSubmit: () => void }) {
  const empty = MOVE_ORDER.filter((move) => itemsOf(map, move).length === 0).map((move) => PARTS[move].label);
  const line =
    empty.length === 0
      ? "All four parts get scored, and the session ends."
      : `${empty.join(", ")} ${empty.length === 1 ? "is" : "are"} still empty and ${empty.length === 1 ? "scores" : "score"} 0. The session ends when you submit.`;
  return (
    <Sheet open={open} onClose={onClose} label="the question">
      <Title style={styles.title}>Submit your map?</Title>
      <Body>{line}</Body>
      <Button label="Submit my map" onPress={onSubmit} />
      <Button kind="text" label="Keep building" onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.margin, paddingTop: 26, paddingBottom: space.l, gap: space.l },
  status: { flexDirection: "row", alignItems: "center", gap: space.m, marginTop: space.xs },
  you: { flexDirection: "row", alignItems: "center", gap: space.m, marginTop: space.s },
  firefly: { width: size.iconButton, alignItems: "center", gap: 2 },
  pressed: { opacity: 0.8 },
  asked: { flexDirection: "row", alignItems: "center", gap: space.xs },
  square: { width: 8, height: 8, borderRadius: radius.point },
  bar: { paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.margin },
  dim: { opacity: 0.55 },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: space.margin,
    paddingTop: space.m,
    paddingBottom: space.xxl,
    gap: space.l,
    width: "100%",
    maxWidth: maxContentWidth,
    maxHeight: "85%",
    alignSelf: "center",
  },
  grabber: { alignSelf: "center", width: 36, height: 4, borderRadius: 2 },
  sheetHead: { flexDirection: "row", alignItems: "flex-start", gap: space.m },
  sheetTitle: { gap: space.xs },
  title: { fontSize: 24, lineHeight: 30 },
  rows: { gap: space.m, paddingBottom: space.s },
  row: { flexDirection: "row", alignItems: "flex-start", gap: space.s },
  rowFields: { flex: 1, gap: space.s },
  input: { minHeight: size.button, paddingHorizontal: space.l, paddingVertical: space.m, borderRadius: radius.field, borderWidth: 1 },
  // the difference can run to a sentence, so it wraps instead of scrolling sideways
  note: { maxHeight: 112, textAlignVertical: "top" },
  start: { alignSelf: "flex-start", paddingHorizontal: 0 },
});
