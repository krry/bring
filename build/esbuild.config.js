import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.resolve(projectRoot, 'src');
const publicDir = path.resolve(projectRoot, 'public');
const outputDir = path.resolve(publicDir, 'widgets', 'webring');
const ambientOutputDir = path.resolve(publicDir, 'widgets', 'ambient');

// Ensure output directories exist
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(ambientOutputDir)) fs.mkdirSync(ambientOutputDir, { recursive: true });

const commonOptions = {
  bundle: true,
  minify: true,
  sourcemap: true,
  loader: {
    '.json': 'json',
  },
  external: ['react', 'react-dom'],
};

/**
 * ESM Build Configuration
 * Exports Webring React component as ESM module
 */
const esmConfig = {
  ...commonOptions,
  entryPoints: [path.resolve(srcDir, 'components/webring/Webring.tsx')],
  format: 'esm',
  outfile: path.resolve(outputDir, 'webring.esm.js'),
  platform: 'browser',
  target: 'es2020',
};

/**
 * Web Component Build Configuration
 * Self-contained IIFE bundle with embedded styles
 */
const wcConfig = {
  ...commonOptions,
  entryPoints: [path.resolve(srcDir, 'components/webring/webring.element.ts')],
  format: 'iife',
  outfile: path.resolve(outputDir, 'webring.wc.js'),
  globalName: 'WebringWidget',
  platform: 'browser',
  target: 'es2020',
  bundle: true,
  minify: true,
};

// ── Ambient widget ─────────────────────────────────────────────────────────────

const ambientEsmConfig = {
  ...commonOptions,
  entryPoints: [path.resolve(srcDir, 'components/ambient/Ambient.tsx')],
  format: 'esm',
  outfile: path.resolve(ambientOutputDir, 'ambient.esm.js'),
  platform: 'browser',
  target: 'es2020',
};

const ambientWcConfig = {
  ...commonOptions,
  external: [], // bundle everything — standalone IIFE, no react dep
  entryPoints: [path.resolve(srcDir, 'components/ambient/ambient.element.ts')],
  format: 'iife',
  outfile: path.resolve(ambientOutputDir, 'ambient.wc.js'),
  globalName: 'AmbientWidget',
  platform: 'browser',
  target: 'es2020',
  bundle: true,
  minify: true,
};

/**
 * Copy CSS file
 */
function copyStyles() {
  const srcCss = path.resolve(srcDir, 'components/webring/styles.css');
  const destCss = path.resolve(outputDir, 'webring.css');
  if (fs.existsSync(srcCss)) {
    fs.copyFileSync(srcCss, destCss);
    console.log(`✓ Copied styles: ${destCss}`);
  }
}

/**
 * Copy webring.json data
 */
function copyData() {
  const srcJson = path.resolve(srcDir, 'data/webring.json');
  const destJson = path.resolve(outputDir, 'webring.json');
  if (fs.existsSync(srcJson)) {
    fs.copyFileSync(srcJson, destJson);
    console.log(`✓ Copied data: ${destJson}`);
  }
}

/**
 * Copy built files to test directory for demo
 */
function copyToTest() {
  const pairs = [
    [outputDir,       path.resolve(projectRoot, 'test', 'widgets', 'webring')],
    [ambientOutputDir, path.resolve(projectRoot, 'test', 'widgets', 'ambient')],
  ];
  for (const [src, dest] of pairs) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(file => {
      fs.copyFileSync(path.resolve(src, file), path.resolve(dest, file));
    });
    console.log(`✓ Copied to test: ${dest}`);
  }
}

/**
 * Build runner
 */
export async function build(watch = false) {
  try {
    console.log('🔨 Building webring widget...\n');

    const builds = [
      { label: 'webring ESM',  cfg: esmConfig },
      { label: 'webring WC',   cfg: wcConfig },
      { label: 'ambient ESM',  cfg: ambientEsmConfig },
      { label: 'ambient WC',   cfg: ambientWcConfig },
    ];

    for (const { label, cfg } of builds) {
      if (watch) {
        const ctx = await esbuild.context(cfg);
        await ctx.watch();
        console.log(`✓ Watching ${label}: ${cfg.outfile}`);
      } else {
        await esbuild.build(cfg);
        console.log(`✓ Built ${label}: ${cfg.outfile}`);
      }
    }

    // Copy static files
    copyStyles();
    copyData();
    copyToTest();

    if (!watch) {
      console.log('\n✅ Build complete!');
      console.log('  webring: webring.esm.js, webring.wc.js, webring.css, webring.json');
      console.log('  ambient: ambient.esm.js, ambient.wc.js');
      console.log('\n📦 Ready for deployment to CDN');
    } else {
      console.log('\n👀 Watching for changes... (Press Ctrl+C to stop)');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Export for use in build.js
export { esmConfig, wcConfig, ambientEsmConfig, ambientWcConfig };
