import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Embeddable widget → dist/widget/chat.js (one self-contained async script, served at /widget/chat.js).
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: 'dist/widget',
    emptyOutDir: true,
    lib: { entry: 'src/widget/embed.jsx', name: 'LiveChatWidget', formats: ['iife'], fileName: () => 'chat.js' },
    cssCodeSplit: false,
    copyPublicDir: false, // dashboard favicons are not part of the storefront widget
  },
});
