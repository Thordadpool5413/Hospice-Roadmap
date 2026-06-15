#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MOBILE="artifacts/mobile"

if [[ ! -f .git/MERGE_HEAD ]]; then
  echo "No merge in progress. Nothing to resolve."
  exit 1
fi

echo "Resolving Replit merge conflicts using GitHub (incoming) mobile/EAS config..."

# app.config.js was replaced by app.config.ts on GitHub.
rm -f "$MOBILE/app.config.js"
git rm -f "$MOBILE/app.config.js" 2>/dev/null || true

if [[ -f "$MOBILE/app.config.ts" ]]; then
  git checkout --theirs -- "$MOBILE/app.config.ts" 2>/dev/null || git checkout origin/master -- "$MOBILE/app.config.ts"
  git add "$MOBILE/app.config.ts"
fi

for file in \
  "$MOBILE/eas.json" \
  "$MOBILE/package.json" \
  package.json \
  pnpm-lock.yaml; do
  if [[ -f "$file" ]] || git ls-files -u -- "$file" >/dev/null 2>&1; then
    git checkout --theirs -- "$file" 2>/dev/null || git checkout origin/master -- "$file"
    git add "$file"
  fi
done

echo "Refreshing lockfile..."
pnpm install

git add pnpm-lock.yaml 2>/dev/null || true
git commit -m "Merge origin/master: resolve Replit conflicts (keep GitHub mobile/EAS config)"

echo "Merge complete. Run: git push"