// Re-Export der Tarife
export * from './tarife/tp1';
export * from './tarife/tp2';
export * from './tarife/tp3a';
export * from './tarife/tp3b';
export * from './tarife/tp3c';
export * from './tarife/tp5';
export * from './tarife/tp8';

export type TarifPosten = 
  | 'TP1' | 'TP2' | 'TP3A' | 'TP3B' | 'TP3C' 
  | 'TP5' | 'TP6' | 'TP7' | 'TP8' | 'TP9';

export interface FeeStep {
  limit: number;
  fee: number;
}

export interface ActionItem {
  id: TarifPosten;
  label: string; // Was sieht der User (z.B. "Klage einbringen")
  description: string; // Mouseover Tooltip (z.B. "TP 3A Z 1 lit a RATV")
  keywords: string[]; // Für die Suche
}

// --- SEARCH MAPPING (Aktionen) ---
// Basiert auf Art. 1 RATV und deinem Text-Upload

export const ACTION_ITEMS: ActionItem[] = [
  // === TP 1 ===
  { 
    id: 'TP1', 
    label: 'Einfache Mitteilung an Gericht', 
    description: 'TP 1 Z I lit a RATV (Blosse Anzeigen/Mitteilungen)', 
    keywords: ['anzeige', 'mitteilung', 'gericht', 'schreiben'] 
  },
  { 
    id: 'TP1', 
    label: 'Ansuchen um Akteneinsicht/Auskunft', 
    description: 'TP 1 Z I lit b RATV', 
    keywords: ['akteneinsicht', 'auskunft', 'bestätigung', 'zeugnis', 'abschrift'] 
  },
  { 
    id: 'TP1', 
    label: 'Fristgesuch / Erstreckung', 
    description: 'TP 1 Z I lit c RATV', 
    keywords: ['frist', 'erstreckung', 'tagsatzung', 'verschiebung'] 
  },
  { 
    id: 'TP1', 
    label: 'Kostenbestimmungsantrag', 
    description: 'TP 1 Z I lit d RATV', 
    keywords: ['kosten', 'bestimmung', 'antrag'] 
  },
  { 
    id: 'TP1', 
    label: 'Insolvenz: Forderungsanmeldung', 
    description: 'TP 1 Z IV RATV', 
    keywords: ['insolvenz', 'forderung', 'konkurs', 'anmeldung'] 
  },

  // === TP 2 ===
  { 
    id: 'TP2', 
    label: 'Mahnklage / Zahlbefehl', 
    description: 'TP 2 Z I Ziff 1 lit a RATV', 
    keywords: ['mahnklage', 'zahlbefehl', 'klage', 'mahnung'] 
  },
  { 
    id: 'TP2', 
    label: 'Saldoklage / Darlehensklage', 
    description: 'TP 2 Z I Ziff 1 lit b RATV', 
    keywords: ['saldo', 'darlehen', 'kaufpreis', 'werklohn', 'geld'] 
  },
  { 
    id: 'TP2', 
    label: 'Mietzins-/Räumungsklage', 
    description: 'TP 2 Z I Ziff 1 lit b RATV (Bestandzins)', 
    keywords: ['miete', 'zins', 'räumung', 'bestand', 'wohnung'] 
  },
  { 
    id: 'TP2', 
    label: 'Scheidungsklage', 
    description: 'TP 2 Z I Ziff 1 lit b RATV (Art 75/92 EheG)', 
    keywords: ['scheidung', 'ehe', 'trennung'] 
  },
  { 
    id: 'TP2', 
    label: 'Exekutionsantrag', 
    description: 'TP 2 Z I Ziff 2 RATV', 
    keywords: ['exekution', 'pfändung', 'vollzug'] 
  },
  { 
    id: 'TP2', 
    label: 'Erste Tagsatzung (ohne Streit)', 
    description: 'TP 2 Z II Ziff 1 lit a RATV', 
    keywords: ['tagsatzung', 'verhandlung', 'erste'] 
  },

  // === TP 3A ===
  { 
    id: 'TP3A', 
    label: 'Klage (Allgemein)', 
    description: 'TP 3A Z I Ziff 1 lit a RATV (Soweit nicht TP2)', 
    keywords: ['klage', 'zivil', 'prozess', 'leistung', 'feststellung'] 
  },
  { 
    id: 'TP3A', 
    label: 'Klagebeantwortung', 
    description: 'TP 3A Z I Ziff 1 lit b RATV', 
    keywords: ['beantwortung', 'streit', 'antwort'] 
  },
  { 
    id: 'TP3A', 
    label: 'Vorbereitender Schriftsatz', 
    description: 'TP 3A Z I Ziff 1 lit d RATV', 
    keywords: ['schriftsatz', 'vorbereitung', 'eingabe'] 
  },
  { 
    id: 'TP3A', 
    label: 'Einstweilige Verfügung (Antrag)', 
    description: 'TP 3A Z I Ziff 5 lit a RATV', 
    keywords: ['einstweilig', 'verfügung', 'sicherung', 'provisorial'] 
  },
  { 
    id: 'TP3A', 
    label: 'Tagsatzung (Streitverhandlung)', 
    description: 'TP 3A Z II Ziff 1 RATV', 
    keywords: ['tagsatzung', 'verhandlung', 'streit'] 
  },

  // === TP 3B ===
  { 
    id: 'TP3B', 
    label: 'Berufung / Rekurs', 
    description: 'TP 3B Z I RATV', 
    keywords: ['berufung', 'rekurs', 'beschwerde', 'rechtsmittel', 'obergericht'] 
  },
  { 
    id: 'TP3B', 
    label: 'Berufungsverhandlung', 
    description: 'TP 3B Z II RATV (pro Stunde)', 
    keywords: ['verhandlung', 'berufung', 'mündlich'] 
  },

  // === TP 3C ===
  { 
    id: 'TP3C', 
    label: 'Revision an OGH', 
    description: 'TP 3C Z I RATV', 
    keywords: ['revision', 'ogh', 'oberster', 'gerichtshof'] 
  },

  // === Nebenleistungen ===
  { 
    id: 'TP5', 
    label: 'Einfaches Schreiben', 
    description: 'TP 5 RATV (Kurze Berichte, Mahnungen)', 
    keywords: ['brief', 'schreiben', 'email', 'kurz'] 
  },
  { 
    id: 'TP6', 
    label: 'Brief (Komplex)', 
    description: 'TP 6 RATV (Nicht einfache Schreiben)', 
    keywords: ['brief', 'schreiben', 'komplex', 'gutachten'] 
  },
  { 
    id: 'TP8', 
    label: 'Besprechung / Telefonat', 
    description: 'TP 8 RATV (Pro angefangene 30 min)', 
    keywords: ['konferenz', 'telefon', 'besprechung', 'tel'] 
  },
  { 
    id: 'TP7', 
    label: 'Auswärtsgeschäft', 
    description: 'TP 7 RATV (Befundaufnahme etc.)', 
    keywords: ['auswärts', 'lokalaugenschein', 'befund'] 
  },
  { 
    id: 'TP9', 
    label: 'Reisezeit', 
    description: 'TP 9 Z 4 RATV (Pro Stunde)', 
    keywords: ['reise', 'fahrt', 'weg'] 
  },
];

export const TP_LABELS: Record<string, string> = {
  'TP1': 'TP 1',
  'TP2': 'TP 2',
  'TP3A': 'TP 3A',
  'TP3B': 'TP 3B',
  'TP3C': 'TP 3C',
  'TP5': 'TP 5',
  'TP6': 'TP 6',
  'TP7': 'TP 7',
  'TP8': 'TP 8',
  'TP9': 'TP 9',
};