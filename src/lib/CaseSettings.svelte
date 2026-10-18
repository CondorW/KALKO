<script lang="ts">
  import NumberField from './NumberField.svelte';
  import { PROCEDURE_LABELS, OFFENCE_LABELS, isCriminal, type CaseSettings } from '../calculator/types';
  import { partySurcharge } from '../calculator/court-fees';
  let { settings = $bindable() } = $props<{ settings: CaseSettings }>();
  let surcharge = $derived(partySurcharge(settings.representedParties, settings.opposingParties));
</script>

<section class="card case-settings" aria-labelledby="case-title">
  <div class="case-heading"><span class="case-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h7l2 2h9v11H3V7Z"/><path d="M3 7V4h7l2 3"/></svg></span><div><p class="section-eyebrow">AKTVORGABEN</p><h2 id="case-title">Berechnungsgrundlagen</h2></div></div>
  <div class="case-fields">
    <div class="case-wide case-country-row">
      <div class="form-field">
        <label class="label-text" for="country">Land / Tarif</label>
        <select id="country" class="input-field" bind:value={settings.country} onchange={() => settings.currency = settings.country === 'LIE' ? 'CHF' : 'EUR'}>
          <option value="LIE">Liechtenstein</option><option value="AUT">Österreich</option>
        </select>
      </div>
      <div class="form-field"><label class="label-text" for="currency">Währung</label><select id="currency" class="input-field" bind:value={settings.currency}><option>CHF</option><option>EUR</option></select></div>
    </div>
    <div class="case-wide"><NumberField id="case-value" label="Bemessungsgrundlage" value={settings.value} onChange={(value) => settings.value = value ?? NaN} /></div>
    <div class="form-field case-wide"><label class="label-text" for="procedure">Verfahren</label><select id="procedure" class="input-field" bind:value={settings.procedure}>
      {#each Object.entries(PROCEDURE_LABELS) as [key, label]}<option value={key}>{label}</option>{/each}
    </select></div>
    {#if isCriminal(settings.procedure)}
      <div class="form-field case-wide"><label class="label-text" for="offence">Delikt</label><select id="offence" class="input-field" bind:value={settings.offence}>
        {#each Object.entries(OFFENCE_LABELS) as [key, label]}<option value={key}>{label}</option>{/each}
      </select><p class="field-hint">Gesetzliche Straf-Bemessungsgrundlage wird automatisch verwendet.</p></div>
    {/if}
    <NumberField id="represented" label="Eigene Parteien" min={1} step={1} value={settings.representedParties} onChange={(value) => settings.representedParties = value ?? NaN} />
    <NumberField id="opposing" label="Gegnerparteien" min={1} step={1} value={settings.opposingParties} onChange={(value) => settings.opposingParties = value ?? NaN} />
    <div class="form-field"><label class="label-text" for="language">Sprache</label><select id="language" class="input-field" bind:value={settings.language}><option value="DE">Deutsch</option><option value="EN">English</option></select></div>
    <NumberField id="case-vat" label="USt (%)" value={settings.vatPercent} optional placeholder="Automatisch" onChange={(value) => settings.vatPercent = value} />
  </div>
  <div class="case-surcharge"><span>Streitgenossenzuschlag</span><strong>{Number.isFinite(surcharge) ? surcharge : '–'}%</strong></div>
  <details class="case-extra"><summary>Weitere Aktvorgaben</summary>
    <label class="compact-check"><input type="checkbox" bind:checked={settings.doubleUnitRate} /> Doppelter ES für berechtigte auswärtige Verhandlungen</label>
    <p class="field-hint">Nur bei erfüllten Voraussetzungen und ohne Reisekosten-/Zeitversäumnisersatz.</p>
  </details>
  <div class="case-guidance"><p>USt automatisch nach Land und Leistungsdatum. 0 bedeutet steuerfrei.</p><p>Währung ohne Umrechnung. Bei Streitwertwechsel frühere Leistungen gesondert bewerten.</p></div>
</section>
