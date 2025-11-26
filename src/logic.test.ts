import { describe, test, expect } from 'vitest'; // Oder 'jest', je nach Setup
import { calculateFees } from './logic';

// ==========================================
// 1. TYPE DEFINITIONS
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

// GKG Data
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
  let isDerived = false;
  let derivedFrom: TarifPosten | undefined;
  let derivedMult = 1;

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
      hardCap = 100; // TP5 Deckel ist 100 CHF
      break;
    case 'TP6': // Complex Letters (2x TP5)
      isDerived = true;
      derivedFrom = 'TP5';
      derivedMult = 2;
      hardCap = 330;
      break;
    case 'TP7': // Outdoor business
      // Gesetz Text: "gleiche Entlohnung wie TP6" (Abs 1)
      // ABER: "Wurde ein Geschäft ... durch einen Rechtsanwalt ... verrichtet ... das Doppelte" (Abs 2)
      // Annahme für Test: Wir testen den "Rechtsanwalt"-Fall (Standard für diese Tools).
      isDerived = true;
      derivedFrom = 'TP6';
      derivedMult = 2; // Rechtsanwalt = Doppelt TP6
      hardCap = 440; // Deckel für Rechtsanwalt nach Abs 2
      break;
    case 'TP8':
      table = REF_TP8;
      stepAbove140k = 15; 
      hardCap = 600;
      break;
    case 'TP9':
      baseFee = 0;
      hardCap = 0;
      break;
    default:
      baseFee = 0;
  }

  // B. Calculate Lawyer Base Fee
  if (isDerived && derivedFrom) {
    // RECURSION: Get the Base Fee of the parent type
    // WICHTIG: Die Rekursion muss den CAP des Eltern-Typs respektieren!
    // Beispiel TP7: Holt TP6. TP6 holt TP5.
    // TP5 (Wert 100k) -> Rechnerisch 101 -> Cap greift -> 100.
    // TP6 = 100 * 2 = 200. (Cap 330 ok).
    // TP7 (Anwalt) = 200 * 2 = 400. (Cap 440 ok).
    // Ergebnis muss 400 sein. App liefert 404 -> App ignoriert TP5 Cap!
    const sub = getOracleFee(value, derivedFrom, false, 1, false, false, false, false, undefined);
    baseFee = sub.baseFee * derivedMult;
  } else if (table.length > 0) {
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
        const steps = Math.ceil(roundCHF(amountSubjectToSteps) / 20000); 
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
  }

  // C. Apply Cap (The Final Cap for the requested Type)
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
    if (value <= 1000000) {
      const gkgMatch = REF_GKG.find(r => value <= r.limit);
      if (gkgMatch) {
        courtFee = gkgMatch[gkgColumn];
      }
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
  const TP_TYPES: TarifPosten[] = ['TP1', 'TP2', 'TP3A', 'TP3B', 'TP3C', 'TP5', 'TP6', 'TP7', 'TP8'];
  const GKG_TYPES: GKG_COLUMN[] = ['zivil', 'schuld', 'ausserstreit', 'exekution', 'sicherung'];
  
  const BASE_CONFIGS = [
    { isForeign: false, hasUnitRate: true, hasSurcharge: false, includeCourtFee: false },
    { isForeign: true, hasUnitRate: false, hasSurcharge: true, includeCourtFee: true },
    { isForeign: false, hasUnitRate: true, hasSurcharge: true, includeCourtFee: true },
    { isForeign: false, hasUnitRate: false, hasSurcharge: false, includeCourtFee: false } // Raw Base Check
  ];

  // --- DATA GENERATOR (Optimized for 1M) ---
  const generateValues = () => {
    const values: number[] = [];
    
    // 1. "The Cap Hunter" - Values exactly where limits/steps hit
    // TP5 limits (steps of 20k starting at 50k): 50k, 70k, 90k, 110k...
    const caps = [100, 1000, 15000, 15001, 50000, 100000, 140000, 500000, 5000000];
    caps.forEach(c => values.push(c, c + 0.05, c - 0.05));

    // 2. "Micro Claims"
    for(let i=0; i<50; i++) values.push(Math.round(Math.random() * 100 * 100) / 100);

    // 3. "High Rollers"
    for(let i=0; i<50; i++) values.push(100000000 + Math.random() * 50000000);

    // 4. "The Million Army" - Fuzzing
    const targetCount = 1000000;
    while(values.length < targetCount) {
      // Use Math.random directly in push to avoid var overhead in tight loop
      const r = Math.random();
      let v = 0;
      if (r < 0.5) v = r * 200000; // 0 - 200k (Most common)
      else if (r < 0.8) v = r * 2000000; // up to 2M
      else v = r * 50000000; // up to 50M
      
      // Round to 2 decimals
      values.push(Math.floor(v * 100) / 100);
    }
    return values;
  };

  const TEST_VALUES = generateValues();

  // --- FUZZING TESTS ---
  test('FUZZING: 1,000,000 Cases against Oracle', () => {
    
    // Pre-calc lengths for modulo
    const tpLen = TP_TYPES.length;
    const gkgLen = GKG_TYPES.length;
    const confLen = BASE_CONFIGS.length;

    // Use simple for loop for max performance
    for (let i = 0; i < TEST_VALUES.length; i++) {
      const val = TEST_VALUES[i];
      const tp = TP_TYPES[i % tpLen];
      const gkg = GKG_TYPES[i % gkgLen];
      const conf = BASE_CONFIGS[i % confLen];
      
      const oracle = getOracleFee(val, tp, false, 1, conf.hasUnitRate, conf.hasSurcharge, conf.isForeign, conf.includeCourtFee, gkg);
      const app = calculateFees(val, tp, gkg, false, 1, conf.hasUnitRate, conf.hasSurcharge, conf.isForeign, conf.includeCourtFee);

      // Manual assertion for speed (expect() is slower in tight loops)
      const diffBase = Math.abs(app.baseFee - oracle.baseFee);
      
      if (diffBase > 0.02) { // Allow slight float noise
        // Throw proper error on first failure to stop the submarine
        console.error(`FAILED at Value: ${val}, Type: ${tp}, Conf: ${JSON.stringify(conf)}`);
        console.error(`Oracle Expected:`, oracle);
        console.error(`App Received:`, app);
        // We use standard expect here to generate the nice error message and fail the test
        expect(app.baseFee).toBeCloseTo(oracle.baseFee, 2); 
      }
      
      // Check invariants if base passed
      if (Math.abs(app.netTotal - oracle.netTotal) > 0.02) {
         console.error(`NET TOTAL MISMATCH at ${val} ${tp}`);
         expect(app.netTotal).toBeCloseTo(oracle.netTotal, 2);
      }
      
      // Court Fee Check (Only if in range)
      if ((val <= 1000000 || !conf.includeCourtFee) && Math.abs(app.grossTotal - oracle.grossTotal) > 0.02) {
         expect(app.grossTotal).toBeCloseTo(oracle.grossTotal, 2);
      }
    }
  });

  // --- INVARIANTS (MATH PROOFS) ---
  test('INVARIANTS: Accounting Equation Holds (Sampled)', () => {
    // Check first 1000 values
    for(let i=0; i<1000; i++) {
      const val = TEST_VALUES[i];
      const res = calculateFees(val, 'TP3A', 'zivil', false, 1, true, true, false, true);
      const calcNet = res.baseFee + res.unitRateAmount + res.surchargeAmount;
      if (Math.abs(res.netTotal - calcNet) > 0.02) {
        expect(res.netTotal).toBeCloseTo(calcNet, 2);
      }
    }
  });

  test('INVARIANTS: Foreign VAT is Zero', () => {
    const res = calculateFees(50000, 'TP3A', 'zivil', false, 1, true, true, true, true);
    expect(res.vatAmount).toBe(0);
    expect(res.grossTotal).toBe(res.netTotal + res.courtFee);
  });

  // --- MONOTONICITY & ANOMALIES ---
  test('MONOTONICITY: Base Fee never decreases', () => {
    // Check a sorted subset
    const subset = TEST_VALUES.slice(0, 5000).sort((a, b) => a - b);
    for (let i = 0; i < subset.length - 1; i++) {
      const v1 = subset[i];
      const v2 = subset[i+1];
      const f1 = calculateFees(v1, 'TP3A', 'zivil', false, 1, false, false, false, false);
      const f2 = calculateFees(v2, 'TP3A', 'zivil', false, 1, false, false, false, false);
      
      if (f2.baseFee < f1.baseFee) {
        if (Math.abs(f2.baseFee - f1.baseFee) > 0.01) {
           throw new Error(`Monotonicity Violation! Val ${v1}=>${f1.baseFee} vs Val ${v2}=>${f2.baseFee}`);
        }
      }
    }
  });

  test('ANOMALY: The "15k Unit Rate Drop" exists', () => {
    const v15k = calculateFees(15000, 'TP3A', 'zivil', false, 1, true, false, false, false);
    const v15k_plus = calculateFees(15001, 'TP3A', 'zivil', false, 1, true, false, false, false);

    expect(v15k_plus.baseFee).toBeGreaterThanOrEqual(v15k.baseFee);
    expect(v15k.unitRateAmount).toBeCloseTo(v15k.baseFee * 0.50, 2);
    expect(v15k_plus.unitRateAmount).toBeCloseTo(v15k_plus.baseFee * 0.40, 2);
  });
});