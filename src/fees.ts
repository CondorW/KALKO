// Daten basierend auf FL-Rechtsanwaltstarif (RATG) & Verordnung (RATV)

export type TarifPosten = 
  | 'TP1' | 'TP2' | 'TP3A' | 'TP3B' | 'TP3C' 
  | 'TP5' | 'TP6' | 'TP7' | 'TP8' | 'TP9';

interface FeeStep { limit: number; fee: number; }

export interface SearchOption { id: TarifPosten; label: string; keywords: string[]; }

// Basis-Tabellen (bis 140k identisch für alle)
export const TABLE_TP1: FeeStep[] = [{ limit: 500, fee: 17 }, { limit: 1000, fee: 25 }, { limit: 1500, fee: 32 }, { limit: 2500, fee: 37 }, { limit: 5000, fee: 40 }, { limit: 10000, fee: 49 }, { limit: 15000, fee: 64 }, { limit: 25000, fee: 72 }, { limit: 50000, fee: 80 }, { limit: 75000, fee: 96 }, { limit: 100000, fee: 119 }, { limit: 140000, fee: 159 }];
export const TABLE_TP2: FeeStep[] = [{ limit: 500, fee: 80 }, { limit: 1000, fee: 119 }, { limit: 1500, fee: 159 }, { limit: 2500, fee: 175 }, { limit: 5000, fee: 198 }, { limit: 10000, fee: 238 }, { limit: 15000, fee: 317 }, { limit: 25000, fee: 357 }, { limit: 50000, fee: 396 }, { limit: 75000, fee: 476 }, { limit: 100000, fee: 594 }, { limit: 140000, fee: 792 }];
export const TABLE_TP3A: FeeStep[] = [{ limit: 500, fee: 159 }, { limit: 1000, fee: 238 }, { limit: 1500, fee: 317 }, { limit: 2500, fee: 349 }, { limit: 5000, fee: 396 }, { limit: 10000, fee: 476 }, { limit: 15000, fee: 634 }, { limit: 25000, fee: 713 }, { limit: 50000, fee: 792 }, { limit: 75000, fee: 951 }, { limit: 100000, fee: 1188 }, { limit: 140000, fee: 1584 }];
export const TABLE_TP3B: FeeStep[] = [{ limit: 500, fee: 198 }, { limit: 1000, fee: 297 }, { limit: 1500, fee: 396 }, { limit: 2500, fee: 436 }, { limit: 5000, fee: 495 }, { limit: 10000, fee: 594 }, { limit: 15000, fee: 792 }, { limit: 25000, fee: 891 }, { limit: 50000, fee: 990 }, { limit: 75000, fee: 1188 }, { limit: 100000, fee: 1485 }, { limit: 140000, fee: 1980 }];
export const TABLE_TP3C: FeeStep[] = [{ limit: 500, fee: 238 }, { limit: 1000, fee: 357 }, { limit: 1500, fee: 476 }, { limit: 2500, fee: 524 }, { limit: 5000, fee: 594 }, { limit: 10000, fee: 713 }, { limit: 15000, fee: 951 }, { limit: 25000, fee: 1070 }, { limit: 50000, fee: 1188 }, { limit: 75000, fee: 1426 }, { limit: 100000, fee: 1782 }, { limit: 140000, fee: 2376 }];
export const TABLE_TP5: FeeStep[] = [{ limit: 1000, fee: 8 }, { limit: 2500, fee: 10 }, { limit: 5000, fee: 12 }, { limit: 10000, fee: 17 }, { limit: 25000, fee: 33 }, { limit: 50000, fee: 50 }];
export const TABLE_TP8: FeeStep[] = [{ limit: 1000, fee: 30 }, { limit: 2500, fee: 45 }, { limit: 5000, fee: 53 }, { limit: 10000, fee: 75 }, { limit: 25000, fee: 135 }];

export const SEARCH_OPTIONS: SearchOption[] = [
  { id: 'TP1', label: 'TP 1: Einfache Eingaben / Insolvenz', keywords: ['anzeige', 'mitteilung', 'akteneinsicht', 'ansuchen', 'bestätigung', 'frist', 'kostenbestimmung', 'vollmacht', 'widerruf', 'kündigung', 'zurücknahme', 'verzicht', 'insolvenz', 'forderung'] },
  { id: 'TP2', label: 'TP 2: Mahnklage / Scheidung / Exekution', keywords: ['mahnklage', 'zahlbefehl', 'rechtsbot', 'saldoklage', 'darlehen', 'kaufpreis', 'mietzins', 'scheidung', 'ehe', 'rechtsöffnung', 'exekution', 'pfändung'] },
  { id: 'TP3A', label: 'TP 3A: Klage (Allgemein)', keywords: ['klage', 'zivil', 'prozess', 'leistungsklage', 'feststellung', 'schadenersatz', 'klagebeantwortung', 'streit', 'einstweilig', 'verfügung'] },
  { id: 'TP3B', label: 'TP 3B: Berufung / Rekurs', keywords: ['berufung', 'beschwerde', 'rekurs', 'obergericht'] },
  { id: 'TP3C', label: 'TP 3C: Revision an OGH', keywords: ['revision', 'oberster', 'ogh'] },
  { id: 'TP5', label: 'TP 5: Einfaches Schreiben', keywords: ['brief', 'schreiben', 'kurz', 'mitteilung', 'mahnung'] },
  { id: 'TP6', label: 'TP 6: Brief (Komplex)', keywords: ['brief', 'schreiben', 'komplex', 'gutachten'] },
  { id: 'TP7', label: 'TP 7: Auswärtsgeschäft (pro 30 min)', keywords: ['auswärts', 'befund', 'augen', 'verhandlung', 'tagfahrt'] },
  { id: 'TP8', label: 'TP 8: Konferenz/Tel (pro 30 min)', keywords: ['konferenz', 'telefon', 'besprechung', 'beratung'] },
  { id: 'TP9', label: 'TP 9: Reisezeit (pro Stunde)', keywords: ['reise', 'fahrt', 'wegzeit'] },
];

export const TP_LABELS: Record<string, string> = {
  'TP1': 'TP 1 (Eingabe)', 'TP2': 'TP 2 (Mahn/Exekution)', 'TP3A': 'TP 3A (Klage)', 'TP3B': 'TP 3B (Berufung)',
  'TP3C': 'TP 3C (Revision)', 'TP5': 'TP 5 (Brief einfach)', 'TP6': 'TP 6 (Brief komplex)', 'TP7': 'TP 7 (Auswärts)',
  'TP8': 'TP 8 (Konferenz)', 'TP9': 'TP 9 (Reisezeit)',
};