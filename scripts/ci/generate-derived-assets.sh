#!/usr/bin/env bash
# 衍生資產必須在 sync-validate 之前寫好：blur、音檔長度、catalog sidecar。
set -euo pipefail

npm run generate:story-blurs
npm run generate:audio-lengths
npx tsx scripts/ensure-sync-sidecars.ts
