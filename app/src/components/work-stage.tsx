// Shared desktop layout: both guided answers and the self-test connect Firefly to the active map area.
import type { MoveId } from "@build-north/agents";
import { useRef, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View, type LayoutChangeEvent, type LayoutRectangle, type ScrollViewInstance } from "react-native";
import Svg from "react-native-svg";
import { page, size, space } from "../theme.ts";
import { Trace, type MapGeometry } from "./concept-map.tsx";
import { decorative } from "./icons.tsx";
import { FlushReplies } from "./messages.tsx";
import { roundedPath, tracePoints, type Box } from "./trace.ts";
import { KeyboardSafe, useColors } from "./ui.tsx";

const boxOf = (l: LayoutRectangle): Box => ({ x: l.x, y: l.y, w: l.width, h: l.height });
const sameBox = (a: Box | null, b: Box) => !!a && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

type Props = {
  asked: MoveId | null;
  fireflySize: number;
  intro?: ReactNode;
  question: ReactNode;
  thread: ReactNode;
  composer: ReactNode;
  mapHeader?: ReactNode;
  mapFooter?: ReactNode;
  /** The self-test's instructions and chat must share the available height instead of squeezing replies to zero. */
  scrollWords?: boolean;
  followWords?: boolean;
  map: (onGeometry: (geometry: MapGeometry) => void) => ReactNode;
};

export function WideStage({ asked, fireflySize, intro, question, thread, composer, mapHeader, mapFooter, scrollWords = false, followWords = false, map }: Props) {
  const c = useColors();
  const scroll = useRef<ScrollViewInstance>(null);
  const [scrollY, setScrollY] = useState(0);
  const [words, setWords] = useState<Box | null>(null);
  const [ask, setAsk] = useState<Box | null>(null);
  const [stage, setStage] = useState<Box | null>(null);
  const [spot, setSpot] = useState<Box | null>(null);
  const [geometry, setGeometry] = useState<MapGeometry | null>(null);
  const keep = (set: (update: (b: Box | null) => Box | null) => void) => (e: LayoutChangeEvent) => {
    const next = boxOf(e.nativeEvent.layout);
    set((b) => (sameBox(b, next) ? b : next));
  };

  let trace: ReactNode = null;
  if (asked && words && ask && stage && spot && geometry) {
    const at = { x: stage.x + spot.x, y: stage.y + spot.y };
    const p = geometry.parts[asked];
    const part = { x: at.x + p.x, y: at.y + p.y, w: p.w, h: p.h };
    const from = { x: words.x + words.w - size.iconButton / 2, y: words.y + ask.y + space.xl + fireflySize / 2 - scrollY };
    const gutter = Math.round((words.x + words.w + at.x) / 2);
    const points = tracePoints(from, part, asked === "exclusion" ? "top" : "left", { gutter, above: at.y - space.l });
    const end = points[points.length - 1]!;
    const { d, length } = roundedPath(points, 12);
    // Once Firefly scrolls out of view, don't leave its line floating over the header or chat.
    trace = from.y >= words.y && from.y <= words.y + words.h ? (
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none" {...decorative}>
        <Trace d={d} length={length} end={end} drawKey={asked} color={c.questionOutline} />
      </Svg>
    ) : null;
  }

  const content = (
    <>
      {intro && <View style={styles.intro}>{intro}</View>}
      <View style={styles.question} onLayout={keep(setAsk)}>{question}</View>
      {scrollWords ? <View style={styles.scrollThread}>{thread}</View> : thread}
      {composer}
    </>
  );
  const follow = () => { if (followWords) scroll.current?.scrollToEnd({ animated: false }); };

  return (
    <View style={styles.wide}>
      <View style={styles.words} onLayout={keep(setWords)}>
        <KeyboardSafe>
          <FlushReplies value>
            {scrollWords ? (
              <ScrollView
                ref={scroll}
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={follow}
                onLayout={follow}
                onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
                scrollEventThrottle={16}
              >
                {content}
              </ScrollView>
            ) : content}
          </FlushReplies>
        </KeyboardSafe>
      </View>
      <View style={styles.stage} onLayout={keep(setStage)}>
        {mapHeader && <View style={[styles.spot, styles.mapHeader]}>{mapHeader}</View>}
        <View style={styles.spot} onLayout={keep(setSpot)}>
          {map((next) => setGeometry((g) => (g && JSON.stringify(g) === JSON.stringify(next) ? g : next)))}
        </View>
        {mapFooter && <View style={[styles.spot, styles.mapFooter]}>{mapFooter}</View>}
      </View>
      {trace}
    </View>
  );
}

const styles = StyleSheet.create({
  wide: { flex: 1, flexDirection: "row", gap: page.gap, paddingHorizontal: page.gutter },
  words: { width: page.words },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  scrollThread: { flexGrow: 1, flexShrink: 0 },
  intro: { paddingTop: space.xl, gap: space.m },
  question: { paddingTop: space.xl, paddingBottom: space.l },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: page.header },
  spot: { width: "100%", maxWidth: page.map },
  mapHeader: { marginBottom: space.xl },
  mapFooter: { marginTop: space.l },
});
