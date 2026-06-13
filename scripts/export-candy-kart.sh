#!/usr/bin/env bash
# 繽紛卡丁車 Godot Web export wrapper。
# 需求：Godot 4.3.x（含 Web export templates）。export 產物入庫（Vercel 無 Godot 無法重建）。
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_DIR="$REPO_ROOT/candy-kart-game"
OUT_DIR="$REPO_ROOT/public/candy-kart"

# 依序找 Godot binary：環境變數 → toolchain 目錄 → PATH → /Applications
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
  echo "找不到 Godot。安裝 4.3.x 後再試，或設定 GODOT_BIN=/path/to/godot" >&2
  echo "下載：https://github.com/godotengine/godot/releases/tag/4.3-stable" >&2
  exit 1
fi

VERSION="$("$GODOT_BIN" --version)"
case "$VERSION" in
  4.3.*) ;;
  *) echo "警告：偵測到 Godot $VERSION，專案以 4.3.x 為準（export templates 須相符）" >&2 ;;
esac

mkdir -p "$OUT_DIR"
echo "==> headless smoke test"
"$GODOT_BIN" --headless --path "$PROJECT_DIR" -- --smoke 2>&1 | grep SMOKE_RESULT
echo "==> export Web -> $OUT_DIR"
"$GODOT_BIN" --headless --path "$PROJECT_DIR" --export-release "Web" >/dev/null
ls -la "$OUT_DIR"
echo "完成。記得 commit public/candy-kart/（部署只吃入庫產物）。"
