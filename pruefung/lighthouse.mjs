// Lighthouse für alle Seiten, Handy (Standard-Drosselung) und Computer.
// Ziele: Leistung Handy ≥ 95, Computer 100, Barrierefreiheit 100, Best Practices 100.
// SEO wird nur angezeigt: solange noindex gesetzt ist, liegt es absichtlich niedriger.
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'node:fs';
import { seiten, chrome, basis } from './seiten.mjs';

const ziel = process.argv[2] ?? 'pruefung/ergebnis/lighthouse';
fs.mkdirSync(ziel, { recursive: true });
const browser = await chromeLauncher.launch({ chromePath: chrome, chromeFlags: ['--headless=new', '--no-first-run'] });
const zeilen = [];
let durchgefallen = 0;
for (const form of ['mobile', 'desktop']) {
  for (const s of seiten.filter((p) => p !== '/gibt-es-nicht')) {
    const einstellungen = form === 'desktop'
      ? { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } }
      : { formFactor: 'mobile' };
    const r = await lighthouse(basis + s, { port: browser.port, output: 'html', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] }, { extends: 'lighthouse:default', settings: einstellungen });
    const k = r.lhr.categories;
    const w = (x) => Math.round(x.score * 100);
    const leistung = w(k.performance);
    const ok = leistung >= (form === 'mobile' ? 95 : 100) && w(k.accessibility) === 100 && w(k['best-practices']) === 100;
    if (!ok) durchgefallen++;
    const a = r.lhr.audits;
    zeilen.push(`${ok ? '  ' : '! '}${form.padEnd(7)} ${s.padEnd(18)} Leistung ${String(leistung).padStart(3)}  Barrierefreiheit ${w(k.accessibility)}  Best Practices ${w(k['best-practices'])}  SEO ${w(k.seo)}  LCP ${a['largest-contentful-paint'].displayValue}  CLS ${a['cumulative-layout-shift'].displayValue}  TBT ${a['total-blocking-time'].displayValue}`);
    fs.writeFileSync(`${ziel}/${form}${s === '/' ? '-start' : s.replace(/\//g, '-')}.html`, r.report);
  }
}
await browser.kill();
console.log(zeilen.join('\n'));
console.log(durchgefallen ? `lighthouse: ${durchgefallen} Messungen unter dem Ziel` : 'lighthouse: alle Ziele erreicht');
process.exitCode = durchgefallen ? 1 : 0;
