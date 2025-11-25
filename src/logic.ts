import { TABLE_TP1, TP1_STEP_INCREMENT, TP1_PCT_HIGH, TP1_PCT_SUPER_HIGH, TP1_CAP } from './tarife/tp1';
import { TABLE_TP2, TP2_STEP_INCREMENT, TP2_PCT_HIGH, TP2_PCT_SUPER_HIGH, TP2_CAP } from './tarife/tp2';
import { TABLE_TP3A, TP3A_STEP_INCREMENT, TP3A_PCT_HIGH, TP3A_PCT_SUPER_HIGH, TP3A_CAP } from './tarife/tp3a';
import { TABLE_TP3B, TP3B_STEP_INCREMENT, TP3B_PCT_HIGH, TP3B_PCT_SUPER_HIGH, TP3B_CAP } from './tarife/tp3b';
import { TABLE_TP3C, TP3C_STEP_INCREMENT, TP3C_PCT_HIGH, TP3C_PCT_SUPER_HIGH, TP3C_CAP } from './tarife/tp3c';
import { TABLE_TP5, TP5_STEP_INCREMENT, TP5_CAP } from './tarife/tp5';
import { TABLE_TP8, TP8_STEP_INCREMENT, TP8_CAP } from './tarife/tp8';
import { TABLE_GKG, type GKG_COLUMN } from './tarife/gkg';

import { ACTION_ITEMS, TP_LABELS, type TarifPosten, type ActionItem } from './fees';

export { ACTION_ITEMS, TP_LABELS, type TarifPosten, type ActionItem };

const VAT_RATE = 0.081; 
const GENOSSEN_SURCHARGE = 0.10;

export interface Position {
  id: string;
  label: string;
  description?: string; 
  value: number;
  multiplier: number;
  type: TarifPosten;
  gkgColumn?: GKG_COLUMN; // Welches Verfahren (zivil, schuld, etc.)
  isAppeal?: boolean; // Ist es ein Rechtsmittel? (Für GKG x2)
  details: CalculationResult;
}

export interface CalculationResult {
  baseFee: number;
  unitRateAmount: number;
  surchargeAmount: number;
  courtFee: number; // Gerichtsgebühr
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
  config: {
    hasUnitRate: boolean;
    hasSurcharge: boolean;
    isForeign: boolean;
    isTimeBased: boolean;
    ehsLabel: string;
    courtFeeLabel?: string;
  }
}

export function calculateFees(
  value: number,
  type: TarifPosten,
  gkgColumn: GKG_COLUMN | undefined,
  isAppeal: boolean, // NEU: Trigger für doppelte GKG (Art 30 Abs 2)
  multiplier: number = 1,
  hasUnitRate: boolean,
  hasSurcharge: boolean,
  isForeign: boolean,
  includeCourtFee: boolean
): CalculationResult {
  
  // --- Anwaltshonorar ---
  let singleUnitFee = getBaseFee(value, type);
  let totalBase = singleUnitFee * multiplier;

  // --- Einheitssatz (EHS) ---
  let unitRateAmount = 0;
  // Art 23 Abs 4: 50% bis 15k, 40% drüber
  let ehsPercentage = value <= 15000 ? 0.50 : 0.40;
  
  if (hasUnitRate) {
    unitRateAmount = totalBase * ehsPercentage;
  }

  const subTotalForSurcharge = totalBase + unitRateAmount;

  // --- Genossenzuschlag ---
  let surchargeAmount = 0;
  if (hasSurcharge) {
    surchargeAmount = subTotalForSurcharge * GENOSSEN_SURCHARGE;
  }

  // --- Gerichtsgebühren (GKG) ---
  let courtFee = 0;
  let courtFeeLabel = "";
  
  if (includeCourtFee && gkgColumn) {
    // 1. Basis aus Tabelle holen
    let baseGKG = 0;
    
    // Finde den korrekten Schritt in der GKG Tabelle
    // Wir müssen sicherstellen, dass wir nicht undefined zugreifen, falls die Tabelle leer ist
    if (TABLE_GKG.length > 0) {
        // Fall 1: Wert innerhalb der Tabelle
        const foundStep = TABLE_GKG.find(step => value <= step.limit);
        
        if (foundStep) {
            baseGKG = foundStep[gkgColumn];
        } else {
            // Fall 2: Wert über der Tabelle -> Letzten Wert nehmen (oder Logik erweitern)
            // Laut GGG Art 30 Abs 1 "im Rahmen der Bemessungsgrundlagen".
            // Da wir nur eine Tabelle bis 2 Mio haben, nehmen wir den Max-Wert als Fallback.
            baseGKG = TABLE_GKG[TABLE_GKG.length - 1][gkgColumn];
        }
    }

    // 2. Multiplikatoren anwenden (Art 30 GGG)
    if (isAppeal) {
        // Art 30 Abs 2: Zweifache Gebühr für Berufungen/Revisionen
        // Art 30 Abs 3: Schuldentrieb Rechtsmittel (Staffelung) -> Das ist komplex, hier vereinfacht x2 für Standard Appeal
        // Für Schuldentrieb gibt es Sonderregeln (1x bis 5k, 2.5x bis 50k, 6x ab 50k)
        if (gkgColumn === 'schuld' || gkgColumn === 'exekution') {
             if (value <= 5000) { courtFee = baseGKG * 1; courtFeeLabel = "1.0x GKG"; }
             else if (value <= 50000) { courtFee = baseGKG * 2.5; courtFeeLabel = "2.5x GKG"; }
             else { courtFee = baseGKG * 6; courtFeeLabel = "6.0x GKG"; }
        } else {
             // Standard Zivil/Ausserstreit Rechtsmittel
             courtFee = baseGKG * 2;
             courtFeeLabel = "2.0x GKG (Rechtsmittel)";
        }
    } else {
        courtFee = baseGKG;
        courtFeeLabel = "1.0x GKG";
    }
  }

  // --- Summen ---
  const netTotal = totalBase + unitRateAmount + surchargeAmount;
  const vatAmount = isForeign ? 0 : (netTotal * VAT_RATE);
  // GKG ist steuerfrei durchlaufend
  const grossTotal = netTotal + vatAmount + courtFee;

  return {
    baseFee: totalBase,
    unitRateAmount,
    surchargeAmount,
    courtFee,
    netTotal,
    vatAmount,
    grossTotal,
    config: {
      hasUnitRate, hasSurcharge, isForeign, 
      isTimeBased: ['TP7', 'TP8', 'TP9'].includes(type),
      ehsLabel: (ehsPercentage * 100).toFixed(0) + '%',
      courtFeeLabel
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
    case 'TP5': return getScaledFee(value, TABLE_TP5, TP5_STEP_INCREMENT, TP5_CAP);
    case 'TP6': return Math.min(getScaledFee(value, TABLE_TP5, TP5_STEP_INCREMENT, Infinity) * 2, 330);
    case 'TP7': return Math.min(getScaledFee(value, TABLE_TP5, TP5_STEP_INCREMENT, Infinity) * 4, 440);
    case 'TP8': return getScaledFee(value, TABLE_TP8, TP8_STEP_INCREMENT, TP8_CAP);
    case 'TP9': return 75;
    default: return 0;
  }
}

function getStandardFee(value: number, table: any[], stepInc: number, pctHigh: number, pctSuperHigh: number, maxCap: number): number {
  // 1. Check Table Limits
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
  // 1. Check Table Limits
  for (const step of table) { 
    if (value <= step.limit) return step.fee; 
  }
  
  // 2. Calculate Excess if not found in table
  // We use the last step of the table as the base for calculation
  if (table.length === 0) return 0; // Safety check

  const lastTableStep = table[table.length - 1];
  const excess = value - lastTableStep.limit;
  
  // Calculate steps of 20,000
  const steps = Math.ceil(excess / 20000);
  
  // Base fee from table + increment per step
  const calc = lastTableStep.fee + (steps * stepInc);
  
  return Math.min(calc, maxCap);
}

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('de-LI', { style: 'currency', currency: 'CHF' }).format(val);
}