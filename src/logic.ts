import { TABLE_TP2, TABLE_TP3A, type TarifPosten } from './fees';

// Re-Export für die UI
export { TP_LABELS, type TarifPosten } from './fees';

// Konstanten
const VAT_RATE = 0.081; // 8.1% MwSt
const GENOSSEN_SURCHARGE = 0.10; // 10% Streitgenossenzuschlag

// Typ für eine einzelne berechnete Position in der Liste
export interface Position {
  id: string;
  label: string; // z.B. "Klage (TP 3A)"
  value: number; // Streitwert
  type: TarifPosten;
  details: CalculationResult; // Das Rechenergebnis dieser Zeile
}

export interface CalculationResult {
  baseFee: number;
  unitRateAmount: number; // EHS
  surchargeAmount: number; // Genossenzuschlag
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
  config: {
    hasUnitRate: boolean;
    hasSurcharge: boolean;
  }
}

export function calculateFees(
  value: number,
  type: TarifPosten,
  hasUnitRate: boolean,
  hasSurcharge: boolean
): CalculationResult {
  
  // 1. Basis-Honorar
  let baseFee = getBaseFee(value, type);

  // 2. Einheitssatz (EHS) - Art 23
  // 50% bis 15.000, danach 40%
  let unitRateAmount = 0;
  if (hasUnitRate) {
    const percentage = value <= 15000 ? 0.50 : 0.40;
    unitRateAmount = baseFee * percentage;
  }

  // Zwischensumme (Basis + EHS)
  const subTotalForSurcharge = baseFee + unitRateAmount;

  // 3. Genossenzuschlag
  let surchargeAmount = 0;
  if (hasSurcharge) {
    surchargeAmount = subTotalForSurcharge * GENOSSEN_SURCHARGE;
  }

  // 4. Summen
  const netTotal = baseFee + unitRateAmount + surchargeAmount;
  const vatAmount = netTotal * VAT_RATE;
  const grossTotal = netTotal + vatAmount;

  return {
    baseFee,
    unitRateAmount,
    surchargeAmount,
    netTotal,
    vatAmount,
    grossTotal,
    config: {
      hasUnitRate,
      hasSurcharge
    }
  };
}

function getBaseFee(value: number, type: TarifPosten): number {
  const table = type === 'TP2' ? TABLE_TP2 : TABLE_TP3A;
  
  // A. Werte innerhalb der Tabelle
  for (const step of table) {
    if (value <= step.limit) {
      return step.fee;
    }
  }

  // B. Werte über 140.000 bis 500.000 (Schritte)
  const stepIncrement = type === 'TP2' ? 80 : 159;
  
  if (value <= 500000) {
    const baseAt140k = table[table.length - 1].fee;
    const excess = value - 140000;
    const steps = Math.ceil(excess / 20000);
    return baseAt140k + (steps * stepIncrement);
  }

  // C. Werte über 500.000 (Prozentual)
  const baseAt140k = table[table.length - 1].fee;
  const stepsTo500k = Math.ceil((500000 - 140000) / 20000);
  const feeAt500k = baseAt140k + (stepsTo500k * stepIncrement);

  const excessOver500k = value - 500000;
  let percentSurcharge = 0;

  if (type === 'TP2') {
    percentSurcharge = excessOver500k * 0.005; // 0.5%
  } else {
    percentSurcharge = excessOver500k * 0.01; // 1.0%
  }
  
  return feeAt500k + percentSurcharge;
}

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('de-LI', { style: 'currency', currency: 'CHF' }).format(val);
}