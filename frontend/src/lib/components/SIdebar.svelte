<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth.svelte.js'; 
  import { language } from '$lib/localisation/language.svelte.js';

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Статистика', path: '/' },
    { id: 'cards', icon: '💳', label: 'Картки', path: '/cards' },
    { id: 'clients', icon: '👥', label: 'Клієнти', path: '/clients' },
    { id: 'operations', icon: '🔄', label: 'Операції', path: '/operations' },
    { id: 'admins', icon: '👤', label: 'Адміністратори', path: '/admin' },
    { id: 'remotes', icon: '🎮', label: 'Пульти', path: '/pult' },
    { id: 'discounts', icon: '🏷️', label: 'Знижки', path: '/discounts' },
    { id: 'programs', icon: '📱', label: 'Програми', path: '/programs' },
    { id: 'service', icon: '🛠️', label: 'Сервіс', path: '/service' }
  ];

  const secondaryItems = [
    { id: 'bug', icon: '🐛', label: 'Звіт про помилку', path: '/bug-report' },
    { id: 'settings', icon: '⚙️', label: 'Налаштування', path: '/settings' }
  ];

  let isMobileMenuOpen = $state(false);

  function toggleMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function closeMenu() {
    isMobileMenuOpen = false;
  }

  function handleLogout() {
    auth.logout();
    goto('/login');
  }

  let currentPath = $derived($page.url.pathname);

  $effect(() => {
    if (currentPath) {
      isMobileMenuOpen = false;
    }
  });

  function isItemActive(itemPath) {
    const normalizedCurrent = currentPath === '/' ? '/' : currentPath.replace(/\/$/, '');
    const normalizedItem = itemPath === '/' ? '/' : itemPath.replace(/\/$/, '');

    if (normalizedItem === '/') {
      return normalizedCurrent === '/' || normalizedCurrent === '/dashboard';
    }
    
    return normalizedCurrent.startsWith(normalizedItem);
  }
</script>

<button class="mobile-toggle" onclick={toggleMenu} aria-label={language.t('ui.sidebar.openMenu')}>
  {#if isMobileMenuOpen}
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  {:else}
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  {/if}
</button>

{#if isMobileMenuOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="mobile-backdrop" onclick={closeMenu}></div>
{/if}

<div class="sidebar" class:open={isMobileMenuOpen}>
  <div class="logo">
    <div class="logo-icon">🚗</div>
    <span>{language.t("ui.shared.brand.washName")}</span>
  </div>

  <div class="menu-group">
    {#each menuItems as item}
      <a 
        href={item.path} 
        class="menu-item" 
        class:active={isItemActive(item.path)}
      >
        <span class="menu-item-icon">{item.icon}</span>
        <span>{language.translate(item.label)}</span>
      </a>
    {/each}
  </div>

  <div class="menu-divider"></div>

  <div class="menu-group">
    {#each secondaryItems as item}
      <a 
        href={item.path} 
        class="menu-item"
        class:active={isItemActive(item.path)}
      >
        <span class="menu-item-icon">{item.icon}</span>
        <span>{language.translate(item.label)}</span>
      </a>
    {/each}

    <button class="menu-item logout-btn" onclick={handleLogout}>
      <span class="menu-item-icon">🚪</span>
      <span>{language.t('sidebar.logout')}</span>
    </button>
  </div>
</div>

<style>
  .mobile-toggle {
    display: none;
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 10001;
    background: white;
    color: #1e293b;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    width: 44px;
    height: 44px;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: background 0.3s ease;
  }

  .mobile-backdrop {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    z-index: 9998;
  }

  .sidebar {
    width: 260px;
    background: linear-gradient(180deg, #fef3c7 0%, #fffdf3 45%, #ffffff 100%);
    padding: 20px;
    position: fixed;
    height: 100vh;
    left: 0;
    top: 0;
    overflow-y: auto;
    scrollbar-width: none;
    z-index: 9999;
    transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease;
  }

  .sidebar::-webkit-scrollbar {
    display: none;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 10px 30px;
    font-size: 18px;
    font-weight: bold;
    color: #92400e;
    transition: color 0.3s ease;
  }

  .logo-icon {
    width: 36px;
    height: 36px;
    background: #fb923c;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    margin-bottom: 6px;
    color: #78350f;
    text-decoration: none;
    border-radius: 12px;
    transition: all 0.3s;
    cursor: pointer;
    font-size: 14px;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
    box-sizing: border-box;
  }

  .menu-item:hover {
    background: rgba(251, 146, 60, 0.2);
  }

  .menu-item.active {
    background: #ffffff !important;
    color: #000000 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
    font-weight: 600;
  }

  .menu-item-icon {
    font-size: 18px;
    width: 24px;
    display: flex;
    justify-content: center;
  }

  .menu-divider {
    height: 1px;
    background: rgba(120, 53, 15, 0.15);
    margin: 20px 10px;
    transition: background 0.3s ease;
  }

  .logout-btn {
    margin-top: 10px;
    color: #b91c1c;
    font-weight: 600;
  }
  
  .logout-btn:hover {
    background: rgba(185, 28, 28, 0.1);
  }


  :global(html.dark) .sidebar {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border-right: 1px solid #334155;
  }

  :global(html.dark) .logo {
    color: #f8fafc;
  }

  :global(html.dark) .menu-item {
    color: #cbd5e1;
  }

  :global(html.dark) .menu-item:hover {
    background: #334155;
    color: #f8fafc;
  }

  :global(html.dark) .menu-item.active {
    background: #0f172a !important;
    color: #7dd3fc !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    border: 1px solid #334155;
  }

  :global(html.dark) .menu-divider {
    background: #334155;
  }

  :global(html.dark) .logout-btn {
    color: #fca5a5;
  }

  :global(html.dark) .logo-icon { background: #0c4a6e; }
  
  :global(html.dark) .logout-btn:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  :global(html.dark) .mobile-toggle {
    background: #1e293b;
    color: #f8fafc;
    border-color: #334155;
  }

  @media (max-width: 1024px) {
    .mobile-toggle {
      display: flex;
    }

    .mobile-backdrop {
      display: block;
    }

    .sidebar {
      transform: translateX(-100%);
    }

    .sidebar.open {
      transform: translateX(0);
    }
  }
</style>
