<script lang="ts">
  import { calculateFees, formatCurrency, TP_LABELS, type TarifPosten, type Position } from '../logic';

  // --- EDITOR STATE (Linke Seite) ---
  let editValue = $state(50000);
  let editType = $state<TarifPosten>('TP3A');
  let editUnitRate = $state(true);
  let editSurcharge = $state(false);
  let editLabel = $state(''); // Optionaler Name für die Position

  // --- LIST STATE (Rechte Seite) ---
  // Wir verwenden eine Liste von Positionen statt einem einzelnen Resultat
  let positions = $state<Position[]>([]);
  let copied = $state(false);

  // Berechne Vorschau für den aktuellen Editor-Input
  let previewResult = $derived(calculateFees(editValue, editType, editUnitRate, editSurcharge));

  // --- ACTIONS ---

  function addPosition() {
    const newPos: Position = {
      id: crypto.randomUUID(),
      // Wenn kein Label eingegeben wurde, generiere eins automatisch
      label: editLabel.trim() || `${TP_LABELS[editType]} (Basis ${formatCurrency(editValue)})`,
      value: editValue,
      type: editType,
      details: previewResult // Das Ergebnis einfrieren
    };

    // Hinzufügen (Reaktivität durch Svelte 5 Array Methoden)
    positions.push(newPos);
    
    // Reset Label für nächsten Eintrag (Werte behalten wir für schnelles Hinzufügen ähnlicher Items)
    editLabel = '';
  }

  function removePosition(id: string) {
    const idx = positions.findIndex(p => p.id === id);
    if (idx !== -1) positions.splice(idx, 1);
  }

  // --- TOTALS (Derived) ---
  let totalNet = $derived(positions.reduce((sum, p) => sum + p.details.netTotal, 0));
  let totalVat = $derived(positions.reduce((sum, p) => sum + p.details.vatAmount, 0));
  let totalGross = $derived(positions.reduce((sum, p) => sum + p.details.grossTotal, 0));


  // --- CLIPBOARD LOGIC ---
  async function copyToClipboard() {
    const date = new Date().toLocaleDateString('de-LI');
    
    // Formatting Helper: Rechtsbündig mit fester Breite für "Typewriter"-Look
    const padNum = (val: number) => {
      return val.toLocaleString('de-LI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(12, ' ');
    };
    
    const line = "--------------------------------------------------------";

    let text = `KOSTENNOTE\nDatum: ${date}\n${line}\n\n`;

    // Tabelle generieren
    positions.forEach((p, i) => {
      text += `${i + 1}. ${p.label}\n`;
      text += `   Basisgebühr ............................ ${padNum(p.details.baseFee)}\n`;
      
      if (p.details.config.hasUnitRate) {
        const ehsLabel = p.value <= 15000 ? "50%" : "40%";
        text += `   + EHS (${ehsLabel}) .......................... ${padNum(p.details.unitRateAmount)}\n`;
      }
      
      if (p.details.config.hasSurcharge) {
        text += `   + Genossenzuschlag (10%) ............... ${padNum(p.details.surchargeAmount)}\n`;
      }
      
      text += `   Zwischensumme Netto .................... ${padNum(p.details.netTotal)}\n\n`;
    });

    text += `${line}\n`;
    text += `TOTAL NETTO ............................... ${padNum(totalNet)}\n`;
    text += `+ 8.1% MwSt ............................... ${padNum(totalVat)}\n`;
    text += `${line}\n`;
    text += `GESAMTBETRAG .............................. ${padNum(totalGross)}\n`;

    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch (err) {
      alert('Clipboard Error');
    }
  }
</script>

<div class="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
  
  <!-- LEFT PANEL: INPUT / EDITOR (4 Columns) -->
  <div class="lg:col-span-4 space-y-6">
    <div class="card h-fit sticky top-4">
      <h2 class="text-xl font-semibold text-legal-gold border-b border-legal-700 pb-2 mb-4">
        Position hinzufügen
      </h2>
      
      <div class="space-y-4">
        <!-- Optional Label -->
        <div>
          <label class="label-text" for="label">Bezeichnung (Optional)</label>
          <input 
            id="label"
            type="text" 
            bind:value={editLabel} 
            placeholder="z.B. Klageeinbringung"
            class="input-field"
          />
        </div>

        <!-- Streitwert -->
        <div>
          <label class="label-text" for="value">Streitwert (CHF)</label>
          <input 
            id="value"
            type="number" 
            bind:value={editValue} 
            class="input-field font-mono text-lg"
            min="0"
            step="100"
          />
        </div>

        <!-- Tarifpost -->
        <div>
          <label class="label-text" for="type">Leistungstyp</label>
          <select id="type" bind:value={editType} class="input-field">
            <option value="TP3A">{TP_LABELS['TP3A']}</option>
            <option value="TP2">{TP_LABELS['TP2']}</option>
          </select>
        </div>

        <!-- Options -->
        <div class="space-y-3 pt-2 bg-legal-900/50 p-3 rounded border border-legal-700/50">
          <label class="flex items-center space-x-3 cursor-pointer group">
            <input type="checkbox" bind:checked={editUnitRate} class="w-4 h-4 rounded border-legal-700 bg-legal-900 text-legal-accent">
            <span class="text-sm text-slate-300">Einheitssatz (Art. 23)</span>
          </label>
          
          <label class="flex items-center space-x-3 cursor-pointer group">
            <input type="checkbox" bind:checked={editSurcharge} class="w-4 h-4 rounded border-legal-700 bg-legal-900 text-legal-accent">
            <span class="text-sm text-slate-300">Genossenzuschlag (10%)</span>
          </label>
        </div>

        <!-- Preview Mini -->
        <div class="text-right text-xs text-slate-500 pt-2 border-t border-legal-700">
          Vorschau: {formatCurrency(previewResult.netTotal)} Netto
        </div>

        <button onclick={addPosition} class="btn-primary w-full flex items-center justify-center gap-2">
          <span>+</span> Position hinzufügen
        </button>
      </div>
    </div>
  </div>

  <!-- RIGHT PANEL: LIST / TABLE (8 Columns) -->
  <div class="lg:col-span-8 flex flex-col h-full">
    <div class="card flex-grow bg-gradient-to-br from-legal-800 to-legal-900 border-legal-gold/30 relative flex flex-col">
      
      <div class="flex justify-between items-end mb-6 border-b border-legal-700 pb-4">
        <div>
          <h2 class="text-2xl font-bold text-white">Leistungsaufstellung</h2>
          <p class="text-slate-400 text-sm">{positions.length} Positionen erfasst</p>
        </div>
        {#if positions.length > 0}
            <button 
                onclick={() => positions = []} 
                class="text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
            >
                Alle löschen
            </button>
        {/if}
      </div>

      <!-- SCROLLABLE LIST -->
      <div class="flex-grow space-y-4 overflow-y-auto max-h-[500px] pr-2 mb-6">
        {#if positions.length === 0}
          <div class="text-center py-12 text-slate-500 border-2 border-dashed border-legal-700 rounded-lg">
            <p>Noch keine Positionen hinzugefügt.</p>
            <p class="text-xs mt-2">Nutzen Sie das Formular links.</p>
          </div>
        {:else}
            {#each positions as pos, index (pos.id)}
                <div class="bg-legal-900/50 rounded-lg p-4 border border-legal-700 hover:border-legal-600 transition-colors group relative">
                    <!-- Delete Button (Top Right) -->
                    <button 
                        onclick={() => removePosition(pos.id)}
                        class="absolute top-2 right-2 text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Entfernen"
                    >
                        ✕
                    </button>

                    <div class="flex justify-between items-start mb-2 pr-6">
                        <div>
                            <span class="bg-legal-700 text-white text-[10px] px-1.5 py-0.5 rounded mr-2">#{index + 1}</span>
                            <h3 class="font-semibold text-white inline">{pos.label}</h3>
                            <div class="text-xs text-slate-400 mt-0.5">
                                Streitwert: {formatCurrency(pos.value)} • {TP_LABELS[pos.type]}
                            </div>
                        </div>
                        <div class="text-right font-mono font-medium text-white">
                            {formatCurrency(pos.details.netTotal)}
                        </div>
                    </div>

                    <!-- Details Mini -->
                    <div class="text-xs text-slate-500 grid grid-cols-2 gap-x-4 pl-8">
                        <div>Basis: {formatCurrency(pos.details.baseFee)}</div>
                        {#if pos.details.config.hasUnitRate}
                            <div>+ EHS: {formatCurrency(pos.details.unitRateAmount)}</div>
                        {/if}
                        {#if pos.details.config.hasSurcharge}
                            <div class="col-span-2 text-legal-gold">+ Genossenzuschlag: {formatCurrency(pos.details.surchargeAmount)}</div>
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}
      </div>

      <!-- TOTALS FOOTER -->
      <div class="mt-auto bg-legal-900 p-4 rounded-lg border border-legal-700">
        <div class="space-y-1 text-sm font-mono">
          <div class="flex justify-between text-slate-400">
            <span>Summe Netto</span>
            <span>{formatCurrency(totalNet)}</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>USt (8.1%)</span>
            <span>{formatCurrency(totalVat)}</span>
          </div>
          <div class="h-px bg-legal-gold/50 my-2"></div>
          <div class="flex justify-between text-xl font-bold text-legal-gold">
            <span>GESAMT</span>
            <span>{formatCurrency(totalGross)}</span>
          </div>
        </div>

        <button 
            onclick={copyToClipboard}
            disabled={positions.length === 0}
            class="w-full mt-4 py-3 px-4 rounded font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer
            {copied ? 'bg-green-600 text-white' : 'bg-legal-accent hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'}"
        >
            {#if copied}
            <span>✓ Formatiert in Zwischenablage kopiert!</span>
            {:else}
            <span>📋 Tabelle für Word kopieren</span>
            {/if}
        </button>
      </div>

    </div>
  </div>
</div>