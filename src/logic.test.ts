import { describe, test, expect } from 'vitest';
import { calculateFees } from './logic';

// ==========================================
// 1. DEFINITIONS & CONFIG
// ==========================================
type TarifPosten = 'TP1' | 'TP2' | 'TP3A' | 'TP3B' | 'TP3C' | 'TP5' | 'TP6' | 'TP7' | 'TP8' | 'TP9';
type GKG_COLUMN = 'zivil' | 'schuld' | 'ausserstreit' | 'exekution' | 'sicherung';

interface FeeResult {
  baseFee: number;
  unitRateAmount: number;
  surchargeAmount: number;
  courtFee: number;
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
}

// ==========================================
// 2. DATA: SOURCE OF TRUTH (HARDCODED)
// ==========================================

type TableRow = { limit: number; fee: number };

// TP1 (IV Insolvenz Ref)
const REF_TP1: TableRow[] = [
  { limit: 500, fee: 17 }, { limit: 1000, fee: 25 }, { limit: 1500, fee: 32 },
  { limit: 2500, fee: 37 }, { limit: 5000, fee: 40 }, { limit: 10000, fee: 49 },
  { limit: 15000, fee: 64 }, { limit: 25000, fee: 72 }, { limit: 50000, fee: 80 },
  { limit: 75000, fee: 96 }, { limit: 100000, fee: 119 }, { limit: 140000, fee: 159 }
];
// TP2
const REF_TP2: TableRow[] = [
  { limit: 500, fee: 80 }, { limit: 1000, fee: 119 }, { limit: 1500, fee: 159 },
  { limit: 2500, fee: 175 }, { limit: 5000, fee: 198 }, { limit: 10000, fee: 238 },
  { limit: 15000, fee: 317 }, { limit: 25000, fee: 357 }, { limit: 50000, fee: 396 },
  { limit: 75000, fee: 476 }, { limit: 100000, fee: 594 }, { limit: 140000, fee: 792 }
];
// TP3A
const REF_TP3A: TableRow[] = [
  { limit: 500, fee: 159 }, { limit: 1000, fee: 238 }, { limit: 1500, fee: 317 },
  { limit: 2500, fee: 349 }, { limit: 5000, fee: 396 }, { limit: 10000, fee: 476 },
  { limit: 15000, fee: 634 }, { limit: 25000, fee: 713 }, { limit: 50000, fee: 792 },
  { limit: 75000, fee: 951 }, { limit: 100000, fee: 1188 }, { limit: 140000, fee: 1584 }
];
// TP3B
const REF_TP3B: TableRow[] = [
  { limit: 500, fee: 198 }, { limit: 1000, fee: 297 }, { limit: 1500, fee: 396 },
  { limit: 2500, fee: 436 }, { limit: 5000, fee: 495 }, { limit: 10000, fee: 594 },
  { limit: 15000, fee: 792 }, { limit: 25000, fee: 891 }, { limit: 50000, fee: 990 },
  { limit: 75000, fee: 1188 }, { limit: 100000, fee: 1485 }, { limit: 140000, fee: 1980 }
];
// TP3C
const REF_TP3C: TableRow[] = [
  { limit: 500, fee: 238 }, { limit: 1000, fee: 357 }, { limit: 1500, fee: 476 },
  { limit: 2500, fee: 524 }, { limit: 5000, fee: 594 }, { limit: 10000, fee: 713 },
  { limit: 15000, fee: 951 }, { limit: 25000, fee: 1070 }, { limit: 50000, fee: 1188 },
  { limit: 75000, fee: 1426 }, { limit: 100000, fee: 1782 }, { limit: 140000, fee: 2376 }
];
// TP5
const REF_TP5: TableRow[] = [
  { limit: 1000, fee: 8 }, { limit: 2500, fee: 10 }, { limit: 5000, fee: 12 },
  { limit: 10000, fee: 17 }, { limit: 25000, fee: 33 }, { limit: 50000, fee: 50 }
];
// TP8
const REF_TP8: TableRow[] = [
  { limit: 1000, fee: 30 }, { limit: 2500, fee: 45 }, { limit: 5000, fee: 53 },
  { limit: 10000, fee: 75 }, { limit: 25000, fee: 135 }
];

// GKG
type GkgRow = { limit: number; zivil: number; schuld: number; ausserstreit: number; exekution: number; sicherung: number };
const REF_GKG: GkgRow[] = [
  { limit: 100, zivil: 120, schuld: 10, ausserstreit: 10, exekution: 10, sicherung: 30 },
  { limit: 500, zivil: 120, schuld: 20, ausserstreit: 20, exekution: 20, sicherung: 30 },
  { limit: 1000, zivil: 120, schuld: 30, ausserstreit: 30, exekution: 30, sicherung: 30 },
  { limit: 5000, zivil: 300, schuld: 50, ausserstreit: 100, exekution: 50, sicherung: 50 },
  { limit: 10000, zivil: 500, schuld: 50, ausserstreit: 100, exekution: 50, sicherung: 100 },
  { limit: 50000, zivil: 850, schuld: 90, ausserstreit: 210, exekution: 90, sicherung: 200 },
  { limit: 100000, zivil: 2000, schuld: 90, ausserstreit: 510, exekution: 170, sicherung: 400 },
  { limit: 500000, zivil: 4000, schuld: 170, ausserstreit: 1000, exekution: 850, sicherung: 900 },
  { limit: 1000000, zivil: 5000, schuld: 340, ausserstreit: 1900, exekution: 1700, sicherung: 1700 }
];

// ==========================================
// 3. ORACLE LOGIC
// ==========================================

const roundCHF = (num: number) => Number((Math.round(num * 100) / 100).toFixed(2));

function calculateBaseFee(
  value: number,
  table: TableRow[],
  stepAbove140k: number,
  pctAbove500k: number,
  pctAbove5m: number,
  hardCap: number,
  stepThreshold: number = 140000
): number {
  if (value <= 0) return 0;
  let fee = 0;
  const maxTableVal = table[table.length - 1].limit;
  const match = table.find(r => value <= r.limit);
  
  if (match) {
    fee = match.fee;
  } else {
    fee = table[table.length - 1].fee;
    let stepLimit = 500000;
    if (stepThreshold < 140000) stepLimit = Infinity; 
    const amountSubjectToSteps = Math.min(value, stepLimit) - maxTableVal;
    if (amountSubjectToSteps > 0) {
      const steps = Math.ceil(roundCHF(amountSubjectToSteps) / 20000);
      fee += steps * stepAbove140k;
    }
    if (value > 500000 && stepLimit === 500000) {
      const amountSubjectToPct1 = Math.min(value, 5000000) - 500000;
      if (amountSubjectToPct1 > 0) fee += amountSubjectToPct1 * pctAbove500k;
      if (value > 5000000) {
        const amountSubjectToPct2 = value - 5000000;
        fee += amountSubjectToPct2 * pctAbove5m;
      }
    }
  }
  return Math.min(fee, hardCap);
}

function getOracleFee(
  value: number,
  type: TarifPosten,
  gkgColumn: GKG_COLUMN | undefined,
  isAppeal: boolean,
  multiplier: number,
  hasUnitRate: boolean,
  hasSurcharge: boolean,
  isForeign: boolean,
  includeCourtFee: boolean
): FeeResult {
  
  if (value <= 0) return { baseFee: 0, unitRateAmount: 0, surchargeAmount: 0, courtFee: 0, netTotal: 0, vatAmount: 0, grossTotal: 0 };

  let baseFee = 0;
  if (type === 'TP6') {
    const tp5Uncapped = calculateBaseFee(value, REF_TP5, 17, 0, 0, Infinity, 50000);
    const tp5Capped = Math.min(tp5Uncapped, 100);
    baseFee = Math.min(tp5Capped * 2, 330);
  } else if (type === 'TP7') {
    const tp5Uncapped = calculateBaseFee(value, REF_TP5, 17, 0, 0, Infinity, 50000);
    const tp5Capped = Math.min(tp5Uncapped, 100);
    const tp6Raw = tp5Capped * 2;
    const tp6Capped = Math.min(tp6Raw, 330);
    baseFee = Math.min(tp6Capped * 2, 440);
  } else {
    switch (type) {
      case 'TP1': baseFee = calculateBaseFee(value, REF_TP1, 17, 0.0001, 0.00005, 1426); break;
      case 'TP2': baseFee = calculateBaseFee(value, REF_TP2, 80, 0.0005, 0.00025, 7128); break;
      case 'TP3A': baseFee = calculateBaseFee(value, REF_TP3A, 159, 0.01, 0.0005, 43200); break;
      case 'TP3B': baseFee = calculateBaseFee(value, REF_TP3B, 198, 0.0125, 0.000625, 54000); break;
      case 'TP3C': baseFee = calculateBaseFee(value, REF_TP3C, 238, 0.015, 0.00075, 64800); break;
      case 'TP5': baseFee = calculateBaseFee(value, REF_TP5, 17, 0, 0, 100, 50000); break;
      case 'TP8': baseFee = calculateBaseFee(value, REF_TP8, 15, 0, 0, 600, 25000); break;
      case 'TP9': baseFee = 0; break;
    }
  }

  const totalBase = roundCHF(baseFee * multiplier);

  let unitRate = 0;
  if (hasUnitRate) {
    const factor = value <= 15000 ? 0.50 : 0.40;
    unitRate = roundCHF(totalBase * factor);
  }

  let surcharge = 0;
  if (hasSurcharge) {
    surcharge = roundCHF((totalBase + unitRate) * 0.10);
  }

  let courtFee = 0;
  if (includeCourtFee && gkgColumn) {
    if (value <= 1000000) {
      const match = REF_GKG.find(r => value <= r.limit);
      if (match) {
        let fee = match[gkgColumn];
        if (isAppeal) fee *= 2;
        courtFee = fee;
      }
    }
  }

  const net = roundCHF(totalBase + unitRate + surcharge);
  const vat = isForeign ? 0 : roundCHF(net * 0.081);
  const gross = roundCHF(net + vat + courtFee);

  return { baseFee: roundCHF(totalBase), unitRateAmount: unitRate, surchargeAmount: surcharge, courtFee, netTotal: net, vatAmount: vat, grossTotal: gross };
}

// ==========================================
// 4. DIABOLICAL TEST SUITE
// ==========================================

describe('Nuclear-Proof Lawyer Fee Tests (Diabolical Edition)', () => {

  // --- 1. CHAOS MONKEY: BAD INPUTS ---
  test('CHAOS: Invalid Inputs', () => {
    const badInputs = [-1, -50000, 0, -0.01];
    badInputs.forEach(val => {
      const res = calculateFees(val, 'TP3A', 'zivil', false, 1, true, true, false, false);
      try {
        expect(res.baseFee).toBe(0);
        expect(res.netTotal).toBe(0);
        expect(res.grossTotal).toBe(0);
      } catch (e) {
        throw new Error(`Chaos Failure at input ${val}: Received ${JSON.stringify(res)}`);
      }
    });
  });

  // --- 2. REGRESSION TESTS ---
  test('REGRESSION: TP6 Order (Cap then Multiply)', () => {
    const app = calculateFees(100000, 'TP6', undefined, false, 1, false, false, false, false);
    expect(app.baseFee).toBe(200);
  });
  
  test('REGRESSION: TP3A Hard Cap at 100 Mio', () => {
    const app = calculateFees(100000000, 'TP3A', 'zivil', false, 1, false, false, false, false);
    expect(app.baseFee).toBe(43200);
  });

  // --- 3. COMBINATORICS: FULL MATRIX ---
  test('MATRIX: All Boolean Combinations', () => {
    const val = 15001; // Just above Unit Rate flip
    const types: TarifPosten[] = ['TP3A', 'TP2'];
    
    // Iterate all 2^4 = 16 boolean combinations per type
    types.forEach(type => {
      for (let i = 0; i < 16; i++) {
        const hasUnitRate = !!(i & 1);
        const hasSurcharge = !!(i & 2);
        const isForeign = !!(i & 4);
        const includeCourt = !!(i & 8);
        
        const oracle = getOracleFee(val, type, 'zivil', false, 1, hasUnitRate, hasSurcharge, isForeign, includeCourt);
        const app = calculateFees(val, type, 'zivil', false, 1, hasUnitRate, hasSurcharge, isForeign, includeCourt);
        
        expect(app.grossTotal).toBeCloseTo(oracle.grossTotal, 2);
      }
    });
  });

  // --- 4. MASSIVE FUZZING (1 MILLION CASES) ---
  test('FUZZING: 1,000,000 Diabolical Random Cases', () => {
    const types: TarifPosten[] = ['TP1', 'TP2', 'TP3A', 'TP3B', 'TP3C', 'TP5', 'TP6', 'TP7', 'TP8'];
    const gkgCols: GKG_COLUMN[] = ['zivil', 'schuld', 'ausserstreit', 'exekution', 'sicherung'];
    
    // Efficient Loop
    for(let i = 0; i < 1000000; i++) {
      // 1. Generate Input
      let val = 0;
      const r = Math.random();
      
      if (r < 0.05) val = 15000; // Edge case
      else if (r < 0.10) val = 15001; // Edge case
      else if (r < 0.15) val = 500000; // Edge case
      else if (r < 0.20) val = 500001; // Edge case
      else if (r < 0.60) val = Math.floor(Math.random() * 200000); // Normal range
      else if (r < 0.90) val = Math.floor(Math.random() * 2000000); // High range
      else val = Math.floor(Math.random() * 100000000); // Extreme range
      
      // Add decimal noise to provoke rounding errors
      if (Math.random() > 0.5) val += 0.55; 

      // 2. Generate Config
      // Use bitwise ops for speed instead of array lookups where possible
      const typeIdx = i % types.length;
      const gkgIdx = i % gkgCols.length;
      
      const hasUnitRate = (i & 1) === 1;
      const hasSurcharge = (i & 2) === 2;
      const isForeign = (i & 4) === 4;
      const includeCourt = (i & 8) === 8;
      const isAppeal = (i & 16) === 16;
      
      // 3. Run
      const oracle = getOracleFee(val, types[typeIdx], gkgCols[gkgIdx], isAppeal, 1, hasUnitRate, hasSurcharge, isForeign, includeCourt);
      const app = calculateFees(val, types[typeIdx], gkgCols[gkgIdx], isAppeal, 1, hasUnitRate, hasSurcharge, isForeign, includeCourt);

      // 4. Assert with minimal overhead
      // Base Fee Check
      if (Math.abs(app.baseFee - oracle.baseFee) > 0.02) {
        throwError(i, val, types[typeIdx], 'BaseFee', app, oracle);
      }
      // Net Check (catches UnitRate/Surcharge errors)
      if (Math.abs(app.netTotal - oracle.netTotal) > 0.02) {
        throwError(i, val, types[typeIdx], 'NetTotal', app, oracle);
      }
      // Gross Check (catches VAT/CourtFee errors)
      // Only check court fee if value <= 1M (CSV limit) OR if court fee disabled
      if (val <= 1000000 || !includeCourt) {
         if (Math.abs(app.grossTotal - oracle.grossTotal) > 0.02) {
           throwError(i, val, types[typeIdx], 'GrossTotal', app, oracle);
         }
      }
    }
  });
});

function throwError(idx: number, val: number, type: string, field: string, app: any, oracle: any) {
  // Detailed Error Report for the Developer
  const msg = `
  🔥 DIABOLICAL FAILURE at Iteration #${idx}
  ------------------------------------------------
  INPUT: Value=${val}, Type=${type}
  FIELD: ${field} Mismatch
  
  ORACLE (${field}): ${oracle[field]}
  APP    (${field}): ${app[field]}
  
  FULL ORACLE: ${JSON.stringify(oracle)}
  FULL APP:    ${JSON.stringify(app)}
  ------------------------------------------------
  `;
  throw new Error(msg);
}