<script>
  import { language } from '$lib/localisation/language.svelte.js';
  import Calendar from './Calendar.svelte';
  import { dateKey, presetRange, formatDate } from '$lib/dashboard-data.js';

  let { range, onchange, label = 'Період' } = $props();
  let popup;
  let trigger;
  let opened = $state(false);
  let left = $state(0);
  let top = $state(0);
  let height = $state(480);

  function position() {
    if (!opened || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 16);
    left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    height = Math.min(480, Math.max(below, above, 160), window.innerHeight - 16);
    top = below >= Math.min(480, above) ? Math.max(8, rect.bottom + 6) : Math.max(8, rect.top - height - 6);
    top = Math.min(top, Math.max(8, window.innerHeight - height - 8));
  }

  function toggle() {
    if (opened) popup.hidePopover();
    else {
      opened = true;
      position();
      popup.showPopover();
    }
  }

  function apply(next) {
    onchange(next);
    popup.hidePopover();
    opened = false;
    trigger.focus();
  }
</script>

<svelte:window onresize={position} onscrollcapture={position} />
<button bind:this={trigger} type="button" class="period-button" aria-label={language.translate(label)}
  aria-expanded={opened} aria-haspopup="dialog" onclick={toggle}>
  {language.t("ui.calendar.period.buttonPrefix")} {formatDate(range.from)} — {formatDate(range.to)}
</button>
<div bind:this={popup} popover="auto" role="dialog" aria-label={language.translate(label)}
  class="period-popup" style:left={`${left}px`} style:top={`${top}px`} style:max-height={`${height}px`}
  ontoggle={(event) => { opened = event.newState === 'open'; }}>
  {#if opened}
    <div class="quick-ranges">
      {#each [['day', 'Сьогодні'], ['week', '7 днів'], ['30days', '30 днів'], ['month', 'Цей місяць'], ['year', 'Цей рік']] as [value, text]}
        <button type="button" onclick={() => apply(presetRange(value, dateKey(new Date())))}>{language.translate(text)}</button>
      {/each}
    </div>
    <Calendar rangeMode from={range.from} to={range.to} onselect={apply} />
  {/if}
</div>

<style>
  .period-button { border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; background: white; color: #334155; font-size: 11px; cursor: pointer; }
  .period-popup { position: fixed; inset: auto; margin: 0; width: min(320px, calc(100vw - 16px)); box-sizing: border-box; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; background: white; color: #334155; overflow-y: auto; box-shadow: 0 12px 36px #0003; }
  .quick-ranges { display: flex; flex-wrap: wrap; gap: 5px; }
  .quick-ranges button { border: 0; border-radius: 5px; padding: 6px 8px; background: #f1f5f9; color: inherit; cursor: pointer; }
  button:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
  :global(html.dark) .period-button, :global(html.dark) .period-popup { background: #1e293b; border-color: #475569; color: #e2e8f0; }
  :global(html.dark) .quick-ranges button { background: #334155; }
</style>
