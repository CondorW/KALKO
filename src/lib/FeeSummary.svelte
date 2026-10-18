<script lang="ts">
  import { feeNoteTables, type CalculatedPosition } from '../calculator/fee-note';
  import type { CaseSettings } from '../calculator/types';
  let { settings, positions } = $props<{ settings: CaseSettings; positions: CalculatedPosition[] }>();
  let rows = $derived(feeNoteTables(settings, positions)[0].rows);
</script>

<!-- Zahlen kommen unverändert aus demselben Modell wie Kopie und Druck. -->
<div class="summary-totals">
  {#each rows.filter(row => row.kind === 'total') as row}
    <div class="summary-item"><span class="summary-label">{row.cells[1]}</span><strong><span class="summary-currency">{settings.currency}</span> {row.cells[3]}</strong></div>
  {/each}
</div>
<details class="summary-breakdown"><summary>Berechnungsaufteilung anzeigen</summary>
  <dl>{#each rows.filter(row => row.kind === 'adjustment') as row}<div><dt>{row.cells[1]}</dt><dd>{row.cells[3]}</dd></div>{/each}</dl>
</details>
