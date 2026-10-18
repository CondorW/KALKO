import { sumResults, hearingScenarios, additionalHearingHour } from './engine';
import type { CaseSettings, CalculationResult, FeePosition } from './types';

export interface CalculatedPosition extends FeePosition { details: CalculationResult }
export interface FeeNoteRow { cells: string[]; kind: 'service' | 'adjustment' | 'total' }
export interface FeeNoteTable { title: string; headers: string[]; rows: FeeNoteRow[] }

/**
 * Eine Tabellenstruktur für Bildschirm, Kopie, Textdownload und Druck.
 * Leistungszeilen enthalten nur das Grundhonorar. ES und Streitgenossenzuschlag
 * werden aus den bereits berechneten Positionen gruppiert; keine zweite Berechnung
 * auf einer pauschalen Gesamtsumme bei unterschiedlichen Sätzen oder Befreiungen.
 */
export function feeNoteTables(settings: CaseSettings, positions: readonly CalculatedPosition[]): FeeNoteTable[] {
  const en = settings.language === 'EN';
  const amount = (value: number) => new Intl.NumberFormat(en ? 'en-GB' : 'de-LI', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
  const total = sumResults(positions.map(position => position.details));
  const rows: FeeNoteRow[] = positions.map(position => ({
    kind: 'service', cells: [position.input.date,
      [position.label, position.description, position.details.config.isPending
        ? (en ? 'Pending – excluded from totals' : 'Offen – nicht in der Kostensumme') : ''].filter(Boolean).join('\n'),
      `${position.input.type} / ${position.input.kind}`, amount(position.details.baseFee)],
  }));
  const summary = (label: string, value: number, kind: FeeNoteRow['kind'] = 'adjustment') => {
    rows.push({ kind, cells: ['', label, '', amount(value)] });
  };
  summary(en ? 'Subtotal services' : 'Zwischensumme Leistungen', positions.reduce((sum, position) => sum + position.details.baseFee, 0));

  // Unterschiedliche ES-Prozente und lokale Overrides bleiben sichtbar und exakt.
  const groups = (type: 'unit' | 'surcharge' | 'vat') => {
    const buckets = new Map<number, { base: number; value: number }>();
    for (const { details } of positions) {
      if (details.config.isPending) continue;
      const percent = type === 'unit' ? Number.parseFloat(details.config.ehsLabel)
        : type === 'surcharge' ? details.config.surchargePercent : details.config.vatPercent;
      if (!percent) continue;
      const base = type === 'unit' ? details.baseFee : type === 'surcharge'
        ? details.baseFee + details.unitRateAmount : details.netTotal;
      const value = type === 'unit' ? details.unitRateAmount : type === 'surcharge' ? details.surchargeAmount : details.vatAmount;
      const previous = buckets.get(percent) ?? { base: 0, value: 0 };
      buckets.set(percent, { base: previous.base + base, value: previous.value + value });
    }
    return [...buckets].sort(([left], [right]) => left - right);
  };
  for (const [percent, group] of groups('unit')) summary(`${en ? 'Unit rate' : 'Einheitssatz'} ${percent}% (${en ? 'basis' : 'Basis'} ${amount(group.base)})`, group.value);
  for (const [percent, group] of groups('surcharge')) summary(`${en ? 'Multiple-party surcharge' : 'Streitgenossenzuschlag'} ${percent}% (${en ? 'basis incl. unit rate' : 'Basis inkl. ES'} ${amount(group.base)})`, group.value);
  summary(en ? 'Net fees incl. surcharges' : 'Honorar netto inkl. Zuschläge', total.netTotal);
  for (const [percent, group] of groups('vat')) summary(`${en ? 'VAT' : 'USt'} ${percent}% (${en ? 'taxable fees' : 'steuerpflichtiges Honorar'} ${amount(group.base)})`, group.value);
  summary(en ? 'Court fees' : 'Gerichtsgebühren', total.courtFee);
  summary(en ? 'Cash expenses (disbursements)' : 'Barauslagen (durchlaufend)', total.expenses);
  // Netto umfasst auch die separat ausgewiesenen durchlaufenden Auslagen.
  // USt fällt ausschliesslich auf das Honorar an, nicht auf diese Auslagen.
  summary(en ? 'Total net' : 'Total Netto', total.netTotal + total.courtFee + total.expenses, 'total');
  summary(en ? 'Total VAT' : 'Total USt', total.vatAmount, 'total');
  summary(en ? 'Grand total' : 'Total Gesamt', total.grossTotal, 'total');
  const main: FeeNoteTable = {
    title: `${en ? 'FEE NOTE' : 'KOSTENVERZEICHNIS'} (${settings.currency})`,
    headers: en ? ['Date', 'Service', 'Tariff', 'Net amount'] : ['Datum', 'Leistung', 'Tarif', 'Netto'], rows,
  };
  const scenarios: FeeNoteTable[] = positions.filter(position => position.input.kind === 'OTS').map(position => ({
    title: `${en ? 'Pending hearing scenarios' : 'Szenarien offene Tagsatzung'}: ${position.label}`,
    headers: en ? ['Tariff', 'Hours', 'Additional cost', 'Total including recorded costs'] : ['Tarif', 'Stunden', 'Weitere Kosten', 'Gesamt inkl. erfasster Kosten'],
    rows: [
      ...hearingScenarios(position.input, settings).map(scenario => ({ kind: 'service' as const, cells: [scenario.type, String(scenario.units),
        amount(scenario.result.grossTotal), amount(total.grossTotal + scenario.result.grossTotal)] })),
      { kind: 'adjustment', cells: [en ? 'Each additional TP3A hour' : 'Weitere Stunde TP3A', '1', amount(additionalHearingHour(position.input, settings).grossTotal), ''] },
    ],
  }));
  return [main, ...scenarios];
}

/** Frei eingegebene Texte dürfen keine HTML-Tags oder Attribute erzeugen. */
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\r?\n/g, '<br>');
}

export function feeNoteHtml(settings: CaseSettings, positions: readonly CalculatedPosition[]): string {
  return '<div style="font-family:Arial,sans-serif;color:#000;background:#fff;">' + feeNoteTables(settings, positions).map((table, index) => {
    const header = `<thead><tr>${table.headers.map((label, column) => `<th scope="col" style="border:1px solid #aaa;padding:6px;text-align:${column === 3 ? 'right' : 'left'};background:#eee;">${escapeHtml(label)}</th>`).join('')}</tr></thead>`;
    const renderRow = (row: FeeNoteRow) => `<tr>${row.cells.map((value, column) => `<td style="border:1px solid #aaa;padding:6px;vertical-align:top;text-align:${column === 3 ? 'right' : 'left'};${row.kind === 'total' ? 'font-weight:bold;background:#f1f1f1;' : ''}">${escapeHtml(value)}</td>`).join('')}</tr>`;
    const body = table.rows.filter(row => row.kind !== 'total').map(renderRow).join('');
    const footer = table.rows.filter(row => row.kind === 'total').map(renderRow).join('');
    return `<h${index ? '2' : '1'} style="font-size:${index ? '14' : '16'}px;">${escapeHtml(table.title)}</h${index ? '2' : '1'}>`
      + `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:11px;">${header}<tbody>${body}</tbody>${footer ? `<tfoot>${footer}</tfoot>` : ''}</table>`;
  }).join('') + '</div>';
}

/** Tabs erhalten die vier Spalten; Nutzereingaben bleiben auch bei Formelzeichen Text. */
export function feeNoteTsv(settings: CaseSettings, positions: readonly CalculatedPosition[]): string {
  const cell = (value: string) => {
    const text = value.replace(/[\t\r\n]+/g, ' ');
    return /^[=+@-]/.test(text.trimStart()) ? `'${text}` : text;
  };
  return feeNoteTables(settings, positions).map(table => [
    table.title, table.headers.map(cell).join('\t'), ...table.rows.map(row => row.cells.map(cell).join('\t')),
  ].join('\r\n')).join('\r\n\r\n');
}

/** Textdatei und Kopie enthalten dieselben Zeilen; keine Metadaten ausserhalb der Tabelle. */
export function feeNoteText(settings: CaseSettings, positions: readonly CalculatedPosition[]): string {
  return feeNoteTables(settings, positions).map(table => [table.title,
    table.headers.join(' | '), ...table.rows.map(row => row.cells.map(value => value.replace(/\r?\n/g, ' ')).join(' | ')),
  ].join('\n')).join('\n\n');
}

/** Download bleibt lokal und wird ausschliesslich durch einen Benutzerklick ausgelöst. */
export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
