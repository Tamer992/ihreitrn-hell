// Rendert Chrom-Bänder als PNG. Aufruf: node scripts/chrom/baender-rendern.mjs <ziel> <b> <h> <art> <f1,f2,...|folge:N>
// Beispiel Bildfolge: node scripts/chrom/baender-rendern.mjs scripts/chrom/folge 1600 1000 hell folge:72
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [ziel = 'scripts/chrom/ausgabe', b = '1600', h = '1000', art = 'hell', liste = '0'] = process.argv.slice(2);
const werte = liste.startsWith('folge:')
  ? Array.from({ length: Number(liste.slice(6)) }, (_, i, a) => i / (a.length - 1))
  : liste.split(',').map(Number);
fs.mkdirSync(ziel, { recursive: true });

const wurzel = path.resolve('.');
const typ = { '.html': 'text/html', '.js': 'text/javascript' };
const server = http.createServer((a, r) => {
  const d = path.join(wurzel, decodeURIComponent(a.url.split('?')[0]));
  if (!d.startsWith(wurzel) || !fs.existsSync(d)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': typ[path.extname(d)] ?? 'application/octet-stream' });
  fs.createReadStream(d).pipe(r);
}).listen(4375);

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const s = await browser.newPage();
s.on('pageerror', (e) => console.log('Fehler', e.message));
for (const [i, f] of werte.entries()) {
  await s.goto(`http://localhost:4375/scripts/chrom/baender.html?b=${b}&h=${h}&art=${art}&f=${f.toFixed(4)}`);
  await s.waitForFunction(() => window.fertig, null, { timeout: 180000 });
  const url = await s.evaluate(() => window.fertig);
  fs.writeFileSync(path.join(ziel, `${art}-${String(i).padStart(3, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
}
await browser.close();
server.close();
console.log(`${werte.length} Bilder in ${ziel}`);
