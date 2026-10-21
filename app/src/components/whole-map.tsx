// Level 5 (#26, round 8): you build the whole map alone. Your pair hands over ("you ask now"), the four parts
// are a checks list where tapping a part edits it, and the fact desk below answers questions with facts only.
// Help, in the desk's header, costs a point and gives a hint on the first part that still has one. Submit,
// in the top bar, sends the map to the whole-map evaluator. A self-test (the testers' pre-test and
// post-test) runs here from the start.
import { MOVE_LABEL, MOVE_ORDER, type Item, type Mentefacto, type MoveId, type Turn } from "@build-north/agents";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from "react-native";
import { filledOf, firstOnPart, hintPartOf, itemsOf, partMeaningOf, waitingLineOf, wholeMapHelpLabelOf, withPart, type Check } from "../session/present.ts";
import type { LearnerInput } from "../session/session-context.tsx";
import type { Entry, SessionState } from "../session/transcript.ts";
import { maxContentWidth, radius, size, space, type } from "../theme.ts";
import { ChecksList } from "./checks.tsx";
import { SendButton } from "./composer.tsx";
import { AppMessage, Ask, Failure, Thinking, useSlow } from "./messages.tsx";
import { SessionBar } from "./session-bar.tsx";
import { Body, Button, IconButton, KeyboardSafe, Label, PromptField, Screen, SheetTitle, useColors } from "./ui.tsx";

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
  const c = useColors();
  const deskScroll = useRef<ScrollViewInstance>(null);
  const [editing, setEditing] = useState<MoveId | null>(null);
  const [confirming, setConfirming] = useState(false);
  const slow = useSlow(state.pending !== null);
  const map = state.draft ?? turn.mentefacto;
  const concept = turn.mentefacto.concept;
  const filled = filledOf(map);
  const pending = state.pending !== null;
  const submitting = state.pending !== null && "mentefacto" in state.pending;
  const help = wholeMapHelpLabelOf(turn.progress.hintsUsed);
  const desk = deskOf(state.entries);
  // the n-th hint of the session is about a known part, so its card can say which and show the price once
  const hints = desk.filter((e) => e.from === "app" && e.message.kind === "hint").map((e) => e.id);
  const { failure } = state;
  const saved = failure && "mentefacto" in failure.body ? " Your map is saved." : "";
  const parts: Check[] = MOVE_ORDER.map((move) => {
    const items = itemsOf(map, move);
    return { move, label: MOVE_LABEL[move], state: "queued", meta: items.length > 0 ? items.map((i) => i.value).join(", ") : "empty" };
  });

  return (
    <Screen>
      <SessionBar
        concept={concept}
        onClose={onClose}
        end={<Button compact label="Submit" busy={submitting} disabled={pending || filled === 0} hint="Send your map to be scored. The session ends." onPress={() => setConfirming(true)} />}
      />
      <KeyboardSafe>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Ask
            label="you ask now"
            pairSide="right"
            text={state.mode === "test" ? `Self-test: build the map of ${concept} on your own. Ask me any facts you need.` : `Build the map of ${concept} yourself. Ask me any facts you need.`}
          />
          <ChecksList checks={parts} onPress={pending ? undefined : (part) => setEditing(part.move)} />
          <Label dim>{`// ${filled}/4 parts filled. tap a part to fill it in, then submit`}</Label>
        </ScrollView>

        <View style={[styles.desk, { backgroundColor: c.surfaceContainer, borderColor: c.outline }]}>
          <View style={[styles.grabber, { backgroundColor: c.outline }]} />
          <View style={styles.deskHead}>
            <View style={styles.flex}>
              <SheetTitle>Fact desk</SheetTitle>
              <Label dim>facts only</Label>
            </View>
            {help && (
              <Button
                kind="hint"
                icon="bulb"
                label={help}
                hint={help.includes("pt") ? "Costs a point: the part it helps with can then score 1 at most" : undefined}
                disabled={pending}
                onPress={() => send({ action: "help" })}
              />
            )}
          </View>
          <ScrollView
            ref={deskScroll}
            style={styles.deskList}
            contentContainerStyle={styles.deskContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => deskScroll.current?.scrollToEnd({ animated: true })}
          >
            {desk.length === 0 && !pending && <Label dim>{"// it answers facts about the concept. it won't fill in your map"}</Label>}
            {desk.map((entry) => {
              if (entry.from === "learner") return <DeskQuestion key={entry.id} text={entry.text} />;
              if (entry.from !== "app") return null;
              const n = hints.indexOf(entry.id);
              return <AppMessage key={entry.id} message={entry.message} part={n >= 0 ? MOVE_LABEL[hintPartOf(n)] : undefined} firstHint={n >= 0 && firstOnPart(n)} />;
            })}
            {state.pending && <Thinking line={slow ? "taking longer than usual…" : waitingLineOf(state.pending)} />}
            {failure && (
              <Failure message={`${failure.message}${saved}`}>{failure.retryable && <Button kind="secondary" label="Try again" onPress={retry} />}</Failure>
            )}
          </ScrollView>
          <AskField concept={concept} pending={pending} asking={state.pending !== null && "question" in state.pending} onAsk={(question) => send({ question })} />
        </View>
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

/** The fact desk's side of the session: your questions, its answers, the hints. The opening instruction is
 * your pair's line above the parts, so it isn't repeated. */
function deskOf(entries: readonly Entry[]): Entry[] {
  return entries.filter((e) => e.from === "learner" || (e.from === "app" && e.phase === "move" && e.message.kind !== "question"));
}

/** Your question to the desk, after a `›` prompt as you typed it. */
function DeskQuestion({ text }: { text: string }) {
  const c = useColors();
  return (
    <View style={styles.question}>
      <Text style={[type.code, { color: c.onSurfaceVariant }]}>›</Text>
      <Body style={styles.flex}>{text}</Body>
    </View>
  );
}

/** The question field at the bottom of the fact desk. */
function AskField({ concept, pending, asking, onAsk }: { concept: string; pending: boolean; asking: boolean; onAsk: (question: string) => void }) {
  const [text, setText] = useState("");
  const question = text.trim();
  const submit = () => {
    if (!question || pending) return;
    onAsk(question);
    setText("");
  };
  return (
    <PromptField
      value={text}
      onChangeText={setText}
      placeholder="Ask the fact desk"
      multiline
      maxLength={500}
      editable={!pending}
      accessibilityLabel={`Your question about ${concept} for the fact desk`}
      onSubmitEditing={submit}
      submitBehavior="submit"
      end={<SendButton busy={asking} disabled={!question || pending} onPress={submit} label="Ask" />}
    />
  );
}

/** One part of the map, in a sheet: the bigger group is one field; the other parts are lists, and each
 * thing it isn't carries how it differs. Closing the sheet keeps what was typed. */
function PartEditor({ move, concept, items, onDone }: { move: MoveId; concept: string; items: Item[]; onDone: (items: Item[]) => void }) {
  const c = useColors();
  const single = move === "supraordinate";
  const [rows, setRows] = useState<Item[]>(() => (items.length > 0 ? items.map((i) => ({ ...i })) : [{ value: "", note: null }]));
  const change = (i: number, patch: Partial<Item>) => setRows((now) => now.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const remove = (i: number) => setRows((now) => (now.length > 1 ? now.filter((_, j) => j !== i) : [{ value: "", note: null }]));
  const done = () => onDone(rows);
  const field = [type.body, styles.input, { color: c.onSurface, backgroundColor: c.surfaceHigh, borderColor: c.outline }];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={done}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <Pressable style={[styles.flex, { backgroundColor: c.scrim }]} onPress={done} accessibilityRole="button" accessibilityLabel="Save and close" />
        <View style={[styles.sheet, { backgroundColor: c.surfaceContainer }]}>
          <View style={[styles.grabber, { backgroundColor: c.outline }]} />
          <View style={styles.sheetHead}>
            <View style={[styles.flex, styles.sheetTitle]}>
              <SheetTitle>{MOVE_LABEL[move]}</SheetTitle>
              <Body dim>{partMeaningOf(move, concept)}</Body>
            </View>
            <Button compact label="Done" onPress={done} />
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
              <Button kind="text" icon="plus" label="Add another" onPress={() => setRows((now) => [...now, { value: "", note: null }])} style={styles.start} />
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
  const c = useColors();
  const empty = MOVE_ORDER.filter((move) => itemsOf(map, move).length === 0).map((move) => MOVE_LABEL[move]);
  const line =
    empty.length === 0
      ? "Your tutor scores all four parts, and the session ends."
      : `${empty.join(", ")} ${empty.length === 1 ? "is" : "are"} still empty and ${empty.length === 1 ? "scores" : "score"} 0. The session ends when you submit.`;
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.flex, { backgroundColor: c.scrim }]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Keep building" />
      <View style={[styles.sheet, { backgroundColor: c.surfaceContainer }]}>
        <View style={[styles.grabber, { backgroundColor: c.outline }]} />
        <SheetTitle>Submit your map?</SheetTitle>
        <Body>{line}</Body>
        <View style={styles.confirm}>
          <Button label="Submit my map" onPress={onSubmit} />
          <Button kind="secondary" label="Keep building" onPress={onClose} style={styles.center} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.margin, paddingTop: space.l, paddingBottom: space.l, gap: space.l },
  // the desk never takes more than half the screen, so the parts stay in view
  desk: {
    maxHeight: "50%",
    paddingHorizontal: space.margin,
    paddingTop: space.s,
    paddingBottom: space.m,
    gap: space.m,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  grabber: { alignSelf: "center", width: 36, height: 4, borderRadius: 2 },
  deskHead: { flexDirection: "row", alignItems: "center", gap: space.m },
  deskList: { flexShrink: 1 },
  deskContent: { gap: space.m },
  question: { flexDirection: "row", alignItems: "baseline", gap: space.s },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space.margin,
    paddingTop: space.m,
    paddingBottom: space.xxl,
    gap: space.l,
    width: "100%",
    maxWidth: maxContentWidth,
    maxHeight: "85%",
    alignSelf: "center",
  },
  sheetHead: { flexDirection: "row", alignItems: "flex-start", gap: space.m },
  sheetTitle: { gap: space.xs },
  rows: { gap: space.m, paddingBottom: space.s },
  row: { flexDirection: "row", alignItems: "flex-start", gap: space.s },
  rowFields: { flex: 1, gap: space.s },
  input: { minHeight: size.button, paddingHorizontal: space.l, paddingVertical: space.m, borderRadius: radius.field, borderWidth: StyleSheet.hairlineWidth },
  // the difference can run to a sentence, so it wraps instead of scrolling sideways; on Android a custom
  // line height or centering makes a multiline field show only its last line
  note: { maxHeight: 112, textAlignVertical: "top" },
  start: { alignSelf: "flex-start", paddingHorizontal: 0 },
  confirm: { gap: space.m, paddingTop: space.s },
  center: { alignSelf: "center" },
});
