// Erzeugt Teilen-Bild (og-image) und Symbole aus favicon.svg. Nur Werkzeug, wird nicht ausgeliefert.
// Aufruf im Projektordner: node scripts/bilder/rendern.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const wurzel = path.resolve('.');
const typ = { '.html': 'text/html', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer((a, b) => {
  const d = path.join(wurzel, decodeURIComponent(a.url.split('?')[0]));
  if (!d.startsWith(wurzel) || !fs.existsSync(d)) { b.writeHead(404); b.end(); return; }
  b.writeHead(200, { 'Content-Type': typ[path.extname(d)] ?? 'application/octet-stream' });
  fs.createReadStream(d).pipe(b);
}).listen(4374);

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const s = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await s.goto('http://localhost:4374/scripts/bilder/teilen.html', { waitUntil: 'networkidle' });
await s.evaluate(() => document.fonts.ready);
await s.screenshot({ path: 'public/bilder/teilen.jpg', type: 'jpeg', quality: 85 });

for (const [groesse, datei] of [[180, 'scripts/bilder/symbol-180.png'], [32, 'scripts/bilder/symbol-32.png'], [16, 'scripts/bilder/symbol-16.png']]) {
  const p = await browser.newPage({ viewport: { width: groesse, height: groesse } });
  await p.setContent(`<html><body style="margin:0"><img src="http://localhost:4374/public/favicon.svg" width="${groesse}" height="${groesse}"></body></html>`);
  await p.waitForLoadState('networkidle');
  await p.screenshot({ path: datei, omitBackground: true });
  await p.close();
}
await browser.close();
server.close();
console.log('fertig');
