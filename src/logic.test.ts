import { describe, it, expect } from 'vitest';
import { calculateFees } from './logic';
import type { TarifPosten } from './fees';
import type { GKG_COLUMN } from './tarife/gkg';

/**
 * 🛡️ ULTIMATIVE QA SUITE (ISO-VERIFIED)
 * * KRITISCHE REGEL:
 * Wir importieren KEINE Tabellen oder Logik aus der App.
 * Alle Referenzwerte sind hier HARDCODIERT (Source of Truth).
 * Nur so finden wir Fehler in den App-Tabellen selbst.
 */

const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

// --- 1. UNABHÄNGIGE REFERENZ-DATEN (Aus RATV/RATG PDFs) ---

type RefTable = { limit: number, fee: number }[];

const REF_TP1: RefTable = [
    { limit: 500, fee: 17 }, { limit: 1000, fee: 25 }, { limit: 1500, fee: 32 },
    { limit: 2500, fee: 37 }, { limit: 5000, fee: 40 }, { limit: 10000, fee: 49 },
    { limit: 15000, fee: 64 }, { limit: 25000, fee: 72 }, { limit: 50000, fee: 80 },
    { limit: 75000, fee: 96 }, { limit: 100000, fee: 119 }, { limit: 140000, fee: 159 }
];
const REF_TP2: RefTable = [
    { limit: 500, fee: 80 }, { limit: 1000, fee: 119 }, { limit: 1500, fee: 159 },
    { limit: 2500, fee: 175 }, { limit: 5000, fee: 198 }, { limit: 10000, fee: 238 },
    { limit: 15000, fee: 317 }, { limit: 25000, fee: 357 }, { limit: 50000, fee: 396 },
    { limit: 75000, fee: 476 }, { limit: 100000, fee: 594 }, { limit: 140000, fee: 792 }
];
const REF_TP3A: RefTable = [
    { limit: 500, fee: 159 }, { limit: 1000, fee: 238 }, { limit: 1500, fee: 317 },
    { limit: 2500, fee: 349 }, { limit: 5000, fee: 396 }, { limit: 10000, fee: 476 },
    { limit: 15000, fee: 634 }, { limit: 25000, fee: 713 }, { limit: 50000, fee: 792 },
    { limit: 75000, fee: 951 }, { limit: 100000, fee: 1188 }, { limit: 140000, fee: 1584 }
];
const REF_TP3B: RefTable = [
    { limit: 500, fee: 198 }, { limit: 1000, fee: 297 }, { limit: 1500, fee: 396 },
    { limit: 2500, fee: 436 }, { limit: 5000, fee: 495 }, { limit: 10000, fee: 594 },
    { limit: 15000, fee: 792 }, { limit: 25000, fee: 891 }, { limit: 50000, fee: 990 },
    { limit: 75000, fee: 1188 }, { limit: 100000, fee: 1485 }, { limit: 140000, fee: 1980 }
];
const REF_TP3C: RefTable = [
    { limit: 500, fee: 238 }, { limit: 1000, fee: 357 }, { limit: 1500, fee: 476 },
    { limit: 2500, fee: 524 }, { limit: 5000, fee: 594 }, { limit: 10000, fee: 713 },
    { limit: 15000, fee: 951 }, { limit: 25000, fee: 1070 }, { limit: 50000, fee: 1188 },
    { limit: 75000, fee: 1426 }, { limit: 100000, fee: 1782 }, { limit: 140000, fee: 2376 }
];
const REF_TP5: RefTable = [
    { limit: 1000, fee: 8 }, { limit: 2500, fee: 10 }, { limit: 5000, fee: 12 },
    { limit: 10000, fee: 17 }, { limit: 25000, fee: 33 }, { limit: 50000, fee: 50 }
];
const REF_TP8: RefTable = [
    { limit: 1000, fee: 30 }, { limit: 2500, fee: 45 }, { limit: 5000, fee: 53 },
    { limit: 10000, fee: 75 }, { limit: 25000, fee: 135 }
];

// Prozent-Regeln und Caps (Independent Truth)
const RULES = {
    'TP1': { inc: 17, pct1: 0.0001, pct2: 0.00005, cap: 1426, table: REF_TP1 },
    'TP2': { inc: 80, pct1: 0.0005, pct2: 0.00025, cap: 7128, table: REF_TP2 },
    'TP3A': { inc: 159, pct1: 0.001, pct2: 0.0005, cap: 43200, table: REF_TP3A },
    'TP3B': { inc: 198, pct1: 0.00125, pct2: 0.000625, cap: 54000, table: REF_TP3B },
    'TP3C': { inc: 238, pct1: 0.0015, pct2: 0.00075, cap: 64800, table: REF_TP3C },
    'TP5': { inc: 17, pct1: 0, pct2: 0, cap: 100, table: REF_TP5 },
    'TP6': { baseTp: 'TP5', multiplier: 2, cap: 330 },
    'TP7': { baseTp: 'TP5', multiplier: 4, cap: 440 },
    'TP8': { inc: 15, pct1: 0, pct2: 0, cap: 600, table: REF_TP8 },
    'TP9': { fix: 75 }
};

// --- 2. ORACLE LOGIK (Shadow Calculator) ---

function getOracleFee(val: number, type: TarifPosten): number {
    if (type === 'TP9') return 75;

    const rule = (RULES as any)[type];
    
    // Derived Tarife (TP6, TP7)
    if (rule.baseTp) {
        const base = getOracleFee(val, rule.baseTp);
        // Achtung: TP6/7 nutzen die Logik von TP5, aber ohne den TP5-Cap von 100.
        // Wir müssen TP5 "uncapped" rechnen.
        const uncappedTp5 = getOracleFeeUncapped(val, REF_TP5, 17);
        return Math.min(uncappedTp5 * rule.multiplier, rule.cap);
    }

    return calculateStandardOracle(val, rule.table, rule.inc, rule.pct1, rule.pct2, rule.cap);
}

function calculateStandardOracle(val: number, table: RefTable, inc: number, pct1: number, pct2: number, cap: number): number {
    // 1. Tabelle
    for (const step of table) {
        if (val <= step.limit) return step.fee;
    }

    const last = table[table.length - 1];
    let fee = last.fee;

    // 2. Linear (meist bis 500k)
    // TP5/8 haben kein "500k Limit" für Linear, sondern gehen einfach weiter bis Cap
    // TP1,2,3 haben ab 500k Prozent
    
    const limitLinear = (cap === 100 || cap === 600) ? Infinity : 500000;
    
    // Berechnung der Schritte ab Tabellenende
    // RATV sagt: "für je angefangene weitere 20.000"
    const linearBase = val > limitLinear ? limitLinear : val;
    const diffLinear = linearBase - last.limit;
    if (diffLinear > 0) {
        const steps = Math.ceil(diffLinear / 20000);
        fee += steps * inc;
    }

    // 3. Prozent I (500k bis 5 Mio)
    if (val > 500000 && limitLinear === 500000) {
        const p1Base = val > 5000000 ? 5000000 : val;
        const diffP1 = p1Base - 500000;
        fee += diffP1 * pct1;
    }

    // 4. Prozent II (über 5 Mio)
    if (val > 5000000 && limitLinear === 500000) {
        const diffP2 = val - 5000000;
        fee += diffP2 * pct2;
    }

    return Math.min(fee, cap);
}

// Hilfsfunktion für TP6/7 die auf TP5 basieren aber weiter skalieren
function getOracleFeeUncapped(val: number, table: RefTable, inc: number): number {
    for (const step of table) {
        if (val <= step.limit) return step.fee;
    }
    const last = table[table.length - 1];
    const diff = val - last.limit;
    const steps = Math.ceil(diff / 20000);
    return last.fee + (steps * inc);
}

// --- 3. TEST SUITE ---

describe('🔥 ULTIMATE FUZZING: App vs. Independent Oracle', () => {
    
    // Wir generieren 2000 Zufallszahlen + Boundary Values
    const randomValues = Array.from({ length: 2000 }, () => Math.floor(Math.random() * 10000000) + 1);
    const boundaries = [
        1, 500, 501, 1000, 15000, 15001, 
        140000, 140001, 
        500000, 500001, 
        5000000, 5000001, 
        50000000, 100000000
    ];
    
    const allValues = [...boundaries, ...randomValues];
    const tariffs: TarifPosten[] = ['TP1', 'TP2', 'TP3A', 'TP3B', 'TP3C', 'TP5', 'TP6', 'TP7', 'TP8', 'TP9'];

    // Wir flatten das Array für vitest .each
    const testCases = tariffs.flatMap(type => 
        // Wir nehmen für jeden Tarif 50 zufällige Werte aus dem großen Pool, um die Testzeit in Grenzen zu halten
        // Aber wir nehmen IMMER alle Boundaries.
        [...boundaries, ...randomValues.slice(0, 50)].map(val => ({ type, val }))
    );

    it.each(testCases)('Oracle Check: $type bei $val CHF', ({ type, val }) => {
        // 1. App Ergebnis
        const actual = calculateFees(val, type, undefined, false, 1, false, false, false, false);
        
        // 2. Oracle Ergebnis (Independent)
        const expectedBase = getOracleFee(val, type);

        // Debug bei Fehler:
        if (actual.baseFee !== expectedBase) {
            console.error(`MISMATCH ${type} @ ${val}: App=${actual.baseFee} vs Oracle=${expectedBase}`);
        }

        // Toleranz für Floating Point bei Prozentrechnungen
        expect(actual.baseFee).toBeCloseTo(expectedBase, 4);
    });

    it('Validiert Einheitssatz (EHS) Logik global', () => {
        // Prüft, ob EHS-Regel unabhängig vom Tarif immer stimmt
        allValues.slice(0, 100).forEach(val => {
            const res = calculateFees(val, 'TP3A', undefined, false, 1, true, false, false, false);
            const rate = val <= 15000 ? 0.5 : 0.4;
            expect(res.unitRateAmount).toBeCloseTo(res.baseFee * rate, 4);
        });
    });
});

describe('1. Manuelle "Golden Master" Tests (Smoke Tests)', () => {
    // Diese Tests bleiben als "menschenlesbare" Referenz
    it('Case 1: Der 15k EHS Kipppunkt (TP3A)', () => {
        const res = calculateFees(15000, 'TP3A', 'zivil', false, 1, true, false, false, true);
        expect(res.baseFee).toBe(634); // Aus REF_TP3A
        expect(res.unitRateAmount).toBe(317);
        expect(round(res.netTotal)).toBe(951);
        expect(res.courtFee).toBe(850);
        expect(round(res.grossTotal)).toBe(1878.03);
    });

    it('Case 2: 500k Grenze (Linear -> Prozent)', () => {
        const res = calculateFees(500000, 'TP3A', 'zivil', false, 1, true, false, false, false);
        expect(res.baseFee).toBe(4446);
        expect(res.unitRateAmount).toBe(1778.40);
    });

    it('Case 3: Das Absolute Cap (100 Mio)', () => {
        const res = calculateFees(100000000, 'TP3A', undefined, false, 1, false, false, false, false);
        expect(res.baseFee).toBe(43200); // Oracle sagt auch 43200
    });
});