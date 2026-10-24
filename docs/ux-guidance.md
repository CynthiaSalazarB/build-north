# UX guidance · October 23

The self-test's primary action is writing answers in the concept map. Firefly's line and the amber outline suggest the first empty area in `MOVE_ORDER`: Bigger group, What it isn't, What it needs, Its types. Areas remain freely editable, including out of order. Saving text means an area is filled, not that the answer is correct. Only submitting the whole map asks the evaluator to score it.

Following a highlight or opening an editor is interface guidance. It makes no server call, doesn't use a hint, and doesn't affect scores or mastery. The optional fact chat is explicitly separate from answers. A conceptual hint still uses the existing server hint ladder; its confirmation names the actual target and states the score cap or reveal cost before it is requested. The navigation highlight does not change that target.

The prediction has no default selection. Learners choose 0–8 after seeing the task and rubric: four areas, two points each. Prediction records confidence; the map score records the explanation demonstrated in that session. Neither the preview nor the result map assigns a total prediction to particular areas. The gap appears on the overall score comparison; each map area shows its actual earned points. The result reuses the same rubric and explains the comparison without implying that matching one prediction proves general self-knowledge.

## Review checklist

- Prediction: nothing selected initially; Save disabled until a number is chosen; choosing 0 works; keyboard digits and arrows work; a failed save preserves the current choice.
- Self-test: Start opens Bigger group; Save answer adds the learner's words and highlights What it isn't; saving the remaining areas moves the highlight in order; no points are awarded before submission.
- Editing: clicking any area works; returning to a saved area keeps its text; removing an answer makes it the next suggested area again; exclusion differences survive editing.
- Chat: collapsed initially; its neutral secondary button is more prominent than the underlined hint action, while map writing stays primary; opening it labels factual questions as optional; questions don't write map answers or consume a hint; collapsing and reopening preserves an unsent question.
- Hints: opening and cancelling the confirmation sends nothing; the target matches the server's hint order, even when another area is highlighted; the first hint explains the one-point cap; revealing explains zero points.
- Submission: disabled while empty or busy; review shows all four areas and exclusion differences; empty areas warn that they score zero; Keep editing preserves everything; only Submit my map sends the map.
- Guided mode: the input is labeled with the current answer area; Firefly's connection still points to the current area; retries, hints, reveals, and the final answer's feedback retain their existing behavior.
- Result: prediction and map score are labeled separately; both use the 0–8 scale; the rubric matches the prediction screen; the zero-gap wording refers only to this session.
- Responsive/accessibility: check desktop and narrow phone widths, long concepts and answers, keyboard navigation, modal closing, reduced motion, and no horizontal overflow. In short desktop windows and at higher browser zoom, send a fact question and check that the reply is visible through its scroll ancestors, not merely present in the page. The self-test's left column scrolls as one unit so the instructions and input cannot shrink the replies to zero height; Firefly's connection follows its scroll position and hides when Firefly is offscreen.

The login and start-page headlines stay as Cynthia wrote them on October 23. Only the two mode descriptions on Start explain where answers go.

## Verified locally

- Unit suites after integrating main: 64 app tests, 61 API tests, 106 agents tests passed. The real-SurrealDB integration test was skipped because no test database was configured.
- All three workspace typechecks passed. The initial static web export passed. App lint has zero errors; seven existing React Compiler diagnostics remain warnings after main's session-resume feature. Run `npm exec -w app -- eslint src` directly: adding a lint script to the app's package changes Expo's native fingerprint and would prevent updates reaching the installed Android build.
- Browser interaction checks passed at 1440, 1000, 390 and 320 pixels, including reduced motion, long concepts and answers, reopening and clearing saved answers, prediction zero, prediction and map retries, and no horizontal page overflow.
- The browser checks used local mocked API replies. They didn't call production or a live AI model. Native Android keyboard and authentication behavior still require a device check.
- Reload/resume integration: the map draft and next-area guidance survive a reload, and a resumed sixth hint is labelled for the exclusion area using the Turn's cumulative hint count.
- EAS fingerprint comparison against installed Android build 3 (`93910cdd-2d88-4da3-8250-a3de32cc4d46`), using the preview environment: both hashes are `56eeb40fb5a207446053818ae3785913a3d4ffc5`. No build or update was published by this check.
