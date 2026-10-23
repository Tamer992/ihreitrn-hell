// Läuft im Seitenkopf: markiert, dass Skripte laufen. Ohne Skript ist alles sofort sichtbar.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Inhalte einblenden, sobald sie gut im Bild sind
  const elemente = document.querySelectorAll('[data-einblenden]');
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
  }

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
