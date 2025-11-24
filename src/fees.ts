// Daten basierend auf FL-Rechtsanwaltstarif (RATG/Verordnung)

export type TarifPosten = 
  | 'TP1'   // Einfache Schriftsätze / Insolvenz
  | 'TP2'   // Mahnverfahren
  | 'TP3A'  // Klage
  | 'TP3B'  // Berufung
  | 'TP3C'  // Revision
  | 'TP5'   // Einfache Schreiben
  | 'TP6'   // Komplexe Briefe
  | 'TP7'   // Auswärtsgeschäfte (Zeit)
  | 'TP8'   // Konferenzen (Zeit)
  | 'TP9';  // Reisezeit (Zeit)

interface FeeStep {
  limit: number;
  fee: number;
}

// Such-Item Definition
export interface SearchOption {
  id: TarifPosten;
  label: string;
  keywords: string[];
}

// --- TABELLEN ---

// TP 1 (IV. Insolvenzforderungen / Basis für kleine Eingaben)
export const TABLE_TP1: FeeStep[] = [
  { limit: 500, fee: 17 }, { limit: 1000, fee: 25 }, { limit: 1500, fee: 32 },
  { limit: 2500, fee: 37 }, { limit: 5000, fee: 40 }, { limit: 10000, fee: 49 },
  { limit: 15000, fee: 64 }, { limit: 25000, fee: 72 }, { limit: 50000, fee: 80 },
  { limit: 75000, fee: 96 }, { limit: 100000, fee: 119 }, { limit: 140000, fee: 159 },
];

// TP 2 (Mahnverfahren, Exekution)
export const TABLE_TP2: FeeStep[] = [
  { limit: 500, fee: 80 }, { limit: 1000, fee: 119 }, { limit: 1500, fee: 159 },
  { limit: 2500, fee: 175 }, { limit: 5000, fee: 198 }, { limit: 10000, fee: 238 },
  { limit: 15000, fee: 317 }, { limit: 25000, fee: 357 }, { limit: 50000, fee: 396 },
  { limit: 75000, fee: 476 }, { limit: 100000, fee: 594 }, { limit: 140000, fee: 792 },
];

// TP 3A (Zivilprozess Basis)
export const TABLE_TP3A: FeeStep[] = [
  { limit: 500, fee: 159 }, { limit: 1000, fee: 238 }, { limit: 1500, fee: 317 },
  { limit: 2500, fee: 349 }, { limit: 5000, fee: 396 }, { limit: 10000, fee: 476 },
  { limit: 15000, fee: 634 }, { limit: 25000, fee: 713 }, { limit: 50000, fee: 792 },
  { limit: 75000, fee: 951 }, { limit: 100000, fee: 1188 }, { limit: 140000, fee: 1584 },
];

// TP 3B (Berufung)
export const TABLE_TP3B: FeeStep[] = [
  { limit: 500, fee: 198 }, { limit: 1000, fee: 297 }, { limit: 1500, fee: 396 },
  { limit: 2500, fee: 436 }, { limit: 5000, fee: 495 }, { limit: 10000, fee: 594 },
  { limit: 15000, fee: 792 }, { limit: 25000, fee: 891 }, { limit: 50000, fee: 990 },
  { limit: 75000, fee: 1188 }, { limit: 100000, fee: 1485 }, { limit: 140000, fee: 1980 },
];

// TP 3C (Revision)
export const TABLE_TP3C: FeeStep[] = [
  { limit: 500, fee: 238 }, { limit: 1000, fee: 357 }, { limit: 1500, fee: 476 },
  { limit: 2500, fee: 524 }, { limit: 5000, fee: 594 }, { limit: 10000, fee: 713 },
  { limit: 15000, fee: 951 }, { limit: 25000, fee: 1070 }, { limit: 50000, fee: 1188 },
  { limit: 75000, fee: 1426 }, { limit: 100000, fee: 1782 }, { limit: 140000, fee: 2376 },
];

// TP 5 (Einfache Schreiben)
export const TABLE_TP5: FeeStep[] = [
  { limit: 1000, fee: 8 }, { limit: 2500, fee: 10 }, { limit: 5000, fee: 12 },
  { limit: 10000, fee: 17 }, { limit: 25000, fee: 33 }, { limit: 50000, fee: 50 },
];

// TP 8 (Besprechungen pro halbe Stunde)
export const TABLE_TP8: FeeStep[] = [
  { limit: 1000, fee: 30 }, { limit: 2500, fee: 45 }, { limit: 5000, fee: 53 },
  { limit: 10000, fee: 75 }, { limit: 25000, fee: 135 },
];

// --- SUCHE ---

export const SEARCH_OPTIONS: SearchOption[] = [
  { 
    id: 'TP3A', 
    label: 'Klage / Zivilprozess (TP 3A)', 
    keywords: ['klage', 'zivil', 'tp3a', 'prozess', 'erst', 'schriftsatz'] 
  },
  { 
    id: 'TP3B', 
    label: 'Berufung (TP 3B)', 
    keywords: ['berufung', 'rechtsmittel', 'tp3b', 'obergericht'] 
  },
  { 
    id: 'TP3C', 
    label: 'Revision / OGH (TP 3C)', 
    keywords: ['revision', 'ogh', 'oberster', 'tp3c'] 
  },
  { 
    id: 'TP2', 
    label: 'Mahnklage / Exekution (TP 2)', 
    keywords: ['mahn', 'zahlbefehl', 'exekution', 'tp2', 'aufkündigung', 'rechtsöffnung'] 
  },
  { 
    id: 'TP1', 
    label: 'Einfache Eingaben / Insolvenz (TP 1)', 
    keywords: ['schrift', 'eingabe', 'tp1', 'anzeige', 'tag', 'insolvenz', 'forderung'] 
  },
  { 
    id: 'TP5', 
    label: 'Einfaches Schreiben (TP 5)', 
    keywords: ['brief', 'schreiben', 'bericht', 'tp5', 'mitteilung', 'mahnung'] 
  },
  { 
    id: 'TP6', 
    label: 'Brief anderer Art (TP 6)', 
    keywords: ['brief', 'schreiben', 'tp6', 'komplex', 'korrespondenz'] 
  },
  { 
    id: 'TP8', 
    label: 'Besprechung / Telefonat (TP 8)', 
    keywords: ['konferenz', 'telefon', 'besprechung', 'tp8', 'meeting', 'tel'] 
  },
  { 
    id: 'TP7', 
    label: 'Geschäft ausserhalb Kanzlei (TP 7)', 
    keywords: ['auswärts', 'reise', 'tp7', 'augen', 'befund', 'verhandlung'] 
  },
  { 
    id: 'TP9', 
    label: 'Reisezeit (TP 9)', 
    keywords: ['reise', 'fahrt', 'tp9', 'zeit'] 
  },
];

export const TP_LABELS: Record<string, string> = {
  'TP1': 'TP 1 (Eingabe)',
  'TP2': 'TP 2 (Mahn/Exekution)',
  'TP3A': 'TP 3A (Klage)',
  'TP3B': 'TP 3B (Berufung)',
  'TP3C': 'TP 3C (Revision)',
  'TP5': 'TP 5 (Schreiben einfach)',
  'TP6': 'TP 6 (Schreiben komplex)',
  'TP7': 'TP 7 (Auswärts)',
  'TP8': 'TP 8 (Konferenz)',
  'TP9': 'TP 9 (Reisezeit)',
};