// Feste Angaben, die auf mehreren Seiten stehen. Hier ändern, dann stimmt es überall.

export const ENTWURF = true; // solange true: noindex auf allen Seiten

export const telefon = { anzeige: '0152 07872002', link: 'tel:+4915207872002', international: '+49 152 07872002' };
export const whatsapp = 'https://wa.me/4915207872002';
export const post = { name: 'kontakt', bereich: 'ihreitrn.de' };

export const anschrift = {
  name: 'Tamer Kumaru',
  firma: 'Ihre IT Rhein-Neckar',
  strasse: 'Tilsiter Straße 30',
  plz: '69502',
  ort: 'Hemsbach',
};

export const menue = [
  { text: 'Start', href: '/' },
  { text: 'Unternehmen', href: '/geschaeftskunden' },
  { text: 'Privatkunden', href: '/leistungen' },
  { text: 'Preise', href: '/preise' },
  { text: 'Über mich', href: '/ueber-mich' },
  { text: 'Kontakt', href: '/kontakt' },
];

export const preise = {
  stunde: '69 €',
  viertel: '17,25 €',
  stundeBrutto: '82,11 €',
  wartung: '350 €',
};

export const anfahrt = [
  { zone: 'Hemsbach', betrag: '0 €', orte: 'Mein Standort, hier bin ich in wenigen Minuten.' },
  { zone: 'Bis 10 km', betrag: '10 €', orte: 'Zum Beispiel Weinheim, Heppenheim, Laudenbach, Hirschberg und Sulzbach.' },
  { zone: 'Bis 25 km', betrag: '15 €', orte: 'Zum Beispiel Bensheim, Viernheim, Mannheim, Heddesheim, Ladenburg und Schriesheim.' },
  { zone: 'Weiter weg', betrag: 'nach Absprache', orte: 'Im übrigen Rhein-Neckar-Kreis. Fragen Sie mich, wir finden eine Lösung.' },
];

export const orteSchema = ['Hemsbach', 'Weinheim', 'Laudenbach', 'Hirschberg', 'Heppenheim', 'Bensheim', 'Viernheim', 'Mannheim', 'Heddesheim', 'Schriesheim', 'Ladenburg', 'Ilvesheim', 'Edingen-Neckarhausen'];
