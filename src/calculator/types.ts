import type { TarifPosten } from '../fees';
import type { GKG_COLUMN } from '../tarife/gkg';

export type Country = 'LIE' | 'AUT';
export type Currency = 'CHF' | 'EUR';
export type Language = 'DE' | 'EN';
export type Procedure = 'civil' | 'nonContentious' | 'debt' | 'execution' | 'privateProsecution' | 'civilClaim';
export type Offence = 'infraction' | 'misdemeanour' | 'felony';
export type ServiceKind = 'SS' | 'TS' | 'OTS';
export type AustrianCourt = 'TP1' | 'TP2' | 'TP3a' | 'TP3b' | 'TP4';

/** Aktweite Vorgaben. Positionen speichern nur ihre Abweichungen davon. */
export interface CaseSettings {
  country: Country;
  currency: Currency;
  language: Language;
  value: number;
  representedParties: number;
  opposingParties: number;
  doubleUnitRate: boolean;
  vatPercent: number | null;
  procedure: Procedure;
  offence: Offence;
  fileNumber: string;
  client: string;
  opponent: string;
  subject: string;
}

/** null bedeutet „Aktvorgabe“; 0 bleibt eine ausdrückliche Eingabe. */
export interface FeeInput {
  date: string;
  type: TarifPosten;
  kind: ServiceKind;
  value: number | null;
  units: number;
  hasUnitRate: boolean;
  doubleUnitRate: boolean;
  surchargePercent: number | null;
  connected: boolean;
  connectionPercent?: 10 | 25; // Vorhandene Positionen ohne Feld behalten 25%.
  vatPercent: number | null;
  manualFee: number | null;
  expenses: number;
  includeCourtFee: boolean;
  gkgColumn: GKG_COLUMN;
  isAppeal: boolean;
  austrianCourt: AustrianCourt;
  manualCourtFee: number | null;
}

export interface FeePosition {
  id: string;
  label: string;
  description: string;
  input: FeeInput;
}

export interface CalculationResult {
  baseFee: number;
  unitRateAmount: number;
  surchargeAmount: number;
  courtFee: number;
  expenses: number;
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
  config: {
    hasUnitRate: boolean;
    hasSurcharge: boolean;
    isForeign: boolean;
    isTimeBased: boolean;
    ehsLabel: string;
    surchargePercent: number;
    vatPercent: number;
    courtFeeLabel: string;
    tariffVersion: string;
    isPending: boolean;
  };
}

/** Datumsabhängigkeit ist explizit und wird nicht durch Browser-Zeitzonen verschoben. */
export const DEFAULT_CASE: CaseSettings = {
  country: 'LIE', currency: 'CHF', language: 'DE', value: 50000,
  representedParties: 1, opposingParties: 1, doubleUnitRate: false,
  vatPercent: null, procedure: 'civil', offence: 'misdemeanour',
  fileNumber: '', client: '', opponent: '', subject: '',
};

export function createFeeInput(date: string): FeeInput {
  return {
    date, type: 'TP3A', kind: 'SS', value: null, units: 1,
    hasUnitRate: true, doubleUnitRate: false, surchargePercent: null,
    connected: false, vatPercent: null, manualFee: null, expenses: 0,
    includeCourtFee: false, gkgColumn: 'zivil', isAppeal: false,
    austrianCourt: 'TP1', manualCourtFee: null,
  };
}

export const PROCEDURE_LABELS: Record<Procedure, string> = {
  civil: 'Streitiges Verfahren', nonContentious: 'Ausserstreitverfahren',
  debt: 'Betreibung / Schuldentrieb', execution: 'Exekutionsverfahren',
  privateProsecution: 'Strafverfahren – Privatanklage', civilClaim: 'Strafverfahren – Privatbeteiligung',
};

export const OFFENCE_LABELS: Record<Offence, string> = {
  infraction: 'Übertretung', misdemeanour: 'Vergehen', felony: 'Verbrechen',
};

export function isCriminal(procedure: Procedure): boolean {
  return procedure === 'privateProsecution' || procedure === 'civilClaim';
}
