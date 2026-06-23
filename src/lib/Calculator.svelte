<script lang="ts">
  import type { Position } from '../logic';
  import CalculatorEditor from './CalculatorEditor.svelte';
  import CalculatorStatement from './CalculatorStatement.svelte';

  let positions = $state<Position[]>([]);
  let positionToEdit = $state<Position | null>(null);
  let copied = $state(false);
  
  // Globaler Einheitssatz State
  let globalEHSActive = $state(true);

  let sortedPositions = $derived([...positions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB; 
    return b.details.grossTotal - a.details.grossTotal; 
  }));

  let totals = $derived.by(() => {
      let maxStreitwert = 0;
      let ehsBasis = 0;
      let netPositions = 0;
      let vatFromPositions = 0;
      let barauslagen = 0;
      let ggg = 0;

      for (const p of positions) {
          maxStreitwert = Math.max(maxStreitwert, p.value);
          if (p.details.config.isExpense) {
              if (p.type === 'BARAUSLAGE') barauslagen += p.details.grossTotal;
              if (p.type === 'GGG') ggg += p.details.grossTotal;
          } else {
              netPositions += p.details.netTotal;
              vatFromPositions += p.details.vatAmount;
              ggg += p.details.courtFee;
              
              // EHS berechtigt (Art. 23 RATG): TP1, 2, 3, 4, 7
              if (['TP1', 'TP2', 'TP3A', 'TP3B', 'TP3C', 'TP3A_Session', 'TP7'].includes(p.type as string)) {
                  ehsBasis += p.details.netTotal;
              }
          }
      }

      let ehsPercent = maxStreitwert > 15000 ? 0.4 : 0.5;
      let ehs = globalEHSActive ? (ehsBasis * ehsPercent) : 0;
      
      let hasVat = positions.some(p => p.details.vatAmount > 0);
      let ehsVat = (globalEHSActive && hasVat) ? ehs * 0.081 : 0;

      let vat = vatFromPositions + ehsVat;
      let gross = netPositions + ehs + vat + barauslagen + ggg;

      return {
          netPositions,
          ehs,
          ehsPercent: ehsPercent * 100,
          ehsActive: globalEHSActive,
          vat,
          barauslagen,
          ggg,
          gross
      };
  });

  function handleSave(pos: Position) {
    if (positionToEdit) {
      const idx = positions.findIndex(p => p.id === pos.id);
      if (idx !== -1) positions[idx] = pos;
    } else {
      positions.push(pos);
    }
    positionToEdit = null;
  }

  function handleEdit(pos: Position) {
    positionToEdit = pos;
  }

  function handleRemove(id: string) {
    positions = positions.filter(p => p.id !== id);
    if (positionToEdit?.id === id) positionToEdit = null;
  }

  function handleCancel() {
    positionToEdit = null;
  }

  function handleReset() {
    positions = [];
    positionToEdit = null;
  }

  function handleToggleEHS() {
    globalEHSActive = !globalEHSActive;
  }

  function getInvoiceText(): string {
    const padNum = (val: number) => val.toLocaleString('de-LI', { minimumFractionDigits: 2 }).padStart(12, ' ');
    let text = `KOSTENNOTE\n--------------------------------\n`;
    
    let displayIndex = 1;
    sortedPositions.forEach((p) => {
        if (p.type === 'GGG') return;

        const d = new Date(p.date);
        const dateStr = d.toLocaleDateString('de-CH');
        
        let amount = p.type === 'BARAUSLAGE' ? p.details.grossTotal : p.details.netTotal;
        text += `${displayIndex}. [${dateStr}] ${p.label}\n`;
        text += `   Betrag ....................... ${padNum(amount)}\n`;
        
        displayIndex++;
    });
    
    text += `--------------------------------\n`;
    text += `Netto ........................ ${padNum(totals.netPositions)}\n`;
    
    if (totals.ehsActive && totals.ehs > 0) {
        text += `Einheitssatz (${totals.ehsPercent}%) ........... ${padNum(totals.ehs)}\n`;
    }

    text += `MWST (8.1%) .................. ${padNum(totals.vat)}\n`;
    
    if (totals.barauslagen > 0) {
        text += `Barauslagen .................. ${padNum(totals.barauslagen)}\n`;
    }
    if (totals.ggg > 0) {
        text += `Gerichtsgebühren (GGG) ....... ${padNum(totals.ggg)}\n`;
    }
    text += `GESAMT ....................... ${padNum(totals.gross)}`;
    return text;
  }

  function getInvoiceHTML(): string {
    const formatNum = (val: number) => val.toLocaleString('de-LI', { minimumFractionDigits: 2 });
    
    let html = `<table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 11pt;">`;
    html += `<thead><tr>`;
    html += `<th style="text-align: left; border-bottom: 1px solid black; padding: 4px;">Pos.</th>`;
    html += `<th style="text-align: left; border-bottom: 1px solid black; padding: 4px;">Datum</th>`;
    html += `<th style="text-align: left; border-bottom: 1px solid black; padding: 4px;">Beschreibung</th>`;
    html += `<th style="text-align: right; border-bottom: 1px solid black; padding: 4px;">Betrag</th>`;
    html += `</tr></thead><tbody>`;

    let displayIndex = 1;
    sortedPositions.forEach((p) => {
        if (p.type === 'GGG') return;

        const d = new Date(p.date);
        const dateStr = d.toLocaleDateString('de-CH');
        
        let amount = p.type === 'BARAUSLAGE' ? p.details.grossTotal : p.details.netTotal;

        html += `<tr>`;
        html += `<td style="padding: 4px; vertical-align: top;">${displayIndex}.</td>`;
        html += `<td style="padding: 4px; vertical-align: top;">${dateStr}</td>`;
        html += `<td style="padding: 4px; vertical-align: top;">${p.label}</td>`;
        html += `<td style="padding: 4px; vertical-align: top; text-align: right;">${formatNum(amount)}</td>`;
        html += `</tr>`;

        displayIndex++;
    });

    html += `</tbody><tfoot>`;
    html += `<tr><td colspan="4" style="padding: 8px;"></td></tr>`;
    html += `<tr><td colspan="3" style="text-align: right; padding: 4px;">Netto</td><td style="text-align: right; padding: 4px;">${formatNum(totals.netPositions)}</td></tr>`;
    
    if (totals.ehsActive && totals.ehs > 0) {
        html += `<tr><td colspan="3" style="text-align: right; padding: 4px;">Einheitssatz (${totals.ehsPercent}%)</td><td style="text-align: right; padding: 4px;">${formatNum(totals.ehs)}</td></tr>`;
    }

    html += `<tr><td colspan="3" style="text-align: right; padding: 4px;">MWST (8.1%)</td><td style="text-align: right; padding: 4px;">${formatNum(totals.vat)}</td></tr>`;
    
    if (totals.barauslagen > 0) {
        html += `<tr><td colspan="3" style="text-align: right; padding: 4px;">Barauslagen</td><td style="text-align: right; padding: 4px;">${formatNum(totals.barauslagen)}</td></tr>`;
    }
    if (totals.ggg > 0) {
        html += `<tr><td colspan="3" style="text-align: right; padding: 4px;">Gerichtsgebühren (GGG)</td><td style="text-align: right; padding: 4px;">${formatNum(totals.ggg)}</td></tr>`;
    }
    html += `<tr><td colspan="3" style="text-align: right; padding: 4px; font-weight: bold;">GESAMT</td><td style="text-align: right; padding: 4px; font-weight: bold;">${formatNum(totals.gross)}</td></tr>`;
    html += `</tfoot></table>`;
    
    return html;
  }

  async function handleCopy() {
    const text = getInvoiceText();
    const html = getInvoiceHTML();

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const htmlBlob = new Blob([html], { type: 'text/html' });
        const textBlob = new Blob([text], { type: 'text/plain' });
        const clipboardItem = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch (err) {
      console.error('Clipboard write failed, using fallback', err);
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => copied = false, 2000);
    }
  }

  function handleDownload() {
    const text = getInvoiceText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kostennote_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
</script>

<div class="max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[calc(100vh-140px)] h-auto min-h-[600px]">
  <div class="lg:col-span-4 flex flex-col gap-6 lg:h-full h-[calc(100vh-120px)] overflow-hidden">
    <CalculatorEditor 
      {positionToEdit} 
      onSave={handleSave} 
      onCancel={handleCancel} 
    />
  </div>
  
  <div class="lg:col-span-8 flex flex-col lg:h-full h-[calc(100vh-120px)] overflow-hidden">
    <CalculatorStatement 
      positions={sortedPositions} 
      editId={positionToEdit?.id ?? null} 
      {totals} 
      {copied} 
      onEdit={handleEdit} 
      onRemove={handleRemove} 
      onReset={handleReset} 
      onCopy={handleCopy} 
      onDownload={handleDownload}
      onToggleEHS={handleToggleEHS}
    />
  </div>
</div>