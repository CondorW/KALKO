// =====================================================
// LIECHTENSTEIN RATG/RATV 2025 – DIE WAFFE (v3)
// Bei jedem Fail: Vollständige Forensik + Gesetzesbeleg
// =====================================================

import { describe, test, expect } from 'vitest';
import { calculateFees } from './logic';
import type { FeeResult } from './logic';

interface TestCase {
  name: string;
  value: number;
  type: any;
  gkgColumn?: any;
  isAppeal: boolean;
  multiplier: number;
  hasUnitRate: boolean;
  hasSurcharge: boolean;
  isForeign: boolean;
  includeCourtFee: boolean;
  expected: Partial<FeeResult> & { note?: string; law?: string };
}

const run = (cases: TestCase[]) => {
  cases.forEach(c => {
    test(c.name, () => {
      const result = calculateFees(
        c.value,
        c.type,
        c.gkgColumn,
        c.isAppeal,
        c.multiplier,
        c.hasUnitRate,
        c.hasSurcharge,
        c.isForeign,
        c.includeCourtFee
      );

      const fail = (field: keyof FeeResult, actual: number, expected: number) => {
        const diff = Math.abs(actual - expected);
        throw new Error(`
          GERICHTSFESTER FEHLER GEFUNDEN
          Test: ${c.name}
          Eingabe:
            Streitwert: ${c.value.toLocaleString('de-CH')} CHF
            Tarifpost: ${c.type}
            Parteien: ${c.multiplier}
            Einheitssatz: ${c.hasUnitRate}
            Gericht: ${c.includeCourtFee ? c.gkgColumn : 'nein'}
            Berufung: ${c.isAppeal}
          Feld: ${field}
          Deine App: ${actual.toFixed(2)} CHF
          Gesetzlich korrekt: ${expected.toFixed(2)} CHF
          Abweichung: ${diff.toFixed(2)} CHF
          Gesetz: ${c.expected.law || 'RATV/RATG'}
          Hinweis: ${c.expected.note || 'Unbekannter Fehler'}
          → Fix erforderlich!
        `.replace(/^\s+/gm, ''));
      };

      // Automatische Prüfung aller relevanten Felder
      if (c.expected.baseFee !== undefined && Math.abs(result.baseFee - c.expected.baseFee) > 0.02)
        fail('baseFee', result.baseFee, c.expected.baseFee);
      if (c.expected.unitRateAmount !== undefined && Math.abs(result.unitRateAmount - c.expected.unitRateAmount) > 0.02)
        fail('unitRateAmount', result.unitRateAmount, c.expected.unitRateAmount);
      if (c.expected.courtFee !== undefined && Math.abs(result.courtFee - c.expected.courtFee) > 0.02)
        fail('courtFee', result.courtFee, c.expected.courtFee);
      if (c.expected.netTotal !== undefined && Math.abs(result.netTotal - c.expected.netTotal) > 0.02)
        fail('netTotal', result.netTotal, c.expected.netTotal);
      if (c.expected.grossTotal !== undefined && Math.abs(result.grossTotal - c.expected.grossTotal) > 0.02)
        fail('grossTotal', result.grossTotal, c.expected.grossTotal);

      // Alles korrekt → stiller Erfolg
      expect(true).toBe(true);
    });
  });
};

// =====================================================
// DIE TÖDLICHEN 12 – JEDER FAIL = SOFORTIGE DIAGNOSE
// =====================================================

describe('LIECHTENSTEIN RATG/RATV – FORENSIK-TESTS', () => {
  run([
    {
      name: '01 – Einheitssatz: exakt 15.000 CHF → 50% (nicht 40%)',
      value: 15000,
      type: 'TP3A',
      gkgColumn: 'zivil',
      isAppeal: false,
      multiplier: 1,
      hasUnitRate: true,
      hasSurcharge: false,
      isForeign: false,
      includeCourtFee: false,
      expected: {
        baseFee: 713.00,
        unitRateAmount: 356.50,  // 713 × 0.50
        netTotal: 1069.50,
        law: 'Art. 23 Abs. 4 RATG: "bis einschließlich 15 000 Franken 50 %"',
        note: 'Deine App nutzt < statt <= → FALSCH!'
      }
    },
    {
      name: '02 – Gerichtsgebühr ab 1.000.000 CHF: 1,8% fix',
      value: 2000000,
      type: 'TP3A',
      gkgColumn: 'zivil',
      isAppeal: false,
      multiplier: 1,
      hasUnitRate: false,
      hasSurcharge: false,
      isForeign: false,
      includeCourtFee: true,
      expected: {
        courtFee: 36000.00,
        law: '§ 3 GGG: ab 1 Mio = 1,8% des Streitwerts (keine Staffel mehr)',
        note: 'Deine Tabelle REF_GKG bricht bei 1 Mio ab → falsch!'
      }
    },
    {
      name: '03 – TP1 Hard Cap bei 1.426 CHF',
      value: 10000000,
      type: 'TP1',
      isAppeal: false,
      multiplier: 1,
      hasUnitRate: false,
      hasSurcharge: false,
      isForeign: false,
      includeCourtFee: false,
      expected: {
        baseFee: 1426.00,
        law: 'RATV Tarifpost 1 IV: "jedoch insgesamt nie mehr als Fr. 1 426.-"',
        note: 'Cap muss ABSOLUT sein – auch bei 0,05‰ ab 5 Mio!'
      }
    },
    {
      name: '04 – TP6 Kaskade: TP5 → ×2 → dann Cap 330',
      value: 100000,
      type: 'TP6',
      isAppeal: false,
      multiplier: 1,
      hasUnitRate: false,
      hasSurcharge: false,
      isForeign: false,
      includeCourtFee: false,
      expected: {
        baseFee: 200.00,
        law: 'RATV Seite 9: TP6 = TP5 × 2, dann min(..., 330)',
        note: 'Reihenfolge entscheidend!'
      }
    },
    {
      name: '05 – Art. 15 RATG: 3 Parteien = +20% auf Basis + Einheitssatz',
      value: 100000,
      type: 'TP3A',
      gkgColumn: 'zivil',
      isAppeal: false,
      multiplier: 3,
      hasUnitRate: true,
      hasSurcharge: false,
      isForeign: false,
      includeCourtFee: false,
      expected: {
        baseFee: 1425.60,      // 1188 × 1.20
        unitRateAmount: 570.24, // 1425.60 × 0.40
        netTotal: 1995.84,
        law: 'Art. 15 RATG: Zuschlag auf Verdienstsumme vor Einheitssatz',
        note: 'Einheitssatz wird vom erhöhten Betrag berechnet!'
      }
    },
    {
      name: '06 – TP3A Cap 43.200 auch bei 100 Mio Streitwert',
      value: 100000000,
      type: 'TP3A',
      isAppeal: false,
      multiplier: 1,
      hasUnitRate: false,
      hasSurcharge: false,
      isForeign: false,
      includeCourtFee: false,
      expected: {
        baseFee: 43200.00,
        law: 'RATV Tarifpost 3A: "maximal Fr. 43 200.-"',
        note: 'Hard Cap hat Vorrang vor allen Prozentsätzen!'
      }
    }
  ]);
});