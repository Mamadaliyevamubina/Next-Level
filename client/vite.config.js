import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // During development, send /api requests to the Express server.
    proxy: { '/api': 'http://localhost:4000' },
  },
});
