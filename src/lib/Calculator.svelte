<script lang="ts">
  import { calculateFees, formatCurrency, TP_LABELS, SEARCH_OPTIONS, type TarifPosten, type Position, type SearchOption } from '../logic';

  // --- EDITOR STATE ---
  let editValue = $state(50000);
  let editType = $state<TarifPosten>('TP3A');
  let editMultiplier = $state(1); // NEU: Menge/Dauer
  let editUnitRate = $state(true);
  let editSurcharge = $state(false);
  let editForeign = $state(false);
  let editLabel = $state('');

  // --- SEARCH STATE ---
  let searchQuery = $state('Klage / Zivilprozess (TP 3A)');
  let showDropdown = $state(false);
  
  let filteredOptions = $derived(
    SEARCH_OPTIONS.filter(opt => {
      const q = searchQuery.toLowerCase();
      return opt.label.toLowerCase().includes(q) || opt.keywords.some(k => k.includes(q));
    })
  );

  // --- LOGIC ---
  // Prüfen ob Zeit-basierter Typ
  let isTimeBased = $derived(['TP7', 'TP8', 'TP9'].includes(editType));
  // Prüfen ob Nebenleistung (Auto-Disable EHS)
  let isAncillary = $derived(['TP5', 'TP6', 'TP7', 'TP8', 'TP9'].includes(editType));

  // Wenn man zu einer Nebenleistung wechselt, schalte EHS aus (UX)
  $effect(() => {
    if (isAncillary) {
        editUnitRate = false;
    } else {
        editUnitRate = true; // Reset für Hauptleistungen
    }
    // Reset Multiplier wenn nicht TimeBased
    if (!isTimeBased && editType !== 'TP5' && editType !== 'TP6') {
        editMultiplier = 1;
    }
  });

  let previewResult = $derived(calculateFees(editValue, editType, editMultiplier, editUnitRate, editSurcharge, editForeign));

  // --- ACTIONS ---
  let positions = $state<Position[]>([]);
  let copied = $state(false);

  function selectOption(opt: SearchOption) {
    editType = opt.id;
    searchQuery = opt.label;
    showDropdown = false;
  }

  function addPosition() {
    // Label generieren
    let autoLabel = editLabel.trim();
    if (!autoLabel) {
        const base = TP_LABELS[editType];
        if (isTimeBased) {
            autoLabel = `${base} (${editMultiplier} Einheiten)`;
        } else if (editMultiplier > 1) {
            autoLabel = `${base} (${editMultiplier}x)`;
        } else {
            autoLabel = base;
        }
    }

    const newPos: Position = {
      id: crypto.randomUUID(),
      label: autoLabel,
      value: editValue,
      multiplier: editMultiplier,
      type: editType,
      details: previewResult
    };
    positions.push(newPos);
    
    editLabel = '';
    editMultiplier = 1;
  }

  function removePosition(id: string) {
    const idx = positions.findIndex(p => p.id === id);
    if (idx !== -1) positions.splice(idx, 1);
  }

  // --- TOTALS ---
  let totalNet = $derived(positions.reduce((sum, p) => sum + p.details.netTotal, 0));
  let totalVat = $derived(positions.reduce((sum, p) => sum + p.details.vatAmount, 0));
  let totalGross = $derived(positions.reduce((sum, p) => sum + p.details.grossTotal, 0));

  async function copyToClipboard() {
    const date = new Date().toLocaleDateString('de-LI');
    const padNum = (val: number) => val.toLocaleString('de-LI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(12, ' ');
    const line = "--------------------------------------------------------";

    let text = `KOSTENNOTE\nDatum: ${date}\n${line}\n\n`;

    positions.forEach((p, i) => {
      text += `${i + 1}. ${p.label}\n`;
      
      // Detailzeile anpassen für Zeit/Anzahl
      let baseTxt = "Basisgebühr";
      if (p.details.config.isTimeBased) baseTxt = `Honorar (${p.multiplier} Einh.)`;
      else if (p.multiplier > 1) baseTxt = `Honorar (${p.multiplier}x)`;
      
      text += `   ${baseTxt.padEnd(28, '.')} ${padNum(p.details.baseFee)}\n`;
      
      if (p.details.config.hasUnitRate) {
        const ehsLabel = p.value <= 15000 ? "50%" : "40%";
        text += `   + EHS (${ehsLabel}) .......................... ${padNum(p.details.unitRateAmount)}\n`;
      }
      if (p.details.config.hasSurcharge) {
        text += `   + Genossenzuschlag (10%) ............... ${padNum(p.details.surchargeAmount)}\n`;
      }
      text += `   Zwischensumme Netto .................... ${padNum(p.details.netTotal)}\n`;
      if (p.details.config.isForeign) {
        text += `   (USt-frei: Mandant Ausland)\n`;
      }
      text += `\n`;
    });

    text += `${line}\n`;
    text += `TOTAL NETTO ............................... ${padNum(totalNet)}\n`;
    text += `+ USt (8.1%) .............................. ${padNum(totalVat)}\n`;
    text += `${line}\n`;
    text += `GESAMTBETRAG .............................. ${padNum(totalGross)}\n`;

    try { await navigator.clipboard.writeText(text); copied = true; setTimeout(() => copied = false, 2000); } 
    catch (err) { alert('Clipboard Error'); }
  }
</script>

<div class="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
  
  <!-- LEFT: EDITOR -->
  <div class="lg:col-span-4 space-y-6">
    <div class="card h-fit sticky top-4 overflow-visible z-20">
      <h2 class="text-xl font-semibold text-legal-gold border-b border-legal-700 pb-2 mb-4">
        Position hinzufügen
      </h2>
      
      <div class="space-y-4">
        
        <!-- SEARCH -->
        <div class="relative">
          <label class="label-text" for="search">Leistungstyp (Suche)</label>
          <input 
            id="search" type="text" value={searchQuery}
            oninput={(e) => { searchQuery = e.currentTarget.value; showDropdown = true; }}
            onfocus={() => showDropdown = true}
            onblur={() => setTimeout(() => showDropdown = false, 200)}
            placeholder="z.B. 'kla' oder 'ber'"
            class="input-field" autocomplete="off"
          />
          {#if showDropdown}
            <ul class="absolute top-full left-0 right-0 mt-1 bg-legal-800 border border-legal-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
              {#each filteredOptions as opt}
                <li><button class="w-full text-left p-3 hover:bg-legal-700 text-sm text-slate-200 transition-colors cursor-pointer" onmousedown={() => selectOption(opt)}>{opt.label}</button></li>
              {:else}
                <li class="p-3 text-sm text-slate-500">Keine Treffer</li>
              {/each}
            </ul>
          {/if}
        </div>

        <!-- Optional Label -->
        <div>
          <label class="label-text" for="label">Bezeichnung (Optional)</label>
          <input id="label" type="text" bind:value={editLabel} placeholder="Zusatztext..." class="input-field" />
        </div>

        <!-- Streitwert -->
        <div>
          <label class="label-text" for="value">Streitwert (CHF)</label>
          <input id="value" type="number" bind:value={editValue} class="input-field font-mono text-lg" min="0" step="100" />
        </div>

        <!-- Multiplier (Conditional) -->
        {#if isTimeBased || editType === 'TP5' || editType === 'TP6'}
            <div class="bg-legal-700/30 p-2 rounded border border-legal-600/50">
                <label class="label-text text-legal-accent" for="mult">
                    {isTimeBased ? 'Anzahl halbe Stunden / Einheiten' : 'Anzahl (Stück)'}
                </label>
                <input id="mult" type="number" bind:value={editMultiplier} class="input-field font-mono" min="0.5" step="0.5" />
            </div>
        {/if}

        <!-- Options -->
        <div class="space-y-3 pt-2 bg-legal-900/50 p-3 rounded border border-legal-700/50">
          <label class="flex items-center space-x-3 cursor-pointer group {isAncillary ? 'opacity-50' : ''}">
            <input type="checkbox" bind:checked={editUnitRate} disabled={isAncillary} class="w-4 h-4 rounded border-legal-700 bg-legal-900 text-legal-accent">
            <span class="text-sm text-slate-300">Einheitssatz (Art. 23)</span>
          </label>
          
          <label class="flex items-center space-x-3 cursor-pointer group">
            <input type="checkbox" bind:checked={editSurcharge} class="w-4 h-4 rounded border-legal-700 bg-legal-900 text-legal-accent">
            <span class="text-sm text-slate-300">Genossenzuschlag (10%)</span>
          </label>

          <div class="h-px bg-legal-700/50 my-1"></div>
          <label class="flex items-center space-x-3 cursor-pointer group">
            <input type="checkbox" bind:checked={editForeign} class="w-4 h-4 rounded border-legal-700 bg-legal-900 text-legal-accent">
            <span class="text-sm text-orange-200 font-medium">Mandant im Ausland (0% USt)</span>
          </label>
        </div>

        <div class="text-right text-xs text-slate-500 pt-2 border-t border-legal-700">
          Vorschau: {formatCurrency(previewResult.grossTotal)} Brutto
        </div>

        <button onclick={addPosition} class="btn-primary w-full flex items-center justify-center gap-2">
          <span>+</span> Position hinzufügen
        </button>
      </div>
    </div>
  </div>

  <!-- RIGHT: TABLE -->
  <div class="lg:col-span-8 flex flex-col h-full z-10">
    <div class="card flex-grow bg-gradient-to-br from-legal-800 to-legal-900 border-legal-gold/30 relative flex flex-col">
      <div class="flex justify-between items-end mb-6 border-b border-legal-700 pb-4">
        <div><h2 class="text-2xl font-bold text-white">Leistungsaufstellung</h2><p class="text-slate-400 text-sm">{positions.length} Positionen</p></div>
        {#if positions.length > 0}<button onclick={() => positions = []} class="text-xs text-red-400 hover:text-red-300 underline cursor-pointer">Alle löschen</button>{/if}
      </div>

      <div class="flex-grow space-y-4 overflow-y-auto max-h-[500px] pr-2 mb-6">
        {#if positions.length === 0}
          <div class="text-center py-12 text-slate-500 border-2 border-dashed border-legal-700 rounded-lg"><p>Liste leer.</p></div>
        {:else}
            {#each positions as pos, index (pos.id)}
                <div class="bg-legal-900/50 rounded-lg p-4 border border-legal-700 hover:border-legal-600 transition-colors group relative">
                    <button onclick={() => removePosition(pos.id)} class="absolute top-2 right-2 text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">✕</button>
                    <div class="flex justify-between items-start mb-2 pr-6">
                        <div>
                            <span class="bg-legal-700 text-white text-[10px] px-1.5 py-0.5 rounded mr-2">#{index + 1}</span>
                            <h3 class="font-semibold text-white inline">{pos.label}</h3>
                            <div class="text-xs text-slate-400 mt-0.5">
                                Streitwert: {formatCurrency(pos.value)} • {TP_LABELS[pos.type]}
                                {#if pos.multiplier > 1} <span class="text-legal-accent ml-2">x {pos.multiplier}</span> {/if}
                            </div>
                        </div>
                        <div class="text-right font-mono font-medium text-white">{formatCurrency(pos.details.netTotal)}</div>
                    </div>
                    <div class="text-xs text-slate-500 pl-8 space-y-1">
                        <div>Basis: {formatCurrency(pos.details.baseFee)}</div>
                        {#if pos.details.config.isForeign} <div class="text-orange-300">⚠ USt-frei (Ausland)</div> {/if}
                    </div>
                </div>
            {/each}
        {/if}
      </div>

      <div class="mt-auto bg-legal-900 p-4 rounded-lg border border-legal-700">
        <div class="space-y-1 text-sm font-mono">
          <div class="flex justify-between text-slate-400"><span>Summe Netto</span><span>{formatCurrency(totalNet)}</span></div>
          <div class="flex justify-between text-slate-400"><span>USt (8.1%)</span><span>{formatCurrency(totalVat)}</span></div>
          <div class="h-px bg-legal-gold/50 my-2"></div>
          <div class="flex justify-between text-xl font-bold text-legal-gold"><span>GESAMT</span><span>{formatCurrency(totalGross)}</span></div>
        </div>
        <button onclick={copyToClipboard} disabled={positions.length === 0} class="w-full mt-4 py-3 px-4 rounded font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer {copied ? 'bg-green-600 text-white' : 'bg-legal-accent hover:bg-blue-600 text-white disabled:opacity-50'}">
            {copied ? '✓ Kopiert!' : '📋 Tabelle für Word kopieren'}
        </button>
      </div>
    </div>
  </div>
</div>