<script>
  import { language } from '$lib/localisation/language.svelte.js';
  import { usbPortFields } from '$lib/dev-config.js';
  let { config, disabled = false, onchange = () => {} } = $props();
</script>

<div class="usb-ports-text-fields-grid">
  {#each usbPortFields as field}
    <div class="usb-input-block">
      <label for={`usb-${field.id}`}>{language.t(`ui.${field.label}`)}</label>
      <input id={`usb-${field.id}`} type="text" value={config[field.key]} {disabled}
        oninput={event => onchange(field.key, event.currentTarget.value)} autocomplete="off" spellcheck="false">
      <div class="presets" role="group" aria-label={language.t('review.usbPresets')}>
        {#each field.presets as value}
          <button id={`usb-${field.id}-${value}`} type="button" class="usb-preset-button"
            class:selected={config[field.key] === value} aria-pressed={config[field.key] === value} {disabled}
            onclick={() => onchange(field.key, value)}>{value}</button>
        {/each}
      </div>
    </div>
  {/each}
</div>
<p class="hint">{language.t('review.usbPresetHint')}</p>

<style>
  .usb-ports-text-fields-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
  .usb-input-block { min-width: 0; display: flex; flex-direction: column; gap: 7px; }
  label { color: var(--text-main); font-size: 13px; line-height: 1.4; }
  input { width: 100%; min-width: 0; box-sizing: border-box; border: 1px solid var(--border-input); border-radius: 8px; padding: 10px; background: var(--bg-input); color: var(--text-title); font: inherit; font-size: 14px; }
  .presets { display: flex; flex-wrap: wrap; gap: 5px; }
  .usb-preset-button { min-height: 32px; padding: 4px 10px; border: 1px solid var(--border-main); border-radius: 18px; font: 12px monospace; color: var(--text-main); background: var(--bg-input); cursor: pointer; }
  .usb-preset-button.selected { color: var(--accent-cyan); border-color: var(--accent-blue); background: var(--brand-bg); }
  input:focus-visible, button:focus-visible { outline: 2px solid var(--accent-blue); outline-offset: 2px; }
  button:hover:not(:disabled) { border-color: var(--accent-blue); }
  button:disabled, input:disabled { opacity: .55; cursor: not-allowed; }
  .hint { color: var(--text-muted); font-size: 12px; margin: 8px 0 0; line-height: 1.5; }
  @media (max-width: 600px) { .usb-ports-text-fields-grid { gap: 14px; } .usb-preset-button { min-height: 36px; } }
  @media (max-width: 359px) { .usb-ports-text-fields-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
