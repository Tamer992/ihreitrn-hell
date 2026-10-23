// npm run pruefen: baut die Seite, startet einen Prüf-Server mit den Kopfzeilen der Live-Seite
// und lässt alle Prüfungen nacheinander laufen. Am Ende eine Übersicht, bestanden oder nicht.
import { spawn, spawnSync } from 'node:child_process';

const port = 4381;
const basis = `http://localhost:${port}`;
const server = spawn(process.execPath, ['scripts/vorschau-csp.mjs', String(port)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

const schritte = [
  ['Build-Inhalt', 'pruefung/build.mjs'],
  ['Breiten, Links, Konsole', 'pruefung/alle.mjs'],
  ['CLS, Tippflächen, Bilder', 'pruefung/messen.mjs'],
  ['Barrierefreiheit und Tastatur', 'pruefung/axe.mjs'],
  ['Lighthouse', 'pruefung/lighthouse.mjs'],
];
const ergebnis = [];
for (const [name, skript] of schritte) {
  console.log(`\n=== ${name} ===`);
  const r = spawnSync(process.execPath, [skript], { stdio: 'inherit', env: { ...process.env, BASIS: basis } });
  ergebnis.push(`${r.status === 0 ? 'bestanden ' : 'NICHT      '} ${name}`);
}
server.kill();
console.log('\n=== Übersicht ===\n' + ergebnis.join('\n'));
process.exitCode = ergebnis.some((e) => e.startsWith('NICHT')) ? 1 : 0;
