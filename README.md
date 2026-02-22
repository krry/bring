# Webring Widget

A lightweight, dual-format webring widget for *.kerry.ink sites. Delivers as both an ES module and a self-contained Web Component.

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

## What This Is

A webring aggregator that displays links to interconnected sites (orfx.kerry.ink, nameless.quest, easeness.kerry.ink, dev.kerry.ink, passage, etc.). Available in two flavors:

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

### Clean

Remove built files:

```bash
npm run clean
```

### Testing

Start the test server to preview the widget:

```bash
npm run test
```

This will start a development server at [http://localhost:3000](http://localhost:3000) with a comprehensive test page that includes:
- Web Component demos
- React component demos
- Multiple instances with different configurations
- Error handling tests
- Theme switching

## Build and Test Workflow

### Full Build and Test Cycle

```bash
npm run test:build
```

This command:
1. Runs a fresh build (`npm run build`)
2. Starts the test server (`npm run test`)
3. Opens the test page in your browser

### Build Process Details

The build process uses esbuild to create two optimized bundles:

1. **ESM Module** (`webring.esm.js`):
   - Target: Modern browsers with ES module support
   - Format: ES Module (ESM)
   - React as external dependency (must be provided separately)
   - Ideal for React applications

2. **Web Component** (`webring.wc.js`):
   - Target: Any browser
   - Format: IIFE (Immediately Invoked Function Expression)
   - Self-contained, no external dependencies
   - Ideal for any HTML page

Both builds include:
- TypeScript compilation
- Code minification
- Source maps for debugging
- Tree shaking for optimal bundle size

### Testing Process

The test server provides:
- Live reloading during development
- Comprehensive test scenarios
- Interactive controls for dynamic testing
- Error state simulation
- Theme switching capabilities

You can also use any static file server to test:

```bash
# Using Python
python -m http.server 3000 -d test

# Using serve (npm package)
npx serve test -p 3000

# Using bun
bunx serve test -p 3000
```

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

### Deployment Testing

Before deploying to production, thoroughly test using the test server:

```bash
# Build and test in one command
npm run test:build
```

This ensures:
- Both ESM and Web Component versions work correctly
- All configurations (compact/full modes, light/dark themes) function properly
- Error handling works as expected
- Multiple instances can coexist on the same page

### CDN Deployment Checklist

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Test locally**:
   ```bash
   npm run test
   ```
   - Verify all demos work
   - Test theme switching
   - Test error states
   - Test interactive controls

3. **Deploy to CDN**:
   - Upload contents of `public/widgets/webring/` to your CDN
   - Ensure proper CORS headers are set
   - Set appropriate cache headers

4. **Verify CDN deployment**:
   - Test loading from CDN URLs
   - Verify no mixed content warnings
   - Test performance and loading times

5. **Integrate into sites**:
   - Update site templates to use CDN URLs
   - Test integration with existing site styles
   - Verify responsive behavior

### Post-Deployment Testing

After deployment, test on various browsers and devices:
- Chrome, Firefox, Safari, Edge
- Mobile devices (iOS, Android)
- Different screen sizes
- Various network conditions

Use the test page as a reference for expected behavior across all platforms.

## Development Notes

- **Component logic implemented** — React and Web Component versions are functional
- **Styles included** — CSS is bundled or available separately
- **External dependencies** — React is listed as external in ESM build (must be provided separately)
- **Web Component is standalone** — doesn't require React, suitable for any HTML page

## Troubleshooting

### Build Issues

**Build fails with TypeScript errors**:
- Ensure all TypeScript dependencies are installed: `npm install`
- Check `tsconfig.json` for proper compiler options
- Verify all type definitions are correct

**Build succeeds but files are missing**:
- Run `npm run clean` then `npm run build` to force a fresh build
- Check that source files exist in the expected locations
- Verify write permissions in the `public/widgets/webring/` directory

**Build is slow**:
- The first build may take longer due to TypeScript compilation
- Subsequent builds are faster due to caching
- Use `npm run watch` for development to avoid full rebuilds

### Test Issues

**Test server doesn't start**:
- Ensure port 3000 is available
- Check for error messages in the console
- Try a different port by modifying `test/server.js`

**Widget doesn't appear in test page**:
- Verify the build completed successfully
- Check browser console for JavaScript errors
- Ensure all widget files are present in `test/webring/`
- Try clearing browser cache or using incognito mode

**Widget styles are broken**:
- Check that `webring.css` is loaded in the test page
- Verify CSS file paths are correct
- Ensure no conflicting styles from other CSS files

**React component demo fails**:
- Ensure React and React DOM are loaded before the component
- Check for version conflicts between React versions
- Verify the ESM module is properly imported

### Common Solutions

**Clean and rebuild**:
```bash
npm run clean
npm run build
```

**Check file permissions**:
```bash
chmod +x build/build.js
chmod +x test/server.js
```

**Verify dependencies**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Debug build process**:
```bash
DEBUG=1 npm run build
```

## Next Steps

1. Implement full Webring component logic
2. Refine styles and design
3. Test building process end-to-end
4. Set up CDN delivery for *.kerry.ink sites
5. Integrate into orfx-site and other sites

---

**Built with esbuild, TypeScript, React, and Web Components.**
