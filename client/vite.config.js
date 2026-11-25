import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The question banks (repo-level data/*.json) are published at /data/ for open practice: served from the
// folder during development and copied into dist/data/ by the build.
const dataDir = path.resolve(__dirname, '../data');
const BANK = /^[\w-]+\.json$/;
function questionBanks() {
  return {
    name: 'question-banks',
    configureServer(server) {
      server.middlewares.use('/data', (req, res, next) => {
        const name = decodeURIComponent((req.url || '').split('?')[0].replace(/^\//, ''));
        const file = path.join(dataDir, name);
        if (!BANK.test(name) || !fs.existsSync(file)) return next();
        res.setHeader('Content-Type', 'application/json');
        fs.createReadStream(file).pipe(res);
      });
    },
    writeBundle(options) {
      const out = path.join(options.dir, 'data');
      fs.mkdirSync(out, { recursive: true });
      for (const name of fs.readdirSync(dataDir)) {
        if (BANK.test(name) && name !== 'examiner-reports.json') fs.copyFileSync(path.join(dataDir, name), path.join(out, name));
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), questionBanks()],
    // Shared files: favicon and the question figure images live in the repo-level public/ folder.
    publicDir: '../public',
    server: {
      port: 5173,
      // During development, send /api requests to the backend (next-level-backend, http://localhost:4000 by default).
      // Set API_PROXY_TARGET in client/.env if it runs somewhere else.
      proxy: { '/api': env.API_PROXY_TARGET || 'http://localhost:4000' },
    },
  };
});
