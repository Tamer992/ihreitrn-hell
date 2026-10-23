// Startet einen kleinen Server auf dem Projektordner, rendert die Szene im Chrome und speichert PNGs.
// Aufruf: node scripts/chrom/rendern.mjs <zielordner>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const wurzel = path.resolve('.');
const ziel = process.argv[2] ?? 'scripts/chrom/ausgabe';
fs.mkdirSync(ziel, { recursive: true });
const typ = { '.html': 'text/html', '.js': 'text/javascript' };
const server = http.createServer((a, b) => {
  const datei = path.join(wurzel, decodeURIComponent(a.url.split('?')[0]));
  if (!datei.startsWith(wurzel) || !fs.existsSync(datei)) { b.writeHead(404); b.end(); return; }
  b.writeHead(200, { 'Content-Type': typ[path.extname(datei)] ?? 'application/octet-stream' });
  fs.createReadStream(datei).pipe(b);
}).listen(4372);

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [name, b, h, art] of [['hero', 2880, 1800, 'hero'], ['hero-handy', 1200, 1800, 'hero'], ['nacht', 2880, 1800, 'nacht']]) {
  const s = await browser.newPage();
  s.on('pageerror', (e) => console.log(name, e.message));
  await s.goto(`http://localhost:4372/scripts/chrom/szene.html?b=${b}&h=${h}&art=${art}`);
  await s.waitForFunction(() => window.fertig, null, { timeout: 120000 });
  const url = await s.evaluate(() => window.fertig);
  fs.writeFileSync(path.join(ziel, `${name}.png`), Buffer.from(url.split(',')[1], 'base64'));
  console.log(name, 'ok');
}
await browser.close();
server.close();
