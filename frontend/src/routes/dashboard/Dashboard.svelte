<script>
  import { language } from '$lib/localisation/language.svelte.js';
  import { onMount, onDestroy } from "svelte";
  import { statsAPI } from "../../lib/api/client";
  import { DEMO_MODE } from "$lib/demo.js";
  import { LOCAL_MODE } from "$lib/api/client.js";
  import Chart from "chart.js/auto";

  import PeriodFilter from '$lib/components/PeriodFilter.svelte';
  import {
    dateKey, presetRange, overviewRange, loadDashboard, normalizeEvents,
    selectEvents, totals, breakdown, chartSeries, previousRange, changeLabel, money
  } from '$lib/dashboard-data.js';
  const today = dateKey(new Date());
  const colors = ['#f45c5c', '#00a082', '#5cc4ff', '#3b82f6', '#f59e0b', '#a855f7'];
  const defaultRange = () => presetRange('month', today);
  let ranges = $state({ main: overviewRange(today), pults: defaultRange(), programs: defaultRange(), payments: defaultRange(), clients: defaultRange(), transactions: defaultRange(), activity: defaultRange() });
  let model = $state({ events: [], sample: false, localCatalogs: false });
  let localModel = $state(null);
  let sampleModel = $state(null);
  let ready = $state(false);
  let loadError = $state('');
  let transactionPage = $state(1);
  const pageSize = 12;
  let stats = $derived(totals(selectEvents(model.events, ranges.main)));
  let prior = $derived(totals(selectEvents(model.events, previousRange(ranges.main))));
  let programRows = $derived(breakdown(selectEvents(model.events, ranges.programs), 'program'));
  let paymentRows = $derived(breakdown(selectEvents(model.events, ranges.payments), 'method'));
  let clientRows = $derived(breakdown(selectEvents(model.events, ranges.clients), 'client'));
  let activityRows = $derived(breakdown(selectEvents(model.events, ranges.activity), 'pult'));
  let pultRows = $derived(breakdown(selectEvents(model.events, ranges.pults), 'pult').filter(row => row.name !== 'Не вказано'));
  let knownPults = $derived([...new Set(model.events.filter(row => row.kind === 'income' && row.pult).map(row => row.pult))]);
  let activePults = $derived(pultRows.length);
  let inactivePults = $derived(Math.max(0, knownPults.length - activePults));
  let pultPercent = $derived(knownPults.length ? Math.round(activePults * 100 / knownPults.length) : 0);
  let transactions = $derived(selectEvents(model.events, ranges.transactions).toSorted((a, b) => b.date.localeCompare(a.date) || String(a.id).localeCompare(String(b.id))));
  let visibleTransactions = $derived(transactions.slice((transactionPage - 1) * pageSize, transactionPage * pageSize));
  let latestDate = $derived(model.events.reduce((latest, row) => row.date > latest ? row.date : latest, ''));
  let latestSummary = $derived(totals(selectEvents(model.events, { from: latestDate, to: latestDate })));
  let latestPayments = $derived(model.events.filter(row => row.date === latestDate && row.kind === 'income').slice(-3).reverse());
  let mainPeriod = $state('overview');
  let pultsPeriod = $state('month');
  let programsPeriod = $state('month');
  function setRange(block, next) {
    if (!next.from || !next.to || next.from > next.to) return;
    ranges[block] = { ...next };
    if (block === 'main') mainPeriod = 'custom';
    if (block === 'pults') pultsPeriod = 'custom';
    if (block === 'programs') programsPeriod = 'custom';
    if (block === 'transactions') transactionPage = 1;
  }
  function updateMainPeriod(period) { setRange('main', presetRange(period, today)); mainPeriod = period; }
  function updatePultsPeriod(period) { setRange('pults', presetRange(period, today)); pultsPeriod = period; }
  function updateProgramsPeriod(period) { setRange('programs', presetRange(period, today)); programsPeriod = period; }
  function switchSource(sample) {
    model = sample ? sampleModel : localModel;
    transactionPage = 1;
  }

  // Update existing chart instances so locale changes preserve their data and animation state.
  $effect(() => {
    if (!ready) return;
    const series = chartSeries(model.events, ranges.main);
    mainChartInstance.options.locale = language.locale;
    mainChartInstance.data.labels = series.map(row => row.label);
    mainChartInstance.options.plugins.tooltip.callbacks.title = contexts => series[contexts[0]?.dataIndex]?.month?.split('-').reverse().join('.') || '';
    ['profit', 'expenses', 'bonus'].forEach((key, index) => {
      mainChartInstance.data.datasets[index].label = language.translate(['Прибуток', 'Витрати', 'Бонуси'][index]);
      mainChartInstance.data.datasets[index].data = series.map(row => row[key] / 100);
      mainChartInstance.data.datasets[index].pointRadius = series.length === 1 ? 4 : 0;
    });
    mainChartInstance.update();
  });
  $effect(() => {
    if (!ready) return;
    remotesChartInstance.data.datasets[0].data = [activePults, inactivePults];
    remotesChartInstance.options.locale = language.locale;
    remotesChartInstance.data.labels = ['Пульти з операціями', 'Пульти без операцій'].map(value => language.translate(value));
    remotesChartInstance.update();
  });
  $effect(() => {
    if (!ready) return;
    programsChartInstance.data.labels = programRows.map(row => row.name);
    programsChartInstance.options.locale = language.locale;
    programsChartInstance.data.datasets[0].data = programRows.map(row => row.count);
    programsChartInstance.data.datasets[0].backgroundColor = programRows.map((_, index) => colors[index % colors.length]);
    programsChartInstance.update();
  });

  let mainChartCanvas;
  let remotesChartCanvas;
  let programsChartCanvas;

  let mainChartInstance;
  let remotesChartInstance;
  let programsChartInstance;

  onMount(async () => {
    initMainChart();
    initRemotesChart();
    initProgramsChart();

    ready = true;
    if (DEMO_MODE || LOCAL_MODE) {
      localModel = loadDashboard(localStorage, today);
      sampleModel = localModel.sample ? localModel : loadDashboard(localStorage, today, true);
      model = localModel.events.length ? localModel : sampleModel;
      return;
    }
    try {
      const response = await statsAPI.getActivities(10000);
      const rows = Array.isArray(response.data) ? response.data : response.data?.activities;
      model = { events: normalizeEvents(rows || []), sample: false, localCatalogs: false };
    } catch (error) {
      loadError = 'Не вдалося завантажити статистику API.';
      console.error("Ошибка загрузки данных:", error?.response?.status ?? error?.name);
    }
  });

  onDestroy(() => {
    if (mainChartInstance) mainChartInstance.destroy();
    if (remotesChartInstance) remotesChartInstance.destroy();
    if (programsChartInstance) programsChartInstance.destroy();
  });

  function initMainChart() {
    const ctx = mainChartCanvas.getContext("2d");
    
    mainChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Прибуток",
            data: [],
            backgroundColor: "#00a082",
            borderColor: "#00a082",
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            order: 3,
          },
          {
            label: "Витрати",
            data: [],
            backgroundColor: "#f45c5c",
            borderColor: "#f45c5c",
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            order: 2,
          },
          {
            label: "Бонуси",
            data: [],
            backgroundColor: "#5cc4ff",
            borderColor: "#5cc4ff",
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            order: 1,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { size: 14 },
            bodyFont: { size: 14, weight: 'bold' },
            padding: 12,
            displayColors: true,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ₴ ' + context.parsed.y.toLocaleString(language.locale);
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 12, font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#94a3b8', maxTicksLimit: 5, callback: value => Number(value).toLocaleString(language.locale) }
          }
        }
      }
    });
  }

  function initRemotesChart() {
    const ctx = remotesChartCanvas.getContext("2d");
    
    remotesChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["В роботі", "Не працюють"],
        datasets: [{
          data: [],
          backgroundColor: ["#5cc4ff", "#f45c5c"],
          borderWidth: 0,
          borderRadius: 15,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  }

  function initProgramsChart() {
    const ctx = programsChartCanvas.getContext("2d");
    
    programsChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Осмос", "Піна", "Віск", "Вода", "Пилосос"],
        datasets: [{
          data: [],
          backgroundColor: ["#f45c5c", "#00a082", "#5cc4ff", "#3b82f6", "#f59e0b"],
          borderWidth: 4,
          borderColor: 'transparent',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
</script>

<div class="dashboard-wrapper">
  {#if sampleModel && localModel && !localModel.sample}
    <div class="data-source-switch" aria-label={language.t('ui.dashboard.dataSource.label')}>
      <button type="button" class:active={!model.sample} onclick={() => switchSource(false)}>{language.t("ui.shared.mode.localData")}</button>
      <button type="button" class:active={model.sample} onclick={() => switchSource(true)}>{language.t("ui.dashboard.demo.showExample")}</button>
    </div>
  {/if}
  {#if model.sample}
    <p class="data-notice" role="status">{language.t("ui.dashboard.demo.disclaimer")}{model.localCatalogs ? language.t("ui.dashboard.demo.catalogNoticeContinuation") : ''}</p>
  {:else}
    <p class="data-notice" role="status">{LOCAL_MODE || DEMO_MODE ? language.t("ui.dashboard.dataSource.localJournal") : language.t("ui.dashboard.dataSource.apiJournal")} · {model.events.length} {language.t("ui.dashboard.dataSource.localLedgerDisclaimer")}</p>
  {/if}
  {#if loadError}<p class="data-notice" role="alert">{language.translate(loadError)}</p>{/if}
  
  <div class="chart-grid">
    <div class="chart-section">
      <div class="chart-header">
        <div class="chart-title">{language.t("ui.dashboard.finance.title")}</div>
        <div class="chart-actions">
          <button type="button" class="btn-sm" class:active={mainPeriod === 'day'} onclick={() => updateMainPeriod('day')}>{language.t("ui.dashboard.periods.day")}</button>
          <button type="button" class="btn-sm" class:active={mainPeriod === 'month'} onclick={() => updateMainPeriod('month')}>{language.t("ui.dashboard.periods.month")}</button>
          <button type="button" class="btn-sm" class:active={mainPeriod === 'year'} onclick={() => updateMainPeriod('year')}>{language.t("ui.dashboard.periods.year")}</button>
          <button type="button" class="btn-sm" class:active={mainPeriod === 'overview'} onclick={() => { setRange('main', overviewRange(today)); mainPeriod = 'overview'; }}>{language.t("ui.dashboard.periods.overview")}</button>
          <PeriodFilter range={ranges.main} label={language.t('ui.dashboard.periodLabels.finance')} onchange={next => setRange('main', next)} />
        </div>
      </div>
      <div class="chart-container" style="height: 320px;">
        <canvas bind:this={mainChartCanvas}></canvas>
      </div>
      <div class="chart-key"><span><i style="background: #00a082"></i>{language.t("ui.dashboard.finance.income")}</span><span><i style="background: #f45c5c"></i>{language.t("ui.dashboard.finance.expenses")}</span><span><i style="background: #5cc4ff"></i>{language.t("ui.dashboard.finance.bonusesLegendPrefix")} {money(stats.bonus)}</span></div>
    </div>

    <div class="stats-row">
      <div class="stat-card profit">
        <div class="stat-label">{language.t("ui.dashboard.finance.incomeWithIcon")}</div>
        <div class="stat-value">₴ {money(stats.profit)}</div>
        <div class="stat-change">{changeLabel(stats.profit, prior.profit)}</div>
      </div>

      <div class="stat-card expenses">
        <div class="stat-label">{language.t("ui.dashboard.finance.expensesWithIcon")}</div>
        <div class="stat-value">₴ {money(stats.expenses)}</div>
        <div class="stat-change">{changeLabel(stats.expenses, prior.expenses)}</div>
      </div>

      <div class="stat-card balance">
        <div class="stat-label">{language.t("ui.dashboard.finance.balanceWithIcon")}</div>
        <div class="stat-value">₴ {money(stats.balance)}</div>
        <div class="stat-change">{changeLabel(stats.balance, prior.balance)}</div>
      </div>
    </div>
  </div>

  <div class="panels-programs-stats">
    
    <div class="chart-section">
      <div class="chart-header">
        <div class="chart-title">{language.t("ui.dashboard.activePults.title")}</div>
        <div class="chart-actions">
          <button type="button" class="btn-sm" class:active={pultsPeriod === 'day'} onclick={() => updatePultsPeriod('day')}>{language.t("ui.dashboard.periods.day")}</button>
          <button type="button" class="btn-sm" class:active={pultsPeriod === 'month'} onclick={() => updatePultsPeriod('month')}>{language.t("ui.dashboard.periods.month")}</button>
          <button type="button" class="btn-sm" class:active={pultsPeriod === 'year'} onclick={() => updatePultsPeriod('year')}>{language.t("ui.dashboard.periods.year")}</button>
          <PeriodFilter range={ranges.pults} label={language.t('ui.dashboard.periodLabels.activePults')} onchange={next => setRange('pults', next)} />
        </div>
      </div>
      
      <div class="doughnut-container">
        <div class="chart-wrapper-small relative">
          <canvas bind:this={remotesChartCanvas}></canvas>
          <div class="doughnut-center-text">{pultPercent}%</div>
        </div>
        
        <div class="custom-legend-list">
           <div class="legend-item">
              <div class="legend-line line-red"></div>
              <div class="legend-text">
                 <span class="l-title">{language.t("ui.dashboard.activePults.withoutOperations")}</span>
                 <span class="l-value">{inactivePults}</span>
              </div>
           </div>
           <div class="legend-item">
              <div class="legend-line line-blue"></div>
              <div class="legend-text">
                 <span class="l-title">{language.t("ui.dashboard.activePults.withOperations")}</span>
                 <span class="l-value">{activePults}</span>
              </div>
           </div>
        </div>
      </div>
      <small class="sample-note">{language.t("ui.dashboard.activePults.activityHint")}</small>
    </div>

    <div class="chart-section">
      <div class="chart-header">
        <div class="chart-title">{language.t("ui.dashboard.programs.title")}</div>
        <div class="chart-actions">
          <button type="button" class="btn-sm" class:active={programsPeriod === 'day'} onclick={() => updateProgramsPeriod('day')}>{language.t("ui.dashboard.periods.day")}</button>
          <button type="button" class="btn-sm" class:active={programsPeriod === 'month'} onclick={() => updateProgramsPeriod('month')}>{language.t("ui.dashboard.periods.month")}</button>
          <button type="button" class="btn-sm" class:active={programsPeriod === 'year'} onclick={() => updateProgramsPeriod('year')}>{language.t("ui.dashboard.periods.year")}</button>
          <PeriodFilter range={ranges.programs} label={language.t('ui.dashboard.periodLabels.programs')} onchange={next => setRange('programs', next)} />
        </div>
      </div>
      
      <div class="doughnut-container">
        <div class="chart-wrapper-small">
          <canvas bind:this={programsChartCanvas}></canvas>
        </div>
        
        <div class="custom-legend-grid">
           {#each programRows as row, i}
             <div class="legend-grid-item">
                <div class="legend-line" style:background={colors[i % colors.length]}></div>
                <div class="legend-text">
                   <span class="l-title">{row.name}</span>
                   <span class="l-value">{row.percent}% · {row.count}</span>
                </div>
             </div>
           {:else}<p class="sample-note">{language.t("ui.dashboard.empty.operations")}</p>{/each}
        </div>
      </div>
    </div>
    
  </div>

  <div class="various-info">
    <div class="fin-panels-info">
      <div class="content-grid-item">
        <div class="table-card">
          <div class="table-header">
            <div class="table-title">{language.t("ui.dashboard.payments.title")}</div>
            <PeriodFilter range={ranges.payments} label={language.t('ui.dashboard.periodLabels.payments')} onchange={next => setRange('payments', next)} />
          </div>
          <table>
            <thead>
              <tr>
                <th>{language.t("ui.dashboard.columns.method")}</th>
                <th>{language.t("ui.shared.columns.count")}</th>
                <th>{language.t("ui.dashboard.columns.percentage")}</th>
                <th>{language.t("ui.dashboard.columns.progress")}</th>
              </tr>
            </thead>
            <tbody>
              {#each paymentRows as row, i}
                <tr>
                  <td>{language.translate(row.name)}</td><td>{row.count}</td><td>{row.percent}%</td>
                  <td><div class="progress-bar"><div class="progress-fill" style:width={`${row.percent}%`} style:background={colors[i % colors.length]}></div></div></td>
                </tr>
              {:else}<tr><td colspan="4">{language.t("ui.dashboard.empty.payments")}</td></tr>{/each}
            </tbody>
          </table>
        </div>
      </div>

      <div class="content-grid-item">
        <div class="table-card">
          <div class="table-header">
            <div class="table-title">{language.t("ui.shared.titles.clients")}</div>
            <PeriodFilter range={ranges.clients} label={language.t('ui.dashboard.periodLabels.clients')} onchange={next => setRange('clients', next)} />
          </div>
          <div class="data-table-scroll"><table>
            <thead><tr><th>{language.t("ui.shared.columns.client")}</th><th>{language.t("ui.dashboard.columns.operationsCount")}</th><th>{language.t("ui.shared.columns.amount")}</th></tr></thead>
            <tbody>{#each clientRows as row}<tr><td>{row.name}</td><td>{row.count}</td><td>₴ {money(row.amount)}</td></tr>
            {:else}<tr><td colspan="3">{language.t("ui.dashboard.empty.clients")}</td></tr>{/each}</tbody>
          </table></div>
        </div>
      </div>

      <div class="content-grid-item">
        <div class="table-card">
          <div class="table-header">
            <div class="table-title">{language.t("ui.dashboard.transactions.title")}</div>
            <PeriodFilter range={ranges.transactions} label={language.t('ui.dashboard.periodLabels.transactions')} onchange={next => setRange('transactions', next)} />
          </div>
          <p class="sample-note">{language.t("ui.dashboard.transactions.recordsPrefix")} {transactions.length} {language.t("ui.dashboard.transactions.incomePrefix")} {money(totals(transactions).profit)} {language.t("ui.dashboard.transactions.expensesPrefix")} {money(totals(transactions).expenses)}</p>
          <div class="data-table-scroll"><table>
            <thead><tr><th>{language.t("ui.shared.columns.date")}</th><th>{language.t("ui.dashboard.transactions.columns.typeMethod")}</th><th>{language.t("ui.dashboard.transactions.columns.clientDescription")}</th><th>{language.t("ui.dashboard.transactions.columns.pultProgram")}</th><th>{language.t("ui.shared.columns.amount")}</th></tr></thead>
            <tbody>{#each visibleTransactions as row}<tr><td>{language.date(row.date)}</td><td>{row.kind === 'expense' ? language.t("ui.dashboard.transactions.types.expense") : row.kind === 'topup' ? language.t("ui.dashboard.transactions.types.cardTopup") : language.t("ui.dashboard.transactions.types.payment")} · {language.translate(row.method)}</td><td>{row.client}</td><td>{row.pult || '—'} · {row.program || '—'}</td><td>{row.kind === 'expense' ? '−' : '+'}₴ {money(row.amount)}</td></tr>
            {:else}<tr><td colspan="5">{language.t("ui.dashboard.empty.transactions")}</td></tr>{/each}</tbody>
          </table></div>
          <div class="pagination"><button class="btn-sm" disabled={transactionPage <= 1} onclick={() => transactionPage--}>{language.t("ui.dashboard.pagination.previous")}</button><span>{transactionPage} / {Math.max(1, Math.ceil(transactions.length / pageSize))}</span><button class="btn-sm" disabled={transactionPage * pageSize >= transactions.length} onclick={() => transactionPage++}>{language.t("ui.dashboard.pagination.next")}</button></div>
        </div>
      </div>

      <div class="content-grid-item">
        <div class="table-card">
          <div class="table-header">
            <div class="table-title">{language.t("ui.dashboard.pultActivity.title")}</div>
            <PeriodFilter range={ranges.activity} label={language.t('ui.dashboard.periodLabels.pultActivity')} onchange={next => setRange('activity', next)} />
          </div>
          <div class="data-table-scroll"><table>
            <thead><tr><th>{language.t("ui.shared.columns.pult")}</th><th>{language.t("ui.dashboard.columns.operationsCount")}</th><th>{language.t("ui.shared.columns.amount")}</th></tr></thead>
            <tbody>{#each activityRows as row}<tr><td>{row.name}</td><td>{row.count}</td><td>₴ {money(row.amount)}</td></tr>
            {:else}<tr><td colspan="3">{language.t("ui.dashboard.empty.activity")}</td></tr>{/each}</tbody>
          </table></div>
        </div>
      </div>
    </div>

    <div class="telegram-info">
       <div class="tg-header">
         <span>{language.t("ui.dashboard.telegram.title")}</span>
       </div>
       <div class="tg-content">
          <div class="bot-profile"><span class="bot-avatar">✈</span><div><strong>{language.t("ui.dashboard.telegram.botName")}</strong><small>{language.t("ui.dashboard.telegram.previewLabel")}</small></div></div>
          <p class="bot-disclaimer">{language.t("ui.dashboard.telegram.demoHint")}</p>
          <div class="bot-message"><span class="bot-message-type">{language.t("ui.dashboard.telegram.dailyReportPrefix")} {latestDate ? latestDate.split('-').reverse().join('.') : '—'}</span><strong>{language.t("ui.dashboard.telegram.incomePrefix")} {money(latestSummary.profit)}</strong><span>{language.t("ui.dashboard.telegram.expensesPrefix")} {money(latestSummary.expenses)}</span><span>{language.t("ui.dashboard.telegram.bonusesPrefix")} {money(latestSummary.bonus)}</span><span>{language.t("ui.dashboard.telegram.balancePrefix")} {money(latestSummary.balance)}</span></div>
          {#each latestPayments as row}
            <div class="bot-message"><span class="bot-message-type">{language.t("ui.dashboard.telegram.paymentPrefix")} {row.pult || language.t("ui.dashboard.states.pultUnspecified")}</span><strong>₴ {money(row.amount)} · {language.translate(row.method)}</strong><span>{row.client}</span><span>{row.program || language.t("ui.dashboard.states.programUnspecified")}</span></div>
          {:else}<p class="sample-note">{language.t("ui.dashboard.telegram.noRecentPayments")}</p>{/each}
          <div class="bot-footer">{language.t("ui.dashboard.telegram.eventsHint")}</div>
       </div>
    </div>
  </div>
</div>

<style>
  .data-source-switch { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .data-source-switch button { border: 1px solid #cbd5e1; background: transparent; color: #64748b; border-radius: 7px; padding: 7px 12px; cursor: pointer; }
  .data-source-switch button.active { background: #0284c7; border-color: #0284c7; color: white; }
  .chart-key { display: flex; flex-wrap: wrap; gap: 12px 24px; font-size: 12px; color: #64748b; margin-top: 16px; }
  .chart-key span { display: inline-flex; align-items: center; gap: 7px; }
  .chart-key i { width: 18px; height: 5px; border-radius: 3px; }
  .tg-content { display: grid; gap: 12px; }
  .bot-profile { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .bot-profile strong { display: block; font-size: 14px; }
  .bot-profile small { display: block; font-size: 11px; color: #0284c7; margin-top: 3px; }
  .bot-avatar { display: grid; place-items: center; flex-shrink: 0; background: #38bdf8; color: white; width: 36px; height: 36px; border-radius: 50%; font-size: 22px; }
  .bot-disclaimer, .bot-footer { color: #64748b; font-size: 11px; line-height: 1.6; margin: 0; }
  .bot-message { display: flex; flex-direction: column; gap: 6px; min-width: 0; overflow-wrap: anywhere; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px 10px 10px 2px; padding: 12px; margin: 0; font-size: 12px; color: #334155; }
  .bot-message-type { font-size: 11px; color: #64748b; }
  :global(html.dark) .bot-message { background: #0f172a; border-color: #334155; color: #e2e8f0; }
  :global(html.dark) .bot-disclaimer, :global(html.dark) .bot-footer, :global(html.dark) .chart-key, :global(html.dark) .data-source-switch button:not(.active) { color: #94a3b8; }
  .data-notice { padding: 12px 16px; margin: 0 0 24px; border: 1px solid #38bdf8; border-radius: 8px; color: #075985; background: #e0f2fe; font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
  :global(html.dark) .data-notice { color: #bae6fd; background: #0c4a6e; }
  .data-table-scroll { overflow: auto; max-height: 340px; min-width: 0; }
  .pagination { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 16px; font-size: 12px; }
  button:disabled { opacity: 0.45; cursor: default; }
  .chart-header, .table-header { flex-wrap: wrap; gap: 12px; }
  .chart-section, .table-card, .content-grid-item, .telegram-info { min-width: 0; box-sizing: border-box; }
  .custom-legend-grid { max-height: 220px; overflow: auto; }
  .custom-legend-grid .sample-note { grid-column: 1 / -1; }
  :global(body) { 
    background-color: #f8fafc; 
    color: #0f172a; 
    transition: background-color 0.3s ease, color 0.3s ease;
    font-family: system-ui, -apple-system, sans-serif;
    margin: 0;
  }
  :global(html.dark body) { 
    background-color: #0f172a; 
    color: #f1f5f9; 
  }

  .dashboard-wrapper {
    container: dashboard / inline-size;
    width: 100%;
    min-height: 100vh;
    box-sizing: border-box;
    background-color: #f8fafc;
    transition: background-color 0.3s ease;
  }

  .chart-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(260px, 0.36fr);
    gap: 24px;
    margin-bottom: 24px;
  }

  .stats-row { display: grid; grid-template-rows: repeat(3, 1fr); gap: 24px; min-width: 0; color: #fff; }

  .stat-card {
    background: #f45c5c;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    cursor: pointer;
    box-sizing: border-box;
    width: 100%;
    border: 1px solid transparent;
  }

  .stat-card:first-child { background: #00a082; }
  .stat-card:last-child { background: #5cc4ff; }
  .stat-card:hover { transform: translateY(-4px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12); }

  .stat-label { font-size: 13px; margin-bottom: 8px; opacity: 0.9; }
  .stat-value { font-size: clamp(22px, 2.2cqi, 28px); font-weight: bold; line-height: 1.3; overflow-wrap: anywhere; }
  .stat-change { font-size: 12px; margin-top: 8px; color: rgba(255, 255, 255, 0.85); }

  .panels-programs-stats {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 6fr);
    align-items: start;
    gap: 24px;
    width: 100%;
    margin-bottom: 24px;
  }

  .various-info { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 0.32fr); gap: 24px; align-items: start; width: 100%; }
  .fin-panels-info { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; align-items: start; align-content: start; min-width: 0; }
  .content-grid-item { display: block; }
  .content-grid-item .table-card { width: 100%; }

  .chart-section, .table-card, .telegram-info {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
  }

  .tg-header, .chart-title, .table-title { font-weight: 700; color: #1e293b; margin: 0; font-size: 16px; line-height: 1.5; overflow-wrap: anywhere; }
  .tg-header { margin-bottom: 16px; }
  .chart-header, .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .chart-title, .table-title { min-width: 0; }
  .panels-programs-stats .chart-header { flex-direction: column; align-items: flex-start; }
  .dashboard-wrapper :global(.period-button) { min-height: 32px; max-width: 100%; box-sizing: border-box; line-height: 1.4; }

  .chart-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    max-width: 100%;
    box-sizing: border-box;
    background: #f1f5f9;
    padding: 4px;
    border-radius: 8px;
    gap: 4px;
    transition: background-color 0.3s;
  }

  .btn-sm { min-height: 32px; padding: 6px 12px; font-size: 12px; border-radius: 6px; border: none; background: transparent; cursor: pointer; color: #64748b; font-weight: 500; transition: all 0.2s; }
  .btn-sm.active { background: #ffffff; color: #0f172a; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

  .chart-container { position: relative; width: 100%; min-width: 0; }
  
  .doughnut-container {
    display: flex;
    align-items: center;
    gap: 24px;
    min-width: 0;
  }

  .chart-wrapper-small {
    height: 200px;
    width: 200px;
    flex-shrink: 0;
  }

  .relative { position: relative; }
  .doughnut-center-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 28px;
    font-weight: 700;
    color: #5cc4ff;
  }

  .custom-legend-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .custom-legend-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    flex: 1;
    min-width: 0;
  }

  .legend-item, .legend-grid-item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .legend-line {
    width: 24px;
    height: 6px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .line-red { background: #f45c5c; }
  .line-blue { background: #5cc4ff; }

  .legend-text { display: flex; flex-direction: column; min-width: 0; overflow-wrap: anywhere; }
  .l-title { font-size: 12px; color: #64748b; margin-bottom: 2px;}
  .l-value { font-size: 16px; font-weight: 700; color: #1e293b; }


  .sample-note { display: block; margin: 0 0 16px; color: #64748b; font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
  .chart-section > .sample-note { margin: 16px 0 0; }
  .custom-legend-grid > .sample-note, .tg-content > .sample-note { margin: 0; }

  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 8px; font-size: 11px; line-height: 1.5; color: #64748b; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 12px 8px; font-size: 13px; line-height: 1.5; vertical-align: top; overflow-wrap: break-word; border-bottom: 1px solid #f1f5f9; color: #334155; }
  .content-grid-item:nth-child(3) table { min-width: 560px; }
  .content-grid-item:nth-child(3) td:first-child, .content-grid-item:nth-child(3) td:last-child { white-space: nowrap; }
  .progress-bar { width: 60px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 3px; }

  :global(html.dark) .dashboard-wrapper { background-color: #0f172a; }

  :global(html.dark) .chart-section, 
  :global(html.dark) .table-card, 
  :global(html.dark) .telegram-info {
    background: #1e293b;
    border-color: #334155;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  }

  :global(html.dark) .chart-title,
  :global(html.dark) .table-title,
  :global(html.dark) .tg-header,
  :global(html.dark) .l-value,
  :global(html.dark) td { color: #f8fafc; }

  :global(html.dark) th { color: #94a3b8; border-bottom-color: #334155; }
  :global(html.dark) td { border-bottom-color: #334155; }
  :global(html.dark) .chart-actions { background: #0f172a; }
  :global(html.dark) .btn-sm { color: #94a3b8; }
  :global(html.dark) .btn-sm.active { background: #334155; color: #ffffff; box-shadow: none; }
  :global(html.dark) .progress-bar { background: #334155; }

  :global(html.dark) .stat-card { box-shadow: none; }
  :global(html.dark) .stat-card:first-child { background: rgba(0, 160, 130, 0.2); border-color: rgba(0, 160, 130, 0.4); color: #34d399; }
  :global(html.dark) .stat-card:nth-child(2) { background: rgba(244, 92, 92, 0.15); border-color: rgba(244, 92, 92, 0.3); color: #f87171; }
  :global(html.dark) .stat-card:last-child { background: rgba(92, 196, 255, 0.15); border-color: rgba(92, 196, 255, 0.3); color: #7dd3fc; }
  :global(html.dark) .stat-card .stat-label, :global(html.dark) .stat-card .stat-change { color: #cbd5e1; }
  :global(html.dark) .stat-card .stat-value { color: #ffffff; }
  @container dashboard (max-width: 1000px) {
    .panels-programs-stats { grid-template-columns: 1fr; }
    .panels-programs-stats .chart-header { flex-direction: row; align-items: center; }
    .various-info { grid-template-columns: 1fr; }
    .tg-content { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .bot-profile, .bot-disclaimer, .bot-footer, .tg-content > .sample-note { grid-column: 1 / -1; }
  }
  @container dashboard (max-width: 1100px) {
    .table-header { flex-direction: column; align-items: flex-start; }
  }
  @container dashboard (max-width: 1050px) {
    .chart-grid { grid-template-columns: 1fr; }
    .stats-row { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: auto; }
    .stat-card { padding: 16px; }
  }
  @container dashboard (max-width: 800px) {
    .chart-header, .panels-programs-stats .chart-header { flex-direction: column; align-items: flex-start; }
    .chart-wrapper-small { width: 180px; height: 180px; }
    .custom-legend-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .fin-panels-info { grid-template-columns: 1fr; }
  }
  @container dashboard (max-width: 600px) {
    .chart-grid, .panels-programs-stats, .various-info, .fin-panels-info, .stats-row { gap: 16px; }
    .chart-grid, .panels-programs-stats { margin-bottom: 16px; }
    .chart-section, .table-card, .telegram-info { padding: 16px; }
    .stats-row, .tg-content { grid-template-columns: 1fr; }
    .doughnut-container { flex-wrap: wrap; gap: 16px; }
    .custom-legend-grid { flex-basis: 100%; }
    .legend-line { width: 18px; }
  }
  @media (max-width: 1024px) {
    :global(body .main-content:has(.dashboard-wrapper)) { margin-left: 0; min-width: 0; }
    :global(.main-content:has(.dashboard-wrapper) > .header) { flex-wrap: wrap; gap: 12px; padding-left: 80px; }
    :global(.main-content:has(.dashboard-wrapper) > .header .user-actions) { flex-wrap: wrap; gap: 12px; min-width: 0; }
  }
</style>
