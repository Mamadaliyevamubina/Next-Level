import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
const [renderDir, pdfDir, outDir] = process.argv.slice(2);
const types = { '.html': 'text/html', '.mjs': 'text/javascript', '.pdf': 'application/pdf' };
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '');
  const file = name.startsWith('pdf/') ? path.join(pdfDir, path.basename(name)) : name.endsWith('.mjs') ? path.join(renderDir, 'node_modules/pdfjs-dist/legacy/build', path.basename(name)) : path.join(renderDir, 'render.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);
await new Promise((r) => server.on('listening', r));
const port = server.address().port;
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const p = await b.newPage();
await p.goto(`http://localhost:${port}/render.html`);
await p.waitForFunction('window.ready === true');
let n = 0;
for (const f of fs.readdirSync(pdfDir).filter((x) => x.endsWith('.pdf')).sort()) {
  const stem = f.replace('.pdf', '');
  if (fs.existsSync(path.join(outDir, `${stem}-1.png`))) continue;
  const pages = await p.evaluate((u) => window.renderPdf(u, 2), `/pdf/${f}`);
  pages.forEach((d, i) => fs.writeFileSync(path.join(outDir, `${stem}-${i + 1}.png`), Buffer.from(d.split(',')[1], 'base64')));
  n += pages.length;
}
console.log('rendered pages', n);
await b.close();
server.close();
