import { 
  TABLE_TP1, TP1_STEP_INCREMENT, TP1_PCT_HIGH, TP1_PCT_SUPER_HIGH, TP1_CAP,
} from './tarife/tp1';
import { 
  TABLE_TP2, TP2_STEP_INCREMENT, TP2_PCT_HIGH, TP2_PCT_SUPER_HIGH, TP2_CAP,
} from './tarife/tp2';
import { 
  TABLE_TP3A, TP3A_STEP_INCREMENT, TP3A_PCT_HIGH, TP3A_PCT_SUPER_HIGH, TP3A_CAP,
} from './tarife/tp3a';
import { 
  TABLE_TP3B, TP3B_STEP_INCREMENT, TP3B_PCT_HIGH, TP3B_PCT_SUPER_HIGH, TP3B_CAP,
} from './tarife/tp3b';
import { 
  TABLE_TP3C, TP3C_STEP_INCREMENT, TP3C_PCT_HIGH, TP3C_PCT_SUPER_HIGH, TP3C_CAP,
} from './tarife/tp3c';
import { 
  TABLE_TP5, TP5_STEP_INCREMENT, TP5_CAP 
} from './tarife/tp5';
import { 
  TABLE_TP8, TP8_STEP_INCREMENT, TP8_CAP 
} from './tarife/tp8';

import { ACTION_ITEMS, TP_LABELS, type TarifPosten, type ActionItem } from './fees';

export { ACTION_ITEMS, TP_LABELS, type TarifPosten, type ActionItem };

const VAT_RATE = 0.081; // 8.1%
const GENOSSEN_SURCHARGE = 0.10; // 10%

// Art 23 Abs 4: EHS Sätze
const EHS_LOW = 0.50; // Bis 15k
const EHS_HIGH = 0.40; // Über 15k

export interface Position {
  id: string;
  label: string;
  description?: string; // Tooltip Text
  value: number;
  multiplier: number;
  type: TarifPosten;
  details: CalculationResult;
}

export interface CalculationResult {
  baseFee: number;
  unitRateAmount: number;
  surchargeAmount: number;
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
  config: {
    hasUnitRate: boolean;
    hasSurcharge: boolean;
    isForeign: boolean;
    isTimeBased: boolean;
    ehsLabel: string; // z.B. "50%"
  }
}

export function calculateFees(
  value: number,
  type: TarifPosten,
  multiplier: number = 1,
  hasUnitRate: boolean,
  hasSurcharge: boolean,
  isForeign: boolean
): CalculationResult {
  
  // 1. Basisgebühr (Einzeln)
  let singleUnitFee = getBaseFee(value, type);
  
  // Nebenleistungen & Zeit
  const isAncillary = ['TP5', 'TP6', 'TP7', 'TP8', 'TP9'].includes(type);
  const isTimeBased = ['TP7', 'TP8', 'TP9'].includes(type);

  // 2. Multiplikator (Menge/Zeit)
  let totalBase = singleUnitFee * multiplier;

  // 3. Einheitssatz (Art 23)
  let unitRateAmount = 0;
  let ehsPercentage = value <= 15000 ? EHS_LOW : EHS_HIGH;
  
  // Regel: TP 5, 6, 8 haben normalerweise keinen EHS (Art 23 Abs 2),
  // es sei denn, sie sind Hauptleistung (Art 23 Abs 5).
  // Wir nutzen hier den User-Input 'hasUnitRate' als Entscheidung.
  if (hasUnitRate) {
    unitRateAmount = totalBase * ehsPercentage;
  }

  // Zwischensumme für Genossenzuschlag
  // Art 15: Erhöhung der "Verdienstsumme einschliesslich Einheitssatz"
  const subTotalForSurcharge = totalBase + unitRateAmount;

  // 4. Genossenzuschlag
  let surchargeAmount = 0;
  if (hasSurcharge) {
    surchargeAmount = subTotalForSurcharge * GENOSSEN_SURCHARGE;
  }

  // 5. Summen
  const netTotal = totalBase + unitRateAmount + surchargeAmount;
  const vatAmount = isForeign ? 0 : (netTotal * VAT_RATE);
  const grossTotal = netTotal + vatAmount;

  return {
    baseFee: totalBase,
    unitRateAmount,
    surchargeAmount,
    netTotal,
    vatAmount,
    grossTotal,
    config: {
      hasUnitRate,
      hasSurcharge,
      isForeign,
      isTimeBased,
      ehsLabel: (ehsPercentage * 100).toFixed(0) + '%'
    }
  };
}

function getBaseFee(value: number, type: TarifPosten): number {
  switch (type) {
    case 'TP1': return getStandardFee(value, TABLE_TP1, TP1_STEP_INCREMENT, TP1_PCT_HIGH, TP1_PCT_SUPER_HIGH, TP1_CAP);
    case 'TP2': return getStandardFee(value, TABLE_TP2, TP2_STEP_INCREMENT, TP2_PCT_HIGH, TP2_PCT_SUPER_HIGH, TP2_CAP);
    case 'TP3A': return getStandardFee(value, TABLE_TP3A, TP3A_STEP_INCREMENT, TP3A_PCT_HIGH, TP3A_PCT_SUPER_HIGH, TP3A_CAP);
    case 'TP3B': return getStandardFee(value, TABLE_TP3B, TP3B_STEP_INCREMENT, TP3B_PCT_HIGH, TP3B_PCT_SUPER_HIGH, TP3B_CAP);
    case 'TP3C': return getStandardFee(value, TABLE_TP3C, TP3C_STEP_INCREMENT, TP3C_PCT_HIGH, TP3C_PCT_SUPER_HIGH, TP3C_CAP);
    
    // Nebenleistungen
    case 'TP5': return getScaledFee(value, TABLE_TP5, TP5_STEP_INCREMENT, TP5_CAP);
    
    case 'TP6': {
      // TP 6 ist doppelte TP 5, aber mit eigenem Cap (330)
      const baseTP5 = getScaledFee(value, TABLE_TP5, TP5_STEP_INCREMENT, Infinity); 
      return Math.min(baseTP5 * 2, 330);
    }
    
    case 'TP7': {
      // TP 7 Abs 2 (Anwalt): Doppelte von TP 6 Basis (also 4x TP 5 Basis), Max 440
      const baseTP5 = getScaledFee(value, TABLE_TP5, TP5_STEP_INCREMENT, Infinity);
      return Math.min(baseTP5 * 4, 440);
    }

    case 'TP8': return getScaledFee(value, TABLE_TP8, TP8_STEP_INCREMENT, TP8_CAP);
    
    case 'TP9': return 75; // Pauschal
    
    default: return 0;
  }
}

// Standard-Logik für TP 1, 2, 3
function getStandardFee(value: number, table: any[], stepInc: number, pctHigh: number, pctSuperHigh: number, maxCap: number): number {
  for (const step of table) {
    if (value <= step.limit) return step.fee;
  }
  const lastTableStep = table[table.length - 1];

  // Bis 500k: Lineare Schritte
  if (value <= 500000) {
    const excess = value - 140000;
    const steps = Math.ceil(excess / 20000);
    return lastTableStep.fee + (steps * stepInc);
  }

  // Bis 5 Mio: Promille 1
  const stepsTo500k = Math.ceil((500000 - 140000) / 20000);
  const feeAt500k = lastTableStep.fee + (stepsTo500k * stepInc);
  
  if (value <= 5000000) {
    const excess = value - 500000;
    // Achtung: pctHigh ist bereits der Dezimalwert (z.B. 0.001 für 1‰)
    const result = feeAt500k + (excess * pctHigh);
    return Math.min(result, maxCap);
  }

  // Über 5 Mio: Promille 2
  const feeAt5Mio = feeAt500k + (4500000 * pctHigh);
  const excess = value - 5000000;
  const result = feeAt5Mio + (excess * pctSuperHigh);
  
  return Math.min(result, maxCap);
}

// Skalierte Logik für TP 5, 8
function getScaledFee(value: number, table: any[], stepInc: number, maxCap: number): number {
  for (const step of table) {
    if (value <= step.limit) return step.fee;
  }
  const lastStep = table[table.length - 1];
  const excess = value - lastStep.limit;
  const steps = Math.ceil(excess / 20000);
  const calc = lastStep.fee + (steps * stepInc);
  return Math.min(calc, maxCap);
}

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('de-LI', { style: 'currency', currency: 'CHF' }).format(val);
}