#!/usr/bin/env bash
# 阿蹦雪山衝刺 Godot Web export wrapper。
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_DIR="$REPO_ROOT/snowboard-game"
OUT_DIR="$REPO_ROOT/public/snowboard"

GODOT_BIN="${GODOT_BIN:-}"
if [ -z "$GODOT_BIN" ]; then
  for candidate in \
    "$HOME/godot-toolchain/Godot.app/Contents/MacOS/Godot" \
    "$(command -v godot || true)" \
    "/Applications/Godot.app/Contents/MacOS/Godot"; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
      GODOT_BIN="$candidate"
      break
    fi
  done
fi
if [ -z "$GODOT_BIN" ]; then
  echo "找不到 Godot 4.3.x；可設定 GODOT_BIN=/path/to/godot" >&2
  exit 1
fi

VERSION="$("$GODOT_BIN" --version)"
case "$VERSION" in
  4.3.*) ;;
  *) echo "警告：偵測到 Godot $VERSION，專案以 4.3.x 為準" >&2 ;;
esac

mkdir -p "$OUT_DIR"
SMOKE_LOG="$(mktemp)"
set +e
"$GODOT_BIN" --headless --path "$PROJECT_DIR" -- --smoke >"$SMOKE_LOG" 2>&1
SMOKE_CODE=$?
set -e
cat "$SMOKE_LOG"
if [ "$SMOKE_CODE" -ne 0 ] || ! grep -q "SMOKE_RESULT.*ok=true" "$SMOKE_LOG"; then
  echo "snowboard smoke test 失敗" >&2
  rm -f "$SMOKE_LOG"
  exit 1
fi
rm -f "$SMOKE_LOG"

"$GODOT_BIN" --headless --path "$PROJECT_DIR" --export-release "Web" >/dev/null
ls -la "$OUT_DIR"
