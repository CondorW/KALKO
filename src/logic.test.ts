import { describe, test, expect } from 'vitest'; // Oder 'jest', je nach Setup
import { calculateFees } from './logic';

// ==========================================
// 1. TYPE DEFINITIONS (FROM PROMPT)
// ==========================================
type TarifPosten = 'TP1' | 'TP2' | 'TP3A' | 'TP3B' | 'TP3C' | 'TP5' | 'TP6' | 'TP7' | 'TP8' | 'TP9';
type GKG_COLUMN = 'zivil' | 'schuld' | 'ausserstreit' | 'exekution' | 'sicherung';

interface FeeResult {
  baseFee: number;
  unitRateAmount: number;
  surchargeAmount: number;
  netTotal: number;
  vatAmount: number;
  courtFee: number;
  grossTotal: number;
}

// ==========================================
// 2. SOURCE OF TRUTH (HARDCODED PDF/CSV DATA)
// ==========================================

// Helper for fixed table rows
type TableRow = { limit: number; fee: number };

// RATV Art 1, Tarifpost 1 (IV Insolvenz)
const REF_TP1_IV: TableRow[] = [
  { limit: 500, fee: 17 }, { limit: 1000, fee: 25 }, { limit: 1500, fee: 32 },
  { limit: 2500, fee: 37 }, { limit: 5000, fee: 40 }, { limit: 10000, fee: 49 },
  { limit: 15000, fee: 64 }, { limit: 25000, fee: 72 }, { limit: 50000, fee: 80 },
  { limit: 75000, fee: 96 }, { limit: 100000, fee: 119 }, { limit: 140000, fee: 159 }
];

// RATV Art 1, Tarifpost 2
const REF_TP2: TableRow[] = [
  { limit: 500, fee: 80 }, { limit: 1000, fee: 119 }, { limit: 1500, fee: 159 },
  { limit: 2500, fee: 175 }, { limit: 5000, fee: 198 }, { limit: 10000, fee: 238 },
  { limit: 15000, fee: 317 }, { limit: 25000, fee: 357 }, { limit: 50000, fee: 396 },
  { limit: 75000, fee: 476 }, { limit: 100000, fee: 594 }, { limit: 140000, fee: 792 }
];

// RATV Art 1, Tarifpost 3A (Zivil Normal)
const REF_TP3A: TableRow[] = [
  { limit: 500, fee: 159 }, { limit: 1000, fee: 238 }, { limit: 1500, fee: 317 },
  { limit: 2500, fee: 349 }, { limit: 5000, fee: 396 }, { limit: 10000, fee: 476 },
  { limit: 15000, fee: 634 }, { limit: 25000, fee: 713 }, { limit: 50000, fee: 792 },
  { limit: 75000, fee: 951 }, { limit: 100000, fee: 1188 }, { limit: 140000, fee: 1584 }
];

// RATV Art 1, Tarifpost 3B (Berufung)
const REF_TP3B: TableRow[] = [
  { limit: 500, fee: 198 }, { limit: 1000, fee: 297 }, { limit: 1500, fee: 396 },
  { limit: 2500, fee: 436 }, { limit: 5000, fee: 495 }, { limit: 10000, fee: 594 },
  { limit: 15000, fee: 792 }, { limit: 25000, fee: 891 }, { limit: 50000, fee: 990 },
  { limit: 75000, fee: 1188 }, { limit: 100000, fee: 1485 }, { limit: 140000, fee: 1980 }
];

// RATV Art 1, Tarifpost 3C (Revision)
const REF_TP3C: TableRow[] = [
  { limit: 500, fee: 238 }, { limit: 1000, fee: 357 }, { limit: 1500, fee: 476 },
  { limit: 2500, fee: 524 }, { limit: 5000, fee: 594 }, { limit: 10000, fee: 713 },
  { limit: 15000, fee: 951 }, { limit: 25000, fee: 1070 }, { limit: 50000, fee: 1188 },
  { limit: 75000, fee: 1426 }, { limit: 100000, fee: 1782 }, { limit: 140000, fee: 2376 }
];

// RATV Art 1, Tarifpost 5 (Simple Letters)
const REF_TP5: TableRow[] = [
  { limit: 1000, fee: 8 }, { limit: 2500, fee: 10 }, { limit: 5000, fee: 12 },
  { limit: 10000, fee: 17 }, { limit: 25000, fee: 33 }, { limit: 50000, fee: 50 }
];

// RATV Art 1, Tarifpost 8 (Meetings - per half hour)
const REF_TP8: TableRow[] = [
  { limit: 1000, fee: 30 }, { limit: 2500, fee: 45 }, { limit: 5000, fee: 53 },
  { limit: 10000, fee: 75 }, { limit: 25000, fee: 135 }
];

// GKG (Gerichtsgebührengesetz) Data from CSV
// CSV Headers: Bemessungsgrundlage, Zivil..., Schuld..., Ausser..., Exe..., Sicherung...
// Note: Last row in provided snippet was cut off ("450..."). 
// Therefore, this table covers up to 1,000,000 CHF fully.
type GkgRow = { 
  limit: number; 
  zivil: number; 
  schuld: number; 
  ausserstreit: number; 
  exekution: number; 
  sicherung: number; 
};

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
  // Next row (1M-2M) was incomplete in source, so we stop here for strict testing.
];

// ==========================================
// 3. THE ORACLE (SHADOW CALCULATOR)
// ==========================================

const roundCHF = (num: number) => Number((Math.round(num * 100) / 100).toFixed(2));

function getOracleFee(
  value: number,
  type: TarifPosten,
  isAppeal: boolean,
  multiplier: number,
  hasUnitRate: boolean,
  hasSurcharge: boolean,
  isForeign: boolean,
  includeCourtFee: boolean,
  gkgColumn: GKG_COLUMN | undefined
): FeeResult {
  
  // A. Determine Base Fee Strategy
  let baseFee = 0;
  let table: TableRow[] = [];
  let stepAbove140k = 0;   
  let pctAbove500k = 0;    
  let pctAbove5m = 0;      
  let hardCap = Infinity;

  switch (type) {
    case 'TP1':
      table = REF_TP1_IV;
      stepAbove140k = 17;
      pctAbove500k = 0.0001; 
      pctAbove5m = 0.00005; 
      hardCap = 1426; 
      break;
    case 'TP2':
      table = REF_TP2;
      stepAbove140k = 80;
      pctAbove500k = 0.0005; 
      pctAbove5m = 0.00025; 
      hardCap = 7128;
      break;
    case 'TP3A':
      table = REF_TP3A;
      stepAbove140k = 159;
      pctAbove500k = 0.01;   
      pctAbove5m = 0.0005;   
      hardCap = 43200;
      break;
    case 'TP3B':
      table = REF_TP3B;
      stepAbove140k = 198;
      pctAbove500k = 0.0125;  
      pctAbove5m = 0.000625; 
      hardCap = 54000;
      break;
    case 'TP3C':
      table = REF_TP3C;
      stepAbove140k = 238;
      pctAbove500k = 0.015;   
      pctAbove5m = 0.00075;   
      hardCap = 64800;
      break;
    case 'TP5':
      table = REF_TP5;
      stepAbove140k = 17; 
      hardCap = 100;
      break;
    case 'TP8':
      table = REF_TP8;
      stepAbove140k = 15; 
      hardCap = 600;
      break;
    default:
      baseFee = 0;
  }

  // B. Calculate Lawyer Base Fee
  const match = table.find(r => value <= r.limit);
  if (match) {
    baseFee = match.fee;
  } else {
    // Above table
    const maxTableVal = table[table.length - 1].limit;
    baseFee = table[table.length - 1].fee;
    
    // Step Calculation
    let stepLimit = 500000;
    if (type === 'TP5' || type === 'TP8') stepLimit = Infinity;
    
    const amountSubjectToSteps = Math.min(value, stepLimit) - maxTableVal;
    
    if (amountSubjectToSteps > 0) {
      const steps = Math.ceil(amountSubjectToSteps / 20000);
      baseFee += steps * stepAbove140k;
    }

    // Percentage Phase (> 500k)
    if (value > 500000 && stepLimit === 500000) {
      const amountSubjectToPct1 = Math.min(value, 5000000) - 500000;
      if (amountSubjectToPct1 > 0) {
        baseFee += amountSubjectToPct1 * pctAbove500k;
      }
      // Promille Phase (> 5m)
      if (value > 5000000) {
        const amountSubjectToPct2 = value - 5000000;
        baseFee += amountSubjectToPct2 * pctAbove5m;
      }
    }
  }

  // C. Apply Cap
  if (baseFee > hardCap) {
    baseFee = hardCap;
  }

  // D. Multiplier
  let totalBase = baseFee * multiplier;

  // E. Unit Rate (Einheitssatz)
  let unitRate = 0;
  if (hasUnitRate) {
    const rate = value <= 15000 ? 0.50 : 0.40;
    unitRate = totalBase * rate;
  }

  // F. Surcharge (Genossenzuschlag)
  let surcharge = 0;
  if (hasSurcharge) {
    surcharge = (totalBase + unitRate) * 0.10;
  }

  // G. Court Fee (GKG)
  let courtFee = 0;
  if (includeCourtFee && gkgColumn) {
    // Check if value is within our known data range (up to 1 Mio)
    if (value <= 1000000) {
      const gkgMatch = REF_GKG.find(r => value <= r.limit);
      if (gkgMatch) {
        courtFee = gkgMatch[gkgColumn];
        // NOTE: The CSV does not explicitly mention Appeal multipliers.
        // If logic requires doubling for appeals, it should be added here.
        // For strict CSV adherence, we take the value as is.
      }
    } else {
      // Out of range for strict test data
      courtFee = 0; 
    }
  }

  // H. Totals
  const net = totalBase + unitRate + surcharge;
  const vat = isForeign ? 0 : net * 0.081; // 8.1% MWST
  
  return {
    baseFee: roundCHF(totalBase),
    unitRateAmount: roundCHF(unitRate),
    surchargeAmount: roundCHF(surcharge),
    netTotal: roundCHF(net),
    vatAmount: roundCHF(vat),
    courtFee: courtFee,
    grossTotal: roundCHF(net + vat + courtFee)
  };
}


// ==========================================
// 4. TEST SUITE
// ==========================================

describe('Nuclear-Proof Lawyer Fee Calculator Tests', () => {

  // --- CONFIGURATION MATRIX ---
  // Added variations with court fee enabled
  const CONFIGS = [
    { type: 'TP3A' as TarifPosten, isForeign: false, hasUnitRate: true, hasSurcharge: false, includeCourtFee: false },
    { type: 'TP3A' as TarifPosten, isForeign: true, hasUnitRate: true, hasSurcharge: false, includeCourtFee: false },
    { type: 'TP2' as TarifPosten, isForeign: false, hasUnitRate: false, hasSurcharge: true, includeCourtFee: true }, // Test with GKG
    { type: 'TP3B' as TarifPosten, isForeign: false, hasUnitRate: true, hasSurcharge: true, includeCourtFee: true },  // Test with GKG
  ];

  // --- DATA GENERATOR ---
  const generateRandomValues = (count: number) => {
    const values: number[] = [];
    // 1. Critical Boundaries
    values.push(100, 101, 500, 501, 1000, 1001, 5000, 10000, 15000, 15001, 50000, 100000, 140000, 140001, 500000, 500001, 1000000);
    // 2. Randoms
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      // Skew distribution but ensure we have values < 1M for valid GKG tests
      if (rand < 0.6) values.push(Math.floor(Math.random() * 1000000) + 1);
      else values.push(Math.floor(Math.random() * 100000000) + 1);
    }
    return values;
  };

  const TEST_VALUES = generateRandomValues(2000);

  // --- FUZZING TESTS ---
  test('FUZZING: 2000+ Random Cases against Oracle', () => {
    TEST_VALUES.forEach(val => {
      CONFIGS.forEach(conf => {
        // Standard column for test is 'zivil'
        const gkgCol = 'zivil';
        
        const oracle = getOracleFee(val, conf.type, false, 1, conf.hasUnitRate, conf.hasSurcharge, conf.isForeign, conf.includeCourtFee, gkgCol);
        const app = calculateFees(val, conf.type, gkgCol, false, 1, conf.hasUnitRate, conf.hasSurcharge, conf.isForeign, conf.includeCourtFee);

        // Verification Loop
        try {
          expect(app.baseFee).toBeCloseTo(oracle.baseFee, 2);
          expect(app.unitRateAmount).toBeCloseTo(oracle.unitRateAmount, 2);
          expect(app.surchargeAmount).toBeCloseTo(oracle.surchargeAmount, 2);
          expect(app.netTotal).toBeCloseTo(oracle.netTotal, 2);
          expect(app.vatAmount).toBeCloseTo(oracle.vatAmount, 2);
          
          // Only check Court Fee equality if we are within range of known data (<= 1M)
          // Otherwise, if value > 1M, Oracle assumes 0 (safe mode), so we skip strict check if app actually calculates it.
          if (val <= 1000000 || !conf.includeCourtFee) {
             expect(app.courtFee).toBe(oracle.courtFee); // Court fees are integers usually, exact match preferred
             expect(app.grossTotal).toBeCloseTo(oracle.grossTotal, 2);
          }
          
        } catch (e) {
           // console.error(`FAILURE at Value: ${val}, Type: ${conf.type}`, { oracle, app });
          throw e;
        }
      });
    });
  });

  // --- INVARIANTS (MATH PROOFS) ---
  test('INVARIANTS: Accounting Equation Holds', () => {
    TEST_VALUES.slice(0, 500).forEach(val => {
      // Test with GKG enabled
      const res = calculateFees(val, 'TP3A', 'zivil', false, 1, true, true, false, true);
      
      // 1. Net Sum Check
      const calcNet = res.baseFee + res.unitRateAmount + res.surchargeAmount;
      expect(res.netTotal).toBeCloseTo(calcNet, 2);

      // 2. Gross Sum Check
      const calcGross = res.netTotal + res.vatAmount + res.courtFee;
      expect(res.grossTotal).toBeCloseTo(calcGross, 2);

      // 3. VAT Logic
      expect(res.vatAmount).toBeCloseTo(res.netTotal * 0.081, 2);
    });
  });

  test('INVARIANTS: Foreign VAT is Zero', () => {
    const res = calculateFees(50000, 'TP3A', 'zivil', false, 1, true, true, true, true);
    expect(res.vatAmount).toBe(0);
    expect(res.grossTotal).toBe(res.netTotal + res.courtFee);
  });

  // --- MONOTONICITY & ANOMALIES ---
  test('MONOTONICITY: Base Fee never decreases', () => {
    const sortedVals = [...TEST_VALUES].sort((a, b) => a - b);
    for (let i = 0; i < sortedVals.length - 1; i++) {
      const v1 = sortedVals[i];
      const v2 = sortedVals[i+1];
      const f1 = calculateFees(v1, 'TP3A', 'zivil', false, 1, false, false, false, false);
      const f2 = calculateFees(v2, 'TP3A', 'zivil', false, 1, false, false, false, false);
      
      if (f2.baseFee < f1.baseFee) {
        throw new Error(`Monotonicity Violation! Val ${v1}=>${f1.baseFee} vs Val ${v2}=>${f2.baseFee}`);
      }
    }
  });

  test('ANOMALY: The "15k Unit Rate Drop" exists', () => {
    // At 15,000: Unit Rate is 50%. At 15,001: Unit Rate is 40%.
    const v15k = calculateFees(15000, 'TP3A', 'zivil', false, 1, true, false, false, false);
    const v15k_plus = calculateFees(15001, 'TP3A', 'zivil', false, 1, true, false, false, false);

    expect(v15k_plus.baseFee).toBeGreaterThanOrEqual(v15k.baseFee);
    
    // Check correct Unit Rate calculation percentage
    expect(v15k.unitRateAmount).toBeCloseTo(v15k.baseFee * 0.50, 2);
    expect(v15k_plus.unitRateAmount).toBeCloseTo(v15k_plus.baseFee * 0.40, 2);
  });
});