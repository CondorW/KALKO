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
  multiplier: number; // NEU: Anzahl (für Briefe) oder Dauer (für TP 7,8)
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
    isTimeBased: boolean; // Flag für UI Formatierung
  }
}

export function calculateFees(
  value: number,
  type: TarifPosten,
  multiplier: number = 1, // Standard 1
  hasUnitRate: boolean,
  hasSurcharge: boolean,
  isForeign: boolean
): CalculationResult {
  
  let baseFee = getBaseFee(value, type);

  // Sonderregeln für "Nebenleistungen" (Art. 23)
  // TP 5, 6, 8, 9 sind meist Nebenleistungen, die durch EHS abgegolten wären.
  // Wenn man sie manuell hinzufügt, sollte man idR KEINEN EHS darauf berechnen.
  const isAncillary = ['TP5', 'TP6', 'TP7', 'TP8', 'TP9'].includes(type);
  const isTimeBased = ['TP7', 'TP8', 'TP9'].includes(type);

  // Multiplikator anwenden (z.B. 2 Stunden Besprechung)
  let totalBase = baseFee * multiplier;

  // EHS Berechnung
  // Falls es eine Nebenleistung ist, wird EHS meist ignoriert (außer User erzwingt es)
  let unitRateAmount = 0;
  if (hasUnitRate && !isAncillary) {
    const percentage = value <= 15000 ? 0.50 : 0.40;
    unitRateAmount = totalBase * percentage;
  }

  const subTotalForSurcharge = totalBase + unitRateAmount;

  // Genossenzuschlag
  let surchargeAmount = 0;
  if (hasSurcharge) {
    surchargeAmount = subTotalForSurcharge * GENOSSEN_SURCHARGE;
  }

  const netTotal = totalBase + unitRateAmount + surchargeAmount;
  const vatAmount = isForeign ? 0 : (netTotal * VAT_RATE);
  const grossTotal = netTotal + vatAmount;

  return {
    baseFee: totalBase, // Rückgabe inkl. Multiplikator
    unitRateAmount,
    surchargeAmount,
    netTotal,
    vatAmount,
    grossTotal,
    config: {
      hasUnitRate: hasUnitRate && !isAncillary,
      hasSurcharge,
      isForeign,
      isTimeBased
    }
  };
}

function getBaseFee(value: number, type: TarifPosten): number {
  switch (type) {
    // --- ZEIT & BRIEFE ---
    case 'TP5': // Einfache Schreiben
      return getScaledFee(value, TABLE_TP5, 17, 0, 100); // Max 100
    
    case 'TP6': // Komplexe Briefe (Doppelte TP 5, Max 330)
      const tp5 = getScaledFee(value, TABLE_TP5, 17, 0, 1000); // Hole Basis ohne Cap
      return Math.min(tp5 * 2, 330);

    case 'TP7': // Auswärts (Wie TP 6 per halbe Stunde, Max 220/440)
      // Wir nehmen hier den Satz für Rechtsanwalt (2x TP6 Basis = 4x TP5) -> Max 440
      const tp7Base = getScaledFee(value, TABLE_TP5, 17, 0, 1000) * 2; 
      // TP 7 Abs 2: Doppelte von Abs 1 (der TP 6 entspricht) = 2 * TP6
      return Math.min(tp7Base * 2, 440);

    case 'TP8': // Konferenzen (Tabelle, Max 600)
      return getScaledFee(value, TABLE_TP8, 15, 0, 600);

    case 'TP9': // Reisezeit (Pauschal 75 Fr pro Stunde)
      return 75;

    // --- STANDARD VERFAHREN ---
    case 'TP1':
      return getStandardFee(value, TABLE_TP1, 17, 0.0001, 0.00005, 1426); // Max 1426
    case 'TP2':
      return getStandardFee(value, TABLE_TP2, 80, 0.005, 0.0025, 7128); // Max 7128
    case 'TP3B':
      return getStandardFee(value, TABLE_TP3B, 198, 0.0125, 0.00625, 54000);
    case 'TP3C':
      return getStandardFee(value, TABLE_TP3C, 238, 0.015, 0.0075, 64800);
    case 'TP3A':
    default:
      return getStandardFee(value, TABLE_TP3A, 159, 0.01, 0.005, 43200);
  }
}

// Helper für Tabellen wie TP 1, 2, 3 (mit Promille-Zuschlag über 500k)
function getStandardFee(value: number, table: any[], stepInc: number, pctHigh: number, pctSuperHigh: number, maxCap: number): number {
  // A. Tabelle
  for (const step of table) {
    if (value <= step.limit) return step.fee;
  }
  
  // B. Über 140k bis 500k (Schritte je 20k)
  if (value <= 500000) {
    const baseAt140k = table[table.length - 1].fee;
    const excess = value - 140000;
    const steps = Math.ceil(excess / 20000);
    return baseAt140k + (steps * stepInc);
  }

  // C. Über 500k bis 5 Mio (Promille 1)
  const baseAt140k = table[table.length - 1].fee;
  const stepsTo500k = Math.ceil((500000 - 140000) / 20000);
  const feeAt500k = baseAt140k + (stepsTo500k * stepInc);
  
  if (value <= 5000000) {
    const excess = value - 500000;
    return Math.min(feeAt500k + (excess * pctHigh), maxCap);
  }

  // D. Über 5 Mio (Promille 2)
  const feeAt5Mio = feeAt500k + (4500000 * pctHigh);
  const excess = value - 5000000;
  return Math.min(feeAt5Mio + (excess * pctSuperHigh), maxCap);
}

// Helper für einfache Tabellen wie TP 5, 8 (je 20k Schritte, harter Cap)
function getScaledFee(value: number, table: any[], stepInc: number, pct: number, maxCap: number): number {
  for (const step of table) {
    if (value <= step.limit) return step.fee;
  }
  // Über Tabelle (meist 25k oder 50k)
  const lastStep = table[table.length - 1];
  const excess = value - lastStep.limit;
  const steps = Math.ceil(excess / 20000);
  const calc = lastStep.fee + (steps * stepInc);
  
  return Math.min(calc, maxCap);
}

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('de-LI', { style: 'currency', currency: 'CHF' }).format(val);
}