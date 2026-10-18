<script lang="ts">
  import { feeNoteHtml, type CalculatedPosition } from '../calculator/fee-note';
  import type { CaseSettings } from '../calculator/types';
  let { settings, positions } = $props<{ settings: CaseSettings; positions: CalculatedPosition[] }>();
</script>

<!-- Ausschliesslich vom Exportmodul erzeugtes HTML; dort sind alle Textwerte escaped. -->
<section class="hidden print:block fee-note">
  {@html feeNoteHtml(settings, positions)}
</section>
