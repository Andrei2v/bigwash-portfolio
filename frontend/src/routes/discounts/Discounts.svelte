<script>
  import { horizontalScroll } from '$lib/actions/horizontal-scroll.js';
  const scrollLabels = $derived({ hint: language.t('review.scrollColumns'), previous: language.t('review.scrollPrevious'), next: language.t('review.scrollNext') });

  import { language } from '$lib/localisation/language.svelte.js';
  import { onMount } from 'svelte';
  import { LOCAL_MODE } from '$lib/api/client.js';
  import { createDevConfig, initialDiscounts, validDiscounts, discountDays } from '$lib/dev-config.js';
  let openSection = $state(null); 

  function toggle(id) {
    openSection = openSection === id ? null : id;
  }

  let config = $state(structuredClone(initialDiscounts));
  let saved = $state(structuredClone(initialDiscounts));
  let ready = $state(false);
  let error = $state('');
  let feedback = $state('');
  let editingCard = $state('');
  let availablePrograms = $state(structuredClone(initialDiscounts.program.programs));
  let selectedProgramId = $state('');
  const store = createDevConfig('bigwash.local.v1.discounts', initialDiscounts, validDiscounts);
  const dirty = $derived(JSON.stringify(config) !== JSON.stringify(saved));
  const programOptions = $derived(availablePrograms.filter(program => !config.program.programs.some(row => row.id === program.id)));

  onMount(() => {
    if (!LOCAL_MODE) return;
    try {
      config = store.load();
      saved = structuredClone($state.snapshot(config));
      ready = true;
    } catch (failure) { error = failure.message; }
    try {
      const existing = localStorage.getItem('bigwash.programs.v1');
      if (existing !== null) {
        const programs = JSON.parse(existing);
        if (!Array.isArray(programs) || !programs.every(program => Number.isSafeInteger(program?.id) && typeof program.name === 'string')) throw new Error('Invalid programs');
        availablePrograms = programs.map(({ id, name }) => ({ id, name }));
      }
    } catch { error = 'discountProgramsUnavailable'; }
  });

  function addRule(key) {
    config[key].push({ id: Math.max(0, ...config[key].map(row => row.id)) + 1, sum: 0, percent: 0, active: false });
    feedback = '';
  }

  function addProgram() {
    const program = programOptions.find(row => String(row.id) === selectedProgramId);
    if (!program) return;
    config.program.programs.push({ id: program.id, name: program.name });
    selectedProgramId = '';
  }

  function save() {
    feedback = '';
    if (!ready) return;
    const next = { ...$state.snapshot(config), combination: 'single' };
    if (!validDiscounts(next)) { error = 'discountInvalid'; return; }
    try {
      store.save(next);
      config = next;
      saved = structuredClone($state.snapshot(config));
      editingCard = '';
      error = '';
      feedback = 'configSaved';
    } catch (failure) { error = failure.message; }
  }

  function cancel() {
    config = structuredClone($state.snapshot(saved));
    error = feedback = editingCard = '';
  }
</script>

<div class="page-content">
  <p class="config-notice">{language.t(LOCAL_MODE ? 'review.discountLocal' : 'review.configUnavailable')}</p>
  <p class="config-notice">{language.t('review.discountSinglePolicy')}</p>
  {#if error}<p role="alert">{language.t(`review.${error}`)}</p>{/if}
  {#if feedback && !dirty}<p role="status">{language.t(`review.${feedback}`)}</p>{/if}
  {#if dirty}<p role="status">{language.t('ui.shared.unsavedChanges.title')}</p>{/if}
  
  <div class="acc-box" class:open={openSection === 1}>
    <button class="acc-header" onclick={() => toggle(1)}>
      <div class="h-left">
        <span class="h-title">{language.t("ui.discounts.turnover.title")}</span>
        <span class="h-sep">|</span>
        <span class="h-desc">{language.t("ui.discounts.turnover.description")}</span>
      </div>
      <span class="h-arrow">{openSection === 1 ? '▲' : '▼'}</span>
    </button>
    {#if openSection === 1}
      <div class="acc-body">
        <div class="discount-table-scroll" use:horizontalScroll={scrollLabels}>
        <table class="ui-table">
          <thead>
            <tr><th>#</th><th>{language.t("ui.discounts.columns.turnoverAmount")}</th><th>{language.t("ui.discounts.columns.discountPercentage")}</th><th>{language.t('review.discountState')}</th><th>{language.t("ui.discounts.columns.action")}</th></tr>
          </thead>
          <tbody>
            {#each config.turnoverRows as row}
              <tr>
                <td>{row.id}</td>
                <td><input type="number" min="0" step="any" bind:value={row.sum} class="ui-input" disabled={!ready} aria-label={language.t('ui.discounts.columns.turnoverAmount')}></td>
                <td><input type="number" min="0" max="100" step="any" bind:value={row.percent} class="ui-input" disabled={!ready} aria-label={language.t('ui.discounts.columns.discountPercentage')}></td>
                <td><span class="discount-state st" class:active={row.active} class:warning={!row.active}>{language.t(row.active ? 'review.discountEnabled' : 'review.discountDisabled')}</span></td>
                <td><button class="i-btn" class:red={row.active} class:green={!row.active} disabled={!ready} aria-label={language.t(row.active ? 'review.discountDisable' : 'review.discountEnable')} title={language.t(row.active ? 'review.discountDisable' : 'review.discountEnable')} onclick={() => row.active = !row.active}>{row.active ? '✖️' : '✔️'}</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
        </div>
        <button class="btn-action-green" disabled={!ready} onclick={() => addRule('turnoverRows')}>{language.t("ui.discounts.actions.addRule")}</button>
      </div>
    {/if}
  </div>

  <div class="acc-box" class:open={openSection === 2}>
    <button class="acc-header" onclick={() => toggle(2)}>
      <div class="h-left">
        <span class="h-title">{language.t("ui.discounts.totalTopup.title")}</span>
        <span class="h-sep">|</span>
        <span class="h-desc">{language.t("ui.discounts.totalTopup.description")}</span>
      </div>
      <span class="h-arrow">▼</span>
    </button>
    {#if openSection === 2}
      <div class="acc-body">
        <div class="discount-table-scroll" use:horizontalScroll={scrollLabels}>
        <table class="ui-table">
          <thead>
            <tr><th>#</th><th>{language.t("ui.discounts.columns.topupAmount")}</th><th>{language.t("ui.discounts.columns.discountPercentage")}</th><th>{language.t('review.discountState')}</th><th>{language.t("ui.discounts.columns.action")}</th></tr>
          </thead>
          <tbody>
            {#each config.totalRefillRows as row}
              <tr>
                <td>{row.id}</td>
                <td><input type="number" min="0" step="any" bind:value={row.sum} class="ui-input" disabled={!ready} aria-label={language.t('ui.discounts.columns.topupAmount')}></td>
                <td><input type="number" min="0" max="100" step="any" bind:value={row.percent} class="ui-input" disabled={!ready} aria-label={language.t('ui.discounts.columns.discountPercentage')}></td>
                <td><span class="discount-state st" class:active={row.active} class:warning={!row.active}>{language.t(row.active ? 'review.discountEnabled' : 'review.discountDisabled')}</span></td>
                <td><button class="i-btn" class:red={row.active} class:green={!row.active} disabled={!ready} aria-label={language.t(row.active ? 'review.discountDisable' : 'review.discountEnable')} title={language.t(row.active ? 'review.discountDisable' : 'review.discountEnable')} onclick={() => row.active = !row.active}>{row.active ? '✖️' : '✔️'}</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
        </div>
        <button class="btn-action-green" disabled={!ready} onclick={() => addRule('totalRefillRows')}>{language.t("ui.discounts.actions.addRule")}</button>
      </div>
    {/if}
  </div>

  <div class="acc-box" class:open={openSection === 3}>
    <button class="acc-header" onclick={() => toggle(3)}>
      <div class="h-left">
        <span class="h-title">{language.t("ui.discounts.programs.title")}</span>
        <span class="h-sep">|</span>
        <span class="h-desc">{language.t("ui.discounts.schedule.percentageHint")}</span>
      </div>
      <span class="h-arrow">▼</span>
    </button>
    {#if openSection === 3}
      <div class="acc-body prog-layout">
        <div class="prog-inputs">
          <div class="input-grid">
            <div class="field"><label for="discount-program-percent">{language.t("ui.discounts.fields.percentage")}</label><input id="discount-program-percent" type="number" min="0" max="100" step="any" bind:value={config.program.percent} disabled={!ready} class="ui-input"></div>
            <div class="field"><label for="discount-program-days">{language.t("ui.discounts.fields.weekday")}</label><input id="discount-program-days" type="text" value={config.program.days.map(day => language.translate(day)).join(', ')} class="ui-input" readonly></div>
            <div class="field"><label for="discount-program-from">{language.t("ui.discounts.fields.timeFrom")}</label><input id="discount-program-from" type="time" bind:value={config.program.from} disabled={!ready} class="ui-input"></div>
            <div class="field"><label for="discount-program-to">{language.t("ui.discounts.fields.timeTo")}</label><input id="discount-program-to" type="time" bind:value={config.program.to} disabled={!ready} class="ui-input"></div>
          </div>
          <div class="mini-list">
            <div class="ml-head"><span>#</span><span>{language.t("ui.discounts.columns.program")}</span><span>{language.t("ui.discounts.columns.action")}</span></div>
            {#each config.program.programs as p}
              <div class="ml-row"><span>{p.id}</span><span>{p.name}</span></div>
            {/each}
          </div>
          <p class="program-discount-state">{language.t('review.discountState')}: <span class="st" class:active={config.program.active} class:warning={!config.program.active}>{language.t(config.program.active ? 'review.discountEnabled' : 'review.discountDisabled')}</span></p>
          <div class="prog-footer">
            <button class="btn-save-sq" disabled={!ready} aria-label={language.t(config.program.active ? 'review.discountDisable' : 'review.discountEnable')} title={language.t(config.program.active ? 'review.discountDisable' : 'review.discountEnable')} onclick={() => config.program.active = !config.program.active}>{config.program.active ? '✖️' : '✔️'}</button>
            <select class="ui-input" bind:value={selectedProgramId} disabled={!ready || !programOptions.length} aria-label={language.t('ui.discounts.columns.program')}>
              <option value="">{language.t('review.discountChooseProgram')}</option>
              {#each programOptions as program}<option value={String(program.id)}>{program.name}</option>{/each}
            </select>
            <button class="btn-add-prog" disabled={!ready || !selectedProgramId} onclick={addProgram}>{language.t('review.discountAddProgram')}</button>
          </div>
        </div>
        <div class="prog-days">
          {#each discountDays as day}
            <label class="day-check"><input type="checkbox" value={day} bind:group={config.program.days} disabled={!ready}> <span></span> {language.translate(day)}</label>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <div class="acc-box" class:open={openSection === 4}>
    <button class="acc-header" onclick={() => toggle(4)}>
      <div class="h-left">
        <span class="h-title">{language.t("ui.discounts.topup.title")}</span>
        <span class="h-sep">|</span>
        <span class="h-desc">{language.t("ui.discounts.topup.cashPaypassPercentageHint")}</span>
      </div>
      <span class="h-arrow">▼</span>
    </button>
    {#if openSection === 4}
      <div class="acc-body cards-row">
        {#each config.refill as rule, index}
          <div class="status-card">
            <div class="c-head"><strong>{language.translate(rule.type)}</strong> <span class="st" class:active={rule.active} class:warning={!rule.active}>{language.t(rule.active ? 'review.discountEnabled' : 'review.discountDisabled')}</span></div>
            <div class="c-mid"><small>{language.t("ui.shared.fields.discount")}</small>
              {#if editingCard === `refill-${index}`}<input type="number" min="0" max="100" step="any" class="ui-input" bind:value={rule.percent} aria-label={language.t('ui.discounts.columns.discountPercentage')}>{:else}<p>{language.number(rule.percent)} %</p>{/if}
            </div>
            <div class="c-foot">
              <button class="btn-sq purp" disabled={!ready} aria-label={language.t('review.discountEdit')} onclick={() => editingCard = `refill-${index}`}>✏️</button><button class="btn-sq gray" disabled title={language.t('review.discountClientsUnavailable')}>👥</button><button class="btn-sq" class:red={rule.active} class:green={!rule.active} disabled={!ready} aria-label={language.t(rule.active ? 'review.discountDisable' : 'review.discountEnable')} title={language.t(rule.active ? 'review.discountDisable' : 'review.discountEnable')} onclick={() => rule.active = !rule.active}>{rule.active ? '✖️' : '✔️'}</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="acc-box" class:open={openSection === 5}>
    <button class="acc-header" onclick={() => toggle(5)}>
      <div class="h-left">
        <span class="h-title">{language.t("ui.discounts.cardTopup.title")}</span>
        <span class="h-sep">|</span>
        <span class="h-desc">{language.t("ui.discounts.cardTopup.percentageHint")}</span>
      </div>
      <span class="h-arrow">▼</span>
    </button>
    {#if openSection === 5}
      <div class="acc-body cards-row">
        {#each config.clientRefill as rule, index}
          <div class="status-card">
            <div class="c-head"><strong>{language.translate(rule.type)}</strong> <span class="st" class:active={rule.active} class:warning={!rule.active}>{language.t(rule.active ? 'review.discountEnabled' : 'review.discountDisabled')}</span></div>
            <div class="c-mid"><small>{language.t("ui.shared.fields.discount")}</small>
              {#if editingCard === `clientRefill-${index}`}<input type="number" min="0" max="100" step="any" class="ui-input" bind:value={rule.percent} aria-label={language.t('ui.discounts.columns.discountPercentage')}>{:else}<p>{language.number(rule.percent)} %</p>{/if}
            </div>
            <div class="c-foot">
              <button class="btn-sq purp" disabled={!ready} aria-label={language.t('review.discountEdit')} onclick={() => editingCard = `clientRefill-${index}`}>✏️</button><button class="btn-sq gray" disabled title={language.t('review.discountClientsUnavailable')}>👥</button><button class="btn-sq" class:red={rule.active} class:green={!rule.active} disabled={!ready} aria-label={language.t(rule.active ? 'review.discountDisable' : 'review.discountEnable')} title={language.t(rule.active ? 'review.discountDisable' : 'review.discountEnable')} onclick={() => rule.active = !rule.active}>{rule.active ? '✖️' : '✔️'}</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="acc-box" class:open={openSection === 6}>
    <button class="acc-header" onclick={() => toggle(6)}>
      <div class="h-left">
        <span class="h-title">{language.t("ui.discounts.newClients.title")}</span>
        <span class="h-sep">|</span>
        <span class="h-desc">{language.t("ui.discounts.registration.title")}</span>
      </div>
      <span class="h-arrow">▼</span>
    </button>
    {#if openSection === 6}
      <div class="acc-body cards-row">
        {#each config.newClients as rule, index}
        <div class="status-card">
          <div class="c-head"><strong>{language.t(index === 0 ? 'ui.discounts.registration.onFirstRegistration' : 'ui.discounts.registration.firstTopup')}</strong> <span class="st" class:active={rule.active} class:warning={!rule.active}>{language.t(rule.active ? 'review.discountEnabled' : 'review.discountDisabled')}</span></div>
          <div class="c-mid"><small>{language.t("ui.shared.fields.discount")}</small>
            {#if editingCard === `newClients-${index}`}<input type="number" min="0" max="100" step="any" class="ui-input" bind:value={rule.percent} aria-label={language.t('ui.discounts.columns.discountPercentage')}>{:else}<p>{language.number(rule.percent)} %</p>{/if}
          </div>
          <div class="c-foot">
            <button class="btn-sq purp" disabled={!ready} aria-label={language.t('review.discountEdit')} onclick={() => editingCard = `newClients-${index}`}>✏️</button><button class="btn-sq gray" disabled title={language.t('review.discountClientsUnavailable')}>👥</button><button class="btn-sq" class:red={rule.active} class:green={!rule.active} disabled={!ready} aria-label={language.t(rule.active ? 'review.discountDisable' : 'review.discountEnable')} title={language.t(rule.active ? 'review.discountDisable' : 'review.discountEnable')} onclick={() => rule.active = !rule.active}>{rule.active ? '✖️' : '✔️'}</button>
          </div>
        </div>
        {/each}
      </div>
    {/if}
  </div>
  <div class="prog-footer config-actions">
    <button class="btn-action-green" disabled={!ready || !dirty} onclick={save}>{language.t('review.configSave')}</button>
    <button class="btn-add-prog" disabled={!dirty} onclick={cancel}>{language.t('ui.shared.actions.cancel')}</button>
  </div>
</div>

<style>
  :global(:root) {
      --bg-page: #f1f5f9;
      --bg-card: #ffffff;
      --bg-element: #f8fafc;
      --border-color: #e2e8f0;
      --border-light: #f1f5f9;
      
      --text-main: #1e293b;
      --text-muted: #64748b;
      --text-light: #94a3b8;
      --text-separator: #cbd5e1;
      
      --input-bg: #f8fafc;
      --input-border: #e2e8f0;
      
      --btn-green: #22c55e;
      --btn-indigo: #6366f1;
      --btn-purple: #8b5cf6;
      --btn-gray: #94a3b8;
      --btn-red: #ef4444;
      
      --status-warning: #f59e0b;
      --status-active: #22c55e;
  }

  :global(html.dark) {
      --bg-page: #0f172a;
      --bg-card: #1e293b;
      --bg-element: #0f172a;
      --border-color: #334155;
      --border-light: rgba(255, 255, 255, 0.05);
      
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-light: #64748b;
      --text-separator: #475569;
      
      --input-bg: #0f172a;
      --input-border: #334155;
      
      --btn-green: #22c55e;
      --btn-indigo: #6366f1;
      --btn-purple: #8b5cf6;
      --btn-gray: #64748b;
      --btn-red: #ef4444;
      
      --status-warning: #fbbf24;
      --status-active: #22c55e;
  }

  :global(body) { margin: 0; background: var(--bg-page); font-family: sans-serif; }
  
  .page-content { padding: 10px 20px; width: 100%; max-width: 1300px; min-width: 0; box-sizing: border-box; }

  .acc-box { background: var(--bg-card); border-radius: 10px; border: 1px solid var(--border-color); margin-bottom: 8px; overflow: hidden; }
  
  .acc-header { 
    width: 100%; display: flex; justify-content: space-between; align-items: center;
    padding: 14px 20px; background: var(--bg-card); border: none; cursor: pointer;
  }
  .acc-header:hover { background: var(--bg-element); }

  .h-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex-wrap: wrap; }
  .h-title { font-weight: 800; font-size: 13px; color: var(--text-main); text-transform: uppercase; }
  .h-sep { color: var(--text-separator); }
  .h-desc { font-size: 11px; color: var(--text-muted); }
  .h-arrow { font-size: 10px; color: var(--text-light); }

  .acc-body { padding: 20px; border-top: 1px solid var(--border-light); }

  .ui-table { width: 100%; border-collapse: collapse; }
  .ui-table th { text-align: left; font-size: 10px; color: var(--text-light); padding: 10px; border-bottom: 2px solid var(--bg-element); }
  .ui-input { padding: 8px; border: 1px solid var(--input-border); border-radius: 6px; background: var(--input-bg); color: var(--text-main); width: 80%; }
  .ui-input:focus { outline: none; border-color: #38bdf8; }
  .i-btn { border: none; background: none; cursor: pointer; font-size: 16px; }

  .btn-action-green { 
    margin-top: 15px; background: var(--btn-green); color: white; border: none; 
    padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer;
  }

  .prog-layout { display: flex; gap: 24px; }
  .prog-inputs { flex: 1; min-width: 0; }
  .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px; }
  .field label { display: block; font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px; }
  
  .mini-list { border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: var(--bg-card); }
  .ml-head { display: grid; grid-template-columns: 30px 1fr 50px; background: var(--bg-element); padding: 8px; font-size: 10px; font-weight: 700; color: var(--text-muted); }
  .ml-row { display: grid; grid-template-columns: 30px 1fr 50px; padding: 8px; border-top: 1px solid var(--border-light); font-size: 12px; align-items: center; color: var(--text-main); }

  .prog-footer { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .prog-footer select { width: auto; flex: 1; min-width: 140px; max-width: 100%; }
  .config-actions { align-items: center; }
  .config-actions button { flex: none; margin-top: 0; }
  .config-notice { color: var(--text-muted); }
  .page-content > [role="alert"] { color: var(--btn-red); }
  .page-content > [role="status"] { color: var(--text-muted); }
  @media (max-width: 900px) {
    .prog-layout { flex-direction: column; }
    .prog-days { width: auto; flex-direction: row; flex-wrap: wrap; }
    .cards-row { flex-wrap: wrap; }
  }
  .btn-save-sq { background: var(--btn-green); border: none; border-radius: 6px; padding: 8px 12px; color: white; cursor: pointer; }
  .btn-add-prog { background: var(--btn-indigo); border: none; border-radius: 6px; padding: 8px 16px; color: white; font-weight: 700; cursor: pointer; flex: 1; }

  .prog-days { width: 120px; display: flex; flex-direction: column; gap: 8px; background: var(--bg-element); padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); }
  .day-check { display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; font-weight: 600; color: var(--text-main); }

  .cards-row { display: flex; gap: 16px; }
  .status-card { background: var(--bg-element); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; width: 240px; }
  .c-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .st { font-size: 9px; font-weight: 800; text-transform: uppercase; }
  .st.warning { color: var(--status-warning); }
  .st.active { color: var(--status-active); }
  .discount-state { white-space: nowrap; }
  .program-discount-state { color: var(--text-muted); font-size: 12px; }
  .val { font-size: 20px; font-weight: 800; color: var(--text-main); }
  
  .c-foot { display: flex; gap: 6px; margin-top: 15px; }
  .btn-sq { flex: 1; border: none; padding: 8px; border-radius: 6px; color: white; cursor: pointer; }
  .btn-sq.purp { background: var(--btn-purple); }
  .btn-sq.gray { background: var(--btn-gray); }
  .btn-sq.green { background: var(--btn-green); }
  .btn-sq.red { background: var(--btn-red); }

  .page-content { min-width: 0; box-sizing: border-box; }
  .acc-body { min-width: 0; }
  @media(max-width:600px) { .page-content { padding: 0; } .acc-header { padding: 14px; gap: 8px; } .h-left { flex-wrap: wrap; gap: 6px; min-width: 0; } .h-desc { white-space: normal; } .h-sep { display: none; } .acc-body { padding: 12px; } .ui-table { min-width: 440px; } .prog-layout { grid-template-columns: minmax(0,1fr); } .input-grid { grid-template-columns: minmax(0,1fr); } .prog-days { min-width: 0; } .cards-row { flex-wrap: wrap; } .status-card { width: 100%; min-width: 0; box-sizing: border-box; } .prog-footer { flex-wrap: wrap; gap: 10px; } }
</style>
