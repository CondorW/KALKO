// GGG Anhang (Gebührentabelle)
// Quelle: RATG Rechner AUT-FL V4.2.0.xlsx, LIE_GGG!C3:H19.
// Die letzte Stufe gilt für Bemessungsgrundlagen über 10 Mio. CHF.

export interface GKGFeeStep {
  limit: number; // "über ... bis" -> wir nehmen den oberen Wert als Limit
  zivil: number; // Zivilgerichtliches Streitiges Verfahren
  schuld: number; // Schuldentriebverfahren
  ausserstreit: number; // Ausserstreitverfahren
  exekution: number; // Exekutionsverfahren
  sicherung: number; // Rechtssicherungs- und Rechtsöffnungsverfahren
}

export const TABLE_GKG: GKGFeeStep[] = [
  { limit: 100, zivil: 120, schuld: 10, ausserstreit: 30, exekution: 10, sicherung: 30 },
  { limit: 500, zivil: 120, schuld: 20, ausserstreit: 30, exekution: 20, sicherung: 30 },
  { limit: 1000, zivil: 120, schuld: 30, ausserstreit: 30, exekution: 30, sicherung: 30 },
  { limit: 5000, zivil: 300, schuld: 50, ausserstreit: 100, exekution: 50, sicherung: 50 },
  { limit: 10000, zivil: 500, schuld: 50, ausserstreit: 100, exekution: 50, sicherung: 100 },
  { limit: 50000, zivil: 850, schuld: 90, ausserstreit: 210, exekution: 90, sicherung: 200 },
  { limit: 100000, zivil: 2000, schuld: 90, ausserstreit: 510, exekution: 170, sicherung: 400 },
  { limit: 500000, zivil: 4000, schuld: 170, ausserstreit: 1000, exekution: 850, sicherung: 900 },
  { limit: 1000000, zivil: 5500, schuld: 340, ausserstreit: 1900, exekution: 1700, sicherung: 1700 },
  { limit: 2000000, zivil: 7000, schuld: 850, ausserstreit: 4500, exekution: 3400, sicherung: 3400 },
  { limit: 3000000, zivil: 9000, schuld: 850, ausserstreit: 4500, exekution: 3400, sicherung: 3400 },
  { limit: 4000000, zivil: 10500, schuld: 850, ausserstreit: 4500, exekution: 3400, sicherung: 5100 },
  { limit: 5000000, zivil: 12200, schuld: 850, ausserstreit: 4500, exekution: 3400, sicherung: 5100 },
  { limit: 6000000, zivil: 14000, schuld: 850, ausserstreit: 4500, exekution: 3400, sicherung: 7000 },
  { limit: 8000000, zivil: 16000, schuld: 850, ausserstreit: 4500, exekution: 3400, sicherung: 7000 },
  { limit: 10000000, zivil: 17300, schuld: 850, ausserstreit: 4500, exekution: 3400, sicherung: 8500 },
  { limit: Infinity, zivil: 19000, schuld: 850, ausserstreit: 4500, exekution: 3400, sicherung: 8500 },
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