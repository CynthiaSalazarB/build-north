---
title: "Product thesis: what Lumente solves and why it should work"
type: synthesis
related: ["[[evidence]]"]
created: 2026-10-21
updated: 2026-10-22
---

What Lumente solves, how it works, why it should work, what is still unproven, and where it
goes. The evidence behind it is in [evidence](../context/evidence.md), the decisions in
[`DECISIONS.md`](../../DECISIONS.md), and the technical details in
[`agents/CONTRACTS.md`](../../agents/CONTRACTS.md).

## In one minute

- **The problem:** AI coding agents write working code faster than students can understand it. The
  gap shows when someone asks them to explain it.
- **Who it's for first:** programming students who build with AI agents.
- **What it does:** the student builds a map of a concept themselves, first answering questions and
  then asking their own, while the app's help fades.
- **How it's different:** AI study modes are chats a student can switch off. Here the student builds a
  structure, the help fades as they show they can do more, and the app shows the gap between the score
  they predicted and the one they got.
- **Why it should work:** each piece rests on learning research: help that fades, asking your own
  questions, explaining in your own words, and learning a concept outside one single context.
- **What's still open:** whether the whole combination beats a study mode. The Oct 23 pilot is the
  first measurement.

## The problem we solve now

AI coding agents produce working code faster than students can understand it. The gap shows up at a
specific moment: someone asks "why did you do it this way?" or "explain this concept" in a code
review, an exam, a project defense or an interview, and the mind goes blank.

Psychologists call the feeling behind it the illusion of explanatory depth: people believe they
understand how something works much better than they do, until they try to explain it. AI makes the
illusion easier to fall into: the code works, so it feels understood.

Two studies with programmers show it directly. In a randomized trial at Anthropic (January 2026), 52
mostly junior engineers learned a Python library they had never used: the ones coding with an AI
assistant scored 50% on a quiz about it, against 67% for those who coded by hand, and the biggest gap
was in debugging. In a lab study of 21 novice programmers (ICER 2024), most of those who struggled
while using AI thought they understood more than they did, and finished with an illusion of
competence.

AI also lends confidence. In two studies at Aalto University (246 and 452 people), participants who
solved logical-reasoning problems with ChatGPT scored better, but overestimated their score by about 4
points, and those who rated themselves as most AI literate were the most overconfident. The confidence
came with the AI; the learner didn't earn it. That is why the app asks for a prediction before
anything else.

The first group is programming students who build with AI coding agents. The app works for any concept
and any learner. "First group" means who we build the demo for, test with, sell to and talk about
first.

## What Lumente is

**Build with AI. Understand the concepts yourself.**

The name is *lumen* plus *mente*, light and mind: in the app, questions are the light, and the map lights up
one part at a time as the learner proves it.

For programming students who build with AI agents but can't explain what they built, Lumente is
where they figure out the concepts their projects use. First they answer questions, then they ask their
own, while the help fades level by level. Unlike AI study modes, it isn't a mode they can switch off
halfway: they build the concept map themselves, and at the end they see their real score next to the
one they predicted.

| Layer | What it means |
|---|---|
| The skill it trains | figuring out an unfamiliar concept by asking their own questions. The map's four parts are where the questions start, not a list to memorize (see below) |
| What they get right away | explaining a concept their project uses in their own words, and telling it apart from similar concepts |
| Why they care | getting hired, feeling capable, and keeping up as tools change, without handing the thinking to AI |

Understanding the student's own project (why the agent chose a pattern, how the code flows) is the
next layer, not this build. See [Where it goes](#where-it-goes).

**The help fades. The understanding stays.**

## The method in plain words

### The concept map

The map comes from **Conceptual Pedagogy**, a teaching approach developed in Colombia by Miguel de
Zubiría. In it, understanding a concept means placing it: what it belongs to, what it isn't, what
defines it, and what kinds of it exist. Its diagram of a concept is called a **conceptual mentefact**
(*mentefacto conceptual* in the original Spanish; it has no standard English name): a map of one
concept with a fixed shape. It follows Aristotle's way of defining things: the closest group, plus
what makes the thing different from the rest of that group.

The four parts, with "API" as the example:

| Part of the map | What it captures | For "API" |
|---|---|---|
| The bigger group | the closest kind of thing it is | a software interface |
| What it isn't | the things it is often confused with, and how it differs from each | not a library (code you add to a project; a library *has* an API), not a server (a server can host an API), not a database |
| What it needs | what must be true for something to be one | a defined set of requests and responses; it hides how the other side works |
| Its types | the kinds that exist, split by one criterion | by where it lives: web APIs, library APIs, operating system APIs |

The bigger group is checked with one sentence: "An API is a kind of ___". "A software interface" fits.
"A server" sounds close but fails: an API runs on a server, but it isn't a kind of server. Related is
not the same as belonging.

**This is not a set of questions to memorize.** The four parts are where questions start. At the last
level the learner asks whatever they need, and the app counts how many of their questions actually test
the concept: comparing it with something, contrasting it, trying a case that might break it, or
checking whether a feature is required.

### How a session runs

1. The learner names a concept and, if they have it, pastes material about it: notes, docs or an
   article, up to 8,000 characters. Without material, the agents use general knowledge.
2. They predict their score from 0 to 8 (up to 2 points for each part), so their confidence is on
   record before they start. Then they explain the concept in their own words as a first attempt.
3. They build the map one part at a time. Claude agents ask the questions and judge the answers; they
   never write the map. Any answer that can be defended passes, not one expected answer.
4. The help fades. Each part of the map has its own level, and a new learner starts at level 1:
   1. **Watch:** a worked example (the concept "planet") fills in step by step.
   2. **Guided:** a question for that part.
   3. **Complete:** part of the answer is given; the learner adds the rest.
   4. **Named only:** the app only names the part; the learner does it.
   5. **Alone:** once all four parts reach level 5, the learner builds the whole map and asks a fact
      desk for facts when they need them.

   A part moves up a level when the learner gets it with at most one retry or request for help. Hints
   (where to look, part of the answer, the answer) come only when the learner taps Help, and each one
   costs points.
5. At level 5 the roles flip: the learner asks the questions. The fact desk answers with facts, never
   with any part of the map.
6. The real score appears next to the prediction. That gap is the reality check: how sure they felt
   versus how well they did.

**Numbers in code, words in the model:** the scores, the levels and the hints are computed by plain
code, so every number can be explained. The AI only writes the questions, judges the answers and words
the hints.

## Why it should work

Each design choice comes from a research finding. For each one: what was found, then what the app does
with it.

- **Help that fades.** A tutor's support, called scaffolding, lets a learner do what they can't yet do
  alone, and it should be taken away as they improve. Cognitive apprenticeship turns that into a
  sequence: show, guide, then step back. **In the app:** five levels per part of the map, from a
  worked example to working alone.
- **Not too much help, not too little.** Learning scientists call this the assistance dilemma: too
  little help frustrates, too much makes learning shallow. **In the app:** hints come only when the
  learner asks, and each one costs points; a free nudge appears only at levels 2 and 3.
- **Asking your own questions.** In a review of intervention studies, students taught to generate
  their own questions understood new material better, with a median effect size of 0.36 (Rosenshine,
  Meister and Chapman, 1996). The Right Question Institute reports a study of 2,217 high school
  students taught to ask their own questions, with gains in curiosity, engagement and self-efficacy.
  In the Anthropic trial above, the engineers who asked the AI conceptual questions scored 65% or
  more, while those who handed it the code scored under 40%. **In the app:** level 5 hands the asking to the learner and counts the questions that test the
  concept.
- **Explaining in your own words.** Students who explain material to themselves while they study
  understand it better; this is called the self-explanation effect. **In the app:** every answer is
  written in the learner's own words, starting with a first attempt before the map.
- **Curiosity needs a gap that can be closed.** Curiosity appears when we notice a gap between what we
  know and what we want to know, and it is strongest when the gap feels closeable (the information-gap
  theory). **In the app:** the empty parts of the map make the gap visible, and the levels keep it
  small enough to close.
- **A concept needs a frame.** Conceptual Pedagogy holds that a learner can't ask good questions about
  something they can't place yet. **In the app:** the four parts give the questions a place to start.
- **Confidence from your own effort.** The strongest source of self-efficacy, the belief that you can
  do something, is having done it yourself. Work an AI did for you doesn't build it. **In the app:** as
  the help fades, the success belongs to the learner.
- **Seeing what you actually know.** People overestimate how well they understand something until they
  have to explain it, and working with AI makes the overestimate bigger: in the Aalto studies, ChatGPT
  users overestimated their score by about 4 points. The researchers linked it to shallow engagement:
  most users asked the AI only one question per problem. **In the app:** the learner predicts a score
  before building and sees the real one at the end, so the borrowed part of the confidence becomes
  visible. As they build more on their own, the prediction and the real score should move closer;
  matching the two is called calibration.
- **Learning a concept outside one project.** Inside a coding agent, a concept is usually explained
  through the one project being built. Research on transfer, meaning using what you learned somewhere
  new, finds that knowledge tied too closely to the place it was learned is hard to use anywhere else.
  Pulling out the general principle on purpose helps, and comparing two examples helps most. **In the
  app:** the concept is learned on its own, not through one project. Comparing it in two examples is a
  next step.
- **Critical thinking can be taught.** A meta-analysis of 341 results found that teaching critical
  thinking works, with a small but real average effect of 0.30, and that dialogue, authentic problems
  and mentoring help most (Abrami et al., 2015). **In the app:** the questions are a dialogue, on the
  learner's own material.
- **Why hiding the answers isn't enough.** In a study of about 1,000 high school students, unrestricted
  GPT-4 helped during practice but exam grades were 17% lower once it was taken away. A version with
  guardrails, told to give hints instead of answers, removed the harm but didn't beat studying without
  AI (Bastani et al., 2025). Hiding the answer stops the damage; it doesn't build the understanding.
  **In the app:** structure, fading help and measurement on top of the questions.

Every study and theory named on this page is listed, with its authors, under [Sources](#sources).

## What research supports, and what we still have to show

**Backed by research:** each mechanism above, one by one.

**Already done by hand:** learners improvise pieces of this loop themselves. In the comments on one
reel about the problem, more than 15 people described their own routine, such as explaining a concept
to the AI and letting it correct them ([evidence](../context/evidence.md)). The app turns that into a
structure with measurement.

**Built and checked against Claude in evaluation runs:** the learner builds the map; the help fades per
part as mastery is measured; the scores and the prediction gap are computed by code; at level 5 the app
counts the learner's questions and how many test the concept.

**Still to show:**
- That this combination improves understanding more than a study mode or no tool. The Oct 23 pilot has
  5 testers, a test before and a test after, each on a concept they never trained on, so it is also a
  first look at transfer. It is a signal, not proof: there is no comparison group.
- That it changes curiosity or intellectual humility. The question-asking research above suggests it
  can. The app has stand-in measures (questions asked, the prediction gap); proving a change needs a
  validated questionnaire such as the California Critical Thinking Disposition Inventory.

**Outside this build:** knowing when to use a concept, or its trade-offs (the map captures what a
concept is, not when to choose it), and use in other areas of life, which is the vision.

## Critical thinking: skills plus the mindset

In 1990 a panel of experts agreed on a definition of critical thinking, known as the Delphi Report: a
set of skills, plus the dispositions, meaning the habits and willingness, to use them. The app starts
with the first skills and adds one at a time.

| Skill or disposition | What it means | In the app | Status |
|---|---|---|---|
| Interpretation and analysis | working out what something means and how its parts relate | building the map: its group, what it isn't, what defines it, its kinds | now |
| Inference | drawing conclusions from facts | level 5: the learner turns the fact desk's facts into the map | now |
| Self-regulation | checking your own thinking | the reality check: predicted vs. real score | now |
| Explanation | stating and justifying your reasoning | answers in the learner's own words; no "justify why" step yet | partial |
| Evaluation | judging how good a claim or an argument is | judging an AI's answer: its assumption, the kind of claim, its fallacy | Phase 2 |
| Curiosity (disposition) | wanting to know, and asking | gaps that feel closeable; questions asked at level 5 | stand-in measure |
| Intellectual humility (disposition) | knowing the limits of what you know | the gap between the predicted and the real score | stand-in measure |
| Open-mindedness (disposition) | considering other views | not trained yet; practiced in Phase 3, Perspectives. The scoring already accepts any defensible answer | later |

## Hard questions

**Why not ChatGPT Study Mode or Gemini Guided Learning?** They are open chats with a Socratic tone,
and the student can switch the mode off at any point. Here the learner builds a structure, the help
fades as mastery of each part is measured instead of whenever the learner asks, and the gap between
what they think they know and what they know is a number. In the high school study above, a tutor
that only hid the answers removed the harm of AI but didn't beat studying without it. Structure, fading
and measurement is our bet on doing better, still to be proven.

**Why not a skill inside the coding agent?** Inside the agent, a concept is explained through the
project being built, and knowledge tied that closely to one context is hard to use elsewhere. The app
teaches the concept on its own, ready for the next project. Inside the agent, the shortcut is also one
message away; a separate space where the answer isn't on offer works as a commitment device. And a
skill is a prompt: it can't fade the help over weeks, track mastery per part across concepts, or give
a teacher a score to trust. Later, a skill in the agent can be the doorway: "your agent just used an
API; want to practice it?"

**What if the material doesn't cover the concept, and the AI is wrong?** The agents base their words on
the learner's material when it has what they need, and use general knowledge when it doesn't. For
well-known concepts that knowledge is reliable; for a niche library, or anything newer than the model,
it isn't. The learner builds the structure and code computes the scores, so the model never hands over
the map as the truth. Next steps: the fact desk says when a fact isn't from the learner's material, and
the material can come from a trusted source, such as official docs, with its link.

**Isn't this a study tool?** The subject is the gym equipment; thinking is the muscle. People arrive
with a study job ("I need to understand APIs") and leave practicing how to figure out the next concept:
by level 5 they ask the questions. A study tool wants you back for the next topic; this one fades the
help on every part.

**Anyone can use it. Isn't that too broad?** Focus is who we build the demo for, test with, sell to and
talk about first: one group, won first (a beachhead market). An engine that works on any concept is how
it reaches the next groups, each behind a gate (see Where it goes).

What every learner shares isn't "not knowing concepts", which nobody feels as pain. It's the moment
someone asks them to explain something they thought they understood, and they can't: the illusion of
explanatory depth, from a biology student's oral exam to a junior developer's code review. AI makes that
moment more common, because the feeling of understanding grows faster than the understanding. Programming
students who build with AI agents are first because they meet it most often and at the highest cost:
their agent writes their work every day, and code reviews, project defenses and interviews check it every
week. The result screen measures exactly this: the gap between the score they felt and the one they
proved.

**Why concepts, and not the student's whole project?** Understanding a project has layers: the
concepts, the decisions, the flow, the code. The concepts are the foundation: you can't judge why the
agent chose a pattern you don't understand. This build covers that layer completely, which is why the
tagline says "the concepts". The agent's decisions in the student's own code are the next layer, in
Check the AI.

**Will students choose the slower path when AI gives the answer?** Not always, and not for its own
sake. Two kinds of motivation are at work. From outside: the moments when someone will check them, such
as an exam, a project defense, a code review or an interview, which is when the app is meant to be
opened. From inside: Self-Determination Theory finds that people stay motivated when they feel
competent, in control of their choices and connected to others. Feeling competent is what the
commenters describe wanting (how good it feels to be able to explain their own code), and it is what
the fading levels give: proof that they did it themselves. The pilot asks the testers when they would
open it.

**Why no streaks?** A streak can keep people coming back without learning: keeping the streak becomes
the goal. Here the reason to come back is the satisfaction of their own progress, the feeling of
competence from Self-Determination Theory: needing less help, level by level, and seeing the predicted
and real scores move closer. The hook inside each session is the reveal: predicting a score, then
seeing the real one.

**Do you have proof it works?** For each piece, yes: the research above. For the combination, not yet.
Learners already do pieces of it by hand, and the pilot is the first measurement of the whole.

**Is a pilot with 5 testers credible?** Two questions get mixed here: whether people want this, and
whether it works. Demand already has signals: one reel on the problem drew about 200 comments and more
than 15 self-made routines, Reddit threads describe the same problem, and colleges are spending staff
time on oral exams to check understanding ([evidence](../context/evidence.md)). Whether it works is
what the pilot starts to measure, and 5 testers is a signal, not proof. The test concepts swap order
between testers, a person grades every map without seeing the AI's scores, and the slide calls it a
pilot.

**What stops OpenAI or Google from copying it?** They can copy features, and Study Mode shows they copy
the surface. Their business grows when people keep coming back to the chat for answers; a product built
so the help fades is hard for them to adopt without working against that. This is called
counter-positioning. Beyond that: the first group's community, relationships with schools, and data on
how learners master each part.

**Who pays?** Students use it free. Instructors, bootcamps and colleges pay for seats and a class view
of mastery: evidence that learning happened, which today they try to get through oral exams. Later,
parents, tutors and coaches, with the app as the practice between sessions.

## Where it goes

Each phase adds one skill on the same engine (questions, help that fades, mastery per part, the
prediction gap). A gate is the result that has to exist before the next phase starts, so the product
only widens when the evidence says so.

| Phase | Skill it adds | Who feels it first | Who pays | Gate to start it |
|---|---|---|---|---|
| 1. Concepts: Check yourself (this build) | interpretation, analysis, inference | programming students who build with AI agents | instructors, bootcamps, colleges | none: this is the anchor |
| 2. Check the AI | evaluation | every student, and anyone whose work runs through AI | high schools, companies | the concepts loop is complete and learners improve on the post-test |
| 3. Perspectives | considering other views | teens and young adults | parents, tutors, coaches | Check the AI used by real learners |
| 4. Decisions | reasoning about choices | teens and young adults | parents, tutors, coaches | the Perspectives phase works |
| 5. Self-awareness and emotions, then other life areas | the same skills, pointed inward | everyone | the long-term vision | safety guardrails designed and reviewed |

**Why it scales:** there are no lessons to write. The learner brings the concept, and their own
material when they have it, so a new subject costs nothing to add.

**Next after the hackathon:** material retrieved from a trusted source when the learner only types a
topic; comparing the concept in two examples; a fact desk that says where each fact came from; a memory
of each learner's habits across sessions, for the coach and the hint giver; "Your maps", every map a
learner built, grouped by concept, so they can open an earlier try and see what they answered (each
session is already saved; only the screen is missing); a skill in the coding agent as the doorway.

## Sources

- Aalto University (2025), senior author Robin Welsch. AI makes you smarter, but none the wiser: the disconnect between performance and metacognition. *Computers in Human Behavior*. [Aalto University summary](https://www.aalto.fi/en/news/ai-use-makes-us-overestimate-our-cognitive-performance).
- Abrami, P. C. et al. (2015). Strategies for teaching students to think critically: a meta-analysis. *Review of Educational Research* 85(2). [Summary](https://www.clearinghouse.edu.tum.de/wp-content/uploads/2023/12/CHU_KR18_ENG_Abrami_2015.pdf).
- Anthropic (2026). [AI assistance and coding skills](https://www.anthropic.com/research/AI-assistance-coding-skills), research post, January 29, 2026.
- Bandura, A. (1977). Self-efficacy: toward a unifying theory of behavioral change. *Psychological Review* 84(2).
- Bastani, H. et al. (2025). [Generative AI without guardrails can harm learning: evidence from high school mathematics](https://papers.ssrn.com/abstract=4895486). *PNAS* 122(26).
- Chi, M. T. H. et al. (1994). Eliciting self-explanations improves understanding. *Cognitive Science* 18(3).
- Collins, A., Brown, J. S. and Newman, S. E. (1989). Cognitive apprenticeship: teaching the crafts of reading, writing, and mathematics. In *Knowing, Learning, and Instruction*.
- De Zubiría Samper, M. Conceptual Pedagogy and the conceptual mentefact (*mentefacto conceptual*).
- Facione, P. A. (1990). *Critical Thinking: A Statement of Expert Consensus* (the Delphi Report). [Summary of the dispositions](https://courses.ems.psu.edu/geog882/node/2144).
- Gick, M. L. and Holyoak, K. J. (1983). [Schema induction and analogical transfer](https://deepblue.lib.umich.edu/items/196ea13e-fb69-4a74-a6f9-864c81aed465). *Cognitive Psychology* 15.
- Helmer, H. (2016). *7 Powers: The Foundations of Business Strategy* (counter-positioning).
- Koedinger, K. R. and Aleven, V. (2007). Exploring the assistance dilemma in experiments with cognitive tutors. *Educational Psychology Review* 19.
- Loewenstein, G. (1994). The psychology of curiosity. *Psychological Bulletin* 116(1) (the information-gap theory).
- Moore, G. A. (1991). *Crossing the Chasm* (the beachhead market).
- National Research Council (2000). [*How People Learn*, chapter 3: Learning and Transfer](https://www.nationalacademies.org/read/9853/chapter/6).
- Prather, J. et al. (2024). [The widening gap: the benefits and harms of generative AI for novice programmers](https://arxiv.org/abs/2405.17739). ICER 2024.
- Right Question Institute. [Research on the Question Formulation Technique](https://rightquestion.org/resources/research-on-the-question-formulation-technique/).
- Rosenshine, B., Meister, C. and Chapman, S. (1996). Teaching students to generate questions: a review of the intervention studies. *Review of Educational Research* 66(2).
- Rozenblit, L. and Keil, F. (2002). The misunderstood limits of folk science: an illusion of explanatory depth. *Cognitive Science* 26(5).
- Ryan, R. M. and Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist* 55(1).
- Salomon, G. and Perkins, D. N. (1989). Rocky roads to transfer. *Educational Psychologist* 24(2).
- Wood, D., Bruner, J. S. and Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry* 17 (scaffolding).
