import { describe, test, expect } from 'vitest';
import { calculateFees } from './logic';
import { DEFAULT_CASE, createFeeInput } from './calculator/types';
import { calculatePosition, hearingScenarios, sumResults, additionalHearingHour } from './calculator/engine';
import { partySurcharge } from './calculator/court-fees';
import { calculateEstimate, createEstimate } from './calculator/estimate';
import { feeNoteText } from './calculator/fee-note';
import { WORKBOOK_REFERENCE } from './calculator/workbook-reference';

const raw = (value: number, type = 'TP3A' as ReturnType<typeof createFeeInput>['type']) =>
  calculatePosition({ ...createFeeInput('2024-01-01'), type, hasUnitRate: false }, { ...DEFAULT_CASE, value });

describe('Excel V4.2.0 – originale Tarifzellen und gespeicherte Referenzergebnisse', () => {
  test.each(WORKBOOK_REFERENCE)('$source bei $value ($country)', reference => {
    const result = calculatePosition({ ...createFeeInput(reference.date), type: reference.type, hasUnitRate: false },
      { ...DEFAULT_CASE, country: reference.country, value: reference.value });
    expect(result.baseFee).toBeCloseTo(reference.fee, 7);
  });
});

describe('Tarifgrenzen und eigenständige Deckel', () => {
  test.each([
    [140000, 'TP1', 159], [140000.01, 'TP1', 176], [160000, 'TP1', 176], [160000.01, 'TP1', 193],
    [500000, 'TP3A', 4446], [500000.01, 'TP3A', 4446.00001], [5000000, 'TP3A', 8946],
    [5000000.01, 'TP3A', 8946.000005], [1e9, 'TP3A', 43200],
    [100000, 'TP5', 100], [100000, 'TP6', 202], [1e8, 'TP6', 330],
    [1e8, 'TP5i', 150], [1e8, 'TP6i', 495], [1e8, 'TP7 1', 220], [1e8, 'TP7 2', 440],
    [25000, 'TP8 1', 135], [25000.01, 'TP8 1', 150], [1e8, 'TP8 1', 600],
  ] as const)('%s / %s ergibt %s', (value, type, fee) => expect(raw(value, type).baseFee).toBeCloseTo(fee, 7));

  test.each([[34820, 943.3], [34820.01, 978.4], [36340, 978.4], [36340.01, 978.40001], [363360, 1305.42], [363360.01, 1305.420005]])(
    'AUT TP3A Grenze %s', (value, fee) => {
      expect(calculatePosition({ ...createFeeInput('2025-01-01'), hasUnitRate: false }, { ...DEFAULT_CASE, country: 'AUT', value }).baseFee).toBeCloseTo(fee, 7);
    });
});

describe('ES, Parteien, Datum, Zeit und Barauslagen', () => {
  test.each([[1, 1, 0], [2, 1, 10], [2, 2, 15], [3, 3, 25], [10, 10, 50]])(
    'Parteien %s + %s = %s%%', (represented, opposing, rate) => expect(partySurcharge(represented, opposing)).toBe(rate));
  test.each([['LIE', 15000, 50], ['LIE', 15000.01, 40], ['AUT', 10170, 60], ['AUT', 10170.01, 50]] as const)(
    'ES %s bei %s = %s%%', (country, value, rate) => {
      expect(calculatePosition(createFeeInput('2025-01-01'), { ...DEFAULT_CASE, country, value }).config.ehsLabel).toBe(`${rate}%`);
    });
  test('doppelter ES der Tagsatzung, Parteien und durchlaufende Auslagen', () => {
    const result = calculatePosition({ ...createFeeInput('2024-01-01'), kind: 'TS', doubleUnitRate: true, expenses: 100, includeCourtFee: true },
      { ...DEFAULT_CASE, representedParties: 2, opposingParties: 2 });
    expect(result.baseFee).toBe(792);
    expect(result.unitRateAmount).toBeCloseTo(633.6);
    expect(result.surchargeAmount).toBeCloseTo(213.84);
    expect(result.netTotal).toBeCloseTo(1639.44);
    expect(result.vatAmount).toBeCloseTo(132.79464);
    expect(result.courtFee).toBe(850);
    expect(result.grossTotal).toBeCloseTo(2722.23464);
  });
  test('Null-Übersteuerungen bleiben wirksam; Verdoppelungen kumulieren nicht', () => {
    const result = calculatePosition({ ...createFeeInput('2024-01-01'), value: 0, kind: 'TS', doubleUnitRate: true, surchargePercent: 0, vatPercent: 0, manualFee: 0, includeCourtFee: true, manualCourtFee: 0 },
      { ...DEFAULT_CASE, doubleUnitRate: true, representedParties: 5 });
    expect(result.config.ehsLabel).toBe('100%');
    expect(result.grossTotal).toBe(0);
  });
  test('Steuerwechsel zum 01.01.2024 und manuelle Priorität', () => {
    expect(calculatePosition(createFeeInput('2023-12-31'), DEFAULT_CASE).config.vatPercent).toBe(7.7);
    expect(calculatePosition(createFeeInput('2024-01-01'), DEFAULT_CASE).config.vatPercent).toBe(8.1);
    expect(calculatePosition(createFeeInput('2024-01-01'), { ...DEFAULT_CASE, vatPercent: 0 }).vatAmount).toBe(0);
  });
  test('TS-Stundenfaktor und direkte TP7/TP8-Einheiten', () => {
    expect(calculatePosition({ ...createFeeInput('2024-01-01'), kind: 'TS', units: 4 }, DEFAULT_CASE).baseFee).toBe(1980);
    expect(calculatePosition({ ...createFeeInput('2024-01-01'), kind: 'TS', units: 0 }, DEFAULT_CASE).baseFee).toBe(0);
    expect(calculatePosition({ ...createFeeInput('2024-01-01'), type: 'TP7 2', units: 3 }, DEFAULT_CASE).baseFee).toBe(600);
  });
  test('alle Eingabegruppen und gemischte Steuersätze werden vollständig summiert', () => {
    const results = Array.from({ length: 45 }, (_, index) => calculatePosition(createFeeInput(index % 2 ? '2023-12-31' : '2024-01-01'), DEFAULT_CASE));
    const sum = sumResults(results);
    expect(sum.netTotal).toBeCloseTo(45 * 1108.8, 7);
    expect(sum.vatAmount).toBeCloseTo(23 * 1108.8 * .081 + 22 * 1108.8 * .077, 7);
    expect(sum.grossTotal).toBeCloseTo(sum.netTotal + sum.vatAmount, 7);
  });
  test('OTS wird ausgeschlossen, zeigt Alternativen und verändert die Originalposition nicht', () => {
    const input = { ...createFeeInput('2024-01-01'), kind: 'OTS' as const, units: 3 };
    expect(calculatePosition(input, DEFAULT_CASE).grossTotal).toBe(0);
    const rows = hearingScenarios(input, DEFAULT_CASE);
    expect(rows).toHaveLength(8);
    expect(rows.filter(row => row.type === 'TP3A').map(row => row.units)).toEqual([1, 3, 4, 5]);
    expect(rows[0].result.baseFee).toBe(396);
    expect(input.kind).toBe('OTS');
  });
  test('weitere Stunde TP3A wird als konkreter Mehrbetrag im Export gezeigt', () => {
    const input = { ...createFeeInput('2024-01-01'), kind: 'OTS' as const };
    const result = additionalHearingHour(input, DEFAULT_CASE);
    expect(result.baseFee).toBe(396);
    expect(result.grossTotal).toBeCloseTo(599.3064, 7);
    const text = feeNoteText(DEFAULT_CASE, [{ id: '1', label: 'OTS', description: '', input, details: calculatePosition(input, DEFAULT_CASE) }]);
    expect(text).toContain('Weitere Stunde TP3A');
    expect(text).toContain('TP3A | 4 |');
  });
});

describe('Strafverfahren und Gerichtsgebühren', () => {
  test.each([['TP4 I 1', 'infraction', 150], ['TP4 I 2 2.F', 'misdemeanour', 187.5], ['TP4 I 3a', 'misdemeanour', 93.75], ['TP4 I 3d', 'misdemeanour', 375], ['TP4 II 1', 'felony', 750], ['TP4 II 5', 'felony', 2250]] as const)(
    '%s / %s = %s mit gesetzlichem ES und Genossenzuschlag', (type, offence, fee) => {
      const result = calculatePosition({ ...createFeeInput('2024-01-01'), type, ...(type.endsWith('3d') ? { value: 50000 } : {}) }, { ...DEFAULT_CASE, procedure: type.startsWith('TP4 II') ? 'civilClaim' : 'privateProsecution', offence, representedParties: 3 });
      expect(result.baseFee).toBe(fee);
      const esRate = type.endsWith('3d') || offence === 'felony' ? .4 : .5;
      expect(result.unitRateAmount).toBeCloseTo(fee * esRate);
      expect(result.surchargeAmount).toBeCloseTo(fee * (1 + esRate) * .15);
    });
  test.each([[100, 'ausserstreit', 30], [1000000, 'zivil', 5500], [2000000, 'zivil', 7000], [2000000, 'exekution', 3400], [10000001, 'zivil', 19000]] as const)(
    'vollständige LIE-Tabelle %s / %s = %s', (value, column, fee) => {
      expect(calculatePosition({ ...createFeeInput('2024-01-01'), includeCourtFee: true, gkgColumn: column }, { ...DEFAULT_CASE, value }).courtFee).toBe(fee);
    });
  test.each([[5000, 'schuld', 50], [5000.01, 'schuld', 125], [50000.01, 'schuld', 540], [50000, 'zivil', 1700]] as const)(
    'bestehender LIE-Rechtsmittelfaktor %s / %s', (value, column, fee) => {
      expect(calculatePosition({ ...createFeeInput('2024-01-01'), includeCourtFee: true, isAppeal: true, gkgColumn: column }, { ...DEFAULT_CASE, value }).courtFee).toBe(fee);
    });
  test.each([
    ['2025-03-30', 'TP1', 150, 25], ['2025-03-31', 'TP1', 150, 31],
    ['2025-03-31', 'TP1', 150.01, 59], ['2025-03-31', 'TP2', 1000, 189],
    ['2025-03-31', 'TP1', 350001, 6964.012], ['2025-03-31', 'TP2', 350001, 10106.018],
    ['2025-03-31', 'TP3a', 350001, 13477.024], ['2025-03-31', 'TP3b', 1, 7239],
  ] as const)('AUT $%s / %s bei %s = %s', (date, court, value, fee) => {
    const result = calculatePosition({ ...createFeeInput(date), includeCourtFee: true, austrianCourt: court }, { ...DEFAULT_CASE, country: 'AUT', value });
    expect(result.courtFee).toBeCloseTo(fee, 7);
  });
  test('AUT-Gerichtsgebühr erhöht sich mit Aktparteien, nicht mit Honorar-Override', () => {
    const result = calculatePosition({ ...createFeeInput('2025-03-31'), includeCourtFee: true, surchargePercent: 0 }, { ...DEFAULT_CASE, country: 'AUT', representedParties: 2 });
    expect(result.courtFee).toBeCloseTo(1914 * 1.1, 7);
  });
});

describe('Stundenbasierte Schätzungen: Excel-Ausgangswerte und neue Eingaben', () => {
  test.each([['activeDE', 390, 44120, 108], ['activeEN', 390, 43680, 112], ['passive', 550, 250750, 201]] as const)(
    '%s: Stundensatz %s, Gesamtsumme %s', (template, rate, total, firstHours) => {
      const result = calculateEstimate(createEstimate(template));
      expect(result.hourlyRate).toBe(rate);
      expect(result.total).toBe(total);
      expect(result.instances[0].hours).toBe(firstHours);
    });
  test('alle vormals fest eingetragenen Stundenbeträge reagieren auf neue Sätze', () => {
    const input = createEstimate('activeDE');
    input.roles[0].rate = 1000;
    input.roles[0].discount = 20;
    input.successPercent = 10;
    input.instances[2].successLumpSum = 125;
    input.phases[15].tasks[0].hours = 2;
    const result = calculateEstimate(input);
    expect(result.hourlyRate).toBe(460);
    expect(result.instances[0].fees).toBe(108 * 460);
    expect(result.instances[2].success).toBe(92 + 125);
    expect(result.instances[2].total).toBe(920 + 92 + 125);
    expect(createEstimate('activeDE').roles[0].rate).toBe(500);
  });
});

describe('Validierung, Export und bestehende Schnittstelle', () => {
  test.each([NaN, Infinity, -1])('ungültiger Streitwert %s', value => {
    expect(() => calculatePosition(createFeeInput('2024-01-01'), { ...DEFAULT_CASE, value })).toThrow();
  });
  test.each(['', '2024-02-30', '2023-02-29', 'not-a-date'])('ungültiges Leistungsdatum %s', date => {
    expect(() => calculatePosition(createFeeInput(date), DEFAULT_CASE)).toThrow();
  });
  test('fehlende Tarife werden nicht zu Null', () => {
    expect(calculatePosition({ ...createFeeInput('2024-01-01'), type: 'TP9' }, DEFAULT_CASE).baseFee).toBe(75);
    expect(() => calculatePosition({ ...createFeeInput('2024-01-01'), type: 'TP5' }, { ...DEFAULT_CASE, country: 'AUT' })).toThrow();
    expect(() => calculatePosition({ ...createFeeInput('2024-01-01'), includeCourtFee: true, austrianCourt: 'TP4' }, { ...DEFAULT_CASE, country: 'AUT' })).toThrow();
  });
  test('manuelle Beträge lösen fehlende AUT-Tarife ausdrücklich auf', () => {
    const result = calculatePosition({ ...createFeeInput('2024-01-01'), type: 'TP5', manualFee: 50, hasUnitRate: false, includeCourtFee: true, austrianCourt: 'TP4', manualCourtFee: 99 }, { ...DEFAULT_CASE, country: 'AUT' });
    expect(result.baseFee).toBe(50);
    expect(result.vatAmount).toBe(10);
    expect(result.grossTotal).toBe(159);
  });
  test('TP4-Familie und zulässige Delikte werden geprüft', () => {
    expect(() => calculatePosition({ ...createFeeInput('2024-01-01'), type: 'TP4 I 1' }, DEFAULT_CASE)).toThrow();
    expect(() => calculatePosition({ ...createFeeInput('2024-01-01'), type: 'TP4 II 1' }, { ...DEFAULT_CASE, procedure: 'privateProsecution' })).toThrow();
    expect(() => calculatePosition({ ...createFeeInput('2024-01-01'), type: 'TP4 I 1' }, { ...DEFAULT_CASE, procedure: 'privateProsecution', offence: 'felony' })).toThrow();
  });
  test('endliche Überlaufeingaben und ungültige Parteianzahlen bleiben Fehler', () => {
    expect(() => calculatePosition({ ...createFeeInput('2024-01-01'), manualFee: Number.MAX_VALUE }, DEFAULT_CASE)).toThrow();
    expect(() => calculatePosition(createFeeInput('2024-01-01'), { ...DEFAULT_CASE, representedParties: 1.5 })).toThrow();
  });
  test('alte API: Multiplikator, steuerfreie GKG, TP9 und negative Werte', () => {
    const result = calculateFees(50000, 'TP3A', 'zivil', false, 2, true, true, true, true);
    expect(result.baseFee).toBe(1584);
    expect(result.vatAmount).toBe(0);
    expect(result.courtFee).toBe(850);
    expect(result.grossTotal).toBe(result.netTotal + result.courtFee);
    expect(calculateFees(-5, 'TP1', undefined, false, 1, false, false, true, false).baseFee).toBe(17);
    expect(calculateFees(1, 'TP9', undefined, false, 1, false, false, true, false).baseFee).toBe(75);
  });
  test('Kostenverzeichnis enthält Datum, variable Zuschläge, Währung und vollständige Gesamtsumme', () => {
    const settings = { ...DEFAULT_CASE, currency: 'EUR' as const, language: 'EN' as const, client: 'Client <example>' };
    const input = { ...createFeeInput('2024-01-01'), expenses: 100 };
    const text = feeNoteText(settings, [{ id: '1', label: 'Claim', description: '', input, details: calculatePosition(input, settings) }]);
    expect(text).toContain('FEE NOTE');
    expect(text).toContain('2024-01-01');
    expect(text).not.toContain('Client <example>');
    expect(text).toContain('Grand total');
    expect(text).toContain('Cash expenses');
    expect(text).toMatch(/€|EUR/);
  });
  test('reproduzierbare Monotonie und Buchhaltung auf 5000 Streitwerten', () => {
    let state = 42;
    const values = Array.from({ length: 5000 }, () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 2 ** 32 * 100000000;
    }).sort((a, b) => a - b);
    let previous = 0;
    for (const value of values) {
      const result = raw(value);
      expect(result.baseFee).toBeGreaterThanOrEqual(previous);
      expect(result.grossTotal).toBeCloseTo(result.netTotal + result.vatAmount + result.courtFee + result.expenses, 6);
      previous = result.baseFee;
    }
  });
});
