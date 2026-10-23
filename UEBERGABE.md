# Übergabe: neue ihreitrn.de (Richtung Hell-Ruhig)

Stand 23.10.2026. Nichts ist live, nichts in `Desktop/Webseite` geändert, nichts hochgeladen.
Livegang erst nach Tamers ausdrücklicher Freigabe.

## Was fertig ist

- 9 Seiten: Start, Unternehmen (`/geschaeftskunden`), Privatkunden (`/leistungen`), Preise,
  Über mich, Kontakt, Impressum, Datenschutz, 404. Adressen wie auf der Live-Seite.
- Teilen-Bild (`/bilder/teilen.jpg`), `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`,
  `robots.txt`, Sitemap (`/sitemap-index.xml`), `llms.txt`.
- Prüfung: `npm run pruefen` (Build-Inhalt, 6 Breiten, Links, Konsole, CLS, Tippflächen,
  axe, Tastatur, Lighthouse). Stand 23.10.2026: alles bestanden, Lighthouse überall 100.

## Offene Platzhalter

| Wo | Was | Wer |
|---|---|---|
| Über mich, unter dem Porträt | `[FEHLT: Bildrechte Porträt]` | Tamer: Fotograf oder Studio fragen, schriftliche Erlaubnis für Website |
| Impressum, Bildnachweis | `[FEHLT: Bildrechte Porträt, Fotograf oder Studio]` | Tamer: Name des Fotografen oder Studios |

Ohne Erlaubnis: Porträt bis dahin herausnehmen (eine Zeile in `src/pages/ueber-mich.astro`).

## Was Tamer entscheiden oder liefern muss

1. **Bildrechte Porträt** (siehe oben).
2. **Menü:** Heute steckt es wie im Entwurf hinter „Menü“. Der Prompt sagte „kein
   verstecktes Menü am Computer“. Bleibt es so, oder sollen am Computer alle Seiten sichtbar
   in der Kopfzeile stehen?
3. **Server-Kopfzeilen:** heutige behalten oder den Vorschlag übernehmen (unten).
4. **Weg in den Upload** (unten): Empfehlung Weg A.
5. **Hosting:** Die Datenschutzerklärung nennt Hetzner. Zieht die Seite auf den Homeserver
   um, muss der Absatz „Hosting“ angepasst werden.

## Vorgeschlagene Server-Kopfzeilen

Datei `server/vorschlag-kopfzeilen.conf`. Ersetzt beim Livegang die `add_header`-Zeilen im
Block „3. Die eigentliche Seite“ der nginx-Konfiguration. Lokal getestet, keine Fehler
(Vorschau-Eintrag `ihreitrn-hell-vorschlag`, Port 4373).

- CSP ohne die zwei alten Prüfsummen und ohne `'unsafe-inline'` bei Stilen, `img-src 'self'`
  ohne `data:`, `connect-src 'none'`, `manifest-src 'none'`, `form-action 'none'`
- neu: `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`
- `Permissions-Policy` um payment, usb, serial, bluetooth, hid, browsing-topics ergänzt
- HSTS, nosniff, X-Frame-Options, Referrer-Policy wie heute

Die Seite läuft auch mit den heutigen Kopfzeilen fehlerfrei. Die Änderung ist ein Gewinn an
Sicherheit, keine Voraussetzung.

## Weg in den Upload

Die heutigen Skripte (`server/hochladen.ps1`, `server/hochladen.py`) laden den Ordner
`Desktop/Webseite` selbst hoch, abzüglich `upload-ausschluss.txt`, und ersetzen das
Webverzeichnis komplett. Hermes arbeitet über das Repo `homeserver` mit.

**Weg A (Empfehlung): Die neue Seite zieht ins bestehende Repo.**
Das Astro-Projekt wird Inhalt von `Desktop/Webseite` (Branch `neue-seite`, später `main`).
Die Upload-Skripte bauen zuerst (`npm run build`) und laden dann `dist/` hoch. Eine Quelle,
ein Repo, die Git-Sperre in den Skripten bleibt. Hermes braucht Node in der VM und baut vor
dem Hochladen.

**Weg B: Zwei Ordner.** `ihreitrn-hell` bleibt Quelle, das gebaute `dist/` wird jedes Mal
nach `Desktop/Webseite` kopiert. Weniger Umbau, aber zwei Stände, die auseinanderlaufen
können. Änderungen von Hermes am HTML gingen beim nächsten Kopieren verloren.

## Schritte für den Livegang (Weg A)

Erst nach Freigabe. Befehle am PC in PowerShell im Ordner `Desktop/Webseite`, außer anders
angegeben.

1. **Stand holen:** `git pull` (holt Hermes' Änderungen vom Homeserver).
2. **Sicherung:** `Desktop/Webseite-Sicherung-<Datum>.zip` vom ganzen Ordner, Archiv prüfen.
3. **Branch:** `git switch -c neue-seite`.
4. **Inhalt tauschen:** alte Seiten und `assets/` raus (bleiben in der Git-Geschichte), aus
   `ihreitrn-hell` übernehmen: `src/`, `public/`, `scripts/`, `pruefung/`, `astro.config.mjs`,
   `package.json`, `package-lock.json`, `.gitignore`. `flyer/` wandert nach `public/flyer/`,
   damit `/flyer/brief-unternehmen` weiter erreichbar bleibt. `server/`, `README.md` und
   `BILDNACHWEIS.md` bleiben und werden aktualisiert.
5. **Suchmaschinen freigeben:** in `src/daten.ts` `ENTWURF = false`.
6. **Upload-Skripte:** `hochladen.ps1` und `hochladen.py` führen `npm run build` aus und
   laden `dist/` hoch. Probelauf mit `-Pruefen` zeigt die Dateiliste.
7. **Prüfen:** `npm ci`, dann `npm run pruefen`. Alles muss „bestanden“ zeigen.
8. **Committen und pushen:** `git add -A`, `git commit -m "Neue Seite"`, `git switch main`,
   `git merge neue-seite`, `git push`. Ohne Push bricht das Upload-Skript ab (Absicht).
9. **Optional Kopfzeilen** (auf Hetzner, per SSH, einzeln): Zeilen in
   `/etc/nginx/sites-available/ihreitrn.de` ersetzen, `nginx -t`, `systemctl reload nginx`.
10. **Hochladen:** `.\server\hochladen.ps1 -Pruefen`, dann `.\server\hochladen.ps1`.
11. **Live prüfen:** alle Seiten am Handy und am Computer ansehen, `BASIS=https://ihreitrn.de`
    mit `pruefung/alle.mjs` und `pruefung/axe.mjs`. Teilen-Bild mit einem Link in WhatsApp testen.
12. **Google:** In der Search Console die neue Sitemap `sitemap-index.xml` einreichen (die
    alte hieß `sitemap.xml`).
13. **Hermes:** Skill `webseite-bearbeiten` in der VM anpassen: Node installieren, Texte in
    `src/pages/` und `src/daten.ts` statt im HTML, vor dem Hochladen `npm ci` und
    `npm run build`, neue Gestaltungsregeln (hell, Instrument Sans, Nachtblau nur ein Abschnitt
    pro Seite, Kabel-Grafik). In Telegram `/new` schicken, damit er es lädt.
14. **Vault:** `00 Kontext/Branding.md` auf die neue Seite umstellen, Projektnotiz und
    Tagesnotiz.

## Was beim Wechsel wegfällt

- Hell/Dunkel-Schalter, alte Fotos von Unsplash, alte Schriften (Space Grotesk, Inter,
  IBM Plex Mono, Schibsted Grotesk), `manifest.json`, die alte Adresse des Teilen-Bilds
  (`/assets/img/og-image-2026-08.jpg`). Wird das alte Teilen-Bild irgendwo verwendet (zum
  Beispiel im Google-Unternehmensprofil), dort das neue eintragen.

## Ordner und Werkzeuge

- `entwuerfe/`: Varianten A/B/C, 3D-Test, alte Stile. Wird nicht gebaut.
- `scripts/chrom/`: rendert die Chrom-Grafik neu (`node scripts/chrom/rendern.mjs`).
- `scripts/bilder/`: rendert Teilen-Bild und Symbole neu.
- `scripts/vorschau-csp.mjs`: Vorschau mit den Kopfzeilen der Live-Seite (Port 4371).
