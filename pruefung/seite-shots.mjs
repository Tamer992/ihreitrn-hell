// Ganzseiten-Bilder einer Seite: Computer (Maus) und Handy (Touch), plus Überlauf und Konsolenfehler.
// Aufruf: node pruefung/seite-shots.mjs <pfad> <zielordner> [basis-url]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const pfad = process.argv[2] ?? '/entwurf/nah/';
const ziel = process.argv[3] ?? 'pruefung/ergebnis/nah';
const basis = process.argv[4] ?? 'http://localhost:4371';
fs.mkdirSync(ziel, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const meldungen = [];
for (const [name, opt] of [
  ['computer', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }],
  ['handy', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce' }],
]) {
  const s = await (await browser.newContext(opt)).newPage();
  s.on('console', (m) => m.type() === 'error' && meldungen.push(`${name}: ${m.text()}`));
  s.on('response', (r) => r.status() >= 400 && meldungen.push(`${name}: ${r.status()} ${r.url()}`));
  await s.goto(basis + '/' + pfad.replace(/^\/+/, ''), { waitUntil: 'networkidle' });
  await s.waitForTimeout(400);
  await s.screenshot({ path: `${ziel}/${name}-oben.png` });
  const breite = await s.evaluate(() => document.documentElement.scrollWidth);
  if (breite > opt.viewport.width) meldungen.push(`${name}: Überlauf ${breite}px`);
  // Bildschirm für Bildschirm aufnehmen (Abschnitte in Bildschirmhöhe bleiben so echt)
  const hoehe = await s.evaluate(() => document.documentElement.scrollHeight);
  const vh = opt.viewport.height;
  let i = 0;
  for (let y = 0; y < hoehe; y += vh) {
    await s.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await s.waitForTimeout(250);
    await s.screenshot({ path: `${ziel}/${name}-teil-${String(i++).padStart(2, '0')}.png` });
  }
}
await browser.close();
console.log(meldungen.length ? meldungen.join('\n') : 'keine Fehler, kein Überlauf');
