import { TABLE_TP1, TP1_STEP_INCREMENT, TP1_PCT_HIGH, TP1_PCT_SUPER_HIGH, TP1_CAP } from './tarife/tp1';
import { TABLE_TP2, TP2_STEP_INCREMENT, TP2_PCT_HIGH, TP2_PCT_SUPER_HIGH, TP2_CAP } from './tarife/tp2';
import { TABLE_TP3A, TP3A_STEP_INCREMENT, TP3A_PCT_HIGH, TP3A_PCT_SUPER_HIGH, TP3A_CAP } from './tarife/tp3a';
import { TABLE_TP3B, TP3B_STEP_INCREMENT, TP3B_PCT_HIGH, TP3B_PCT_SUPER_HIGH, TP3B_CAP } from './tarife/tp3b';
import { TABLE_TP3C, TP3C_STEP_INCREMENT, TP3C_PCT_HIGH, TP3C_PCT_SUPER_HIGH, TP3C_CAP } from './tarife/tp3c';
import { TABLE_TP5, TP5_STEP_INCREMENT, TP5_CAP } from './tarife/tp5';
import { TABLE_TP8, TP8_STEP_INCREMENT, TP8_CAP } from './tarife/tp8';
import { TABLE_GGG, type GGG_COLUMN } from './tarife/ggg';

import { ACTION_ITEMS, TP_LABELS, type TarifPosten, type ActionItem } from './fees';

export { ACTION_ITEMS, TP_LABELS, type TarifPosten, type ActionItem };

export type ExtendedTarifPosten = TarifPosten | 'BARAUSLAGE' | 'GGG' | 'TP3A_Session';

export interface ExtendedActionItem {
  id: ExtendedTarifPosten;
  label: string;
  description: string;
  keywords: string[];
  gggColumn?: GGG_COLUMN;
}

const VAT_RATE = 0.081; 

export interface Position {
  id: string;
  date: string; 
  label: string;
  description?: string; 
  value: number;
  multiplier: number;
  type: ExtendedTarifPosten; 
  gggColumn?: GGG_COLUMN; 
  isAppeal?: boolean; 
  details: CalculationResult;
}

export interface CalculationResult {
  baseFee: number;
  surchargeAmount: number;
  courtFee: number; 
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
  config: {
    streitgenossenCount: number; 
    surchargePercent: number;    
    isForeign: boolean;
    isTimeBased: boolean;
    isExpense: boolean; 
    courtFeeLabel?: string;
    hasInfoSurcharge: boolean; 
    isShortMeeting: boolean;   
  }
}

export interface ServiceGroup {
  id: string;
  label: string;
  items: ExtendedActionItem[];
}

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: 'TP1', label: 'TP 1: Einfache Mitteilungen', 
    items: ACTION_ITEMS.filter(i => i.id === 'TP1') as ExtendedActionItem[]
  },
  {
    id: 'TP2', label: 'TP 2: Mahnklage / Exekution', 
    items: ACTION_ITEMS.filter(i => i.id === 'TP2') as ExtendedActionItem[]
  },
  {
    id: 'TP3', label: 'TP 3: Zivilprozess & Rechtsmittel', 
    items: ACTION_ITEMS.filter(i => i.id.startsWith('TP3')) as ExtendedActionItem[]
  },
  {
    id: 'TP5_8', label: 'TP 5-8: Nebenleistungen & Besprechungen', 
    items: ACTION_ITEMS.filter(i => ['TP5','TP6','TP7','TP8','TP9'].includes(i.id)) as ExtendedActionItem[]
  },
  {
    id: 'EXP', label: 'Barauslagen & Gebühren', 
    items: [
      { id: 'BARAUSLAGE', label: 'Barauslage', description: 'Manuelle Spesen und Barauslagen', keywords: ['spesen', 'auslage', 'porto'] },
      { id: 'GGG', label: 'Gerichtsgebühr (GGG)', description: 'Staatliche Gerichtsgebühren', keywords: ['ggg', 'gericht', 'gebühr'], gggColumn: 'zivil' }
    ]
  }
];

export function calculateFees(
  value: number,
  type: ExtendedTarifPosten,
  gggColumn: GGG_COLUMN | undefined,
  isAppeal: boolean, 
  multiplier: number = 1,
  streitgenossenCount: number, 
  isForeign: boolean,
  includeCourtFee: boolean,
  hasInfoSurcharge: boolean = false,
  isShortMeeting: boolean = false
): CalculationResult {
  
  const safeValue = Math.max(0, value);
  const isExpense = type === 'BARAUSLAGE' || type === 'GGG';

  // --- Anwaltshonorar ---
  let singleUnitFee = 0;
  
  if (!isExpense) {
    singleUnitFee = getBaseFee(safeValue, type as TarifPosten);
  } else if (type === 'BARAUSLAGE') {
    singleUnitFee = safeValue; 
  }

  if (type === 'TP8' && isShortMeeting) {
    singleUnitFee = Math.min(singleUnitFee * 0.4, 240);
  }

  let totalBase = singleUnitFee * multiplier;

  if ((type === 'TP5' || type === 'TP6') && hasInfoSurcharge) {
    totalBase += (totalBase * 0.5);
  }

  // --- Genossenzuschlag (Art. 15 RATG) ---
  let surchargeAmount = 0;
  let surchargePercent = 0;
  
  if (streitgenossenCount > 0 && !isExpense) {
    surchargePercent = Math.min(0.50, 0.10 + (streitgenossenCount - 1) * 0.05);
    surchargeAmount = totalBase * surchargePercent;
  }

  // --- Gerichtsgebühren (GGG) ---
  let courtFee = 0;
  let courtFeeLabel = "";
  
  if ((includeCourtFee || type === 'GGG') && gggColumn) {
    let baseGGG = 0;
    
    if (TABLE_GGG.length > 0) {
        const foundStep = TABLE_GGG.find(step => safeValue <= step.limit);
        if (foundStep) {
            baseGGG = foundStep[gggColumn];
        } else {
            baseGGG = TABLE_GGG[TABLE_GGG.length - 1][gggColumn];
        }
    }

    if (isAppeal) {
        if (gggColumn === 'schuld' || gggColumn === 'exekution') {
             if (safeValue <= 5000) { courtFee = baseGGG * 1; courtFeeLabel = "1.0x GGG"; }
             else if (safeValue <= 50000) { courtFee = baseGGG * 2.5; courtFeeLabel = "2.5x GGG"; }
             else { courtFee = baseGGG * 6; courtFeeLabel = "6.0x GGG"; }
        } else {
             courtFee = baseGGG * 2;
             courtFeeLabel = "2.0x GGG (Rechtsmittel)";
        }
    } else {
        courtFee = baseGGG;
        courtFeeLabel = "1.0x GGG";
    }
  }

  // --- Summen ---
  const netTotal = totalBase + surchargeAmount;
  
  let vatAmount = 0;
  if (!isForeign && !isExpense) {
    vatAmount = netTotal * VAT_RATE;
  }

  const grossTotal = netTotal + vatAmount + courtFee;

  return {
    baseFee: totalBase,
    surchargeAmount,
    courtFee,
    netTotal,
    vatAmount,
    grossTotal,
    config: {
      streitgenossenCount, 
      surchargePercent, 
      isForeign, 
      isTimeBased: ['TP7', 'TP8', 'TP9', 'TP3A_Session'].includes(type as string),
      isExpense,
      courtFeeLabel,
      hasInfoSurcharge,
      isShortMeeting
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
  for (const step of table) { 
    if (value <= step.limit) return step.fee; 
  }
  
  const lastTableStep = table[table.length - 1];

  if (value <= 500000) {
    const excess = value - 140000;
    const steps = Math.ceil(excess / 20000);
    return Math.min(lastTableStep.fee + (steps * stepInc), maxCap);
  }

  const stepsTo500k = Math.ceil((500000 - 140000) / 20000);
  const feeAt500k = lastTableStep.fee + (stepsTo500k * stepInc);
  
  if (value <= 5000000) {
    const excess = value - 500000;
    const result = feeAt500k + (excess * pctHigh);
    return Math.min(result, maxCap);
  }

  const feeAt5Mio = feeAt500k + (4500000 * pctHigh);
  const excess = value - 5000000;
  const result = feeAt5Mio + (excess * pctSuperHigh);
  
  return Math.min(result, maxCap);
}

function getScaledFee(value: number, table: any[], stepInc: number, maxCap: number): number {
  for (const step of table) { 
    if (value <= step.limit) return step.fee; 
  }
  
  if (table.length === 0) return 0; 

  const lastTableStep = table[table.length - 1];
  const excess = value - lastTableStep.limit;
  
  const steps = Math.ceil(excess / 20000);
  
  const calc = lastTableStep.fee + (steps * stepInc);
  
  return Math.min(calc, maxCap);
}

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('de-LI', { style: 'currency', currency: 'CHF' }).format(val);
}