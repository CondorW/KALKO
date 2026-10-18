import { baseFee, tariffVersion, timeFactor, usesHalfHourUnits } from './tariffs';
import { courtFee, partySurcharge } from './court-fees';
import { isCriminal, type CalculationResult, type CaseSettings, type FeeInput } from './types';
import { assessmentValue, allowsUnitRate, allowsDoubleUnitRate, connectionRate, isCriminalHearing } from './rules';

export function nonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} muss eine endliche Zahl ab 0 sein.`);
  return value;
}

export function validateDate(date: string): void {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error('Bitte ein gültiges Leistungsdatum eingeben.');
  }
}

export function validateSettings(settings: CaseSettings): void {
  nonNegative(settings.value, 'Bemessungsgrundlage');
  for (const count of [settings.representedParties, settings.opposingParties]) {
    if (!Number.isSafeInteger(count) || count < 1) throw new Error('Die Parteianzahlen müssen ganze Zahlen ab 1 sein.');
  }
  if (settings.vatPercent !== null) nonNegative(settings.vatPercent, 'Umsatzsteuer');
}

/** Eingabe!L10: manuelle Steuer hat Vorrang, danach Land und Leistungsdatum. */
export function vatPercent(date: string, settings: CaseSettings, override: number | null = null): number {
  return override ?? settings.vatPercent ?? (settings.country === 'AUT' ? 20 : date < '2024-01-01' ? 7.7 : 8.1);
}

/**
 * Ein Berechnungspfad für Vorschau, gespeicherte Position, Druck und OTS-Szenario.
 * Zwischenbeträge werden wie in Excel nicht auf Cent gerundet. Die Darstellung
 * rundet erst mit Intl.NumberFormat; dadurch entstehen keine kumulierten Tariffehler.
 */
export function calculatePosition(input: FeeInput, settings: CaseSettings): CalculationResult {
  validateSettings(settings);
  validateDate(input.date);
  const value = nonNegative(assessmentValue(input, settings), 'Streitwert');
  nonNegative(input.units, 'Einheiten');
  nonNegative(input.expenses, 'Barauslagen');
  for (const amount of [input.vatPercent, input.surchargePercent, input.manualFee, input.manualCourtFee]) {
    if (amount !== null) nonNegative(amount, 'Abweichender Betrag / Prozentsatz');
  }
  const lie = settings.country === 'LIE';
  const criminal = isCriminal(settings.procedure);
  if (lie && criminal && (['TP2', 'TP3A', 'TP3B', 'TP3C'].includes(input.type) || input.kind === 'OTS')) {
    throw new Error('In Strafsachen bitte die passende TP4-Leistung wählen; offene Zivil-Tagsatzungen sind hier nicht vorgesehen.');
  }
  if (lie && input.type.startsWith('TP4')) {
    if (!criminal || !input.type.startsWith(settings.procedure === 'privateProsecution' ? 'TP4 I ' : 'TP4 II ')) throw new Error('TP4 passt nicht zum Strafverfahren.');
    if (settings.procedure === 'privateProsecution' && settings.offence === 'felony') throw new Error('Privatanklage wegen Verbrechen ist nicht vorgesehen.');
    if (input.type.endsWith('3d') && input.value === null) throw new Error('Für eine Kostenbeschwerde den strittigen Kostenbetrag als abweichenden Streitwert eingeben.');
  }
  if (lie && input.kind === 'TS' && !['TP2', 'TP3A', 'TP3B', 'TP3C'].includes(input.type) && !isCriminalHearing(input.type)) {
    throw new Error('Für diesen Tarif ist keine Tagsatzung vorgesehen. Bitte Schriftsatz / Leistung wählen.');
  }
  if (lie && input.type === 'TP8 2' && input.units >= 10) throw new Error('TP8 2 gilt nur für Besprechungen unter 10 Minuten.');
  if (input.kind === 'SS' && !usesHalfHourUnits(input.type) && input.type !== 'TP9') {
    if (!Number.isSafeInteger(input.units)) throw new Error('Die Anzahl der Leistungen muss ganzzahlig sein.');
  }
  if (lie && input.surchargePercent !== null && input.surchargePercent > 50) throw new Error('Der Streitgenossenzuschlag beträgt höchstens 50%.');
  if ((input.vatPercent ?? settings.vatPercent ?? 0) > 100) throw new Error('Der Steuersatz darf 100% nicht überschreiten.');
  const pending = input.kind === 'OTS';
  const hasUnitRate = input.hasUnitRate && allowsUnitRate(input.type) && !pending && (lie || !criminal);
  const rate = settings.country === 'LIE' ? value <= 15000 ? 50 : 40 : value <= 10170 ? 60 : 50;
  // H5 ist eine Aktvorgabe. Eine positionsbezogene Verdoppelung wirkt nicht vierfach.
  const unitPercent = hasUnitRate ? rate * ((settings.doubleUnitRate || input.doubleUnitRate) && allowsDoubleUnitRate(input, settings) ? 2 : 1) : 0;
  const surchargePercent = pending || input.type === 'TP9' || (!lie && criminal) ? 0
    : (input.surchargePercent ?? partySurcharge(settings.representedParties, settings.opposingParties));
  const taxPercent = vatPercent(input.date, settings, input.vatPercent);
  const totalBase = pending ? 0 : baseFee(value, input, settings) * timeFactor(input, settings.country) * (1 + connectionRate(input, settings) / 100);
  const unitRateAmount = totalBase * unitPercent / 100;
  const surchargeAmount = (totalBase + unitRateAmount) * surchargePercent / 100;
  const court = pending ? { amount: 0, label: '' } : courtFee(value, input, settings);
  const expenses = pending ? 0 : input.expenses;
  const netTotal = totalBase + unitRateAmount + surchargeAmount;
  const vatAmount = netTotal * taxPercent / 100;
  const grossTotal = netTotal + vatAmount + court.amount + expenses;
  // Auch Überläufe durch sehr grosse, aber einzeln noch endliche Eingaben bleiben sichtbar.
  for (const amount of [totalBase, unitRateAmount, surchargeAmount, netTotal, vatAmount, court.amount, grossTotal]) {
    if (!Number.isFinite(amount)) throw new Error('Die Eingaben ergeben einen zu grossen Betrag.');
  }
  return {
    baseFee: totalBase, unitRateAmount, surchargeAmount, courtFee: court.amount,
    expenses, netTotal, vatAmount, grossTotal,
    config: {
      hasUnitRate, hasSurcharge: surchargePercent > 0, isForeign: taxPercent === 0,
      isTimeBased: input.kind !== 'SS' || usesHalfHourUnits(input.type) || input.type === 'TP9',
      ehsLabel: `${unitPercent}%`, surchargePercent, vatPercent: taxPercent,
      courtFeeLabel: court.label, tariffVersion: tariffVersion(settings, input.date), isPending: pending,
    },
  };
}

/** Alle Positionen, einschliesslich der in Excel ausgelassenen dritten Eingabegruppe. */
export function sumResults(results: readonly CalculationResult[]) {
  const total = results.reduce((sum, result) => ({
    netTotal: sum.netTotal + result.netTotal,
    vatAmount: sum.vatAmount + result.vatAmount,
    courtFee: sum.courtFee + result.courtFee,
    expenses: sum.expenses + result.expenses,
    grossTotal: sum.grossTotal + result.grossTotal,
  }), { netTotal: 0, vatAmount: 0, courtFee: 0, expenses: 0, grossTotal: 0 });
  if (Object.values(total).some(value => !Number.isFinite(value))) throw new Error('Die Kostensumme ist zu gross.');
  return total;
}

/** Layout!E156:I190: offene Tagsatzung separat als mögliche künftige Kosten. */
export function hearingScenarios(input: FeeInput, settings: CaseSettings) {
  const start = Math.max(2, Math.ceil(input.units));
  return (['TP2', 'TP3A'] as const).flatMap(type =>
    (type === 'TP2' ? [1, 2, 3, 4] : [1, start, start + 1, start + 2]).map(units => ({
      type, units,
      result: calculatePosition({ ...input, type, kind: 'TS', units, manualFee: null, expenses: 0, includeCourtFee: false }, settings),
    }))
  );
}

/** Layout!E185:E190: Mehrbetrag je weiterer voller Stunde TP3A. */
export function additionalHearingHour(input: FeeInput, settings: CaseSettings): CalculationResult {
  const standardInput = { ...input, type: 'TP3A' as const, kind: 'TS' as const, manualFee: null, expenses: 0, includeCourtFee: false };
  const first = calculatePosition({ ...standardInput, units: 1 }, settings);
  const second = calculatePosition({ ...standardInput, units: 2 }, settings);
  return {
    ...second, baseFee: second.baseFee - first.baseFee,
    unitRateAmount: second.unitRateAmount - first.unitRateAmount,
    surchargeAmount: second.surchargeAmount - first.surchargeAmount,
    netTotal: second.netTotal - first.netTotal, vatAmount: second.vatAmount - first.vatAmount,
    grossTotal: second.grossTotal - first.grossTotal,
  };
}
