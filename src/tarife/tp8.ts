import type { FeeStep } from '../fees';

// TP 8: Besprechungen (pro 30 min)
// Werte laut Text
export const TABLE_TP8: FeeStep[] = [
  { limit: 1000, fee: 30 },
  { limit: 2500, fee: 45 },
  { limit: 5000, fee: 53 },
  { limit: 10000, fee: 75 },
  { limit: 25000, fee: 135 },
];

// +15 Fr. je angefangene 20.000
export const TP8_STEP_INCREMENT = 15;
export const TP8_CAP = 600;