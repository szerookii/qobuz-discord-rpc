import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
    cssInjectedByJsPlugin(),
  ],
  build: {
    outDir: 'dist/ui',
    emptyOutDir: true,
    lib: {
      entry: 'src/ui/main.ts',
      formats: ['iife'],
      name: 'QobuzModUI',
      fileName: () => 'renderer.js',
    },
  },
});
