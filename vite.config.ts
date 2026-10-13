import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `base: './'` mantém os caminhos relativos: o build funciona em qualquer
// subdiretório (GitHub Pages, Netlify, um servidor estático comum).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
