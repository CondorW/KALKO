<script lang="ts">
  import { calculateFees, formatCurrency, ACTION_ITEMS, SERVICE_GROUPS, TP_LABELS, type TarifPosten, type Position, type ActionItem, type ServiceGroup } from '../logic';
  import { GKG_LABELS, type GKG_COLUMN } from '../tarife/gkg';
  import { slide } from 'svelte/transition';

  // --- STATE ---
  let editId = $state<string | null>(null);
  let expandedId = $state<string | null>(null); // Für Transparenz-Details in der Liste
  
  // Inputs
  let editValue = $state(50000);
  let editType = $state<TarifPosten>('TP3A');
  let editGkgColumn = $state<GKG_COLUMN | undefined>('zivil'); // Standard Zivil
  let editIsAppeal = $state(false); // Rechtsmittel?
  
  let editMultiplier = $state(1);
  let editUnitRate = $state(true);
  let editSurcharge = $state(false);
  let editVat = $state(true); 
  let editIncludeCourtFee = $state(false);
  
  let editLabel = $state('');
  let editDesc = $state('');

  // Tree / Search State
  let searchQuery = $state('');
  let showDropdown = $state(false);
  // Set für aufgeklappte Gruppen im Dropdown
  let expandedGroups = $state(new Set<string>());

  // Filter Logic für Tree
  let filteredGroups = $derived.by(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return SERVICE_GROUPS; // Zeige alle Gruppen wenn keine Suche

    // Filter Gruppen, die passende Items haben
    return SERVICE_GROUPS.map((group: ServiceGroup) => {
      const matchingItems = group.items.filter((item: ActionItem) => 
        item.label.toLowerCase().includes(q) || 
        item.keywords.some((k: string) => k.includes(q)) ||
        group.label.toLowerCase().includes(q) // Auch Gruppenname matchen
      );
      
      if (matchingItems.length > 0) {
        return { ...group, items: matchingItems };
      }
      return null;
    }).filter((g: ServiceGroup | null) => g !== null) as ServiceGroup[];
  });

  // Auto-Expand bei Suche
  $effect(() => {
    if (searchQuery) {
      // Wenn gesucht wird, klappen wir alle Treffer auf
      const allIds = filteredGroups.map(g => g.id);
      expandedGroups = new Set(allIds);
    } else {
      // Reset wenn Suche leer (optional, oder man lässt es offen)
      // expandedGroups = new Set(); 
    }
  });

  function toggleGroup(groupId: string, e: Event) {
    e.stopPropagation(); // Verhindert Schließen des Dropdowns
    const newSet = new Set(expandedGroups);
    if (newSet.has(groupId)) {
      newSet.delete(groupId);
    } else {
      newSet.add(groupId);
    }
    expandedGroups = newSet;
  }

  // FIX: TP3A_Session hier hinzufügen, damit das Eingabefeld erscheint!
  let isTimeBased = $derived(['TP7', 'TP8', 'TP9', 'TP3A_Session'].includes(editType));
  let isQuantityBased = $derived(['TP5', 'TP6'].includes(editType));
  
  // Sichere Werte für Vorschau
  let safeValue = $derived(Math.max(0, editValue));
  let safeMultiplier = $derived(Math.max(0, editMultiplier));

  // Preview Logic
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
    
    // Label setzen
    editLabel = item.label;
    editDesc = item.description;
    
    // Suche zurücksetzen und schließen
    searchQuery = item.label; // Zeigt gewählte Aktion an
    showDropdown = false;
    
    // Auto-GKG Checkbox: Wir aktivieren es NICHT automatisch, um Transparenz zu wahren.
    // Der User muss GGG explizit anhaken.
    if (item.gkgColumn) {
        // Optional: Man könnte hier editIncludeCourtFee = true setzen, 
        // aber laut Anforderung soll es separat eingefügt werden.
        // Wir lassen es also standardmäßig aus oder übernehmen nur den Spalten-Typ.
    } else {
        editIncludeCourtFee = false;
    }
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
    editVat = true; 
    if (isTimeBased || isQuantityBased) editMultiplier = 1;
  }

  function removePosition(id: string) {
    const idx = positions.findIndex(p => p.id === id);
    if (idx !== -1) positions.splice(idx, 1);
    if (editId === id) resetEditor();
  }

  function toggleDetails(id: string, e: Event) {
    e.stopPropagation();
    if (expandedId === id) expandedId = null;
    else expandedId = id;
  }

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
        // ADDED: Logic for detailed description of time-based items like TP3A_Session
        if (p.type === 'TP3A_Session') {
             const hours = Math.ceil(p.multiplier);
             const additional = Math.max(0, hours - 1);
             text += `   Dauer: ${p.multiplier} Std. (1x Voll, ${additional}x Halb)\n`;
        } else if (p.details.config.isTimeBased || p.multiplier > 1) {
             text += `   Menge/Dauer: ${p.multiplier}\n`;
        }

        text += `   Honorar .................... ${padNum(p.details.netTotal)}\n`;
        if(p.details.courtFee > 0) text += `   Gerichtsgebühren (${p.details.config.courtFeeLabel}) ... ${padNum(p.details.courtFee)}\n`;
    });
    text += `--------------------------------\n`;
    text += `Netto ........................ ${padNum(totalNet)}\n`;
    text += `USt .......................... ${padNum(totalVat)}\n`;
    text += `Gerichtsgebühren ............. ${padNum(totalCourt)}\n`;
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
        <!-- TREE SEARCH DROPDOWN -->
        <div class="relative">
          <label class="label-text" for="search">Leistung</label>
          <div class="relative">
            <input 
                id="search" 
                type="text" 
                bind:value={searchQuery} 
                onfocus={() => showDropdown = true} 
                placeholder="Suchen oder Auswählen..." 
                class="input-field pr-8" 
                autocomplete="off" 
            />
            {#if showDropdown}
                <button class="absolute right-2 top-3 text-slate-500 hover:text-white" onclick={() => showDropdown = false}>✕</button>
            {/if}
          </div>

          {#if showDropdown}
            <div class="absolute top-full left-0 right-0 mt-1 bg-legal-800 border border-legal-700 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50 custom-scrollbar">
              {#if filteredGroups.length === 0}
                <div class="p-4 text-center text-slate-500 text-sm">Keine Ergebnisse.</div>
              {:else}
                <ul class="divide-y divide-legal-700/50">
                  {#each filteredGroups as group (group.id)}
                    <li>
                        <!-- Group Header -->
                        <button 
                            class="w-full flex items-center justify-between p-3 hover:bg-legal-700/50 text-left transition-colors group"
                            onclick={(e) => toggleGroup(group.id, e)}
                        >
                            <div>
                                <div class="font-bold text-legal-gold text-sm">{group.label}</div>
                                {#if group.description}<div class="text-[10px] text-slate-500">{group.description}</div>{/if}
                            </div>
                            <span class="text-slate-500 transform transition-transform {expandedGroups.has(group.id) ? 'rotate-180' : ''}">▼</span>
                        </button>

                        <!-- Group Items -->
                        {#if expandedGroups.has(group.id)}
                            <ul class="bg-black/20 border-t border-legal-700/30" transition:slide={{ duration: 150 }}>
                                {#each group.items as item}
                                    <li>
                                        <button 
                                            class="w-full text-left pl-6 pr-3 py-2 hover:bg-legal-700 text-slate-300 hover:text-white text-xs transition-colors flex flex-col"
                                            onmousedown={() => selectAction(item)}
                                        >
                                            <span class="font-medium">{item.label}</span>
                                            <span class="text-[10px] text-slate-500 font-mono">{item.description}</span>
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>
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
                <!-- DYNAMIC LABEL: Std. vs Einh. vs Anz. -->
                <label class="label-text" for="mult">
                    {#if editType === 'TP3A_Session'}Std.
                    {:else if isTimeBased}Einh.
                    {:else}Anz.{/if}
                </label>
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
          <!-- EHS CHECKBOX -->
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

          <!-- SURCHARGE WITH TOOLTIP -->
          <div class="flex items-center justify-between">
            <label class="flex items-center space-x-3 cursor-pointer group">
              <input type="checkbox" bind:checked={editSurcharge} class="w-4 h-4 rounded border-legal-700 bg-legal-900 text-legal-accent">
              <span class="text-sm text-slate-300">Genossenzuschlag</span>
            </label>
            
            <!-- Tooltip / Info Icon -->
            <div class="relative group">
                <div class="text-slate-500 hover:text-white cursor-help text-xs border border-slate-600 rounded-full w-4 h-4 flex items-center justify-center">i</div>
                <div class="absolute bottom-full right-0 mb-2 w-64 p-3 bg-black/90 text-slate-200 text-xs rounded border border-legal-700 hidden group-hover:block z-50 shadow-xl backdrop-blur-sm">
                    <div class="font-bold text-legal-gold mb-1 border-b border-slate-700 pb-1">Art. 15 RATG (Streitgenossen)</div>
                    <p class="leading-relaxed">
                        "Dem Rechtsanwalt gebührt eine Erhöhung, wenn er mehrere Personen vertritt oder mehreren gegenübersteht."
                    </p>
                    <ul class="list-disc list-inside mt-1 text-slate-400">
                        <li>+10% für die zweite Person</li>
                        <li>+5% für jede weitere Person</li>
                        <li>Maximal 50% Zuschlag</li>
                    </ul>
                </div>
            </div>
          </div>
          
          <!-- UST CHECKBOX -->
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
        </div>

        <!-- SEPARATER BLOCK FÜR GERICHTSGEBÜHREN (GGG) -->
        <div class="space-y-3 pt-2 bg-legal-900/30 p-3 rounded border border-legal-700/30">
          <label class="flex items-center space-x-3 cursor-pointer group">
            <input type="checkbox" bind:checked={editIncludeCourtFee} class="w-4 h-4 rounded border-legal-700 bg-legal-900 text-legal-accent">
            <div class="flex items-center gap-2">
                <span class="text-sm text-white font-medium">Gerichtsgebühren (GGG)</span>
                {#if editIncludeCourtFee}
                    <span class="text-xs text-blue-300 font-mono bg-blue-500/10 px-1 rounded">
                        {previewResult.config.courtFeeLabel || 'Basis'} <span class="opacity-60">|</span> {formatCurrency(previewResult.courtFee)}
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
            <!-- FIX: Outer element is now a div with proper accessibility roles -->
            <div 
                class="w-full text-left bg-legal-900/40 rounded border border-legal-700 p-3 hover:border-legal-500 transition-colors cursor-pointer group relative {editId === pos.id ? 'ring-1 ring-orange-500' : ''}" 
                role="button"
                tabindex="0"
                onclick={() => editPosition(pos)}
                onkeydown={(e) => e.key === 'Enter' && editPosition(pos)}
            >
                <div class="flex justify-between items-start pr-20 relative">
                    <div>
                        <div class="font-medium text-white text-sm">{pos.label}</div>
                        {#if pos.description}<div class="text-[10px] text-slate-500 font-mono mt-0.5">{pos.description}</div>{/if}
                        <!-- ADDED: Visible Duration/Quantity Indicator -->
                        {#if pos.type === 'TP3A_Session'}
                            <div class="text-[10px] text-legal-accent font-mono mt-0.5">
                                ⏱ {pos.multiplier} Std. (1x voll, {Math.max(0, Math.ceil(pos.multiplier)-1)}x halb)
                            </div>
                        {:else if (pos.details.config.isTimeBased || pos.multiplier > 1)}
                            <div class="text-[10px] text-legal-accent font-mono mt-0.5">
                                ✖ {pos.multiplier} {pos.type === 'TP8' ? 'Einheiten' : 'x'}
                            </div>
                        {/if}
                    </div>
                    
                    <!-- LIST ITEM ACTIONS -->
                    <div class="absolute top-0 right-0 flex items-center gap-1">
                        <!-- Eye Button for Transparency -->
                        <button onclick={(e) => toggleDetails(pos.id, e)} class="p-1 text-slate-500 hover:text-legal-gold transition-colors" title="Berechnung anzeigen">
                            👁️
                        </button>
                        <!-- Delete Button -->
                        <button onclick={(e) => { e.stopPropagation(); removePosition(pos.id); }} class="p-1 text-slate-600 hover:text-red-500 transition-colors" title="Löschen">
                            ✕
                        </button>
                    </div>

                    <div class="text-right"><div class="font-mono text-sm text-white">{formatCurrency(pos.details.netTotal)}</div></div>
                </div>
                
                {#if pos.details.courtFee > 0}
                    <div class="mt-2 text-[10px] text-blue-300 bg-blue-900/20 px-2 py-1 rounded w-fit flex items-center gap-2">
                        <span>⚖️ Gerichtsgebühren: {formatCurrency(pos.details.courtFee)}</span>
                    </div>
                {/if}

                <!-- TRANSPARENCY DETAILS DROPDOWN -->
                {#if expandedId === pos.id}
                    <div transition:slide class="mt-3 pt-3 border-t border-dashed border-legal-700 text-xs space-y-1.5 bg-black/20 -mx-3 px-3 pb-2">
                        <div class="flex justify-between text-slate-400">
                            <span>Basis ({pos.type} @ {formatCurrency(pos.value)})</span>
                            <span class="font-mono">{formatCurrency(pos.details.baseFee)}</span>
                        </div>
                        {#if pos.details.unitRateAmount > 0}
                        <div class="flex justify-between text-slate-400">
                            <span>Einheitssatz ({pos.details.config.ehsLabel})</span>
                            <span class="font-mono">{formatCurrency(pos.details.unitRateAmount)}</span>
                        </div>
                        {/if}
                        {#if pos.details.surchargeAmount > 0}
                        <div class="flex justify-between text-slate-400">
                            <span>Genossenzuschlag (10%)</span>
                            <span class="font-mono">{formatCurrency(pos.details.surchargeAmount)}</span>
                        </div>
                        {/if}
                        <div class="h-px bg-legal-700/30 my-1"></div>
                        <div class="flex justify-between font-semibold text-legal-gold">
                            <span>Zwischensumme</span>
                            <span>{formatCurrency(pos.details.baseFee + pos.details.unitRateAmount + pos.details.surchargeAmount)}</span>
                        </div>
                    </div>
                {/if}
            </div>
        {/each}
        {#if positions.length === 0}<div class="text-center py-10 text-slate-600 text-sm italic">Keine Positionen.</div>{/if}
      </div>

      <div class="bg-legal-900 p-4 border-t border-legal-700 space-y-1 font-mono text-sm">
        <div class="flex justify-between text-slate-400"><span>Netto Honorar</span><span>{formatCurrency(totalNet)}</span></div>
        <div class="flex justify-between text-slate-400"><span>USt (8.1%)</span><span>{formatCurrency(totalVat)}</span></div>
        {#if totalCourt > 0}<div class="flex justify-between text-blue-400"><span>Gerichtsgebühren</span><span>{formatCurrency(totalCourt)}</span></div>{/if}
        <div class="h-px bg-legal-700 my-2"></div>
        <div class="flex justify-between text-lg font-bold text-legal-gold"><span>TOTAL</span><span>{formatCurrency(totalGross)}</span></div>
        <button onclick={copyToClipboard} disabled={positions.length === 0} class="w-full mt-4 py-2 bg-legal-700 hover:bg-legal-600 text-white rounded text-center text-xs uppercase tracking-wide font-bold disabled:opacity-50">{copied ? 'Kopiert!' : 'Kopieren'}</button>
      </div>
    </div>
  </div>
</div>