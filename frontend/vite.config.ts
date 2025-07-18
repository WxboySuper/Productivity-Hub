/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  // @ts-expect-error vitest types
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    reporter: 'verbose',
    logLevel: 'info',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.*',
        'src/index.tsx',
        'src/reportWebVitals.ts',
        'src/main.tsx',
        '**/*.test.tsx',
        '**/*.test.ts',
        '**/testUtils.ts',
      ],
    },
  },
});
