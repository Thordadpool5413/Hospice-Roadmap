#!/usr/bin/env bash
# Reset a diverged Replit workspace to match GitHub master.
# Use when Replit shows: "pulling will start a merge with conflicts".
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Fetching origin/master..."
git fetch origin --prune

if ! git show-ref --verify --quiet refs/remotes/origin/master; then
  echo "ERROR: origin/master not found. Check the Git remote in Replit."
  exit 1
fi

UPSTREAM="$(git rev-parse --short origin/master)"
LOCAL="$(git rev-parse --short HEAD 2>/dev/null || echo none)"

echo "==> Local HEAD:  $LOCAL"
echo "==> Upstream:    $UPSTREAM"

if [ "$LOCAL" = "$UPSTREAM" ] && [ -z "$(git status --porcelain)" ]; then
  echo "==> Already in sync with origin/master."
  exit 0
fi

BACKUP_BRANCH="replit-backup-$(date +%Y%m%d-%H%M%S)"
echo "==> Saving current state to branch: $BACKUP_BRANCH"
git branch "$BACKUP_BRANCH" HEAD

echo "==> Resetting master to origin/master..."
git checkout master 2>/dev/null || git checkout -B master
git reset --hard origin/master

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Sync complete at $(git rev-parse --short HEAD)"
git log --oneline -3