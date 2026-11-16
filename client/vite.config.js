import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: { port: 5174, proxy: { '/api': 'http://localhost:4100', '/ws': { target: 'ws://localhost:4100', ws: true } } },
  build: { outDir: 'dist/admin', emptyOutDir: true },
  // antd's first render is slow on cold machines; 20s avoids flaky timeouts without hiding hangs.
  test: { environment: 'jsdom', include: ['src/**/*.test.{js,jsx}'], testTimeout: 20000 },
});
