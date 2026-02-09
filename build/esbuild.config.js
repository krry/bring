import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.resolve(projectRoot, 'src');
const publicDir = path.resolve(projectRoot, 'public');
const outputDir = path.resolve(publicDir, 'widgets', 'webring');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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
 * Build runner
 */
export async function build(watch = false) {
  try {
    console.log('🔨 Building webring widget...\n');

    // ESM build
    console.log('Building ESM module...');
    if (watch) {
      const emsCtx = await esbuild.context(esmConfig);
      await emsCtx.watch();
      console.log(`✓ Watching ESM: ${esmConfig.outfile}`);
    } else {
      await esbuild.build(esmConfig);
      console.log(`✓ Built ESM: ${esmConfig.outfile}`);
    }

    // Web Component build
    console.log('\nBuilding Web Component...');
    if (watch) {
      const wcCtx = await esbuild.context(wcConfig);
      await wcCtx.watch();
      console.log(`✓ Watching WC: ${wcConfig.outfile}`);
    } else {
      await esbuild.build(wcConfig);
      console.log(`✓ Built WC: ${wcConfig.outfile}`);
    }

    // Copy static files
    copyStyles();
    copyData();

    if (!watch) {
      console.log('\n✅ Build complete!');
      console.log(`\nOutput directory: ${outputDir}`);
      console.log(`Files generated:`);
      console.log(`  - webring.esm.js (ESM module)`);
      console.log(`  - webring.wc.js (Web Component)`);
      console.log(`  - webring.css (Styles)`);
      console.log(`  - webring.json (Data)`);
      console.log(`\n📦 Ready for deployment to CDN`);
    } else {
      console.log('\n👀 Watching for changes... (Press Ctrl+C to stop)');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Export for use in build.js
export { esmConfig, wcConfig };
