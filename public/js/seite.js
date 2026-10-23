// Läuft im Seitenkopf: markiert, dass Skripte laufen. Ohne Skript ist alles sofort sichtbar.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Überschriften in Wörter zerlegen, damit sie Zeile für Zeile aufsteigen können
  const titel = ruhig ? [] : [...document.querySelectorAll('main h1, main h2')];
  titel.forEach(woerterTeilen);
  const zeilenZaehlen = () => titel.forEach((h) => {
    let oben = null, zeile = -1;
    h.querySelectorAll('.wort').forEach((w) => {
      if (w.offsetTop !== oben) { oben = w.offsetTop; zeile++; }
      w.style.setProperty('--zeile', zeile);
    });
  });
  zeilenZaehlen();
  document.fonts?.ready.then(zeilenZaehlen);
  let warten;
  window.addEventListener('resize', () => { clearTimeout(warten); warten = setTimeout(zeilenZaehlen, 200); });
  document.querySelectorAll('main h1').forEach((h) => h.classList.add('sichtbar'));

  // Inhalte und Haarlinien einblenden, sobald sie gut im Bild sind
  const elemente = document.querySelectorAll('[data-einblenden], .etikett, main h2:not([data-einblenden] h2)');
  if (ruhig || !('IntersectionObserver' in window)) {
    elemente.forEach((el) => el.classList.add('sichtbar'));
  } else {
    const beobachter = new IntersectionObserver((eintraege) => {
      for (const e of eintraege) {
        if (e.isIntersecting) {
          e.target.classList.add('sichtbar');
          beobachter.unobserve(e.target);
        }
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    elemente.forEach((el) => beobachter.observe(el));
    // Beim schnellen Springen (Ende-Taste, Sprunglink) nichts unsichtbar zurücklassen
    let offen = [...elemente];
    const nachholen = () => {
      offen = offen.filter((el) => {
        if (el.classList.contains('sichtbar')) return false;
        if (el.getBoundingClientRect().bottom > 0) return true;
        el.classList.add('sichtbar');
        beobachter.unobserve(el);
        return false;
      });
      if (!offen.length) window.removeEventListener('scroll', nachholen);
    };
    window.addEventListener('scroll', nachholen, { passive: true });
  }

  if (!ruhig) bildfolge(document.querySelector('[data-folge]'));

  // E-Mail-Adresse erst im Browser zusammensetzen, damit einfache Sammler sie nicht finden
  document.querySelectorAll('[data-post]').forEach((a) => {
    const adresse = `${a.dataset.post}@${a.dataset.bereich}`;
    a.href = `mailto:${adresse}`;
    a.textContent = adresse;
  });

  // Anrufleiste am Handy ausblenden, solange der Kontakt-Abschnitt im Bild ist
  const bereich = document.querySelector('[data-anrufbereich]');
  const leiste = document.querySelector('.anrufleiste');
  if (bereich && leiste && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      leiste.classList.toggle('anrufleiste--wartet', e.isIntersecting);
    }).observe(bereich);
  }
});

function woerterTeilen(h) {
  const knoten = [];
  const gang = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
  while (gang.nextNode()) knoten.push(gang.currentNode);
  knoten.forEach((k) => {
    const teile = k.textContent.split(/(\s+)/);
    const stueck = document.createDocumentFragment();
    teile.forEach((t) => {
      if (!t) return;
      if (/^\s+$/.test(t)) { stueck.append(t); return; }
      const wort = document.createElement('span');
      wort.className = 'wort';
      const innen = document.createElement('span');
      innen.textContent = t;
      wort.append(innen);
      stueck.append(wort);
    });
    k.replaceWith(stueck);
  });
}

// Startbild als Bildfolge: Beim Scrollen fächert sich das Kabel auf und verdrillt sich.
// Bild 0 gleicht dem Standbild, bis die Folge geladen ist, bleibt das Standbild sichtbar.
function bildfolge(start) {
  if (!start || navigator.connection?.saveData) return;
  const flaeche = start.querySelector('.start__folge');
  const handy = window.matchMedia('(max-width: 40em)').matches;
  const [b, h] = handy ? [800, 1200] : [1600, 1000];
  const anzahl = Number(start.dataset.bilder);
  const bilder = new Array(anzahl);
  flaeche.width = b;
  flaeche.height = h;
  start.classList.add('start--folge');
  const stift = flaeche.getContext('2d');
  let gezeigt = -1, geplant = false;

  const zeichnen = () => {
    geplant = false;
    if (!frei) return;
    const r = start.getBoundingClientRect();
    const weg = r.height - window.innerHeight;
    const anteil = Math.min(1, Math.max(0, -r.top / (weg || 1)));
    let i = Math.round(anteil * (anzahl - 1));
    while (i > 0 && !bilder[i]) i--;
    if (i === gezeigt || !bilder[i]) return;
    stift.clearRect(0, 0, b, h);
    stift.drawImage(bilder[i], 0, 0, b, h);
    gezeigt = i;
    flaeche.classList.add('start__folge--bereit');
  };
  const anfordern = () => { if (!geplant) { geplant = true; requestAnimationFrame(zeichnen); } };

  const laden = async () => {
    for (let i = 0; i < anzahl; i++) {
      const bild = new Image();
      bild.src = `${start.dataset.folge}${b}x${h}-${String(i).padStart(3, '0')}.webp`;
      try { await bild.decode(); bilder[i] = bild; } catch { return; }
      if (i === 0 || i === anzahl - 1) anfordern();
    }
  };
  // erst zeichnen, wenn das Standbild fertig hereingeglitten ist
  let frei = false;
  Promise.allSettled(start.querySelector('.start__bild img').getAnimations().map((a) => a.finished))
    .then(() => { frei = true; anfordern(); });
  window.addEventListener('scroll', anfordern, { passive: true });
  window.addEventListener('resize', anfordern);
  // Nachladen erst beim ersten Scrollen oder in einer Ruhepause nach dem Laden, damit der Seitenaufbau frei bleibt
  let gestartet = false;
  const los = () => {
    if (gestartet) return;
    gestartet = true;
    window.removeEventListener('scroll', los);
    laden();
  };
  window.addEventListener('scroll', los, { passive: true });
  const spaeter = () => setTimeout(() => (window.requestIdleCallback ?? setTimeout)(los), 2500);
  if (document.readyState === 'complete') spaeter();
  else window.addEventListener('load', spaeter, { once: true });
}
