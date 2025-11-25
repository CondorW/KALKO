import { describe, it, expect } from 'vitest';
import { calculateFees, type CalculationResult, type Position } from './logic';
import type { TarifPosten } from './fees';
import type { GKG_COLUMN } from './tarife/gkg';

/**
 * QA TEST SUITE FÜR KALKO
 * Basierend auf RATG (Gesetz) und RATV (Verordnung) Liechtenstein.
 */

// Hilfsfunktion zum Runden auf 2 Stellen (wie Währung)
const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

describe('Core Logic: Edge Cases (Manuelle Validierung)', () => {
  
  it('Case 1: Grenzwerte 15.000 CHF (EHS Kipppunkt 50% -> 40%)', () => {
    // Input: 15.000, TP3A
    // Base (Tabelle): 634
    // EHS: 50% von 634 = 317
    // Netto: 951
    // GKG (Zivil, <=50k Tabelle): bei 15k -> Spalte 50k -> 850? Nein, Tabelle hat 10k(500) und 50k(850).
    // GKG Tabelle Logic Check: 15k ist <= 50k. Also 850.
    
    const res = calculateFees(15000, 'TP3A', 'zivil', false, 1, true, false, false, true);

    expect(res.baseFee).toBe(634);
    expect(res.unitRateAmount).toBe(317); // 50%
    expect(res.courtFee).toBe(850); // Laut GKG Tabelle Schritt 50.000
    expect(res.netTotal).toBe(951);
    expect(res.vatAmount).toBe(round(951 * 0.081));
  });

  it('Case 2: Grenzwerte 500.000 CHF (Ende der linearen Steigerung)', () => {
    // Berechnung Base TP3A bei 500k:
    // Tabelle max bei 140k = 1584.
    // Diff 360k. Schritte a 20k = 18.
    // Zuschlag 18 * 159 = 2862.
    // Total Base = 1584 + 2862 = 4446.
    
    const res = calculateFees(500000, 'TP3A', 'zivil', false, 1, true, false, false, true);
    
    expect(res.baseFee).toBe(4446);
    expect(res.unitRateAmount).toBe(round(4446 * 0.40)); // 40% da > 15k
    expect(res.config.ehsLabel).toBe('40%');
  });

  it('Case 3: Cap Prüfung bei 50 Mio (TP3A Max 43.200)', () => {
    const res = calculateFees(50000000, 'TP3A', 'zivil', false, 1, false, false, false, false);
    expect(res.baseFee).toBe(43200);
  });

  it('Case 4: Mahnverfahren (TP2) + GKG Schuldentrieb', () => {
    // Wert 10.000
    // TP2 Tabelle 10k = 238
    // EHS 50% = 119
    // GKG Schuldentrieb 10k = 50
    const res = calculateFees(10000, 'TP2', 'schuld', false, 1, true, false, false, true);
    
    expect(res.baseFee).toBe(238);
    expect(res.unitRateAmount).toBe(119);
    expect(res.courtFee).toBe(50);
    expect(res.grossTotal).toBe(round(238 + 119 + (357 * 0.081) + 50));
  });

  it('Case 5: Berufung (TP3B) mit doppelter GKG', () => {
    // Wert 100.000
    // TP3B Tabelle 100k = 1485
    // GKG Zivil 100k = 2000. Appeal = x2 = 4000.
    const res = calculateFees(100000, 'TP3B', 'zivil', true, 1, false, false, false, true);
    
    expect(res.baseFee).toBe(1485);
    expect(res.courtFee).toBe(4000);
    expect(res.config.courtFeeLabel).toContain('2.0x');
  });
});

/**
 * AUTOMATED BULK TESTING (100+ Cases)
 * Wir generieren systematisch Testfälle für verschiedene Tarife und Wertgrenzen.
 */

const TEST_VALUES = [
  500,        // Tabellenanfang
  1200,       // Zwischenschritt
  15000,      // EHS Grenze
  15001,      // EHS Grenze + 1
  50000,      // Mittelfeld
  140000,     // Tabellenende (meistens)
  200000,     // Linearer Anstieg Bereich
  500000,     // Grenze zu %-Berechnung
  1000000,    // %-Berechnung Stufe 1
  5000000,    // Grenze zu %-Berechnung Stufe 2
  6000000     // %-Berechnung Stufe 2
];

const TARIFF_TYPES: TarifPosten[] = ['TP1', 'TP2', 'TP3A', 'TP3B', 'TP3C', 'TP5', 'TP8'];

// Wir erstellen ein Array von Objekten für test.each
const automatedCases = [];

for (const type of TARIFF_TYPES) {
  for (const val of TEST_VALUES) {
    automatedCases.push({ type, val });
  }
}
// Das ergibt 7 Tarife * 11 Werte = 77 Tests.
// Wir fügen GKG Varianten hinzu um auf >100 zu kommen.
const gkgCases = [
  { val: 5000, col: 'zivil' as GKG_COLUMN, appeal: false },
  { val: 5000, col: 'schuld' as GKG_COLUMN, appeal: false },
  { val: 5000, col: 'exekution' as GKG_COLUMN, appeal: false },
  { val: 5000, col: 'zivil' as GKG_COLUMN, appeal: true }, // Appeal Check
  { val: 60000, col: 'schuld' as GKG_COLUMN, appeal: true }, // Appeal High Value
];

describe('Automated Bulk Tests (>100 Cases)', () => {

  // 1. Honorar Validierung
  it.each(automatedCases)('Calcs Base Fee for $type at $val CHF', ({ type, val }) => {
    const res = calculateFees(val, type, undefined, false, 1, false, false, false, false);
    
    expect(res.baseFee).toBeGreaterThan(0);
    
    // Plausibilitätschecks
    if (val <= 500) {
        // Check gegen Mindestwerte der Tabellen (Smoke Test)
        if (type === 'TP3A') expect(res.baseFee).toBe(159);
        if (type === 'TP1') expect(res.baseFee).toBe(17);
    }

    // Check Caps
    if (val === 6000000) {
       if (type === 'TP1') expect(res.baseFee).toBeLessThanOrEqual(1426);
       if (type === 'TP2') expect(res.baseFee).toBeLessThanOrEqual(7128);
       if (type === 'TP3A') expect(res.baseFee).toBeLessThanOrEqual(43200);
       // TP8 Cap ist 600
       if (type === 'TP8') expect(res.baseFee).toBeLessThanOrEqual(600);
    }
  });

  // 2. Einheitssatz (EHS) Logik über alle Werte
  it.each(automatedCases)('Verifies EHS Percentage for $val', ({ type, val }) => {
    const res = calculateFees(val, type, undefined, false, 1, true, false, false, false);
    const expectedRate = val <= 15000 ? 0.50 : 0.40;
    
    // Toleranz für Floating Point Arithmetic
    const expectedEhs = round(res.baseFee * expectedRate);
    expect(res.unitRateAmount).toBeCloseTo(expectedEhs, 1);
  });

  // 3. Umsatzsteuer Logik
  it.each(automatedCases)('Verifies VAT (8.1%) calculation for $type / $val', ({ type, val }) => {
    const res = calculateFees(val, type, undefined, false, 1, false, false, false, false);
    const net = res.baseFee; // ohne EHS/Zuschlag hier
    const expectedVat = round(net * 0.081);
    expect(res.vatAmount).toBeCloseTo(expectedVat, 1);
  });
  
  // 4. Foreign Client (Keine USt)
  it.each(automatedCases.slice(0, 10))('Verifies No VAT for foreign clients ($type)', ({ type, val }) => {
     const res = calculateFees(val, type, undefined, false, 1, false, false, true, false);
     expect(res.vatAmount).toBe(0);
     expect(res.grossTotal).toBe(res.netTotal);
  });

  // 5. GKG Validierung
  it.each(gkgCases)('Validates GKG for $col at $val (Appeal: $appeal)', ({ val, col, appeal }) => {
      const res = calculateFees(val, 'TP3A', col, appeal, 1, false, false, false, true);
      
      expect(res.courtFee).toBeGreaterThan(0);
      
      // Zivil Appeal muss doppelt so hoch sein wie Base
      if (col === 'zivil' && appeal) {
          const baseRes = calculateFees(val, 'TP3A', col, false, 1, false, false, false, true);
          expect(res.courtFee).toBe(baseRes.courtFee * 2);
      }
  });

  // 6. Genossenzuschlag (10%)
  it('Calculates Genossenzuschlag correctly', () => {
      // 1000 CHF TP3A = 238 Base
      // EHS 50% = 119
      // Subtotal = 357
      // Zuschlag 10% = 35.7
      const res = calculateFees(1000, 'TP3A', undefined, false, 1, true, true, false, false);
      expect(res.surchargeAmount).toBe(35.7);
      expect(res.netTotal).toBe(357 + 35.7);
  });

});