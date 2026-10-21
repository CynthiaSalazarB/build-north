// #25 done when: 10 test questions for "inflation", 5 of them asking for the structure: zero leaks, and
// `questionType` right on 8 of 10. A leak is a structure question answered with facts, or a fact answer
// that names a bigger group, a type or a requirement of inflation. Leak patterns are a net, not proof:
// read the printed answers too. JWT and CORS, the demo's concepts, get 10 questions each the same way,
// with their own leak patterns, and the same bar: zero leaks, and the type right on 8 of every 10. Name
// concepts after `--` to run only those (`npm run eval:fact-desk -- JWT CORS`).
import { AGENTS, FACT_DESK_REDIRECT, type QuestionType } from "../src/index.ts";
import { dollars, MODEL, pick, runAgent } from "./run-agent.ts";

type Case = { question: string; structure: boolean; type: QuestionType };

// The method's names for the parts, which no fact answer uses.
const JARGON = /bigger group|supraordinate|isoordinate|infraordinate|exclusion/i;

// Each concept's leak pattern names the parts of its map that a fact answer must not hand over.
const CONCEPTS = pick<{ concept: string; leak: RegExp; cases: Case[] }>([
  {
    concept: "inflation",
    leak: /types? of inflation|kinds? of inflation|demand[- ]pull|cost[- ]push|hyperinflation|stagflation|disinflation|creeping|galloping|economic (phenomenon|process|condition|concept|indicator)|monetary phenomenon/i,
    cases: [
      { question: "What's the bigger group that inflation belongs to?", structure: true, type: "asks_for_structure" },
      { question: "Is inflation a kind of economic phenomenon?", structure: true, type: "asks_for_structure" },
      { question: "What types of inflation are there?", structure: true, type: "asks_for_structure" },
      { question: "Is it something about money?", structure: true, type: "asks_for_structure" },
      { question: "What does something need to count as inflation?", structure: true, type: "asks_for_structure" },
      { question: "Is it when one thing gets more expensive, or everything?", structure: false, type: "contrast" },
      { question: "If gas goes up, is that inflation?", structure: false, type: "breaking_case" },
      { question: "Does it have to last a long time to count?", structure: false, type: "what_it_needs" },
      { question: "Is inflation like what happens when a currency loses value against the dollar?", structure: false, type: "compare" },
      { question: "When did Canada last have inflation above 5%?", structure: false, type: "fact" },
    ],
  },
  {
    concept: "JWT",
    // its bigger group (a token format, a security token), and its types by what protects it (signed,
    // encrypted, unsecured), by the signing key, or by what it's for
    leak: /(types?|kinds?|sorts?) of (JWTs?|JSON web tokens?|tokens?)|token format|security token|credential|\bJW[SE]\b|JSON web (signature|encryption)|signed (or|and) encrypted|encrypted (or|and) signed|unsecured JWT|nested JWT|\bID tokens?\b|\b[EHPR]S256\b|\b(a)?symmetric\b/i,
    cases: [
      { question: "What's the bigger group that a JWT belongs to?", structure: true, type: "asks_for_structure" },
      { question: "Is a JWT a kind of access token?", structure: true, type: "asks_for_structure" },
      { question: "What types of JWT are there?", structure: true, type: "asks_for_structure" },
      { question: "Is it something about logging in?", structure: true, type: "asks_for_structure" },
      { question: "What does a token need to count as a JWT?", structure: true, type: "asks_for_structure" },
      { question: "How is a JWT different from a session id the server keeps?", structure: false, type: "contrast" },
      { question: "If someone changes the user id inside a JWT, is it still valid?", structure: false, type: "breaking_case" },
      { question: "Does a JWT have to expire?", structure: false, type: "what_it_needs" },
      { question: "Is a JWT like a signed permission slip?", structure: false, type: "compare" },
      { question: "When was the JWT standard published?", structure: false, type: "fact" },
    ],
  },
  {
    concept: "CORS",
    // its bigger group (a browser security or access-control mechanism), and its types: simple or
    // preflighted, with or without credentials
    leak: /(types?|kinds?|sorts?) of (CORS|cross-origin)( requests?)?|security (features?|mechanisms?)|access[- ]control mechanisms?|header[- ]based mechanisms?|browser security (rules?|polic(y|ies)|features?|mechanisms?)|simple requests?|pre-?flight|credentialed requests?|requests? with credentials/i,
    // the demo's presenter asks the curl, header and security feature questions (P4, agents/fixtures/demo-seed.json)
    cases: [
      { question: "What's the bigger group that CORS belongs to?", structure: true, type: "asks_for_structure" },
      { question: "Is CORS a kind of security feature?", structure: true, type: "asks_for_structure" },
      { question: "What types of CORS requests are there?", structure: true, type: "asks_for_structure" },
      { question: "Is it something about the browser?", structure: true, type: "asks_for_structure" },
      { question: "What does something need to count as CORS?", structure: true, type: "asks_for_structure" },
      { question: "How is CORS different from the same-origin policy?", structure: false, type: "contrast" },
      { question: "If I call my API with curl, does CORS still block it?", structure: false, type: "breaking_case" },
      { question: "Does the server have to send a header for the browser to allow it?", structure: false, type: "what_it_needs" },
      { question: "Is CORS like a guest list the server gives the browser?", structure: false, type: "compare" },
      { question: "Which standard defines CORS today?", structure: false, type: "fact" },
    ],
  },
]);

const empty = (concept: string) => ({ concept, supraordinate: null, exclusion: [], isoordinate: [], infraordinate: [] });
const cases = CONCEPTS.flatMap((g) => g.cases.map((c) => ({ ...c, concept: g.concept, leak: g.leak })));
const runs = await Promise.all(
  cases.map((c) => runAgent(AGENTS.fact_desk, { concept: c.concept, material: null, mentefacto: empty(c.concept), question: c.question })),
);

const tally = new Map(CONCEPTS.map((g) => [g.concept, { leaks: 0, typesRight: 0, total: g.cases.length }]));
console.log(`Fact desk on ${MODEL}, ${CONCEPTS.map((g) => g.concept).join(", ")}\n`);
cases.forEach((c, i) => {
  const { output: o, ms } = runs[i]!;
  const leak = c.structure ? o.kind !== "redirect" : o.kind === "fact" && (JARGON.test(o.answer) || c.leak.test(o.answer));
  const typeOk = o.questionType === c.type;
  const t = tally.get(c.concept)!;
  if (leak) t.leaks++;
  if (typeOk) t.typesRight++;
  const redirectText = o.kind === "redirect" && o.answer !== FACT_DESK_REDIRECT ? " (model text differs; code shows the fixed one)" : "";
  console.log(`${leak ? "✘ LEAK" : "✔"} ${typeOk ? "" : `[type ${o.questionType}, expected ${c.type}] `}${c.concept}: "${c.question}" → ${o.kind}${redirectText} (${ms} ms)`);
  if (o.kind === "fact") console.log(`    ${o.answer}`);
});

const totals = [...tally.values()].reduce((sum, t) => ({ leaks: sum.leaks + t.leaks, typesRight: sum.typesRight + t.typesRight, total: sum.total + t.total }));
const typesNeeded = Math.ceil(totals.total * 0.8);
console.log(`\n${[...tally].map(([concept, t]) => `${concept}: ${t.leaks} leaks, type ${t.typesRight}/${t.total}`).join(" · ")}`);
console.log(`leaks: ${totals.leaks} (need 0) · questionType right: ${totals.typesRight}/${totals.total} (need ${typesNeeded}) · ${dollars(runs)}`);
process.exitCode = totals.leaks === 0 && totals.typesRight >= typesNeeded ? 0 : 1;
