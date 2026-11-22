<script>
  import Sidebar from '$lib/components/SIdebar.svelte';
  import Header from '$lib/components/Header.svelte';
  import { page } from '$app/state'; 
  import '../app.css';
  import { DEMO_MODE } from '$lib/demo.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth.svelte.js';
  import { language } from '$lib/localisation/language.svelte.js';

  let { children } = $props();

  const titles = {
    '/dashboard': 'Статистика',
    '/cards': 'Картки',
    '/clients': 'Клієнти',
    '/admin': 'Адміністратори',
    '/operations': 'Операції',
    '/pult': 'Пульти', 
    '/discounts': 'Знижки',
    '/programs': 'Програми',
    '/service': 'Сервіс',
    '/settings': 'Налаштування',
    '/bug-report': 'Звіт про помилку'
  };
  
  let path = $derived(page.url.pathname.replace(/\/$/, '').trim() || '/');
  let currentTitle = $derived(titles[path] || 'Статистика');

  let isAuthPage = $derived(path === '/login' || path === '/register');

  onMount(() => { auth.init(); });
  $effect(() => { language.apply(); });
  $effect(() => {
    if (!isAuthPage && !auth.loading && !auth.isAuthenticated) {
      goto('/login', { replaceState: true });
    }
  });
</script>

<svelte:head>
  {#if path !== '/dashboard' && path !== '/'}
    <meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content" />
  {/if}
</svelte:head>

{#if isAuthPage}
    {@render children()}
{:else if auth.loading}
    <div role="status">{language.translate('Перевірка авторизації...')}</div>
{:else if auth.isAuthenticated}
    <Sidebar />
    <div class="main-content" class:responsive-layout={path !== '/dashboard' && path !== '/'}>
        <Header title={currentTitle} compact={path !== '/dashboard' && path !== '/'} />
        {#if DEMO_MODE}
          <div class="demo-banner" role="status">{language.t('ui.shared.demo.banner')}</div>
        {/if}
        <main class="page-body" class:responsive-page={path !== '/dashboard' && path !== '/'}>
            {@render children()}
        </main>
    </div>
{/if}

<style>
  :global(html), :global(body) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background-color: #f0f4f8;
    transition: background-color 0.3s ease;
  }

  :global(html.dark), :global(html.dark body) {
    background-color: #0f172a;
  }

  .demo-banner { background: #fff7db; color: #6e4700; border-bottom: 1px solid #f2d997; padding: 10px 24px; font-size: 13px; font-weight: 600; }

  .main-content {
    margin-left: 260px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .page-body {
    display: flex;
    flex-direction: column; 
    align-items: center; 
    padding: 16px 24px 24px 24px;
    width: 100%;
    box-sizing: border-box;
  }

  :global(.page-layout) {
    display: grid !important;
    grid-template-columns: 1fr 280px !important;
    gap: 24px !important;
    align-items: start !important;
    width: 100% !important;
    max-width: 1300px !important;
    margin: 0 auto !important;
    box-sizing: border-box !important;
  }

  @media (max-width: 1100px) {
    :global(.page-layout) {
      grid-template-columns: 1fr !important;
    }
  }

  .responsive-layout { min-width: 0; }
  :global(.responsive-page > *) { min-width: 0; max-width: 100%; }
  :global(.responsive-layout .responsive-page :is(.modal-overlay, .modal-backdrop, .wash-modal-overlay, .journal-backdrop)) { z-index: 11000; }
  :global(.responsive-page .table-scroll) { max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; }
  :global(.responsive-page .table-scroll table) { min-width: 650px; }
  :global(.responsive-page .horizontal-scroll) { min-width: 0; max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: thin; scrollbar-color: #64748b transparent; }
  :global(.responsive-page .horizontal-scroll::-webkit-scrollbar) { height: 7px; }
  :global(.responsive-page .horizontal-scroll::-webkit-scrollbar-thumb) { background: #64748b; border-radius: 8px; }
  :global(.responsive-page .horizontal-scroll:focus-visible) { outline: 2px solid #38bdf8; outline-offset: 2px; }
  :global(.responsive-page .scroll-cue) { display: flex; align-items: center; gap: 6px; padding: 8px 0 2px; color: var(--text-muted); font-size: 12px; line-height: 1.4; }
  :global(.responsive-page .scroll-cue[hidden]) { display: none; }
  :global(.responsive-page .scroll-cue > span) { flex: 1; min-width: 0; }
  :global(.responsive-page .scroll-cue > button) { flex: none; min-width: 36px; min-height: 36px; border: 1px solid var(--border-color, #64748b); border-radius: 8px; background: var(--bg-card); color: var(--text-main); font-size: 18px; cursor: pointer; }
  :global(.responsive-page .scroll-cue > button:disabled) { opacity: .35; cursor: default; }
  @media (max-width: 1024px) {
    .responsive-layout { margin-left: 0; }
    :global(.responsive-layout > .header) { padding-left: 68px; }
    .responsive-page { padding: 12px 16px 24px; }
  }
  @media (max-width: 600px) {
    .responsive-page { padding: 10px 12px 20px; }
    :global(.responsive-page input:not([type=checkbox]):not([type=radio])), :global(.responsive-page select), :global(.responsive-page textarea) { min-width: 0; max-width: 100%; box-sizing: border-box; font-size: 16px; }
  }
</style>
