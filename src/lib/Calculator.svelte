<script lang="ts">
  // Importiert jetzt alles korrekt aus logic.ts (weil wir den Export dort hinzugefügt haben)
  import { calculateFees, formatCurrency, TP_LABELS, type TarifPosten } from '../logic';

  // State (Reaktive Variablen)
  let value = $state(50000);
  let type = $state<TarifPosten>('TP3A');
  let useUnitRate = $state(true);
  let useSurcharge = $state(false);
  let copied = $state(false);

  // Derived State (Wird automatisch neu berechnet, wenn sich Abhängigkeiten ändern)
  let result = $derived(calculateFees(value, type, useUnitRate, useSurcharge));

  async function copyToClipboard() {
    const date = new Date().toLocaleDateString('de-LI');
    
    // Helper für Formatierung mit Punkten
    const pad = (lbl: string, val: number) => {
      const valStr = val.toLocaleString('de-LI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const dots = ".".repeat(Math.max(0, 20 - lbl.length));
      return `${lbl} ${dots} ${valStr.padStart(10, ' ')}`;
    };

    // Text für E-Mail generieren
    const text = `
Kostenaufstellung (Basis ${formatCurrency(value)})
Datum: ${date}
Tarif: ${TP_LABELS[type]}
----------------------------------------
${pad(type === 'TP3A' ? 'TP 3A' : 'TP 2', result.baseFee)}
${useUnitRate ? '+' + pad('EHS', result.unitRateAmount) : ''}
${useSurcharge ? '+' + pad('Genossen', result.surchargeAmount) : ''}
----------------------------------------
${pad('Netto', result.netTotal)}
${pad('Brutto (8.1%)', result.grossTotal)}
    `.trim().replace(/^\s*\n/gm, "");

    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch (err) {
      alert('Konnte nicht in Zwischenablage kopieren.');
    }
  }
</script>

<div class="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8">
  
  <!-- LINKS: EINGABEN -->
  <div class="card space-y-6 h-fit">
    <h2 class="text-xl font-semibold text-legal-gold border-b border-legal-700 pb-2">Fallparameter</h2>
    
    <!-- Streitwert -->
    <div>
      <label class="label-text" for="value">Streitwert / Bemessungsgrundlage (CHF)</label>
      <input 
        id="value"
        type="number" 
        bind:value={value} 
        class="input-field font-mono text-lg"
        min="0"
        step="100"
      />
    </div>

    <!-- Tarifpost -->
    <div>
      <label class="label-text" for="type">Leistungstyp</label>
      <select id="type" bind:value={type} class="input-field">
        <option value="TP3A">{TP_LABELS['TP3A']}</option>
        <option value="TP2">{TP_LABELS['TP2']}</option>
      </select>
    </div>

    <!-- Checkboxen -->
    <div class="space-y-3 pt-2">
      <label class="flex items-center space-x-3 cursor-pointer group">
        <input type="checkbox" bind:checked={useUnitRate} class="w-5 h-5 rounded border-legal-700 bg-legal-900 text-legal-accent focus:ring-offset-legal-800">
        <span class="text-slate-300 group-hover:text-white transition-colors">Einheitssatz (Art. 23)</span>
      </label>
      
      <label class="flex items-center space-x-3 cursor-pointer group">
        <input type="checkbox" bind:checked={useSurcharge} class="w-5 h-5 rounded border-legal-700 bg-legal-900 text-legal-accent focus:ring-offset-legal-800">
        <span class="text-slate-300 group-hover:text-white transition-colors">Genossenzuschlag (10%)</span>
      </label>
    </div>
  </div>

  <!-- RECHTS: ERGEBNISSE -->
  <div class="card bg-gradient-to-br from-legal-800 to-legal-900 border-legal-gold/30 relative overflow-hidden">
    <div class="absolute top-0 right-0 p-4 opacity-10 text-9xl pointer-events-none select-none">§</div>
    
    <h2 class="text-xl font-semibold text-white mb-6">Kalkulation</h2>

    <div class="space-y-4 font-mono text-sm md:text-base">
      
      <div class="flex justify-between items-center text-slate-400">
        <span>Basisgebühr ({type})</span>
        <span>{formatCurrency(result.baseFee)}</span>
      </div>

      {#if useUnitRate}
        <div class="flex justify-between items-center text-slate-400">
          <span>+ Einheitssatz ({value <= 15000 ? '50%' : '40%'})</span>
          <span>{formatCurrency(result.unitRateAmount)}</span>
        </div>
      {/if}

      {#if useSurcharge}
        <div class="flex justify-between items-center text-slate-400">
          <span>+ Genossenzuschlag (10%)</span>
          <span>{formatCurrency(result.surchargeAmount)}</span>
        </div>
      {/if}

      <div class="h-px bg-legal-700 my-4"></div>

      <div class="flex justify-between items-center text-lg font-bold text-white">
        <span>Netto</span>
        <span>{formatCurrency(result.netTotal)}</span>
      </div>

      <div class="flex justify-between items-center text-slate-400">
        <span>USt (8.1%)</span>
        <span>{formatCurrency(result.vatAmount)}</span>
      </div>

      <div class="h-px bg-legal-gold my-4"></div>

      <div class="flex justify-between items-center text-2xl font-bold text-legal-gold">
        <span>Total</span>
        <span>{formatCurrency(result.grossTotal)}</span>
      </div>

    </div>

    <!-- Action Button -->
    <div class="mt-8">
      <button 
        onclick={copyToClipboard}
        class="w-full py-3 px-4 rounded font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer
          {copied ? 'bg-green-600 text-white' : 'bg-legal-700 hover:bg-legal-600 text-white'}"
      >
        {#if copied}
          <span>✓ Kopiert!</span>
        {:else}
          <span>📋 Copy for Mail</span>
        {/if}
      </button>
    </div>
  </div>
</div>