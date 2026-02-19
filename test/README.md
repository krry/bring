# Webring Widget Test Page

This directory contains a comprehensive test page for the webring widget component.

## Features

- **Web Component Demo**: Test the self-contained web component version
- **ESM React Component Demo**: Test the React component version
- **Multiple Instances**: Show different configurations side by side
- **Error Handling**: Test various error states
- **Theme Switching**: Toggle between light/dark modes
- **Interactive Controls**: Change widget properties dynamically

## Running the Test Page

### Option 1: Using the built-in server

```bash
# From the project root
node test/server.js
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Using any static file server

```bash
# Using Python (if you have Python installed)
python -m http.server 3000 -d test

# Using serve (npm package)
npx serve test -p 3000

# Using bun (if you have bun installed)
bunx serve test -p 3000
```

## Test Page Structure

- `index.html`: Main test page with all demos
- `webring/`: Contains the built widget files (ESM, Web Component, CSS, JSON data)
- `server.js`: Simple development server for testing

## What's Being Tested

1. **Web Component Functionality**
   - Loading from JSON data source
   - Mode switching (compact/full)
   - Theme switching (light/dark/auto)
   - Error handling for invalid data sources

2. **React Component Functionality**
   - Integration with React
   - Props passing (data, mode, theme, onLinkClick)
   - Dynamic updates

3. **Multiple Instances**
   - Multiple widgets on the same page
   - Different configurations coexisting

4. **Error States**
   - Invalid data sources
   - Empty data sources
   - Loading states

5. **Responsive Design**
   - Different screen sizes
   - Theme switching

## CDN Deployment Testing

The test page simulates CDN serving by:
- Using relative paths to widget files
- Testing both ESM and Web Component versions
- Demonstrating proper module loading

When deploying to CDN, the widget files in `public/widgets/webring/` will be served from a CDN URL, and the test page demonstrates how they would be consumed.