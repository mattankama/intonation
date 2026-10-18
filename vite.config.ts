/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  // GitHub Pages serves this repo from mattankama.github.io/intonation/. The dev server
  // and the smoke tests stay at the root. src/state/location.ts handles the prefix.
  base: command === 'build' ? '/intonation/' : '/',
  plugins: [react()],
  // three.js lives in each 3D Lab's lazily loaded scene chunk (~950 kB); the main bundle
  // stays free of it.
  build: { chunkSizeWarningLimit: 1200 },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
}));
