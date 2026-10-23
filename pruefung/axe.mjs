// Barrierefreiheit mit axe (WCAG 2 A/AA und Best Practice), Handy und Computer,
// jeweils normal und mit reduzierter Bewegung. Danach Fokus-Reihenfolge per Tab.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { seiten, chrome, basis } from './seiten.mjs';

const axe = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const browser = await chromium.launch({ executablePath: chrome });
let verstoesse = 0;
for (const [w, touch] of [[375, true], [1280, false]]) {
  for (const bewegung of ['no-preference', 'reduce']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, hasTouch: touch, isMobile: touch, bypassCSP: true, reducedMotion: bewegung });
    for (const s of seiten) {
      const page = await ctx.newPage();
      if (touch) {
        const c = await ctx.newCDPSession(page);
        await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'hover', value: 'none' }, { name: 'pointer', value: 'coarse' }] });
      }
      await page.goto(basis + s, { waitUntil: 'networkidle' });
      // durchscrollen, damit alle Einblendungen fertig sind (sonst misst axe halbtransparente Texte)
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 40));
        }
        await new Promise((r) => setTimeout(r, 1200));
      });
      await page.addScriptTag({ content: axe });
      const r = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] })).violations
        .map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`));
      verstoesse += r.length;
      if (r.length) console.log(`${w} ${bewegung} ${s}\n  ${r.join('\n  ')}`);
      await page.close();
    }
    await ctx.close();
  }
}
console.log(verstoesse ? `axe: ${verstoesse} Verstöße` : `axe: keine Verstöße (${seiten.length} Seiten, Handy und Computer, normal und reduziert)`);

// Tastatur: Fokus muss sichtbar sein und in sinnvoller Reihenfolge laufen
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(basis + '/', { waitUntil: 'networkidle' });
const fokus = [];
let unsichtbar = 0;
for (let i = 0; i < 16; i++) {
  await page.keyboard.press('Tab');
  const f = await page.evaluate(() => {
    const e = document.activeElement;
    const c = getComputedStyle(e);
    const sichtbar = c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) >= 2;
    return { text: `${e.tagName} "${(e.textContent || '').trim().slice(0, 28)}"`, sichtbar };
  });
  if (!f.sichtbar) unsichtbar++;
  fokus.push(`${f.sichtbar ? '  ' : '! '}${f.text}`);
}
console.log('Tab-Reihenfolge Startseite:\n' + fokus.join('\n'));
console.log(unsichtbar ? `Fokus: ${unsichtbar} Elemente ohne sichtbaren Rahmen` : 'Fokus: überall sichtbar');

// Menü per Tastatur öffnen
await page.goto(basis + '/geschaeftskunden', { waitUntil: 'networkidle' });
for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
await page.keyboard.press('Enter');
const offen = await page.evaluate(() => document.querySelector('.menue').open);
console.log(`Menü mit Enter: ${offen ? 'öffnet' : 'öffnet NICHT'}`);
await browser.close();
process.exitCode = verstoesse || unsichtbar || !offen ? 1 : 0;
