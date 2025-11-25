import type { FeeStep } from '../fees';

// TP 3C: Revision
export const TABLE_TP3C: FeeStep[] = [
  { limit: 500, fee: 238 },
  { limit: 1000, fee: 357 },
  { limit: 1500, fee: 476 },
  { limit: 2500, fee: 524 },
  { limit: 5000, fee: 594 },
  { limit: 10000, fee: 713 },
  { limit: 15000, fee: 951 },
  { limit: 25000, fee: 1070 },
  { limit: 50000, fee: 1188 },
  { limit: 75000, fee: 1426 },
  { limit: 100000, fee: 1782 },
  { limit: 140000, fee: 2376 },
];

export const TP3C_STEP_INCREMENT = 238; // +238 Fr.

// Laut Text: 1,5 ‰ und 0,75 ‰
export const TP3C_PCT_HIGH = 0.0015; // 1,5 ‰
export const TP3C_PCT_SUPER_HIGH = 0.00075; // 0,75 ‰

export const TP3C_CAP = 64800;