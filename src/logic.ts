import { TABLE_TP1, TP1_STEP_INCREMENT, TP1_PCT_HIGH, TP1_PCT_SUPER_HIGH, TP1_CAP } from './tarife/tp1';
import { TABLE_TP2, TP2_STEP_INCREMENT, TP2_PCT_HIGH, TP2_PCT_SUPER_HIGH, TP2_CAP } from './tarife/tp2';
import { TABLE_TP3A, TP3A_STEP_INCREMENT, TP3A_PCT_HIGH, TP3A_PCT_SUPER_HIGH, TP3A_CAP } from './tarife/tp3a';
import { TABLE_TP3B, TP3B_STEP_INCREMENT, TP3B_PCT_HIGH, TP3B_PCT_SUPER_HIGH, TP3B_CAP } from './tarife/tp3b';
import { TABLE_TP3C, TP3C_STEP_INCREMENT, TP3C_PCT_HIGH, TP3C_PCT_SUPER_HIGH, TP3C_CAP } from './tarife/tp3c';
import { TABLE_TP5, TP5_STEP_INCREMENT, TP5_CAP } from './tarife/tp5';
import { TABLE_TP8, TP8_STEP_INCREMENT, TP8_CAP } from './tarife/tp8';
import { TABLE_GGG, type GGG_COLUMN } from './tarife/ggg';

export type TarifPosten = 'TP1' | 'TP2' | 'TP3A' | 'TP3B' | 'TP3C' | 'TP4_U' | 'TP4_V' | 'TP5' | 'TP6' | 'TP7' | 'TP8' | 'TP9';
export type ExtendedTarifPosten = TarifPosten | 'BARAUSLAGE' | 'GGG' | 'TP2_Session' | 'TP3A_Session' | 'TP3B_Session' | 'TP3C_Session' | 'TP4_Session_U' | 'TP4_Session_V';

export const TP_LABELS: Record<string, string> = {
  'TP1': 'TP 1 (Kurze Mitteilung)',
  'TP2': 'TP 2 (Mahnklage / Exekution)',
  'TP3A': 'TP 3A (Klage / Schriftsatz)',
  'TP3B': 'TP 3B (Berufung / Rekurs)',
  'TP3C': 'TP 3C (Revision)',
  'TP4_U': 'TP 4 (Strafverfahren Übertretung)',
  'TP4_V': 'TP 4 (Strafverfahren Vergehen)',
  'TP5': 'TP 5 (Einfaches Schreiben)',
  'TP6': 'TP 6 (Ausführlicher Brief)',
  'TP7': 'TP 7 (Ausserhalb Kanzlei)',
  'TP8': 'TP 8 (Besprechung)',
  'TP9': 'TP 9 (Reisezeit)',
  'TP2_Session': 'TP 2 (Insolvenztagsatzung)',
  'TP3A_Session': 'TP 3A (Tagsatzung)',
  'TP3B_Session': 'TP 3B (Verhandlung 2. Instanz)',
  'TP3C_Session': 'TP 3C (Verhandlung OGH)',
  'TP4_Session_U': 'TP 4 (Hauptverhandlung Übertretung)',
  'TP4_Session_V': 'TP 4 (Hauptverhandlung Vergehen)',
  'BARAUSLAGE': 'Barauslage',
  'GGG': 'Gerichtsgebühr (GGG)'
};

export interface ExtendedActionItem {
  id: ExtendedTarifPosten;
  label: string;
  description: string;
  keywords: string[];
  gggColumn?: GGG_COLUMN;
}

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
  unitRateAmount: number;
  surchargeAmount: number;
  surchargeOnBase: number;
  surchargeOnEHS: number;
  positionNet: number; 
  totalEHS: number;    
  courtFee: number; 
  netTotal: number;    
  grossTotal: number;
  config: {
    hasUnitRate: boolean;
    streitgenossenCount: number; 
    surchargePercent: number;    
    isTimeBased: boolean;
    isExpense: boolean; 
    ehsLabel: string;
    courtFeeLabel?: string;
    hasInfoSurcharge: boolean; 
    isShortMeeting: boolean;
    isDoubleEHS: boolean;
  }
}

export interface ServiceGroup {
  id: string;
  label: string;
  items: ExtendedActionItem[];
}

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: 'TP1', label: 'TP 1: Kurze Schriftsätze & Mitteilungen',
    items: [
      { id: 'TP1', label: 'Kurze Mitteilung / Anzeige', description: 'Fristen, Tagsatzungen, Zustellungen, Akteneinsicht', keywords: ['frist', 'anzeige', 'akteneinsicht'] },
      { id: 'TP1', label: 'Kostenantrag / Vollmacht', description: 'Anträge auf Kostenbestimmung, Vollmachten', keywords: ['kosten', 'vollmacht'] }
    ]
  },
  {
    id: 'TP2', label: 'TP 2: Mahnklagen, Exekution & Kurze Tagsatzungen',
    items: [
      { id: 'TP2', label: 'Mahnklage / Rechtsöffnungsantrag', description: 'Zahlbefehl, Saldoklagen', keywords: ['mahnklage', 'rechtsöffnung', 'zahlbefehl'] },
      { id: 'TP2', label: 'Exekutionsantrag', description: 'Alle regulären Exekutionsanträge', keywords: ['exekution', 'pfändung'] },
      { id: 'TP2', label: 'Kurze Tagsatzung', description: 'Erste Tagsatzung, Versäumnisurteil, Vergleich', keywords: ['tagsatzung', 'vergleich', 'versäumnis'] },
      { id: 'TP2_Session', label: 'Tagsatzung Insolvenz', description: 'Verhandlung im Insolvenzverfahren (Abrechnung nach Stunden)', keywords: ['insolvenz', 'tagsatzung'] }
    ]
  },
  {
    id: 'TP3A', label: 'TP 3A: Zivilprozess (Klage & Beweisaufnahme)',
    items: [
      { id: 'TP3A', label: 'Klage / Klagebeantwortung', description: 'Ausführliche Klagen, Vorbereitende Schriftsätze', keywords: ['klage', 'beantwortung', 'schriftsatz'] },
      { id: 'TP3A', label: 'Einstweilige Verfügung', description: 'Antrag auf Sicherung', keywords: ['einstweilige', 'verfügung', 'sicherung'] },
      { id: 'TP3A_Session', label: 'Tagsatzung mit Beweisaufnahme', description: 'Ausführliche Verhandlung (Abrechnung nach Stunden)', keywords: ['tagsatzung', 'beweis', 'verhandlung'] }
    ]
  },
  {
    id: 'TP3B', label: 'TP 3B: Rechtsmittel (Berufung / Rekurs)',
    items: [
      { id: 'TP3B', label: 'Berufung / Beschwerde / Rekurs', description: 'Rechtsmittel zweiter Instanz', keywords: ['berufung', 'beschwerde', 'rekurs'] },
      { id: 'TP3B_Session', label: 'Verhandlung 2. Instanz', description: 'Mündliche Berufungsverhandlung (Abrechnung nach Stunden)', keywords: ['verhandlung', 'berufung'] }
    ]
  },
  {
    id: 'TP3C', label: 'TP 3C: Revision / Oberster Gerichtshof',
    items: [
      { id: 'TP3C', label: 'Revision / Revisionsbeantwortung', description: 'Rechtsmittel an den OGH', keywords: ['revision', 'ogh'] },
      { id: 'TP3C_Session', label: 'Verhandlung OGH', description: 'Mündliche Revisionsverhandlung (Abrechnung nach Stunden)', keywords: ['verhandlung', 'revision', 'ogh'] }
    ]
  },
  {
    id: 'TP4', label: 'TP 4: Strafverfahren (Privatanklage)',
    items: [
      { id: 'TP4_U', label: 'Anklage Übertretung', description: 'Schriftsätze Übertretung', keywords: ['straf', 'übertretung'] },
      { id: 'TP4_V', label: 'Anklage Vergehen', description: 'Schriftsätze Vergehen', keywords: ['straf', 'vergehen'] },
      { id: 'TP4_Session_U', label: 'Hauptverhandlung Übertretung', description: 'Abrechnung pro angefangene halbe Stunde', keywords: ['verhandlung', 'straf', 'übertretung'] },
      { id: 'TP4_Session_V', label: 'Hauptverhandlung Vergehen', description: 'Abrechnung pro angefangene halbe Stunde', keywords: ['verhandlung', 'straf', 'vergehen'] }
    ]
  },
  {
    id: 'TP5_6', label: 'TP 5 & 6: Briefe & Schreiben',
    items: [
      { id: 'TP5', label: 'Einfaches Schreiben (TP 5)', description: 'Mahnschreiben, kurze Berichte, Einladungen', keywords: ['brief', 'schreiben', 'mahnung'] },
      { id: 'TP6', label: 'Ausführlicher Brief (TP 6)', description: 'Briefe anderer Art, ohne Rechtsgutachten', keywords: ['brief', 'ausführlich'] }
    ]
  },
  {
    id: 'TP7_9', label: 'TP 7, 8 & 9: Besprechungen & Abwesenheiten',
    items: [
      { id: 'TP8', label: 'Besprechung / Telefonat (TP 8)', description: 'Besprechungen (pro angefangene halbe Stunde)', keywords: ['besprechung', 'telefon', 'konferenz'] },
      { id: 'TP7', label: 'Geschäfte ausserhalb Kanzlei (TP 7)', description: 'Behördengänge, Aktenstudium extern (pro halbe Stunde)', keywords: ['ausserhalb', 'behörde', 'aktenstudium'] },
      { id: 'TP9', label: 'Reisezeit / Zeitversäumnis (TP 9)', description: 'Wegzeit (pro Stunde)', keywords: ['reise', 'weg', 'zeit'] }
    ]
  },
  {
    id: 'EXP', label: 'Barauslagen & Gebühren',
    items: [
      { id: 'BARAUSLAGE', label: 'Barauslage', description: 'Manuelle Spesen und Barauslagen', keywords: ['spesen', 'auslage', 'porto'] },
      { id: 'GGG', label: 'Gerichtsgebühr (GGG)', description: 'Staatliche Gerichtsgebühren', keywords: ['ggg', 'gericht', 'gebühr'], gggColumn: 'zivil' }
    ]
  }
];

export const ACTION_ITEMS = SERVICE_GROUPS.flatMap(g => g.items);

export function calculateFees(
  value: number,
  type: ExtendedTarifPosten,
  gggColumn: GGG_COLUMN | undefined,
  isAppeal: boolean, 
  multiplier: number = 1,
  hasUnitRate: boolean,
  streitgenossenCount: number, 
  includeCourtFee: boolean,
  hasInfoSurcharge: boolean = false,
  isShortMeeting: boolean = false,
  isDoubleEHS: boolean = false
): CalculationResult {
  
  const safeValue = Math.max(0, value);
  const isExpense = type === 'BARAUSLAGE' || type === 'GGG';

  // --- Anwaltshonorar ---
  let totalBase = 0;
  
  if (!isExpense) {
    let singleUnitFee = 0;
    
    if (type === 'TP3A_Session' || type === 'TP3B_Session' || type === 'TP3C_Session' || type === 'TP2_Session') {
      const baseType = type.replace('_Session', '') as TarifPosten;
      singleUnitFee = getBaseFee(safeValue, baseType);
      const firstHour = singleUnitFee;
      const subsequentHours = Math.max(0, multiplier - 1) * (singleUnitFee * 0.5);
      totalBase = firstHour + subsequentHours;
      
    } 
    else if (type === 'TP4_Session_U' || type === 'TP4_Session_V') {
      const baseType = type.replace('_Session', '') as TarifPosten;
      singleUnitFee = getBaseFee(safeValue, baseType);
      totalBase = singleUnitFee * (multiplier + 1); 
      
    } else {
      singleUnitFee = getBaseFee(safeValue, type as TarifPosten);
      if (type === 'TP8' && isShortMeeting) {
        singleUnitFee = Math.min(singleUnitFee * 0.4, 240);
      }
      totalBase = singleUnitFee * multiplier;
    }

    if ((type === 'TP5' || type === 'TP6') && hasInfoSurcharge) {
      totalBase += (totalBase * 0.5);
    }
  } else if (type === 'BARAUSLAGE') {
    totalBase = safeValue; 
  }

  // --- Einheitssatz (EHS) ---
  let unitRateAmount = 0;
  let ehsPercentage = safeValue <= 15000 ? 0.50 : 0.40;
  
  if (hasUnitRate && !isExpense) {
    let ehsMultiplier = isDoubleEHS ? 2 : 1;
    unitRateAmount = totalBase * (ehsPercentage * ehsMultiplier);
  }

  // --- Genossenzuschlag (Art. 15 RATG) ---
  let surchargePercent = 0;
  let surchargeOnBase = 0;
  let surchargeOnEHS = 0;
  
  if (streitgenossenCount > 0 && !isExpense) {
    surchargePercent = Math.min(0.50, 0.10 + (streitgenossenCount - 1) * 0.05);
    surchargeOnBase = totalBase * surchargePercent;
    surchargeOnEHS = unitRateAmount * surchargePercent;
  }

  const surchargeAmount = surchargeOnBase + surchargeOnEHS;
  const positionNet = totalBase + surchargeOnBase;
  const totalEHS = unitRateAmount + surchargeOnEHS;

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

  const netTotal = positionNet + totalEHS; 
  const grossTotal = netTotal + courtFee; // MWST is handled globally now

  return {
    baseFee: totalBase,
    unitRateAmount,
    surchargeAmount,
    surchargeOnBase,
    surchargeOnEHS,
    positionNet,
    totalEHS,
    courtFee,
    netTotal,
    grossTotal,
    config: {
      hasUnitRate, 
      streitgenossenCount, 
      surchargePercent, 
      isTimeBased: ['TP7', 'TP8', 'TP9', 'TP2_Session', 'TP3A_Session', 'TP3B_Session', 'TP3C_Session', 'TP4_Session_U', 'TP4_Session_V'].includes(type as string),
      isExpense,
      ehsLabel: (ehsPercentage * (isDoubleEHS ? 2 : 1) * 100).toFixed(0) + '%',
      courtFeeLabel,
      hasInfoSurcharge,
      isShortMeeting,
      isDoubleEHS
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
    case 'TP4_U': return 150; 
    case 'TP4_V': return 375; 
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
  if (table.length === 0) return 0;
  
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