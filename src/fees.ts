export * from './tarife/tp1';
export * from './tarife/tp2';
export * from './tarife/tp3a';
export * from './tarife/tp3b';
export * from './tarife/tp3c';
export * from './tarife/tp5';
export * from './tarife/tp8';
export * from './tarife/gkg'; // Die neue Datei

import type { GKG_COLUMN } from './tarife/gkg';

export type TarifPosten = 
  | 'TP1' | 'TP2' | 'TP3A' | 'TP3B' | 'TP3C' 
  | 'TP5' | 'TP6' | 'TP7' | 'TP8' | 'TP9';

export interface FeeStep {
  limit: number;
  fee: number;
}

export interface ActionItem {
  id: TarifPosten;
  label: string;
  description: string;
  keywords: string[];
  gkgColumn?: GKG_COLUMN; // Standard GKG Spalte für diese Aktion
}

export const ACTION_ITEMS: ActionItem[] = [
  // === TP 1 ===
  { 
    id: 'TP1', label: 'Einfache Mitteilung', description: 'TP 1 Z I lit. a RATV', 
    keywords: ['anzeige', 'mitteilung', 'schreiben'], gkgColumn: 'zivil' 
  },
  { 
    id: 'TP1', label: 'Akteneinsicht', description: 'TP 1 Z I lit. b RATV', 
    keywords: ['akteneinsicht', 'auskunft'], gkgColumn: 'zivil'
  },
  
  // === TP 2 (Mahn/Schuld) ===
  { 
    id: 'TP2', label: 'Mahnklage / Zahlbefehl', description: 'TP 2 Z I Ziff. 1 lit. a RATV', 
    keywords: ['mahnklage', 'zahlbefehl'], gkgColumn: 'schuld' // GGG Spalte Schuldentrieb
  },
  { 
    id: 'TP2', label: 'Rechtsöffnung', description: 'TP 2 Z I Ziff. 1 lit. b RATV', 
    keywords: ['rechtsöffnung'], gkgColumn: 'sicherung' // GGG Spalte Sicherung
  },
  { 
    id: 'TP2', label: 'Scheidungsklage', description: 'TP 2 Z I Ziff. 1 lit. b RATV', 
    keywords: ['scheidung', 'ehe'], gkgColumn: 'zivil' // Scheidung ist Zivilstreitig
  },
  { 
    id: 'TP2', label: 'Exekutionsantrag', description: 'TP 2 Z I Ziff. 2 RATV', 
    keywords: ['exekution', 'pfändung'], gkgColumn: 'exekution' // GGG Spalte Exekution
  },

  // === TP 3A (Zivil) ===
  { 
    id: 'TP3A', label: 'Klage (Allgemein)', description: 'TP 3A Z I Ziff. 1 lit. a RATV', 
    keywords: ['klage', 'zivil', 'prozess', 'leistung'], gkgColumn: 'zivil'
  },
  { 
    id: 'TP3A', label: 'Einstweilige Verfügung', description: 'TP 3A Z I Ziff. 5 lit. a RATV', 
    keywords: ['einstweilig', 'verfügung'], gkgColumn: 'sicherung'
  },
  { 
    id: 'TP3A', label: 'Ausserstreit Antrag', description: 'TP 3A (Analogie)', 
    keywords: ['ausserstreit', 'verlassenschaft'], gkgColumn: 'ausserstreit'
  },

  // === TP 3B/C (Rechtsmittel) ===
  { 
    id: 'TP3B', label: 'Berufung', description: 'TP 3B Z I RATV', 
    keywords: ['berufung', 'obergericht'], gkgColumn: 'zivil' // GGG Basis Zivil (wird dann verdoppelt in Logic)
  },
  { 
    id: 'TP3C', label: 'Revision OGH', description: 'TP 3C Z I RATV', 
    keywords: ['revision', 'ogh'], gkgColumn: 'zivil'
  },

  // === Nebenleistungen ===
  { id: 'TP5', label: 'Einfaches Schreiben', description: 'TP 5 RATV', keywords: ['brief', 'schreiben', 'kurz'] },
  { id: 'TP6', label: 'Brief (Komplex)', description: 'TP 6 RATV', keywords: ['brief', 'schreiben', 'komplex'] },
  { id: 'TP8', label: 'Konferenz', description: 'TP 8 RATV', keywords: ['konferenz', 'besprechung'] },
];

export const TP_LABELS: Record<string, string> = {
  'TP1': 'TP 1', 'TP2': 'TP 2', 'TP3A': 'TP 3A', 'TP3B': 'TP 3B',
  'TP3C': 'TP 3C', 'TP5': 'TP 5', 'TP6': 'TP 6', 'TP7': 'TP 7',
  'TP8': 'TP 8', 'TP9': 'TP 9'
};