import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ihreitrn.de',
  // Adressen wie auf der Live-Seite: /preise statt /preise/ (nginx liefert preise.html aus)
  trailingSlash: 'never',
  build: {
    format: 'file',
    // Kein CSS im HTML, damit die Sicherheitsrichtlinie (CSP) streng bleiben kann
    inlineStylesheets: 'never',
  },
  integrations: [
    sitemap({
      filter: (seite) => !/\/(404|datenschutz|impressum)$/.test(seite),
      serialize: (eintrag) => ({ ...eintrag, lastmod: new Date().toISOString().slice(0, 10) }),
    }),
  ],
  vite: { build: { sourcemap: false } },
  devToolbar: { enabled: false },
});
