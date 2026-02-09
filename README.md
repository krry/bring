# Webring Widget

A lightweight, dual-format webring widget for *.kerry.ink sites. Delivers as both an ES module and a self-contained Web Component.

## What This Is

A webring aggregator that displays links to interconnected sites (orfx.kerry.ink, nameless.quest, fullsmile.world, krry.dev, passage, etc.). Available in two flavors:

1. **ESM Module** (`webring.esm.js`) — Import in React/modern JS
2. **Web Component** (`webring.wc.js`) — Drop into any HTML page

## Quick Start

### Installation

```bash
npm install
```

### Development

Watch for changes and rebuild on save:

```bash
npm run dev
# or
npm run watch
```

### Build

Build once (minified, with source maps):

```bash
npm run build
```

Output goes to `public/widgets/webring/`:
- `webring.esm.js` — ES module (external React)
- `webring.wc.js` — Web Component (standalone)
- `webring.css` — Stylesheet
- `webring.json` — Data source

## Usage

### React Component

```jsx
import { Webring } from 'webring-widget';
import 'webring-widget/styles';

export function MyPage() {
  return (
    <Webring
      data="https://example.com/webring.json"
      mode="full"
      theme="auto"
    />
  );
}
```

### Web Component

```html
<webring-widget
  data-source="https://example.com/webring.json"
  mode="compact"
  theme="light"
></webring-widget>

<script src="https://cdn.example.com/webring.wc.js"></script>
<link rel="stylesheet" href="https://cdn.example.com/webring.css">
```

## Project Structure

```
bring/
├── src/
│   ├── components/
│   │   └── webring/              # Component implementations
│   │       ├── Webring.tsx       # React component
│   │       ├── webring.element.ts # Web Component
│   │       ├── fetchWebringData.ts # Data fetching logic
│   │       ├── styles.css        # Component styles
│   │       └── index.ts          # Exports
│   ├── data/
│   │   └── webring.json          # Single source of truth for links
│   └── types/
│       └── webring.ts            # TypeScript interfaces
├── build/
│   ├── esbuild.config.js         # Build configuration
│   └── build.js                  # Build runner
├── public/
│   └── widgets/
│       └── webring/              # Output directory
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

### Attributes (Web Component)

- `data-source` (required) — URL to webring.json or inline JSON
- `mode` (optional) — `"compact"` (default) or `"full"` (shows descriptions)
- `theme` (optional) — `"light"`, `"dark"`, or `"auto"` (default)

### Props (React)

- `data` (required) — URL string or WebringData object
- `mode` (optional) — `"compact"` | `"full"`
- `theme` (optional) — `"light"` | `"dark"` | `"auto"`
- `onLinkClick` (optional) — Callback when a link is clicked

## Data Format

`webring.json`:

```json
{
  "version": "1.0.0",
  "links": [
    {
      "name": "Site Name",
      "url": "https://site.example.com",
      "description": "What this site is about"
    }
  ],
  "metadata": {
    "updated": "2026-02-08T21:27:00Z",
    "count": 5
  }
}
```

## Deployment

Built artifacts are in `public/widgets/webring/`. These are ready to serve from a CDN:

```
https://cdn.example.com/widgets/webring/webring.esm.js
https://cdn.example.com/widgets/webring/webring.wc.js
https://cdn.example.com/widgets/webring/webring.css
https://cdn.example.com/widgets/webring/webring.json
```

(Full deployment instructions coming later.)

## Development Notes

- **No full component logic yet** — scaffolding is in place, components are ready for implementation
- **Placeholder styles** — CSS is ready for design refinement
- **External dependencies** — React is listed as external in ESM build (must be provided separately)
- **Web Component is standalone** — doesn't require React, suitable for any HTML page

## Next Steps

1. Implement full Webring component logic
2. Refine styles and design
3. Test building process end-to-end
4. Set up CDN delivery for *.kerry.ink sites
5. Integrate into orfx-site and other sites

---

**Built with esbuild, TypeScript, React, and Web Components.**
