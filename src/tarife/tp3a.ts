import type { FeeStep } from '../fees';

// TP 3A: Zivilprozess (Klage)
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

export const TP3A_STEP_INCREMENT = 159; // +159 Fr. je 20k

export const TP3A_PCT_HIGH = 0.001; // 1 ‰
export const TP3A_PCT_SUPER_HIGH = 0.0005; // 0,5 ‰

export const TP3A_CAP = 43200;