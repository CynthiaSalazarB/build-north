import type { SessionSummary } from "@build-north/agents";
import { ObserveInteractiveMarker } from "expo-observe";
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { ConceptsLink } from "../components/concepts-link.tsx";
import { Failure } from "../components/messages.tsx";
import { SiteHeader } from "../components/site-header.tsx";
import { Body, Button, Card, Screen, Small, Title, useColors, usePageTitle, useWide } from "../components/ui.tsx";
import { shortDateOf } from "../session/present.ts";
import { useSession } from "../session/session-context.tsx";
import { brand, page, pageMetadata, size, space, type } from "../theme.ts";

const TITLE = `Your concepts · ${brand.name}`;

export function generateMetadata() {
  return pageMetadata(TITLE, "Resume an unfinished session or revisit your completed maps and results.");
}

export default function ConceptsScreen() {
  const { folder: value } = useLocalSearchParams<{ folder?: string }>();
  const folder = value === "in-progress" || value === "completed" ? value : null;
  const title = folder === "in-progress" ? "In progress" : folder === "completed" ? "Completed" : "Your concepts";
  usePageTitle(`${title} · ${brand.name}`);
  const router = useRouter();
  const wide = useWide();
  const c = useColors();
  const { history, refresh, resume, offline, state } = useSession();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openError, setOpenError] = useState<{ id: string; message: string } | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const focused = useRef(false);
  const openVersion = useRef(0);
  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const problem = await refresh();
    if (!focused.current) return;
    setLoadError(problem);
    setLoading(false);
  }, [refresh]);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    setOpening(null);
    if (!folder) setOpenError(null);
    void reload();
    return () => { focused.current = false; openVersion.current++; };
  }, [reload, folder]));
  const sessions = history ?? [];
  const inProgress = sessions.filter((session) => !session.finished);
  const completed = sessions.filter((session) => session.finished);
  const listed = folder === "in-progress" ? inProgress : completed;
  const hasList = history !== null;

  const open = async (session: SessionSummary) => {
    if (opening || state.pending) return;
    const version = ++openVersion.current;
    setOpening(session.id);
    setOpenError(null);
    const problem = await resume(session);
    // Back stays Back even when a slow resume finishes after the learner has left this screen.
    if (!focused.current || version !== openVersion.current) return;
    setOpening(null);
    if (problem) setOpenError({ id: session.id, message: problem });
    else router.push("/session");
  };

  const back = (
    <Link href={folder ? "/concepts" : "/"} dismissTo onPress={() => { openVersion.current++; setOpening(null); }} style={[styles.back, { color: c.onSurface }]}>
      {folder ? "‹ Your concepts" : "‹ Start"}
    </Link>
  );
  const header = (
    <View style={styles.header}>
      <View style={styles.heading}>
        <Title>{title}</Title>
        <Body dim>{folder === "in-progress" ? "Your unfinished sessions. Continue whenever you're ready." : folder === "completed" ? "Your saved maps and results. Open any session to review it." : "Your work, ready when you are."}</Body>
      </View>
      {offline ? (
        <Card style={styles.empty}>
          <Body>Demo mode keeps no saved sessions.</Body>
          <Small dim>Try the recorded session from Start.</Small>
          <Button label="Back to Start" onPress={() => router.replace("/")} fit={wide} />
        </Card>
      ) : (
        <>
          {loading && <View style={styles.loading} accessibilityRole="status" accessibilityLiveRegion="polite"><ActivityIndicator color={c.onSurface} /><Small dim>{hasList ? "Updating your concepts…" : "Loading your concepts…"}</Small></View>}
          {loadError && (
            <View style={styles.empty}>
              <Failure message={loadError}><Button kind="secondary" label="Try again" onPress={() => void reload()} /></Failure>
              {hasList && <Small dim>Showing the last loaded sessions. New changes may be missing.</Small>}
            </View>
          )}
          {!folder && hasList && (
            <View style={[styles.folders, wide && styles.foldersWide]}>
              <View style={styles.flex}><ConceptsLink folder="in-progress" count={inProgress.length} /></View>
              <View style={styles.flex}><ConceptsLink folder="completed" count={completed.length} /></View>
            </View>
          )}
          {!folder && hasList && sessions.length === 0 && <Small dim>Start your first map. It will appear here as you go.</Small>}
          {folder && hasList && <Small dim>{`${listed.length} ${listed.length === 1 ? "session" : "sessions"} · newest first`}</Small>}
          {state.pending && <Small dim>Your current answer is still being saved. Wait for it before opening another session.</Small>}
          {openError && !sessions.some((session) => session.id === openError.id) && <Failure message={openError.message} />}
        </>
      )}
    </View>
  );

  return (
    <Screen>
      {wide ? <SiteHeader end={back} /> : <View style={styles.bar}>{back}<Text style={[type.wordmark, { color: c.onSurface }]}>{brand.name}</Text></View>}
      <FlatList
        style={styles.flex}
        contentContainerStyle={[styles.content, wide && styles.contentWide]}
        contentInsetAdjustmentBehavior="automatic"
        data={!offline && folder && hasList ? listed : []}
        keyExtractor={(session) => session.id}
        ListHeaderComponent={header}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={!offline && folder && hasList && !loading && !loadError ? (
          <Card style={styles.empty}>
            <Body>{folder === "in-progress" ? "Nothing in progress" : "No completed maps yet"}</Body>
            <Small dim>{folder === "in-progress" ? "Start a new map. You can leave and come back whenever you need." : "Finish a session to see its map, feedback and result here."}</Small>
            <Button label="Start a new map" fit={wide} onPress={() => router.replace("/")} />
          </Card>
        ) : undefined}
        renderItem={({ item: session }) => (
          <Card style={styles.session}>
            <View style={[styles.sessionHeading, wide && styles.sessionHeadingWide]}>
              <View style={styles.sessionWords}>
                <Text style={[type.question, styles.concept, { color: c.onSurface }]}>{session.concept}</Text>
                <Small dim>{session.mode === "test" ? "Self-test" : "Guided session"}{shortDateOf(session.createdAt) ? ` · Started ${shortDateOf(session.createdAt)}` : ""}</Small>
              </View>
              {session.finished && <Text style={[type.button, { color: c.onSurface }]}>{session.score === null ? "Completed" : `${session.score} of 8 points`}</Text>}
            </View>
            <Small dim>{session.finished ? "Review your map, feedback and conversation." : "Continue from your last saved answer."}</Small>
            {openError?.id === session.id && <Failure message={openError.message} />}
            <Button label={session.finished ? "Review map" : "Resume session"} hint={`${session.finished ? "Review" : "Resume"} ${session.concept}, ${session.mode === "test" ? "self-test" : "guided session"}`} kind={session.finished ? "secondary" : "primary"} fit={wide && !session.finished} busy={opening === session.id} disabled={opening !== null || state.pending !== null} onPress={() => void open(session)} />
          </Card>
        )}
      />
      <ObserveInteractiveMarker />
    </Screen>
  );
}

function Separator() { return <View style={styles.separator} />; }

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.margin, minHeight: size.button },
  back: { ...type.button, minHeight: size.touch, paddingVertical: space.m, paddingHorizontal: space.xs },
  content: { flexGrow: 1, padding: space.margin, paddingBottom: space.xxl },
  contentWide: { width: "100%", maxWidth: page.max - page.words, alignSelf: "center", paddingTop: space.xxl },
  header: { gap: space.xl, paddingBottom: space.xl },
  heading: { gap: space.m },
  folders: { gap: space.l },
  foldersWide: { flexDirection: "row" },
  loading: { flexDirection: "row", alignItems: "center", gap: space.m },
  empty: { gap: space.l },
  session: { gap: space.l, padding: space.xl },
  sessionHeading: { gap: space.s },
  sessionHeadingWide: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: space.xl },
  sessionWords: { flex: 1, minWidth: 0, gap: space.s },
  concept: { flexShrink: 1 },
  separator: { height: space.l },
});
