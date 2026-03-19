#!/bin/bash

# Publish webring widget to kerry.ink CDN

BRING_DIR="$HOME/house/cabinet/bring-widget"
CDN_DIR="$HOME/house/cabinet/kerry.ink"

# Build
echo "📦 Building widget..."
cd "$BRING_DIR" || exit
npm run build

# Copy webring
echo "🚚 Deploying webring..."
mkdir -p "$CDN_DIR/widgets/webring"
cp -R "$BRING_DIR/public/widgets/webring/"* "$CDN_DIR/widgets/webring/"

# Commit & push kerry.ink
echo "🚀 Committing and pushing kerry.ink..."
cd "$CDN_DIR" || exit
git add .
git commit -m "update webring widget" || echo "⚠️  Nothing new to commit."
git push

echo "✅ Done. Widget live at kerry.ink/widgets/webring/"
