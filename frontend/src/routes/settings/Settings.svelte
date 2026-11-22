<script>
  import { onMount } from 'svelte';
  import { Settings, Languages, Moon, Sun, Monitor, Database, Download, ShieldCheck, Info, CheckCircle2, FolderArchive, Users, CreditCard, Wrench } from 'lucide-svelte';
  import { language } from '$lib/localisation/language.svelte.js';
  import { theme } from '$lib/components/theme.svelte.js';
  import { LOCAL_MODE } from '$lib/api/client.js';

  const ru = $derived(language.current === 'RU');
  let clientCount = $state(0);
  let adminCount = $state(0);
  let cardsCount = $state(0);
  let programCount = $state(0);
  let feedback = $state('');

  function readArray(key, fallback = []) {
    try { const parsed = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(parsed) ? parsed : fallback; }
    catch { return fallback; }
  }

  function refreshCounts() {
    clientCount = readArray('bigwash.local.v1.clients').length;
    adminCount = readArray('bigwash.local.v1.admins').length;
    cardsCount = readArray('bigwash.local.v1.cards').length;
    programCount = readArray('bigwash.programs.v1').length;
  }

  onMount(() => { theme.apply(); refreshCounts(); });

  function setTheme(next) {
    if (theme.current !== next) theme.toggle();
    else theme.apply();
    feedback = ru ? 'Оформление сохранено.' : 'Оформлення збережено.';
  }

  function setLanguage(next) {
    language.set(next);
    feedback = next === 'RU' ? 'Язык интерфейса сохранён.' : 'Мову інтерфейсу збережено.';
  }

  function exportData() {
    // Export only interface data; exclude the session, account profile and passwords.
    const keys = [
      'bigwash.local.v1.clients', 'bigwash.local.v1.admins', 'bigwash.local.v1.cards',
      'bigwash.local.v1.activities', 'bigwash.programs.v1', 'bigwash.bugReports.v1'
    ];
    const data = {};
    for (const key of keys) {
      try { data[key] = JSON.parse(localStorage.getItem(key) || 'null'); }
      catch { data[key] = null; }
    }
    // Legacy records may contain credential fields even though the selected stores are interface data.
    const credentials = new Set(['password', 'passwordhash', 'hashedpassword', 'passwordsalt', 'passwordconfirmation', 'token', 'accesstoken', 'refreshtoken', 'idtoken', 'jwt', 'authorization', 'apikey', 'secret', 'clientsecret', 'hash', 'salt']);
    const blob = new Blob([JSON.stringify({ app: 'BigWash', version: 1, exported_at: new Date().toISOString(), data },
      (key, value) => credentials.has(key.replace(/[_-]/g, '').toLowerCase()) ? undefined : value, 2)], { type: 'application/json;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href; a.download = `BigWash-local-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(href);
    feedback = ru ? 'Резервная копия JSON скачана.' : 'Резервну копію JSON завантажено.';
  }
</script>

<svelte:head><title>{ru ? 'Настройки' : language.t("ui.settings.title")} {language.t("ui.shared.brand.pageTitleSuffix")}</title></svelte:head>

<div class="settings-page">
  <header class="hero">
    <div class="hero-mark"><Settings size={30} strokeWidth={1.8}/></div>
    <div class="hero-copy"><div class="eyebrow">{language.t("ui.settings.brand.controlCenter")}</div><h1>{ru ? 'Настройки' : language.t("ui.settings.title")}</h1><p>{ru ? 'Персонализируйте рабочее пространство и управляйте локальными данными.' : language.t("ui.settings.description")}</p></div>
    <div class="mode"><Monitor size={17}/>{LOCAL_MODE ? (ru ? 'Автономный режим' : language.t("ui.settings.mode.offline")) : (ru ? 'Go API подключён' : language.t("ui.settings.api.connected"))}</div>
  </header>

  <div class="settings-grid">
    <div class="left-col">
      <section class="panel">
        <div class="panel-heading"><span class="circle"><Languages size={21}/></span><div><h2>{ru ? 'Язык интерфейса' : language.t("ui.settings.language.title")}</h2><p>{ru ? 'Выберите удобный язык для BigWash' : language.t("ui.settings.language.description")}</p></div></div>
        <div class="options two">
          <button type="button" class:active={language.current === 'UA'} onclick={() => setLanguage('UA')}><span class="flag">🇺🇦</span><span><strong>{language.t("ui.settings.language.ukrainianName")}</strong><small>{language.t("ui.settings.language.ukrainianIndicator")} {ru ? 'Основной' : language.t("ui.settings.language.primary")}</small></span>{#if language.current === 'UA'}<CheckCircle2 size={20}/>{/if}</button>
          <button type="button" class:active={language.current === 'RU'} onclick={() => setLanguage('RU')}><span class="flag">🇷🇺</span><span><strong>{language.t("ui.settings.language.russianName")}</strong><small>{language.t("ui.settings.language.russianCode")}</small></span>{#if language.current === 'RU'}<CheckCircle2 size={20}/>{/if}</button>
        </div>
      </section>
      <section class="panel">
        <div class="panel-heading"><span class="circle"><Monitor size={21}/></span><div><h2>{ru ? 'Оформление' : language.t("ui.settings.appearance.title")}</h2><p>{ru ? 'Тема обновляется сразу и сохраняется в браузере' : language.t("ui.settings.appearance.description")}</p></div></div>
        <div class="options two">
          <button type="button" class:active={theme.current === 'light'} onclick={() => setTheme('light')}><span class="theme-preview light"><Sun size={23}/></span><span><strong>{ru ? 'Светлая' : language.t("ui.shared.themes.light")}</strong><small>{ru ? 'Светлый интерфейс' : language.t("ui.settings.appearance.lightDescription")}</small></span>{#if theme.current === 'light'}<CheckCircle2 size={20}/>{/if}</button>
          <button type="button" class:active={theme.current === 'dark'} onclick={() => setTheme('dark')}><span class="theme-preview dark"><Moon size={23}/></span><span><strong>{ru ? 'Тёмная' : language.t("ui.shared.themes.dark")}</strong><small>{ru ? 'Тёмный интерфейс' : language.t("ui.settings.appearance.darkDescription")}</small></span>{#if theme.current === 'dark'}<CheckCircle2 size={20}/>{/if}</button>
        </div>
      </section>
      <section class="panel">
        <div class="panel-heading"><span class="circle"><FolderArchive size={21}/></span><div><h2>{ru ? 'Резервная копия' : language.t("ui.settings.backup.title")}</h2><p>{ru ? 'Сохраните локальные данные проекта отдельным файлом' : language.t("ui.settings.backup.description")}</p></div></div>
        <div class="backup-row"><div class="backup-info"><ShieldCheck size={20}/><span>{ru ? 'Экспорт без паролей и токенов' : language.t("ui.settings.backup.safeExportHint")}</span></div><button type="button" class="download" onclick={exportData}><Download size={18}/>{ru ? 'Скачать JSON' : language.t("ui.shared.actions.downloadJson")}</button></div>
        <p class="caption">{ru ? 'Файл содержит локальные записи клиентов, администраторов, карт, программ и отчётов. Он не загружается на сервер автоматически.' : language.t("ui.settings.backup.contentsHint")}</p>
      </section>
      {#if feedback}<p class="feedback" role="status"><CheckCircle2 size={17}/>{language.translate(feedback)}</p>{/if}
    </div>
    <aside class="right-col">
      <section class="panel stats-panel"><div class="panel-heading"><span class="circle"><Database size={21}/></span><div><h2>{ru ? 'Локальные данные' : language.t("ui.shared.mode.localData")}</h2><p>{ru ? 'В этом браузере' : language.t("ui.settings.summary.browserOnly")}</p></div></div><div class="stat-list"><div><Users size={19}/><span>{ru ? 'Клиенты' : language.t("ui.shared.titles.clients")}</span><strong>{clientCount}</strong></div><div><ShieldCheck size={19}/><span>{ru ? 'Администраторы' : language.t("ui.admin.title")}</span><strong>{adminCount}</strong></div><div><CreditCard size={19}/><span>{ru ? 'Карты' : language.t("ui.cards.title")}</span><strong>{cardsCount}</strong></div><div><Wrench size={19}/><span>{ru ? 'Программы' : language.t("ui.shared.titles.programs")}</span><strong>{programCount}</strong></div></div><button type="button" class="refresh" onclick={refreshCounts}>{ru ? 'Обновить показатели' : language.t("ui.settings.actions.refreshCounts")}</button></section>
      <section class="panel info-panel"><Info size={22}/><h3>{ru ? 'О режиме разработки' : language.t("ui.settings.devMode.title")}</h3><p>{ru ? 'Это автономная версия интерфейса. Данные хранятся в браузере текущего устройства. Для общей базы и безопасной авторизации нужен Go backend.' : language.t("ui.settings.devMode.description")}</p><span class="version">{language.t("ui.settings.brand.workspace")}</span></section>
    </aside>
  </div>
</div>

<style>
.settings-page{width:min(1330px,100%);margin:0 auto;padding:14px 4px 50px;color:var(--text-main,#f8fafc)}.hero{display:flex;align-items:center;gap:22px;padding:28px 32px;border-radius:24px;background:linear-gradient(120deg,#183e80,#285b9d);color:#fff;box-shadow:0 14px 32px #08132724;margin-bottom:22px;position:relative;overflow:hidden}.hero:after{content:'';position:absolute;width:280px;height:280px;border:1px solid #ffffff28;border-radius:50%;right:-90px;top:-165px}.hero-mark{background:#ffffff20;border-radius:18px;padding:17px;display:grid;place-items:center}.hero-copy{flex:1;z-index:1}.hero h1{font-size:clamp(23px,2.3vw,32px);margin:4px 0 8px}.hero p{margin:0;color:#dceafd;font-size:14px}.eyebrow{font-size:10px;letter-spacing:.19em;color:#b7d7ff;font-weight:800}.mode{display:flex;align-items:center;gap:8px;border-radius:30px;border:1px solid #ffffff40;background:#ffffff21;padding:9px 12px;font-size:12px;z-index:1;white-space:nowrap}.settings-grid{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(245px,1fr);gap:20px}.left-col,.right-col{display:grid;gap:20px;align-content:start}.panel{background:var(--bg-card,#1e293b);border:1px solid var(--border-color,#334155);border-radius:20px;padding:25px;box-shadow:0 8px 26px #06122210}.panel-heading{display:flex;gap:13px;align-items:center;margin-bottom:23px}.panel-heading h2{font-size:18px;margin:0 0 5px}.panel-heading p{font-size:12px;color:var(--text-muted);margin:0}.circle{background:#38bdf819;color:#0ea5e9;border-radius:12px;width:43px;height:43px;display:grid;place-items:center;flex-shrink:0}.options{display:grid;gap:12px}.options.two{grid-template-columns:1fr 1fr}.options button{border:1px solid var(--border-color,#334155);background:var(--bg-input,#0f172a);border-radius:13px;padding:14px;display:flex;align-items:center;gap:12px;text-align:left;color:var(--text-main,#e2e8f0);cursor:pointer;min-width:0}.options button.active{border-color:#2ea8ed;background:#38bdf812;box-shadow:0 0 0 1px #38bdf839}.options button>span:nth-child(2){flex:1;min-width:0}.options button strong,.options button small{display:block}.options button strong{font-size:14px}.options button small{color:var(--text-muted);font-size:11px;margin-top:4px}.options button>svg{color:#0ea5e9;flex-shrink:0}.flag{font-size:27px}.theme-preview{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;flex-shrink:0}.theme-preview.light{background:#f1f5f9;color:#d97706}.theme-preview.dark{background:#0f172a;color:#b6c8fb}.backup-row{display:flex;align-items:center;justify-content:space-between;gap:14px}.backup-info{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text-muted)}.backup-info svg{color:#10b981}.download{display:flex;align-items:center;gap:8px;padding:12px 15px;border:0;border-radius:11px;color:white;background:#2563a2;font-weight:700;cursor:pointer;white-space:nowrap}.download:hover{filter:brightness(1.1)}.caption{margin:18px 0 0;color:var(--text-muted);font-size:12px;line-height:1.65}.stat-list{display:grid;gap:10px}.stat-list>div{display:flex;align-items:center;gap:12px;background:var(--bg-input);padding:13px;border-radius:12px}.stat-list svg{color:#38bdf8}.stat-list span{flex:1;font-size:13px;color:var(--text-muted)}.stat-list strong{font-size:17px}.refresh{margin-top:16px;border:1px solid var(--border-color);background:transparent;padding:10px 13px;border-radius:10px;width:100%;color:var(--text-main);cursor:pointer}.refresh:hover{border-color:#38bdf8}.info-panel>svg{color:#38bdf8}.info-panel h3{font-size:18px;margin:12px 0 10px}.info-panel p{color:var(--text-muted);font-size:13px;line-height:1.7;margin:0}.version{display:block;margin-top:20px;padding-top:14px;border-top:1px solid var(--border-color);font-size:11px;color:var(--text-muted)}.feedback{display:flex;gap:9px;align-items:center;color:#059669;font-size:13px;padding:0 8px}.feedback svg{flex-shrink:0}@media(max-width:960px){.settings-grid{grid-template-columns:1fr}.mode{display:none}}@media(max-width:550px){.hero{padding:22px;gap:13px}.hero-mark{padding:12px}.panel{padding:18px}.options.two{grid-template-columns:1fr}.backup-row{align-items:start;flex-direction:column}}

  .settings-page { box-sizing: border-box; }
  @media(max-width:430px) { .hero { padding: 18px; flex-wrap: wrap; } .panel-heading { align-items: flex-start; } .panel-heading h2 { overflow-wrap: anywhere; } .hero-copy { min-width: 0; } }
</style>
