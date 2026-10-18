<script lang="ts">
  import { ACTION_ITEMS, TP_LABELS, formatCurrency, type ActionItem } from '../logic';
  import { DEFAULT_CASE, createFeeInput, isCriminal, type FeeInput, type FeePosition } from '../calculator/types';
  import { calculatePosition, sumResults, hearingScenarios, additionalHearingHour } from '../calculator/engine';
  import { feeNoteText, feeNoteHtml, feeNoteTsv, downloadText, type CalculatedPosition } from '../calculator/fee-note';
  import { copyTable } from '../calculator/clipboard';
  import { searchActions } from '../calculator/action-search';
  import CaseSettings from './CaseSettings.svelte';
  import PositionOptions from './PositionOptions.svelte';
  import NumberField from './NumberField.svelte';
  import { usesHalfHourUnits } from '../calculator/tariffs';
  import FeeNote from './FeeNote.svelte';
  import FeeEstimate from './FeeEstimate.svelte';
  import { createEstimate, type EstimateInput, type EstimateTemplate } from '../calculator/estimate';
  import FeeSummary from './FeeSummary.svelte';
  import { assessmentValue, isCriminalHearing } from '../calculator/rules';

  const now = new Date();
  // Lokales Datum statt UTC: eine späte Eingabe darf nicht auf den nächsten Tag springen.
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let settings = $state({ ...DEFAULT_CASE });
  let input = $state<FeeInput>(createFeeInput(today));
  let positions = $state<FeePosition[]>([]);
  let editId = $state<string | null>(null);
  let expandedId = $state<string | null>(null);
  let showSidebar = $state(false);
  let editLabel = $state('');
  let editDesc = $state('');
  let searchQuery = $state('');
  let showDropdown = $state(false);
  let editorElement = $state<HTMLElement>();
  let copied = $state(false);
  let message = $state('');
  let tab = $state<'fees' | 'estimate'>('fees');
  // Zustandsbesitzer bleibt der Rechner: Tabwechsel verlieren keine Schätzungsdaten.
  let estimateTemplate = $state<EstimateTemplate>('activeDE');
  let estimate = $state<EstimateInput>(createEstimate('activeDE'));

  // Die Suchliste ist ein Komfortzugang; der vollständige Tarif bleibt über Select erreichbar.
  let availableActions = $derived(ACTION_ITEMS.filter(item => {
    if (isCriminal(settings.procedure) && (['TP2', 'TP3A', 'TP3B', 'TP3C'].includes(item.id) || item.kind === 'OTS')) return false;
    if (!item.id.startsWith('TP4')) return true;
    return isCriminal(settings.procedure) && item.id.startsWith(settings.procedure === 'privateProsecution' ? 'TP4 I ' : 'TP4 II ');
  }));
  let filteredActions = $derived(searchActions(availableActions, searchQuery));
  let tariffOptions = $derived([...new Set(availableActions.map(item => item.id))]);

  // Fehler werden sichtbar und blockieren Export. Ein falscher Tarif darf nicht durch
  // eine gesunde Nullsumme kaschiert werden, auch nach Änderung der Aktvorgaben.
  let preview = $derived.by(() => {
    try { return { result: calculatePosition(input, settings), error: '' }; }
    catch (error) { return { result: null, error: error instanceof Error ? error.message : 'Berechnung fehlgeschlagen.' }; }
  });
  let calculated = $derived.by(() => {
    const rows: CalculatedPosition[] = [];
    const errors: string[] = [];
    for (const position of positions) {
      try { rows.push({ ...position, details: calculatePosition(position.input, settings) }); }
      catch (error) { errors.push(`${position.label}: ${error instanceof Error ? error.message : 'Berechnungsfehler'}`); }
    }
    let totals = sumResults([]);
    try { totals = sumResults(rows.map(position => position.details)); }
    catch (error) { errors.push(error instanceof Error ? error.message : 'Kostensumme ungültig.'); }
    return { rows, errors, totals };
  });
  let totals = $derived(calculated.totals);
  let canExport = $derived(positions.length > 0 && calculated.errors.length === 0);
  let scenarios = $derived.by(() => {
    if (calculated.errors.length) return [];
    return calculated.rows.filter(position => position.input.kind === 'OTS').map(position => ({
      position, rows: hearingScenarios(position.input, settings), additionalHour: additionalHearingHour(position.input, settings),
    }));
  });
  const amount = (value: number) => formatCurrency(value, settings.currency);
  let unitsLabel = $derived(input.type === 'TP8 2' ? 'Dauer (Minuten, <10)' : input.kind !== 'SS' || isCriminalHearing(input.type) || usesHalfHourUnits(input.type) || input.type === 'TP9'
    ? usesHalfHourUnits(input.type) ? 'Dauer (½ Stunden)' : 'Dauer (Stunden)' : 'Anzahl / Einheiten');

  function selectAction(action: ActionItem) {
    input.type = action.id;
    input.manualFee = null;
    input.units = 1;
    input.kind = action.kind ?? (isCriminalHearing(action.id) ? 'TS' : 'SS');
    input.gkgColumn = action.gkgColumn ?? 'zivil';
    input.isAppeal = action.id === 'TP3B' || action.id === 'TP3C';
    input.austrianCourt = action.id === 'TP3B' ? 'TP2' : action.id === 'TP3C' ? 'TP3a' : 'TP1';
    input.includeCourtFee = !!action.gkgColumn;
    searchQuery = action.label;
    editLabel = action.label;
    editDesc = action.description;
    showDropdown = false;
  }

  function resetEditor() {
    // Streitwert und Parteien gehören zum Akt, alle Positionsabweichungen werden gelöscht.
    input = createFeeInput(today);
    editId = null;
    editLabel = '';
    editDesc = '';
    searchQuery = '';
    showDropdown = false;
    message = '';
  }

  function savePosition() {
    if (!preview.result) return;
    const position: FeePosition = {
      id: editId ?? crypto.randomUUID(), label: editLabel.trim() || TP_LABELS[input.type] || input.type,
      description: editDesc, input: { ...input },
    };
    positions = editId ? positions.map(existing => existing.id === editId ? position : existing) : [...positions, position];
    resetEditor();
  }

  function editPosition(position: FeePosition) {
    editId = position.id;
    // Kopie statt Referenz: Abbrechen darf eine gespeicherte Position nicht verändern.
    input = { ...position.input };
    editLabel = position.label;
    editDesc = position.description;
    searchQuery = position.label;
    showDropdown = false;
    message = '';
    // Die horizontale Erfassung steht oberhalb der Liste; Bearbeiten führt dorthin zurück.
    editorElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function removePosition(id: string) {
    positions = positions.filter(position => position.id !== id);
    if (expandedId === id) expandedId = null;
    if (editId === id) resetEditor();
  }

  async function copyToClipboard() {
    if (!canExport) return;
    copied = false;
    try {
      await copyTable(feeNoteHtml(settings, calculated.rows), feeNoteTsv(settings, calculated.rows));
      copied = true;
      message = '';
      setTimeout(() => copied = false, 2000);
    } catch {
      message = 'Die Tabelle konnte nicht kopiert werden. Bitte die Browserberechtigung prüfen oder Drucken / PDF verwenden.';
    }
  }
</script>

<div class="kalko" class:settings-expanded={showSidebar}>
  <aside class:sidebar-open={showSidebar} class="settings-sidebar print:hidden" aria-label="Akt und Berechnungsgrundlagen">
    <button class="sidebar-close" onclick={() => showSidebar = false}>Aktvorgaben schliessen</button>
    <CaseSettings bind:settings />
  </aside>
  <div class="calculator-main">
    <nav class="calculator-tabs print:hidden" aria-label="Berechnungsart">
      <button class="sidebar-toggle" aria-expanded={showSidebar} onclick={() => showSidebar = !showSidebar}>Aktvorgaben</button>
      <button class:active={tab === 'fees'} aria-pressed={tab === 'fees'} onclick={() => tab = 'fees'}>Tarifrechner</button>
      <button class:active={tab === 'estimate'} aria-pressed={tab === 'estimate'} onclick={() => tab = 'estimate'}>Kostenschätzung</button>
    </nav>
    {#if tab === 'fees'}
      <div class="fees-workspace print:hidden">
        <section bind:this={editorElement} class="card service-editor" class:editing={editId !== null} aria-labelledby="editor-title">
          <div class="panel-heading editor-heading"><div><p class="section-eyebrow">TARIFRECHNER</p><h2 id="editor-title">{editId ? 'Position bearbeiten' : 'Leistung erfassen'}</h2></div>
            {#if editId}<button class="text-slate-400" onclick={resetEditor}>Abbrechen</button>{/if}
          </div>
          <!-- Ein Raster, acht Felder: keine unabhängigen Breiten oder versetzten Labels. -->
          <div class="service-fields">
            <div class="form-field service-search">
              <label class="label-text" for="search">Leistung suchen</label>
              <div class="search-control"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>
                <input id="search" class="input-field" bind:value={searchQuery} onfocus={() => showDropdown = true}
                  onkeydown={(event) => { if (event.key === 'Escape') showDropdown = false; if (event.key === 'Enter' && showDropdown && filteredActions[0]) { event.preventDefault(); selectAction(filteredActions[0]); } }}
                  placeholder="Leistung oder Tarif …" autocomplete="off" />
              </div>
              {#if showDropdown}<ul class="action-dropdown">
                {#each filteredActions as action}<li><button type="button" onclick={() => selectAction(action)}><strong>{action.label}</strong><span>{action.description}</span></button></li>{/each}
                {#if !filteredActions.length}<li class="search-empty">Keine passende Leistung.</li>{/if}
                <li><button type="button" class="search-close" onclick={() => showDropdown = false}>Suche schliessen</button></li>
              </ul>{/if}
            </div>
            <div class="form-field"><label for="tariff" class="label-text">Tarifposten</label><select id="tariff" class="input-field" bind:value={input.type} onchange={() => {
              const action = availableActions.find(action => action.id === input.type);
              if (action) selectAction({ ...action, kind: isCriminalHearing(input.type) ? 'TS' : input.kind,
                gkgColumn: input.kind === 'SS' ? action.gkgColumn : undefined });
            }}>
              {#if !tariffOptions.includes(input.type)}<option value={input.type}>{input.type}</option>{/if}
              {#each tariffOptions as type}<option value={type}>{TP_LABELS[type] || type}</option>{/each}
            </select></div>
            <div class="form-field"><label for="kind" class="label-text">Leistungstyp</label><select id="kind" class="input-field" bind:value={input.kind}>
              <option value="SS">Schriftsatz / Leistung</option><option value="TS">Tagsatzung</option><option value="OTS">Offene Tagsatzung</option>
            </select></div>
            <div class="form-field"><label for="date" class="label-text">Leistungsdatum</label><input id="date" type="date" class="input-field" bind:value={input.date} /></div>
            <div class="form-field"><label class="label-text" for="label">Bezeichnung</label><input id="label" class="input-field" bind:value={editLabel} placeholder="Name der Leistung" /></div>
            <div class="form-field"><label class="label-text" for="description">Beschreibung</label><input id="description" class="input-field" bind:value={editDesc} placeholder="Optionaler Zusatz" /></div>
            <NumberField id="units" label={unitsLabel} value={input.units} onChange={(value) => input.units = value ?? NaN} />
            <NumberField id="expenses" label="Barauslagen" hint="Durchlaufende Beträge" value={input.expenses} onChange={(value) => input.expenses = value ?? NaN} />
          </div>
          <PositionOptions bind:input {settings} />
          {#if preview.error}<p role="alert" class="editor-error" id="position-error"><strong>Eingabe prüfen</strong><span>{preview.error}</span></p>{/if}
          <div class="editor-footer">
            {#if preview.result}<div class="preview-total"><span class="preview-label">Leistung netto</span><strong>{amount(preview.result.baseFee)}</strong><span class="preview-inclusive">inkl. Zuschlägen und USt: {amount(preview.result.grossTotal)}</span></div>{/if}
            <button onclick={savePosition} disabled={!preview.result} class="btn-primary" aria-describedby={preview.error ? 'position-error' : undefined}>{editId ? 'Speichern' : 'Hinzufügen'}</button>
          </div>
        </section>

        <section class="card position-panel" aria-labelledby="positions-title">
          <div class="panel-heading"><div><h2 id="positions-title">Leistungsaufstellung <span class="position-count">{positions.length}</span></h2><p class="field-hint">Vorläufig · Netto-Grundhonorare, Zuschläge in der Summe</p></div>
            {#if positions.length}<button class="text-red-400" onclick={() => { positions = []; expandedId = null; resetEditor(); }}>Zurücksetzen</button>{/if}
          </div>
          <div class="positions-scroll">
            {#if positions.length}<table class="positions-table"><thead><tr><th>Datum</th><th>Leistung</th><th>Tarif</th><th>Netto</th><th><span class="sr-only">Aktionen</span></th></tr></thead>
              <tbody>{#each positions as position (position.id)}
                {@const row = calculated.rows.find(row => row.id === position.id)}
                <tr class:editing={editId === position.id}>
                  <td>{position.input.date}</td>
                  <td><button class="position-edit" onclick={() => editPosition(position)} title="Position bearbeiten">{position.label}</button>{#if position.input.kind === 'OTS'}<span class="pending-badge">offen</span>{/if}</td>
                  <td>{position.input.type} · {position.input.kind}</td><td>{row ? amount(row.details.baseFee) : 'Fehler'}</td>
                  <td><div class="row-actions"><button aria-label="Berechnung anzeigen" aria-expanded={expandedId === position.id} onclick={() => expandedId = expandedId === position.id ? null : position.id}>Details</button><button aria-label="Position löschen" onclick={() => removePosition(position.id)}>×</button></div></td>
                </tr>
                {#if row && expandedId === position.id}<tr class="position-detail"><td colspan="5">
                  <span>Streitwert {amount(assessmentValue(position.input, settings))}</span><span>ES {row.details.config.ehsLabel}: {amount(row.details.unitRateAmount)}</span><span>SG {row.details.config.surchargePercent}%: {amount(row.details.surchargeAmount)}</span><span>USt {row.details.config.vatPercent}%: {amount(row.details.vatAmount)}</span><span>Gericht {amount(row.details.courtFee)} · Auslagen {amount(row.details.expenses)}</span>
                </td></tr>{/if}
              {/each}</tbody>
            </table>{/if}
            {#if !positions.length}<div class="empty-positions"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 3h8l4 4v14H5V3h2Z"/><path d="M14 3v5h5M8 12h8M8 16h5"/></svg><div><strong>Noch keine Leistungen erfasst</strong><p>Erste Leistung oben auswählen und hinzufügen.</p></div></div>{/if}
            {#each calculated.errors as error}<p role="alert" class="editor-error">{error}</p>{/each}
          </div>
          <div class="position-footer">
            {#if calculated.errors.length}<p class="editor-error">Kostensumme nicht verfügbar. Bitte Positionen korrigieren.</p>{:else}<FeeSummary {settings} positions={calculated.rows} />{/if}
            <div class="export-actions">
              <button onclick={copyToClipboard} disabled={!canExport}>{copied ? 'Tabelle kopiert!' : 'Tabelle kopieren'}</button>
              <button onclick={() => downloadText('KALKO-Kostenverzeichnis.txt', feeNoteText(settings, calculated.rows))} disabled={!canExport}>Textdatei</button>
              <button onclick={() => window.print()} disabled={!canExport}>Drucken / PDF</button>
            </div>
            {#if message}<p role="status" class="copy-status">{message}</p>{/if}
            {#if scenarios.length}<details class="hearing-scenarios"><summary>Offene Tagsatzungen · Szenarien anzeigen</summary>
              {#each scenarios as scenario}<div class="scenario-block"><strong>{scenario.position.label}</strong><div class="overflow-x-auto"><table><thead><tr><th>Tarif</th><th>Stunden</th><th>Weitere Kosten</th><th>Gesamt</th></tr></thead><tbody>{#each scenario.rows as row}<tr><td>{row.type}</td><td>{row.units}</td><td>{amount(row.result.grossTotal)}</td><td>{amount(totals.grossTotal + row.result.grossTotal)}</td></tr>{/each}</tbody></table></div><p>Weitere Stunde TP3A: {amount(scenario.additionalHour.grossTotal)}</p></div>{/each}
            </details>{/if}
          </div>
        </section>
      </div>
      {#if canExport}<FeeNote {settings} positions={calculated.rows} />{/if}
    {:else}
      <div class="estimate-workspace"><FeeEstimate currency={settings.currency} language={settings.language} bind:estimate bind:template={estimateTemplate} /></div>
    {/if}
  </div>
</div>
