// Durchsucht dist nach allem, was nicht ausgeliefert werden darf.
import fs from 'node:fs';
import path from 'node:path';

const befunde = [];
const dateien = [];
function sammeln(ordner) {
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) sammeln(p);
    else dateien.push(p);
  }
}
sammeln('dist');

const verboten = [
  [/C:[\\/]+Users/i, 'lokaler Pfad'],
  [/kontakt@ihreitrn/i, 'E-Mail im Klartext'],
  [/<!--/, 'HTML-Kommentar'],
  [/\[ERGÄNZEN|TODO|FIXME/, 'Entwurfsnotiz'],
  [/sourceMappingURL/, 'Verweis auf Source-Map'],
  [/\son[a-z]+="/, 'Inline-Event-Handler'],
  [/\sstyle="/, 'style-Attribut'],
];

// Zusätzliche Wörter, die nie im Build stehen dürfen, liegen nur lokal in pruefung/verboten.txt
// (eine Zeile je Wort, nicht im Repo)
const liste = path.join('pruefung', 'verboten.txt');
if (fs.existsSync(liste)) {
  for (const wort of fs.readFileSync(liste, 'utf8').split('\n').map((z) => z.trim()).filter(Boolean)) {
    const sicher = wort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    verboten.push([new RegExp(sicher, 'i'), 'verbotenes Wort aus verboten.txt']);
  }
}

for (const d of dateien) {
  const name = path.relative('dist', d).replace(/\\/g, '/');
  if (/\.map$|\.env|\.md$/.test(name)) befunde.push(`${name}: darf nicht im Build liegen`);
  if (!/\.(html|css|js|txt|xml|svg|json)$/.test(name)) continue;
  const inhalt = fs.readFileSync(d, 'utf8');
  for (const [muster, was] of verboten) if (muster.test(inhalt)) befunde.push(`${name}: ${was}`);
  if (name.endsWith('.html')) {
    const inline = [...inhalt.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>/g)];
    if (inline.length) befunde.push(`${name}: ${inline.length} Inline-Skript(e)`);
  }
  if (name.endsWith('.js') && /\/\*|^\s*\/\//m.test(inhalt)) befunde.push(`${name}: Kommentar im Skript`);
}
console.log(befunde.length ? befunde.join('\n') : `build: ${dateien.length} Dateien sauber`);
process.exitCode = befunde.length ? 1 : 0;
