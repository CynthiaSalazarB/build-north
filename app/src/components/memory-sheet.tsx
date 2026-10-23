// What Lumente remembers (#112): the Memory sheet, from GET /me/memory. Per concept, each part's level now and how
// it got there (newest first, the superseded levels closed), and the latest guess against the score beside the one
// before. Every line is a note the app wrote from the session's numbers, never the learner's words. The session's
// concept comes first when the sheet opens from a hint or the coach's words.
import type { MemoryView } from "@build-north/agents";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { memoryConceptOf } from "../session/present.ts";
import { useSession } from "../session/session-context.tsx";
import { space } from "../theme.ts";
import { Body, Button, Label, Sheet, Small, Tag, Title, useColors } from "./ui.tsx";

const INTRO = "Notes the app writes after each session: your level on each part, your guess against your score, the Helps a part took. Never your words. A level is how much help a part gets, from 1 (a worked example) to 5 (the whole map alone).";
const DEMO = "Demo mode keeps nothing, so there is nothing to remember.";
const EMPTY = "Nothing yet. Finish a session and come back.";

type Props = {
  open: boolean;
  onClose: () => void;
  /** The session's concept, shown first. */
  concept?: string | null;
};

export function MemorySheet({ open, onClose, concept = null }: Props) {
  const c = useColors();
  const { memory, offline } = useSession();
  const [view, setView] = useState<MemoryView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // the provider hands out a new `memory` on every render; the read keys on opening, not on that
  const read = useRef(memory);
  read.current = memory;

  useEffect(() => {
    if (!open || offline) return;
    let gone = false;
    setLoading(true);
    setError(null);
    read
      .current()
      .then(
        (next) => {
          if (!gone) setView(next);
        },
        (problem: unknown) => {
          if (!gone) setError(problem instanceof Error ? problem.message : "Something went wrong. Try again.");
        },
      )
      .finally(() => {
        if (!gone) setLoading(false);
      });
    return () => {
      gone = true;
    };
  }, [open, offline, attempt]);

  const concepts = view ? [...view.concepts].sort((a, b) => Number(b.concept === concept) - Number(a.concept === concept)).map(memoryConceptOf) : [];

  let body;
  if (offline) body = <Body>{DEMO}</Body>;
  else if (error) {
    body = (
      <>
        <Body>{error}</Body>
        <Button kind="secondary" label="Try again" onPress={() => setAttempt((n) => n + 1)} />
      </>
    );
  } else if (loading && !view) body = <Body dim>Reading…</Body>;
  else if (concepts.length === 0) body = <Body dim>{EMPTY}</Body>;
  else {
    body = (
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {concepts.map((entry) => (
          <View key={entry.concept} style={styles.concept}>
            <Body>{entry.concept}</Body>
            {entry.gap && <Small dim>{entry.gap}</Small>}
            {entry.moves.map((move) => (
              <View key={move.move} style={[styles.move, { borderLeftColor: c.partEdge }]} accessible accessibilityLabel={`${move.label}: ${move.now}. ${move.history.join(". ")}`}>
                <View style={styles.moveHead}>
                  <Tag style={{ color: c.question }}>{move.label}</Tag>
                  <Label>{move.now}</Label>
                </View>
                {move.history.map((line, i) => (
                  <Small key={i} dim>
                    {line}
                  </Small>
                ))}
                {move.reads > 0 && <Label dim>{`the AI read this ${move.reads === 1 ? "once" : `${move.reads} times`}`}</Label>}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <Sheet open={open} onClose={onClose} label="what Lumente remembers">
      <Title style={styles.title}>What Lumente remembers</Title>
      <Small dim>{INTRO}</Small>
      {body}
      <Button kind="text" label="Close" onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, lineHeight: 30 },
  list: { maxHeight: 380 },
  listContent: { gap: space.xl, paddingVertical: space.s },
  concept: { gap: space.s },
  move: { gap: 2, borderLeftWidth: 2, paddingLeft: space.l, marginTop: space.xs },
  moveHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s },
});
