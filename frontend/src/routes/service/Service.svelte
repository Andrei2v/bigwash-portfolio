<script>
  import { language } from '$lib/localisation/language.svelte.js';
  import { onMount } from 'svelte';
  import { LOCAL_MODE } from '$lib/api/client.js';
  import { initialPults, initialPromo } from '$lib/dev-config.js';
  import { promo } from '$lib/stores/promo.svelte.js';
    let settings = $state({
        brsm: true,
        fiscalization: true,
        qrPay: true,
        kiosk: false
    });

    let selectedPayment = $state('LiqPay');
    let apiKey = $state('');
    let showKey = $state(false);
    let promoDraft = $state(structuredClone(initialPromo));
    let promoSaved = $state(structuredClone(initialPromo));
    let promoFeedback = $state(false);
    const promoDirty = $derived(JSON.stringify(promoDraft) !== JSON.stringify(promoSaved));
    onMount(() => {
        promo.load();
        promoDraft = structuredClone($state.snapshot(promo.config));
        promoSaved = structuredClone($state.snapshot(promo.config));
    });
    function savePromo() {
        promoFeedback = false;
        if (promo.save(promoDraft)) {
            promoSaved = structuredClone($state.snapshot(promo.config));
            promoFeedback = true;
        }
    }
</script>

<div class="page-wrapper">
    <div class="content-container">

        <div class="page-header">
            <h1>{language.t("ui.service.title")}</h1>
        </div>

        <div class="settings-grid">
            <div class="card modules-card">
                <div class="card-header">
                    <span class="card-icon">⚙️</span>
                    <h3>{language.t("ui.service.settingsTitle")}</h3>
                </div>
                
                <div class="toggles-list">
                    <label class="toggle-item">
                        <div class="toggle-info">
                            <span class="toggle-title">{language.t("ui.service.loyalty.brsm")}</span>
                            <span class="toggle-desc">{language.t("ui.service.loyalty.toggle")}</span>
                        </div>
                        <input type="checkbox" bind:checked={settings.brsm} />
                        <div class="slider"></div>
                    </label>

                    <label class="toggle-item">
                        <div class="toggle-info">
                            <span class="toggle-title">{language.t("ui.service.promo.title")}</span>
                            <span class="toggle-desc">{language.t("ui.service.promo.enable")}</span>
                        </div>
                        <input id="promo-enabled" type="checkbox" bind:checked={promoDraft.enabled} disabled={!promo.ready} />
                        <div class="slider"></div>
                    </label>

                    <div class="promo-settings">
                        <p>{language.t(LOCAL_MODE ? 'review.promoLocalHint' : 'review.configUnavailable')}</p>
                        <label for="promo-scope">{language.t('review.promoScope')}</label>
                        <select id="promo-scope" class="custom-select" bind:value={promoDraft.scope} disabled={!promo.ready}>
                            <option value="global">{language.t('review.promoGlobal')}</option>
                            <option value="individual">{language.t('review.promoIndividual')}</option>
                        </select>
                        {#if promoDraft.scope === 'individual'}
                            {#each initialPults as pult}
                                <label class="promo-target"><input type="checkbox" value={pult.id} bind:group={promoDraft.pultIds} disabled={!promo.ready}> {pult.name}</label>
                            {/each}
                        {/if}
                        {#if promo.error}<p role="alert">{language.t(`review.${promo.error}`)}</p>{/if}
                        {#if promoFeedback && !promoDirty}<p role="status">{language.t('review.configSaved')}</p>{/if}
                        <button class="save-btn-full" disabled={!promo.ready || !promoDirty} onclick={savePromo}>{language.t('review.configSave')}</button>
                        <button class="promo-cancel" disabled={!promoDirty} onclick={() => { promoDraft = structuredClone($state.snapshot(promoSaved)); promoFeedback = false; promo.clearError(); }}>{language.t('ui.shared.actions.cancel')}</button>
                    </div>

                    <label class="toggle-item">
                        <div class="toggle-info">
                            <span class="toggle-title">{language.t("ui.service.prro.skipFiscalization")}</span>
                            <span class="toggle-desc">{language.t("ui.service.prro.testOnlyHint")}</span>
                        </div>
                        <input type="checkbox" bind:checked={settings.fiscalization} />
                        <div class="slider"></div>
                    </label>

                    <div class="divider"></div>

                    <label class="toggle-item">
                        <div class="toggle-info">
                            <span class="toggle-title">{language.t("ui.service.payments.qrPay")}</span>
                            <span class="toggle-desc">{language.t("ui.service.payments.qrHint")}</span>
                        </div>
                        <input type="checkbox" bind:checked={settings.qrPay} />
                        <div class="slider"></div>
                    </label>

                    <label class="toggle-item">
                        <div class="toggle-info">
                            <span class="toggle-title">{language.t("ui.service.kiosk.title")}</span>
                            <span class="toggle-desc">{language.t("ui.service.kiosk.description")}</span>
                        </div>
                        <input type="checkbox" bind:checked={settings.kiosk} />
                        <div class="slider"></div>
                    </label>
                </div>
            </div>

            <div class="right-column">
                <div class="card payment-card">
                    <div class="card-header">
                        <span class="card-icon">💳</span>
                        <h3>{language.t("ui.service.payments.title")}</h3>
                    </div>
                    <p class="warning-text">{language.t("ui.service.pricing.secondWashOnly")}</p>
                    
                    <select class="custom-select" bind:value={selectedPayment}>
                        <option value="LiqPay">{language.t("ui.service.payments.liqPay")}</option>
                        <option value="Monobank">{language.t("ui.service.payments.monobank")}</option>
                        <option value="Stripe">{language.t("ui.service.payments.stripe")}</option>
                    </select>
                </div>

                <div class="card api-card">
                    <div class="card-header">
                        <span class="card-icon">🔑</span>
                        <h3>{language.t("ui.service.api.keyLabel")}</h3>
                    </div>
                    
                    <div class="api-input-group">
                        <input 
                            type={showKey ? "text" : "password"} 
                            value={apiKey} 
                            readonly 
                            class="api-input"
                        />
                        <button class="eye-toggle" onclick={() => showKey = !showKey}>
                            {showKey ? '👁️' : '🔒'}
                        </button>
                    </div>
                    
                    <button class="save-btn-full">{language.t("ui.service.actions.saveSettings")}</button>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
  :global(:root) {
      --bg-page: transparent;
      --bg-card: #ffffff;
      --bg-input: #f8fafc;
      --border-color: #e2e8f0;
      --border-table: #f1f5f9;
      
      --text-main: #1e293b;
      --text-muted: #94a3b8;
      
      --toggle-bg: #e2e8f0;
      --toggle-active: #10b981;
      --toggle-thumb: #ffffff;
      
      --btn-save-bg: #6366f1;
      --btn-save-hover: #4f46e5;
      --btn-save-text: #ffffff;
      
      --eye-bg: #ffffff;
      --eye-border: #e2e8f0;
      
      --hover-row: #f8fafc;
      --warning-color: #f59e0b;
      
      --shadow-card: rgba(0,0,0,0.03);
  }

  :global(html.dark) {
      --bg-page: transparent;
      --bg-card: #1e293b;
      --bg-input: #0f172a;
      --border-color: #334155;
      --border-table: #334155;
      
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      
      --toggle-bg: #334155;
      --toggle-active: #10b981;
      --toggle-thumb: #ffffff;
      
      --btn-save-bg: #6366f1;
      --btn-save-hover: #4f46e5;
      --btn-save-text: #ffffff;
      
      --eye-bg: #1e293b;
      --eye-border: #334155;
      
      --hover-row: rgba(255, 255, 255, 0.03);
      --warning-color: #fbbf24;
      
      --shadow-card: rgba(0,0,0,0.2);
  }

    .page-wrapper {
        display: flex;
        justify-content: center;
        width: 100%;
        min-height: 100vh;
        padding: 20px;
        box-sizing: border-box;
        background: var(--bg-page);
    }

    .content-container {
        width: 100%;
        max-width: 1200px;
    }

    .page-header { 
        background: var(--bg-card);
        border-radius: 24px;
        padding: 20px 24px;
        margin-bottom: 24px;
        box-shadow: 0 4px 20px var(--shadow-card);
        border: 1px solid var(--border-table);
    }
    h1 { font-size: 28px; font-weight: 800; color: var(--text-main); margin: 0; }

    .settings-grid { 
        display: grid; 
        grid-template-columns: 1fr 400px; 
        gap: 24px; 
    }

    .card {
        background: var(--bg-card); border-radius: 24px; padding: 24px;
        box-shadow: 0 4px 20px var(--shadow-card); border: 1px solid var(--border-table);
    }

    .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .card-icon { font-size: 20px; }
    .card-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text-main); }

    .right-column { display: flex; flex-direction: column; gap: 24px; }

    .toggles-list { display: flex; flex-direction: column; gap: 16px; }
    .toggle-item {
        display: flex; justify-content: space-between; align-items: center;
        padding: 12px; border-radius: 16px; transition: background 0.2s;
        cursor: pointer;
    }
    .toggle-item:hover { background: var(--hover-row); }

    .toggle-info { display: flex; flex-direction: column; }
    .toggle-title { font-weight: 700; font-size: 14px; color: var(--text-main); }
    .toggle-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

    input[type="checkbox"] { display: none; }
    .slider {
        width: 44px; height: 24px; background: var(--toggle-bg);
        border-radius: 20px; position: relative; transition: 0.3s;
    }
    .slider::after {
        content: ''; position: absolute; width: 18px; height: 18px;
        background: var(--toggle-thumb); border-radius: 50%; top: 3px; left: 3px;
        transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    input:checked + .slider { background: var(--toggle-active); }
    input:checked + .slider::after { left: 23px; }

    .divider { height: 1px; background: var(--border-table); margin: 8px 0; }
    .warning-text { font-size: 12px; color: var(--warning-color); margin-bottom: 12px; font-weight: 600; }
    
    .custom-select, .api-input {
        width: 100%; padding: 12px 16px; border-radius: 12px;
        border: 1px solid var(--border-color); background: var(--bg-input);
        font-size: 14px; font-weight: 600; outline: none;
        box-sizing: border-box; color: var(--text-main);
    }
    .custom-select:focus, .api-input:focus { border-color: #38bdf8; }

    .api-input-group { position: relative; display: flex; align-items: center; }
    .eye-toggle {
        position: absolute; right: 10px; background: var(--eye-bg); border: 1px solid var(--eye-border);
        border-radius: 8px; cursor: pointer; padding: 4px 8px; color: var(--text-main);
    }

    .save-btn-full {
        width: 100%; background: var(--btn-save-bg); color: var(--btn-save-text); border: none;
        padding: 14px; border-radius: 12px; font-weight: 700; margin-top: 20px;
        cursor: pointer; transition: all 0.2s;
    }
    .save-btn-full:hover { background: var(--btn-save-hover); transform: translateY(-2px); }
    .promo-settings { padding: 0 12px 16px; color: var(--text-main); }
    .promo-settings p { font-size: 12px; color: var(--text-muted); line-height: 1.5; }
    .promo-settings [role="alert"] { color: #ef4444; }
    .promo-target { display: flex; gap: 8px; align-items: center; margin-top: 12px; }
    .promo-cancel { margin-top: 10px; padding: 8px; background: transparent; border: 0; color: var(--text-main); cursor: pointer; }
    @media (max-width: 1100px) { .settings-grid { grid-template-columns: minmax(0, 1fr); } }

  .content-container, .settings-grid, .card { min-width: 0; box-sizing: border-box; }
  @media(max-width:600px) { .page-wrapper { padding: 0; } .card { padding: 16px; } .card-header { flex-wrap: wrap; gap: 8px; } }
</style>
