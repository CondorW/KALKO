import {
  TABLE_TP1, TP1_STEP_INCREMENT, TP1_PCT_HIGH, TP1_PCT_SUPER_HIGH, TP1_CAP,
  TABLE_TP2, TP2_STEP_INCREMENT, TP2_PCT_HIGH, TP2_PCT_SUPER_HIGH, TP2_CAP,
  TABLE_TP3A, TP3A_STEP_INCREMENT, TP3A_PCT_HIGH, TP3A_PCT_SUPER_HIGH, TP3A_CAP,
  TABLE_TP3B, TP3B_STEP_INCREMENT, TP3B_PCT_HIGH, TP3B_PCT_SUPER_HIGH, TP3B_CAP,
  TABLE_TP3C, TP3C_STEP_INCREMENT, TP3C_PCT_HIGH, TP3C_PCT_SUPER_HIGH, TP3C_CAP,
  TABLE_TP5, TABLE_TP8, type FeeStep, type TarifPosten,
} from '../fees';
import { AUSTRIAN_TARIFFS, CRIMINAL_FEES } from './workbook-data';
import { isCriminal, type CaseSettings, type FeeInput } from './types';
import { isCriminalHearing } from './rules';

type StandardPost = 'TP1' | 'TP2' | 'TP3A' | 'TP3B' | 'TP3C';
interface StandardTariff {
  table: readonly FeeStep[];
  step: number;
  highRate: number;
  superRate: number;
  cap: number;
}

// Die bereits vorhandenen LIE-Tarifdateien bleiben die Quelle der Basistarife.
const LIE_TARIFFS: Record<StandardPost, StandardTariff> = {
  TP1: { table: TABLE_TP1, step: TP1_STEP_INCREMENT, highRate: TP1_PCT_HIGH, superRate: TP1_PCT_SUPER_HIGH, cap: TP1_CAP },
  TP2: { table: TABLE_TP2, step: TP2_STEP_INCREMENT, highRate: TP2_PCT_HIGH, superRate: TP2_PCT_SUPER_HIGH, cap: TP2_CAP },
  TP3A: { table: TABLE_TP3A, step: TP3A_STEP_INCREMENT, highRate: TP3A_PCT_HIGH, superRate: TP3A_PCT_SUPER_HIGH, cap: TP3A_CAP },
  TP3B: { table: TABLE_TP3B, step: TP3B_STEP_INCREMENT, highRate: TP3B_PCT_HIGH, superRate: TP3B_PCT_SUPER_HIGH, cap: TP3B_CAP },
  TP3C: { table: TABLE_TP3C, step: TP3C_STEP_INCREMENT, highRate: TP3C_PCT_HIGH, superRate: TP3C_PCT_SUPER_HIGH, cap: TP3C_CAP },
};
const AUT_LIMITS = [40, 70, 110, 180, 360, 730, 1090, 1820, 3630, 5450, 7270, 10170];

export function isStandardPost(type: string): type is StandardPost {
  return Object.hasOwn(LIE_TARIFFS, type);
}

/** Eingabe!F10: exakt vor dem 30.04.2023 gilt der alte AUT-Tarif. */
export function tariffVersion(settings: CaseSettings, date: string): string {
  return settings.country === 'LIE' ? 'Liechtenstein'
    : date < '2023-04-30' ? 'AUT vor 30.04.2023' : 'AUT ab 30.04.2023';
}

/** Eine Tabellenstufe gilt bis einschliesslich ihrer Obergrenze. */
function tableFee(value: number, table: readonly FeeStep[]): number | undefined {
  return table.find(step => value <= step.limit)?.fee;
}

export function standardFee(value: number, type: StandardPost, settings: CaseSettings, date: string): number {
  if (settings.country === 'LIE') {
    const tariff = LIE_TARIFFS[type];
    const found = tableFee(value, tariff.table);
    if (found !== undefined) return found;
    // LIE_T!P3:S7: volle 20'000-Schritte nur bis 500'000, danach Promille.
    const last = tariff.table[tariff.table.length - 1];
    const stepPart = Math.ceil((Math.min(value, 500000) - last.limit) / 20000) * tariff.step;
    const highPart = Math.max(0, Math.min(value, 5000000) - 500000) * tariff.highRate;
    const superPart = Math.max(0, value - 5000000) * tariff.superRate;
    return Math.min(last.fee + stepPart + highPart + superPart, tariff.cap);
  }
  const version = date < '2023-04-30' ? 'legacy' : 'current';
  const tariff = AUSTRIAN_TARIFFS[version][type];
  const index = AUT_LIMITS.findIndex(limit => value <= limit);
  if (index !== -1) return tariff.fees[index];
  // AUT_T!P:X: 17 Schritte bis 34'820, ein weiterer fester Schritt bis 36'340.
  const steps = Math.ceil((Math.min(value, 34820) - 10170) / 1450);
  const fixedStep = value > 34820 ? tariff.step : 0;
  const highPart = Math.max(0, Math.min(value, 363360) - 36340) * tariff.highRate;
  const superPart = Math.max(0, value - 363360) * tariff.superRate;
  return Math.min(tariff.fees[11] + steps * tariff.step + fixedStep + highPart + superPart, tariff.cap);
}

interface ScaledTariff { factor: number; cap: number }
const LETTER_TARIFFS: Partial<Record<TarifPosten, ScaledTariff>> = {
  TP5: { factor: 1, cap: 100 }, TP5i: { factor: 1.5, cap: 150 },
  TP6: { factor: 2, cap: 330 }, TP6i: { factor: 3, cap: 495 },
  'TP7 1': { factor: 2, cap: 220 }, 'TP7 2': { factor: 4, cap: 440 },
  'TP7 3': { factor: 4, cap: 440 }, TP7: { factor: 4, cap: 440 },
};

export function needsManualFee(input: FeeInput, settings: CaseSettings): boolean {
  return input.type === 'FIX'
    || (settings.country === 'AUT' && !isStandardPost(input.type));
}

/** Reine Tarifberechnung je Einheit; Zeitfaktor, ES, Steuer und Barauslagen folgen separat. */
export function baseFee(value: number, input: FeeInput, settings: CaseSettings): number {
  if (input.manualFee !== null) return input.manualFee;
  if (needsManualFee(input, settings)) {
    throw new Error('Für diesen Tarif enthält die Vorlage keinen Wert. Bitte einen manuellen Grundbetrag eingeben.');
  }
  if (isStandardPost(input.type)) return standardFee(value, input.type, settings, input.date);
  if (input.type === 'TP9') return 75; // RATV TP9 Z. 4, je begonnene Stunde.
  if (input.type.startsWith('TP4')) {
    if (!isCriminal(settings.procedure)) throw new Error('TP4 setzt ein Strafverfahren voraus.');
    const group = settings.procedure === 'privateProsecution' ? 'I' : 'II';
    if (!input.type.startsWith(`TP4 ${group} `)) throw new Error('TP4 passt nicht zur gewählten Verfahrensart.');
    if (group === 'I' && settings.offence === 'felony') throw new Error('Die Vorlage enthält keine Privatanklage wegen Verbrechen.');
    const index = settings.offence === 'infraction' ? 0 : settings.offence === 'misdemeanour' ? 1 : 2;
    if (input.type.endsWith('3d')) {
      // LIE_T!F53:F55: TP2-Betrag, begrenzt auf 150 / 375 / 750.
      return Math.min(standardFee(value, 'TP2', settings, input.date), [150, 375, 750][index]);
    }
    const table = CRIMINAL_FEES[input.type as keyof typeof CRIMINAL_FEES];
    const fee = table?.[index];
    if (fee === undefined) throw new Error('Diese Straf-Tarifkombination ist in der Vorlage nicht enthalten.');
    return fee;
  }
  const scaled = LETTER_TARIFFS[input.type];
  if (scaled) {
    const unbounded = tableFee(value, TABLE_TP5)
      ?? 50 + Math.ceil((value - 50000) / 20000) * 17;
    // Eigener Höchstbetrag je Variante. TP6 darf nicht durch den TP5-Deckel begrenzt werden.
    return Math.min(unbounded * scaled.factor, scaled.cap);
  }
  if (input.type === 'TP8' || input.type === 'TP8 1' || input.type === 'TP8 2') {
    const conference = Math.min(tableFee(value, TABLE_TP8) ?? 135 + Math.ceil((value - 25000) / 20000) * 15, 600);
    return input.type === 'TP8 2' ? conference * .4 : conference;
  }
  throw new Error('Unbekannter Tarifposten.');
}

export function usesHalfHourUnits(type: TarifPosten): boolean {
  return isCriminalHearing(type) || type.startsWith('TP7') || type.startsWith('TP8');
}

/** RATV TP2/3: erste Stunde voll, jede weitere begonnene Stunde zur Hälfte. */
export function timeFactor(input: FeeInput, country: CaseSettings['country'] = 'LIE'): number {
  if (country === 'LIE') {
    if (input.units === 0) return 0;
    if (input.type === 'TP8 2') return 1; // Eine Besprechung unter zehn Minuten.
    if (isCriminalHearing(input.type) || input.kind === 'TS') return 1 + (Math.ceil(input.units) - 1) / 2;
    if (usesHalfHourUnits(input.type) || input.type === 'TP9') return Math.ceil(input.units);
    if (input.type.startsWith('TP5') || input.type.startsWith('TP6')) return input.units;
    return input.units;
  }
  if (input.kind === 'TS') return input.units === 0 ? 0 : 1 + (input.units - 1) / 2;
  // Schreiben zählen Stück; TP7/8 und manuelle Zeitposten zählen Einheiten direkt.
  return input.type.startsWith('TP5') || input.type.startsWith('TP6') || usesHalfHourUnits(input.type)
    || input.type === 'TP9' ? input.units : 1;
}
