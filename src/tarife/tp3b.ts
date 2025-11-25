import type { FeeStep } from '../fees';

// TP 3B: Berufung
export const TABLE_TP3B: FeeStep[] = [
  { limit: 500, fee: 198 },
  { limit: 1000, fee: 297 },
  { limit: 1500, fee: 396 },
  { limit: 2500, fee: 436 },
  { limit: 5000, fee: 495 },
  { limit: 10000, fee: 594 },
  { limit: 15000, fee: 792 },
  { limit: 25000, fee: 891 },
  { limit: 50000, fee: 990 },
  { limit: 75000, fee: 1188 },
  { limit: 100000, fee: 1485 },
  { limit: 140000, fee: 1980 },
];

export const TP3B_STEP_INCREMENT = 198; // +198 Fr.

// Laut Text: 1,25 ‰ und 0,625 ‰
export const TP3B_PCT_HIGH = 0.00125; // 1,25 ‰
export const TP3B_PCT_SUPER_HIGH = 0.000625; // 0,625 ‰

export const TP3B_CAP = 54000;