#!/bin/bash
# Claude Code cloud sessions only. The cloud image has Node 20 to 22, but this repo needs Node 24 (.node-version).
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

NODE_VERSION=24.22.1
# SHA-256 of node-v24.22.1-linux-x64.tar.gz, from https://nodejs.org/dist/v24.22.1/SHASUMS256.txt
NODE_SHA256=eb6728e77c576a35162c122c45ccadf224d89ff00abc8dae46cc2897c6002d7c
NODE_DIR=/opt/node24
TARBALL="node-v$NODE_VERSION-linux-x64.tar.gz"

if [ "$("$NODE_DIR/bin/node" -v 2>/dev/null)" != "v$NODE_VERSION" ]; then
  TMP=$(mktemp -d)
  curl -fsSL --retry 3 -o "$TMP/$TARBALL" "https://nodejs.org/dist/v$NODE_VERSION/$TARBALL"
  echo "$NODE_SHA256  $TMP/$TARBALL" | sha256sum -c --quiet -
  rm -rf "$NODE_DIR"
  mkdir -p "$NODE_DIR"
  tar -xzf "$TMP/$TARBALL" -C "$NODE_DIR" --strip-components=1
  rm -rf "$TMP"
fi

export PATH="$NODE_DIR/bin:$PATH"
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PATH=\"$NODE_DIR/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi

cd "$CLAUDE_PROJECT_DIR"
npm install --no-audit --no-fund
