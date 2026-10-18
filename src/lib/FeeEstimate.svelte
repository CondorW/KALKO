<script lang="ts">
  import { createEstimate, calculateEstimate, type EstimateInput, type EstimateTemplate, type EstimatePhase } from '../calculator/estimate';
  import { formatCurrency } from '../logic';
  import { downloadText } from '../calculator/fee-note';
  import NumberField from './NumberField.svelte';
  import type { Currency, Language } from '../calculator/types';

  let { currency, language, estimate = $bindable(), template = $bindable() } = $props<{
    currency: Currency; language: Language; estimate: EstimateInput; template: EstimateTemplate;
  }>();
  let result = $derived.by(() => {
    try { return { value: calculateEstimate(estimate), error: '' }; }
    catch (error) { return { value: null, error: error instanceof Error ? error.message : 'Schätzung fehlgeschlagen.' }; }
  });
  let en = $derived(language === 'EN');
  const amount = (value: number) => formatCurrency(value, currency);

  function addPhase() {
    estimate.phases.push({ id: crypto.randomUUID(), label: en ? 'Additional phase' : 'Weitere Phase', instance: 1, tasks: [{ id: crypto.randomUUID(), label: en ? 'Work' : 'Leistung', hours: 0 }] });
  }

  function exportEstimate() {
    if (!result.value) return;
    const lines = [en ? 'COST AND FEE ESTIMATE' : 'KOSTEN- UND GEBÜHRENSCHÄTZUNG',
      `${en ? 'Average hourly rate' : 'Durchschnittlicher Stundensatz'}: ${amount(result.value.hourlyRate)}`];
    for (const phase of result.value.phases) {
      lines.push(`\n${phase.instance}. ${en ? 'Instance' : 'Instanz'} | ${phase.label}`);
      for (const task of phase.tasks) lines.push(`${task.label}: ${task.hours} h`);
      lines.push(`${phase.hours} h | ${amount(phase.netTotal)}`);
    }
    for (const instance of result.value.instances) {
      lines.push(`\n${instance.instance}. ${en ? 'Instance' : 'Instanz'}: ${amount(instance.total)}`);
      lines.push(`${en ? 'Fees' : 'Honorar'}: ${amount(instance.fees)} | ${en ? 'Cash expenses' : 'Barauslagen'}: ${amount(instance.cash)} | ${en ? 'Success fee' : 'Erfolgszuschlag'}: ${amount(instance.success)}`);
    }
    lines.push(`\nTOTAL: ${amount(result.value.total)}`, en ? 'All amounts exclude VAT.' : 'Alle Beträge sind Nettobeträge exklusive USt / MwSt.');
    downloadText('KALKO-Kostenschaetzung.txt', lines.join('\n'));
  }
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div class="lg:col-span-5 space-y-6 print:hidden">
    <div class="card border-t-4 border-t-legal-gold">
      <h2 class="text-xl text-white font-semibold mb-4">Stundensätze und Vorlagen</h2>
      <label for="estimate-template" class="label-text">Schätzungsvorlage laden (ersetzt diese Schätzung)</label>
      <select id="estimate-template" class="input-field" bind:value={template} onchange={() => estimate = createEstimate(template)}>
        <option value="activeDE">Aktivprozess – DE</option><option value="activeEN">Aktivprozess – EN</option><option value="passive">Passivprozess</option>
      </select>
      <div class="space-y-5 mt-5">
        {#each estimate.roles as role, index}
          <div class="border-b border-legal-700 pb-4">
            <p class="text-legal-gold font-semibold mb-2">{role.label}</p>
            <div class="grid grid-cols-3 gap-2">
              <NumberField id={`rate-${index}`} label="Satz / h" value={role.rate} onChange={(value) => role.rate = value ?? NaN} />
              <NumberField id={`weight-${index}`} label="Gewicht %" max={100} value={role.weight} onChange={(value) => role.weight = value ?? NaN} />
              <NumberField id={`discount-${index}`} label="Nachlass %" max={100} value={role.discount} onChange={(value) => role.discount = value ?? NaN} />
            </div>
          </div>
        {/each}
        <NumberField id="success-percent" label="Erfolgszuschlag (%) auf Honorar" value={estimate.successPercent} onChange={(value) => estimate.successPercent = value ?? NaN} />
      </div>
      {#if result.value}
        <p class="text-sm text-legal-gold mt-4">Durchschnitt: {amount(result.value.hourlyRate)} / h</p>
        <p class="text-xs text-slate-400 mt-1">Auf 10 Währungseinheiten gerundet.</p>
        {#if Math.abs(result.value.weightTotal - 100) > 0.000001}<p class="text-xs text-orange-300 mt-2">Gewichtung beträgt {result.value.weightTotal}%. Die Gewichtung wird nicht automatisch normalisiert.</p>{/if}
      {/if}
    </div>
    <div class="card space-y-4">
      <h3 class="text-white font-semibold">Barauslagen und Pauschalen je Instanz</h3>
      {#each estimate.instances as instance, index}
        <fieldset class="space-y-3 border-t border-legal-700 pt-3">
          <legend class="text-legal-gold px-1">{index + 1}. Instanz</legend>
          <NumberField id={`expert-${index}`} label="Sachverständigengebühren" value={instance.expert} onChange={(value) => instance.expert = value ?? NaN} />
          <NumberField id={`translation-${index}`} label="Dolmetscher und Übersetzungen" value={instance.translation} onChange={(value) => instance.translation = value ?? NaN} />
          <NumberField id={`estimate-court-${index}`} label="Gerichtsgebühren" value={instance.court} onChange={(value) => instance.court = value ?? NaN} />
          <NumberField id={`success-lump-${index}`} label="Erfolgszuschlag (Pauschale)" value={instance.successLumpSum} onChange={(value) => instance.successLumpSum = value ?? NaN} />
        </fieldset>
      {/each}
    </div>
  </div>
  <div class="lg:col-span-7 space-y-6">
    <div class="card">
      <h2 class="text-xl text-white font-semibold mb-4">{en ? 'Cost and Fee Estimate' : 'Kosten- und Gebührenschätzung'}</h2>
      {#if result.error}<p role="alert" class="text-red-300">{result.error}</p>{/if}
      {#if result.value}
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-slate-400"><tr><th class="pb-3">{en ? 'Instance' : 'Instanz'}</th><th>{en ? 'Hours' : 'Stunden'}</th><th>{en ? 'Fees' : 'Honorar'}</th><th>{en ? 'Expenses' : 'Barauslagen'}</th><th>{en ? 'Success fee' : 'Erfolg'}</th><th>Total</th></tr></thead>
            <tbody>{#each result.value.instances as instance}<tr class="border-t border-legal-700"><td class="py-3">{instance.instance}.</td><td>{instance.hours}</td><td>{amount(instance.fees)}</td><td>{amount(instance.cash)}</td><td>{amount(instance.success)}</td><td class="text-legal-gold">{amount(instance.total)}</td></tr>{/each}</tbody>
          </table>
        </div>
        <p class="text-xl text-legal-gold font-bold mt-5">TOTAL {amount(result.value.total)}</p>
        <p class="text-xs text-slate-400 mt-2">{en ? 'All amounts exclude VAT.' : 'Alle Beträge sind Nettobeträge exklusive USt / MwSt.'}</p>
        <div class="flex gap-3 mt-4 print:hidden"><button onclick={exportEstimate} class="btn-primary text-sm py-2">Textdatei</button><button onclick={() => window.print()} class="bg-legal-700 rounded px-4 text-sm">Drucken / PDF</button></div>
      {/if}
    </div>
    {#each estimate.phases as phase, index (phase.id)}
      <div class="card estimate-phase">
        <div class="flex justify-between items-start gap-3 mb-3">
          <h3 class="font-semibold text-white">{phase.label}</h3>
          <button class="text-xs text-red-400 print:hidden" onclick={() => estimate.phases = estimate.phases.filter((item: EstimatePhase) => item.id !== phase.id)}>Entfernen</button>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3 print:hidden">
          <div><label for={`phase-label-${phase.id}`} class="label-text">Phase</label><input id={`phase-label-${phase.id}`} class="input-field" bind:value={phase.label} /></div>
          <div><label for={`instance-${phase.id}`} class="label-text">Instanz</label><select id={`instance-${phase.id}`} class="input-field" bind:value={phase.instance}><option value={1}>1. Instanz</option><option value={2}>2. Instanz</option><option value={3}>3. Instanz</option></select></div>
        </div>
        <div class="space-y-3">
          {#each phase.tasks as task}
            <div class="grid grid-cols-3 gap-3 items-center">
              <div class="col-span-2"><label class="label-text" for={`task-${phase.id}-${task.id}`}>{task.label}</label><input id={`task-${phase.id}-${task.id}`} class="input-field print:hidden" bind:value={task.label} /></div>
              <NumberField id={`hours-${phase.id}-${task.id}`} label="h" value={task.hours} onChange={(value) => task.hours = value ?? NaN} />
            </div>
          {/each}
          <button class="text-xs text-blue-300 print:hidden" onclick={() => phase.tasks.push({ id: crypto.randomUUID(), label: en ? 'Additional work' : 'Weitere Leistung', hours: 0 })}>Leistung ergänzen</button>
        </div>
        {#if result.value}<p class="mt-4 pt-3 border-t border-legal-700 text-sm text-legal-gold">{result.value.phases[index].hours} h · {amount(result.value.phases[index].netTotal)} · {phase.instance}. {en ? 'Instance' : 'Instanz'}</p>{/if}
      </div>
    {/each}
    <button onclick={addPhase} class="btn-primary text-sm print:hidden">Phase ergänzen</button>
  </div>
</div>
