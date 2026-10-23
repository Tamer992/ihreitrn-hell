// Fragen und Antworten: sichtbar als aufklappbare Liste und gleichlautend als strukturierte Daten
export interface Frage {
  frage: string;
  antwort: string[];
}

export function fragenDaten(liste: Frage[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: liste.map((f) => ({
      '@type': 'Question',
      name: f.frage,
      acceptedAnswer: { '@type': 'Answer', text: f.antwort.join(' ') },
    })),
  };
}
