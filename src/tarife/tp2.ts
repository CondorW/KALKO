import type { FeeStep } from '../fees';

// TP 2: Mahnverfahren / Exekution
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

export const TP2_STEP_INCREMENT = 80; // +80 Fr. je 20k

export const TP2_PCT_HIGH = 0.0005; // 0,5 ‰ (Promille)
export const TP2_PCT_SUPER_HIGH = 0.00025; // 0,25 ‰ (Promille) ab 5 Mio.

export const TP2_CAP = 7128;