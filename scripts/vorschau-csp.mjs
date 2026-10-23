// Lokaler Vorschau-Server für den gebauten Ordner dist.
// Sendet exakt die Sicherheits-Kopfzeilen aus der nginx-Konfiguration der Live-Seite,
// damit CSP-Fehler schon lokal auffallen. Aufruf: node scripts/vorschau-csp.mjs [port] [conf]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const port = Number(process.argv[2] ?? 4371);
const conf = process.argv[3] ?? 'C:/Users/TK/Desktop/Webseite/server/ihreitrn.de.conf';
const wurzel = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', 'dist');

// add_header-Zeilen aus dem Block der eigentlichen Seite lesen (auskommentierte überspringen)
const kopfzeilen = {};
for (const zeile of fs.readFileSync(conf, 'utf8').split(/\r?\n/)) {
  const m = zeile.match(/^\s*add_header\s+([\w-]+)\s+"([^"]*)"/);
  if (m) kopfzeilen[m[1]] = m[2];
}

const typen = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

function finden(adresse) {
  const roh = decodeURIComponent(adresse.split('?')[0]);
  const ziel = path.join(wurzel, roh);
  if (!ziel.startsWith(wurzel)) return null;
  for (const k of [ziel, ziel + '.html', path.join(ziel, 'index.html')]) {
    if (fs.existsSync(k) && fs.statSync(k).isFile()) return k;
  }
  return null;
}

http.createServer((anfrage, antwort) => {
  for (const [n, w] of Object.entries(kopfzeilen)) antwort.setHeader(n, w);
  let datei = finden(anfrage.url);
  let status = 200;
  if (!datei) {
    status = 404;
    datei = path.join(wurzel, '404.html');
    if (!fs.existsSync(datei)) { antwort.writeHead(404); antwort.end('404'); return; }
  }
  const typ = typen[path.extname(datei)] ?? 'application/octet-stream';
  // wie nginx: Textdateien gzip-komprimiert, wenn der Browser es kann
  const packen = /text|javascript|json|svg|xml/.test(typ) && /gzip/.test(anfrage.headers['accept-encoding'] ?? '');
  // Zwischenspeicher wie die expires-Zeilen in der nginx-Konfiguration
  const endung = path.extname(datei);
  const speicher = endung === '.woff2' ? 'max-age=31536000' : /\.(css|js)$/.test(endung) ? 'max-age=2592000' : /\.(png|jpe?g|svg|ico|webp|avif)$/.test(endung) ? 'max-age=15552000' : 'no-cache';
  antwort.writeHead(status, { 'Content-Type': typ, 'Cache-Control': speicher, ...(packen ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}) });
  const strom = fs.createReadStream(datei);
  (packen ? strom.pipe(zlib.createGzip({ level: 6 })) : strom).pipe(antwort);
}).listen(port, () => console.log(`Vorschau mit Live-Kopfzeilen auf http://localhost:${port} (${Object.keys(kopfzeilen).length} Kopfzeilen)`));
