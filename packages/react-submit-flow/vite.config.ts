import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.tsx'),
        headless: resolve(import.meta.dirname, 'src/headless.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rolldownOptions: {
      external: [/^react(?:\/.*)?$/, /^react-dom(?:\/.*)?$/],
      output: {
        banner: '"use client";',
      },
    },
    sourcemap: true,
    minify: true,
    emptyOutDir: false,
  },
});
