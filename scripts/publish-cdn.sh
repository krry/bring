#!/bin/bash

# Publish Webring Widget to kerry.ink (CDN)

# Paths
BRING_DIR="$HOME/house/cabinet/bring-widget"
CDN_DIR="$HOME/house/cabinet/kerry.ink"
WIDGET_DEST="$CDN_DIR/widgets/webring"

# Build
echo "📦 Building widget..."
cd "$BRING_DIR" || exit
npm run build

# Copy
echo "🚚 Deploying to $WIDGET_DEST..."
mkdir -p "$WIDGET_DEST"
cp -R "$BRING_DIR/public/widgets/webring/"* "$WIDGET_DEST/"

# Commit & push kerry.ink
echo "🚀 Committing and pushing kerry.ink..."
cd "$CDN_DIR" || exit
git add .
git commit -m "update webring widget" || echo "⚠️  Nothing new to commit."
git push

echo "✅ Done. Widget live at kerry.ink."
