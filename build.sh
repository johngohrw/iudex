#!/usr/bin/env bash
# build.sh — builds llm-flow binary
#
# On systems with internet access (typical dev machine):
#   ./build.sh
#
# On restricted systems (no module proxy), install deps via system package manager first:
#   Ubuntu/Debian:
#     sudo apt install golang-github-charmbracelet-bubbletea-dev \
#                      golang-github-charmbracelet-lipgloss-dev \
#                      golang-github-spf13-cobra-dev \
#                      golang-golang-x-sys-dev
#     ./build.sh --gopath
#
set -euo pipefail

OUTPUT="${OUTPUT:-./llm-flow}"

if [[ "${1:-}" == "--gopath" ]]; then
  # Build using system apt packages in GOPATH mode
  SYS_GOCODE="/usr/share/gocode"
  if [[ ! -d "$SYS_GOCODE/src/github.com/charmbracelet/bubbletea" ]]; then
    echo "Error: apt packages not found. Install them first (see script header)." >&2
    exit 1
  fi
  TMPWS=$(mktemp -d)
  trap "rm -rf $TMPWS" EXIT
  mkdir -p "$TMPWS/src/llm-flow"
  cp -r ./internal ./templates ./main.go "$TMPWS/src/llm-flow/"
  GOPATH="$TMPWS:$SYS_GOCODE" GO111MODULE=off \
    go build -o "$OUTPUT" llm-flow
else
  # Standard module build (requires internet)
  GONOSUMDB='*' go build -o "$OUTPUT" .
fi

echo "Built: $OUTPUT"
"$OUTPUT" --help
