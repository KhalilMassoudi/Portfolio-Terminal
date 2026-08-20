import { defineConfig } from 'vite';

// Static, dependency-light build. No UI framework — vanilla ES modules.
// Output is hashed, minified, and tree-shaken for a fast, cache-friendly deploy.
export default defineConfig({
  root: 'src',
  base: './',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2020',
    cssMinify: 'esbuild',
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: true,
  },
});
