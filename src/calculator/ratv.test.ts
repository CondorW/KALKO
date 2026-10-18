import { describe, expect, test } from 'vitest';
import { calculatePosition, sumResults } from './engine';
import { DEFAULT_CASE, createFeeInput, type FeeInput } from './types';
import { feeNoteTables } from './fee-note';

const date = '2026-10-18';
const fee = (overrides: Partial<FeeInput> = {}) => calculatePosition({ ...createFeeInput(date), ...overrides }, DEFAULT_CASE);

// Unabhängige Fälle aus RATV (LR 173.511.1, Fassung 01.01.2021)
// und RATG (LR 173.511, Art. 11/15/23), nicht aus der Excel-Referenz abgeleitet.
describe('RATV: begonnene Zeitabschnitte', () => {
  test.each([[.01, 792], [.5, 792], [1, 792], [1.01, 1188], [1.99, 1188], [2, 1188], [2.01, 1584]])(
    'TP3A, %s Stunden: %s CHF Grundhonorar', (units, base) => expect(fee({ kind: 'TS', units }).baseFee).toBe(base));
  test.each([[.01, 200], [1, 200], [1.01, 400], [2, 400]])(
    'TP7 2, %s halbe Stunden: %s', (units, base) => expect(fee({ type: 'TP7 2', units }).baseFee).toBe(base));
  test.each([[.01, 165], [1, 165], [1.01, 330]])(
    'TP8 1, %s halbe Stunden: %s', (units, base) => expect(fee({ type: 'TP8 1', units }).baseFee).toBe(base));
  test.each([[.01, 75], [1, 75], [1.01, 150]])(
    'TP9, %s Stunden: %s, kein ES/SG', (units, base) => {
      const result = calculatePosition({ ...createFeeInput(date), type: 'TP9', units }, { ...DEFAULT_CASE, representedParties: 3 });
      expect(result.baseFee).toBe(base);expect(result.unitRateAmount).toBe(0);expect(result.surchargeAmount).toBe(0);
    });
  test('TP8 2: weniger als 10 Minuten, 40% und eigener Höchstbetrag', () => {
    expect(fee({ type: 'TP8 2', units: 9.99 }).baseFee).toBe(66);
    expect(() => fee({ type: 'TP8 2', units: 10 })).toThrow(/10 Minuten/);
    expect(calculatePosition({ ...createFeeInput(date), type: 'TP8 2', units: 5 }, { ...DEFAULT_CASE, value: 1e8 }).baseFee).toBe(240);
  });
  test('Nullzeit erzeugt kein Honorar und keine Zuschläge', () => {
    for (const type of ['TP3A', 'TP7 2', 'TP8 1', 'TP8 2', 'TP9'] as const) expect(fee({ type, units: 0 }).netTotal).toBe(0);
  });
  test('Schreiben sind Stückzahlen; ungültige TS/Tarifkombinationen blockieren', () => {
    expect(() => fee({ type: 'TP5', units: 1.5 })).toThrow(/ganzzahlig/);
    expect(() => fee({ type: 'TP1', kind: 'TS' })).toThrow(/Tagsatzung/);
  });
});

describe('RATG Art. 15 und 23: Zuschlagsbasis', () => {
  test.each(['TP5', 'TP5i', 'TP6', 'TP6i', 'TP8', 'TP8 1', 'TP8 2', 'TP9', 'FIX'] as const)(
    '%s ohne eigenen Einheitssatz', type => expect(fee({ type, manualFee: type === 'FIX' ? 100 : null }).unitRateAmount).toBe(0));
  test('Doppelter ES nur bei berechtigtem Leistungstyp; Aktvorgabe wird nicht doppelt kumuliert', () => {
    expect(fee({ doubleUnitRate: true }).config.ehsLabel).toBe('40%');
    const result = calculatePosition({ ...createFeeInput(date), kind: 'TS', doubleUnitRate: true }, { ...DEFAULT_CASE, doubleUnitRate: true });
    expect(result.config.ehsLabel).toBe('80%');
  });
  test('Verbindungszuschlag erhöht erst den Schriftsatz, dann ES, dann SG, dann Steuer', () => {
    const result = calculatePosition({ ...createFeeInput(date), connected: true, expenses: 100, includeCourtFee: true },
      { ...DEFAULT_CASE, representedParties: 2, opposingParties: 2 });
    // 792 * 1.25 = 990; ES 396; SG 15% von 1386 = 207.9; USt von 1593.9.
    expect(result.baseFee).toBe(990);expect(result.unitRateAmount).toBe(396);
    expect(result.surchargeAmount).toBeCloseTo(207.9);expect(result.vatAmount).toBeCloseTo(129.1059);
    expect(result.grossTotal).toBeCloseTo(2673.0059);
    expect(fee({ connected: true, connectionPercent: 10 }).baseFee).toBeCloseTo(871.2);
    expect(() => fee({ kind: 'TS', connected: true })).toThrow(/Verbindungszuschlag/);
  });
  test('SG-Grenze 50%, Null-Override, Steuersatz-Grenze', () => {
    expect(fee({ surchargePercent: 50 }).surchargeAmount).toBe(554.4);
    expect(fee({ surchargePercent: 0 }).surchargeAmount).toBe(0);
    expect(() => fee({ surchargePercent: 50.01 })).toThrow(/50%/);
    expect(() => fee({ vatPercent: 101 })).toThrow(/100%/);
  });
  test('Strafsachen: gesetzlicher Streitwert, ES und SG werden berücksichtigt', () => {
    const result = calculatePosition({ ...createFeeInput(date), type: 'TP4 I 1' },
      { ...DEFAULT_CASE, procedure: 'privateProsecution', offence: 'misdemeanour', representedParties: 2 });
    // Gesetzliche Basis 5000 => 50% ES; 375 + 187.5; SG 10% => 56.25.
    expect(result.baseFee).toBe(375);expect(result.unitRateAmount).toBe(187.5);expect(result.surchargeAmount).toBe(56.25);
  });
  test.each([[.1, 750], [1, 750], [1.1, 1125], [2.1, 1500]])(
    'TP4 I 4: %s halbe Stunden = %s', (units, expected) => {
      const result = calculatePosition({ ...createFeeInput(date), type: 'TP4 I 4', kind: 'TS', units }, { ...DEFAULT_CASE, procedure: 'privateProsecution' });
      expect(result.baseFee).toBe(expected);
    });
  test('Kostenbeschwerde benötigt den strittigen Kostenbetrag; manuelles Honorar umgeht keine Verfahrensprüfung', () => {
    const input = { ...createFeeInput(date), type: 'TP4 I 3d' as const };
    expect(() => calculatePosition(input, { ...DEFAULT_CASE, procedure: 'privateProsecution' })).toThrow(/Kostenbetrag/);
    expect(calculatePosition({ ...input, value: 500 }, { ...DEFAULT_CASE, procedure: 'privateProsecution' }).baseFee).toBe(80);
    expect(() => fee({ type: 'TP4 I 1', manualFee: 100 })).toThrow(/Strafverfahren/);
  });
  test('Ziviltarife und offene Zivilszenarien werden nicht als Strafhonorar verrechnet', () => {
    expect(() => calculatePosition(createFeeInput(date), { ...DEFAULT_CASE, procedure: 'privateProsecution' })).toThrow(/TP4/);
    expect(() => calculatePosition({ ...createFeeInput(date), type: 'TP4 I 1', kind: 'OTS' }, { ...DEFAULT_CASE, procedure: 'privateProsecution' })).toThrow(/TP4/);
  });
  test('Straf-Schriftsätze sind Stückzahlen, keine halben Stunden', () => {
    expect(() => calculatePosition({ ...createFeeInput(date), type: 'TP4 I 1', units: 1.1 }, { ...DEFAULT_CASE, procedure: 'privateProsecution' })).toThrow(/ganzzahlig/);
  });
});

describe('Neues Kostenverzeichnis: keine doppelte Erhöhung', () => {
  const input = { ...createFeeInput(date), expenses: 100, includeCourtFee: true };
  const rows = (settings = DEFAULT_CASE) => [{ id: '1', label: 'Klage', description: '', input, details: calculatePosition(input, settings) }];
  test('Leistungszeile enthält Grundhonorar und Zusammenfassung die verlangte Reihenfolge', () => {
    const table = feeNoteTables(DEFAULT_CASE, rows())[0];
    expect(table.headers).toEqual(['Datum', 'Leistung', 'Tarif', 'Netto']);
    expect(table.rows[0].cells.at(-1)).toBe('792.00');
    expect(table.rows.find(row => row.cells[1].startsWith('Einheitssatz'))?.cells.at(-1)).toBe('316.80');
    const totals = table.rows.filter(row => row.kind === 'total');
    expect(totals.map(row => row.cells[1])).toEqual(['Total Netto', 'Total USt', 'Total Gesamt']);
    expect(totals.map(row => row.cells[3])).toEqual(["2'058.80", '89.81', "2'148.61"]);
  });
  test('gemischte ES-/Steuersätze und steuerfreie Leistungen werden positionsgenau zusammengefasst', () => {
    const list = [...rows()];
    for (const [index, options] of [{ value: 10000, vatPercent: 7.7 }, { type: 'TP8 1' as const, vatPercent: 0 }, { value: 50000, surchargePercent: 10 }].entries()) {
      const variant = { ...input, includeCourtFee: false, expenses: 0, ...options };
      list.push({ id: String(index + 2), label: 'Leistung', description: '', input: variant, details: calculatePosition(variant, DEFAULT_CASE) });
    }
    const table = feeNoteTables(DEFAULT_CASE, list)[0];
    const summary = table.rows.filter(row => row.kind === 'adjustment');
    expect(summary.filter(row => row.cells[1].startsWith('Einheitssatz'))).toHaveLength(2);
    expect(summary.filter(row => row.cells[1].startsWith('USt'))).toHaveLength(2);
    // Rohbeträge + ES + SG ergeben die steuerpflichtigen Honorare, nicht nochmals Zuschläge auf diese Summe.
    const totals = sumResults(list.map(row => row.details));
    expect(totals.netTotal).toBeCloseTo(1108.8 + 714 + 165 + 1219.68);
    expect(totals.vatAmount).toBeCloseTo(89.8128 + 54.978 + 98.79408);
  });
});

// Direkt aus der amtlichen RATV abgelesene Standardansätze, unabhängig von
// workbook-reference.ts und den Produktionstabellen. Jeder Stufenübergang
// wird unmittelbar darunter, an der Grenze und unmittelbar darüber geprüft.
const statutoryLimits = [500, 1000, 1500, 2500, 5000, 10000, 15000, 25000, 50000, 75000, 100000, 140000];
const statutoryFees = {
  TP1: [17, 25, 32, 37, 40, 49, 64, 72, 80, 96, 119, 159],
  TP2: [80, 119, 159, 175, 198, 238, 317, 357, 396, 476, 594, 792],
  TP3A: [159, 238, 317, 349, 396, 476, 634, 713, 792, 951, 1188, 1584],
  TP3B: [198, 297, 396, 436, 495, 594, 792, 891, 990, 1188, 1485, 1980],
  TP3C: [238, 357, 476, 524, 594, 713, 951, 1070, 1188, 1426, 1782, 2376],
} as const;
const statutoryCases = Object.entries(statutoryFees).flatMap(([type, fees]) => statutoryLimits.flatMap((limit, index) => [
  { type, value: limit - .01, fee: fees[index] }, { type, value: limit, fee: fees[index] },
  ...(index < fees.length - 1 ? [{ type, value: limit + .01, fee: fees[index + 1] }] : []),
]));
describe('Amtliche RATV: unabhängige Standardtabellen und Sicherheitsgrenzen', () => {
  test.each(statutoryCases)('$type / $value = $fee', ({ type, value, fee: expected }) => {
    expect(calculatePosition({ ...createFeeInput(date), type: type as FeeInput['type'], hasUnitRate: false }, { ...DEFAULT_CASE, value }).baseFee).toBe(expected);
  });
  test.each([
    ['TP1', 500000, 465], ['TP1', 5000000, 915], ['TP1', 1e9, 1426],
    ['TP2', 500000, 2232], ['TP2', 5000000, 4482], ['TP2', 1e9, 7128],
    ['TP3A', 500000, 4446], ['TP3A', 5000000, 8946], ['TP3A', 1e9, 43200],
    ['TP3B', 500000, 5544], ['TP3B', 5000000, 11169], ['TP3B', 1e9, 54000],
    ['TP3C', 500000, 6660], ['TP3C', 5000000, 13410], ['TP3C', 1e9, 64800],
  ] as const)('%s / %s = %s', (type, value, expected) => {
    expect(calculatePosition({ ...createFeeInput(date), type, hasUnitRate: false }, { ...DEFAULT_CASE, value }).baseFee).toBe(expected);
  });
  test('mehrere Schriftsätze werden gezählt und Summenüberläufe blockiert', () => {
    expect(fee({ units: 2 }).baseFee).toBe(1584);
    const large = fee({ type: 'FIX', manualFee: 1e308, vatPercent: 0 });
    expect(() => sumResults([large, large])).toThrow(/Kostensumme/);
  });
});
