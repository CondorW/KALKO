// Daten basierend auf FL-Rechtsanwaltstarif (RATG/Verordnung)

export type TarifPosten = 'TP2' | 'TP3A';

interface FeeStep {
  limit: number; // Bis zu diesem Streitwert
  fee: number;   // Gebühr
}

// Tarifpost 2 (Mahnverfahren, einfachere Verfahren)
export const TABLE_TP2: FeeStep[] = [
  { limit: 500, fee: 80 },
  { limit: 1000, fee: 119 },
  { limit: 1500, fee: 159 },
  { limit: 2500, fee: 175 },
  { limit: 5000, fee: 198 },
  { limit: 10000, fee: 238 },
  { limit: 15000, fee: 317 },
  { limit: 25000, fee: 357 },
  { limit: 50000, fee: 396 },
  { limit: 75000, fee: 476 },
  { limit: 100000, fee: 594 },
  { limit: 140000, fee: 792 },
];

// Tarifpost 3A (Zivilprozesse, Klagen)
export const TABLE_TP3A: FeeStep[] = [
  { limit: 500, fee: 159 },
  { limit: 1000, fee: 238 },
  { limit: 1500, fee: 317 },
  { limit: 2500, fee: 349 },
  { limit: 5000, fee: 396 },
  { limit: 10000, fee: 476 },
  { limit: 15000, fee: 634 },
  { limit: 25000, fee: 713 },
  { limit: 50000, fee: 792 },
  { limit: 75000, fee: 951 },
  { limit: 100000, fee: 1188 },
  { limit: 140000, fee: 1584 },
];

export const TP_LABELS = {
  'TP2': 'TP 2 (Mahnverfahren/Exekution)',
  'TP3A': 'TP 3A (Zivilprozess/Klage)'
};