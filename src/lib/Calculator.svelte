<script lang="ts">
  import { calculateFees, formatCurrency, ACTION_ITEMS, SERVICE_GROUPS, TP_LABELS, type TarifPosten, type Position, type ActionItem, type ServiceGroup } from '../logic';
  import { GKG_LABELS, type GKG_COLUMN } from '../tarife/gkg';
  import { slide, fade } from 'svelte/transition';

  // --- STATE ---
  let editId = $state<string | null>(null);
  let expandedId = $state<string | null>(null);
  
  // Default Date: Heute
  const today = new Date().toISOString().split('T')[0];
  let editDate = $state(today);

  // Inputs
  let editValue = $state(50000);
  let editType = $state<TarifPosten>('TP3A');
  let editGkgColumn = $state<GKG_COLUMN | undefined>('zivil');
  let editIsAppeal = $state(false);
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
  let expandedGroups = $state(new Set<string>());
  
  // Ref für Click-Outside Erkennung
  let searchWrapper = $state<HTMLElement | null>(null);

  // Click Outside Handler
  function handleClickOutside(event: MouseEvent) {
    if (showDropdown && searchWrapper && !searchWrapper.contains(event.target as Node)) {
      showDropdown = false;
    }
  }

  let filteredGroups = $derived.by(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return SERVICE_GROUPS;
    return SERVICE_GROUPS.map((group: ServiceGroup) => {
      const matchingItems = group.items.filter((item: ActionItem) => 
        item.label.toLowerCase().includes(q) || 
        item.keywords.some((k: string) => k.includes(q)) ||
        group.label.toLowerCase().includes(q)
      );
      if (matchingItems.length > 0) return { ...group, items: matchingItems };
      return null;
    }).filter((g: ServiceGroup | null) => g !== null) as ServiceGroup[];
  });

  $effect(() => {
    if (searchQuery) {
      const allIds = filteredGroups.map(g => g.id);
      expandedGroups = new Set(allIds);
    }
  });

  function toggleGroup(groupId: string, e: Event) {
    e.stopPropagation();
    const newSet = new Set(expandedGroups);
    if (newSet.has(groupId)) newSet.delete(groupId);
    else newSet.add(groupId);
    expandedGroups = newSet;
  }

  let isTimeBased = $derived(['TP7', 'TP8', 'TP9', 'TP3A_Session'].includes(editType));
  let isQuantityBased = $derived(['TP5', 'TP6'].includes(editType));
  let isManualExpense = $derived(editType === 'BARAUSLAGE');
  let isAnyExpense = $derived(editType === 'GKG' || editType === 'BARAUSLAGE');
  
  let safeValue = $derived(Math.max(0, editValue));
  let safeMultiplier = $derived(Math.max(0, editMultiplier));

  let previewResult = $derived(calculateFees(
    safeValue, editType, editGkgColumn, editIsAppeal, safeMultiplier, editUnitRate, editSurcharge, !editVat, editIncludeCourtFee
  ));

  let positions = $state<Position[]>([]);
  let copied = $state(false);

  // --- ACTIONS ---

  function selectAction(item: ActionItem) {
    editType = item.id;
    editGkgColumn = item.gkgColumn;
    editIsAppeal = item.id === 'TP3B' || item.id === 'TP3C';
    editLabel = item.label;
    editDesc = item.description;
    searchQuery = item.label;
    showDropdown = false;
    editIncludeCourtFee = false;
    
    if (item.id === 'BARAUSLAGE' || item.id === 'GKG') {
        editUnitRate = false;
        editSurcharge = false;
    } else {
        editUnitRate = true;
    }
  }

  function savePosition() {
    let finalLabel = editLabel.trim() || TP_LABELS[editType];
    const details = calculateFees(
        safeValue, editType, editGkgColumn, editIsAppeal, safeMultiplier, editUnitRate, editSurcharge, !editVat, false
    );

    const posData: Position = {
        id: editId || crypto.randomUUID(),
        date: editDate,
        label: finalLabel,
        description: editDesc,
        value: safeValue,
        multiplier: safeMultiplier,
        type: editType,
        gkgColumn: editGkgColumn,
        isAppeal: editIsAppeal,
        details: details
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
    editDate = pos.date || today;
    editValue = pos.value;
    editType = pos.type;
    editGkgColumn = pos.gkgColumn;
    editIsAppeal = !!pos.isAppeal;
    editMultiplier = pos.multiplier;
    editUnitRate = pos.details.config.hasUnitRate;
    editSurcharge = pos.details.config.hasSurcharge;
    editVat = !pos.details.config.isForeign;
    editIncludeCourtFee = false;
    editLabel = pos.label;
    editDesc = pos.description || '';
    searchQuery = pos.label;
  }

  function resetEditor() {
    editId = null;
    editDate = today;
    editLabel = '';
    editDesc = '';
    searchQuery = '';
    editIncludeCourtFee = false;
    editVat = true; 
    editUnitRate = true;
    if (isTimeBased || isQuantityBased) editMultiplier = 1;
  }

  function removePosition(id: string) {
    const idx = positions.findIndex(p => p.id === id);
    if (idx !== -1) positions.splice(idx, 1);
    if (editId === id) resetEditor();
  }

  function toggleDetails(id: string, e: Event) {
    e.stopPropagation();
    expandedId = expandedId === id ? null : id;
  }

  function blockNegative(e: KeyboardEvent) {
    if (e.key === '-' || e.key === 'e') e.preventDefault();
  }

  let totalNet = $derived(positions.reduce((sum, p) => p.details.config.isExpense ? sum : sum + p.details.netTotal, 0));
  let totalVat = $derived(positions.reduce((sum, p) => sum + p.details.vatAmount, 0));
  let totalExpenses = $derived(positions.reduce((sum, p) => {
      if (p.type === 'GKG') return sum + p.details.grossTotal;
      if (p.type === 'BARAUSLAGE') return sum + p.details.grossTotal;
      return sum + p.details.courtFee;
  }, 0));
  let totalGross = $derived(totalNet + totalVat + totalExpenses);

  async function copyToClipboard() {
    const padNum = (val: number) => val.toLocaleString('de-LI', { minimumFractionDigits: 2 }).padStart(12, ' ');
    let text = `KOSTENNOTE\n--------------------------------\n`;
    positions.forEach((p, i) => {
        const d = new Date(p.date);
        const dateStr = d.toLocaleDateString('de-CH');
        text += `${i+1}. [${dateStr}] ${p.label}\n`;
        if (p.type === 'TP3A_Session') {
             text += `   Dauer: ${p.multiplier} Std.\n`;
        } else if ((p.details.config.isTimeBased || p.multiplier > 1) && !p.details.config.isExpense) {
             text += `   Menge/Dauer: ${p.multiplier}\n`;
        }
        if (p.details.config.isExpense) {
             text += `   Barauslage ................. ${padNum(p.details.grossTotal)}\n`;
        } else {
             text += `   Honorar .................... ${padNum(p.details.netTotal)}\n`;
             if(p.details.courtFee > 0) text += `   GKG (${p.details.config.courtFeeLabel}) ....... ${padNum(p.details.courtFee)}\n`;
        }
    });
    text += `--------------------------------\n`;
    text += `Netto Honorar ................ ${padNum(totalNet)}\n`;
    text += `USt (8.1%) ................... ${padNum(totalVat)}\n`;
    text += `Barauslagen (inkl. GGG) ...... ${padNum(totalExpenses)}\n`;
    text += `TOTAL ........................ ${padNum(totalGross)}`;
    await navigator.clipboard.writeText(text);
    copied = true; setTimeout(() => copied = false, 2000);
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[calc(100vh-140px)] h-auto min-h-[600px]">
  
  <!-- LEFT: EDITOR & CONFIG -->
  <div class="lg:col-span-4 flex flex-col gap-6 lg:h-full h-[calc(100vh-120px)] overflow-hidden">
    
    <div class="card bg-legal-900 border-t-4 {editId ? 'border-t-orange-500' : 'border-t-legal-gold'} flex flex-col h-full overflow-hidden shadow-2xl">
      
      <!-- Card Header -->
      <div class="p-5 border-b border-legal-700 bg-legal-850 flex justify-between items-center shrink-0">
        <div>
          <h2 class="text-lg font-bold text-white tracking-tight">
            {editId ? 'Position bearbeiten' : 'Neue Leistung'}
          </h2>
          <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-semibold">Eingabe & Konfiguration</p>
        </div>
        {#if editId}
          <button onclick={resetEditor} class="text-xs text-red-400 hover:text-red-300 font-medium transition-colors px-3 py-1.5 rounded hover:bg-white/5 border border-transparent hover:border-red-900/50">
            Abbrechen
          </button>
        {/if}
      </div>
      
      <!-- Scrollable Form Content -->
      <div class="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
        
        <!-- 1. SEARCH / DROPDOWN -->
        <div class="relative z-30" bind:this={searchWrapper}>
          <label class="label-text text-slate-300" for="search">Leistung / Barauslage</label>
          <div class="relative group">
            <div class="absolute left-3 top-3 text-legal-500 pointer-events-none group-focus-within:text-legal-gold transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" />
              </svg>
            </div>

            <input 
                id="search" 
                type="text" 
                bind:value={searchQuery} 
                onfocus={() => showDropdown = true} 
                placeholder="Suche (z.B. 'Klage', 'TP3A')..." 
                class="input-field pl-9 pr-8 font-medium text-white shadow-inner bg-legal-950 focus:bg-legal-950 border-legal-700" 
                autocomplete="off" 
            />
            
            {#if showDropdown}
                <button 
                  class="absolute right-2 top-2.5 text-legal-500 hover:text-white p-0.5 rounded-full hover:bg-legal-700 transition-colors" 
                  onclick={() => { showDropdown = false; searchQuery = ''; }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                </button>
            {/if}
          </div>

          {#if showDropdown}
            <div transition:slide={{ duration: 150 }} class="bg-legal-850 z-50 overflow-y-auto max-h-[400px] ring-1 ring-black/50 relative -mx-5 w-[calc(100%+2.5rem)] border-y border-legal-700 rounded-none shadow-none my-2 lg:absolute lg:top-full lg:left-0 lg:right-0 lg:mx-0 lg:w-auto lg:border lg:rounded-md lg:shadow-2xl lg:my-0 lg:mt-2">
              {#if filteredGroups.length === 0}
                <div class="p-4 text-center text-legal-500 text-sm italic">Keine Ergebnisse gefunden.</div>
              {:else}
                <ul class="py-1">
                  {#each filteredGroups as group (group.id)}
                    <li class="border-b border-legal-700/30 last:border-0">
                        <button class="w-full flex items-center justify-between px-4 py-3 hover:bg-legal-700/30 text-left transition-colors group/header" onclick={(e) => toggleGroup(group.id, e)}>
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-bold text-legal-gold bg-legal-gold/10 px-1.5 py-0.5 rounded border border-legal-gold/20">{group.id}</span>
                                <span class="text-sm font-semibold text-slate-200">{group.label.replace(group.id + ': ', '')}</span>
                            </div>
                            <span class="text-legal-500 group-hover/header:text-white transform transition-transform {expandedGroups.has(group.id) ? 'rotate-180' : ''}">▼</span>
                        </button>
                        {#if expandedGroups.has(group.id)}
                            <ul transition:slide={{ duration: 150 }} class="bg-legal-900/50 pb-2">
                                {#each group.items as item}
                                    <li class="relative">
                                        <div class="absolute left-6 top-0 bottom-0 w-px bg-legal-700/40"></div>
                                        <button class="w-full text-left pl-10 pr-4 py-2 hover:bg-legal-700/50 text-slate-400 hover:text-white transition-all flex flex-col group/item relative border-l-2 border-transparent hover:border-legal-accent" onmousedown={() => selectAction(item)}>
                                            <span class="text-xs font-medium text-slate-300 group-hover/item:text-white">{item.label}</span>
                                            <span class="text-[10px] text-legal-500 font-mono mt-0.5 truncate">{item.description}</span>
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

        <!-- DATE & LABEL -->
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="label-text text-slate-300" for="date">Datum</label>
                <input id="date" type="date" bind:value={editDate} class="input-field bg-legal-950 text-slate-300" />
            </div>
            <div>
                <label class="label-text text-slate-300" for="label">Bezeichnung</label>
                <input id="label" type="text" bind:value={editLabel} class="input-field bg-legal-950" />
            </div>
        </div>

        <!-- VALUE & MULTIPLIER -->
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="label-text text-slate-300" for="val">{isManualExpense ? 'Betrag (CHF)' : 'Streitwert (CHF)'}</label>
                <div class="relative">
                    <input id="val" type="number" min="0" onkeydown={blockNegative} bind:value={editValue} class="input-field font-mono text-right pr-3 tabular-nums bg-legal-950 text-white font-semibold" />
                    <div class="absolute left-3 top-2.5 text-slate-500 text-xs pointer-events-none font-bold">CHF</div>
                </div>
            </div>
            {#if isTimeBased || isQuantityBased || isManualExpense}
            <div transition:slide={{ axis: 'x' }}>
                <label class="label-text text-slate-300" for="mult">
                    {#if editType === 'TP3A_Session'}Std. {:else if isManualExpense}Anz. {:else if isTimeBased}Einh. {:else}Anz.{/if}
                </label>
                <input id="mult" type="number" min="0" step="0.5" onkeydown={blockNegative} bind:value={editMultiplier} class="input-field font-mono text-center tabular-nums bg-legal-950 text-white font-semibold" />
            </div>
            {/if}
        </div>

        <!-- OPTIONS -->
        {#if !isAnyExpense}
        <div class="bg-legal-950/50 rounded border border-legal-700/50 p-4 space-y-4" transition:slide>
          <div class="flex items-center justify-between group">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" bind:checked={editUnitRate} class="checkbox-legal">
              <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Einheitssatz</span>
            </label>
            {#if editUnitRate}
                <span transition:fade class="text-xs font-mono text-legal-gold bg-legal-gold/10 px-2 py-0.5 rounded border border-legal-gold/20 tabular-nums">
                  {previewResult.config.ehsLabel} <span class="opacity-40 mx-1">|</span> {formatCurrency(previewResult.unitRateAmount)}
                </span>
            {/if}
          </div>
          <div class="flex items-center justify-between group">
            <div class="flex items-center gap-2">
                <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" bind:checked={editSurcharge} class="checkbox-legal">
                <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Streitgenossen</span>
                </label>
                <div class="relative group/tooltip">
                    <div class="text-legal-500 hover:text-legal-accent cursor-help">ⓘ</div>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black text-slate-300 text-[10px] rounded border border-legal-700 hidden group-hover/tooltip:block z-50 shadow-xl pointer-events-none">+10% ab 2. Person</div>
                </div>
            </div>
            {#if editSurcharge}
                <span transition:fade class="text-xs font-mono text-legal-accent bg-legal-accent/10 px-2 py-0.5 rounded border border-legal-accent/20 tabular-nums">10% | {formatCurrency(previewResult.surchargeAmount)}</span>
            {/if}
          </div>
          <div class="flex items-center justify-between group">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" bind:checked={editVat} class="checkbox-legal">
              <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Mehrwertsteuer</span>
            </label>
            {#if editVat}
                <span transition:fade class="text-xs font-mono text-slate-400 tabular-nums">8.1% | {formatCurrency(previewResult.vatAmount)}</span>
            {/if}
          </div>
        </div>
        {/if}

        <!-- GKG OPTIONS -->
        {#if editType === 'GKG' || (editIncludeCourtFee && !isAnyExpense)}
        <div class="bg-gradient-to-br from-legal-900 to-legal-950 rounded border border-legal-700/50 p-4" transition:slide>
          <div class="pl-1 space-y-3">
             <div>
                <label class="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block font-semibold">Verfahrensart (GKG)</label>
                <select bind:value={editGkgColumn} class="input-field text-xs py-1.5 h-auto bg-legal-950">
                    {#each Object.entries(GKG_LABELS) as [key, label]}<option value={key}>{label}</option>{/each}
                </select>
             </div>
             <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" bind:checked={editIsAppeal} class="w-3 h-3 rounded-sm border-legal-600 bg-legal-900">
                <span class="text-xs text-slate-400">Rechtsmittel (2x Gebühr)</span>
             </label>
             <div class="mt-2 text-right">
                <span class="text-xs text-blue-300 font-mono bg-blue-500/10 px-2 py-1 rounded tabular-nums font-bold">
                    {previewResult.config.courtFeeLabel || 'Basis'} | {formatCurrency(previewResult.courtFee || previewResult.grossTotal)}
                </span>
             </div>
          </div>
        </div>
        {/if}

        <div class="p-5 border-t border-legal-700 bg-legal-900 z-10 sticky bottom-0 -mx-5 -mb-5">
            <div class="flex justify-between items-center mb-4">
                <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">Vorschau Total</span>
                <span class="text-xl font-mono font-bold text-white tabular-nums tracking-tight">{formatCurrency(previewResult.grossTotal)}</span>
            </div>
            <button onclick={savePosition} class="btn-primary w-full shadow-legal-accent/20">
                {editId ? 'Änderungen speichern' : 'Position hinzufügen'}
            </button>
        </div>

      </div>
    </div>
  </div>

  <!-- RIGHT: STATEMENT / INVOICE VIEW -->
  <div class="lg:col-span-8 flex flex-col lg:h-full h-[calc(100vh-120px)] overflow-hidden">
    <div class="card h-full flex flex-col bg-legal-850 border border-legal-700 shadow-2xl overflow-hidden relative">
      
      <!-- Invoice Header: Optimiert für Mobile -->
      <div class="bg-legal-900 p-4 sm:p-6 border-b border-legal-700 shrink-0">
         <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
             <div>
                <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">Leistungsaufstellung</h2>
                <p class="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Detaillierte Kostenübersicht</p>
             </div>
             {#if positions.length > 0}
             <div class="flex gap-2 w-full sm:w-auto">
                <button onclick={() => positions = []} class="btn-secondary text-red-400 hover:text-red-300 hover:border-red-900/50 hover:bg-red-900/10 flex-1 sm:flex-none justify-center text-xs sm:text-sm">
                   Reset
                </button>
                <button onclick={copyToClipboard} class="btn-primary bg-legal-800 hover:bg-legal-700 border border-legal-600 text-slate-200 flex-1 sm:flex-none justify-center text-xs sm:text-sm">
                   <span class="sm:hidden">Kopieren</span>
                   <span class="hidden sm:inline">In Zwischenablage kopieren</span>
                </button>
             </div>
             {/if}
         </div>
      </div>

      <!-- Invoice Table Header (Hidden on Mobile) -->
      <div class="hidden sm:grid bg-legal-900/50 px-6 py-3 border-b border-legal-700 grid-cols-12 text-[10px] font-bold text-legal-500 uppercase tracking-widest shrink-0">
         <div class="col-span-8">Beschreibung</div>
         <div class="col-span-4 text-right">Betrag (CHF)</div>
      </div>

      <!-- Scrollable List -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 bg-legal-900/30">
         {#if positions.length === 0}
            <div class="h-full flex flex-col items-center justify-center text-legal-700 opacity-50">
               <span class="text-4xl mb-4 opacity-50">📄</span>
               <span class="text-sm font-medium">Keine Positionen erfasst</span>
            </div>
         {/if}

         <div class="space-y-3 sm:space-y-1">
            {#each positions as pos, i (pos.id)}
               <!-- MOBILE CARD / DESKTOP ROW -->
               <div 
                  class="group relative rounded border transition-all duration-200 
                         {editId === pos.id ? 'bg-legal-850 ring-1 ring-legal-gold border-legal-gold/50' : 'bg-legal-850/40 border-legal-800 hover:border-legal-600 sm:bg-transparent sm:border-transparent'}"
               >
                  <div 
                    class="grid grid-cols-1 sm:grid-cols-12 px-4 py-3 cursor-pointer gap-y-3 sm:gap-y-0"
                    role="button" tabindex="0"
                    onclick={() => editPosition(pos)}
                    onkeydown={(e) => e.key === 'Enter' && editPosition(pos)}
                  >
                     <!-- CONTENT -->
                     <div class="sm:col-span-8 pr-0 sm:pr-4">
                        <div class="flex items-center gap-3">
                           <span class="text-xs text-slate-500 font-mono w-6 shrink-0 pt-0.5 hidden sm:inline-block">{(i+1).toString().padStart(2, '0')}.</span>
                           <div class="flex-1 min-w-0">
                               <div class="flex justify-between sm:justify-start items-center gap-2">
                                   <span class="text-sm font-semibold text-slate-200 truncate">{pos.label}</span>
                                   <!-- Date Badge Mobile -->
                                   <span class="sm:hidden text-[10px] text-slate-500 font-mono bg-black/20 px-1.5 py-0.5 rounded border border-white/5">{new Date(pos.date).toLocaleDateString('de-CH').slice(0,5)}</span>
                               </div>
                               {#if pos.description}
                                   <div class="text-xs text-slate-400 font-normal mt-0.5 truncate">{pos.description}</div>
                               {/if}
                           </div>
                        </div>
                        
                        <!-- TAGS -->
                        <div class="pl-0 sm:pl-9 mt-2 flex flex-wrap gap-2">
                            <!-- Type Badge -->
                            <span class="text-[10px] bg-legal-950 border border-legal-700 text-slate-400 px-1.5 py-0.5 rounded font-medium">{pos.type}</span>
                            <!-- Date Badge Desktop -->
                            <span class="hidden sm:inline-flex text-[10px] text-slate-500 font-mono border border-legal-700/50 px-1.5 py-0.5 rounded">{new Date(pos.date).toLocaleDateString('de-CH')}</span>
                            
                            <!-- Duration / Quantity -->
                            {#if pos.type === 'TP3A_Session'}
                                <span class="text-[10px] text-legal-gold border border-legal-gold/20 bg-legal-gold/5 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                                    <span>⏱</span> {pos.multiplier}h
                                </span>
                            {:else if (pos.details.config.isTimeBased || pos.multiplier > 1) && !pos.details.config.isExpense}
                                <span class="text-[10px] text-legal-gold border border-legal-gold/20 bg-legal-gold/5 px-1.5 py-0.5 rounded font-mono">
                                    {pos.multiplier}x
                                </span>
                            {/if}
                        </div>
                     </div>

                     <!-- AMOUNT (Mobile: Bottom Row with Separator) -->
                     <div class="sm:col-span-4 flex sm:flex-col justify-between sm:justify-start items-end border-t border-white/5 sm:border-0 pt-2 sm:pt-0">
                        {#if pos.details.config.isExpense}
                            <span class="text-xs text-blue-400/70 sm:hidden">Barauslage</span>
                            <div class="text-right">
                                <span class="font-mono text-sm font-semibold text-blue-300 tabular-nums">{formatCurrency(pos.details.grossTotal)}</span>
                            </div>
                        {:else}
                            <div class="text-xs text-slate-500 sm:hidden flex flex-col gap-0.5">
                                <span>Honorar</span>
                                {#if pos.details.courtFee > 0}<span>+ GKG</span>{/if}
                            </div>
                            <div class="text-right">
                                <span class="font-mono text-sm font-semibold text-slate-200 tabular-nums">{formatCurrency(pos.details.netTotal)}</span>
                                {#if pos.details.courtFee > 0}
                                    <span class="font-mono text-[10px] text-blue-400 tabular-nums block mt-0.5 sm:mt-1 text-right">+ {formatCurrency(pos.details.courtFee)}</span>
                                {/if}
                            </div>
                        {/if}
                     </div>
                  </div>

                  <!-- ACTIONS (Desktop Hover / Mobile Click Area) -->
                  <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onclick={(e) => toggleDetails(pos.id, e)} class="p-1.5 bg-legal-900 text-slate-400 hover:text-legal-gold border border-legal-700 rounded shadow-sm" title="Details">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 8.201 2.66 9.336 6.41.147.481.147.99 0 1.472C18.201 14.34 14.257 17 10 17c-4.257 0-8.201-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>
                     </button>
                     <button onclick={(e) => { e.stopPropagation(); removePosition(pos.id); }} class="p-1.5 bg-legal-900 text-slate-400 hover:text-red-400 border border-legal-700 rounded shadow-sm" title="Löschen">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                     </button>
                  </div>

                  <!-- Expanded Details -->
                  {#if expandedId === pos.id}
                     <div transition:slide class="mx-4 mb-3 p-3 bg-black/20 rounded border border-legal-700/30 text-xs">
                        {#if pos.details.config.isExpense}
                            <div class="flex justify-between text-blue-300">
                                <span>Barauslage/Gebühr</span>
                                <span class="font-mono">{formatCurrency(pos.details.grossTotal)}</span>
                            </div>
                        {:else}
                            <div class="grid grid-cols-2 gap-y-1 text-slate-400">
                               <span>Basis ({pos.type})</span>
                               <span class="text-right font-mono">{formatCurrency(pos.details.baseFee)}</span>
                               
                               {#if pos.details.unitRateAmount > 0}
                                  <span>Einheitssatz ({pos.details.config.ehsLabel})</span>
                                  <span class="text-right font-mono">{formatCurrency(pos.details.unitRateAmount)}</span>
                               {/if}
    
                               {#if pos.details.surchargeAmount > 0}
                                  <span>Genossenzuschlag (10%)</span>
                                  <span class="text-right font-mono">{formatCurrency(pos.details.surchargeAmount)}</span>
                               {/if}
                               
                               <div class="col-span-2 border-t border-legal-700/30 my-1"></div>
                               
                               <span class="font-medium text-legal-gold">Netto Honorar</span>
                               <span class="text-right font-mono font-medium text-legal-gold">{formatCurrency(pos.details.netTotal)}</span>
                            </div>
                        {/if}
                     </div>
                  {/if}
               </div>
            {/each}
         </div>
      </div>

      <!-- Footer / Totals -->
      <div class="bg-legal-900 p-4 sm:p-6 border-t border-legal-700 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-20">
         <div class="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-2 max-w-sm ml-auto">
            <div class="text-sm text-slate-400 text-right">Netto Honorar</div>
            <div class="text-sm font-mono text-slate-200 text-right tabular-nums font-medium">{formatCurrency(totalNet)}</div>

            <div class="text-sm text-slate-400 text-right">USt (8.1%)</div>
            <div class="text-sm font-mono text-slate-200 text-right tabular-nums">{formatCurrency(totalVat)}</div>

            <div class="text-sm text-blue-300 text-right">Barauslagen</div>
            <div class="text-sm font-mono text-blue-300 text-right tabular-nums">{formatCurrency(totalExpenses)}</div>

            <div class="col-span-2 my-2 border-t border-legal-700"></div>

            <div class="text-base font-bold text-legal-gold text-right uppercase tracking-wider">Total</div>
            <div class="text-xl font-bold font-mono text-white text-right tabular-nums">{formatCurrency(totalGross)}</div>
         </div>
      </div>

    </div>
  </div>
</div>