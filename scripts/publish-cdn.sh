#!/bin/bash

# Publish widgets to kerry.ink CDN (webring + ambient)

BRING_DIR="$HOME/house/cabinet/bring-widget"
CDN_DIR="$HOME/house/cabinet/kerry.ink"

# Build
echo "📦 Building widgets..."
cd "$BRING_DIR" || exit
npm run build

# Copy webring
echo "🚚 Deploying webring..."
mkdir -p "$CDN_DIR/widgets/webring"
cp -R "$BRING_DIR/public/widgets/webring/"* "$CDN_DIR/widgets/webring/"

# Copy ambient
echo "🚚 Deploying ambient..."
mkdir -p "$CDN_DIR/widgets/ambient"
cp -R "$BRING_DIR/public/widgets/ambient/"* "$CDN_DIR/widgets/ambient/"

# Commit & push kerry.ink
echo "🚀 Committing and pushing kerry.ink..."
cd "$CDN_DIR" || exit
git add .
git commit -m "update widgets (webring + ambient)" || echo "⚠️  Nothing new to commit."
git push

echo "✅ Done. Widgets live at kerry.ink/widgets/"
