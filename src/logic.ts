import { 
  TABLE_TP1, TABLE_TP2, TABLE_TP3A, TABLE_TP3B, TABLE_TP3C, TABLE_TP5, TABLE_TP8,
  SEARCH_OPTIONS, TP_LABELS, type TarifPosten, type SearchOption 
} from './fees';

export { SEARCH_OPTIONS, TP_LABELS, type TarifPosten, type SearchOption };

const VAT_RATE = 0.081; // 8.1% MwSt
const GENOSSEN_SURCHARGE = 0.10; // 10%

export interface Position {
  id: string;
  label: string;
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
  
  let singleUnitFee = getBaseFee(value, type);

  const isAncillary = ['TP5', 'TP6', 'TP7', 'TP8', 'TP9'].includes(type);
  const isTimeBased = ['TP7', 'TP8', 'TP9'].includes(type);

  let totalBase = singleUnitFee * multiplier;

  let unitRateAmount = 0;
  if (hasUnitRate) {
    const percentage = value <= 15000 ? 0.50 : 0.40;
    unitRateAmount = totalBase * percentage;
  }

  const subTotalForSurcharge = totalBase + unitRateAmount;

  let surchargeAmount = 0;
  if (hasSurcharge) {
    surchargeAmount = subTotalForSurcharge * GENOSSEN_SURCHARGE;
  }

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
      isTimeBased
    }
  };
}

function getBaseFee(value: number, type: TarifPosten): number {
  switch (type) {
    // --- NEBENLEISTUNGEN (Bleiben gedeckelt) ---
    case 'TP5': return getScaledFee(value, TABLE_TP5, 17, 100);
    case 'TP6': {
      const tp5Raw = getScaledFee(value, TABLE_TP5, 17, Infinity); 
      return Math.min(tp5Raw * 2, 330);
    }
    case 'TP7': {
      const tp7Raw = getScaledFee(value, TABLE_TP5, 17, Infinity);
      return Math.min(tp7Raw * 4, 440);
    }
    case 'TP8': return getScaledFee(value, TABLE_TP8, 15, 600);
    case 'TP9': return 75;

    // --- HAUPTVERFAHREN (Unbegrenzt skalierbar) ---
    
    case 'TP1': // Insolvenz
      // >500k: 0.1‰ (0.0001), >5M: 0.05‰ (0.00005)
      return getStandardFee(value, TABLE_TP1, 17, 0.0001, 0.00005, Infinity);

    case 'TP2': // Mahn / Scheidung
      // >500k: 0.5‰ (0.0005), >5M: 0.25‰ (0.00025)
      return getStandardFee(value, TABLE_TP2, 80, 0.0005, 0.00025, Infinity);

    case 'TP3A': // Klage (Standard)
      // >500k: 1% (0.01) -> ACHTUNG: Prozent, nicht Promille!
      // >5M: 0.5% (0.005) -> Prozent!
      // Kein Cap (Infinity)
      return getStandardFee(value, TABLE_TP3A, 159, 0.01, 0.005, Infinity);

    case 'TP3B': // Berufung
      // >500k: 1.25% (0.0125)
      // >5M: 0.625% (0.00625)
      return getStandardFee(value, TABLE_TP3B, 198, 0.0125, 0.00625, Infinity);

    case 'TP3C': // Revision
      // >500k: 1.5% (0.015)
      // >5M: 0.75% (0.0075)
      return getStandardFee(value, TABLE_TP3C, 238, 0.015, 0.0075, Infinity);

    default: return 0;
  }
}

function getStandardFee(value: number, table: any[], stepInc: number, pctHigh: number, pctSuperHigh: number, maxCap: number): number {
  // 1. Tabelle (bis 140k)
  for (const step of table) {
    if (value <= step.limit) return step.fee;
  }
  
  const lastTableStep = table[table.length - 1];

  // 2. Bis 500k (Lineare Schritte)
  if (value <= 500000) {
    const excess = value - 140000;
    const steps = Math.ceil(excess / 20000);
    return lastTableStep.fee + (steps * stepInc);
  }

  // 3. Bis 5 Mio (Prozentstufe 1)
  const stepsTo500k = Math.ceil((500000 - 140000) / 20000);
  const feeAt500k = lastTableStep.fee + (stepsTo500k * stepInc);
  
  if (value <= 5000000) {
    const excess = value - 500000;
    const result = feeAt500k + (excess * pctHigh);
    return Math.min(result, maxCap);
  }

  // 4. Über 5 Mio (Prozentstufe 2)
  const feeAt5Mio = feeAt500k + (4500000 * pctHigh);
  const excess = value - 5000000;
  const result = feeAt5Mio + (excess * pctSuperHigh);
  
  return Math.min(result, maxCap);
}

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