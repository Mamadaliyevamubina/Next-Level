import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Shared with the static pages: favicon and the IGCSE figure images live in the repo-level public/ folder.
  publicDir: '../public',
  server: {
    port: 5173,
    // During development, send /api requests to the Express server.
    proxy: { '/api': 'http://localhost:4000' },
  },
});
