export type GGG_COLUMN = 'zivil' | 'schuld' | 'ausser' | 'exekution' | 'sicherung';

export const TABLE_GGG = [
  { limit: 100, zivil: 120, schuld: 10, ausser: 30, exekution: 10, sicherung: 30 },
  { limit: 500, zivil: 120, schuld: 20, ausser: 30, exekution: 20, sicherung: 30 },
  { limit: 1000, zivil: 120, schuld: 30, ausser: 30, exekution: 30, sicherung: 30 },
  { limit: 5000, zivil: 300, schuld: 50, ausser: 100, exekution: 50, sicherung: 50 },
  { limit: 10000, zivil: 500, schuld: 50, ausser: 100, exekution: 50, sicherung: 100 },
  { limit: 50000, zivil: 850, schuld: 90, ausser: 210, exekution: 90, sicherung: 200 },
  { limit: 100000, zivil: 2000, schuld: 90, ausser: 510, exekution: 170, sicherung: 400 },
  { limit: 500000, zivil: 4000, schuld: 170, ausser: 1000, exekution: 850, sicherung: 900 },
  { limit: 1000000, zivil: 5500, schuld: 340, ausser: 1900, exekution: 1700, sicherung: 1700 },
  { limit: 2000000, zivil: 7200, schuld: 850, ausser: 4500, exekution: 3400, sicherung: 3400 },
  { limit: 3000000, zivil: 9000, schuld: 850, ausser: 4500, exekution: 3400, sicherung: 3400 },
  { limit: 4000000, zivil: 10500, schuld: 850, ausser: 4500, exekution: 3400, sicherung: 5100 },
  { limit: 5000000, zivil: 12200, schuld: 850, ausser: 4500, exekution: 3400, sicherung: 5100 },
  { limit: 6000000, zivil: 14000, schuld: 850, ausser: 4500, exekution: 3400, sicherung: 7000 },
  { limit: 8000000, zivil: 16000, schuld: 850, ausser: 4500, exekution: 3400, sicherung: 7000 },
  { limit: 10000000, zivil: 17300, schuld: 850, ausser: 4500, exekution: 3400, sicherung: 8500 },
  { limit: Infinity, zivil: 19000, schuld: 850, ausser: 4500, exekution: 3400, sicherung: 8500 }
];

export const GGG_LABELS: Record<GGG_COLUMN, string> = {
  zivil: 'Zivilgerichtliches Verf. (Streitig)',
  schuld: 'Schuldentriebverfahren',
  ausser: 'Ausserstreitverfahren',
  exekution: 'Exekutionsverfahren',
  sicherung: 'Rechtssicherungs- / Rechtsöffnungsverf.'
};