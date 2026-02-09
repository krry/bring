#!/usr/bin/env node

/**
 * Build runner for webring widget
 * Usage:
 *   npm run build         - Build once
 *   npm run watch        - Watch for changes
 *   npm run dev          - Alias for watch
 */

import { build } from './esbuild.config.js';

const args = process.argv.slice(2);
const isWatch = args.includes('--watch') || args.includes('-w');

build(isWatch).catch((error) => {
  console.error('Build error:', error);
  process.exit(1);
});
