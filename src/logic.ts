import type { GKG_COLUMN } from './tarife/gkg';
import { DEFAULT_CASE, createFeeInput, type CalculationResult } from './calculator/types';
import { calculatePosition } from './calculator/engine';
import type { TarifPosten } from './fees';

export { ACTION_ITEMS, TP_LABELS, type TarifPosten, type ActionItem } from './fees';
export type { CalculationResult } from './calculator/types';

/** Kompatibilität für bestehende Aufrufer; die neue Oberfläche verwendet FeePosition. */
export interface Position {
  id: string;
  label: string;
  description?: string;
  value: number;
  multiplier: number;
  type: TarifPosten;
  gkgColumn?: GKG_COLUMN;
  isAppeal?: boolean;
  details: CalculationResult;
}

/**
 * Bestehende API bleibt verfügbar. Ohne Leistungsdatum gelten die bisherigen
 * LIE-Einstellungen (8.1% Steuer, einfacher ES, optional 10% Zuschlag).
 * Neue Optionen sind im typisierten Objekt von calculatePosition zusammengefasst.
 */
export function calculateFees(
  value: number, type: TarifPosten, gkgColumn: GKG_COLUMN | undefined,
  isAppeal: boolean, multiplier: number = 1, hasUnitRate: boolean,
  hasSurcharge: boolean, isForeign: boolean, includeCourtFee: boolean,
): CalculationResult {
  // Die alte API behandelte negative Streitwerte als 0. NaN/Infinity bleiben Fehler.
  const settings = { ...DEFAULT_CASE, value: Math.max(0, value) };
  const input = {
    ...createFeeInput('2024-01-01'), type, units: 1,
    gkgColumn: gkgColumn ?? 'zivil', isAppeal, hasUnitRate,
    surchargePercent: hasSurcharge ? 10 : 0, vatPercent: isForeign ? 0 : 8.1,
    includeCourtFee: includeCourtFee && gkgColumn !== undefined,
    // Ausschliesslich der bisherige TP9-Aufrufer behält seinen alten Festbetrag.
    manualFee: type === 'TP9' ? 75 : null,
  };
  if (!Number.isFinite(multiplier) || multiplier < 0) throw new Error('Ungültiger Multiplikator.');
  // In der bisherigen API multipliziert der Faktor jeden Honorartarif, keine GKG.
  const result = calculatePosition(input, settings);
  return {
    ...result, baseFee: result.baseFee * multiplier,
    unitRateAmount: result.unitRateAmount * multiplier,
    surchargeAmount: result.surchargeAmount * multiplier,
    netTotal: result.netTotal * multiplier, vatAmount: result.vatAmount * multiplier,
    grossTotal: (result.netTotal + result.vatAmount) * multiplier + result.courtFee,
  };
}

/** Währung ist wie in Excel eine Anzeigevorgabe, keine versteckte Umrechnung. */
export function formatCurrency(value: number, currency: 'CHF' | 'EUR' = 'CHF'): string {
  return new Intl.NumberFormat('de-LI', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);
}
