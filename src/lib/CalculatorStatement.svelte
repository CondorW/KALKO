<script lang="ts">
  import { formatCurrency, type Position } from '../logic';
  import { slide } from 'svelte/transition';

  let { positions, editId, totals, copied, onEdit, onRemove, onReset, onCopy, onDownload, onToggleEHS, onToggleVat } = $props<{
    positions: Position[];
    editId: string | null;
    totals: { netPositions: number; ehs: number; ehsPercent: number; ehsActive: boolean; vat: number; vatActive: boolean; barauslagen: number; ggg: number; gross: number };
    copied: boolean;
    onEdit: (pos: Position) => void;
    onRemove: (id: string) => void;
    onReset: () => void;
    onCopy: () => void;
    onDownload: () => void;
    onToggleEHS: () => void;
    onToggleVat: () => void;
  }>();

  let expandedId = $state<string | null>(null);

  function toggleDetails(id: string, e: Event) {
    e.stopPropagation();
    expandedId = expandedId === id ? null : id;
  }
</script>

<div class="card h-full flex flex-col bg-legal-850 border border-legal-700 shadow-2xl overflow-hidden relative">
      
  <div class="bg-legal-900 p-4 sm:p-6 border-b border-legal-700 shrink-0">
    <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">Leistungsaufstellung</h2>
        <p class="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Detaillierte Kostenübersicht</p>
      </div>
      
      {#if positions.length > 0}
        <div class="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button aria-label="Einheitssatz umschalten" onclick={onToggleEHS} class="btn-secondary border bg-legal-800 text-slate-300 hover:bg-legal-700 hover:text-white flex-1 sm:flex-none justify-center text-xs sm:text-sm px-3 py-1.5 rounded transition-colors shadow-sm {totals.ehsActive ? 'border-legal-gold ring-1 ring-legal-gold/50 text-legal-gold' : 'border-legal-600'}">
            <span class="sm:hidden">EHS</span>
            <span class="hidden sm:inline">Einheitssatz {totals.ehsActive ? 'AN' : 'AUS'}</span>
          </button>

          <button aria-label="MWST umschalten" onclick={onToggleVat} class="btn-secondary border bg-legal-800 text-slate-300 hover:bg-legal-700 hover:text-white flex-1 sm:flex-none justify-center text-xs sm:text-sm px-3 py-1.5 rounded transition-colors shadow-sm {totals.vatActive ? 'border-legal-gold ring-1 ring-legal-gold/50 text-legal-gold' : 'border-legal-600'}">
            <span class="sm:hidden">MWST</span>
            <span class="hidden sm:inline">MWST {totals.vatActive ? 'AN' : 'AUS'}</span>
          </button>

          <button aria-label="Gesamte Liste zurücksetzen" onclick={onReset} class="btn-secondary text-red-400 hover:text-red-300 hover:border-red-900/50 hover:bg-red-900/10 flex-1 sm:flex-none justify-center text-xs sm:text-sm px-3 py-1.5 rounded transition-colors">
            Reset
          </button>
          
          <button aria-label="Kostennote herunterladen" onclick={onDownload} class="btn-secondary border border-legal-600 bg-legal-800 text-slate-300 hover:bg-legal-700 hover:text-white flex-1 sm:flex-none justify-center text-xs sm:text-sm px-3 py-1.5 rounded transition-colors shadow-sm">
            <span class="sm:hidden">TXT</span>
            <span class="hidden sm:inline">Als .txt speichern</span>
          </button>

          <button aria-label="In die Zwischenablage kopieren" onclick={onCopy} class="btn-primary bg-legal-800 hover:bg-legal-700 border border-legal-600 text-slate-200 flex-1 sm:flex-none justify-center text-xs sm:text-sm px-3 py-1.5 rounded transition-colors">
            <span class="sm:hidden">{copied ? 'Kopiert' : 'Kopieren'}</span>
            <span class="hidden sm:inline">{copied ? 'Kopiert!' : 'In Zwischenablage kopieren'}</span>
          </button>
        </div>
      {/if}
    </div>
  </div>

  <div class="hidden sm:grid bg-legal-900/50 pl-10 pr-[5.5rem] py-3 border-b border-legal-700 grid-cols-12 text-[10px] font-bold text-legal-500 uppercase tracking-widest shrink-0">
    <div class="col-span-8">Beschreibung</div>
    <div class="col-span-4 text-right">Betrag</div>
  </div>

  <div class="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 bg-legal-900/30">
    {#if positions.length === 0}
      <div class="h-full flex flex-col items-center justify-center text-legal-700 opacity-50">
        <span class="text-4xl mb-4 opacity-50">📄</span>
        <span class="text-sm font-medium">Keine Positionen erfasst</span>
      </div>
    {/if}

    <div class="space-y-3 sm:space-y-1">
      {#each positions as pos, i (pos.id)}
        <div class="group relative rounded border transition-all duration-200 {editId === pos.id ? 'bg-legal-850 ring-1 ring-legal-gold border-legal-gold/50' : 'bg-legal-850/40 border-legal-800 hover:border-legal-600 sm:bg-transparent sm:border-transparent'}">
          <div class="grid grid-cols-1 sm:grid-cols-12 pl-4 pr-16 py-3 cursor-pointer gap-y-3 sm:gap-y-0" role="button" tabindex="0" onclick={() => onEdit(pos)} onkeydown={(e) => e.key === 'Enter' && onEdit(pos)}>
            <div class="sm:col-span-8 pr-0 sm:pr-4">
              <div class="flex items-center gap-3">
                <span class="text-xs text-slate-500 font-mono w-6 shrink-0 pt-0.5 hidden sm:inline-block">{(i+1).toString().padStart(2, '0')}.</span>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between sm:justify-start items-center gap-2">
                    <span class="text-sm font-semibold text-slate-200 truncate">{pos.label}</span>
                    <span class="sm:hidden text-[10px] text-slate-500 font-mono bg-black/20 px-1.5 py-0.5 rounded border border-white/5">{new Date(pos.date).toLocaleDateString('de-CH').slice(0,5)}</span>
                  </div>
                  {#if pos.description}
                    <div class="text-xs text-slate-400 font-normal mt-0.5 truncate">{pos.description}</div>
                  {/if}
                </div>
              </div>
              
              <div class="pl-0 sm:pl-9 mt-2 flex flex-wrap gap-2">
                <span class="text-[10px] bg-legal-950 border border-legal-700 text-slate-400 px-1.5 py-0.5 rounded font-medium">{pos.type}</span>
                <span class="hidden sm:inline-flex text-[10px] text-slate-500 font-mono border border-legal-700/50 px-1.5 py-0.5 rounded">{new Date(pos.date).toLocaleDateString('de-CH')}</span>
                
                {#if pos.type === 'TP3A_Session'}
                  <span class="text-[10px] text-legal-gold border border-legal-gold/20 bg-legal-gold/5 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                    <span>⏱</span> {pos.multiplier}h
                  </span>
                {:else if (pos.details.config.isTimeBased || pos.multiplier > 1) && !pos.details.config.isExpense}
                  <span class="text-[10px] text-legal-gold border border-legal-gold/20 bg-legal-gold/5 px-1.5 py-0.5 rounded font-mono">
                    {pos.multiplier}x
                  </span>
                {/if}

                {#if pos.details.config.hasInfoSurcharge}
                  <span class="text-[10px] text-legal-gold border border-legal-gold/20 bg-legal-gold/5 px-1.5 py-0.5 rounded font-mono">+ Info (50%)</span>
                {/if}

                {#if pos.details.config.isShortMeeting}
                  <span class="text-[10px] text-blue-400 border border-blue-400/20 bg-blue-400/5 px-1.5 py-0.5 rounded font-mono">&lt; 10 Min</span>
                {/if}

                {#if pos.details.config.streitgenossenCount > 0}
                  <span class="text-[10px] text-legal-accent border border-legal-accent/20 bg-legal-accent/5 px-1.5 py-0.5 rounded font-mono">
                    +{(pos.details.config.surchargePercent * 100).toFixed(0)}% ({pos.details.config.streitgenossenCount} Streitgenossen)
                  </span>
                {/if}
              </div>
            </div>

            <div class="sm:col-span-4 flex sm:flex-col justify-between sm:justify-start items-end border-t border-white/5 sm:border-0 pt-2 sm:pt-0">
              <div class="text-right">
                {#if pos.details.config.isExpense}
                  <span class="font-mono text-sm font-semibold text-blue-300 tabular-nums">{formatCurrency(pos.details.grossTotal)}</span>
                {:else}
                  <span class="font-mono text-sm font-semibold text-slate-200 tabular-nums">{formatCurrency(pos.details.positionNet)}</span>
                {/if}
              </div>
            </div>
          </div>

          <div class="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button aria-label="Details einblenden" onclick={(e) => toggleDetails(pos.id, e)} class="p-1.5 bg-legal-900 text-slate-400 hover:text-legal-gold border border-legal-700 rounded shadow-sm" title="Details">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 8.201 2.66 9.336 6.41.147.481.147.99 0 1.472C18.201 14.34 14.257 17 10 17c-4.257 0-8.201-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>
            </button>
            <button aria-label="Position löschen" onclick={(e) => { e.stopPropagation(); onRemove(pos.id); }} class="p-1.5 bg-legal-900 text-slate-400 hover:text-red-400 border border-legal-700 rounded shadow-sm" title="Löschen">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
            </button>
          </div>

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
                  
                  {#if pos.details.surchargeOnBase > 0}
                    <span>Genossenzuschlag ({(pos.details.config.surchargePercent * 100).toFixed(0)}% für {pos.details.config.streitgenossenCount} Streitgenossen)</span>
                    <span class="text-right font-mono">{formatCurrency(pos.details.surchargeOnBase)}</span>
                  {/if}

                  {#if pos.details.courtFee > 0}
                    <span class="font-medium text-legal-gold">GGG ({pos.details.config.courtFeeLabel})</span>
                    <span class="text-right font-mono font-medium text-legal-gold">{formatCurrency(pos.details.courtFee)}</span>
                  {/if}
                  
                  <div class="col-span-2 border-t border-legal-700/30 my-1"></div>
                  <span class="font-medium text-legal-gold">Netto</span>
                  <span class="text-right font-mono font-medium text-legal-gold">{formatCurrency(pos.details.positionNet)}</span>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div class="bg-legal-900 p-4 sm:p-6 border-t border-legal-700 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-20">
    <div class="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-2 max-w-sm ml-auto sm:pr-16">
      <div class="text-sm text-slate-400 text-right">Netto</div>
      <div class="text-sm font-mono text-slate-200 text-right tabular-nums font-medium">{formatCurrency(totals.netPositions)}</div>
      
      {#if totals.ehsActive && totals.ehs > 0}
        <div class="text-sm text-legal-gold text-right">Einheitssatz ({totals.ehsPercent}%)</div>
        <div class="text-sm font-mono text-legal-gold text-right tabular-nums">{formatCurrency(totals.ehs)}</div>
      {/if}

      {#if totals.vatActive}
        <div class="text-sm text-slate-400 text-right">MWST (8.1%)</div>
        <div class="text-sm font-mono text-slate-200 text-right tabular-nums">{formatCurrency(totals.vat)}</div>
      {/if}
      
      {#if totals.barauslagen > 0}
        <div class="text-sm text-blue-300 text-right">Barauslagen</div>
        <div class="text-sm font-mono text-blue-300 text-right tabular-nums">{formatCurrency(totals.barauslagen)}</div>
      {/if}

      {#if totals.ggg > 0}
        <div class="text-sm text-blue-300 text-right">Gerichtsgebühren (GGG)</div>
        <div class="text-sm font-mono text-blue-300 text-right tabular-nums">{formatCurrency(totals.ggg)}</div>
      {/if}
      
      <div class="col-span-2 my-2 border-t border-legal-700"></div>
      
      <div class="text-base font-bold text-legal-gold text-right uppercase tracking-wider">GESAMT</div>
      <div class="text-xl font-bold font-mono text-white text-right tabular-nums">{formatCurrency(totals.gross)}</div>
    </div>
  </div>
</div>