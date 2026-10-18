/**
 * HTML für Textverarbeitung, tabulatorgetrennter Text für Tabellenprogramme.
 * Ein einzelner ClipboardItem bietet beide Darstellungen desselben Verzeichnisses.
 */
export async function copyTable(html: string, text: string): Promise<void> {
  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      })]);
      return;
    } catch {
      // Ältere Browser und eingeschränkte Berechtigungen: derselbe Inhalt wird
      // über ein echtes Copy-Ereignis angeboten, nicht still zu Fliesstext reduziert.
    }
  }
  if (!copyUsingEvent(html, text)) throw new Error('Die Tabelle konnte nicht kopiert werden.');
}

function copyUsingEvent(html: string, text: string): boolean {
  const previousFocus = document.activeElement;
  const selection = document.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.style.cssText = 'position:fixed;left:-10000px;top:0;';
  let supplied = false;
  const onCopy = (event: ClipboardEvent) => {
    if (!event.clipboardData) return;
    event.clipboardData.setData('text/html', html);
    event.clipboardData.setData('text/plain', text);
    event.preventDefault();
    supplied = true;
  };
  document.body.append(field);
  document.addEventListener('copy', onCopy);
  try {
    field.focus({ preventScroll: true });
    field.select();
    return document.execCommand('copy') && supplied;
  } catch {
    return false;
  } finally {
    document.removeEventListener('copy', onCopy);
    field.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    if (selection) {
      selection.removeAllRanges();
      ranges.forEach(range => selection.addRange(range));
    }
  }
}
