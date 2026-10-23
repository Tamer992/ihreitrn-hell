// Bilder der 3D-Testseite: Einlauf nach dem Laden und Verformung beim Scrollen.
// Aufruf: node pruefung/3d-shots.mjs <zielordner> [basis-url]
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const ziel = process.argv[2] ?? 'pruefung/ergebnis/3d';
const basis = process.argv[3] ?? 'http://localhost:4371';
fs.mkdirSync(ziel, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const meldungen = [];

for (const [name, opt] of [
  ['computer', { viewport: { width: 1440, height: 900 } }],
  ['handy', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
]) {
  const s = await (await browser.newContext(opt)).newPage();
  s.on('console', (m) => ['error', 'warning'].includes(m.type()) && meldungen.push(`${name}: ${m.text()}`));
  s.on('pageerror', (e) => meldungen.push(`${name}: ${e.message}`));
  await s.goto(`${basis}/test/3d/`);
  for (const t of [400, 900, 2200]) {
    await s.waitForTimeout(t === 400 ? 400 : t === 900 ? 500 : 1300);
    await s.screenshot({ path: `${ziel}/${name}-zeit-${t}.png` });
  }
  const h = opt.viewport.height;
  for (const f of [0.15, 0.35, 0.6, 0.9]) {
    await s.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(h * f));
    await s.waitForTimeout(1500);
    await s.screenshot({ path: `${ziel}/${name}-scroll-${f}.png` });
  }
  const gl = await s.evaluate(() => document.documentElement.classList.contains('gl'));
  meldungen.push(`${name}: WebGL aktiv = ${gl}`);
}
await browser.close();
console.log(meldungen.join('\n'));
