import { describe, expect, test } from 'vitest';
import { ACTION_ITEMS } from '../fees';
import { searchActions } from './action-search';
import { feeNoteHtml, feeNoteTsv, type CalculatedPosition } from './fee-note';
import { calculatePosition } from './engine';
import { createFeeInput, DEFAULT_CASE } from './types';

const input = { ...createFeeInput('2024-01-01'), expenses: 100, includeCourtFee: true };
const position: CalculatedPosition = {
  id: '1', label: 'Klage', description: 'Leistung', input, details: calculatePosition(input, DEFAULT_CASE),
};

describe('Leistungssuche mit Tagsatzungen', () => {
  test.each(['Tagsatzung', 'Tagsatzungen', 'Verhandlung', 'Verhandlungen', 'hearing'])(
    '%s findet zeitbasierte Leistungen', query => {
      expect(searchActions(ACTION_ITEMS, query).some(action => action.kind === 'TS')).toBe(true);
    },
  );
  test('mehrere Suchwörter und getrennte Tarifschreibweise grenzen den Treffer ein', () => {
    const matches = searchActions(ACTION_ITEMS, 'VERHANDLUNG TP 3A');
    expect(matches.every(action => action.id === 'TP3A')).toBe(true);
    expect(matches[0]).toMatchObject({ id: 'TP3A', kind: 'TS' });
  });
  test('offene Tagsatzung setzt den Szenarientyp', () => {
    expect(searchActions(ACTION_ITEMS, 'offene tagsatzung')[0]).toMatchObject({ kind: 'OTS' });
  });
  test('Umlaute, Beschreibung und Leerzeichen werden berücksichtigt', () => {
    expect(searchActions(ACTION_ITEMS, '  rechtsOffnung  ')[0].label).toBe('Rechtsöffnung');
    expect(searchActions(ACTION_ITEMS, 'TP 1 Z I lit. b')[0].label).toBe('Akteneinsicht');
    expect(searchActions(ACTION_ITEMS, 'unbekannte Leistung')).toEqual([]);
  });
});

describe('Kostenverzeichnis als Tabelle', () => {
  test('HTML enthält echte Spalten, Rechendetails und eine Gesamtsumme', () => {
    const html = feeNoteHtml(DEFAULT_CASE, [position]);
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
    expect(html).toContain('<tfoot>');
    expect(html).toContain('Gerichtsgebühren');
    expect(html).toContain('Barauslagen');
    // 792 + 316.80 + 89.8128 + 850 + 100 = 2148.6128.
    expect(position.details.grossTotal).toBeCloseTo(2148.6128);
    expect(html).toContain('2&#39;148.61');
    expect(html).toContain('USt 8.1%');
  });
  test('Metadaten und Beschreibungen können weder Tags noch Attribute einschleusen', () => {
    const html = feeNoteHtml({ ...DEFAULT_CASE, client: '<script>alert("x")</script>' }, [
      { ...position, description: '<img src=x onerror=alert(1)> & "\'' },
    ]);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img ');
    expect(html).not.toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;');
    expect(html).toContain('&#39;');
  });
  test('Textdarstellung hat vier Spalten je Position, auch bei Tabs und Zeilenumbrüchen', () => {
    const tsv = feeNoteTsv(DEFAULT_CASE, [{ ...position, label: 'Klage\tZusatz\nText' }]);
    const row = tsv.split('\r\n').find(line => line.startsWith('2024-01-01\t'))!;
    expect(row.split('\t')).toHaveLength(4);
    expect(row).toContain('Klage Zusatz Text');
    expect(row.split('\t').at(-1)).toBe('792.00');
  });
  test('Formeln in Nutzereingaben bleiben beim Einfügen wörtlicher Text', () => {
    const tsv = feeNoteTsv({ ...DEFAULT_CASE, client: '=SUM(A1:A5)' }, [
      { ...position, label: '@SUM(A1:A5)' },
    ]);
    expect(tsv).not.toContain("=SUM(A1:A5)");
    expect(tsv).toContain("'@SUM(A1:A5)");
  });
  test('offene Tagsatzungen stehen getrennt und erhöhen die Summe nicht', () => {
    const pendingInput = { ...input, kind: 'OTS' as const };
    const pending = { ...position, id: '2', input: pendingInput, details: calculatePosition(pendingInput, DEFAULT_CASE) };
    const html = feeNoteHtml(DEFAULT_CASE, [position, pending]);
    expect(html).toContain('Szenarien offene Tagsatzung');
    expect(html).toContain('Weitere Stunde TP3A');
    const tsv = feeNoteTsv(DEFAULT_CASE, [position, pending]);
    const total = tsv.split('\r\n').find(line => line.startsWith('\tTotal Gesamt\t'))!;
    expect(total.split('\t').at(-1)).toBe("2'148.61");
  });
  test('englische Tabellen erhalten Metadaten und ausgewählte Währung', () => {
    const html = feeNoteHtml({ ...DEFAULT_CASE, language: 'EN', currency: 'EUR' }, [position]);
    expect(html).toContain('FEE NOTE (EUR)');
    expect(html).not.toContain('File No.');
    expect(html).toContain('Cash expenses');
    expect(html).toContain('2,148.61');
  });
});
