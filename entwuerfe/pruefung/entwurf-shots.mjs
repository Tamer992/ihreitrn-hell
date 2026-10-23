// Screenshots der Entwurfs-Varianten: Computer (Maus) und Handy (Touch).
// Aufruf: node pruefung/entwurf-shots.mjs <zielordner> [basis-url]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const ziel = process.argv[2] ?? 'pruefung/ergebnis/entwurf';
const basis = process.argv[3] ?? 'http://localhost:4371';
fs.mkdirSync(ziel, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const fehler = [];

for (const art of ['a', 'b', 'c']) {
  const url = `${basis}/entwurf/${art}/`;

  const computer = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const s1 = await computer.newPage();
  s1.on('console', (m) => m.type() === 'error' && fehler.push(`${art} computer: ${m.text()}`));
  await s1.goto(url, { waitUntil: 'networkidle' });
  await s1.waitForTimeout(400);
  await s1.screenshot({ path: path.join(ziel, `${art}-computer-oben.png`) });
  await s1.screenshot({ path: path.join(ziel, `${art}-computer-ganz.png`), fullPage: true });
  const breiteC = await s1.evaluate(() => document.documentElement.scrollWidth);
  if (breiteC > 1440) fehler.push(`${art} computer: Überlauf ${breiteC}px`);
  await computer.close();

  // Handy: Touch-Erkennung, Fenster auf Seitenhöhe statt fullPage (sonst geht die Emulation verloren)
  const handy = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const s2 = await handy.newPage();
  s2.on('console', (m) => m.type() === 'error' && fehler.push(`${art} handy: ${m.text()}`));
  await s2.goto(url, { waitUntil: 'networkidle' });
  await s2.waitForTimeout(300);
  await s2.screenshot({ path: path.join(ziel, `${art}-handy-oben.png`) });
  const hoehe = await s2.evaluate(() => document.documentElement.scrollHeight);
  const breiteH = await s2.evaluate(() => document.documentElement.scrollWidth);
  if (breiteH > 390) fehler.push(`${art} handy: Überlauf ${breiteH}px`);
  await s2.setViewportSize({ width: 390, height: hoehe });
  await s2.waitForTimeout(300);
  await s2.screenshot({ path: path.join(ziel, `${art}-handy-ganz.png`) });
  await handy.close();
}

await browser.close();
console.log(fehler.length ? fehler.join('\n') : 'keine Konsolenfehler, kein Überlauf');
