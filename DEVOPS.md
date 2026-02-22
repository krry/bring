# Bring Devops

## 🚀 How to Deploy

To publish changes to the live webring (updating all 7 constellation sites):

1. **Build & Publish** (rebuilds widget + copies to `kerry.ink` repo):
   ```bash
   cd ~/house/desk/bring
   npm run build
   bash scripts/publish-cdn.sh
   ```

2. **Push to Production** (updates the CDN):
   ```bash
   cd ~/house/desk/kerry.ink
   git add widgets/webring
   git commit -m "Update webring widget"
   git push
   ```

*The widget is hosted at `https://kerry.ink/widgets/webring/webring.wc.js`. All sites load it from there.*

---
