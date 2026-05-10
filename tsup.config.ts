import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  dts: false,
  sourcemap: true,
  splitting: false,
  shims: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
