# UX guidance · October 23

The self-test's primary action is writing answers in the concept map. Firefly's line and the amber outline suggest the first empty area in `MOVE_ORDER`: Bigger group, What it isn't, What it needs, Its types. Areas remain freely editable, including out of order. Saving text means an area is filled, not that the answer is correct. Only submitting the whole map asks the evaluator to score it.

Following a highlight or opening an editor is interface guidance. It makes no server call, doesn't use a hint, and doesn't affect scores or mastery. The optional fact chat is explicitly separate from answers. A conceptual hint still uses the existing server hint ladder; its confirmation names the actual target and states the score cap or reveal cost before it is requested. The navigation highlight does not change that target.

The prediction has no default selection. Learners choose 0–8 after seeing the task and rubric: four areas, two points each. Prediction records confidence; the map score records the explanation demonstrated in that session. The screen's light previews the chosen number, the same light the session grows one stage per point proved; nothing lights before a number is picked. Neither the preview nor the result map assigns a total prediction to particular areas. The gap appears on the overall score comparison; each map area shows its actual earned points. The result reuses the same rubric and explains the comparison without implying that matching one prediction proves general self-knowledge.

## Review checklist

- Prediction: nothing selected initially; Save disabled until a number is chosen; choosing 0 works; keyboard digits and arrows work; a failed save preserves the current choice.
- Self-test: Start opens Bigger group; Save answer adds the learner's words and highlights What it isn't; saving the remaining areas moves the highlight in order; no points are awarded before submission.
- Editing: clicking any area works; returning to a saved area keeps its text; removing an answer makes it the next suggested area again; exclusion differences survive editing.
- Chat: collapsed initially; its neutral secondary button is more prominent than the underlined hint action, while map writing stays primary; opening it labels factual questions as optional; questions don't write map answers or consume a hint; collapsing and reopening preserves an unsent question.
- Hints: opening and cancelling the confirmation sends nothing; the target matches the server's hint order, even when another area is highlighted; the first hint explains the one-point cap; revealing explains zero points.
- Submission: disabled while empty or busy; review shows all four areas and exclusion differences; empty areas warn that they score zero; Keep editing preserves everything; only Submit my map sends the map.
- Guided mode: the input is labeled with the current answer area; Firefly's connection still points to the current area; retries, hints and reveals retain their existing behavior. Since #155 the evaluator's feedback on an area just finished reads, dim, above the next question (on the phone and pinned with the question in the website layout); the move's name stays off, a revealed answer still reads only while held, and the final answer's feedback still shows on the result.
- Result: prediction and map score are labeled separately; both use the 0–8 scale; the rubric matches the prediction screen; the zero-gap wording refers only to this session.
- Responsive/accessibility: check desktop and narrow phone widths, long concepts and answers, keyboard navigation, modal closing, reduced motion, and no horizontal overflow. In short desktop windows and at higher browser zoom, send a fact question and check that the reply is visible through its scroll ancestors, not merely present in the page. The self-test's left column scrolls as one unit so the instructions and input cannot shrink the replies to zero height; Firefly's connection follows its scroll position and hides when Firefly is offscreen. On a phone the thread sits below the map, so the screen follows each new chat line once (the echo, the answer, a hint or a failure) and leaves the scroll alone when a map area is saved (#153).

The login and start-page headlines stay as Cynthia wrote them on October 23. Only the two mode descriptions on Start explain where answers go.

## Verified locally

- Unit suites after integrating main: 64 app tests, 61 API tests, 106 agents tests passed. The real-SurrealDB integration test was skipped because no test database was configured.
- All three workspace typechecks passed. The initial static web export passed. App lint has zero errors; seven existing React Compiler diagnostics remain warnings after main's session-resume feature. Run `npm exec -w app -- eslint src` directly: adding a lint script to the app's package changes Expo's native fingerprint and would prevent updates reaching the installed Android build.
- Browser interaction checks passed at 1440, 1000, 390 and 320 pixels, including reduced motion, long concepts and answers, reopening and clearing saved answers, prediction zero, prediction and map retries, and no horizontal page overflow.
- The browser checks used local mocked API replies. They didn't call production or a live AI model. Native Android keyboard and authentication behavior still require a device check.
- Reload/resume integration: the map draft and next-area guidance survive a reload, and a resumed sixth hint is labelled for the exclusion area using the Turn's cumulative hint count.
- EAS fingerprint comparison against installed Android build 3 (`93910cdd-2d88-4da3-8250-a3de32cc4d46`), using the preview environment: both hashes are `56eeb40fb5a207446053818ae3785913a3d4ffc5`. No build or update was published by this check.

## October 24: tester-only wording trial

The self-test/whole-map cards and editors show the task as a question, not just the method's short label: a kind of, a same-category comparison and its difference, defining features, and classification by one consistent rule. The comparison repeats the learner's chosen category neutrally, without confirming it or blocking answers out of order. Instructions remain visible when typing, so the optional worked example is not required to understand the task.

Classification asks for the grouping rule followed by at least two types in the existing answer field (multiline, up to 500 characters). It is kept verbatim in the existing `Item.value`; no new criterion field, API schema or evaluator prompt is introduced. Comparisons still use the existing value/difference pair. The current evaluator checks a close concept plus a meaningful difference, not strict membership in the learner's proposed category. This is a usability wording trial; scores are provisional for the new instruction and must not be treated as validation of the stricter category requirement or compared across different pre-/post-test interfaces.

The intended deployment target is the `testers` web alias only, from the review branch. No production alias, Android update, backend or grading change is part of this trial. Keep each tester's pre-/post-test on the same deployed wording version.
