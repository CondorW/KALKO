import type { FeeStep } from '../fees';

// GGG Anhang (Gebührentabelle)
// Werte basieren exakt auf dem Upload GGG.xlsx

export interface GKGFeeStep {
  limit: number; // "über ... bis" -> wir nehmen den oberen Wert als Limit
  zivil: number; // Zivilgerichtliches Streitiges Verfahren
  schuld: number; // Schuldentriebverfahren
  ausserstreit: number; // Ausserstreitverfahren
  exekution: number; // Exekutionsverfahren
  sicherung: number; // Rechtssicherungs- und Rechtsöffnungsverfahren
}

export const TABLE_GKG: GKGFeeStep[] = [
  { limit: 100, zivil: 120, schuld: 10, ausserstreit: 10, exekution: 10, sicherung: 30 },
  { limit: 500, zivil: 120, schuld: 20, ausserstreit: 20, exekution: 20, sicherung: 30 },
  { limit: 1000, zivil: 120, schuld: 30, ausserstreit: 30, exekution: 30, sicherung: 30 },
  { limit: 5000, zivil: 300, schuld: 50, ausserstreit: 100, exekution: 50, sicherung: 50 },
  { limit: 10000, zivil: 500, schuld: 50, ausserstreit: 100, exekution: 50, sicherung: 100 },
  { limit: 50000, zivil: 850, schuld: 90, ausserstreit: 210, exekution: 90, sicherung: 200 },
  { limit: 100000, zivil: 2000, schuld: 90, ausserstreit: 510, exekution: 170, sicherung: 400 },
  { limit: 500000, zivil: 4000, schuld: 170, ausserstreit: 1000, exekution: 850, sicherung: 900 },
  { limit: 1000000, zivil: 5000, schuld: 340, ausserstreit: 1900, exekution: 1700, sicherung: 1700 },
  { limit: 2000000, zivil: 7200, schuld: 850, ausserstreit: 4500, exekution: 4000, sicherung: 4000 },
  // Alles darüber wird prozentual/linear berechnet gem. GGG Art 30 Abs 1 ("im Rahmen der Bemessungsgrundlagen")
  // Da die Tabelle im CSV hier endet, nehmen wir an, dass für höhere Werte der letzte Wert gilt oder eine Logik greift.
  // Üblicherweise steigen Gebühren linear weiter. Wir nutzen den letzten Wert als Fallback + Warnung oder Logik.
  // Für dieses MVP nehmen wir den max Wert der Tabelle für > 2 Mio, da keine %-Regel im Text war.
];

// Mapping für die Spalten
export type GKG_COLUMN = 'zivil' | 'schuld' | 'ausserstreit' | 'exekution' | 'sicherung';

export const GKG_LABELS: Record<GKG_COLUMN, string> = {
  'zivil': 'Zivilprozess (Streitig)',
  'schuld': 'Schuldentrieb (Mahn)',
  'ausserstreit': 'Ausserstreit',
  'exekution': 'Exekution',
  'sicherung': 'Rechtssicherung/Rechtsöffnung'
};