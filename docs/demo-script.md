# Demo script: three minutes on Oct 29

The live demo for Demo Day, screen by screen, with what we say and what the camera shows (#41). The
video (#48) follows the same order on the frozen build, and the numbers line is the one the numbers slide
carries (#52). Timings are a draft from one read of the screens; the Oct 24 rehearsal sets the real ones.
Every button name below is the one on the screen today (`main`, Oct 24).

**Where it runs.** Session 1 runs on Kyle's Android phone with the native build, mirrored. The level 5
part runs on a laptop at https://lumente.expo.app, in the website layout: the words on the left,
the map on the right. Two devices because levels belong to the account, not to the concept: an account at
level 5 on every part never gets the firefly's questions, so session 1 needs an account below level 5,
and the level 5 part needs the seeded demo account. If one device has to do everything, Sign out and sign
in again between the two sessions costs about 15 seconds.

**Target: 2:55.** If we are behind at 1:30, the cuts are listed after the script.

## Before we go on

- Ten minutes before: a warm-up session through every agent, since the first call with a new schema is
  slower (plan, section 12). `https://build-north-api.onrender.com/health` answers `{"ok":true, ...}`.
- **The phone** is signed in to the session 1 account: any `name+clerk_test@example.com` with the code
  `424242` works without an inbox, and a new account starts every part at level 2. After each rehearsal,
  "Your data", then "Delete my data": it resets the levels and signs out, so the next run gets the same
  questions. Start is open on API. The screen is mirrored; Do Not Disturb is on.
- **The laptop** is signed in to the demo account, the one `npm run seed:demo -w api` put at level 5 on
  all four parts (today that is Leo's Google account: pick one Cynthia and Kyle can sign into `[account: Cynthia]`).
  One thing has to be true for the Memory sheet to have something to show: one CORS session was
  finished on this account before Demo Day with memory on (on since Oct 23). #147, merged and on Render since
  Oct 23 night, writes a level row for every finished part even when no level moved, so each part reads
  "level 5 since …" instead of "no level yet"; a session finished before #147 left only the gap and the Helps.
- During the warm-up, start the CORS session on the laptop ("Explore with guidance", predict 7, "Save my
  prediction") and fill three areas of the map with the answers Cynthia rehearsed: Bigger group, What it
  isn't, What it needs. Leave Its types empty. The draft survives a reload, and Start offers "Resume".
- The video is open on the laptop at the fallback chapter (below), and on a USB stick.
- The deck's numbers slide is ready; the testers' numbers are not in the app.

## The script

| Time | Screen (the camera shows) | We say | We do |
|---|---|---|---|
| 0:00 | **Phone, Start.** The code line `app.get('/api/users/:id', getUser);` lit in amber over the empty map in the dark; the firefly beside it; the chips API, JWT, hashing, database index, cache, rate limiting, environment variable, CORS | "Can you explain the code your AI wrote? Not line by line. The ideas underneath it: the API, the token, the CORS rule. That's what you defend in an interview or a code review. Everyone knows the moment: someone asks you to explain something you thought you understood, and you can't. AI makes it more common, because code that works feels understood." | Nothing yet. The headline on screen says it: "Can you explain the ideas behind the code your AI wrote?" |
| 0:15 | **Start.** API selected; "Add your notes" and "Ask your AI what to map" under the chips | "This is Lumente. You pick a concept your project uses. 'Ask your AI what to map' gives your coding agent a prompt, so the list comes from your own code. Today: API." | Tap "Explore with guidance" |
| 0:25 | **Prediction.** "How much can you explain on your own?", the numbers 0 to 8, "Each area can earn:" with 2, 1 and 0 points | "Before any question, you predict your score. Four areas, two points each. AI lends confidence you didn't earn, so we put the confidence on record first." | Tap 7. The light previews the guess. Tap "Save my prediction" |
| 0:40 | **Session.** "Your first explanation" above the field; the map dark with its four areas | "First, your own words, before any help." | Type one sentence, rehearsed, for example "A way for one program to use another without seeing inside it" `[wording: Cynthia]`. Send. The firefly offers "See an example"; tap "Continue" |
| 0:55 | **Bigger group.** The firefly's question, its dashed line to the Bigger group area; under the firefly the tag "help −1" | "The firefly asks about the four areas of the map, one at a time. It never writes the map. It is also Help, and help costs." | Tap the firefly. "Finding a hint." |
| 1:05 | **The hint card.** Amber: "hint 1 of 3 · −1 pt", "this part can now light 1 point at most" | "One hint, and this area can now light one point instead of two. I'd have said 'a server'. An API runs on a server, but it isn't a kind of server. Related isn't the same as belonging." | Type "a software interface". Send. "Checking your answer." |
| 1:18 | **The area lights.** One point square on Bigger group fills; the firefly's light grows a stage; the evaluator's "Yes: …" line reads dim above the next question (#155) | "Any answer you can defend passes. The light grows one stage per point. As you get areas right with little help, each one moves up a level and the help fades." | Tap the X, "Close and save". Start shows the card for API, "1 of 4 parts", with "Resume" |
| 1:30 | **Laptop, the whole map.** "Independent practice", "Build your map", three areas filled, Its types outlined, "3 of 4 areas filled", "Review & submit" | "After enough practice, all four areas reach level 5 and the roles flip. This account is there, on CORS. Now I ask the questions. I filled three areas in the warm-up; the last one goes in live." | Tap "Ask a fact (optional)" |
| 1:40 | **The fact chat.** "Asking costs nothing. Answers go on the map." The field "Ask a factual question" | "The fact desk answers with facts only." | Type a fact question `[question: Cynthia]`, "Ask a fact". "Looking up the fact." Read the fact card aloud in a few words |
| 1:50 | **The redirect.** The fact desk's fixed line: "That part is yours to decide. If you're stuck, tap Help (it costs a point)." | "And if I fish for the map, code answers, not the model." | Type a question that asks for the structure, for example "What is CORS a kind of?". "Ask a fact". An amber square per question appears in the header |
| 2:00 | **Its types.** The area's sheet: "4 · Its types", the field "One kind of it", "Save answer" | "The last area, in my own words." | Tap Its types. Type `[Its types answer: Cynthia]`. "Save answer". "4 of 4 areas filled" |
| 2:10 | **Review your map.** The four areas with their answers, "Submitting ends the session." | "The whole map is scored together." | Tap "Review & submit", then "Submit my map". "Checking your map." |
| 2:20 | **The result.** The headline in words, for example "You felt 2 points surer than you could explain."; two rows of eight squares, "prediction 7 of 8" and "map score"; the questions line, "you asked N questions, M testing the idea"; the map in the light it reached; "for next time" with the coach's words | "The gap, in words. How sure I felt against what I could explain. The one number AI gets wrong for you. Every number on this screen comes from code, not from the model." | Point at the two rows. Wait for "for next time" |
| 2:35 | **The Memory sheet.** "What Lumente remembers": CORS, the line "Last time, Oct 28: you guessed 7 and proved 5" `[real line: Cynthia]`, each part with "level 5 since …" and "the AI read this once" | "Between sessions, Lumente remembers your level on each area and your last gap. Notes code writes, never your words. A new level replaces the old one and keeps the history, and the coach you just read cited it." | Tap the dim line "From what Lumente remembers:" under the coach's words if it is there; else "Map another concept", then "Memory" at the top of Start |
| 2:45 | **The deck, the numbers slide.** Then the closing slide | "Five students who code with AI tried it on Oct 23: `[numbers line: Cynthia]`. Next is Check the AI: the same loop pointed at what your coding agent wrote, so you judge its answer instead of trusting it. We're looking for a pilot with one CS program. The help fades. The understanding stays." | Switch to the deck |

End at about 2:55.

## If the API is slow: the 30-second fallback

A turn is meant to take up to 8 seconds. While it runs the firefly says "checking" and the line under it
says "Checking your answer." After 10 seconds the line adds "Taking longer than usual."

| Seconds | What happens | We say and do |
|---|---|---|
| 0 to 10 | The firefly says "checking" | Keep talking, with the line that was next in the script. The screen explains itself: the map, the light, the points |
| 10 to 15 | "Taking longer than usual." appears | "The server is slow tonight. Here is the same moment from our recording of this build." Switch the mirror to the laptop |
| 15 to 30 | The video, at the chapter that matches the screen we left | Play it to the same point, then pause. Say it is the recording. When the phone catches up, switch back and go on from the script |

Rules: we never show the replay as live. Demo mode ("Demo mode: a recorded session") is a
replay too, and if we ever open it on stage we say so. If the server is down for good, the video runs
to the end and the deck takes the last 15 seconds.

Chapters to mark in the video before Oct 29: Start, the prediction, the hint, the area lighting, the fact
chat, the redirect, "Submit my map", the result, the Memory sheet.

## If we are behind at 1:30

In this order:

1. One fact question instead of two: keep the redirect, drop the fact. Saves about 8 seconds.
2. Skip "Review your map": tap "Review & submit", then "Submit my map" without a pause. Saves about 5 seconds.
3. Open the Memory sheet from the result's dim line only; if the line isn't there, say the memory sentence
   over the result and skip the sheet. Saves about 10 seconds.

## Notes for the rehearsal

- The free nudge, not Help, is what a wrong answer gets at level 2. A retry already caps the area at 1
  point, and Help after it costs nothing more, so the "help −1" tag shows only while the question is
  still unanswered. Tap the firefly before typing anything in that area.
- Levels rise with every rehearsal. Reset the session 1 account with "Delete my data" after each run, or
  it will reach level 5 and skip the questions.
- Type the answers on stage. Voice works (the mic beside the field), but a room is noisy, and the words
  still need Send.
- Google sign-in on the Android app needs Clerk's Android setting; the email code works without it. Sign
  both devices in before we go on, and keep them awake.
- No tester names, no emails, on any screen or slide. The demo account's Memory sheet shows only numbers
  and dates.
- Share on the result sends the prediction and the score, never the answers, if a judge asks what leaves
  the phone.
