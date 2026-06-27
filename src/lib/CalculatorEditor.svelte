<script lang="ts">
  import { calculateFees, formatCurrency, SERVICE_GROUPS, TP_LABELS, type ExtendedTarifPosten, type Position, type ExtendedActionItem, type ServiceGroup } from '../logic';
  import { GGG_LABELS, type GGG_COLUMN } from '../tarife/ggg';
  import { slide, fade } from 'svelte/transition';

  let { positionToEdit, onSave, onCancel } = $props<{
    positionToEdit: Position | null;
    onSave: (pos: Position) => void;
    onCancel: () => void;
  }>();

  const today = new Date().toISOString().split('T')[0];

  let editId = $state<string | null>(null);
  let editDate = $state(today);
  let editValue = $state(50000);
  let editType = $state<ExtendedTarifPosten>('TP3A');
  let editGggColumn = $state<GGG_COLUMN | undefined>('zivil');
  let editIsAppeal = $state(false);
  let editMultiplier = $state(1);
  let editUnitRate = $state(true);
  let editSurchargeEnabled = $state(false);
  let editSurchargeCount = $state(1); 
  let editHasInfoSurcharge = $state(false); 
  let editIsShortMeeting = $state(false);   
  let editVat = $state(true); 
  let editIncludeCourtFee = $state(false);
  let editLabel = $state('');
  let editDesc = $state('');

  let searchQuery = $state('');
  let showDropdown = $state(false);
  let expandedGroups = $state(new Set<string>());
  let searchWrapper = $state<HTMLElement | null>(null);

  $effect(() => {
    if (positionToEdit) {
      if (editId !== positionToEdit.id) {
        editId = positionToEdit.id;
        editDate = positionToEdit.date || today;
        editValue = positionToEdit.value;
        editType = positionToEdit.type;
        editGggColumn = positionToEdit.gggColumn;
        editIsAppeal = !!positionToEdit.isAppeal;
        editMultiplier = positionToEdit.multiplier;
        editUnitRate = positionToEdit.details.config.hasUnitRate;

        const count = positionToEdit.details.config.streitgenossenCount;
        if (count > 0) {
          editSurchargeEnabled = true;
          editSurchargeCount = count;
        } else {
          editSurchargeEnabled = false;
          editSurchargeCount = 1; 
        }

        editHasInfoSurcharge = positionToEdit.details.config.hasInfoSurcharge || false;
        editIsShortMeeting = positionToEdit.details.config.isShortMeeting || false;
        editVat = !positionToEdit.details.config.isForeign;
        editIncludeCourtFee = false;
        editLabel = positionToEdit.label;
        editDesc = positionToEdit.description || '';
        searchQuery = positionToEdit.label;
      }
    } else if (editId !== null) {
      resetEditorLocal();
    }
  });

  function handleClickOutside(event: MouseEvent) {
    if (showDropdown && searchWrapper && !searchWrapper.contains(event.target as Node)) {
      showDropdown = false;
    }
  }

  let filteredGroups = $derived.by(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return SERVICE_GROUPS;

    return SERVICE_GROUPS.map((group: ServiceGroup) => {
      const matchingItems = group.items.filter((item: ExtendedActionItem) => 
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
      const allIds = filteredGroups.map((g: ServiceGroup) => g.id);
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

  let isTimeBased = $derived(['TP7', 'TP8', 'TP9', 'TP3A_Session', 'TP3B_Session', 'TP3C_Session'].includes(editType as string));
  let isQuantityBased = $derived(['TP5', 'TP6'].includes(editType as string));
  let isManualExpense = $derived(editType === 'BARAUSLAGE');
  let isAnyExpense = $derived(editType === 'GGG' || editType === 'BARAUSLAGE');

  let safeValue = $derived(Math.max(0, editValue));
  let safeMultiplier = $derived(Math.max(0, editMultiplier));
  let safeStreitgenossenCount = $derived(editSurchargeEnabled ? Math.max(1, editSurchargeCount) : 0);

  let previewResult = $derived(calculateFees(
    safeValue, editType, editGggColumn, editIsAppeal, safeMultiplier, editUnitRate, safeStreitgenossenCount, !editVat, editIncludeCourtFee, editHasInfoSurcharge, editIsShortMeeting
  ));

  function selectAction(item: ExtendedActionItem) {
    editType = item.id;
    editGggColumn = item.gggColumn; 
    editIsAppeal = item.id === 'TP3B' || item.id === 'TP3C';
    editLabel = item.label;
    editDesc = item.description;
    searchQuery = item.label;
    showDropdown = false;
    editIncludeCourtFee = false;
    
    if (item.id === 'BARAUSLAGE' || item.id === 'GGG') {
       editUnitRate = false;
       editSurchargeEnabled = false;
    } else {
       editUnitRate = true;
    }
    editHasInfoSurcharge = false;
    editIsShortMeeting = false;
  }

  function savePosition() {
    let finalLabel = editLabel.trim() || TP_LABELS[editType as string] || editType;
    const details = calculateFees(
        safeValue, editType, editGggColumn, editIsAppeal, safeMultiplier, editUnitRate, safeStreitgenossenCount, !editVat, false, editHasInfoSurcharge, editIsShortMeeting
    );

    const posData: Position = {
        id: editId || crypto.randomUUID(),
        date: editDate,
        label: finalLabel as string,
        description: editDesc,
        value: safeValue,
        multiplier: safeMultiplier,
        type: editType,
        gggColumn: editGggColumn,
        isAppeal: editIsAppeal,
        details: details
    };

    onSave(posData);
  }

  function resetEditorLocal() {
    editId = null;
    editDate = today;
    editLabel = '';
    editDesc = '';
    searchQuery = '';
    showDropdown = false;
    editIncludeCourtFee = false;
    editVat = true; 
    editUnitRate = true;
    editSurchargeEnabled = false;
    editSurchargeCount = 1;
    editHasInfoSurcharge = false;
    editIsShortMeeting = false;
    if (isTimeBased || isQuantityBased) editMultiplier = 1;
  }

  function blockNegative(e: KeyboardEvent) {
    if (e.key === '-' || e.key === 'e') e.preventDefault();
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="card bg-legal-900 border-t-4 {editId ? 'border-t-orange-500' : 'border-t-legal-gold'} flex flex-col h-full overflow-hidden shadow-2xl">
  
  <div class="p-5 border-b border-legal-700 bg-legal-850 flex justify-between items-center shrink-0">
    <div>
      <h2 class="text-lg font-bold text-white tracking-tight">
        {editId ? 'Position bearbeiten' : 'Neue Leistung'}
      </h2>
      <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-semibold">Eingabe & Konfiguration</p>
    </div>
    {#if editId}
      <button aria-label="Editor zurücksetzen" onclick={onCancel} class="text-xs text-red-400 hover:text-red-300 font-medium transition-colors px-3 py-1.5 rounded hover:bg-white/5 border border-transparent hover:border-red-900/50">
        Abbrechen
      </button>
    {/if}
  </div>

  <div class="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
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
          onclick={() => showDropdown = true}
          oninput={() => showDropdown = true}
          placeholder="Suche (z.B. 'Klage', 'TP3A')..." 
          class="input-field pl-9 pr-8 font-medium text-white shadow-inner bg-legal-950 focus:bg-legal-950 border-legal-700" 
          autocomplete="off" 
        />
        {#if showDropdown}
          <button aria-label="Suche leeren" class="absolute right-2 top-2.5 text-legal-500 hover:text-white p-0.5 rounded-full hover:bg-legal-700 transition-colors" onclick={() => { showDropdown = false; searchQuery = ''; }}>
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
                  <button aria-label="Gruppe {group.label} aufklappen" class="w-full flex items-center justify-between px-4 py-3 hover:bg-legal-700/30 text-left transition-colors group/header" onclick={(e) => toggleGroup(group.id, e)}>
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
                          <button aria-label="Aktion {item.label} auswählen" class="w-full text-left pl-10 pr-4 py-2 hover:bg-legal-700/50 text-slate-400 hover:text-white transition-all flex flex-col group/item relative border-l-2 border-transparent hover:border-legal-accent" onmousedown={() => selectAction(item)}>
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

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="label-text text-slate-300" for="date">Datum</label>
        <input id="date" type="date" bind:value={editDate} class="input-field bg-legal-950 text-slate-300 [color-scheme:dark]" />
      </div>
      <div>
        <label class="label-text text-slate-300" for="label">Bezeichnung</label>
        <input id="label" type="text" bind:value={editLabel} class="input-field bg-legal-950" />
      </div>
    </div>

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
            {#if editType === 'TP3A_Session' || editType === 'TP3B_Session' || editType === 'TP3C_Session'}Std.
            {:else if isManualExpense}Anz.
            {:else if isTimeBased}Einh.
            {:else}Anz.{/if}
          </label>
          <input id="mult" type="number" min="0" step="0.5" onkeydown={blockNegative} bind:value={editMultiplier} class="input-field font-mono text-center tabular-nums bg-legal-950 text-white font-semibold" />
        </div>
      {/if}
    </div>

    {#if !isAnyExpense}
    <div class="bg-legal-950/50 rounded border border-legal-700/50 p-4 space-y-4" transition:slide>
      
      <div class="flex items-center justify-between group">
        <label for="chk-unitrate" class="flex items-center gap-3 cursor-pointer">
          <input id="chk-unitrate" type="checkbox" bind:checked={editUnitRate} class="checkbox-legal">
          <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Einheitssatz</span>
        </label>
        {#if editUnitRate}
          <span transition:fade class="text-xs font-mono text-legal-gold bg-legal-gold/10 px-2 py-0.5 rounded border border-legal-gold/20 tabular-nums">
            {previewResult.config.ehsLabel} <span class="opacity-40 mx-1">|</span> {formatCurrency(previewResult.totalEHS)}
          </span>
        {/if}
      </div>

      {#if editType === 'TP5' || editType === 'TP6'}
        <div class="flex items-center justify-between group" transition:slide>
          <label for="chk-info" class="flex items-center gap-3 cursor-pointer">
            <input id="chk-info" type="checkbox" bind:checked={editHasInfoSurcharge} class="checkbox-legal">
            <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Informationszuschlag (50%)</span>
          </label>
        </div>
      {/if}

      {#if editType === 'TP8'}
        <div class="flex items-center justify-between group" transition:slide>
          <label for="chk-short" class="flex items-center gap-3 cursor-pointer">
            <input id="chk-short" type="checkbox" bind:checked={editIsShortMeeting} class="checkbox-legal">
            <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Kurzbesprechung (&lt; 10 Min)</span>
          </label>
        </div>
      {/if}

      <div class="flex flex-col group">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <label for="chk-surcharge" class="flex items-center gap-3 cursor-pointer py-1">
              <input id="chk-surcharge" type="checkbox" bind:checked={editSurchargeEnabled} class="checkbox-legal">
              <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Streitgenossenzuschlag</span>
            </label>
            <div class="relative group/tooltip">
              <div class="text-legal-500 hover:text-legal-accent cursor-help">ⓘ</div>
              <div class="absolute bottom-full left-0 mb-2 w-72 p-3 bg-black text-slate-300 text-[10px] rounded border border-legal-700 hidden group-hover/tooltip:block z-50 shadow-xl leading-relaxed">
                <strong class="text-legal-gold block mb-1">Art. 15 RATG Erhöhung</strong>
                Erhöhung der Entlohnung bei mehreren Personen:<br>
                a) 2 Personen (1 Streitgenosse): <strong>10 %</strong><br>
                b) jede weitere Person: <strong>+5 %</strong><br>
                Maximal insgesamt <strong>50 %</strong>.
              </div>
            </div>
          </div>
          
          {#if editSurchargeEnabled}
            <span transition:fade={{ duration: 100 }} class="text-xs font-mono text-legal-accent bg-legal-accent/10 px-2 py-0.5 rounded border border-legal-accent/20 tabular-nums whitespace-nowrap ml-2">
              {(previewResult.config.surchargePercent * 100).toFixed(0)}% | {formatCurrency(previewResult.surchargeAmount)}
            </span>
          {/if}
        </div>

        {#if editSurchargeEnabled}
          <div transition:slide={{ duration: 200 }} class="flex justify-end mt-1.5 w-full">
            <div class="flex items-center gap-2 bg-legal-900/30 rounded border border-legal-700/30 px-2 py-1">
              <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Weitere Personen</span>
              <input type="number" aria-label="Anzahl weitere Personen" min="1" max="20" bind:value={editSurchargeCount} class="w-10 bg-transparent text-right font-mono text-xs text-white focus:outline-none border-b border-legal-700 focus:border-legal-accent pb-0.5" />
            </div>
          </div>
        {/if}
      </div>

      <div class="flex items-center justify-between group">
        <label for="chk-vat" class="flex items-center gap-3 cursor-pointer">
          <input id="chk-vat" type="checkbox" bind:checked={editVat} class="checkbox-legal">
          <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Mehrwertsteuer</span>
        </label>
        {#if editVat}
          <span transition:fade class="text-xs font-mono text-slate-400 tabular-nums">8.1% | {formatCurrency(previewResult.vatAmount)}</span>
        {/if}
      </div>
    </div>
    {/if}

    {#if editType === 'GGG' || (editIncludeCourtFee && !isAnyExpense)}
      <div class="bg-gradient-to-br from-legal-900 to-legal-950 rounded border border-legal-700/50 p-4" transition:slide>
        <div class="pl-1 space-y-3">
          <div>
            <label for="ggg-select" class="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block font-semibold">Verfahrensart (GGG)</label>
            <select id="ggg-select" bind:value={editGggColumn} class="input-field text-xs py-1.5 h-auto bg-legal-950">
              {#each Object.entries(GGG_LABELS) as [key, label]}<option value={key}>{label}</option>{/each}
            </select>
          </div>
          
          <label for="chk-appeal" class="flex items-center gap-2 cursor-pointer">
            <input id="chk-appeal" type="checkbox" bind:checked={editIsAppeal} class="w-3 h-3 rounded-sm border-legal-600 bg-legal-900">
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
        <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">Positions-Total</span>
        <span class="text-xl font-mono font-bold text-white tabular-nums tracking-tight">
          {#if editType !== 'BARAUSLAGE' && editType !== 'GGG'}
            {formatCurrency(previewResult.netTotal)}
          {:else}
            {formatCurrency(previewResult.grossTotal)}
          {/if}
        </span>
      </div>
      <button aria-label="Position speichern" onclick={savePosition} class="btn-primary w-full shadow-legal-accent/20">
        {editId ? 'Änderungen speichern' : 'Position hinzufügen'}
      </button>
    </div>
  </div>
</div>