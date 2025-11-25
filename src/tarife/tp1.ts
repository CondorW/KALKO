import type { FeeStep } from '../fees';

// TP 1: Einfache Schriftsätze / Insolvenzforderungen
// Werte exakt gemäß Excel/Text-Vorgabe
export const TABLE_TP1: FeeStep[] = [
  { limit: 500, fee: 17 },
  { limit: 1000, fee: 25 },
  { limit: 1500, fee: 32 },
  { limit: 2500, fee: 37 },
  { limit: 5000, fee: 40 },
  { limit: 10000, fee: 49 },
  { limit: 15000, fee: 64 },
  { limit: 25000, fee: 72 },
  { limit: 50000, fee: 80 },
  { limit: 75000, fee: 96 },
  { limit: 100000, fee: 119 },
  { limit: 140000, fee: 159 },
];

// Über 140.000 Fr. bis 500.000 Fr.
export const TP1_STEP_INCREMENT = 17; // +17 Fr. je angefangene 20.000

// Über 500.000 Fr.
export const TP1_PCT_HIGH = 0.0001; // 0,1 ‰ (Promille)
export const TP1_PCT_SUPER_HIGH = 0.00005; // 0,05 ‰ (Promille) ab 5 Mio.

// Maximalbetrag
export const TP1_CAP = 1426;