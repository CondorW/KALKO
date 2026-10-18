import { isCriminal, type CaseSettings, type FeeInput } from './types';

/** RATG Art. 11 Z. 8/9: Strafsachen haben gesetzliche Bewertungsansätze. */
export function assessmentValue(input: FeeInput, settings: CaseSettings): number {
  if (input.value !== null) return input.value;
  if (settings.country === 'LIE' && isCriminal(settings.procedure)) {
    return settings.offence === 'infraction' ? 1000 : settings.offence === 'misdemeanour' ? 5000 : 20000;
  }
  return settings.value;
}

/** RATG Art. 23 Abs. 2: auf Nebenleistungen und Zeitversäumnis fällt kein ES an. */
export function allowsUnitRate(type: FeeInput['type']): boolean {
  return /^(TP[1234]|TP7)/.test(type);
}

/** Die Auswahl bestätigt die Voraussetzungen von Art. 23 Abs. 6. */
export function allowsDoubleUnitRate(input: FeeInput, settings: CaseSettings): boolean {
  if (settings.country !== 'LIE') return true; // Österreich bleibt ausserhalb dieses Rechtsabgleichs.
  return (input.kind === 'TS' && /^TP3[ABC]$/.test(input.type)) || /^TP4 (I|II) [45]$/.test(input.type);
}

export function isCriminalHearing(type: FeeInput['type']): boolean {
  return /^TP4 (I|II) [45]$/.test(type);
}

/** Der Verbindungszuschlag erhöht den Schriftsatz, nicht den Genossenzuschlag. */
export function allowsConnection(input: FeeInput, settings: CaseSettings): boolean {
  return settings.country !== 'LIE' || (input.kind === 'SS' && ['TP2', 'TP3A'].includes(input.type));
}

export function connectionRate(input: FeeInput, settings: CaseSettings): number {
  if (!input.connected) return 0;
  if (input.connectionPercent !== undefined && ![10, 25].includes(input.connectionPercent)) throw new Error('Verbindungszuschlag muss 10% oder 25% betragen.');
  if (!allowsConnection(input, settings)) {
    throw new Error('Der Verbindungszuschlag ist hier nur für Schriftsätze nach TP2 oder TP3A vorgesehen.');
  }
  return input.connectionPercent ?? 25;
}
