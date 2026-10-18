export * from './tarife/tp1';
export * from './tarife/tp2';
export * from './tarife/tp3a';
export * from './tarife/tp3b';
export * from './tarife/tp3c';
export * from './tarife/tp5';
export * from './tarife/tp8';
export * from './tarife/gkg'; // Die neue Datei

import type { GKG_COLUMN } from './tarife/gkg';
import type { ServiceKind } from './calculator/types';

export type TarifPosten = 
  | 'TP1' | 'TP2' | 'TP3A' | 'TP3B' | 'TP3C' 
  | 'TP5' | 'TP5i' | 'TP6' | 'TP6i' | 'TP7' | 'TP7 1' | 'TP7 2' | 'TP7 3'
  | 'TP8' | 'TP8 1' | 'TP8 2' | 'TP9' | 'FIX'
  | 'TP4 I 1' | 'TP4 I 2 1.F' | 'TP4 I 2 2.F' | 'TP4 I 3a' | 'TP4 I 3b'
  | 'TP4 I 3c' | 'TP4 I 3d' | 'TP4 I 4' | 'TP4 I 5'
  | 'TP4 II 1' | 'TP4 II 2 1.F' | 'TP4 II 2 2.F' | 'TP4 II 3a' | 'TP4 II 3b'
  | 'TP4 II 3c' | 'TP4 II 3d' | 'TP4 II 4' | 'TP4 II 5';

export interface FeeStep {
  limit: number;
  fee: number;
}

export interface ActionItem {
  id: TarifPosten;
  label: string;
  description: string;
  keywords: string[];
  kind?: ServiceKind; // Suchtreffer setzt auch den Leistungstyp (SS / TS / OTS).
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

  // Tagsatzungen sind eigene Leistungen: ein Treffer setzt die Zeitberechnung
  // und fügt keine Gerichtsgebühr hinzu. Der Tarif bleibt bewusst auswählbar.
  ...(['TP2', 'TP3A', 'TP3B', 'TP3C'] as const).map(id => ({
    id, kind: 'TS' as const, label: `Tagsatzung / Verhandlung – ${id}`,
    description: 'Abrechnung nach Verhandlungsdauer',
    keywords: ['tagsatzung', 'tagsatzungen', 'verhandlung', 'verhandlungen', 'termin', 'hearing', 'ts'],
  })),
  { id: 'TP3A', kind: 'OTS', label: 'Offene Tagsatzung', description: 'Künftige Verhandlung mit Kostenszenarien',
    keywords: ['offene tagsatzung', 'tagsatzungen', 'verhandlung', 'termin', 'prognose', 'ots', 'pending hearing'] },

  // === Nebenleistungen ===
  { id: 'TP5', label: 'Einfaches Schreiben', description: 'TP 5 RATV', keywords: ['brief', 'schreiben', 'kurz'] },
  { id: 'TP6', label: 'Brief (Komplex)', description: 'TP 6 RATV', keywords: ['brief', 'schreiben', 'komplex'] },
  { id: 'TP8', label: 'Konferenz', description: 'TP 8 RATV', keywords: ['konferenz', 'besprechung'] },
  // Varianten entsprechen den getrennten Zeilen in LIE_T. „i“ = eigener Tarif,
  // damit dessen eigener Höchstbetrag und nicht der TP5-Höchstbetrag greift.
  { id: 'TP5i', label: 'Einfaches Schreiben (Variante i)', description: 'TP 5i – eigener Tarif', keywords: ['brief', 'schreiben'] },
  { id: 'TP6i', label: 'Komplexes Schreiben (Variante i)', description: 'TP 6i – eigener Tarif', keywords: ['brief', 'komplex'] },
  { id: 'TP7 1', label: 'Geschäft ausserhalb der Kanzlei – TP7 1', description: 'Je halbe Stunde', keywords: ['auswärts', 'wegzeit'] },
  { id: 'TP7 2', label: 'Geschäft ausserhalb der Kanzlei – TP7 2', description: 'Je halbe Stunde', keywords: ['auswärts', 'anwalt'] },
  { id: 'TP7 3', label: 'Geschäft ausserhalb der Kanzlei – TP7 3', description: 'Je halbe Stunde', keywords: ['auswärts'] },
  { id: 'TP8 1', label: 'Konferenz – TP8 1', description: 'Je halbe Stunde', keywords: ['konferenz'] },
  { id: 'TP8 2', label: 'Kurzbesprechung – TP8 2', description: 'Unter 10 Minuten, 40% des Konferenztarifs', keywords: ['konferenz', 'manuell'] },
  { id: 'TP9', label: 'Zeitversäumnis – TP9', description: 'LIE: 75 CHF je begonnene Stunde; Reisen und Voraussetzungen gesondert prüfen', keywords: ['reise', 'zeitversäumnis'] },
  { id: 'FIX', label: 'Pauschalhonorar', description: 'Freier Betrag', keywords: ['pauschale', 'fix', 'manuell'] },
  ...(['I', 'II'] as const).flatMap(group =>
    (['1', '2 1.F', '2 2.F', '3a', '3b', '3c', '3d', '4', '5'] as const).map(suffix => ({
      id: `TP4 ${group} ${suffix}` as TarifPosten,
      label: `${group === 'I' ? 'Privatanklage' : 'Privatbeteiligung'} – TP4 ${group} ${suffix}`,
      description: 'Strafverfahren – Delikt laut Aktvorgabe',
      keywords: ['strafverfahren', 'privatanklage', 'privatbeteiligung', 'tp4'],
    }))
  ),
];

export const TP_LABELS: Record<string, string> = {
  'TP1': 'TP 1', 'TP2': 'TP 2', 'TP3A': 'TP 3A', 'TP3B': 'TP 3B',
  'TP3C': 'TP 3C', 'TP5': 'TP 5', 'TP6': 'TP 6', 'TP7': 'TP 7',
  'TP8': 'TP 8', 'TP9': 'TP 9', 'TP5i': 'TP 5i', 'TP6i': 'TP 6i',
  'TP7 1': 'TP 7 Z 1', 'TP7 2': 'TP 7 Z 2', 'TP7 3': 'TP 7 Z 3',
  'TP8 1': 'TP 8 Z 1', 'TP8 2': 'TP 8 Z 2', 'FIX': 'Pauschalhonorar'
};
