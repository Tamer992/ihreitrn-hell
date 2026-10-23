// Bildfolge der 3D-Testseite (Laden, runter scrollen, wieder hoch), daraus ein animiertes WebP.
// Aufruf: node pruefung/3d-video.mjs <zielordner> [handy]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const ziel = process.argv[2] ?? 'pruefung/ergebnis/3d-video';
const handy = process.argv[3] === 'handy';
const [breite, hoehe] = handy ? [390, 844] : [1280, 800];
fs.rmSync(ziel, { recursive: true, force: true });
fs.mkdirSync(ziel, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const s = await (await browser.newContext({ viewport: { width: breite, height: hoehe }, isMobile: handy, hasTouch: handy, deviceScaleFactor: 1 })).newPage();
await s.goto('http://localhost:4371/test/3d/', { waitUntil: 'domcontentloaded' });
let n = 0;
const bild = async () => s.screenshot({ path: `${ziel}/${String(n++).padStart(4, '0')}.jpg`, quality: 70 });
const t0 = Date.now();
while (Date.now() - t0 < 2400) await bild();
const schritt = handy ? 14 : 20;
for (let i = 0; i < 34; i++) { await s.evaluate((d) => window.scrollBy({ top: d, behavior: 'instant' }), schritt); await bild(); }
for (let i = 0; i < 8; i++) await bild();
for (let i = 0; i < 34; i++) { await s.evaluate((d) => window.scrollBy({ top: -d, behavior: 'instant' }), schritt); await bild(); }
for (let i = 0; i < 10; i++) await bild();
await browser.close();
console.log(`${n} Bilder`);
