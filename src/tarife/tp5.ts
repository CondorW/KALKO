import type { FeeStep } from '../fees';

// TP 5: Einfache Schreiben
// Werte laut Text
export const TABLE_TP5: FeeStep[] = [
  { limit: 1000, fee: 8 },
  { limit: 2500, fee: 10 },
  { limit: 5000, fee: 12 },
  { limit: 10000, fee: 17 },
  { limit: 25000, fee: 33 },
  { limit: 50000, fee: 50 },
];

// +17 Fr. je angefangene 20.000
export const TP5_STEP_INCREMENT = 17; 
export const TP5_CAP = 100;