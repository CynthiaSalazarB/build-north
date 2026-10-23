# Tester protocol: Oct 23 evening

One page for whoever runs the slots. Five adult testers, each a programming student who builds with an
AI coding agent (Claude Code, Cursor or Copilot). In this repo they are T1 to T5 only; the list that
matches IDs to names stays off the repo, which is public. The grading afterwards is in
[`grading-sheet.md`](grading-sheet.md), and the [observer sheet](observer-sheet.md) is one page per slot.

## Before the slot

- Send the tester the app link and ask them to sign in with their email (Clerk sends a code).
- Each tester needs about 50 minutes, on a laptop or a phone, somewhere quiet.
- No AI and no web search during the slot. The app's fact desk is the only source of facts.

## Who takes which concept

| Tester | Pre-test (A) | Training (B, then C) | Post-test (D) |
|---|---|---|---|
| T1, T3, T5 | database index | hashing, then environment variable | rate limiting |
| T2, T4 | rate limiting | hashing, then environment variable | database index |

Half the testers take A and D in the reverse order, so a concept that happens to be harder can't fake
progress or hide it (`DECISIONS.md`, tester concepts are programming concepts). Every tester types only
the concept's name and pastes no material, so all five get the same conditions.

## The slot

| Step | What the tester does | Time |
|---|---|---|
| 0. Welcome | Read the consent line below out loud, and answer questions about the app, never about the concepts | 2 min |
| 1. Before | Answer the confidence question below, 1 to 5 | 1 min |
| 2. Pre-test on A | Start a test session: predict the score, build the whole map alone, ask the fact desk for facts | 10 min |
| 3. Training on B | A normal session: the app asks, the help fades, Help is there when they need it | 12 min |
| 4. Training on C | The same, on the second concept | 12 min |
| 5. Post-test on D | A test session again, like step 2 | 10 min |
| 6. After | The confidence question again, then the three questions below | 3 min |

**Consent line:** "We store your answers so we can study the results. Your name never goes in our
code or our slides, and we'll delete your data whenever you ask."

**Confidence question** (steps 1 and 6, the same words both times): "How sure are you that you could
figure out a new programming concept on your own, without AI? 1 means not at all, 5 means
completely."

**After the post-test**, in this order:
1. "When would you open this, if ever?" (before an exam, a project defense, an interview, a code
   review, never). Write down their words.
2. "Want early access when it launches? Leave your email." A yes with an email is a real commitment;
   a yes without one is a compliment.
3. "Is there a professor or TA who should see this? Would you introduce us?" An introduction is the
   strongest signal we can get tonight.

If you also want a price signal, ask "What would you pay for it?" last and record it as an opinion, not
as evidence: what people say they'd pay rarely matches what they do.

## While they work

- Don't help, don't explain the concept, and don't say "that's right". Silence is fine.
- Keep the notes column of the grading sheet open and write down every prompt failure you see: an
  answer given away, a verdict that looks wrong, a question that confused the tester, a fact desk
  answer that named part of the map. Quote what the app said and what the tester wrote.
- If the app breaks, note the time and the screen, and move the tester to the next step.

## After the slot

- Note the tester's user id in the team chat (#38), never their name in the repo.
- The numbers come from the testers' export (#50), and the maps get graded by hand, blind (#49).
