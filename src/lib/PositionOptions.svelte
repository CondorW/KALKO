<script lang="ts">
  import NumberField from './NumberField.svelte';
  import { GKG_LABELS } from '../tarife/gkg';
  import { formatCurrency } from '../logic';
  import { partySurcharge } from '../calculator/court-fees';
  import { vatPercent } from '../calculator/engine';
  import { assessmentValue, allowsUnitRate, allowsDoubleUnitRate, allowsConnection } from '../calculator/rules';
  import type { CaseSettings, FeeInput } from '../calculator/types';
  import { needsManualFee } from '../calculator/tariffs';

  let { input = $bindable(), settings } = $props<{ input: FeeInput; settings: CaseSettings }>();
  let manualRequired = $derived(needsManualFee(input, settings));
  let costValueRequired = $derived(settings.country === 'LIE' && input.type.endsWith('3d'));
  let hasOverrides = $derived(input.value !== null || input.surchargePercent !== null || input.vatPercent !== null
    || !input.hasUnitRate || input.doubleUnitRate || input.connected || (!manualRequired && input.manualFee !== null));
  let inheritedSurcharge = $derived(partySurcharge(settings.representedParties, settings.opposingParties));
  let inheritedVat = $derived(vatPercent(input.date, settings));
  let overridesOpen = $state(false);

  // Nur die Sichtbarkeit folgt gespeicherten Abweichungen; die Fachwerte bleiben
  // unverändert. Nach Speichern/Zurücksetzen kehrt das Formular zum Standard zurück.
  $effect(() => { overridesOpen = hasOverrides || costValueRequired; });

  function useCaseValues() {
    input.value = null;
    input.surchargePercent = null;
    input.vatPercent = null;
    input.hasUnitRate = true;
    input.doubleUnitRate = false;
    input.connected = false;
    input.connectionPercent = 25;
    if (!manualRequired) input.manualFee = null;
    overridesOpen = costValueRequired;
  }
</script>

{#if manualRequired}
  <div class="required-amount"><NumberField id="manual-fee" label="Grundbetrag (erforderlich)" optional placeholder="Betrag eingeben" value={input.manualFee} onChange={(value) => input.manualFee = value} /></div>
{/if}
<div class="position-context">
<div class="inherited-values" aria-label="Wirksame Aktwerte">
  <span class:override-indicator={hasOverrides} class="inheritance-status">{hasOverrides ? 'Abweichungen aktiv' : 'Aktwerte übernommen'}</span>
  <span>Streitwert <strong>{formatCurrency(assessmentValue(input, settings), settings.currency)}</strong></span>
  <span>SG <strong>{input.type === 'TP9' ? 0 : input.surchargePercent ?? inheritedSurcharge}%</strong></span>
  <span>USt <strong>{input.vatPercent ?? inheritedVat}%</strong></span>
</div>
<div class="options-toolbar">
  <button type="button" class="options-toggle" aria-expanded={overridesOpen} aria-controls="position-override-fields" onclick={() => overridesOpen = !overridesOpen}>
    <svg aria-hidden="true" class:rotated={overridesOpen} viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m7 4 6 6-6 6"/></svg>
    Abweichungen und Zuschläge {#if hasOverrides}<span class="option-active">aktiv</span>{/if}
  </button>
  <label class="compact-check"><input type="checkbox" bind:checked={input.includeCourtFee} /> Gerichtsgebühr</label>
</div>
</div>
{#if overridesOpen}
  <section id="position-override-fields" class="override-content" aria-label="Abweichende Positionswerte">
    <div class="option-section-heading"><p>Werte für diese Position</p><button type="button" class="text-action" onclick={useCaseValues}>Aktwerte übernehmen</button></div>
    <div class="position-fields">
      <NumberField id="value-override" label={costValueRequired ? 'Strittiger Kostenbetrag (erforderlich)' : 'Streitwert abweichend'} optional value={input.value} onChange={(value) => input.value = value} />
      <NumberField id="surcharge-override" label="Streitgenossenzuschlag (%)" optional max={settings.country === 'LIE' ? 50 : undefined} value={input.surchargePercent} onChange={(value) => input.surchargePercent = value} />
      <NumberField id="vat-override" label="USt abweichend (%)" optional max={100} value={input.vatPercent} onChange={(value) => input.vatPercent = value} />
      {#if !manualRequired}<NumberField id="manual-fee" label="Grundbetrag abweichend" optional value={input.manualFee} onChange={(value) => input.manualFee = value} />{/if}
    </div>
    <div class="option-checks">
      {#if allowsUnitRate(input.type)}<label class="compact-check"><input type="checkbox" bind:checked={input.hasUnitRate} /> Einheitssatz</label>{/if}
      {#if allowsDoubleUnitRate(input, settings)}<label class="compact-check"><input type="checkbox" bind:checked={input.doubleUnitRate} /> Doppelter ES: auswärtige Verhandlung ohne Reisekostenersatz</label>{/if}
      {#if allowsConnection(input, settings) || input.connected}<label class="compact-check"><input type="checkbox" bind:checked={input.connected} /> Verbindung mit Sicherungsantrag</label>{/if}
      {#if input.connected}<select id="connection-percent" aria-label="Verbindungszuschlag" class="input-field connection-rate" value={input.connectionPercent ?? 25} onchange={(event) => input.connectionPercent = Number(event.currentTarget.value) as 10 | 25}>
        <option value={25}>25% · Regelfall</option><option value={10}>10% · abgesonderter Wohnort</option>
      </select>{/if}
    </div>
    <p class="field-hint">Leere Felder übernehmen den Aktwert. 0 ist eine ausdrückliche Abweichung.</p>
  </section>
{/if}
{#if input.includeCourtFee}
  <section class="court-options" aria-label="Gerichtsgebühr einstellen">
    <div class="court-fields">
      {#if settings.country === 'LIE'}
        <div class="form-field"><label for="gkg" class="label-text">GGG-Verfahren</label><select id="gkg" class="input-field" bind:value={input.gkgColumn}>
          {#each Object.entries(GKG_LABELS) as [key, label]}<option value={key}>{label}</option>{/each}
        </select></div>
      {:else}
        <div class="form-field"><label for="aut-court" class="label-text">GGG-Tarifpost</label><select id="aut-court" class="input-field" bind:value={input.austrianCourt}>
          <option value="TP1">TP1 – Klage</option><option value="TP2">TP2 – Berufung</option><option value="TP3a">TP3a – Revision</option><option value="TP3b">TP3b – §615 ZPO</option><option value="TP4">TP4 – Exekution (manuell)</option>
        </select></div>
      {/if}
      <NumberField id="manual-court" label="Gerichtsgebühr abweichend" optional value={input.manualCourtFee} onChange={(value) => input.manualCourtFee = value} />
    </div>
    {#if settings.country === 'LIE'}<label class="compact-check"><input type="checkbox" bind:checked={input.isAppeal} /> Rechtsmittel</label>{/if}
  </section>
{/if}
