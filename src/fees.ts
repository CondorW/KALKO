export * from './tarife/tp1';
export * from './tarife/tp2';
export * from './tarife/tp3a';
export * from './tarife/tp3b';
export * from './tarife/tp3c';
export * from './tarife/tp5';
export * from './tarife/tp8';
export * from './tarife/gkg';

import type { GKG_COLUMN } from './tarife/gkg';

export type TarifPosten = 
  | 'TP1' | 'TP2' | 'TP3A' | 'TP3A_Session' | 'TP3B' | 'TP3C' 
  | 'TP5' | 'TP6' | 'TP7' | 'TP8' | 'TP9';

export interface FeeStep {
  limit: number;
  fee: number;
}

export interface ActionItem {
  id: TarifPosten;
  label: string;
  description: string;
  keywords: string[];
  gkgColumn?: GKG_COLUMN; // Standard GKG Spalte für diese Aktion
}

// NEU: Gruppierte Struktur für das Tree-View
export interface ServiceGroup {
  id: TarifPosten;
  label: string;
  description?: string;
  items: ActionItem[];
}

// Wir exportieren weiterhin ACTION_ITEMS (flach) für die Suche, generieren sie aber dynamisch
// Die eigentliche Struktur ist jetzt SERVICE_GROUPS

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: 'TP1',
    label: 'TP 1: Einfache Schriftsätze',
    description: 'Anzeigen, Ansuchen, Fristerstreckungen',
    items: [
      // I. Allgemein
      { id: 'TP1', label: 'Anzeige / Mitteilung', description: 'TP1 I a: Blosse Anzeigen und Mitteilungen an das Gericht', keywords: ['anzeige', 'mitteilung'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Akteneinsicht / Auskünfte', description: 'TP1 I b: Ansuchen um Auskünfte, Abschriften, Akteneinsicht', keywords: ['akten', 'einsicht', 'kopie'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Fristen & Tagsatzungen', description: 'TP1 I c: Erklärungen zu Fristen, Tagsatzungen, Zustellungen', keywords: ['frist', 'erstreckung', 'termin'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Kostenbestimmungsantrag', description: 'TP1 I d: Anträge auf Kostenbestimmung', keywords: ['kosten', 'bestimmung'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Vollmacht Kündigung', description: 'TP1 I e: Widerruf oder Kündigung von Vollmachten', keywords: ['vollmacht', 'mandat'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Zurücknahme Antrag', description: 'TP1 I f: Zurücknahme von Anträgen oder Rechtsmitteln, Verzicht', keywords: ['zurücknahme', 'verzicht'], gkgColumn: 'zivil' },
      
      // II. Zivilprozess
      { id: 'TP1', label: 'Antrag Kurator', description: 'TP1 II a: Bestellung eines Kurators für Prozessgegner', keywords: ['kurator'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Nebenintervention', description: 'TP1 II b: Beitrittserklärungen', keywords: ['nebenintervention'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Streitwert Änderung', description: 'TP1 II c: Anträge auf Änderung der Bemessungsgrundlage (Art 8/9 RATG)', keywords: ['streitwert', 'bemessung'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Klagzurücknahme', description: 'TP1 II d: Zurücknahme von Klagen', keywords: ['klage', 'zurück'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Rechtsbot Einspruch', description: 'TP1 II e: Einsprüche gegen Rechtsbot / Widerspruch Zahlbefehl', keywords: ['rechtsbot', 'zahlbefehl', 'widerspruch'], gkgColumn: 'schuld' },
      { id: 'TP1', label: 'Fortsetzung Verfahren', description: 'TP1 II f: Aufnahme ruhendes Verfahren / Anberaumung Tagsatzung', keywords: ['fortsetzung', 'ruhen', 'tagsatzung'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Urteilsberichtigung', description: 'TP1 II g: Anträge auf Berichtigung von Urteilen/Beschlüssen', keywords: ['urteil', 'berichtigung'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Berufungsanmeldung (Formal)', description: 'TP1 II h: Berufungsmitteilung nur mit Verzicht/Antrag auf Verhandlung', keywords: ['berufung', 'anmeldung'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Sicherheitsleistung', description: 'TP1 II i: Antrag auf Kostensicherheitsleistung', keywords: ['kaution', 'sicherheit'], gkgColumn: 'zivil' },
    ]
  },
  {
    id: 'TP2',
    label: 'TP 2: Klagen (Mahn) & Kurze Schriftsätze',
    description: 'Mahnklagen, Scheidung, Replik/Duplik (kurz)',
    items: [
      // 1. Zivilprozess
      { id: 'TP2', label: 'Mahnklage / Zahlbefehl', description: 'TP2 I 1a: Mahnklagen, Zahlbefehlsanträge', keywords: ['mahnklage', 'zahlbefehl'], gkgColumn: 'schuld' },
      { id: 'TP2', label: 'Rechtsöffnung', description: 'TP2 I 1a: Anträge auf Erlass eines Rechtsbotes / Rechtsöffnung', keywords: ['rechtsöffnung'], gkgColumn: 'sicherung' },
      { id: 'TP2', label: 'Saldoklage / Darlehen', description: 'TP2 I 1b: Saldoklagen, Darlehensklagen, Kaufpreisklagen', keywords: ['saldo', 'darlehen', 'kaufpreis'], gkgColumn: 'zivil' },
      { id: 'TP2', label: 'Mietzinsklage', description: 'TP2 I 1b: Klagen auf Bezahlung Bestandzins', keywords: ['miete', 'zins'], gkgColumn: 'zivil' },
      { id: 'TP2', label: 'Scheidungsklage', description: 'TP2 I 1b: Scheidungsklagen (Art 75/92 EheG)', keywords: ['scheidung', 'ehe'], gkgColumn: 'zivil' },
      { id: 'TP2', label: 'Klagbeantwortung (Kurz)', description: 'TP2 I 1c: Nur Bestreitung & Abweisungsantrag (ohne Sachverhalt)', keywords: ['antwort', 'bestreitung'], gkgColumn: 'zivil' },
      { id: 'TP2', label: 'Einspruch Zahlbefehl (Kurz)', description: 'TP2 I 1c: Einspruch gegen Zahlungsauftrag (Kurz)', keywords: ['einspruch', 'zahlbefehl'], gkgColumn: 'schuld' },
      { id: 'TP2', label: 'Aufkündigung (Miete)', description: 'TP2 I 1d: Aufkündigungen (§ 567 ZPO) ohne Sachverhalt', keywords: ['kündigung', 'miete'], gkgColumn: 'zivil' },
      { id: 'TP2', label: 'Sonstiger Schriftsatz', description: 'TP2 I 1e: Sonstige Schriftsätze (nicht TP1/TP3)', keywords: ['schriftsatz', 'sonstige'], gkgColumn: 'zivil' },
    ]
  },
  {
    id: 'TP3A',
    label: 'TP 3A: Klagen & Tagsatzung',
    description: 'Ausführliche Klagen und Verhandlungen',
    items: [
      { id: 'TP3A', label: 'Klage (Ausführlich)', description: 'TP 3A I: Klage mit Sachverhaltsdarstellung', keywords: ['klage', 'substantiiert'], gkgColumn: 'zivil' },
      // NEU: Tagsatzung
      { id: 'TP3A_Session', label: 'Tagsatzung (Verhandlung)', description: 'TP 3A II: Mündliche Verhandlung (1. Std voll, jede weitere 50%)', keywords: ['verhandlung', 'tagsatzung', 'termin', 'stunde'], gkgColumn: undefined },
      
      { id: 'TP3A', label: 'Klagbeantwortung (Ausführlich)', description: 'TP 3A I: Beantwortung mit Sachverhaltsdarstellung', keywords: ['antwort', 'replik'], gkgColumn: 'zivil' },
      { id: 'TP3A', label: 'Vorbereitender Schriftsatz', description: 'TP 3A I: Vorbereitende Schriftsätze (§ 257 ZPO)', keywords: ['vorbereitung', 'schriftsatz'], gkgColumn: 'zivil' },
      { id: 'TP3A', label: 'Einstweilige Verfügung', description: 'TP 3A I: Antrag EV oder Äusserung dazu', keywords: ['ev', 'einstweilig'], gkgColumn: 'sicherung' },
      { id: 'TP3A', label: 'Rekurs (Kosten)', description: 'TP 3A I: Kostenrekurse', keywords: ['rekurs', 'kosten'], gkgColumn: 'zivil' },
    ]
  },
  {
    id: 'TP3B',
    label: 'TP 3B: Berufung',
    description: 'Rechtsmittel an die zweite Instanz',
    items: [
      { id: 'TP3B', label: 'Berufung', description: 'TP 3B: Berufungsschrift', keywords: ['berufung', 'obergericht'], gkgColumn: 'zivil' },
      { id: 'TP3B', label: 'Berufungsbeantwortung', description: 'TP 3B: Berufungsbeantwortung', keywords: ['berufung', 'antwort'], gkgColumn: 'zivil' },
      { id: 'TP3B', label: 'Rekurs (Allgemein)', description: 'TP 3B: Rekurse (sofern nicht TP3A/C)', keywords: ['rekurs'], gkgColumn: 'zivil' },
    ]
  },
  {
    id: 'TP3C',
    label: 'TP 3C: Revision',
    description: 'Rechtsmittel an den OGH',
    items: [
      { id: 'TP3C', label: 'Revision', description: 'TP 3C: Revision an den OGH', keywords: ['revision', 'ogh'], gkgColumn: 'zivil' },
      { id: 'TP3C', label: 'Revisionsbeantwortung', description: 'TP 3C: Revisionsbeantwortung', keywords: ['revision', 'antwort'], gkgColumn: 'zivil' },
      { id: 'TP3C', label: 'Revisionsrekurs', description: 'TP 3C: Rekurse an den OGH', keywords: ['rekurs', 'ogh'], gkgColumn: 'zivil' },
    ]
  },
  {
    id: 'TP5',
    label: 'TP 5: Korrespondenz (Einfach)',
    description: 'Kurze Briefe, Mahnungen',
    items: [
      { id: 'TP5', label: 'Einfaches Schreiben', description: 'Mahnung, kurze Mitteilung, Einladung', keywords: ['brief', 'email', 'mahnung'], gkgColumn: undefined },
    ]
  },
  {
    id: 'TP6',
    label: 'TP 6: Korrespondenz (Komplex)',
    description: 'Rechtsgutachten, Verträge',
    items: [
      { id: 'TP6', label: 'Brief (Komplex)', description: 'Nicht blosse Mitteilung, Rechtsauskunft', keywords: ['brief', 'gutachten'], gkgColumn: undefined },
    ]
  },
  {
    id: 'TP8',
    label: 'TP 8: Konferenz',
    description: 'Besprechungen (pro 30min)',
    items: [
      { id: 'TP8', label: 'Besprechung / Telefonat', description: 'Konferenz pro angefangene halbe Stunde', keywords: ['konferenz', 'telefon', 'meeting'], gkgColumn: undefined },
    ]
  }
];

// Flattened List für die Suche
export const ACTION_ITEMS: ActionItem[] = SERVICE_GROUPS.flatMap(g => g.items);

export const TP_LABELS: Record<string, string> = {
  'TP1': 'TP 1', 'TP2': 'TP 2', 'TP3A': 'TP 3A', 'TP3A_Session': 'TP 3A (Tagsatzung)', 'TP3B': 'TP 3B',
  'TP3C': 'TP 3C', 'TP5': 'TP 5', 'TP6': 'TP 6', 'TP7': 'TP 7',
  'TP8': 'TP 8', 'TP9': 'TP 9'
};