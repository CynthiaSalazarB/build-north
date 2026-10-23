// #25 done when: 10 test questions for "inflation", 5 of them asking for the structure: zero leaks, and
// `questionType` right on 8 of 10. A leak is a structure question answered with facts, or a fact answer
// that names a bigger group, a type or a requirement of inflation. Leak patterns are a net, not proof:
// read the printed answers too. JWT and CORS, the demo's concepts, and RAG and embeddings, the start
// screen's AI presets, get 10 questions each the same way, with their own leak patterns, and the same
// bar: zero leaks, and the type right on 8 of every 10. API (the demo's concept since #96) and the testers'
// pre/post-test concepts, database index and rate limiting, get 12 each: the same 10, plus two answers
// typed in the chat (`states_an_answer`, Oct 22). Name concepts after `--` to run only those
// (`npm run eval:fact-desk -- JWT CORS`).
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
  {
    concept: "RAG",
    // its bigger group (an AI or LLM technique, a design pattern, prompt or context engineering), and its
    // types by pipeline (naive, advanced, modular, agentic), by what it searches (vector, graph, hybrid),
    // or a named variant (Self-RAG, RAG-Fusion, the 2020 paper's RAG-Sequence and RAG-Token)
    leak: /(types?|kinds?|sorts?|flavou?rs?|variants?|forms?) of (RAG|retrieval[- ]augmented generation)|\b(AI|LLM|NLP|ML|machine[- ]learning|deep[- ]learning|prompting|grounding) (techniques?|methods?|approach(es)?|patterns?|architectures?|frameworks?|strateg(y|ies))|(design|architecture|architectural) patterns?|prompt engineering|context engineering|\b(naive|advanced|modular|agentic|graph|vector|hybrid|multi-?modal|corrective|adaptive|speculative|self)[- ]?RAG\b|RAG[- ](fusion|sequence|token)\b|hybrid (search|retrieval)/i,
    cases: [
      { question: "What's the bigger group that RAG belongs to?", structure: true, type: "asks_for_structure" },
      { question: "Is RAG a kind of prompt engineering?", structure: true, type: "asks_for_structure" },
      { question: "What types of RAG are there?", structure: true, type: "asks_for_structure" },
      { question: "Is it something about search?", structure: true, type: "asks_for_structure" },
      { question: "What does something need to count as RAG?", structure: true, type: "asks_for_structure" },
      { question: "How is RAG different from fine-tuning a model?", structure: false, type: "contrast" },
      { question: "If I paste the whole document into the chat myself, is that still RAG?", structure: false, type: "breaking_case" },
      { question: "Does RAG need a vector database?", structure: false, type: "what_it_needs" },
      { question: "Is RAG like letting the model take an open-book exam?", structure: false, type: "compare" },
      { question: "Who came up with the name RAG, and when?", structure: false, type: "fact" },
    ],
  },
  {
    concept: "embeddings",
    // its bigger group (a vector or numerical representation, a feature vector), and its types by what
    // they encode (word, sentence, image, graph, multimodal), static or contextual, or a named method
    // (word2vec, GloVe, fastText). "Text embedding model" is the tool's usual name, so a type right before
    // "model" doesn't count
    leak: /(types?|kinds?|sorts?) of embeddings?|(vector|numerical|numeric|learned|dense|latent|distributed|continuous) representations?|feature vectors?|representation learning|\b(word|sentence|text|document|image|audio|video|multi-?modal|graph|node|user|item|token|positional|contextual(ized)?|static) embeddings?\b(?! models?)|word2vec|GloVe|fastText|node2vec/i,
    cases: [
      { question: "What's the bigger group that embeddings belong to?", structure: true, type: "asks_for_structure" },
      { question: "Is an embedding a kind of vector?", structure: true, type: "asks_for_structure" },
      { question: "What types of embeddings are there?", structure: true, type: "asks_for_structure" },
      { question: "Is it something about meaning?", structure: true, type: "asks_for_structure" },
      { question: "What does a list of numbers need to count as an embedding?", structure: true, type: "asks_for_structure" },
      { question: "How is an embedding different from a hash of the same text?", structure: false, type: "contrast" },
      { question: "If I compare embeddings from two different models, does the distance between them still mean anything?", structure: false, type: "breaking_case" },
      { question: "Does an embedding have to be the same length for a short input and a long one?", structure: false, type: "what_it_needs" },
      { question: "Is an embedding like GPS coordinates for meaning?", structure: false, type: "compare" },
      { question: "What does cosine similarity measure between two embeddings?", structure: false, type: "fact" },
    ],
  },
  {
    concept: "API",
    // the demo's concept (#96): its bigger group (a software interface, a contract between programs; the
    // letters' expansion is a fact, not the group), and its types by style (REST, SOAP, GraphQL, gRPC) or
    // by where they live (web, library, operating system)
    leak: /(types?|kinds?|sorts?) of APIs?|\b(REST(ful)?|SOAP|GraphQL|gRPC|RPC|WebSockets?)\b|web APIs?|library APIs?|operating[- ]system APIs?|\bOS APIs?|system calls?|(public|private|partner|internal|open) APIs?|software interfaces?|(?<!application )programming interfaces?|interfaces? (between|for) (programs|software|applications)|contracts? between/i,
    cases: [
      { question: "What's the bigger group that an API belongs to?", structure: true, type: "asks_for_structure" },
      { question: "Is an API a kind of interface?", structure: true, type: "asks_for_structure" },
      { question: "What types of APIs are there?", structure: true, type: "asks_for_structure" },
      { question: "Is it something about connecting programs?", structure: true, type: "asks_for_structure" },
      { question: "What does something need to count as an API?", structure: true, type: "asks_for_structure" },
      { question: "How is an API different from a library?", structure: false, type: "contrast" },
      { question: "If two functions in the same program call each other, is that using an API?", structure: false, type: "breaking_case" },
      { question: "Does an API have to go over the internet?", structure: false, type: "what_it_needs" },
      { question: "Is an API like a restaurant menu?", structure: false, type: "compare" },
      { question: "What is an HTTP status code?", structure: false, type: "fact" },
      // answers typed in the chat instead of on the map (Oct 22): the app shows its own fixed line
      { question: "software interface", structure: true, type: "states_an_answer" },
      { question: "REST and GraphQL", structure: true, type: "states_an_answer" },
    ],
  },
  {
    concept: "database index",
    // the testers' pre/post-test concept (docs/tester-protocol.md): its bigger group (a data structure, a
    // lookup structure), and its types by structure (B-tree, hash, bitmap) or by role (clustered,
    // composite, covering, unique, full-text, primary, secondary)
    leak: /(types?|kinds?|sorts?) of (database )?indexe?s|\bB\+?-?trees?\b|hash index(es)?|bitmap index|\bclustered|non-?clustered|composite index|covering index|unique index|full-?text index|partial index|primary index|secondary index|\bGIN\b|\bGiST\b|(lookup|auxiliary|search|data) structures?/i,
    cases: [
      { question: "What's the bigger group that a database index belongs to?", structure: true, type: "asks_for_structure" },
      { question: "Is an index a kind of data structure?", structure: true, type: "asks_for_structure" },
      { question: "What types of indexes are there?", structure: true, type: "asks_for_structure" },
      { question: "Is it something about speed?", structure: true, type: "asks_for_structure" },
      { question: "What does something need to count as a database index?", structure: true, type: "asks_for_structure" },
      { question: "How is an index different from just sorting the table?", structure: false, type: "contrast" },
      { question: "If I add an index to a column I never search on, do my queries get faster?", structure: false, type: "breaking_case" },
      { question: "Does an index have to be stored apart from the table?", structure: false, type: "what_it_needs" },
      { question: "Is an index like the index at the back of a book?", structure: false, type: "compare" },
      { question: "Why do inserts get slower when a table has many indexes?", structure: false, type: "fact" },
      { question: "a data structure for fast lookups", structure: true, type: "states_an_answer" },
      { question: "B-tree and hash indexes", structure: true, type: "states_an_answer" },
    ],
  },
  {
    concept: "rate limiting",
    // the testers' other pre/post-test concept: its bigger group (traffic control, a throttling or
    // access-control technique), and its types by algorithm (token bucket, leaky bucket, fixed or sliding
    // window) or by key (per user, per IP)
    leak: /(types?|kinds?|sorts?) of rate limit(ing|s|ers)?|token bucket|leaky bucket|fixed[- ]window|sliding[- ](window|log)|per[- ](user|IP|key|client)\b|concurrency limits?|traffic (control|management|shaping)|throttling (mechanisms?|techniques?|polic(y|ies))|(access|flow)[- ]control (mechanisms?|techniques?)/i,
    cases: [
      { question: "What's the bigger group that rate limiting belongs to?", structure: true, type: "asks_for_structure" },
      { question: "Is rate limiting a kind of security measure?", structure: true, type: "asks_for_structure" },
      { question: "What types of rate limiting are there?", structure: true, type: "asks_for_structure" },
      { question: "Is it something about traffic?", structure: true, type: "asks_for_structure" },
      { question: "What does something need to count as rate limiting?", structure: true, type: "asks_for_structure" },
      { question: "How is rate limiting different from blocking an IP address?", structure: false, type: "contrast" },
      { question: "If a server just slows down when it's busy, is that rate limiting?", structure: false, type: "breaking_case" },
      { question: "Does rate limiting have to send back an error when the limit is hit?", structure: false, type: "what_it_needs" },
      { question: "Is rate limiting like a bouncer letting people in one at a time?", structure: false, type: "compare" },
      { question: "What does HTTP status code 429 mean?", structure: false, type: "fact" },
      { question: "a way to control traffic", structure: true, type: "states_an_answer" },
      { question: "token bucket and fixed window", structure: true, type: "states_an_answer" },
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
  // what the learner sees: code shows a fixed line for a redirect and for an answer typed in the chat
  const fixed = o.kind === "redirect" || o.questionType === "states_an_answer";
  const leak = c.structure ? !fixed : !fixed && (JARGON.test(o.answer) || c.leak.test(o.answer));
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
