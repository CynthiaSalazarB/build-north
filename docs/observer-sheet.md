# Observer sheet: one per tester slot

For whoever watches a slot of the [tester protocol](tester-protocol.md). Print one copy per tester, or copy
it into a note. Testers are T1 to T5 here and everywhere in the repo; their names stay off it. Don't help,
don't explain the concept, and don't say "that's right": silence is fine.

**Tester:** T__ · **Order:** A = database index, D = rate limiting (T1, T3, T5) / the reverse (T2, T4)
**Device:** laptop or phone · web or Android app · **Start time:** ____

## The slot

| Step | Check | Write down |
|---|---|---|
| 0. Welcome | ☐ consent line read out loud | questions they asked about the app |
| 1. Before | ☐ confidence question asked | confidence: __ / 5 |
| 2. Pre-test on A | ☐ started with **Test myself** · ☐ typed only the concept's name | guess: __ / 8 · minutes: __ |
| 3. Training on B (hashing) | ☐ started with **Start with** · ☐ "See an example" tapped? yes / no | minutes: __ |
| 4. Training on C (environment variable) | ☐ started with **Start with** | minutes: __ |
| 5. Post-test on D | ☐ started with **Test myself** | guess: __ / 8 · minutes: __ |
| 6. After | ☐ confidence question again · ☐ the three questions, in order | confidence: __ / 5 |

**The three questions, in their words:**
1. When would they open it? ______________________________________________
2. Early access, with an email? yes with email / yes without / no
3. A professor or TA to introduce? yes, who (role only) / no
(Price, only if asked last, as an opinion: ______)

## What to watch

Tick it each time it happens, and quote the screen when you can.

- ☐ Typed an answer in the chat during a test session instead of on the map. Did "That looks like an
  answer. Answers go on the map…" make them move to the map? yes / no
- ☐ Tapped Help · how often, and on which part: __________
- ☐ Stuck for more than a minute without tapping Help (which part, what they did)
- ☐ Read the result screen's part-by-part notes and "for next time"? Their reaction to the gap, in their
  words: __________

## Bug log

Every prompt failure or break, one line each. These go to the bug log (#39) and the prompt fixes (#40).

| Time | Screen | What the app said | What the tester wrote | Kind |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

Kinds: **leak** (the app gave a part of the map away, or a fact answer named one), **wrong verdict** (a
right answer marked wrong, or the reverse), **confusing** (a question or line the tester misread),
**slow** (a wait over 10 seconds), **broken** (an error, a blank screen, a button that did nothing). If the
app breaks, note the time and the screen and move the tester to the next step.

## After the slot

- ☐ The tester's user id goes in the team chat (#38), never their name in the repo.
- ☐ This sheet's bug lines are in #39 the same evening.
