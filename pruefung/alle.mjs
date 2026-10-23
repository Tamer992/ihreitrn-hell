// Prüft alle Seiten: Überlauf und Wortbrüche in sechs Breiten, umbrechende Nummern,
// Konsolenfehler, fehlende Dateien und tote interne Links. Aufruf: node pruefung/alle.mjs [basis-url]
import { chromium } from 'playwright-core';
const basis = process.argv[2] ?? process.env.BASIS ?? 'http://localhost:4371';
const seiten = ['/', '/geschaeftskunden', '/leistungen', '/preise', '/ueber-mich', '/kontakt', '/impressum', '/datenschutz', '/gibt-es-nicht'];
const breiten = [320, 375, 768, 1024, 1440, 1920];
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const befunde = [];
const links = new Set();
for (const w of breiten) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, hasTouch: w < 1024, isMobile: w < 768, reducedMotion: 'reduce' });
  for (const pfad of seiten) {
    const s = await ctx.newPage();
    // Die Fehlerseite meldet ihren 404-Status absichtlich, das ist kein Fehler
    s.on('console', (m) => m.type() === 'error' && !(pfad === '/gibt-es-nicht' && /404/.test(m.text())) && befunde.push(`${w} ${pfad} Konsole: ${m.text()}`));
    s.on('response', (r) => r.status() >= 400 && !r.url().includes('gibt-es-nicht') && befunde.push(`${w} ${pfad} ${r.status()} ${r.url()}`));
    await s.goto(basis + pfad, { waitUntil: 'networkidle' });
    const r = await s.evaluate(() => {
      const sw = document.documentElement.scrollWidth, cw = document.documentElement.clientWidth;
      const zu = [...document.querySelectorAll('h1,h2,h3,p,a,li,th,td,summary')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow === 'visible').map((e) => e.textContent.trim().slice(0, 40));
      const nummern = [...document.querySelectorAll('.nummer')].filter((e) => e.offsetParent && e.getClientRects().length > 1).length;
      const hrefs = [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href'));
      return { sw, cw, zu, nummern, hrefs };
    });
    if (r.sw > r.cw) befunde.push(`${w} ${pfad} Überlauf ${r.sw} > ${r.cw}`);
    if (r.zu.length) befunde.push(`${w} ${pfad} zu breit: ${r.zu.slice(0, 3).join(' | ')}`);
    if (r.nummern) befunde.push(`${w} ${pfad} Nummer umgebrochen`);
    r.hrefs.forEach((h) => links.add(h.split('#')[0] || '/'));
    await s.close();
  }
  await ctx.close();
}
const s = await browser.newPage();
for (const l of links) {
  const antwort = await s.goto(basis + l);
  if (!antwort || antwort.status() >= 400) befunde.push(`toter Link ${l} (${antwort?.status()})`);
}
await browser.close();
console.log(befunde.length ? befunde.join('\n') : `ok: ${seiten.length} Seiten × ${breiten.length} Breiten, ${links.size} interne Links`);
