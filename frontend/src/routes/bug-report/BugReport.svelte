<script>
  import { onMount } from 'svelte';
  import { Bug, ClipboardList, Download, Trash2, CircleCheck, AlertTriangle, FileWarning, Send, Lightbulb, ShieldCheck } from 'lucide-svelte';
  import { language } from '$lib/localisation/language.svelte.js';
  import { telegramSupportURL } from '$lib/support.js';
  const supportURL = telegramSupportURL(import.meta.env.VITE_TELEGRAM_SUPPORT_URL);

  const KEY = 'bigwash.bugReports.v1';
  let reports = $state([]);
  let title = $state('');
  let details = $state('');
  let steps = $state('');
  let category = $state('ui');
  let severity = $state('normal');
  let includeEnvironment = $state(true);
  let savedMessage = $state('');
  let error = $state('');
  let pageURL = $state('');
  const ru = $derived(language.current === 'RU');

  onMount(() => {
    pageURL = window.location.href;
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
      reports = Array.isArray(stored) ? stored : [];
    } catch {
      reports = [];
    }
  });

  function persist(next) {
    localStorage.setItem(KEY, JSON.stringify(next));
    reports = next;
  }

  function saveReport() {
    savedMessage = '';
    error = '';
    if (title.trim().length < 4 || details.trim().length < 12) {
      error = ru ? 'Укажите тему (от 4 символов) и описание (от 12 символов).' : 'Вкажіть тему (від 4 символів) та опис (від 12 символів).';
      return;
    }
    const report = {
      id: crypto.randomUUID?.() || String(Date.now()),
      title: title.trim(),
      details: details.trim(),
      steps: steps.trim(),
      category, severity,
      created_at: new Date().toISOString(),
      ...(includeEnvironment ? { environment: { page: pageURL, userAgent: navigator.userAgent, app: 'BigWash frontend standalone' } } : {})
    };
    try {
      persist([report, ...reports]);
      title = ''; details = ''; steps = '';
      savedMessage = ru ? 'Отчёт сохранён в этом браузере. Чтобы передать его разработчику, скачайте JSON.' : 'Звіт збережено у цьому браузері. Щоб передати його розробнику, завантажте JSON.';
    } catch {
      error = ru ? 'Не удалось сохранить отчёт. Проверьте свободное место браузера.' : 'Не вдалося зберегти звіт. Перевірте вільне місце браузера.';
    }
  }

  function downloadReport(report) {
    const content = JSON.stringify(report, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bigwash-report-${report.id}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function removeReport(id) {
    if (!confirm(ru ? 'Удалить этот локальный отчёт?' : language.t("ui.bugReport.confirm.deleteLocalReport"))) return;
    try { persist(reports.filter(report => report.id !== id)); }
    catch { error = ru ? 'Ошибка удаления.' : 'Помилка видалення.'; }
  }

  function formatDate(value) {
    return new Date(value).toLocaleString(ru ? 'ru-RU' : 'uk-UA', { dateStyle: 'medium', timeStyle: 'short' });
  }
</script>

<svelte:head><title>{ru ? 'Отчёт об ошибке' : language.t("ui.bugReport.title")} {language.t("ui.shared.brand.pageTitleSuffix")}</title></svelte:head>

<div class="report-page">
  <header class="hero">
    <div class="hero-icon"><Bug size={30} strokeWidth={1.8}/></div>
    <div class="hero-copy">
      <div class="eyebrow">{language.t("ui.bugReport.brand.supportCenter")}</div>
      <h1>{ru ? 'Отчёт об ошибке' : language.t("ui.bugReport.title")}</h1>
      <p>{ru ? 'Опишите, что пошло не так. Сохраните отчёт и передайте его разработчику.' : language.t("ui.bugReport.description")}</p>
    </div>
    <div class="hero-badge"><ShieldCheck size={16}/>{ru ? 'Локальное хранение' : language.t("ui.bugReport.localStorage.title")}</div>
  </header>

  <div class="layout">
    <section class="surface form-card">
      <div class="section-heading"><span class="section-icon"><FileWarning size={20}/></span><div><h2>{ru ? 'Новый отчёт' : language.t("ui.bugReport.form.newReport")}</h2><p>{ru ? 'Поля со звёздочкой обязательны' : language.t("ui.bugReport.help.requiredFields")}</p></div></div>
      <form onsubmit={(event) => {event.preventDefault();saveReport();}}>
        <div class="two-fields">
          <label>{ru ? 'Категория' : language.t("ui.bugReport.fields.category")}
            <select bind:value={category}>
              <option value="ui">{ru ? 'Интерфейс и отображение' : language.t("ui.bugReport.categories.interface")}</option>
              <option value="function">{ru ? 'Кнопки и функции' : language.t("ui.bugReport.categories.controls")}</option>
              <option value="data">{ru ? 'Данные и сохранение' : language.t("ui.bugReport.categories.data")}</option>
              <option value="other">{ru ? 'Другое' : language.t("ui.bugReport.categories.other")}</option>
            </select>
          </label>
          <label>{ru ? 'Приоритет' : language.t("ui.bugReport.fields.priority")}
            <select bind:value={severity}>
              <option value="low">{ru ? 'Низкий' : language.t("ui.bugReport.priority.low")}</option>
              <option value="normal">{ru ? 'Средний' : language.t("ui.bugReport.priority.medium")}</option>
              <option value="high">{ru ? 'Высокий' : language.t("ui.bugReport.priority.high")}</option>
              <option value="critical">{ru ? 'Критический' : language.t("ui.bugReport.priority.critical")}</option>
            </select>
          </label>
        </div>
        <label>{ru ? 'Короткое название *' : language.t("ui.bugReport.fields.subject")}
          <input bind:value={title} maxlength="120" placeholder={ru ? 'Например: кнопка сохранения не работает' : language.t("ui.bugReport.placeholders.subject")} required/>
        </label>
        <label>{ru ? 'Что произошло? *' : language.t("ui.bugReport.fields.description")}
          <textarea bind:value={details} rows="5" minlength="12" maxlength="4000" placeholder={ru ? 'Опишите проблему: что ожидали и что произошло...' : language.t("ui.bugReport.placeholders.description")} required></textarea>
        </label>
        <label>{ru ? 'Как повторить ошибку' : language.t("ui.bugReport.fields.reproductionSteps")}
          <textarea bind:value={steps} rows="3" maxlength="3000" placeholder={ru ? '1. Открыть страницу...\n2. Нажать...' : language.t("ui.bugReport.placeholders.reproductionSteps")}></textarea>
        </label>
        <label class="checkbox-line"><input type="checkbox" bind:checked={includeEnvironment}/><span>{ru ? 'Добавить адрес страницы и сведения о браузере' : language.t("ui.bugReport.fields.includeEnvironment")}</span></label>
        {#if error}<div class="feedback error" role="alert"><AlertTriangle size={17}/>{language.translate(error)}</div>{/if}
        {#if savedMessage}<div class="feedback success" role="status"><CircleCheck size={17}/>{language.translate(savedMessage)}</div>{/if}
        <button class="primary" type="submit"><Send size={17}/>{ru ? 'Сохранить отчёт' : language.t("ui.bugReport.actions.saveReport")}</button>
      </form>
    </section>

    <aside class="side">
      <div class="surface telegram-card">
        {#if supportURL}
          <a class="primary" href={supportURL} target="_blank" rel="noopener noreferrer">{language.t('review.telegramOpen')}</a>
        {:else}
          <button class="primary" type="button" disabled>{language.t('review.telegramOpen')}</button>
          <p role="status">{language.t('review.telegramNotConfigured')}</p>
        {/if}
        <p>{language.t('review.telegramHint')}</p>
      </div>
      <div class="surface tip-card"><div class="tip-icon"><Lightbulb size={23}/></div><h3>{ru ? 'Хороший отчёт — быстрый фикс' : language.t("ui.bugReport.help.title")}</h3><p>{ru ? 'Укажите страницу, последовательность действий и ожидаемый результат. Так разработчику будет проще найти проблему.' : language.t("ui.bugReport.help.description")}</p></div>
      <div class="surface safe-card"><ShieldCheck size={20}/><div><strong>{ru ? 'Без отправки на сервер' : language.t("ui.bugReport.delivery.localOnly")}</strong><p>{ru ? 'Отчёты остаются в браузере. Нажмите «Скачать», чтобы передать JSON.' : language.t("ui.bugReport.history.downloadHint")}</p></div></div>
      <div class="surface counter"><span>{ru ? 'Сохранённые отчёты' : language.t("ui.bugReport.history.savedReports")}</span><strong>{reports.length}</strong></div>
    </aside>
  </div>

  <section class="surface history">
    <div class="history-heading"><div class="section-heading"><span class="section-icon"><ClipboardList size={19}/></span><div><h2>{ru ? 'История отчётов' : language.t("ui.bugReport.history.title")}</h2><p>{ru ? 'Можно скачать или удалить любой отчёт' : language.t("ui.bugReport.history.manageHint")}</p></div></div></div>
    {#if reports.length === 0}
      <div class="empty"><ClipboardList size={31}/><strong>{ru ? 'Пока нет отчётов' : language.t("ui.bugReport.empty.history")}</strong><span>{ru ? 'Создайте первый отчёт выше' : language.t("ui.bugReport.empty.createFirstHint")}</span></div>
    {:else}
      <div class="report-list">
        {#each reports as report (report.id)}
          <article class="report-row"><div class="mini-icon"><Bug size={19}/></div><div class="report-meta"><strong>{report.title}</strong><small>{formatDate(report.created_at)} · {report.category} · {report.severity}</small></div><div class="row-actions"><button type="button" title={ru ? 'Скачать JSON' : language.t("ui.shared.actions.downloadJson")} onclick={() => downloadReport(report)}><Download size={18}/></button><button type="button" title={ru ? 'Удалить' : language.t("ui.shared.actions.delete")} onclick={() => removeReport(report.id)}><Trash2 size={18}/></button></div></article>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .telegram-card { padding: 20px; }
  .telegram-card a { text-decoration: none; }
  .telegram-card p { font-size: 13px; line-height: 1.6; color: var(--text-muted); }
  .telegram-card button:disabled { opacity: .5; cursor: not-allowed; }
  .report-page { box-sizing: border-box; }
  .report-page {width:min(1330px,100%);margin:0 auto;padding:14px 4px 50px;color:var(--text-main,#f8fafc)}
  .hero {display:flex;align-items:center;gap:22px;padding:28px 32px;border-radius:24px;background:linear-gradient(125deg,#173e80,#275b9c);color:white;position:relative;overflow:hidden;margin-bottom:22px;box-shadow:0 14px 32px #08132724}
  .hero:after {content:'';position:absolute;border:1px solid #ffffff24;width:230px;height:230px;border-radius:50%;right:-55px;top:-140px}
  .hero-icon {width:66px;height:66px;display:grid;place-items:center;border-radius:18px;background:#ffffff21;flex-shrink:0}
  .hero-copy {flex:1;z-index:1}.hero h1{font-size:clamp(23px,2.3vw,32px);margin:4px 0 8px}.hero p{margin:0;color:#d9e8fa;font-size:14px}.eyebrow{font-size:10px;letter-spacing:.2em;font-weight:800;color:#b7d7ff}.hero-badge{display:flex;align-items:center;gap:8px;background:#ffffff20;border:1px solid #ffffff30;border-radius:30px;padding:9px 13px;font-size:12px;white-space:nowrap;z-index:1}
  .layout{display:grid;grid-template-columns:minmax(0,1.9fr) minmax(240px,1fr);gap:20px;margin-bottom:20px}.surface{background:var(--bg-card,#1e293b);border:1px solid var(--border-color,#334155);border-radius:20px;box-shadow:0 8px 26px #06122210}.form-card{padding:27px}.section-heading{display:flex;gap:13px;align-items:center;margin-bottom:22px}.section-heading h2{margin:0 0 4px;font-size:19px}.section-heading p{margin:0;color:var(--text-muted,#94a3b8);font-size:12px}.section-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;color:#0ea5e9;background:#38bdf817}
  form{display:grid;gap:17px}label{font-size:13px;font-weight:650;color:var(--text-main,#e2e8f0);display:grid;gap:9px}.two-fields{display:grid;grid-template-columns:1fr 1fr;gap:16px}input:not([type=checkbox]),textarea,select{font:inherit;color:var(--text-main,#f1f5f9);padding:13px 14px;width:100%;box-sizing:border-box;border-radius:11px;background:var(--bg-input,#0f172a);border:1px solid var(--border-color,#334155);outline:none}input:focus,textarea:focus,select:focus{border-color:#38bdf8;box-shadow:0 0 0 3px #38bdf81c}textarea{resize:vertical}.checkbox-line{display:flex;align-items:center;gap:9px;font-weight:450;color:var(--text-muted,#94a3b8)}.checkbox-line input{accent-color:#2563eb;width:16px;height:16px}.primary{display:inline-flex;align-items:center;justify-content:center;gap:9px;border:0;background:linear-gradient(110deg,#136bd1,#244989);color:white;padding:14px 20px;border-radius:12px;font-weight:750;cursor:pointer}.primary:hover{filter:brightness(1.1)}.feedback{display:flex;gap:9px;align-items:flex-start;font-size:13px;padding:11px 13px;border-radius:10px}.error{color:#b91c1c;background:#fef2f2}.success{color:#166534;background:#dcfce7}
  .side{display:grid;gap:18px;align-content:start}.tip-card{padding:27px}.tip-card h3{font-size:18px;line-height:1.3;margin:16px 0 10px}.tip-card p,.safe-card p{font-size:13px;line-height:1.7;color:var(--text-muted,#94a3b8);margin:0}.tip-icon{background:#f59e0b1d;color:#f59e0b;border-radius:13px;padding:12px;width:max-content}.safe-card{display:flex;gap:14px;align-items:start;padding:20px}.safe-card>svg{color:#10b981;flex-shrink:0}.safe-card strong{font-size:13px}.safe-card p{margin-top:4px}.counter{display:flex;align-items:center;justify-content:space-between;padding:19px 25px}.counter span{font-size:13px;color:var(--text-muted)}.counter strong{font-size:28px;color:#38bdf8}
  .history{padding:23px 27px}.history-heading .section-heading{margin-bottom:13px}.report-row{display:flex;align-items:center;gap:15px;border-top:1px solid var(--border-color,#334155);padding:15px 0}.mini-icon{background:#3b82f61b;color:#3b82f6;border-radius:12px;display:grid;place-items:center;width:38px;height:38px}.report-meta{flex:1;min-width:0}.report-meta strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.report-meta small{color:var(--text-muted);font-size:12px}.row-actions{display:flex;gap:7px}.row-actions button{border:1px solid var(--border-color);background:var(--bg-input);color:var(--text-muted);border-radius:9px;display:grid;place-items:center;padding:9px;cursor:pointer}.row-actions button:hover{color:#38bdf8;border-color:#38bdf8}.empty{display:flex;align-items:center;flex-direction:column;gap:9px;padding:35px;color:var(--text-muted)}.empty strong{color:var(--text-main)}
  @media(max-width:900px){.layout{grid-template-columns:1fr}.hero-badge{display:none}}@media(max-width:550px){.hero{padding:22px;gap:13px}.hero-icon{width:48px;height:48px}.form-card,.tip-card,.history{padding:18px}.two-fields{grid-template-columns:1fr}}

  @media(max-width:430px) { .hero { padding: 18px; flex-wrap: wrap; } .hero-copy { min-width: 0; } .section-heading { align-items: flex-start; } .section-heading h2 { overflow-wrap: anywhere; } .counter { gap: 10px; } }
</style>
