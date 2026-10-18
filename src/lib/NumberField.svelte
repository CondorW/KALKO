<script lang="ts">
  // Leer bleibt null (Aktvorgabe); eine eingegebene Null bleibt ausdrücklich wirksam.
  let { id, label, value, onChange, optional = false, min = 0, max, step = 'any', hint = '', placeholder } = $props<{
    id: string; label: string; value: number | null; onChange: (value: number | null) => void;
    optional?: boolean; min?: number; max?: number; step?: string | number; hint?: string; placeholder?: string;
  }>();
</script>

<!-- Derselbe Feldrahmen wie bei Text-, Datums- und Auswahlfeldern hält
     Beschriftung, Eingabe und Hinweise über alle Spalten auf derselben Höhe. -->
<div class="form-field number-field">
  <label class="label-text" for={id} title={label}>{label}</label>
  <input {id} type="number" {min} {max} {step} value={value ?? ''}
    aria-describedby={hint ? `${id}-hint` : undefined}
    oninput={(event) => onChange(event.currentTarget.value === '' ? (optional ? null : NaN) : event.currentTarget.valueAsNumber)}
    placeholder={placeholder ?? (optional ? 'Aktvorgabe' : '')} class="input-field numeric-input" />
  {#if hint}<p id={`${id}-hint`} class="field-hint">{hint}</p>{/if}
</div>
