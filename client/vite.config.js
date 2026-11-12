import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: "/" and "/admin" → "/admin/" (Vite only serves the exact base path).
const adminRedirect = {
  name: 'admin-redirect',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/' || req.url === '/admin') {
        res.writeHead(302, { Location: '/admin/' });
        return res.end();
      }
      next();
    });
  },
};

// Admin dashboard → dist/admin (served by the API at /admin).
// Dev: npm run dev → http://localhost:5174/admin/ ; demo storefront at /admin/demo.html
export default defineConfig({
  base: '/admin/',
  plugins: [react(), adminRedirect],
  server: { port: 5174, proxy: { '/api': 'http://localhost:4100', '/ws': { target: 'ws://localhost:4100', ws: true } } },
  build: { outDir: 'dist/admin', emptyOutDir: true },
  // antd's first render is slow on cold machines; 20s avoids flaky timeouts without hiding hangs.
  test: { environment: 'jsdom', include: ['src/**/*.test.{js,jsx}'], testTimeout: 20000 },
});
