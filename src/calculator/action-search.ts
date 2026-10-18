import type { ActionItem } from '../fees';

/** Gross-/Kleinschreibung, Umlaute und Tarifschreibweisen sind für die Suche gleichwertig. */
function normalise(value: string): string {
  return value.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/tp\s+(\d)/g, 'tp$1').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/** Alle Suchwörter müssen passen, auch über Bezeichnung, Tarif und Synonyme verteilt. */
export function searchActions(actions: readonly ActionItem[], query: string): ActionItem[] {
  const tokens = normalise(query).trim().split(/\s+/).filter(Boolean);
  return actions.filter(action => {
    const text = normalise([action.label, action.id, action.description, ...action.keywords].join(' '));
    // Kurze Tarifglieder wie „I“ oder „b“ müssen ein eigenes Wort sein.
    // Sonst würde lit. b auch auf das b in „Schreiben“ passen.
    const words = text.split(/\s+/);
    return tokens.every(token => token.length <= 2 ? words.includes(token) : text.includes(token));
  });
}
