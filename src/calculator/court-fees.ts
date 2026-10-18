import { TABLE_GKG } from '../tarife/gkg';
import { AUSTRIAN_COURT_FEES } from './workbook-data';
import type { CaseSettings, FeeInput } from './types';

/** Eingabe!J5: zwei Grundparteien, +10% für die erste zusätzliche, danach +5%, max. 50%. */
export function partySurcharge(represented: number, opposing: number): number {
  const additional = represented + opposing - 2;
  return additional <= 0 ? 0 : Math.min(50, 10 + (additional - 1) * 5);
}

export function courtFee(value: number, input: FeeInput, settings: CaseSettings): { amount: number; label: string } {
  if (!input.includeCourtFee) return { amount: 0, label: '' };
  if (input.manualCourtFee !== null) return { amount: input.manualCourtFee, label: 'Manuelle Gerichtsgebühr' };
  if (settings.country === 'LIE') {
    // Vollständige Tabelle einschliesslich der offenen letzten Stufe >10 Mio.
    const fee = TABLE_GKG.find(row => value <= row.limit)?.[input.gkgColumn] ?? 0;
    let factor = 1;
    if (input.isAppeal) {
      // Bestehende KALKO-Rechtsmittellogik bleibt erhalten; Excel liefert die Basisstufen.
      factor = input.gkgColumn === 'schuld' || input.gkgColumn === 'exekution'
        ? value <= 5000 ? 1 : value <= 50000 ? 2.5 : 6
        : 2;
    }
    return { amount: fee * factor, label: `${factor}× GKG${input.isAppeal ? ' (Rechtsmittel)' : ''}` };
  }
  const version = input.date < '2025-03-31' ? 'legacy' : 'current';
  const tariffs = AUSTRIAN_COURT_FEES[version];
  if (input.austrianCourt === 'TP4') {
    // Background!J45 bietet TP4 an, AUT_GGG enthält hierfür jedoch keinen Datenblock.
    throw new Error('Für AUT TP4 EXE enthält die Vorlage keine Gerichtsgebühr. Bitte manuell eingeben.');
  }
  const surcharge = 1 + partySurcharge(settings.representedParties, settings.opposingParties) / 100;
  if (input.austrianCourt === 'TP3b') return { amount: tariffs.TP3b * surcharge, label: 'AUT TP3b §615 ZPO' };
  const tariff = tariffs[input.austrianCourt];
  const index = tariff.limits.findIndex(limit => value <= limit);
  // Eingabe!AD10 rechnet oberhalb 350'000 den MEHRBETRAG × Satz + Fixbetrag.
  const amount = index === -1 ? (value - 350000) * tariff.rate + tariff.add : tariff.fees[index];
  return { amount: amount * surcharge, label: `AUT ${input.austrianCourt} (${version === 'legacy' ? 'vor' : 'ab'} 31.03.2025)` };
}
