// One line of the conversation under the map (round 9 "Lumente"): the firefly's question beside it (tapping the
// firefly is Help), a free nudge after a wrong answer, an amber hint card that says what it costs, a revealed
// answer (0 points), a fact, the worked example in four steps, and the learner's answers on the right. The learner
// sees what kind of message it is, never which agent wrote it.
import { MOVE_LABEL, type Message } from "@build-north/agents";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from "react-native";
import { hintCardOf, inlineCodeOf, type ExampleStep } from "../session/present.ts";
import { radius, size, space, type } from "../theme.ts";
import { Firefly, type FireflyState } from "./firefly.tsx";
import { Icon } from "./icons.tsx";
import { Body, Label, Reply, Tag, useColors, useMode } from "./ui.tsx";

/** A Pressable's state; react-native-web adds hover to the press. */
type Interaction = PressableStateCallbackType & { hovered?: boolean };

/** The firefly's column is 44 wide and the question starts 14 after it, so replies line up with the question. */
const COLUMN = size.iconButton;
const INDENT = COLUMN + 14;

/** In the website layout the firefly sits after its question, so replies start at the edge, not past a firefly. */
const Flush = createContext(false);
export const FlushReplies = Flush.Provider;
const useIndent = () => (useContext(Flush) ? null : styles.indent);

type FireflyProps = {
  state: FireflyState;
  /** Under the firefly: "help −1", "help" or "checking". */
  tag: string | null;
  /** Tapping the firefly is Help; without `onPress` it only asks. */
  onPress?: () => void;
  label?: string;
  busy?: boolean;
};

/** A question with its code in mono chips, as the board sets it. */
function WithCode({ text, style }: { text: string; style: object }) {
  const c = useColors();
  return (
    <Text style={[style, { color: c.onSurface }]}>
      {inlineCodeOf(text).map((piece, i) =>
        piece.code ? (
          // non-breaking spaces pad the chip, so a line never breaks inside it before the code
          <Text key={i} style={[type.inlineCode, styles.code, { backgroundColor: c.codeFill, borderColor: c.fieldEdge, color: c.onSurface }]}>
            {`\u00a0${piece.text.replaceAll(" ", "\u00a0")}\u00a0`}
          </Text>
        ) : (
          piece.text
        ),
      )}
    </Text>
  );
}

/** The firefly's question, with the firefly beside it. `eyebrow` is a short label over it ("before any help").
 * In the website layout the firefly sits after the question, next to the map its line runs to (`fireflyAfter`). */
export function Ask({ text, eyebrow = null, firefly, fireflyAfter = false }: { text: string; eyebrow?: string | null; firefly: FireflyProps; fireflyAfter?: boolean }) {
  const c = useColors();
  // Help: the firefly's light answers a finger or a pointer on it
  const drawing = (glow: boolean) => (
    <>
      <Firefly state={firefly.state} glow={glow} />
      {firefly.tag && (
        <Text style={[type.tag, styles.fireflyTag, { color: c.question }]} numberOfLines={1}>
          {firefly.tag}
        </Text>
      )}
    </>
  );
  return (
    <View style={[styles.ask, fireflyAfter && styles.reverse]}>
      {firefly.onPress && !firefly.busy ? (
        <Pressable accessibilityRole="button" accessibilityLabel={firefly.label ?? "Help"} onPress={firefly.onPress} hitSlop={size.hitSlop} style={({ pressed }) => [styles.firefly, pressed && styles.pressed]}>
          {({ pressed, hovered }: Interaction) => drawing(pressed || !!hovered)}
        </Pressable>
      ) : (
        <View style={styles.firefly} role={firefly.busy ? "status" : undefined} accessibilityLabel={firefly.busy ? "Checking your answer" : undefined}>
          {drawing(false)}
        </View>
      )}
      <View style={styles.askText}>
        {eyebrow && <Tag style={{ color: c.question }}>{eyebrow}</Tag>}
        <WithCode text={text} style={type.question} />
      </View>
    </View>
  );
}

/** A line the firefly said earlier in this part (the feedback on the last part, the move's name), set quietly. */
export function Aside({ text }: { text: string }) {
  return (
    <View style={useIndent()}>
      <Body dim style={type.bubble}>
        {text}
      </Body>
    </View>
  );
}

/** The evaluator's word on an answer that didn't light the part: a free nudge at levels 2 and 3, a plain "not
 * yet" after that. `capNote` says the part can now light 1 point at most (said once per part). `tag` replaces
 * the head: "almost" for the word that comes with a follow-up question, which isn't a retry. */
export function Nudge({ text, capNote, tag }: { text: string; capNote: boolean; tag?: string }) {
  const c = useColors();
  return (
    <View style={useIndent()}>
      <Tag style={{ color: c.question }}>{tag ?? (text.trim().endsWith("?") ? "nudge · free" : "not yet")}</Tag>
      <Reply style={styles.replyText}>{text}</Reply>
      {capNote && <Label dim style={styles.note}>this part can now light 1 point at most</Label>}
    </View>
  );
}

/** A hint: amber, the firefly's light. Its head says which of the three it is (`n`) and, on a part's first, its price. */
export function HintCard({ message, n, capNote, part }: { message: Message; n: number; capNote: boolean; part?: string }) {
  const c = useColors();
  const card = hintCardOf(n, n === 1);
  // on the whole map (level 5) the card names the part it helps with
  const title = part ? `${part} · ${card.title}` : card.title;
  return (
    <View style={[styles.hint, { backgroundColor: c.hintContainer }]} role="note" accessibilityLabel={`${title}. ${message.text}${capNote ? ` ${card.note}` : ""}`}>
      <View style={styles.hintHead}>
        <Text style={[type.label, styles.hintTitle, { color: c.hint }]}>{title}</Text>
        <View style={styles.hintSteps}>
          {[1, 2, 3].map((n) => (
            <View key={n} style={[styles.step, n <= card.filled ? { backgroundColor: c.hint } : { borderColor: c.hint, borderWidth: 1 }]} />
          ))}
        </View>
      </View>
      <Text style={[type.body, styles.hintText, { color: c.onHintContainer }]}>{message.text}</Text>
      {capNote && <Text style={[type.label, styles.note, { color: c.hintNote }]}>{card.note}</Text>}
    </View>
  );
}

/** "It's a form of government." becomes "…keep going: it's a form of government." (an acronym keeps its case). */
const lowerFirst = (text: string) => (/^[A-Z][a-z]/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text);

/** The answer Help revealed once the hints ran out: it goes on the map dim and dashed, for 0 points. */
export function Revealed({ text }: { text: string }) {
  return (
    <View style={styles.ask}>
      <View style={styles.firefly}>
        <Firefly state="asks" />
      </View>
      <View style={styles.askText}>
        <Reply>{`Here's this part, so you can keep going: ${lowerFirst(text.trim())}`}</Reply>
        <Label dim style={styles.note}>shown · 0 points</Label>
      </View>
    </View>
  );
}

/** The worked example's first line, as the heading of what follows. */
export function ExampleIntro({ text }: { text: string }) {
  const c = useColors();
  return (
    <View style={styles.exampleIntro}>
      <Tag style={{ color: c.question }}>worked example</Tag>
      <Text style={[type.question, { color: c.onSurface }]}>{text}</Text>
    </View>
  );
}

/** The worked example in four steps, so a glance reads the questions and the answers: each part's name as on the
 * map, the question it asks, what it puts on the map (dashed, like the map: shown, not earned), and the reasoning,
 * dim, for whoever wants the why. */
export function ExampleSteps({ steps }: { steps: ExampleStep[] }) {
  const c = useColors();
  return (
    <View style={styles.exampleSteps}>
      {steps.map((step, i) => (
        <View key={step.move} style={[styles.exampleStep, { borderLeftColor: c.partEdge }]}>
          <Tag style={{ color: c.question }}>{`${i + 1} · ${MOVE_LABEL[step.move].toLowerCase()}`}</Tag>
          {step.question && <Reply>{step.question}</Reply>}
          <View style={styles.exampleItems}>
            {step.items.map((item) => (
              <View key={item} style={[styles.exampleItem, { borderColor: c.partEdge, backgroundColor: c.partFill }]}>
                <Text style={[type.ui, { color: c.onSurface }]}>{item}</Text>
              </View>
            ))}
          </View>
          {step.reasoning !== "" && (
            <Body dim style={type.bubble}>
              {step.reasoning}
            </Body>
          )}
        </View>
      ))}
    </View>
  );
}

/** A fact desk answer: facts only, or the redirect when a question fishes for the map (which says so itself). */
export function FactCard({ kind, text }: { kind: "fact" | "redirect"; text: string }) {
  return (
    <View style={styles.fact}>
      {kind === "fact" && <Tag dim>fact</Tag>}
      <Body>{text}</Body>
    </View>
  );
}

/** What the learner wrote, on the right. At level 5 their questions glow amber: the light is theirs now. */
export function LearnerMessage({ text, asking = false }: { text: string; asking?: boolean }) {
  const c = useColors();
  const night = useMode() === "night";
  if (asking) {
    return (
      <View style={[styles.learner, styles.asking, { borderColor: c.firefly }]}>
        <Text style={[type.input, { color: night ? "#f8e3b6" : c.question }]}>{text}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.learner, { backgroundColor: c.bubble, borderColor: c.bubbleEdge }]}>
      <Text style={[type.bubble, { color: c.onSurface }]}>{text}</Text>
    </View>
  );
}

/** A reply that takes longer than this says so (NN/g: over 10 s, explain the wait). */
const SLOW_MS = 10_000;

/** True once a call has been in flight for SLOW_MS. */
export function useSlow(waiting: boolean): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (!waiting) return;
    const timer = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(timer);
  }, [waiting]);
  return slow;
}

/** While the firefly checks: screen readers hear what is happening; after 10 s everyone sees it. */
export function Waiting({ line, slow }: { line: string; slow: boolean }) {
  return (
    <View role="status" accessibilityLiveRegion="polite" accessibilityLabel={slow ? `${line} Taking longer than usual.` : line} style={useIndent()}>
      {slow && <Label dim>taking longer than usual…</Label>}
    </View>
  );
}

/** A failed call: what happened, where it happened, and a way to try again. Never coral: that's the gap. */
export function Failure({ message, children }: { message: string; children?: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.failure} accessibilityRole="alert">
      <Icon name="alert" color={c.onSurfaceVariant} size={22} />
      <View style={styles.failureBody}>
        <Body>{message}</Body>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ask: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  reverse: { flexDirection: "row-reverse" },
  firefly: { width: COLUMN, alignItems: "center", gap: 2 },
  // "help −1" is wider than the firefly's column, so the tag overflows it evenly instead of wrapping
  fireflyTag: { textAlign: "center", minWidth: COLUMN + 16, marginHorizontal: -8 },
  askText: { flex: 1, gap: space.xs, paddingTop: 2 },
  code: { borderRadius: 4, borderWidth: 1, overflow: "hidden" },
  indent: { marginLeft: INDENT },
  replyText: { marginTop: 2 },
  note: { marginTop: 6 },
  hint: { borderRadius: radius.card, paddingVertical: 14, paddingHorizontal: space.l, boxShadow: "0 0 26px rgba(242, 184, 75, 0.4)" },
  hintHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s },
  hintTitle: { flexShrink: 1 },
  hintSteps: { flexDirection: "row", gap: space.xs },
  step: { width: 7, height: 7, borderRadius: radius.point },
  hintText: { marginTop: 6, lineHeight: 25 },
  exampleIntro: { gap: space.xs },
  exampleSteps: { gap: space.xl },
  exampleStep: { gap: space.s, borderLeftWidth: 2, paddingLeft: space.l },
  exampleItems: { flexDirection: "row", flexWrap: "wrap", gap: space.s },
  exampleItem: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderStyle: "dashed", borderRadius: radius.chip },
  fact: { maxWidth: "88%", gap: 2 },
  learner: { alignSelf: "flex-end", maxWidth: "78%", paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderRadius: radius.bubble, borderBottomRightRadius: 2 },
  asking: { maxWidth: "82%", backgroundColor: "rgba(242, 184, 75, 0.1)", boxShadow: "0 0 14px rgba(242, 184, 75, 0.18)" },
  failure: { flexDirection: "row", alignItems: "flex-start", gap: space.m },
  failureBody: { flex: 1, gap: space.s },
  pressed: { opacity: 0.8 },
});
