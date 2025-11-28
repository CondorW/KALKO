export * from './tarife/tp1';
export * from './tarife/tp2';
export * from './tarife/tp3a';
export * from './tarife/tp3b';
export * from './tarife/tp3c';
export * from './tarife/tp5';
export * from './tarife/tp8';
export * from './tarife/gkg';

import type { GKG_COLUMN } from './tarife/gkg';

// 'GKG' = Berechnet nach Tabelle
// 'BARAUSLAGE' = Manuelle Eingabe (Taxi, Kopien, etc.)
export type TarifPosten = 
  | 'TP1' | 'TP2' | 'TP3A' | 'TP3A_Session' | 'TP3B' | 'TP3C' 
  | 'TP5' | 'TP6' | 'TP7' | 'TP8' | 'TP9' | 'GKG' | 'BARAUSLAGE';

export interface FeeStep {
  limit: number;
  fee: number;
}

export interface ActionItem {
  id: TarifPosten;
  label: string;
  description: string;
  keywords: string[];
  gkgColumn?: GKG_COLUMN; // Wenn gesetzt, trigger GKG Logik
}

export interface ServiceGroup {
  id: string; // Changed to string to allow abstract IDs like 'CASH'
  label: string;
  description?: string;
  items: ActionItem[];
}

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: 'TP1',
    label: 'TP 1: Einfache Schriftsätze',
    description: 'Anzeigen, Ansuchen, Fristerstreckungen',
    items: [
      { id: 'TP1', label: 'Anzeige / Mitteilung', description: 'TP1 I a: Blosse Anzeigen und Mitteilungen', keywords: ['anzeige', 'mitteilung'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Akteneinsicht / Auskünfte', description: 'TP1 I b: Ansuchen um Auskünfte, Akteneinsicht', keywords: ['akten', 'einsicht'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Fristen & Tagsatzungen', description: 'TP1 I c: Fristerstreckungen, Terminverschiebungen', keywords: ['frist', 'erstreckung'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Kostenbestimmungsantrag', description: 'TP1 I d: Anträge auf Kostenbestimmung', keywords: ['kosten', 'bestimmung'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Vollmacht Kündigung', description: 'TP1 I e: Widerruf/Kündigung Vollmacht', keywords: ['vollmacht'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Zurücknahme', description: 'TP1 I f: Zurücknahme Antrag/Rechtsmittel', keywords: ['zurücknahme', 'verzicht'], gkgColumn: 'zivil' },
      // Zivil Spezifisch
      { id: 'TP1', label: 'Kurator Antrag', description: 'TP1 II a: Bestellung Kurator', keywords: ['kurator'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Nebenintervention', description: 'TP1 II b: Beitrittserklärung', keywords: ['nebenintervention'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Streitwert Änderung', description: 'TP1 II c: Antrag Änderung Bemessungsgrundlage', keywords: ['streitwert'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Klagzurücknahme', description: 'TP1 II d: Zurücknahme Klage', keywords: ['klage', 'zurück'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Fortsetzung', description: 'TP1 II f: Aufnahme ruhendes Verfahren', keywords: ['fortsetzung', 'ruhen'], gkgColumn: 'zivil' },
      { id: 'TP1', label: 'Berufungsanmeldung', description: 'TP1 II h: Formale Berufungsanmeldung', keywords: ['berufung', 'anmeldung'], gkgColumn: 'zivil' },
    ]
  },
  {
    id: 'TP2',
    label: 'TP 2: Klagen (Mahn) & Kurze Schriftsätze',
    description: 'Mahnklagen, Scheidung, Einsprüche',
    items: [
      { id: 'TP2', label: 'Mahnklage / Zahlbefehl', description: 'TP2 I 1a: Mahnklagen, Zahlbefehlsanträge', keywords: ['mahnklage', 'zahlbefehl'], gkgColumn: 'schuld' },
      { id: 'TP2', label: 'Rechtsöffnung', description: 'TP2 I 1b: Rechtsöffnungsgesuch', keywords: ['rechtsöffnung'], gkgColumn: 'sicherung' },
      { id: 'TP2', label: 'Scheidungsklage', description: 'TP2 I 1b: Scheidungsklagen', keywords: ['scheidung', 'ehe'], gkgColumn: 'zivil' },
      { id: 'TP2', label: 'Klagbeantwortung (Kurz)', description: 'TP2 I 1c: Nur Bestreitung', keywords: ['antwort', 'bestreitung'], gkgColumn: 'zivil' },
      { id: 'TP2', label: 'Einspruch Zahlbefehl', description: 'TP2 I 1c: Einspruch gegen Zahlbefehl', keywords: ['einspruch', 'zahlbefehl'], gkgColumn: 'schuld' },
      { id: 'TP2', label: 'Sonstiger Schriftsatz', description: 'TP2 I 1e: Sonstige Schriftsätze', keywords: ['schriftsatz'], gkgColumn: 'zivil' },
    ]
  },
  {
    id: 'TP3A',
    label: 'TP 3A: Klagen & Tagsatzung',
    description: 'Substantiierte Schriftsätze & Verhandlungen',
    items: [
      { id: 'TP3A', label: 'Klage (Ausführlich)', description: 'TP 3A I: Klage mit Sachverhalt', keywords: ['klage', 'substantiiert'], gkgColumn: 'zivil' },
      { id: 'TP3A_Session', label: 'Tagsatzung (Verhandlung)', description: 'TP 3A II: Mündliche Verhandlung (1. Std voll, weitere 50%)', keywords: ['verhandlung', 'tagsatzung', 'stunde'], gkgColumn: undefined },
      { id: 'TP3A', label: 'Klagbeantwortung (Ausführlich)', description: 'TP 3A I: Beantwortung mit Sachverhalt', keywords: ['antwort', 'replik'], gkgColumn: 'zivil' },
      { id: 'TP3A', label: 'Vorbereitender Schriftsatz', description: 'TP 3A I: Nach § 257 ZPO', keywords: ['vorbereitung'], gkgColumn: 'zivil' },
      { id: 'TP3A', label: 'Einstweilige Verfügung', description: 'TP 3A I: Antrag EV', keywords: ['ev', 'einstweilig'], gkgColumn: 'sicherung' },
      { id: 'TP3A', label: 'Kostenrekurs', description: 'TP 3A I: Kostenrekurs', keywords: ['rekurs', 'kosten'], gkgColumn: 'zivil' },
    ]
  },
  {
    id: 'TP3B_C',
    label: 'TP 3B/C: Rechtsmittel',
    description: 'Berufung & Revision',
    items: [
      { id: 'TP3B', label: 'Berufung', description: 'TP 3B: Berufung an Obergericht', keywords: ['berufung', 'obergericht'], gkgColumn: 'zivil' },
      { id: 'TP3B', label: 'Berufungsbeantwortung', description: 'TP 3B: Berufungsbeantwortung', keywords: ['berufung', 'antwort'], gkgColumn: 'zivil' },
      { id: 'TP3C', label: 'Revision', description: 'TP 3C: Revision an OGH', keywords: ['revision', 'ogh'], gkgColumn: 'zivil' },
      { id: 'TP3C', label: 'Revisionsbeantwortung', description: 'TP 3C: Revisionsbeantwortung', keywords: ['revision', 'antwort'], gkgColumn: 'zivil' },
    ]
  },
  {
    id: 'TP_CORR',
    label: 'TP 5/6/8: Korrespondenz & Konferenz',
    description: 'Briefe, Telefonate, Besprechungen',
    items: [
      { id: 'TP5', label: 'Einfaches Schreiben', description: 'Mahnung, kurze Mitteilung (TP5)', keywords: ['brief', 'email'], gkgColumn: undefined },
      { id: 'TP6', label: 'Brief (Komplex)', description: 'Rechtsauskunft, Gutachten (TP6)', keywords: ['brief', 'gutachten'], gkgColumn: undefined },
      { id: 'TP8', label: 'Konferenz / Telefonat', description: 'Besprechung pro 30min (TP8)', keywords: ['konferenz', 'telefon'], gkgColumn: undefined },
    ]
  },
  {
    id: 'CASH',
    label: 'Barauslagen',
    description: 'Gerichtsgebühren & Sonstige Auslagen',
    items: [
      { 
        id: 'GKG', 
        label: 'Gerichtsgebühren (GGG)', 
        description: 'Automatische Berechnung nach GGG Tabelle', 
        keywords: ['gericht', 'gebühr', 'ggg', 'gkg'], 
        gkgColumn: 'zivil' // Default
      },
      { 
        id: 'BARAUSLAGE', 
        label: 'Sonstige Barauslage', 
        description: 'Manuelle Eingabe (Fahrtkosten, Kopien etc.)', 
        keywords: ['fahrt', 'reise', 'kopien', 'porto', 'spesen'], 
        gkgColumn: undefined 
      }
    ]
  }
];

export const ACTION_ITEMS: ActionItem[] = SERVICE_GROUPS.flatMap(g => g.items);

export const TP_LABELS: Record<string, string> = {
  'TP1': 'TP 1', 'TP2': 'TP 2', 'TP3A': 'TP 3A', 'TP3A_Session': 'TP 3A (Tagsatzung)', 'TP3B': 'TP 3B',
  'TP3C': 'TP 3C', 'TP5': 'TP 5', 'TP6': 'TP 6', 'TP7': 'TP 7',
  'TP8': 'TP 8', 'TP9': 'TP 9',
  'GKG': 'Gerichtsgebühren',
  'BARAUSLAGE': 'Barauslage'
};