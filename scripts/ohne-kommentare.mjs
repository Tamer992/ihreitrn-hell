// Nach dem Bauen: Kommentare aus den ausgelieferten Skripten entfernen (dist/js).
import { transform } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const ordner = path.resolve('dist/js');
if (fs.existsSync(ordner)) {
  for (const datei of fs.readdirSync(ordner).filter((d) => d.endsWith('.js'))) {
    const pfad = path.join(ordner, datei);
    const { code } = await transform(fs.readFileSync(pfad, 'utf8'), { loader: 'js', legalComments: 'none' });
    fs.writeFileSync(pfad, code);
  }
}
