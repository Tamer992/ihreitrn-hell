// Nur für die Vorschau auf GitHub Pages: Dort liegt die Seite unter einem Unterordner
// (z. B. /ihreitrn-hell/). Dieses Skript schreibt nach dem Bauen alle Verweise in dist um,
// die mit „/“ beginnen. Für den echten Server wird es nicht gebraucht.
// Aufruf: node scripts/unterpfad.mjs /ihreitrn-hell
import fs from 'node:fs';
import path from 'node:path';

const basis = (process.argv[2] ?? '').replace(/\/$/, '');
if (!basis.startsWith('/')) {
  console.log('Aufruf: node scripts/unterpfad.mjs /unterordner');
  process.exit(1);
}

const umschreiben = (url) => (url.startsWith('/') && !url.startsWith('//') && !url.startsWith(basis + '/') ? basis + url : url);

function dateien(ordner) {
  return fs.readdirSync(ordner, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(ordner, e.name);
    return e.isDirectory() ? dateien(p) : [p];
  });
}

let anzahl = 0;
for (const d of dateien('dist')) {
  if (d.endsWith('.html')) {
    let t = fs.readFileSync(d, 'utf8');
    t = t.replace(/\b(href|src)="([^"]*)"/g, (_, attr, url) => `${attr}="${umschreiben(url)}"`);
    t = t.replace(/\bsrcset="([^"]*)"/g, (_, liste) => `srcset="${liste.split(',').map((teil) => {
      const [url, ...rest] = teil.trim().split(/\s+/);
      return [umschreiben(url), ...rest].join(' ');
    }).join(', ')}"`);
    fs.writeFileSync(d, t);
    anzahl++;
  } else if (d.endsWith('.css')) {
    const t = fs.readFileSync(d, 'utf8').replace(/url\((['"]?)(\/[^)'"]*)\1\)/g, (_, q, url) => `url(${q}${umschreiben(url)}${q})`);
    fs.writeFileSync(d, t);
    anzahl++;
  }
}
console.log(`unterpfad: ${anzahl} Dateien auf ${basis}/ umgestellt`);
