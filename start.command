#!/bin/bash
cd "$(dirname "$0")" || exit 1
HINATA_NODE="$(command -v node)"
if [ -z "$HINATA_NODE" ]; then
  HINATA_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [ ! -x "$HINATA_NODE" ]; then
  echo 'Node.js 22以降をインストールしてください。'
  read -r
  exit 1
fi
if [ ! -d node_modules ] || [ ! -d dist ]; then
  echo 'READMEの初回セットアップを実施してください: npm install && npm run build'
  read -r
  exit 1
fi
open "http://127.0.0.1:4173/?v=$(date +%s)"
"$HINATA_NODE" node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort
