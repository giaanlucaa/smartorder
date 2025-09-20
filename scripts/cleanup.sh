#!/usr/bin/env bash
set -euo pipefail

# Monorepo-Root auflösen
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🧹 Starting cleanup in: $ROOT_DIR"

# 1) Runtime- und Build-Artefakte entfernen (safe)
echo "📦 Removing build artifacts..."
rm -rf \
  .turbo \
  .next \
  .vercel/output \
  node_modules \
  pnpm-lock.yaml.backup* \
  coverage \
  dist \
  out \
  .cache \
  **/.next \
  **/.turbo \
  **/dist \
  **/coverage \
  **/.cache

# 2) Editor-/OS-Müll
echo "🗑️ Removing OS/Editor files..."
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "Thumbs.db" -delete 2>/dev/null || true
find . -name "*.log" -delete 2>/dev/null || true

# 3) Pnpm Store lokal aufräumen (optional)
echo "📦 Cleaning pnpm store..."
pnpm store prune 2>/dev/null || true

echo "✅ Cleanup done (Artefakte/Caches)."
