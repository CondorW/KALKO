<script lang="ts">
  import { calculateFees, formatCurrency, ACTION_ITEMS, TP_LABELS, type TarifPosten, type Position, type ActionItem } from '../logic';
  import { GKG_LABELS, type GKG_COLUMN } from '../tarife/gkg';

  // --- STATE ---
  let editId = $state<string | null>(null);
  
  // Inputs
  let editValue = $state(50000);
  let editType = $state<TarifPosten>('TP3A');
  let editGkgColumn = $state<GKG_COLUMN | undefined>('zivil'); // Standard Zivil
  let editIsAppeal = $state(false); // Rechtsmittel?
  
  let editMultiplier = $state(1);
  let editUnitRate = $state(true);
  let editSurcharge = $state(false);
  // NEU: Statt editForeign nutzen wir explizit editVat (USt verrechnet)
  let editVat = $state(true); 
  let editIncludeCourtFee = $state(false);
  
  let editLabel = $state('');
  let editDesc = $state('');

  // Search
  let searchQuery = $state('');
  let showDropdown = $state(false);
  
  let filteredActions = $derived(
    ACTION_ITEMS.filter(item => {
      if (!searchQuery && !showDropdown) return false;
      const q = searchQuery.toLowerCase();
      return item.label.toLowerCase().includes(q) || item.keywords.some(k => k.includes(q));
    })
  );

  let isTimeBased = $derived(['TP7', 'TP8', 'TP9'].includes(editType));
  let isQuantityBased = $derived(['TP5', 'TP6'].includes(editType));
  
  // Sichere Werte für Vorschau
  let safeValue = $derived(Math.max(0, editValue));
  let safeMultiplier = $derived(Math.max(0, editMultiplier));

  // Preview Logic
  // Wir übergeben !editVat als 'isForeign', da isForeign = true bedeutet "Keine USt"
  let previewResult = $derived(calculateFees(
    safeValue, editType, editGkgColumn, editIsAppeal, safeMultiplier, editUnitRate, editSurcharge, !editVat, editIncludeCourtFee
  ));

  let positions = $state<Position[]>([]);
  let copied = $state(false);

  // --- ACTIONS ---

  function selectAction(item: ActionItem) {
    editType = item.id;
    editGkgColumn = item.gkgColumn; // GKG Typ übernehmen
    editIsAppeal = item.id === 'TP3B' || item.id === 'TP3C'; // Auto-Detect Appeal
    
    searchQuery = item.label;
    showDropdown = false;
    
    if (!editId) {
        editLabel = item.label;
        editDesc = item.description;
    }
    
    // Auto-GKG: Wenn Aktion einen GKG Typ hat, aktiviere Checkbox
    if (item.gkgColumn) editIncludeCourtFee = true;
    else editIncludeCourtFee = false;
  }

  function savePosition() {
    let finalLabel = editLabel.trim() || TP_LABELS[editType];
    const newDetails = calculateFees(
        safeValue, editType, editGkgColumn, editIsAppeal, safeMultiplier, editUnitRate, editSurcharge, !editVat, editIncludeCourtFee
    );

    const posData: Position = {
        id: editId || crypto.randomUUID(),
        label: finalLabel,
        description: editDesc,
        value: safeValue,
        multiplier: safeMultiplier,
        type: editType,
        gkgColumn: editGkgColumn,
        isAppeal: editIsAppeal,
        details: newDetails
    };

    if (editId) {
        const idx = positions.findIndex(p => p.id === editId);
        if (idx !== -1) positions[idx] = posData;
        editId = null;
    } else {
        positions.push(posData);
    }
    resetEditor();
  }

  function editPosition(pos: Position) {
    editId = pos.id;
    editValue = pos.value;
    editType = pos.type;
    editGkgColumn = pos.gkgColumn;
    editIsAppeal = !!pos.isAppeal;
    editMultiplier = pos.multiplier;
    editUnitRate = pos.details.config.hasUnitRate;
    editSurcharge = pos.details.config.hasSurcharge;
    // Mapping: isForeign -> !editVat
    editVat = !pos.details.config.isForeign;
    editIncludeCourtFee = pos.details.courtFee > 0;
    editLabel = pos.label;
    editDesc = pos.description || '';
    searchQuery = pos.label;
  }

  function resetEditor() {
    editId = null;
    editLabel = '';
    editDesc = '';
    searchQuery = '';
    editIncludeCourtFee = false;
    editVat = true; // Reset auf "USt verrechnet"
    if (isTimeBased || isQuantityBased) editMultiplier = 1;
  }

  function removePosition(id: string) {
    const idx = positions.findIndex(p => p.id === id);
    if (idx !== -1) positions.splice(idx, 1);
    if (editId === id) resetEditor();
  }

  // Hilfsfunktion: Minus-Taste blockieren
  function blockNegative(e: KeyboardEvent) {
    if (e.key === '-' || e.key === 'e') {
      e.preventDefault();
    }
  }

  let totalNet = $derived(positions.reduce((sum, p) => sum + p.details.netTotal, 0));
  let totalVat = $derived(positions.reduce((sum, p) => sum + p.details.vatAmount, 0));
  let totalCourt = $derived(positions.reduce((sum, p) => sum + p.details.courtFee, 0));
  let totalGross = $derived(positions.reduce((sum, p) => sum + p.details.grossTotal, 0));

  async function copyToClipboard() {
    const padNum = (val: number) => val.toLocaleString('de-LI', { minimumFractionDigits: 2 }).padStart(12, ' ');
    let text = `KOSTENNOTE\n--------------------------------\n`;
    positions.forEach((p, i) => {
        text += `${i+1}. ${p.label}\n`;
        text += `   Honorar .................... ${padNum(p.details.netTotal)}\n`;
        if(p.details.courtFee > 0) text += `   GKG (${p.details.config.courtFeeLabel}) ....... ${padNum(p.details.courtFee)}\n`;
    });
    text += `--------------------------------\n`;
    text += `Netto ........................ ${padNum(totalNet)}\n`;
    text += `USt .......................... ${padNum(totalVat)}\n`;
    text += `Gerichtskosten ............... ${padNum(totalCourt)}\n`;
    text += `TOTAL ........................ ${padNum(totalGross)}`;
    await navigator.clipboard.writeText(text);
    copied = true; setTimeout(() => copied = false, 2000);
  }
</script>

<div class="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
  
  <!-- EDITOR -->
  <div class="lg:col-span-5 space-y-6">
    <div class="card h-fit sticky top-4 z-20 border-t-4 {editId ? 'border-t-orange-500' : 'border-t-legal-gold'}">
      <h2 class="text-xl font-semibold text-white border-b border-legal-700 pb-2 mb-4 flex justify-between items-center">
        <span>{editId ? 'Position bearbeiten' : 'Leistung erfassen'}</span>
        {#if editId}<button onclick={resetEditor} class="text-xs text-slate-400 hover:text-white">Abbrechen</button>{/if}
      </h2>
      
      <div class="space-y-4">
        <!-- SEARCH -->
        <div class="relative">
          <label class="label-text" for="search">Leistung</label>
          <input id="search" type="text" bind:value={searchQuery} onfocus={() => showDropdown = true} placeholder="Suche..." class="input-field" autocomplete="off" />
          {#if showDropdown && (searchQuery || filteredActions.length > 0)}
            <ul class="absolute top-full left-0 right-0 mt-1 bg-legal-800 border border-legal-700 rounded-lg shadow-xl max-h-80 overflow-y-auto z-50">
              {#each filteredActions as item}
                <li>
                  <button class="w-full text-left p-3 hover:bg-legal-700 text-sm text-slate-200 transition-colors cursor-pointer border-b border-legal-700/50" onmousedown={() => selectAction(item)}>
                    <div class="font-semibold text-legal-gold">{item.label}</div>
                    <div class="text-xs text-slate-500 font-mono">{item.description}</div>
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        <!-- DETAILS -->
        <div>
            <label class="label-text" for="label">Bezeichnung</label>
            <input id="label" type="text" bind:value={editLabel} class="input-field" />
            {#if editDesc}<div class="text-[10px] text-slate-500 mt-1">{editDesc}</div>{/if}
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="label-text" for="val">Streitwert</label>
                <!-- FRONTEND VALIDATION: min="0", blockiert Minus-Taste -->
                <input 
                  id="val" 
                  type="number" 
                  min="0" 
                  onkeydown={blockNegative}
                  bind:value={editValue} 
                  class="input-field font-mono" 
                />
            </div>
            {#if isTimeBased || isQuantityBased}
            <div>
                <label class="label-text" for="mult">{isTimeBased ? 'Einh.' : 'Anz.'}</label>
                <!-- FRONTEND VALIDATION: min="0", blockiert Minus-Taste -->
                <input 
                  id="mult" 
                  type="number" 
                  min="0" 
                  step="0.5" 
                  onkeydown={blockNegative}
                  bind:value={editMultiplier} 
                  class="input-field font-mono" 
                />
            </div>
            {/if}
        </div>

        <!-- OPTIONS -->
        <div class="space-y-3 pt-2 bg-legal-900/50 p-3 rounded border border-legal-700/50">
          <!-- EHS CHECKBOX MIT VORSCHAU -->
          <label class="flex items-center space-x-3 cursor-pointer group">
            <input type="checkbox" bind:checked={editUnitRate} class="w-4 h-4 rounded border-legal-700 bg-legal-900 text-legal-accent">
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-300">Einheitssatz</span>
              {#if editUnitRate}
                <span class="text-xs text-legal-gold font-mono bg-legal-gold/10 px-1 rounded">
                  {previewResult.config.ehsLabel} <span class="opacity-60">|</span> {formatCurrency(previewResult.unitRateAmount)}
                </span>
              {/if}
            </div>
          </label>

          <label class="flex items-center space-x-3 cursor-pointer group">
            <input type="checkbox" bind:checked={editSurcharge} class="w-4 h-4 rounded border-legal-700 bg-legal-900 text-legal-accent">
            <span class="text-sm text-slate-300">Genossenzuschlag</span>
          </label>
          
          <!-- UST CHECKBOX MIT VORSCHAU -->
          <label class="flex items-center space-x-3 cursor-pointer group">
            <input type="checkbox" bind:checked={editVat} class="w-4 h-4 rounded border-legal-700 bg-legal-900 text-legal-accent">
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-300">USt verrechnet</span>
              {#if editVat}
                <span class="text-xs text-blue-300 font-mono bg-blue-500/10 px-1 rounded">
                  8.1% <span class="opacity-60">|</span> {formatCurrency(previewResult.vatAmount)}
                </span>
              {/if}
            </div>
          </label>
          
          <div class="h-px bg-legal-700/50 my-1"></div>
          
          <!-- GKG CHECKBOX MIT VORSCHAU -->
          <label class="flex items-center space-x-3 cursor-pointer group">
            <input type="checkbox" bind:checked={editIncludeCourtFee} class="w-4 h-4 rounded border-legal-700 bg-legal-900 text-legal-accent">
            <div class="flex items-center gap-2">
                <span class="text-sm text-white font-medium">Gerichtsgebühr (GGG)</span>
                {#if editIncludeCourtFee}
                    <span class="text-xs text-blue-300 font-mono bg-blue-500/10 px-1 rounded">
                        {previewResult.config.courtFeeLabel || 'GKG'} <span class="opacity-60">|</span> {formatCurrency(previewResult.courtFee)}
                    </span>
                {/if}
            </div>
          </label>

          {#if editIncludeCourtFee}
            <div class="pl-7 space-y-2">
                <select bind:value={editGkgColumn} class="input-field text-xs py-1">
                    {#each Object.entries(GKG_LABELS) as [key, label]}
                        <option value={key}>{label}</option>
                    {/each}
                </select>
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" bind:checked={editIsAppeal} class="w-3 h-3 rounded border-slate-600 bg-slate-800">
                    <span class="text-xs text-slate-400">Rechtsmittel (2x Gebühr)</span>
                </label>
            </div>
          {/if}
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-legal-700">
            <div class="text-xs text-slate-500">Total: <span class="text-white font-bold">{formatCurrency(previewResult.grossTotal)}</span></div>
            <button onclick={savePosition} class="btn-primary py-2 px-6 text-sm">{editId ? 'Speichern' : 'Hinzufügen'}</button>
        </div>
      </div>
    </div>
  </div>

  <!-- RIGHT: LIST -->
  <div class="lg:col-span-7 flex flex-col h-full z-10">
    <div class="card flex-grow bg-gradient-to-br from-legal-800 to-legal-900 border-legal-gold/30 flex flex-col p-0 overflow-hidden">
      <div class="p-4 border-b border-legal-700 bg-legal-800/80 flex justify-between items-center">
        <h2 class="font-bold text-white">Leistungsaufstellung</h2>
        {#if positions.length > 0}<button onclick={() => positions = []} class="text-xs text-red-400 hover:underline">Reset</button>{/if}
      </div>

      <div class="flex-grow overflow-y-auto p-4 space-y-3">
        {#each positions as pos (pos.id)}
            <div class="bg-legal-900/40 rounded border border-legal-700 p-3 hover:border-legal-500 transition-colors cursor-pointer group relative {editId === pos.id ? 'ring-1 ring-orange-500' : ''}" onclick={() => editPosition(pos)}>
                <button onclick={(e) => { e.stopPropagation(); removePosition(pos.id); }} class="absolute top-2 right-2 text-slate-600 hover:text-red-500 p-1">✕</button>
                <div class="flex justify-between items-start pr-8">
                    <div>
                        <div class="font-medium text-white text-sm">{pos.label}</div>
                        {#if pos.description}<div class="text-[10px] text-slate-500 font-mono mt-0.5">{pos.description}</div>{/if}
                    </div>
                    <div class="text-right"><div class="font-mono text-sm text-white">{formatCurrency(pos.details.netTotal)}</div></div>
                </div>
                {#if pos.details.courtFee > 0}
                    <div class="mt-2 text-[10px] text-blue-300 bg-blue-900/20 px-2 py-1 rounded w-fit">⚖️ GKG: {formatCurrency(pos.details.courtFee)}</div>
                {/if}
            </div>
        {/each}
        {#if positions.length === 0}<div class="text-center py-10 text-slate-600 text-sm italic">Keine Positionen.</div>{/if}
      </div>

      <div class="bg-legal-900 p-4 border-t border-legal-700 space-y-1 font-mono text-sm">
        <div class="flex justify-between text-slate-400"><span>Netto Honorar</span><span>{formatCurrency(totalNet)}</span></div>
        <div class="flex justify-between text-slate-400"><span>USt (8.1%)</span><span>{formatCurrency(totalVat)}</span></div>
        {#if totalCourt > 0}<div class="flex justify-between text-blue-400"><span>Gerichtskosten</span><span>{formatCurrency(totalCourt)}</span></div>{/if}
        <div class="h-px bg-legal-700 my-2"></div>
        <div class="flex justify-between text-lg font-bold text-legal-gold"><span>TOTAL</span><span>{formatCurrency(totalGross)}</span></div>
        <button onclick={copyToClipboard} disabled={positions.length === 0} class="w-full mt-4 py-2 bg-legal-700 hover:bg-legal-600 text-white rounded text-center text-xs uppercase tracking-wide font-bold disabled:opacity-50">{copied ? 'Kopiert!' : 'Kopieren'}</button>
      </div>
    </div>
  </div>
</div>