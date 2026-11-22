<script>
  import { horizontalScroll } from '$lib/actions/horizontal-scroll.js';
  const scrollLabels = $derived({ hint: language.t('review.scrollColumns'), previous: language.t('review.scrollPrevious'), next: language.t('review.scrollNext') });

  import { language } from '$lib/localisation/language.svelte.js';
  import { goto } from '$app/navigation';
  let actionPanel = $state('');
  let expenseName = $state('');
  let expenseSum = $state('');
  let categoryName = $state('');
  let categories = $state(['Витрати на мийку', 'Обслуговування', 'Інше']);
  let selectedCategory = $state('Витрати на мийку');
  let operations = $state([]);

  function saveExpense() {
    const amount = Number(expenseSum);
    if (!expenseName.trim() || !Number.isFinite(amount) || amount <= 0) return;

    operations = [{
      id: Date.now(),
      type: 'Витрата',
      sum: amount.toFixed(2),
      client: expenseName.trim(),
      pult: selectedCategory,
      date: new Date().toLocaleDateString('uk-UA')
    }, ...operations];
    localStorage.setItem('bigwash.operations.extra', JSON.stringify(operations));
    expenseName = '';
    expenseSum = '';
    actionPanel = '';
  }

  function addCategory() {
    if (categoryName.trim() && !categories.includes(categoryName.trim())) categories = [...categories, categoryName.trim()];
    localStorage.setItem('bigwash.operations.categories', JSON.stringify(categories));
    categoryName = '';
  }
  let selectedOpId = $state(null); 

  const initialOperations = [
    { id: 1, type: 'Картка', sum: '1.32', client: '141 255 215 412', pult: 'Pult_1', date: '12.12.2014' },
    { id: 2, type: 'Готівка', sum: '2.64', client: 'Не встановлено', pult: 'PultProsha', date: '12.12.2014' },
    { id: 3, type: 'Готівка', sum: '2.64', client: 'Не встановлено', pult: 'PultProsha', date: '12.12.2014' },
    { id: 4, type: 'Готівка', sum: '2.64', client: 'Не встановлено', pult: 'PultProsha', date: '12.12.2014' },
  ];

  import { onMount } from 'svelte';
  onMount(() => {
    try {
      operations = JSON.parse(localStorage.getItem('bigwash.operations.extra') || '[]');
      categories = JSON.parse(localStorage.getItem('bigwash.operations.categories') || 'null') || categories;
    } catch {
      operations = [];
    }
  });
  let searchType = $state('');
  let searchSum = $state('');
  let searchClient = $state('');
  let searchPult = $state('');

  let sortColumn = $state(null);
  let sortDirection = $state('asc');

  // The third click restores the original list order rather than sorting again.
  function handleSort(column) {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        sortDirection = 'desc';
      } else {
        sortColumn = null;
      }
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
  }

  function toggleDetails(id) {
    selectedOpId = (selectedOpId === id) ? null : id;
  }

  let filteredAndSortedOperations = $derived.by(() => {
    let result = [...operations,...initialOperations].filter(op => {
      const matchType = language.matchesSystem(op.type, searchType);
      const matchSum = op.sum.toLowerCase().includes(searchSum.toLowerCase());
      const matchClient = op.client.toLowerCase().includes(searchClient.toLowerCase());
      const matchPult = op.pult.toLowerCase().includes(searchPult.toLowerCase());
      return matchType && matchSum && matchClient && matchPult;
    });

    if (sortColumn) {
      result.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];

        if (sortColumn === 'sum') {
          valA = parseFloat(valA);
          valB = parseFloat(valB);
        } else {
          valA = valA.toString().toLowerCase();
          valB = valB.toString().toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  });
</script>

<div class="admin-container">
  <main class="content">
    <div class="table-card">
      <div class="table-header">
        <h2>{language.t("ui.operations.title")}</h2>
      </div>
      
      <div class="scroll-area" use:horizontalScroll={scrollLabels}>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th onclick={() => handleSort('type')} class="sortable-header">
                {language.t("ui.operations.fields.paymentType")} {sortColumn === 'type' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onclick={() => handleSort('sum')} class="sortable-header">
                {language.t("ui.shared.columns.amount")} {sortColumn === 'sum' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onclick={() => handleSort('client')} class="sortable-header">
                {language.t("ui.shared.columns.client")} {sortColumn === 'client' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onclick={() => handleSort('pult')} class="sortable-header">
                {language.t("ui.shared.columns.pult")} {sortColumn === 'pult' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th>{language.t("ui.operations.fields.transactionDate")}</th>
              <th class="text-right">{language.t("ui.shared.columns.action")}</th>
            </tr>
            <tr class="filter-row">
              <td></td>
              <td>
                <input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={searchType} />
              </td>
              <td>
                <input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={searchSum} />
              </td>
              <td>
                <input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={searchClient} />
              </td>
              <td>
                <input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={searchPult} />
              </td>
              <td></td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            {#each filteredAndSortedOperations as op, index (op.id)}
              <tr class:active-row={selectedOpId === op.id}>
                <td>{index + 1}</td>
                <td>{language.translate(op.type)}</td>
                <td class="money-text">₴ {op.sum}</td>
                <td>{op.client}</td>
                <td>{op.pult}</td>
                <td>{op.date}</td>
                <td class="text-right">
                  <button class="view-btn" onclick={() => toggleDetails(op.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>{language.t("ui.operations.actions.view")}</span>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <aside class="right-panel">
    <div class="action-buttons">
      <button class="btn btn-cyan" onclick={() => actionPanel='expense'}>{language.t("ui.operations.actions.addExpenses")} <span>+</span></button>
      <button class="btn btn-orange" onclick={() => actionPanel='categories'}>{language.t("ui.operations.actions.editCategories")} <span>✏️</span></button>
      <button class="btn btn-cyan-soft" onclick={() => actionPanel='payments'}>{language.t("ui.operations.tabs.payments")} <span>💰</span></button>
      <button class="btn btn-cyan-soft" onclick={() => actionPanel='collections'}>{language.t("ui.operations.tabs.collections")} <span>💵</span></button>
      <button class="btn btn-cyan-soft" onclick={() => goto('/admin')}>{language.t("ui.admin.titleShort")} <span>👤</span></button>
    </div>

    <div class="stats-group">
      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-value">15</span>
          <span class="stat-label">{language.t("ui.operations.summary.dailyTransactionCount")}</span>
        </div>
        <div class="stat-icon-circle blue">📊</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-value">₴ 4 201.00</span>
          <span class="stat-label">{language.t("ui.operations.summary.dailyAmount")}</span>
        </div>
        <div class="stat-icon-circle blue">🔗</div>
      </div>
    </div>
  </aside>
</div>

{#if actionPanel}
<div class="modal-overlay" role="presentation" onclick={() => actionPanel=''}>
  <div class="details-card modal-view" role="dialog" aria-modal="true" aria-label={language.t('ui.operations.actions.title')} onclick={e=>e.stopPropagation()}>
    <div class="modal-header">
      <h2>{actionPanel==='expense'?language.t("ui.operations.actions.addExpense"):actionPanel==='categories'?language.t("ui.operations.actions.editCategories"):actionPanel==='payments'?language.t("ui.operations.tabs.payments"):language.t("ui.operations.tabs.collections")}</h2>
      <button class="close-btn" onclick={() => actionPanel=''}>✕</button>
    </div>
    {#if actionPanel==='expense'}
      <div class="action-form"><label>{language.t("ui.operations.fields.expenseDescription")}<input bind:value={expenseName} placeholder={language.t('ui.operations.placeholders.expenseDescription')} /></label>
      <label>{language.t("ui.operations.fields.amountHryvnias")}<input type="number" min="0.01" step="0.01" bind:value={expenseSum} /></label>
      <label>{language.t("ui.operations.fields.category")}<select bind:value={selectedCategory}>{#each categories as category}<option>{category}</option>{/each}</select></label>
      <button class="btn btn-cyan" onclick={saveExpense}>{language.t("ui.operations.actions.saveLocally")}</button></div>
    {:else if actionPanel==='categories'}
      <div class="action-form"><ul>{#each categories as category}<li>{category} <button onclick={() => (categories=categories.filter(c=>c!==category),localStorage.setItem('bigwash.operations.categories',JSON.stringify(categories)))}>✕</button></li>{/each}</ul>
      <input bind:value={categoryName} placeholder={language.t('ui.operations.expense.newCategory')} /><button class="btn btn-cyan" onclick={addCategory}>{language.t("ui.operations.actions.addCategory")}</button></div>
    {:else}
      {#if actionPanel==='payments'}
        <p class="action-note">{language.t("ui.operations.localPaymentsHint")}</p>
        <ul class="action-note">{#each [...operations,...initialOperations].filter(op=>op.type!=='Витрата') as op}<li>#{op.id} · {language.translate(op.type)} · ₴ {op.sum} · {op.date}</li>{/each}</ul>
      {:else}
        <p class="action-note">{language.t("ui.operations.empty.collections")}</p>
      {/if}
    {/if}
  </div>
</div>
{/if}

{#if selectedOpId}
  <div class="modal-overlay" onclick={() => selectedOpId = null}>
    <div class="details-card modal-view" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>{language.t("ui.operations.details.titlePrefix")}{selectedOpId}</h2>
        <button class="close-btn" onclick={() => selectedOpId = null}>✕</button>
      </div>
      
      <div class="details-grid">
        <div class="info-sidebar">
          <div class="info-row"><div class="icon-box">🚗</div> <div><p class="label">{language.t("ui.shared.columns.pult")}</p><b>{language.t("ui.operations.samples.pultName")}</b></div></div>
          <div class="info-row"><div class="icon-box">👤</div> <div><p class="label">{language.t("ui.shared.columns.client")}</p><b>{language.t("ui.operations.states.undefined")}</b></div></div>
          <div class="info-row"><div class="icon-box">💰</div> <div><p class="label">{language.t("ui.shared.columns.amount")}</p><b class="money-text">20.00</b></div></div>
          <div class="info-row"><div class="icon-box">🔢</div> <div><p class="label">{language.t("ui.operations.columns.programCount")}</p><b>4</b></div></div>
          <div class="info-row"><div class="icon-box">💳</div> <div><p class="label">{language.t("ui.operations.fields.paymentType")}</p><b>{language.t("ui.operations.payments.payPass")}</b></div></div>
          <div class="info-row"><div class="icon-box">📅</div> <div><p class="label">{language.t("ui.operations.fields.transactionDate")}</p><b>12.07.2024 09:51</b></div></div>
        </div>

        <div class="details-main">
          <div class="mini-table-card">
            <h3>{language.t("ui.operations.payments.cashAcceptor")}</h3>
            <div class="mini-table-scroll" use:horizontalScroll={scrollLabels}><table class="mini-table">
              <thead>
                <tr><th>№</th><th>{language.t("ui.shared.fields.name")}</th><th>{language.t("ui.operations.columns.price")}</th><th>{language.t("ui.shared.columns.amount")}</th><th>{language.t("ui.shared.fields.discount")}</th></tr>
              </thead>
              <tbody>
                <tr><td>1</td><td>{language.t("ui.operations.programs.pressureWater")}</td><td>{language.t("ui.operations.samples.vacuumRate")}</td><td>5</td><td>0</td></tr>
                <tr><td>2</td><td>{language.t("ui.operations.programs.osmosis")}</td><td>{language.t("ui.operations.samples.osmosisRate")}</td><td>5</td><td>0</td></tr>
                <tr><td>3</td><td>{language.t("ui.operations.programs.pinkFoam")}</td><td>{language.t("ui.operations.samples.foamRate")}</td><td>5</td><td>0</td></tr>
              </tbody>
            </table></div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .action-form {display:grid;gap:12px;padding:16px 0;}
  .action-form label {display:grid;gap:6px;font-size:13px;color:var(--text-main,#334155);}
  .action-form input,.action-form select {padding:10px;border:1px solid #cbd5e1;border-radius:8px;}
  .action-form li {display:flex;justify-content:space-between;margin-bottom:8px;}
  .action-note {padding:10px 0;color:var(--text-main,#334155);}

    :global(:root) {
        --bg-page: #f4f7f6;
        --bg-card: #ffffff;
        --text-main: #1e293b;
        --text-muted: #64748b;
        --border-color: #e2e8f0;
        
        --panel-bg: #111827; 
        --stat-bg: #1f2937;
    }

    :global(html.dark) {
        --bg-page: #0f172a;
        --bg-card: #1e293b;
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        --border-color: #334155;
        --panel-bg: #1e293b;
        --stat-bg: #0f172a; 
    }

    .admin-container { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; width: 100%; }
    .content { display: flex; flex-direction: column; gap: 24px; }
    
    .table-card { background: var(--bg-card); border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); transition: background 0.3s ease; }
    h2 { margin: 0; font-size: 1.1rem; color: var(--text-main); transition: color 0.3s ease; }

    table { width: 100%; border-collapse: collapse; }
    th { 
        text-align: left; font-size: 0.75rem; color: var(--text-muted); 
        padding: 12px 8px; border-bottom: 1px solid var(--border-th); 
        text-transform: uppercase; transition: color 0.3s ease, border-color 0.3s ease;
    }
    td { 
        padding: 16px 8px; border-bottom: 1px solid var(--border-td); 
        font-size: 0.85rem; color: var(--text-main); 
        transition: color 0.3s ease, border-color 0.3s ease;
    }

    .sortable-header { cursor: pointer; user-select: none; }
    .money-text { color: #10b981; font-weight: 700; }

    .table-search-input {
        background-color: var(--search-bg);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 10px center;
        border: 1px solid var(--search-border);
        border-radius: 100px;
        padding: 6px 30px 6px 12px;
        font-size: 0.75rem;
        color: var(--search-text);
        outline: none;
        width: 100%;
        max-width: 120px;
        box-sizing: border-box;
        transition: all 0.2s ease;
    }

    .actions-container { display: flex; justify-content: flex-end; }

    .action-buttons { display: flex; flex-direction: column; gap: 12px; }

    .view-btn { 
        background: #38bdf8; 
        color: white; 
        border: none; 
        padding: 6px 16px; 
        border-radius: 50px; 
        cursor: pointer; 
        font-size: 0.75rem; 
        font-weight: 600;
        display: inline-flex; 
        align-items: center;
        justify-content: center;
        gap: 6px;
    }

    .right-panel { background: var(--panel-bg); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 16px; transition: background 0.3s ease; }
    
    .btn { 
        width: 100%; border: none; border-radius: 12px; padding: 14px 16px; 
        font-weight: 700; font-size: 0.85rem; display: flex; justify-content: space-between; 
        align-items: center; cursor: pointer; color: white;
    }
    .btn-cyan { background: #38bdf8; color: #000; }
    .btn-orange { background: #fb923c; }
    .btn-cyan-soft { background: #0ea5e9; }

    .stats-group { display: flex; flex-direction: column; gap: 8px; }
    .stat-card { 
        background: var(--stat-bg); border-radius: 12px; padding: 16px; 
        display: flex; justify-content: space-between; align-items: center; color: white; 
        transition: background 0.3s ease;
    }
    .stat-value { font-size: 1.4rem; font-weight: 700; display: block; }
    .stat-label { font-size: 0.7rem; color: #94a3b8; }
    .stat-icon-circle { 
        width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; 
        justify-content: center; font-size: 1.2rem;
    }
    .stat-icon-circle.blue { background: rgba(3, 105, 161, 0.4); border: 1px solid #0369a1; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .details-card { background: var(--bg-card); padding: 24px; border-radius: 16px; width: 800px; color: var(--text-main); border: 1px solid var(--border-color); transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .close-btn { background: var(--border-color); border: none; cursor: pointer; width: 32px; height: 32px; border-radius: 50%; color: var(--text-muted); }
    
    .details-grid { display: grid; grid-template-columns: 240px 1fr; gap: 32px; }
    .info-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .icon-box { width: 36px; height: 36px; background: #e0f2fe; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #0ea5e9; }
    .label { font-size: 0.7rem; color: var(--text-muted); margin: 0; }
    
    .mini-table-card { border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; transition: border-color 0.3s ease; }
    .mini-table th { color: var(--text-muted); border-bottom: 1px solid var(--border-color); }
    .mini-table td { border-bottom: 1px solid var(--border-color); color: var(--text-main); }

  .content { min-width: 0; }
  .scroll-area, .mini-table-card { max-width: 100%; overflow-x: auto; }
  .scroll-area table { min-width: 780px; }
  .details-card { max-width: calc(100vw - 24px); box-sizing: border-box; max-height: calc(100dvh - 24px); overflow-y: auto; }
  @media(max-width:1024px) { .admin-container { grid-template-columns: minmax(0,1fr); } }
  @media(max-width:600px) { .details-card { padding: 18px; } .details-grid { grid-template-columns: minmax(0,1fr); } .table-header { flex-wrap: wrap; gap: 10px; } .info-sidebar { min-width: 0; } }

  .mini-table-scroll .mini-table { min-width: 560px; }
</style>
