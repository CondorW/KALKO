import { TABLE_TP1, TP1_STEP_INCREMENT, TP1_PCT_HIGH, TP1_PCT_SUPER_HIGH, TP1_CAP } from './tarife/tp1';
import { TABLE_TP2, TP2_STEP_INCREMENT, TP2_PCT_HIGH, TP2_PCT_SUPER_HIGH, TP2_CAP } from './tarife/tp2';
import { TABLE_TP3A, TP3A_STEP_INCREMENT, TP3A_PCT_HIGH, TP3A_PCT_SUPER_HIGH, TP3A_CAP } from './tarife/tp3a';
import { TABLE_TP3B, TP3B_STEP_INCREMENT, TP3B_PCT_HIGH, TP3B_PCT_SUPER_HIGH, TP3B_CAP } from './tarife/tp3b';
import { TABLE_TP3C, TP3C_STEP_INCREMENT, TP3C_PCT_HIGH, TP3C_PCT_SUPER_HIGH, TP3C_CAP } from './tarife/tp3c';
import { TABLE_TP5, TP5_STEP_INCREMENT, TP5_CAP } from './tarife/tp5';
import { TABLE_TP8, TP8_STEP_INCREMENT, TP8_CAP } from './tarife/tp8';
import { TABLE_GKG, type GKG_COLUMN } from './tarife/gkg';

import { 
  TP_LABELS, 
  ACTION_ITEMS, 
  SERVICE_GROUPS, 
  type TarifPosten, 
  type ActionItem, 
  type ServiceGroup 
} from './fees';

export { 
  TP_LABELS, 
  ACTION_ITEMS, 
  SERVICE_GROUPS, 
  type TarifPosten, 
  type ActionItem, 
  type ServiceGroup 
};

const VAT_RATE = 0.081; 
const GENOSSEN_SURCHARGE = 0.10;

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface Position {
  id: string;
  date: string; // NEU: Datum für die Leistung
  label: string;
  description?: string; 
  value: number;
  multiplier: number;
  type: TarifPosten;
  gkgColumn?: GKG_COLUMN; 
  isAppeal?: boolean; 
  details: CalculationResult;
}

export interface CalculationResult {
  baseFee: number;
  unitRateAmount: number;
  surchargeAmount: number;
  courtFee: number; 
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
  config: {
    hasUnitRate: boolean;
    hasSurcharge: boolean;
    isForeign: boolean;
    isTimeBased: boolean;
    isExpense: boolean; // NEU: Kennzeichen für Barauslagen
    ehsLabel: string;
    courtFeeLabel?: string;
  }
}

export function calculateFees(
  value: number,
  type: TarifPosten,
  gkgColumn: GKG_COLUMN | undefined,
  isAppeal: boolean, 
  multiplier: number = 1,
  hasUnitRate: boolean,
  hasSurcharge: boolean,
  isForeign: boolean,
  includeCourtFee: boolean
): CalculationResult {
  
  // Guard Clause für negative Werte (bei Barauslagen könnte negativ theoretisch Gutschrift sein, aber wir sperren es erstmal)
  if (value < 0) { // Allow 0
    return createZeroResult(type);
  }

  const safeValue = value;
  let totalBase = 0;
  let singleUnitFee = 0;

  // --- LOGIK WEICHE ---
  
  // FALL A: Reine Barauslage (Manuell)
  if (type === 'BARAUSLAGE') {
      // Bei Barauslage ist der "value" direkt der Preis
      totalBase = round(safeValue * multiplier);
      // Keine Einheitssätze, keine Zuschläge auf Spesen
      return {
          baseFee: totalBase,
          unitRateAmount: 0,
          surchargeAmount: 0,
          courtFee: 0,
          netTotal: totalBase,
          vatAmount: 0, // Annahme: Spesen oft steuerfrei durchlaufend oder Brutto eingegeben. User kann via "USt" Flag steuern.
          grossTotal: totalBase, // Wir rechnen MwSt unten drauf wenn gewünscht
          config: {
              hasUnitRate: false, hasSurcharge: false, isForeign,
              isTimeBased: false,
              isExpense: true,
              ehsLabel: '-',
              courtFeeLabel: ''
          }
      };
  }

  // FALL B: Gerichtsgebühr (GKG)
  if (type === 'GKG') {
      // Hier ist "value" der Streitwert, aus dem die Gebühr berechnet wird
      const gkgRes = calculateGKG(safeValue, gkgColumn || 'zivil', isAppeal);
      return {
          baseFee: 0, // GKG ist keine Anwaltsleistung
          unitRateAmount: 0,
          surchargeAmount: 0,
          courtFee: gkgRes.amount,
          netTotal: 0,
          vatAmount: 0, // Steuerfrei
          grossTotal: gkgRes.amount,
          config: {
              hasUnitRate: false, hasSurcharge: false, isForeign,
              isTimeBased: false,
              isExpense: true,
              ehsLabel: '-',
              courtFeeLabel: gkgRes.label
          }
      };
  }

  // FALL C: Anwaltsleistung (TP...)
  singleUnitFee = getBaseFee(safeValue, type);
  
  if (type === 'TP3A_Session') {
      const safeMultiplier = Math.max(0, multiplier);
      if (safeMultiplier > 0) {
          const startedHours = Math.ceil(safeMultiplier);
          const additionalHours = Math.max(0, startedHours - 1);
          const rawSessionFee = singleUnitFee + (singleUnitFee * 0.5 * additionalHours);
          totalBase = round(rawSessionFee); 
      }
  } else {
      totalBase = round(singleUnitFee * multiplier);
  }

  // Einheitssatz (EHS)
  let unitRateAmount = 0;
  let ehsPercentage = safeValue <= 15000 ? 0.50 : 0.40;
  
  if (hasUnitRate) { 
    unitRateAmount = round(totalBase * ehsPercentage); 
  }

  // Genossenzuschlag
  const subTotalForSurcharge = totalBase + unitRateAmount;
  let surchargeAmount = 0;
  
  if (hasSurcharge) { 
    surchargeAmount = round(subTotalForSurcharge * GENOSSEN_SURCHARGE); 
  }

  // Optionales GKG bei Anwaltsleistung (Legacy Support / Mixed Mode)
  let courtFee = 0;
  let courtFeeLabel = "";
  
  if (includeCourtFee && gkgColumn) {
      const gkgRes = calculateGKG(safeValue, gkgColumn, isAppeal);
      courtFee = gkgRes.amount;
      courtFeeLabel = gkgRes.label;
  }

  const netTotal = round(totalBase + unitRateAmount + surchargeAmount);
  const vatAmount = isForeign ? 0 : round(netTotal * VAT_RATE);
  const grossTotal = round(netTotal + vatAmount + courtFee);

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
      isTimeBased: ['TP7', 'TP8', 'TP9', 'TP3A_Session'].includes(type),
      isExpense: false,
      ehsLabel: (ehsPercentage * 100).toFixed(0) + '%',
      courtFeeLabel
    }
  };
}

// Helper für GKG Berechnung
function calculateGKG(value: number, column: GKG_COLUMN, isAppeal: boolean): { amount: number, label: string } {
    let base = 0;
    if (TABLE_GKG.length > 0) {
        const foundStep = TABLE_GKG.find(step => value <= step.limit);
        if (foundStep) base = foundStep[column];
        else base = TABLE_GKG[TABLE_GKG.length - 1][column];
    }

    let calculated = base;
    let label = "1.0x GGG";

    if (isAppeal) {
        if (column === 'schuld' || column === 'exekution') {
             if (value <= 5000) { calculated = base * 1; label = "1.0x GGG"; }
             else if (value <= 50000) { calculated = base * 2.5; label = "2.5x GGG"; }
             else { calculated = base * 6; label = "6.0x GGG"; }
        } else {
             calculated = base * 2;
             label = "2.0x GGG (Rechtsmittel)";
        }
    }
    return { amount: round(calculated), label };
}

function createZeroResult(type: TarifPosten): CalculationResult {
    return {
      baseFee: 0, unitRateAmount: 0, surchargeAmount: 0, courtFee: 0,
      netTotal: 0, vatAmount: 0, grossTotal: 0,
      config: {
        hasUnitRate: false, hasSurcharge: false, isForeign: false,
        isTimeBased: false, isExpense: false, ehsLabel: '0%', courtFeeLabel: ''
      }
    };
}

function getBaseFee(value: number, type: TarifPosten): number {
  switch (type) {
    case 'TP1': return getStandardFee(value, TABLE_TP1, TP1_STEP_INCREMENT, TP1_PCT_HIGH, TP1_PCT_SUPER_HIGH, TP1_CAP);
    case 'TP2': return getStandardFee(value, TABLE_TP2, TP2_STEP_INCREMENT, TP2_PCT_HIGH, TP2_PCT_SUPER_HIGH, TP2_CAP);
    case 'TP3A': return getStandardFee(value, TABLE_TP3A, TP3A_STEP_INCREMENT, TP3A_PCT_HIGH, TP3A_PCT_SUPER_HIGH, TP3A_CAP);
    case 'TP3A_Session': return getStandardFee(value, TABLE_TP3A, TP3A_STEP_INCREMENT, TP3A_PCT_HIGH, TP3A_PCT_SUPER_HIGH, TP3A_CAP);
    case 'TP3B': return getStandardFee(value, TABLE_TP3B, TP3B_STEP_INCREMENT, TP3B_PCT_HIGH, TP3B_PCT_SUPER_HIGH, TP3B_CAP);
    case 'TP3C': return getStandardFee(value, TABLE_TP3C, TP3C_STEP_INCREMENT, TP3C_PCT_HIGH, TP3C_PCT_SUPER_HIGH, TP3C_CAP);
    case 'TP5': return getScaledFee(value, TABLE_TP5, TP5_STEP_INCREMENT, TP5_CAP);
    case 'TP6': return Math.min(getScaledFee(value, TABLE_TP5, TP5_STEP_INCREMENT, TP5_CAP) * 2, 330);
    case 'TP7': return Math.min(getScaledFee(value, TABLE_TP5, TP5_STEP_INCREMENT, TP5_CAP) * 4, 440);
    case 'TP8': return getScaledFee(value, TABLE_TP8, TP8_STEP_INCREMENT, TP8_CAP);
    case 'TP9': return 75;
    default: return 0;
  }
}

function getStandardFee(value: number, table: any[], stepInc: number, pctHigh: number, pctSuperHigh: number, maxCap: number): number {
  for (const step of table) { if (value <= step.limit) return step.fee; }
  const last = table[table.length - 1];
  
  if (value <= 500000) {
    const steps = Math.ceil((value - 140000) / 20000);
    return Math.min(round(last.fee + (steps * stepInc)), maxCap);
  }
  const stepsTo500k = Math.ceil((500000 - 140000) / 20000);
  const feeAt500k = last.fee + (stepsTo500k * stepInc);
  
  if (value <= 5000000) {
    return Math.min(round(feeAt500k + ((value - 500000) * pctHigh)), maxCap);
  }
  const feeAt5Mio = feeAt500k + (4500000 * pctHigh);
  return Math.min(round(feeAt5Mio + ((value - 5000000) * pctSuperHigh)), maxCap);
}

function getScaledFee(value: number, table: any[], stepInc: number, maxCap: number): number {
  for (const step of table) { if (value <= step.limit) return step.fee; }
  if (table.length === 0) return 0;
  const last = table[table.length - 1];
  const steps = Math.ceil((value - last.limit) / 20000);
  return Math.min(round(last.fee + (steps * stepInc)), maxCap);
}

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('de-LI', { style: 'currency', currency: 'CHF' }).format(val);
}