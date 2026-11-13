import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    // Shared with the static pages: favicon and the IGCSE figure images live in the repo-level public/ folder.
    publicDir: '../public',
    server: {
      port: 5173,
      // During development, send /api requests to the backend (next-level-backend, http://localhost:4000 by default).
      // Set API_PROXY_TARGET in client/.env if it runs somewhere else.
      proxy: { '/api': env.API_PROXY_TARGET || 'http://localhost:4000' },
    },
  };
});
