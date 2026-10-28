// What the round 9 screens say and draw: the map's parts, the points and the light come from the Turns, so they're
// checked here.
import assert from "node:assert/strict";
import { test } from "node:test";
import { MemoryView, MOVE_LABEL, MOVE_ORDER, Turn, type Mentefacto, type Message, type MoveId, type Result } from "@build-north/agents";
import memoryView from "@build-north/agents/fixtures/memory-view.json" with { type: "json" };
import sessionOne from "@build-north/agents/fixtures/session-1.json" with { type: "json" };
import {
  answerLabelOf,
  cappedOf,
  categoryContextOf,
  chatKeyOf,
  currentPartOf,
  deskOf,
  CHIPS,
  editorLinesOf,
  exampleParts,
  exampleQuestionOf,
  exampleStepsOf,
  eyebrowOf,
  filledOf,
  firstOnPart,
  gapOf,
  guidedHelpOf,
  helpOf,
  hintCardOf,
  hintNumberOf,
  hintPartOf,
  inlineCodeOf,
  isFollowUpFeedback,
  itemsOf,
  justLitOf,
  leadOf,
  memoryConceptOf,
  mapQuestionOf,
  nextPartOf,
  partMeaningOf,
  partDetailOf,
  partNotesOf,
  partsOf,
  partTextOf,
  PREDICTION_MEANING,
  PREDICTION_TOTAL,
  predictionStatusOf,
  predictionTaskOf,
  pointsOf,
  provedOf,
  rememberedLineOf,
  resumeLineOf,
  shortDateOf,
  resultPartsOf,
  resultStepsOf,
  revealedPartsOf,
  revealHoldOf,
  secretLineOf,
  shareLineOf,
  waitingLineOf,
  wholeMapHelpOf,
  wholeMapPartsOf,
  withMapQuestions,
  withFeedbackToRead,
  withPart,
} from "./present.ts";
import { blankMap, initialState, received, sent, startedWith, type Entry } from "./transcript.ts";

const turns = sessionOne.map((step) => Turn.parse(step.turn));
const turnAt = (n: number) => turns.find((t) => t.turn === n)!;
const through = (last: number) => turns.filter((t) => t.turn <= last).reduce(received, initialState);
const states = (n: number) => partsOf(turnAt(n), through(n).entries).map((p) => `${p.state}:${p.pips?.join("+")}`);

test("Start opens on the concept's line of code, or a comment for a concept typed in", () => {
  assert.deepEqual(editorLinesOf("API")[1], { n: 12, text: "app.get('/api/users/:id', getUser);", current: true });
  assert.equal(editorLinesOf("cors")[1]!.text, "app.use(cors({ origin: CLIENT_URL }));");
  assert.equal(editorLinesOf("monads")[1]!.text, "// explain: monads");
});

test("Start's chips are four examples, each with its own code line", () => {
  assert.deepEqual([...CHIPS], ["API", "JWT", "cache", "CORS"]);
  for (const chip of CHIPS) assert.equal(editorLinesOf(chip)[1]!.current, true);
});

test("prediction wording uses the selected concept and separates confidence from possible points", () => {
  assert.equal(predictionTaskOf("JWT"), "Explain JWT across four areas of a concept map. Before you begin, predict your score out of 8.");
  assert.match(predictionTaskOf("database index"), /^Explain database index /);
  assert.equal(PREDICTION_TOTAL, "4 areas × 2 points = 8 possible points");
  assert.equal(PREDICTION_MEANING, "Your prediction reflects your confidence; your score reflects what you can explain.");
});

test("prediction status starts without a default and preserves zero as a deliberate choice", () => {
  assert.equal(predictionStatusOf(null), "Choose a number first.");
  for (let value = 0; value <= 8; value++) assert.equal(predictionStatusOf(value), `Your prediction: ${value} of 8 points`);
});

test("the democracy session lights the map part by part: asked, capped after a retry, lit with its points", () => {
  assert.deepEqual(states(4), ["asked:open+open", "unasked:open+open", "unasked:open+open", "unasked:open+open"]);
  // "A law?" got a nudge: that part can now light 1 point at most
  assert.deepEqual(states(5), ["asked:open+capped", "unasked:open+open", "unasked:open+open", "unasked:open+open"]);
  assert.deepEqual(states(7), ["lit:earned+open", "asked:open+open", "unasked:open+open", "unasked:open+open"]);
  assert.equal(partsOf(turnAt(7), through(7).entries)[0]!.text, "form of government");
  assert.deepEqual(states(11).slice(0, 2), ["lit:earned+open", "lit:earned+earned"]);
});

test("the light is the points proved so far, and the part that just lit is the one the Turn named", () => {
  assert.deepEqual([4, 7, 11, 14].map((n) => provedOf(turnAt(n), through(n).entries)), [0, 1, 3, 5]);
  assert.equal(justLitOf(turnAt(7)), "supraordinate");
  assert.equal(justLitOf(turnAt(6)), null);
});

test("a Turn saved before progress.points falls back to the rule: 2 alone, 1 after a Help, 0 when revealed", () => {
  const old = Turn.parse({ ...turnAt(11), progress: { movesDone: 2, movesTotal: 4, hintsUsed: 2 } });
  assert.deepEqual(pointsOf(old, through(11).entries), [
    { move: "supraordinate", points: 1 },
    { move: "exclusion", points: 2 },
  ]);
});

test("the result map shows earned points per area without assigning the total confidence gap to an area", () => {
  const last = turnAt(14);
  const parts = resultPartsOf(last.result!, last.mentefacto);
  assert.deepEqual(
    parts.map((p) => `${p.state}:${p.pips?.join("+")}`),
    ["lit:earned+open", "lit:earned+earned", "lit:earned+open", "lit:earned+open"],
  );
  assert.equal(parts[1]!.text, "not dictatorship");
  assert.equal(parts[2]!.text, "free elections, rights, more than one party");
  // the parts that moved up a level say the help fades there; reaching 5 means doing it alone
  assert.deepEqual(parts.map((p) => p.badge), [null, "less help next time", null, "less help next time"]);
  const toFive = { ...last.result!, masteryChanges: [{ move: "supraordinate" as const, from: 4 as const, to: 5 as const }] };
  assert.equal(resultPartsOf(toFive, last.mentefacto)[0]!.badge, "you can do this alone now");
});

test("on the result a wrong answer scores 0 and stays the learner's; only a part Help revealed reads as shown to them (code review, Oct 26)", () => {
  const last = turnAt(14);
  const wrong = { ...last.result!, rubric: last.result!.rubric.map((r) => (r.move === "isoordinate" ? { ...r, points: 0 as const } : r)) };
  assert.equal(resultPartsOf(wrong, last.mentefacto)[2]!.state, "lit");
  assert.equal(resultPartsOf(wrong, last.mentefacto, new Set(["isoordinate"]))[2]!.state, "revealed");
  // on the whole map Help goes through the parts in order, four steps each: hintsUsed says which were revealed
  assert.deepEqual([...revealedPartsOf([], { hintsUsed: 3, rubric: [] }, "test")], []);
  assert.deepEqual([...revealedPartsOf([], { hintsUsed: 5, rubric: [] }, "test")], ["supraordinate"]);
  assert.deepEqual([...revealedPartsOf([], { hintsUsed: 8, rubric: [] }, "test")], ["supraordinate", "exclusion"]);
  // in a guided session, the parts a reveal closed
  const app = (id: string, kind: Message["kind"], move: MoveId, extra: Partial<Message> = {}): Entry => ({ id, from: "app", message: { agent: "app", kind, text: "x", ...extra }, phase: "move", move, level: 2 });
  const guided = [app("turn-3-0", "question", "supraordinate"), app("turn-4-0", "hint", "exclusion", { agent: "hint_giver", hintStep: "reveal" }), app("turn-4-1", "named_move", "exclusion"), app("turn-4-2", "question", "exclusion")];
  assert.deepEqual([...revealedPartsOf(guided, { hintsUsed: 3, rubric: last.result!.rubric }, "learn")], ["supraordinate"]);
  assert.deepEqual([...revealedPartsOf(through(14).entries, last.result!, "learn")], []);
});

test("a session reviewed without its conversation still reads Help's reveals as shown to the learner (code review, Oct 28)", () => {
  const last = turnAt(14);
  const zeroOn = (move: MoveId) => last.result!.rubric.map((r) => (r.move === move ? { ...r, points: 0 as const } : r));
  // guided: a part closes on a right answer or a reveal, so with no record of how it closed, 0 points means revealed
  const latestOnly = startedWith(last).entries;
  assert.deepEqual([...revealedPartsOf(latestOnly, { hintsUsed: 4, rubric: zeroOn("exclusion") }, "learn")], ["exclusion"]);
  assert.deepEqual([...revealedPartsOf(latestOnly, last.result!, "learn")], []);
  // the whole conversation says how each part closed, and that wins over the points
  assert.deepEqual([...revealedPartsOf(through(14).entries, { hintsUsed: 0, rubric: zeroOn("exclusion") }, "learn")], []);
  // level 5 everywhere: a guided session on the whole map is known by the area notes its result carries
  const noted = (move: MoveId): Entry => ({ id: `n-${move}`, from: "app", message: { agent: "evaluator", kind: "feedback", text: `${MOVE_LABEL[move]}: works.` }, phase: "result", move: null, level: 5 });
  const wholeMap = MOVE_ORDER.map(noted);
  assert.deepEqual([...revealedPartsOf(wholeMap, { hintsUsed: 4, rubric: zeroOn("isoordinate") }, "learn")], ["supraordinate"]);
});

test("an area's reader shows an exclusion with the difference the learner gave, and an empty area with feedback opens (code review, Oct 26)", () => {
  const map: Mentefacto = { ...blankMap("API"), supraordinate: { value: "interface", note: null }, exclusion: [{ value: "library", note: "a library is code you call" }, { value: "not SDK", note: null }] };
  assert.equal(partDetailOf(map, "exclusion"), "not library: a library is code you call\nnot SDK");
  assert.equal(partDetailOf(map, "supraordinate"), "interface");
  assert.equal(partDetailOf(map, "isoordinate"), null);
  const last = turnAt(14);
  const parts = resultPartsOf(last.result!, map);
  assert.equal(parts[1]!.detail, "not library: a library is code you call\nnot SDK");
  assert.equal(parts[1]!.text, "not library, not SDK");
  const readable = withFeedbackToRead(parts, (move) => move === "isoordinate");
  assert.deepEqual(readable.map((p) => [p.state, p.opens ?? false]), [["lit", false], ["lit", false], ["unasked", true], ["unasked", false]]);
});

test("with the whole-map evaluator's notes, the result reads part by part: points as on the map, the words, the note", () => {
  const last = turnAt(14);
  const notes = { supraordinate: "Close group.", isoordinate: "One is missing." };
  const steps = resultStepsOf(last.result!, last.mentefacto, notes);
  assert.deepEqual(steps.map((s) => s.move), ["supraordinate", "exclusion", "isoordinate", "infraordinate"]);
  assert.deepEqual(steps.map((s) => s.pips.join("+")), resultPartsOf(last.result!, last.mentefacto).map((p) => p.pips!.join("+")));
  assert.deepEqual(steps[1]!.items, ["not dictatorship"]);
  assert.deepEqual(steps[2]!.items, ["free elections", "rights", "more than one party"]);
  assert.deepEqual([steps[0]!.note, steps[1]!.note], ["Close group.", null]);
  // levels 1 to 4 have no notes: the conversation already went part by part
  assert.deepEqual(resultStepsOf(last.result!, last.mentefacto, {}), []);
});

test("a revealed answer holds the next question until the learner has read it", () => {
  const app = (id: string, kind: "question" | "hint" | "named_move", text: string, hintStep?: "reveal"): Entry => ({
    id,
    from: "app",
    message: { agent: kind === "hint" ? "hint_giver" : "app", kind, text, ...(hintStep ? { hintStep } : {}) },
    phase: "move",
    move: "supraordinate",
    level: 2,
  });
  const entries = [app("turn-4-0", "question", "What group?"), app("turn-9-0", "hint", "It's a form of government.", "reveal"), app("turn-9-1", "named_move", "That's called…"), app("turn-9-2", "question", "What isn't it?")];
  assert.deepEqual(revealHoldOf(entries), { key: "turn-9-0", entries: [entries[1]] });
  assert.equal(revealHoldOf(entries.slice(0, 1)), null);
});

test("Help costs a point only while the part could still score 2; after a hint it's More help", () => {
  const question = { id: "turn-4-0", from: "app", message: { agent: "questioner", kind: "question", text: "What group?" }, phase: "move", move: "supraordinate", level: 2 } as const;
  const answer = { id: "learner-3", from: "learner", text: "A law?" } as const;
  const nudge = { id: "turn-5-0", from: "app", message: { agent: "evaluator", kind: "feedback", text: "Not quite. So what kind of thing is it?" }, phase: "move", move: "supraordinate", level: 2 } as const;
  const hint = { id: "turn-6-0", from: "app", message: { agent: "hint_giver", kind: "hint", text: "Think of monarchy.", hintStep: "hint" }, phase: "move", move: "supraordinate", level: 2 } as const;
  assert.deepEqual(helpOf([question]), { tag: "help −1", label: "Help, costs a point", more: false });
  // an answer alone hasn't capped anything yet; the evaluator's nudge on it has
  assert.deepEqual(helpOf([question, answer]), { tag: "help −1", label: "Help, costs a point", more: false });
  assert.deepEqual(helpOf([question, answer, nudge]), { tag: "help", label: "Help", more: false });
  assert.equal(helpOf([question, answer, hint]).more, true);
  // a reveal that ended the last part came before this question, so Help costs a point again
  assert.equal(helpOf([{ ...hint, message: { ...hint.message, hintStep: "reveal" } }, { ...question, id: "turn-9-2" }]).tag, "help −1");
  assert.equal(cappedOf([question, answer]), false);
  assert.equal(cappedOf([question, answer, nudge]), true);
  // a part picked up after a reload shows the latest Turn's lines only: no question, so no firefly to tap. Help
  // goes by the input instead, as it does after a hint, whether that Turn was a nudge or a hint
  assert.equal(helpOf([nudge]).more, true);
  assert.equal(helpOf([hint]).more, true);
  // before the moves nothing changes: the worked example has no question line and no Help
  assert.equal(helpOf([{ ...nudge, message: { agent: "app", kind: "example", text: "Before democracy, watch planet." }, phase: "example", move: null, level: null }]).more, false);
});

test("the exclusion's follow-up question stays in the part, with the answer before it, and isn't a retry", () => {
  const at = (id: string, kind: "question" | "feedback" | "named_move", text: string, move: "supraordinate" | "exclusion" = "exclusion"): Entry => ({
    id,
    from: "app",
    message: { agent: kind === "feedback" ? "evaluator" : "app", kind, text },
    phase: "move",
    move,
    level: 2,
  });
  const learner = (id: string, text: string): Entry => ({ id, from: "learner", text });
  const entries = [
    at("turn-6-0", "question", "What group?", "supraordinate"),
    learner("learner-1", "A software interface."),
    // turn 7 ends the bigger group and asks about the exclusion
    at("turn-7-0", "feedback", "Yes.", "exclusion"),
    at("turn-7-1", "named_move", "That's the bigger group.", "exclusion"),
    at("turn-7-2", "question", "What looks like an API but isn't one?"),
    learner("learner-2", "A server."),
    // turn 8 accepts the exclusion and asks for its difference, on the same move
    at("turn-8-0", "feedback", "A server is close."),
    at("turn-8-1", "question", "What's the key difference between API and server?"),
    learner("learner-3", "Server."),
    at("turn-9-0", "feedback", "That names it again, not the difference."),
    at("turn-9-1", "question", "What's the key difference between API and server?"),
  ];
  const part = currentPartOf(entries);
  assert.deepEqual(part.map((e) => e.id), ["turn-7-0", "turn-7-1", "turn-7-2", "learner-2", "turn-8-0", "turn-8-1", "learner-3", "turn-9-0", "turn-9-1"]);
  assert.equal(isFollowUpFeedback(part, 4), true);
  assert.equal(isFollowUpFeedback(part, 7), true);
  assert.equal(isFollowUpFeedback(part, 0), false);
  // follow-ups don't cap the part, so Help still costs a point
  assert.equal(cappedOf(part), false);
  assert.equal(helpOf(part).tag, "help −1");
  // a plain retry nudge does
  const retried = [...part, learner("learner-4", "Server!"), at("turn-10-0", "feedback", "Not yet: what does a server do that an API doesn't?")];
  assert.equal(cappedOf(retried), true);
  assert.equal(helpOf(retried).tag, "help");
  // picked up on the latest Turn alone (no saved steps), the follow-up is the first question on screen: the Helps and
  // retries before it are gone, so neither the firefly nor the sheet may promise a hint that the server would answer
  // with the answer itself (0 points)
  const alone = currentPartOf(entries.slice(-2));
  assert.deepEqual(alone.map((e) => e.id), ["turn-9-0", "turn-9-1"]);
  assert.deepEqual(helpOf(alone), { tag: "help", label: "More help", more: true });
  assert.equal(guidedHelpOf(alone).confirm, "Request help");
  assert.match(guidedHelpOf(alone).detail, /hint or the answer/);
  // the whole part, with the move's own question first, still knows the price
  assert.match(guidedHelpOf(part).detail, /at most 1 point instead of 2/);
});

test("hint cards use actual server steps, without inventing a count or charging a second point", () => {
  assert.deepEqual(hintCardOf("nudge"), { title: "Hint: where to look", filled: 1, note: "This area can now earn at most 1 point." });
  assert.equal(hintCardOf("hint").filled, 2);
  assert.equal(hintCardOf("partial").filled, 3);
  assert.equal(hintCardOf("reveal").note, "This area scores 0 points.");
  assert.equal(hintCardOf(undefined).filled, null);
  assert.equal(hintCardOf(undefined).title, "Hint");
  for (const step of [undefined, "nudge", "hint", "partial"] as const) assert.doesNotMatch(hintCardOf(step).title, /cost|−1|of 3/);
});

test("guided help previews the cap, no further loss after a retry, and zero before a reveal without mutating entries", () => {
  const question: Entry = { id: "q", from: "app", phase: "move", move: "supraordinate", level: 2, message: { agent: "questioner", kind: "question", text: "What category?" } };
  const retry: Entry = { ...question, id: "retry", message: { agent: "evaluator", kind: "feedback", text: "Try again." } };
  const hint = (step: "nudge" | "hint" | "partial" | undefined): Entry => ({ ...question, id: "hint", message: { agent: "hint_giver", kind: "hint", text: "Think it through.", ...(step ? { hintStep: step } : {}) } });
  const part = [question, retry];
  const before = JSON.stringify(part);
  assert.match(guidedHelpOf([question]).detail, /at most 1 point instead of 2/);
  assert.match(guidedHelpOf(part).detail, /does not reduce it further/);
  assert.equal(guidedHelpOf([question, hint("partial")]).confirm, "Show the answer");
  assert.match(guidedHelpOf([hint("partial")]).detail, /0 points/);
  assert.match(guidedHelpOf([hint("hint")]).detail, /does not reduce it further/);
  assert.match(guidedHelpOf([hint("partial"), question]).detail, /at most 1 point instead of 2/);
  assert.equal(JSON.stringify(part), before);
  for (const resumed of [[], [retry], [hint(undefined)], [question, hint(undefined)]]) {
    assert.equal(guidedHelpOf(resumed).confirm, "Request help");
    assert.match(guidedHelpOf(resumed).detail, /hint or the answer/);
    assert.match(guidedHelpOf(resumed).detail, /makes it 0/);
  }
});

test("the screen shows the Turn that asked the latest question, with the feedback that came with it", () => {
  // turn 7 says "yes", names the move, then asks about the next part
  assert.deepEqual(currentPartOf(through(7).entries).map((e) => e.id), ["turn-7-0", "turn-7-1", "turn-7-2"]);
});

test("the feedback on the part just finished leads the next part: the screen draws it over the question, not the name or a reveal", () => {
  // turn 7's "yes" on the bigger group is in the part on screen, and it's the line drawn above the question
  const part = currentPartOf(through(7).entries);
  assert.deepEqual(leadOf(part).map((e) => [e.id, e.message.text]), [["turn-7-0", "Yes: monarchy, dictatorship and democracy are all forms of government."]]);
  // the first part has nothing before its question, and a nudge Turn picked up after a reload has no question
  assert.deepEqual(leadOf(currentPartOf(through(4).entries)), []);
  assert.deepEqual(leadOf(through(5).entries.slice(-1)), []);
  // a part Help revealed brings the reveal and the name before the next question: neither is drawn there
  const at = (id: string, kind: "question" | "hint" | "named_move", text: string): Entry => ({
    id,
    from: "app",
    message: { agent: kind === "hint" ? "hint_giver" : "app", kind, text, ...(kind === "hint" ? { hintStep: "reveal" as const } : {}) },
    phase: "move",
    move: "exclusion",
    level: 2,
  });
  const revealed = [at("turn-9-0", "hint", "It's a form of government."), at("turn-9-1", "named_move", "That's called…"), at("turn-9-2", "question", "What isn't it?")];
  assert.deepEqual(leadOf(currentPartOf(revealed)), []);
});

test("a short lead becomes the label over a question, and code in a question goes in chips", () => {
  assert.deepEqual(eyebrowOf("Before any help: in your own words, what is democracy?"), { eyebrow: "before any help", text: "In your own words, what is democracy?" });
  assert.equal(eyebrowOf("Democracy is one example of a bigger group. What group?").eyebrow, null);
  assert.deepEqual(inlineCodeOf("Your agent wrote `fetch('/api/users/42')`. What do both sides agree on?"), [
    { code: false, text: "Your agent wrote " },
    { code: true, text: "fetch('/api/users/42')" },
    { code: false, text: ". What do both sides agree on?" },
  ]);
});

test("a filled part shows the learner's words; what it isn't reads as 'not …'; the example is shown, not earned", () => {
  const map: Mentefacto = { concept: "API", supraordinate: { value: "a software interface", note: null }, exclusion: [{ value: "a library", note: null }, { value: "not a server", note: null }], isoordinate: [], infraordinate: [] };
  assert.equal(partTextOf(map, "supraordinate"), "a software interface");
  assert.equal(partTextOf(map, "exclusion"), "not a library, not a server");
  assert.equal(partTextOf(map, "isoordinate"), null);
  assert.deepEqual(exampleParts(map).map((p) => p.state), ["revealed", "revealed", "revealed", "revealed"]);
});

test("the worked example's eight lines become four steps: a question, what goes on the map, the reasoning", () => {
  const lines = turns.find((t) => t.example)!.messages.filter((m) => m.kind === "example" && m.agent !== "app").map((m) => m.text);
  const steps = exampleStepsOf(lines)!;
  assert.deepEqual(steps.map((s) => s.move), ["supraordinate", "exclusion", "isoordinate", "infraordinate"]);
  assert.deepEqual(steps.map((s) => s.question), [
    "What kind of thing is a planet?",
    "What looks like a planet but isn't one?",
    "What does something need to count as a planet?",
    "What kinds of planets are there?",
  ]);
  assert.deepEqual(steps[1]!.items, ["not star", "not dwarf planet"]);
  assert.equal(steps[2]!.items.length, 3);
  assert.match(steps[0]!.reasoning, /^"A thing" is too broad/);
  assert.match(steps[1]!.reasoning, /Something closer: Pluto/);
  // a line that isn't one of the fixture's steps leaves the lines as they came
  assert.equal(exampleStepsOf([...lines, "Something new."]), null);
  assert.deepEqual(exampleQuestionOf("It needs enough mass."), { question: null, rest: "It needs enough mass." });
});

test("the gap is a signed number and one sentence", () => {
  assert.deepEqual(gapOf({ calibrationGap: 2 }), { headline: "You felt 2 points surer than you could explain.", note: "That's normal: explaining is how you find out.", over: true });
  assert.deepEqual(gapOf({ calibrationGap: -1 }), { headline: "You knew more than you felt: 1 point more.", note: "You explained more than you expected in this session.", over: false });
  assert.deepEqual(gapOf({ calibrationGap: 0 } as Pick<Result, "calibrationGap">), { headline: "Your prediction matched your score.", note: "Your confidence matched what you could explain in this session.", over: false });
});

test("what a learner shares is the concept and the numbers with the tagline and the address, never their words", () => {
  const brand = { name: "Lumente", tagline: "Build with AI. Understand the concepts yourself.", site: "https://example.test" };
  assert.equal(shareLineOf("JWT", { predictedScore: 6, score: 4 }, brand), "JWT on Lumente: I guessed 6 of 8 and proved 4. Build with AI. Understand the concepts yourself. https://example.test");
});

test("notes with a key, a token or a password stop at the phone, and the warning says which line", () => {
  // fakes, put together at run time so this file never holds a secret-shaped string
  const fake = (...parts: string[]) => parts.join("");
  const secrets = [
    fake("sk", "-ant-api03-", "a".repeat(24)),
    fake("AK", "IA", "Q".repeat(16)),
    fake("pass", "word = ", "hunter2", "hunter2"),
    fake("DATABASE_PASS", "WORD=", "hunter22"),
    fake("CLERK_SECRET", '_KEY="', "sk", "_test_", "a1".repeat(10), '"'),
    fake("-".repeat(5), "BEGIN RSA PRIVATE ", "KEY", "-".repeat(5)),
  ];
  for (const secret of secrets) assert.equal(secretLineOf(secret), 1, secret.slice(0, 4));
  assert.equal(secretLineOf(fake("JWT: login/ signs a token\n", "api", "_key: ", "9f8e7d6c".repeat(2))), 2);
  const fine = [
    "JWT: the API signs a token after login",
    "token: signed in auth/login.ts",
    "Password hashing: bcrypt in auth/hash.ts",
    "task-queue-processing-worker in jobs/",
    "rate limiting on /api/sessions",
  ];
  for (const text of fine) assert.equal(secretLineOf(text), null, text);
});

test("the transcript doesn't echo the guess, and screen readers hear what's happening", () => {
  const state = sent(received(initialState, turns[0]!), { turn: 1, prediction: 7 });
  assert.ok(state.entries.every((e) => e.from === "app" && e.phase === "predict"));
  assert.equal(waitingLineOf(state.pending), "Locking in your guess.");
  assert.equal(waitingLineOf({ turn: 2, text: "x" }), "Checking your answer.");
  assert.equal(waitingLineOf({ turn: 2, question: "Is it a kind of token?" }), "Looking up the fact.");
  assert.equal(waitingLineOf({ turn: 2, action: "help" }), "Finding a hint.");
});

test("on the whole map, Help costs a point on each new part, then names the part it helps", () => {
  assert.deepEqual(wholeMapHelpOf(0), { tag: "help −1", label: "Help, costs a point" });
  assert.deepEqual(wholeMapHelpOf(1), { tag: "help", label: "More help" });
  // the fourth Help revealed the bigger group, so the next one starts on what it isn't
  assert.equal(wholeMapHelpOf(4)?.tag, "help −1");
  assert.equal(wholeMapHelpOf(16), null);
  assert.deepEqual([0, 3, 4, 8, 15].map(hintPartOf), ["supraordinate", "supraordinate", "exclusion", "isoordinate", "infraordinate"]);
  assert.deepEqual([0, 1, 4, 5].map(firstOnPart), [true, false, true, false]);
  // the hint cards count from the Turn's total: in a session on screen from the start the transcript holds every
  // hint, and one picked up after a reload holds only the latest Turn's, so its one hint is still the sixth
  assert.deepEqual([0, 1].map((i) => hintNumberOf(2, 2, i)), [0, 1]);
  assert.equal(hintNumberOf(6, 1, 0), 5);
  assert.equal(hintPartOf(hintNumberOf(6, 1, 0)), "exclusion");
  assert.equal(firstOnPart(hintNumberOf(6, 1, 0)), false);
  assert.equal(hintNumberOf(0, 0, 0), 0);
});

test("a part is written back clean: blanks go, and only an exclusion keeps its difference", () => {
  const map = blankMap("CORS");
  const exclusion = withPart(map, "exclusion", [
    { value: " same-origin policy ", note: " it relaxes that policy " },
    { value: "  ", note: "ignored" },
    { value: "a firewall", note: " " },
  ]);
  assert.deepEqual(exclusion.exclusion, [
    { value: "same-origin policy", note: "it relaxes that policy" },
    { value: "a firewall", note: null },
  ]);
  assert.deepEqual(withPart(map, "isoordinate", [{ value: "an Origin header", note: "dropped" }]).isoordinate, [{ value: "an Origin header", note: null }]);
  assert.equal(withPart(map, "supraordinate", [{ value: "", note: null }]).supraordinate, null);
  assert.equal(filledOf(exclusion), 1);
  assert.deepEqual(itemsOf(withPart(map, "supraordinate", [{ value: "browser security mechanism", note: null }]), "supraordinate"), [
    { value: "browser security mechanism", note: null },
  ]);
});

test("the whole map lights the learner's words unscored, and keeps what Help revealed dim", () => {
  const draft = withPart(withPart(blankMap("CORS"), "supraordinate", [{ value: "a browser security rule", note: null }]), "exclusion", [{ value: "a firewall", note: null }]);
  const server = { ...blankMap("CORS"), exclusion: [{ value: "a firewall", note: null }] };
  assert.deepEqual(
    wholeMapPartsOf(draft, server).map((p) => `${p.state}:${p.text}:${p.pips}`),
    ["lit:a browser security rule:null", "revealed:not a firewall:null", "unasked:null:null", "unasked:null:null"],
  );
});

test("navigation suggests each empty area in order without scoring answers or changing the map", () => {
  let map = blankMap("CORS");
  const order = ["supraordinate", "exclusion", "isoordinate", "infraordinate"] as const;
  for (const [i, move] of order.entries()) {
    const before = JSON.stringify(map);
    assert.equal(nextPartOf(map), move);
    assert.equal(filledOf(map), i);
    assert.equal(JSON.stringify(map), before);
    // Interface completion accepts any text; only the evaluator can judge an answer.
    map = withPart(map, move, [{ value: "my ungraded answer", note: null }]);
  }
  assert.equal(nextPartOf(map), null);
  assert.equal(filledOf(map), 4);
  assert.equal(nextPartOf(withPart(map, "exclusion", [])), "exclusion");
});

test("out-of-order edits, whitespace, and revealed answers keep navigation and the count consistent", () => {
  const map = { ...blankMap("CORS"), supraordinate: { value: "  ", note: null }, infraordinate: [{ value: "draft", note: null }] };
  assert.equal(nextPartOf(map), "supraordinate");
  assert.equal(filledOf(map), 1);
  const revealed = withPart(map, "supraordinate", [{ value: "shown answer", note: null }]);
  assert.equal(nextPartOf(revealed), "exclusion");
  assert.equal(filledOf(revealed), 2);
});

test("the fact chat shows the learner's lines, the desk's answers and the hints, never the opening instruction; the phone scrolls only for those", () => {
  const app = (id: string, kind: "question" | "fact" | "redirect" | "hint", text: string, phase: "predict" | "move" | "result" = "move"): Entry => ({ id, from: "app", message: { agent: kind === "question" ? "app" : kind === "hint" ? "hint_giver" : "fact_desk", kind, text, ...(kind === "hint" ? { hintStep: "hint" as const } : {}) }, phase, move: null, level: 5 });
  const learner = (id: string, text: string): Entry => ({ id, from: "learner", text });
  const opening = app("turn-2-0", "question", "Build the mentefacto for CORS. Ask me any facts you need.");
  const entries = [opening, learner("learner-1", "Does curl get blocked?"), app("turn-3-0", "fact", "No: browsers enforce it."), app("turn-4-0", "hint", "Where does CORS run?")];
  assert.deepEqual(deskOf(entries).map((e) => e.id), ["learner-1", "turn-3-0", "turn-4-0"]);
  // the guess's and the result's lines aren't the desk's either
  assert.deepEqual(deskOf([app("turn-1-0", "question", "How many points?", "predict"), app("turn-9-0", "fact", "x", "result")]), []);
  // the key moves when a line, a call in flight or a failure is added, and holds while the map is edited
  const before = chatKeyOf(deskOf(entries), false, false);
  assert.equal(chatKeyOf(deskOf(entries), false, false), before);
  assert.notEqual(chatKeyOf(deskOf([...entries, learner("learner-2", "Is it a header?")]), true, false), before);
  assert.notEqual(chatKeyOf(deskOf(entries), true, false), before);
  assert.notEqual(chatKeyOf(deskOf(entries), false, true), before);
});

test("the whole-map evaluator's note on each part comes off its label", () => {
  const notes = partNotesOf([
    { agent: "evaluator", kind: "feedback", text: "Bigger group: 'Security' is too broad. What's the closest group?" },
    { agent: "evaluator", kind: "feedback", text: "What it isn't: A sharp exclusion." },
    { agent: "coach", kind: "summary", text: "Bigger group: not a note" },
    { agent: "evaluator", kind: "feedback", text: "Not quite: a law is one rule." },
  ]);
  assert.deepEqual(notes, { supraordinate: "'Security' is too broad. What's the closest group?", exclusion: "A sharp exclusion." });
  assert.equal(partMeaningOf("isoordinate", "CORS"), "List the features every example must have. Together, they should distinguish CORS from other things in the same category.");
});

test("self-test questions explain category, comparison, defining features and a consistent classification rule", () => {
  assert.equal(mapQuestionOf("supraordinate", "API"), "API is a kind of…");
  assert.equal(mapQuestionOf("exclusion", "API"), "What else belongs to the same category, but isn't API?");
  assert.equal(mapQuestionOf("isoordinate", "API"), "What are the defining features of API?");
  assert.equal(mapQuestionOf("infraordinate", "API"), "How would you classify API?");
  assert.match(partMeaningOf("infraordinate", "API"), /grouping rule.*at least two types.*same rule/);
  assert.match(partMeaningOf("exclusion", "API"), /same category.*key difference/);
  assert.equal(mapQuestionOf("supraordinate", "hashing"), "hashing is a kind of…");
});

test("comparison context echoes the learner's ungraded category and follows edits without changing answers", () => {
  const blank = blankMap("API");
  assert.equal(categoryContextOf(blank), null);
  assert.equal(categoryContextOf({ ...blank, supraordinate: { value: "  ", note: null } }), null);
  const draft = withPart(blank, "supraordinate", [{ value: "  my proposed category  ", note: null }]);
  const before = JSON.stringify(draft);
  const comparison = wholeMapPartsOf(draft, blank).find(part => part.move === "exclusion")!;
  assert.equal(comparison.context, "Your chosen category: my proposed category");
  assert.equal(comparison.prompt, mapQuestionOf("exclusion", "API"));
  assert.equal(JSON.stringify(draft), before);
  const changed = withPart(draft, "supraordinate", [{ value: "a different category", note: null }]);
  assert.equal(wholeMapPartsOf(changed, blank).find(part => part.move === "exclusion")!.context, "Your chosen category: a different category");
  assert.equal(wholeMapPartsOf(blank, blank).find(part => part.move === "exclusion")!.context, null);
});

test("guided map orientation preserves answers, earned points, asked state and the adaptive Turn", () => {
  const turn = turnAt(7);
  const base = partsOf(turn, through(7).entries);
  const before = JSON.stringify({ turn, base });
  const guided = withMapQuestions(base, turn.mentefacto);
  assert.equal(guided[1]!.context, "Your chosen category: form of government");
  for (const [i, part] of guided.entries()) {
    const { prompt, context: _context, ...unchanged } = part;
    assert.equal(prompt, mapQuestionOf(part.move, turn.mentefacto.concept));
    assert.deepEqual(unchanged, base[i]);
  }
  assert.equal(JSON.stringify({ turn, base }), before);
});

test("guided answer labels clarify each task without prompting the initial explanation", () => {
  assert.equal(answerLabelOf(turnAt(2)), "Your first explanation");
  assert.equal(answerLabelOf(turnAt(4)), "democracy is a kind of…");
  assert.match(answerLabelOf(turnAt(7)), /similar concept in this category.*key difference/);
  assert.match(answerLabelOf(turnAt(11)), /Defining features every example must have/);
  assert.match(answerLabelOf({ ...turnAt(11), move: "infraordinate" }), /grouping rule.*at least two types.*that rule/);
});

test("the optional worked example uses its own concept and clearly labels its category as an example", () => {
  const example = turnAt(3).example!;
  const parts = withMapQuestions(exampleParts(example), example, true);
  assert.equal(parts[0]!.prompt, mapQuestionOf("supraordinate", example.concept));
  assert.equal(parts[1]!.context, categoryContextOf(example, "Example category"));
});

test("the memory line under a hint or the coach's words joins the cited facts' own sentences", () => {
  assert.equal(
    rememberedLineOf([{ text: "Last time on API you guessed 7 and proved 3." }, { text: " 'Its types' took 2 Helps on API last time. " }]),
    "From what Lumente remembers: Last time on API you guessed 7 and proved 3. 'Classification' took 2 Helps on API last time.",
  );
});

test("the Memory sheet's words: each part's level now and how it got there, the reads, and the gap beside the one before", () => {
  const view = MemoryView.parse(memoryView);
  const cors = memoryConceptOf(view.concepts[0]!);
  assert.equal(cors.concept, "CORS");
  assert.deepEqual(cors.moves.map((m) => [m.label, m.now, m.reads]), [
    ["Category", "level 3", 5],
    ["Similar concepts & differences", "level 2", 1],
    ["Defining features", "level 2", 1],
    ["Classification", "no level yet", 0],
  ]);
  // the dates read in the device's time zone, so only their shape is fixed here
  assert.equal(cors.moves[0]?.history.length, 2);
  assert.match(cors.moves[0]!.history[0]!, /^level 3 since [A-Z][a-z]{2} \d{1,2}$/);
  assert.match(cors.moves[0]!.history[1]!, /^level 2 from [A-Z][a-z]{2} \d{1,2} to [A-Z][a-z]{2} \d{1,2}$/);
  assert.deepEqual(cors.moves[3]?.history, []);
  assert.match(cors.gap!, /^Last time, [A-Z][a-z]{2} \d{1,2}: you guessed 6 and proved 5\. Before, [A-Z][a-z]{2} \d{1,2}: you guessed 7 and proved 4\.$/);
  assert.equal(memoryConceptOf({ ...view.concepts[0]!, gap: { latest: null, previous: null } }).gap, null);
  assert.equal(shortDateOf("not a date"), "");
});

test("every unfinished session's Resume card says the same thing, the one on screen included: its kind and the day it started", () => {
  // the date reads in the device's time zone, so the session starts at noon on Oct 24 in the zone the test runs in
  const createdAt = new Date(2026, 9, 24, 12).toISOString();
  assert.equal(resumeLineOf({ mode: "learn", createdAt }), "session started Oct 24");
  assert.equal(resumeLineOf({ mode: "test", createdAt }), "self-test started Oct 24");
  assert.equal(resumeLineOf({ mode: "learn", createdAt: "not a date" }), "session started");
});
