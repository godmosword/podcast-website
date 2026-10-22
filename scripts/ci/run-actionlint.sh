#!/usr/bin/env bash
# 下載並執行釘選版本的 actionlint。不新增 npm 依賴。
set -euo pipefail

VERSION="${ACTIONLINT_VERSION:-1.7.7}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if command -v actionlint >/dev/null 2>&1; then
  actionlint -color
  exit 0
fi

os="$(uname -s | tr '[:upper:]' '[:lower:]')"
arch="$(uname -m)"
case "$arch" in
  x86_64|amd64) arch="amd64" ;;
  aarch64|arm64) arch="arm64" ;;
esac

url="https://github.com/rhysd/actionlint/releases/download/v${VERSION}/actionlint_${VERSION}_${os}_${arch}.tar.gz"
tmp="$(mktemp -d)"
curl -fsSL "$url" -o "$tmp/actionlint.tar.gz"
tar -xzf "$tmp/actionlint.tar.gz" -C "$tmp" actionlint
(cd "$ROOT" && "$tmp/actionlint" -color)
