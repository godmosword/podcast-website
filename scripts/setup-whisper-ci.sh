#!/usr/bin/env bash
# GitHub Actions：安裝 ffmpeg、編譯 whisper.cpp、確保 large-v3 模型就緒。
# 本機開發若已 brew install whisper-cpp，可直接略過此腳本。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WHISPER_VERSION="${WHISPER_VERSION:-v1.8.6}"
WHISPER_CACHE="${WHISPER_CACHE:-$ROOT/.cache/whisper-cpp}"
WHISPER_BIN_DIR="$WHISPER_CACHE/bin"
WHISPER_BIN="$WHISPER_BIN_DIR/whisper-cli"
MODEL_PATH="${WHISPER_MODEL:-$ROOT/models/ggml-large-v3.bin}"
MODEL_URL="${WHISPER_MODEL_URL:-https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin}"

install_ffmpeg() {
  if command -v ffmpeg >/dev/null 2>&1; then
    return 0
  fi
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq ffmpeg
    return 0
  fi
  echo "ffmpeg not found and apt-get unavailable" >&2
  exit 1
}

install_build_tools() {
  if command -v cmake >/dev/null 2>&1; then
    return 0
  fi
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq build-essential cmake git
    return 0
  fi
  echo "cmake not found and apt-get unavailable" >&2
  exit 1
}

install_whisper_cli() {
  if command -v whisper-cli >/dev/null 2>&1; then
    return 0
  fi
  if [[ -x "$WHISPER_BIN" ]]; then
    export PATH="$WHISPER_BIN_DIR:$PATH"
    if [[ -n "${GITHUB_PATH:-}" ]]; then
      echo "$WHISPER_BIN_DIR" >> "$GITHUB_PATH"
    fi
    return 0
  fi

  install_build_tools
  mkdir -p "$WHISPER_BIN_DIR"
  local src="$WHISPER_CACHE/src"
  local build="$WHISPER_CACHE/build"

  if [[ ! -d "$src/.git" ]]; then
    git clone --depth 1 --branch "$WHISPER_VERSION" \
      https://github.com/ggml-org/whisper.cpp.git "$src"
  fi

  cmake -B "$build" -DCMAKE_BUILD_TYPE=Release "$src"
  cmake --build "$build" -j"$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 2)"
  install -m 755 "$build/bin/whisper-cli" "$WHISPER_BIN"

  export PATH="$WHISPER_BIN_DIR:$PATH"
  if [[ -n "${GITHUB_PATH:-}" ]]; then
    echo "$WHISPER_BIN_DIR" >> "$GITHUB_PATH"
  fi
}

ensure_model() {
  mkdir -p "$(dirname "$MODEL_PATH")"
  if [[ -f "$MODEL_PATH" ]]; then
    return 0
  fi
  echo "Downloading whisper model → $MODEL_PATH"
  curl -fsSL "$MODEL_URL" -o "$MODEL_PATH"
}

install_ffmpeg
install_whisper_cli
ensure_model

whisper-cli --help >/dev/null
ffmpeg -version >/dev/null
echo "Whisper CI ready: $(command -v whisper-cli), model=$MODEL_PATH"
