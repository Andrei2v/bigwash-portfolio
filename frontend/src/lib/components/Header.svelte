<script>
  import { onMount } from "svelte";
  import { theme } from "$lib/components/theme.svelte.js";
  import { language } from '$lib/localisation/language.svelte.js';

  let { title = "Операції", compact = false } = $props();

  let currentLang = $derived(language.current); 
  let showDropdown = $state(false);
  let showNotifications = $state(false);
  let notifications = $state([
    {id:1,ua:'Ласкаво просимо до BigWash!',ru:'Добро пожаловать в BigWash!',read:false},
    {id:2,ua:'Локальний режим: дані зберігаються у браузері.',ru:'Локальный режим: данные сохраняются в браузере.',read:false}
  ]);
  const unread = $derived(notifications.filter(n=>!n.read).length);
  function persistRead() {if(typeof localStorage!=='undefined')localStorage.setItem('bigwash.notifications.read',JSON.stringify(notifications.filter(n=>n.read).map(n=>n.id)));}
  function readNotification(id) {notifications=notifications.map(n=>n.id===id?{...n,read:true}:n);persistRead();}
  function markAllRead(){notifications=notifications.map(n=>({...n,read:true}));persistRead();}


  const setLang = (lang) => {
    language.set(lang);
    showDropdown = false;
  };

  function closeDropdown(event) {
    if (showDropdown && !event.target.closest('.lang-dropdown-container')) {
      showDropdown = false;
    }
    if (showNotifications && !event.target.closest('.notif-container')) showNotifications = false;
  }

  onMount(() => {
    theme.apply();
    try {const seen=JSON.parse(localStorage.getItem('bigwash.notifications.read')||'[]');notifications=notifications.map(n=>({...n,read:seen.includes(n.id)}));}catch{}
  });
</script>

<svelte:window onclick={closeDropdown} onkeydown={event => { if (event.key === 'Escape') { showDropdown = false; showNotifications = false; } }} />

<div class="header" class:compact>
  <div class="nav-island">
    <div class="home-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>
    <span class="root-text">{currentLang === 'UA' ? language.t("ui.header.breadcrumb.home") : 'Главная'}</span>
    <span class="separator">/</span>
    <span class="current-page">{language.translate(title)}</span>
  </div>

  <div class="user-actions">
    <button class="btn-theme-toggle" onclick={() => theme.toggle()} title={language.translate('Змінити тему')}>
      {#if theme.current === 'dark'}
        <span class="theme-icon">☀️</span>
      {:else}
        <span class="theme-icon">🌙</span>
      {/if}
    </button>

    <div class="lang-dropdown-container">
      <button class="lang-trigger-btn" onclick={() => showDropdown = !showDropdown}>
        <span>{currentLang}</span>
        <span class="arrow-indicator" class:open={showDropdown}>▼</span>
      </button>

      {#if showDropdown}
        <div class="lang-dropdown-menu">
          <button class="dropdown-item" class:active={currentLang === 'UA'} onclick={() => setLang('UA')}>
            {language.t("ui.header.language.ukrainianOption")}
          </button>
          <button class="dropdown-item" class:active={currentLang === 'RU'} onclick={() => setLang('RU')}>
            {language.t("ui.header.language.russianOption")}
          </button>
        </div>
      {/if}
    </div>

    <div class="notif-container">
      <button type="button" class="notif-badge notif-button" onclick={() => showNotifications=!showNotifications} aria-expanded={showNotifications} aria-label={language.plural('header.notificationCount', unread)}>
        <span class="notif-icon">🔔</span>
        <span class="notif-count">{language.plural('header.notificationCount', unread)}</span>
        <span class="notif-compact-count" aria-hidden="true">{unread}</span>
      </button>
      {#if showNotifications}
        <div class="notif-menu" role="region" aria-label={language.translate('Повідомлення')}>
          <div class="notif-menu-heading"><strong>{currentLang==='UA'?language.t("ui.header.notifications.title"):'Уведомления'}</strong><button onclick={markAllRead}>{currentLang==='UA'?language.t("ui.header.notifications.markAllRead"):'Прочитать все'}</button></div>
          {#each notifications as notif (notif.id)}
            <button type="button" class="notif-entry" class:read={notif.read} onclick={() => readNotification(notif.id)}>
              <span>{currentLang==='UA'?notif.ua:notif.ru}</span><small>{notif.read?'✓':'●'}</small>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div class="user-profile">
      <div class="user-info">
        <span class="user-name">{language.t("ui.header.profile.displayName")}</span>
        <span class="user-role">{language.translate('Сервіс')}</span>
      </div>
      <div class="user-avatar">
        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=ffb23f&radius=50" alt={language.t('ui.header.profile.avatarAlt')} />
      </div>
    </div>
  </div>
</div>

<style>
  .notif-compact-count { display: none; }
  @media(max-width:600px) {
    .header.compact { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); padding: 10px 12px; gap: 8px; }
    .compact .nav-island { margin-left: 52px; padding: 8px 10px; font-size: 12px; gap: 7px; min-height: 36px; border-radius: 8px; }
    .compact .user-actions { width: 100%; flex-wrap: nowrap; gap: 6px; }
    .compact .btn-theme-toggle { width: 36px; height: 36px; }
    .compact .lang-trigger-btn { height: 36px; padding: 6px 10px; gap: 6px; }
    .compact .notif-button { height: 36px; padding: 6px 10px; gap: 5px; }
    .compact .notif-count { display: none; }
    .compact .notif-compact-count { display: inline; }
    .compact .user-profile { flex: 1 1 0; min-width: 0; gap: 6px; justify-content: flex-end; }
    .compact .user-info { min-width: 0; }
    .compact .user-name { font-size: 12px; overflow-wrap: anywhere; }
    .compact .user-avatar { width: 28px; height: 28px; flex-shrink: 0; }
    .compact .user-role { font-size: 11px; }
    .compact .lang-dropdown-menu { left: 0; right: auto; }
    .compact .notif-container { position: static; }
    .header.compact .notif-menu { position: absolute; top: calc(100% + 4px); left: 12px; right: 12px; width: auto; box-sizing: border-box; max-height: min(380px, 65dvh); overflow-y: auto; }
  }
  .notif-container {position:relative;}
  .notif-button {border:0;cursor:pointer;font:inherit;}
  .notif-menu {position:absolute;right:0;top:calc(100% + 8px);z-index:300;width:min(340px,85vw);background:var(--header-bg,#fff);color:var(--text-main,#1e293b);border:1px solid var(--header-border,#ddd);box-shadow:0 14px 35px #0002;border-radius:12px;padding:12px;}
  .notif-menu-heading {display:flex;justify-content:space-between;gap:12px;align-items:center;padding-bottom:8px;}
  .notif-menu-heading button {border:0;background:transparent;color:#0f766e;cursor:pointer;font-size:12px;}
  .notif-entry {width:100%;display:flex;justify-content:space-between;text-align:left;gap:10px;padding:12px 8px;border:0;border-radius:8px;background:transparent;color:inherit;cursor:pointer;}
  .notif-entry:not(.read) {background:#0d94881a;font-weight:600;}
  .notif-entry:hover {background:#0d94882a;}

  :global(html) {
    --header-bg: #ffffff;
    --header-border: #f1f5f9;
    --text-main: #1e293b;
    --text-muted: #94a3b8;
    --shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  }

  :global(html.dark) {
    --header-bg: #1e293b;
    --header-border: #334155;
    --text-main: #f8fafc;
    --text-muted: #64748b;
    --shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .header {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    width: 100%;
    box-sizing: border-box;
    transition: background-color 0.3s;
  }

  .nav-island {
    display: flex;
    flex-wrap: wrap;
    max-width: 100%;
    box-sizing: border-box;
    align-items: center;
    background: var(--header-bg);
    border: 1px solid var(--header-border);
    padding: 8px 16px;
    border-radius: 10px;
    box-shadow: var(--shadow);
    gap: 10px;
    font-size: 14px;
    transition: all 0.3s;
  }

  .root-text { color: var(--text-muted); }
  .separator { color: #cbd5e1; }
  .current-page { color: var(--text-main); font-weight: 600; }

  .btn-theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--header-bg);
    border: 1px solid var(--header-border);
    border-radius: 10px;
    box-shadow: var(--shadow);
    cursor: pointer;
    height: 38px;
    width: 38px;
    box-sizing: border-box;
    transition: all 0.3s ease;
  }

  .btn-theme-toggle:hover {
    background: var(--header-border);
    transform: scale(1.05);
  }

  .theme-icon {
    font-size: 16px;
  }

  .lang-dropdown-container {
    position: relative;
    display: inline-block;
  }

  .lang-trigger-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--header-bg);
    border: 1px solid var(--header-border);
    padding: 8px 14px;
    border-radius: 10px;
    box-shadow: var(--shadow);
    font-size: 13px;
    font-weight: 700;
    color: var(--text-main);
    cursor: pointer;
    transition: all 0.3s ease;
    height: 38px;
    box-sizing: border-box;
  }

  .lang-trigger-btn:hover {
    background: var(--header-border);
  }

  .arrow-indicator {
    font-size: 9px;
    color: var(--text-muted);
    transition: transform 0.15s ease;
  }

  .arrow-indicator.open {
    transform: rotate(180deg);
  }

  .lang-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: var(--header-bg);
    border: 1px solid var(--header-border);
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
    padding: 6px;
    min-width: 140px;
    z-index: 999;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dropdown-item {
    background: transparent;
    border: none;
    text-align: left;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--text-main);
    cursor: pointer;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.15s ease;
    white-space: nowrap;
    width: 100%;
    opacity: 0.8;
  }

  .dropdown-item:hover {
    background: var(--header-border);
    opacity: 1;
  }

  .dropdown-item.active {
    background: #e0f2fe;
    color: #0369a1;
    font-weight: 600;
    opacity: 1;
  }
  
  :global(html.dark) .dropdown-item.active {
    background: #0369a1;
    color: #f8fafc;
  }

  .notif-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fee2e2;
    color: #ef4444;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    height: 38px;
    box-sizing: border-box;
  }
  
  :global(html.dark) .notif-badge {
    background: #7f1d1d;
    color: #fca5a5;
  }

  .user-actions {
    display: flex;
    flex-wrap: wrap;
    min-width: 0;
    max-width: 100%;
    align-items: center;
    gap: 16px;
  }

  .user-actions > * { flex-shrink: 0; }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.2;
  }

  .user-name { 
    font-size: 14px; 
    font-weight: 700; 
    color: var(--text-main); 
  }

  .user-role {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: lowercase;
  }

  .user-avatar { 
    width: 34px; 
    height: 34px; 
    background: #ffb23f; 
    border-radius: 50%; 
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid #f97316;
  }

  .user-avatar img { 
    width: 80%; 
    height: 80%;
    display: block;
    object-fit: contain;
  }
</style>
