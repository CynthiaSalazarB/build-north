---
name: web-crawl
description: Read a web page as clean markdown with the `crwl` command (Crawl4AI), and install `crwl` in a Claude Code cloud session when it is missing. Use this whenever you need the text of a web page, such as library or API docs (Expo, Clerk, SurrealDB, Render, Anthropic), a changelog, a release note, a blog post or a URL the user gives, instead of WebFetch or curl, even when the user does not say "crawl".
---

# Read a web page with crwl

This project reads web pages with `crwl`, the command-line tool of Crawl4AI. It opens the page in a
headless browser and prints clean markdown, so pages that JavaScript builds come through, and the
headings and links stay.

## Read a page

```bash
crwl "https://nodejs.org/docs/latest-v24.x/api/test.html" -o markdown -b ignore_https_errors=false -O <scratchpad>/node-test.md
```

- Write the page to a file in your scratchpad directory (`-O`), not to the terminal. A docs page is
  often thousands of lines. Then use grep, or read only the part you need.
- Keep `-b ignore_https_errors=false`, so a bad certificate stops the crawl.
- `-o md-fit` keeps only the main content of the page. To follow the links of a docs section, add
  `--deep-crawl bfs --max-pages 10`.
- `Error: 'NoneType' object has no attribute 'raw_markdown'` means that the page did not load. In a
  cloud session, the network policy blocks some hosts, among them the Expo, Render, Clerk and SurrealDB
  sites. To check a host, run `curl -sS -o /dev/null -w '%{http_code}\n' <url>`: a `CONNECT tunnel
  failed, response 403` is the block. Read those docs from your own computer.

## Install crwl in a cloud session

A Claude Code cloud session does not have `crwl`. Install it once in the session (about a minute):

```bash
command -v crwl >/dev/null || uv tool install crawl4ai \
  --with "playwright==$(node -p "require('/opt/node-tools/node_modules/playwright-core/package.json').version")"
```

Why Playwright is pinned: the cloud image has a Chromium build for one Playwright version in
`/opt/pw-browsers`, and the image's rules forbid `playwright install`. The newest Playwright wants a
newer Chromium, and the crawl then fails with "Executable doesn't exist". The Playwright version in
`/opt/node-tools` is the one that matches the Chromium on the image.

On your own computer, install it with `pip install crawl4ai`, then run `crawl4ai-setup` one time to
get its browser.
