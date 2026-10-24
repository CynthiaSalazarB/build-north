# Round 10: UI/UX research for after the freeze

Started October 24, 2026, after the 6 PM freeze. Nothing here ships before Demo Day (October 29). It is the
research for the next version of the website and the app: what makes a screen understood at a glance, what makes
it beautiful, and what slow learners need.

Three parts, each on its own branch and pull request so Cynthia can review them one at a time:

| Part | File | What it holds |
|---|---|---|
| The guide | [`ui-ux-best-practices.md`](ui-ux-best-practices.md) | The rules with their sources: affordances and signifiers (Norman), self-evident design (Krug), Nielsen's heuristics, Gestalt, Fitts and Hick, cognitive load, progressive disclosure, beauty techniques, WCAG 2.2, and a section for slow learners and low digital literacy. Ends with a review checklist. |
| The audit | [`lumente-ux-audit.md`](lumente-ux-audit.md) | Every screen and state of Lumente against those rules: numbered findings with severity and evidence, what to keep, a written brief per screen for the mockups, and the five changes that help slow learners most. |
| The copy pass | [`copy-pass.md`](copy-pass.md) | Every on-screen string that could be plainer: where it lives, the proposed wording and why, as a numbered list for Cynthia to pick from. Her two headlines stay hers. |
| The mockups | [`stitch/`](stitch/) | Google Stitch mockups of the improved screens, generated from [`stitch/DESIGN.md`](stitch/DESIGN.md) (round 9's tokens written as a design system) and the audit's briefs. Each screen keeps its screenshot and its HTML. |

The term for "a user sees it and knows what to do" is **affordance** (what an object lets you do) with a
**signifier** (the visible cue that tells you so), both from Don Norman's *The Design of Everyday Things*; Steve
Krug's *Don't Make Me Think* calls the result a self-evident design.

What stays fixed through all of it: the method in `wiki/synthesis/product-thesis.md` (the guess first, the four
parts, help that costs points and fades level by level, the fact desk at level 5, the gap on the result) and the
firefly, drawn as it is in the app. Where a mockup or a wording would change how the app works, it is listed as a
question for the team (`stitch/README.md`, "questions for the team"), not made.

How the parts are used: the guide is the standard, the audit is the gap list, the mockups show one way to close
it. A change to the app still goes through `design-check` (the gap list between the build and the mockup, signed
off before coding), then the usual branch and pull request.

Tools: the guide and the audit were researched in Claude Code cloud sessions; the mockups come from Google
Stitch through its MCP server (`stitch.googleapis.com/mcp`, an API key per Google account, no charge on the free
tier as of October 2026; Google does not publish the monthly limit).
