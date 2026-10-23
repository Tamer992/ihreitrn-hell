// Pro Seite: CLS beim Laden und Durchscrollen, Tippflächen unter 44 px am Handy,
// Bilder ohne alt, unscharfe Bilder. Aufruf: node pruefung/messen.mjs
import { chromium } from 'playwright-core';
import { seiten, chrome, basis } from './seiten.mjs';

const browser = await chromium.launch({ executablePath: chrome });
const befunde = [];
for (const [w, h, touch] of [[375, 812, true], [1440, 900, false]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
  for (const s of seiten) {
    const page = await ctx.newPage();
    if (touch) {
      const c = await ctx.newCDPSession(page);
      await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'hover', value: 'none' }, { name: 'pointer', value: 'coarse' }] });
    }
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(basis + s, { waitUntil: 'load' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 50));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 1000));
    });
    const d = await page.evaluate((touch) => {
      const klein = !touch ? [] : [...document.querySelectorAll('a[href], button, summary')].filter((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        // Links mitten im Fließtext sind nach WCAG 2.5.8 ausgenommen
        const imText = el.tagName === 'A' && cs.display === 'inline' && el.closest('p, li, td');
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !imText && r.height < 44;
      }).map((el) => `${el.tagName} "${(el.textContent || '').trim().slice(0, 24)}" ${Math.round(el.getBoundingClientRect().height)}px`);
      const ohneAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length;
      // Bei srcset meldet naturalWidth die Größe geteilt durch die Bilddichte, deshalb die
      // tatsächlich geladene Breite aus dem passenden srcset-Eintrag nehmen
      const breiteVon = (i) => {
        const quellen = [i, ...(i.parentElement?.tagName === 'PICTURE' ? i.parentElement.querySelectorAll('source') : [])];
        for (const q of quellen) for (const teil of (q.srcset || q.getAttribute('srcset') || '').split(',')) {
          const [url, w] = teil.trim().split(/\s+/);
          if (url && i.currentSrc.endsWith(url) && w?.endsWith('w')) return parseInt(w, 10);
        }
        return i.naturalWidth;
      };
      const noetig = Math.min(window.devicePixelRatio, 2);
      const unscharf = [...document.querySelectorAll('img')]
        .filter((i) => i.clientWidth && breiteVon(i) < i.clientWidth * noetig * 0.95)
        .map((i) => `${i.currentSrc.split('/').pop()} ${breiteVon(i)}<${i.clientWidth}x${noetig}`);
      return { cls: window.__cls, klein, ohneAlt, unscharf };
    }, touch);
    if (d.cls > 0.001) befunde.push(`${w} ${s} CLS ${d.cls.toFixed(3)}`);
    if (d.klein.length) befunde.push(`${w} ${s} kleine Tippflächen: ${d.klein.slice(0, 4).join(', ')}`);
    if (d.ohneAlt) befunde.push(`${w} ${s} ${d.ohneAlt} Bilder ohne alt`);
    if (d.unscharf.length) befunde.push(`${w} ${s} unscharf: ${d.unscharf.join(', ')}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(befunde.length ? befunde.join('\n') : 'messen: CLS 0, Tippflächen ab 44 px, alle Bilder mit alt, keine unscharfen Bilder');
process.exitCode = befunde.length ? 1 : 0;
