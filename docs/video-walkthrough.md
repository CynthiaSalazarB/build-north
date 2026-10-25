# Walkthrough video without narration: draft notes

Notes on the first cut of the walkthrough from Cynthia's brief ("Lumente video brief without
narration"), made Oct 25 for the Devpost video (#48). Kyle's talking-head opening and closing go around
it and stay the only spoken parts. The draft MP4 (1920 x 1080, 30 fps, 2:22) is with Leo, not in the
repo; the editable project rebuilds from one edit file with the demo-reel skill.

Nothing in the app, the API or the agents was changed for it, and nothing was pushed, merged, published
or deployed.

## What the footage is

- **The newest UI:** a demo-mode web export of `9a6259a` (PR #189's branch, not merged yet), recorded
  in a phone-sized browser. Every app screen is labelled "Recorded app session · demo mode · web app".
- **The sign-in screen:** the live site at lumente.expo.app, signed out, with empty fields.
- **The website layout:** the same demo-mode export at laptop size, for the last scene.
- The phone frame is neutral (no iPhone island), because the footage is the web app.
- The answers typed in the session are the recorded demo session's own inputs.

## Scenes

Times are from the export, from the start of the walkthrough (not the full video with Kyle's parts).

| # | Time | Footage | Text on screen |
|---|---|---|---|
| 1 | 0:00-0:06 | Sign-in page, empty fields, zoomed on the Clerk card | Your progress stays with your account. · callout: Clerk handles sign-in. |
| 2 | 0:06-0:10.8 | Start, API selected | Pick a concept your code uses. / Today: API. |
| 3 | 0:10.8-0:29.5 | Start's empty map, enlarged; each area lit as its question appears; tap "Explore with guidance" | Mentefacto conceptual / A structure for understanding a concept. Then the four questions one at a time, held together; the credit line |
| 4 | 0:29.5-0:37 | Prediction screen, 7, "Save my prediction" | How much can you explain on your own? / Four areas. Up to 2 points each. |
| 5 | 0:37-0:48.5 | "Your first explanation", typing, Send, Continue, the first area question | Start with your own explanation. · callout: Claude agents ask questions and evaluate answers. |
| 6 | 0:48.5-1:06 | "A server?", the free nudge, the Help sheet, the hint card (zoomed to read) | Support when you need it. / The score reflects what you can explain independently. |
| 7 | 1:06-1:15 | "A software interface.", its feedback, the Category area lights | As you progress, the guidance fades. |
| 8 | 1:15-1:37 | **Placeholder: footage needed** | At level 5, you ask the questions. Then, one at a time: Ask for facts. / The map is yours to build. (callout: Code enforces the map-seeking redirect.) / Explain it in your own words. Setup note: Prepared level 5 account. Three areas filled beforehand. |
| 9 | 1:37-1:49 | Result: prediction 7 of 8, map score 5 of 8, zoomed on the two rows | Compare your prediction with your explanation. · callout: AI evaluation. Scoring rules in code. |
| 10 | 1:49-2:03 | **Placeholder: footage needed** | Your next session can build on earlier progress. · callout: SurrealDB Agent Memory / Progress notes, not answer text. |
| 11 | 2:03-2:12.5 | Web app in the laptop layout; "Your data" with the version line "Lumente 1.0.0 · web build" | One app on Android and the web. / Publish the web app. · callout: Expo · EAS Hosting |
| 12 | 2:12.5-2:22 | **Placeholder: footage needed** (Android) | Same headline / Build the Android app. (EAS Build), then Send fixes without reinstalling. (EAS Update) |

A placeholder is a dashed card that says what to record, with its captions running on time, so the
timing can be reviewed now. No missing screen is redrawn or faked.

## Chapters

0:06 Start · 0:29 Prediction · 1:01 Hint · 1:09 Area lighting · 1:19 Fact chat* · 1:25 Redirect* ·
1:34 Submit my map* · 1:36 Result · 1:48 Memory*

\* Placeholder times until the footage exists. Add Kyle's opening length to every time for the full video.

## Footage and inputs still needed

1. **Scene 8, the level 5 session:** a recording at lumente.expo.app in the laptop layout, on the
   prepared account with three CORS areas filled: "Ask a fact (optional)", a factual question and its
   real reply, "What is CORS a kind of?" and the real redirect, the last area's answer, "Save answer",
   "Review & submit", "Submit my map". Still blank in the brief: `[factual question: Cynthia]` and
   `[last-area answer: Cynthia]`.
2. **Scene 10, Memory:** the coach's "From what Lumente remembers:" line, then the Memory sheet, on an
   account with a finished CORS session and memory on, and `[exact Memory-sheet line: Cynthia]`. It
   can't come from demo mode, which says "Demo mode keeps nothing, so there is nothing to remember."
3. **Scene 12, Android and EAS:** the installed Android app, an EAS Update page or a successful
   workflow run (private details cropped), and the installed version line under "Your data" on the
   phone. No Android device was connected for this cut.
4. **Optional, scene 1:** the signed-in Start screen right after the sign-in screen.
5. **To confirm:** scene 5's typed explanation is the recorded session's own ("Something that lets two
   apps talk to each other."), since the brief left that input blank.

A screen recording of each (OBS or the phone's recorder) is enough; the cut swaps each placeholder for
its recording with a one-line change, and the times stay close to the ones above.

## Where the brief and the app differ

Decided for this cut; each is a one-line change if it should go the other way.

- **The area labels changed.** The brief maps Bigger group / What it isn't / What it needs / Its types.
  The current app says Category / Similar concepts & differences / Defining features / Classification,
  in the same places (top, right, left, bottom). The video's overlays use the brief's four questions and
  leave the app's labels as they are.
- **The method's name.** The storyboard's exact text says "Mentefacto conceptual"; the wording section
  says to introduce "Conceptual Mentefact". The cut uses the storyboard text.
- **Help opens a sheet now.** After the free nudge, Help says "This area is already limited to 1 point.
  This hint does not reduce it further." That is the brief's route A, and the cut shows the real order:
  answer, free nudge, Help, hint.
- **The result is the demo API session's.** Once scene 8 is recorded, that session's own result may
  suit scene 9 better, so the result belongs to the session just shown.

## An app bug seen while recording

On Start in demo mode (`9a6259a`), for about 0.3 s after "Explore with guidance", the headline
disappears and the button reads "Continue with guidance" (greyed) before the prediction screen opens.
The cut steps around those frames; a live demo would show them.

## Sound

Optional quiet music, as the brief allows: Sascha Ende, "Happy Beats / Business Moves" vol-1, under
CC BY 4.0, kept low (about -20 LUFS) so it sits under Kyle's voice in the full video. The walkthrough
has no end card, so **the credit "Music: Sascha Ende, ende.app (CC BY 4.0)" goes in the video
description**. The sound effects are made in code (nothing to license): soft whooshes on cuts and the
same neutral tick on every tap, Help included. There is no warning or point-loss sound, and the video
reads with the sound off.

## Checked

The export passed the cut's own checks: size, frame rate, duration (2:22.000), loudness, true peak,
no silence, no black frames, picture and sound in sync. Every scene and every cut was looked at frame
by frame. Not checked yet: a person watching the whole thing with the sound off, then on.
