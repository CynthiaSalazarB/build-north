// Level 5 (#26, round 6): the learner builds the whole map alone. The map sits on top, one node per part
// around the concept, and tapping a part edits it. Below, the fact desk answers questions with facts only,
// and Help (it costs a point) gives a hint on the first part that still has one. Submit sends the map to
// the whole-map evaluator. A self-test (the testers' pre-test and post-test) runs here from the start.
import { MOVE_LABEL, MOVE_ORDER, type Item, type Mentefacto, type MoveId, type Turn } from "@build-north/agents";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance, type StyleProp, type ViewStyle } from "react-native";
import { filledOf, hintPartOf, itemsOf, partMeaningOf, waitingLineOf, wholeMapHelpLabelOf, withPart } from "../session/present.ts";
import type { LearnerInput } from "../session/session-context.tsx";
import type { Entry, SessionState } from "../session/transcript.ts";
import { palette, radius, size, space, type } from "../theme.ts";
import { SendButton } from "./composer.tsx";
import { Icon } from "./icons.tsx";
import { AppMessage, Failure, LearnerMessage, Thinking, useSlow } from "./messages.tsx";
import { Body, Button, CircleButton, Footnote, KeyboardSafe, Screen, StageChip, Title, Ui, useColors } from "./ui.tsx";

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
  const scroll = useRef<ScrollViewInstance>(null);
  // the conversation follows a new answer, but editing the map doesn't pull the screen down
  const follow = useRef(false);
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
  // the n-th hint of the session is about a known part, so its card can say which
  const hintParts = new Map(desk.filter((e) => e.from === "app" && e.message.kind === "hint").map((e, n) => [e.id, MOVE_LABEL[hintPartOf(n)]]));
  const { failure } = state;
  const saved = failure && "mentefacto" in failure.body ? " Your map is saved." : "";

  const ask = (input: LearnerInput) => {
    follow.current = true;
    send(input);
  };
  const open = (move: MoveId) => {
    follow.current = false;
    setEditing(move);
  };

  return (
    <Screen tone="day">
      <View style={styles.bar}>
        <CircleButton icon="x" label="Close and save" onPress={onClose} />
        <View style={styles.barMiddle}>
          <StageChip level={5} />
        </View>
        <Button compact label="Submit" busy={submitting} disabled={pending || filled === 0} hint="Send your map to be scored. The session ends." onPress={() => setConfirming(true)} />
      </View>

      <KeyboardSafe>
        <ScrollView
          ref={scroll}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => follow.current && scroll.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.head}>
            <Title style={styles.capitalized} numberOfLines={2}>
              {concept}
            </Title>
            <Footnote dim>{`${filled} of 4 parts filled`}</Footnote>
          </View>
          <Body>
            {state.mode === "test"
              ? "Self-test: fill in all four parts on your own, then submit. Ask the fact desk any fact you need."
              : "Fill in all four parts on your own, then submit. Ask the fact desk any fact you need."}
          </Body>

          <MapDiagram map={map} concept={concept} disabled={pending} onEdit={open} />

          <View style={[styles.desk, { backgroundColor: c.surfaceContainer }]}>
            <View style={[styles.grabber, { backgroundColor: c.placeholder }]} />
            <View style={styles.deskHead}>
              <View style={styles.deskTitle}>
                <Ui strong>Ask a Fact</Ui>
                <Footnote dim>Facts only. Your tutor won't fill in the map.</Footnote>
              </View>
              {help && (
                <Button
                  kind="hint"
                  icon="sun"
                  label={help}
                  hint={help.includes("pt") ? "Costs a point: the part it helps with can then score 1 at most" : undefined}
                  disabled={pending}
                  onPress={() => ask({ action: "help" })}
                />
              )}
            </View>
            {desk.map((entry) =>
              entry.from === "app" ? (
                <AppMessage key={entry.id} message={entry.message} part={hintParts.get(entry.id)} />
              ) : entry.from === "learner" ? (
                <LearnerMessage key={entry.id} text={entry.text} />
              ) : null,
            )}
            {state.pending && <Thinking line={slow ? "Taking longer than usual…" : waitingLineOf(state.pending)} />}
            {failure && (
              <Failure message={`${failure.message}${saved}`}>{failure.retryable && <Button kind="tonal" label="Try Again" onPress={retry} />}</Failure>
            )}
          </View>
        </ScrollView>
        <AskBar concept={concept} pending={pending} asking={state.pending !== null && "question" in state.pending} onAsk={(question) => ask({ question })} />
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
          ask({ mentefacto: { ...map, concept } });
        }}
      />
    </Screen>
  );
}

/** The fact desk's side of the session: the learner's questions, the answers, the hints. The opening
 * instruction is the screen's own line above the map, so it isn't repeated. */
function deskOf(entries: readonly Entry[]): Entry[] {
  return entries.filter((e) => e.from === "learner" || (e.from === "app" && e.phase === "move" && e.message.kind !== "question"));
}

/** The concept in the middle, the four parts around it: bigger group above, its types below, what it
 * needs on the left and what it isn't on the right (round 6, level 5). */
function MapDiagram({ map, concept, disabled, onEdit }: { map: Mentefacto; concept: string; disabled: boolean; onEdit: (move: MoveId) => void }) {
  const c = useColors();
  const node = (move: MoveId, style: StyleProp<ViewStyle>) => <PartNode move={move} items={itemsOf(map, move)} disabled={disabled} onPress={() => onEdit(move)} style={style} />;
  return (
    <View style={styles.map}>
      <View style={[styles.lineV, { backgroundColor: c.separator }]} />
      <View style={styles.mapRow}>{node("supraordinate", styles.nodeWide)}</View>
      <View style={styles.mapMiddle}>
        <View style={[styles.lineH, { backgroundColor: c.separator }]} />
        {node("isoordinate", styles.nodeSide)}
        <View style={[styles.center, { borderColor: c.primary, backgroundColor: c.surface }]}>
          <Body strong numberOfLines={3} style={styles.centerText}>
            {concept}
          </Body>
        </View>
        {node("exclusion", styles.nodeSide)}
      </View>
      <View style={styles.mapRow}>{node("infraordinate", styles.nodeWide)}</View>
    </View>
  );
}

function PartNode({ move, items, disabled, onPress, style }: { move: MoveId; items: Item[]; disabled: boolean; onPress: () => void; style: StyleProp<ViewStyle> }) {
  const c = useColors();
  const empty = items.length === 0;
  const summary = items.map((i) => i.value).join(", ");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={empty ? `${MOVE_LABEL[move]}: empty` : `${MOVE_LABEL[move]}: ${summary}`}
      accessibilityHint={empty ? "Add to this part" : "Edit this part"}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.node,
        empty ? [styles.nodeEmpty, { borderColor: c.onSurfaceVariant, backgroundColor: c.surface }] : { backgroundColor: c.surfaceContainer, borderColor: c.separator },
        style,
        pressed && styles.pressed,
      ]}
    >
      <Footnote strong dim numberOfLines={1}>
        {MOVE_LABEL[move]}
      </Footnote>
      {empty ? (
        <View style={styles.add}>
          <Icon name="plus" color={c.primary} size={16} />
          <Ui strong style={{ color: c.primary }}>
            Add
          </Ui>
        </View>
      ) : (
        <>
          <Body numberOfLines={2}>{items[0]!.value}</Body>
          {items.length > 1 && <Footnote dim>{`+${items.length - 1} more`}</Footnote>}
        </>
      )}
    </Pressable>
  );
}

/** The question field at the bottom of the fact desk. */
function AskBar({ concept, pending, asking, onAsk }: { concept: string; pending: boolean; asking: boolean; onAsk: (question: string) => void }) {
  const c = useColors();
  const [text, setText] = useState("");
  const question = text.trim();
  const submit = () => {
    if (!question || pending) return;
    onAsk(question);
    setText("");
  };
  return (
    <View style={[styles.askBar, { backgroundColor: c.surfaceContainer }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={`Ask anything about ${concept}`}
        placeholderTextColor={c.placeholder}
        multiline
        numberOfLines={1}
        maxLength={500}
        editable={!pending}
        accessibilityLabel="Your question for the fact desk"
        style={[styles.field, { color: c.onSurface, backgroundColor: c.surface, borderColor: c.separator }]}
        onSubmitEditing={submit}
        submitBehavior="submit"
      />
      <SendButton busy={asking} disabled={!question || pending} onPress={submit} label="Ask" />
    </View>
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
  const field = [styles.input, { color: c.onSurface, backgroundColor: c.surface, borderColor: c.separator }];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={done}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <Pressable style={styles.scrim} onPress={done} accessibilityRole="button" accessibilityLabel="Save and close" />
        <View style={[styles.sheet, { backgroundColor: c.surface }]}>
          <View style={[styles.grabber, { backgroundColor: c.placeholder }]} />
          <View style={styles.sheetHead}>
            <View style={styles.deskTitle}>
              <Ui strong>{MOVE_LABEL[move]}</Ui>
              <Footnote dim>{partMeaningOf(move, concept)}</Footnote>
            </View>
            <Button compact label="Done" onPress={done} />
          </View>
          <ScrollView contentContainerStyle={styles.rows} keyboardShouldPersistTaps="handled">
            {rows.map((row, i) => (
              <View key={i} style={styles.rowLine}>
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
                {!single && (rows.length > 1 || row.value !== "") && <CircleButton icon="x" label={`Remove item ${i + 1}`} onPress={() => remove(i)} />}
              </View>
            ))}
            {!single && rows.length < MAX_ITEMS && (
              <Button kind="plain" icon="plus" label="Add Another" onPress={() => setRows((now) => [...now, { value: "", note: null }])} />
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
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Keep building" />
      <View style={[styles.sheet, styles.confirm, { backgroundColor: c.surface }]}>
        <View style={[styles.grabber, { backgroundColor: c.placeholder }]} />
        <Title>Submit your map?</Title>
        <Body>{line}</Body>
        <View style={styles.confirmButtons}>
          <Button label="Submit My Map" onPress={onSubmit} />
          <Button kind="tonal" label="Keep Building" onPress={onClose} style={styles.centered} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { flexDirection: "row", alignItems: "center", gap: space.s, height: size.control, paddingHorizontal: space.margin, marginTop: space.s },
  barMiddle: { flex: 1, alignItems: "center" },
  content: { flexGrow: 1, paddingHorizontal: space.margin, paddingTop: space.l, gap: space.l },
  head: { gap: space.xs },
  capitalized: { textTransform: "capitalize" },
  map: { gap: space.m, paddingVertical: space.s },
  lineV: { position: "absolute", top: space.xxl, bottom: space.xxl, left: "50%", width: 1.5, marginLeft: -0.75 },
  lineH: { position: "absolute", left: space.xl, right: space.xl, top: "50%", height: 1.5, marginTop: -0.75 },
  mapRow: { alignItems: "center" },
  mapMiddle: { flexDirection: "row", alignItems: "center", gap: space.s },
  node: { minHeight: 76, borderRadius: radius.chip, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.m, paddingVertical: space.s, gap: space.xs },
  nodeEmpty: { borderWidth: 1.5, borderStyle: "dashed", justifyContent: "center" },
  nodeWide: { width: "68%" },
  nodeSide: { flex: 1 },
  center: { width: 76, minHeight: 56, borderRadius: radius.button, borderWidth: 1.5, alignItems: "center", justifyContent: "center", paddingHorizontal: space.s },
  centerText: { textAlign: "center", textTransform: "capitalize" },
  add: { flexDirection: "row", alignItems: "center", gap: space.xs },
  pressed: { transform: [{ scale: 0.96 }] },
  desk: {
    flexGrow: 1,
    marginHorizontal: -space.margin,
    paddingHorizontal: space.margin,
    paddingTop: space.m,
    paddingBottom: space.l,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    gap: space.l,
  },
  grabber: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, opacity: 0.5 },
  deskHead: { flexDirection: "row", alignItems: "center", gap: space.m },
  deskTitle: { flex: 1, gap: space.xs },
  askBar: { flexDirection: "row", alignItems: "flex-end", gap: space.s, paddingHorizontal: space.margin, paddingTop: space.s, paddingBottom: space.m },
  field: {
    ...type.ui,
    lineHeight: 20,
    flex: 1,
    minHeight: size.button,
    maxHeight: 128,
    paddingHorizontal: space.margin,
    paddingVertical: space.l,
    borderRadius: radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    textAlignVertical: "center",
  },
  scrim: { flex: 1, backgroundColor: palette.day.scrim },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space.margin,
    paddingTop: space.m,
    paddingBottom: space.xxl,
    gap: space.l,
    width: "100%",
    maxWidth: 520,
    maxHeight: "85%",
    alignSelf: "center",
  },
  sheetHead: { flexDirection: "row", alignItems: "flex-start", gap: space.m },
  rows: { gap: space.m, paddingBottom: space.s },
  rowLine: { flexDirection: "row", alignItems: "flex-start", gap: space.s },
  rowFields: { flex: 1, gap: space.s },
  input: { ...type.ui, height: size.button, paddingHorizontal: space.l, borderRadius: radius.control, borderWidth: StyleSheet.hairlineWidth },
  // the difference can run to a sentence, so it wraps instead of scrolling sideways
  note: { height: undefined, minHeight: size.button, maxHeight: 112, paddingVertical: space.m, textAlignVertical: "top" },
  confirm: { gap: space.l },
  confirmButtons: { gap: space.m, paddingTop: space.s },
  centered: { alignSelf: "center" },
});
