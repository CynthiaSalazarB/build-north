# Grading sheet: the human double-check

[`grading-sheet.csv`](grading-sheet.csv) has one row per test map: 5 testers, a pre-test and a
post-test each. It checks the evaluator against a person, and it is the source of the numbers slide.
Import it into a spreadsheet to fill it in.

Testers appear as T1 to T5 only. The list matching IDs to names stays off this repo (the repo is public).

## Concept order

Half the testers take the concepts in the reverse order, so a harder concept can't fake progress or hide
it (DECISIONS.md, tester concepts and order).

| Tester | Pre-test | Post-test |
|---|---|---|
| T1, T3, T5 | ecosystem | contract |
| T2, T4 | contract | ecosystem |

Training sessions in between use "metaphor" and "habit".

## Filling it in

1. **Grade by hand first, blind.** Hide the evaluator columns and score each map's four moves from 0 to 2
   with the same rubric the evaluator uses: 2 when defensible and precise (the closest bigger group, a
   real exclusion with its difference, essential characteristics, types split by one criterion); 1 when
   defensible but too broad or incomplete; 0 when not defensible. Any defensible answer passes, not one
   expected answer. Grading before looking keeps the evaluator's score from anchoring yours.
2. **Then the evaluator's scores and the counts** from the testers' export (#50): the four evaluator
   scores, the prediction, questions asked and questions testing, and hints (0 in a test unless the
   tester tapped Help).
3. **Totals and agreement.** Each total is the sum of its four moves. "Moves where human = evaluator" is
   how many of the four scores match exactly.

**Agreement** = the sum of that column across the 10 rows, divided by 40 (10 maps, 4 moves each). It
goes on the numbers slide beside the scores, and in the chat for #49.

## During the sessions

Watch the sessions with the notes column open. Every prompt failure seen goes in `notes` and becomes an
issue the same evening, assigned to the prompt fixes on Oct 24 (#40): an answer given away, a verdict
that looks wrong, a question that confused the tester, a fact desk answer that named part of the map.
Quote what the app said and what the tester wrote.
