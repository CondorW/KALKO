<script lang="ts">
  import type { Position } from '../logic';
  import CalculatorEditor from './CalculatorEditor.svelte';
  import CalculatorStatement from './CalculatorStatement.svelte';

  let positions = $state<Position[]>([]);
  let positionToEdit = $state<Position | null>(null);
  let copied = $state(false);

  let totalNet = $derived(positions.reduce((sum, p) => p.details.config.isExpense ? sum : sum + p.details.netTotal, 0));
  let totalVat = $derived(positions.reduce((sum, p) => sum + p.details.vatAmount, 0));
  let totalExpenses = $derived(positions.reduce((sum, p) => {
      if (p.type === 'GGG' || p.type === 'BARAUSLAGE') return sum + p.details.grossTotal;
      return sum + p.details.courtFee;
  }, 0));
  let totalGross = $derived(totalNet + totalVat + totalExpenses);

  let totals = $derived({
    net: totalNet,
    vat: totalVat,
    expenses: totalExpenses,
    gross: totalGross
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

  function getInvoiceText(): string {
    const padNum = (val: number) => val.toLocaleString('de-LI', { minimumFractionDigits: 2 }).padStart(12, ' ');
    let text = `KOSTENNOTE\n--------------------------------\n`;
    positions.forEach((p, i) => {
        const d = new Date(p.date);
        const dateStr = d.toLocaleDateString('de-CH');
        
        let extraTags = '';
        if (p.details.config.isShortMeeting) extraTags += ' [<10 Min]';
        if (p.details.config.hasInfoSurcharge) extraTags += ' [+Info]';

        text += `${i+1}. [${dateStr}] ${p.label}${extraTags}\n`;
        
        if (p.type === 'TP3A_Session') {
            text += `   Dauer: ${p.multiplier} Std.\n`;
        } else if ((p.details.config.isTimeBased || p.multiplier > 1) && !p.details.config.isExpense) {
            text += `   Menge/Dauer: ${p.multiplier}\n`;
        }

        if (p.details.config.isExpense) {
            text += `   Barauslage ................. ${padNum(p.details.grossTotal)}\n`;
        } else {
            text += `   Honorar .................... ${padNum(p.details.netTotal)}\n`;
            if(p.details.courtFee > 0) text += `   GGG (${p.details.config.courtFeeLabel}) ....... ${padNum(p.details.courtFee)}\n`;
        }
    });
    
    text += `--------------------------------\n`;
    text += `Netto Honorar ................ ${padNum(totalNet)}\n`;
    text += `USt (8.1%) ................... ${padNum(totalVat)}\n`;
    text += `Barauslagen (inkl. GGG) ...... ${padNum(totalExpenses)}\n`;
    text += `TOTAL ........................ ${padNum(totalGross)}`;
    return text;
  }

  function getInvoiceHTML(): string {
    const formatNum = (val: number) => val.toLocaleString('de-LI', { minimumFractionDigits: 2 });
    
    let html = `<table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt;">`;
    html += `<thead><tr>`;
    html += `<th style="text-align: left; border-bottom: 2px solid #000; padding: 6px 8px;">Pos.</th>`;
    html += `<th style="text-align: left; border-bottom: 2px solid #000; padding: 6px 8px;">Datum</th>`;
    html += `<th style="text-align: left; border-bottom: 2px solid #000; padding: 6px 8px;">Beschreibung</th>`;
    html += `<th style="text-align: right; border-bottom: 2px solid #000; padding: 6px 8px;">Betrag (CHF)</th>`;
    html += `</tr></thead><tbody>`;

    positions.forEach((p, i) => {
        const d = new Date(p.date);
        const dateStr = d.toLocaleDateString('de-CH');
        
        let extraTags = '';
        if (p.details.config.isShortMeeting) extraTags += ' [&lt;10 Min]';
        if (p.details.config.hasInfoSurcharge) extraTags += ' [+Info]';

        let descHtml = `<strong>${p.label}</strong> <span style="color: #666; font-size: 0.9em;">${extraTags}</span>`;
        
        if (p.type === 'TP3A_Session') {
            descHtml += `<br><span style="color: #555;">Dauer: ${p.multiplier} Std.</span>`;
        } else if ((p.details.config.isTimeBased || p.multiplier > 1) && !p.details.config.isExpense) {
            descHtml += `<br><span style="color: #555;">Menge/Dauer: ${p.multiplier}</span>`;
        }

        let amountHtml = '';
        if (p.details.config.isExpense) {
            amountHtml = formatNum(p.details.grossTotal);
            descHtml += `<br><span style="color: #555;">Barauslage</span>`;
        } else {
            amountHtml = formatNum(p.details.netTotal);
            descHtml += `<br><span style="color: #555;">Honorar</span>`;
            if (p.details.courtFee > 0) {
                amountHtml += `<br><span style="color: #555;">+ ${formatNum(p.details.courtFee)}</span>`;
                descHtml += `<br><span style="color: #555;">GGG (${p.details.config.courtFeeLabel})</span>`;
            }
        }

        html += `<tr>`;
        html += `<td style="padding: 6px 8px; vertical-align: top; border-bottom: 1px solid #eee;">${i+1}.</td>`;
        html += `<td style="padding: 6px 8px; vertical-align: top; border-bottom: 1px solid #eee;">${dateStr}</td>`;
        html += `<td style="padding: 6px 8px; vertical-align: top; border-bottom: 1px solid #eee;">${descHtml}</td>`;
        html += `<td style="padding: 6px 8px; vertical-align: top; text-align: right; border-bottom: 1px solid #eee;">${amountHtml}</td>`;
        html += `</tr>`;
    });

    html += `</tbody><tfoot>`;
    html += `<tr><td colspan="3" style="text-align: right; padding: 8px 8px 4px; padding-top: 16px;">Netto Honorar</td><td style="text-align: right; padding: 8px 8px 4px; padding-top: 16px;">${formatNum(totalNet)}</td></tr>`;
    html += `<tr><td colspan="3" style="text-align: right; padding: 4px 8px;">USt (8.1%)</td><td style="text-align: right; padding: 4px 8px;">${formatNum(totalVat)}</td></tr>`;
    html += `<tr><td colspan="3" style="text-align: right; padding: 4px 8px;">Barauslagen (inkl. GGG)</td><td style="text-align: right; padding: 4px 8px;">${formatNum(totalExpenses)}</td></tr>`;
    html += `<tr><td colspan="3" style="text-align: right; padding: 8px; font-weight: bold; border-top: 2px solid #000;">TOTAL</td><td style="text-align: right; padding: 8px; font-weight: bold; border-top: 2px solid #000;">${formatNum(totalGross)}</td></tr>`;
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
      {positions} 
      editId={positionToEdit?.id ?? null} 
      {totals} 
      {copied} 
      onEdit={handleEdit} 
      onRemove={handleRemove} 
      onReset={handleReset} 
      onCopy={handleCopy} 
      onDownload={handleDownload} 
    />
  </div>
</div>