#!/bin/bash

# Publish Webring Widget to kerry.ink (CDN)

# Paths
BRING_DIR="$HOME/house/desk/bring"
CDN_DIR="$HOME/house/desk/kerry.ink"
WIDGET_DEST="$CDN_DIR/widgets/webring"

# Build
echo "📦 Building widget..."
cd "$BRING_DIR" || exit
npm run build

# Copy
echo "🚚 Deploying to $WIDGET_DEST..."
mkdir -p "$WIDGET_DEST"
cp -R "$BRING_DIR/public/widgets/webring/"* "$WIDGET_DEST/"

# Status
echo "✅ Widget updated in kerry.ink repo."
echo "👉 To publish: "
echo "cd $CDN_DIR && git add . && git commit -m 'update webring widget' && git push" | pbcopy
echo "📄 Command copied to clipboard"
