#!/usr/bin/env bash
set -euo pipefail

if [ -z "$(git status --porcelain)" ]; then
  echo "changed=false" >> "$GITHUB_OUTPUT"
  echo "No changes — skipping commit."
else
  echo "changed=true" >> "$GITHUB_OUTPUT"
  echo "Changes detected — will commit."
fi
