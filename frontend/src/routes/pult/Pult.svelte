<script>
  import { horizontalScroll } from '$lib/actions/horizontal-scroll.js';
  const scrollLabels = $derived({ hint: language.t('review.scrollColumns'), previous: language.t('review.scrollPrevious'), next: language.t('review.scrollNext') });

    import { language } from '$lib/localisation/language.svelte.js';
    import { onMount } from 'svelte';
    import PultModal from '$lib/components/PultModal.svelte';
    import { LOCAL_MODE } from '$lib/api/client.js';
    import { validWashHours, initialPults, createDevConfig, pultDataDefaults, validPultData } from '$lib/dev-config.js';
    import { validLocation } from '$lib/location.js';
    import LocationPicker from '$lib/components/LocationPicker.svelte';

    const WASH_STORAGE_KEY = 'bigwash.wash.v1';
    let wash = $state({
        name: 'The real wash', address: 'Мийка філатова', cardId: '200',
        telegramChatId: 'DAW768AW765', deWash: true, theme: 'Світла', byTime: false
    });
    let washDraft = $state(null);
    let isWashModalOpen = $state(false);
    let washError = $state('');
    let washLoaded = $state(false);
    let washGeocoding = $state(false);

    onMount(() => {
        if (!LOCAL_MODE) return;
        try {
            const saved = localStorage.getItem(WASH_STORAGE_KEY);
            if (saved !== null) {
                const parsed = JSON.parse(saved);
                if (!parsed || !['name', 'address', 'cardId', 'telegramChatId'].every(key => typeof parsed[key] === 'string') ||
                    typeof parsed.deWash !== 'boolean' || typeof parsed.byTime !== 'boolean' ||
                    !['Світла', 'Темна'].includes(parsed.theme) ||
                    ((parsed.latitude != null || parsed.longitude != null) && !validLocation(parsed.latitude, parsed.longitude))) throw new Error('Invalid wash');
                wash = parsed;
            }
            washLoaded = true;
        } catch {
            washError = 'Не вдалося прочитати налаштування мийки. Показано початкові значення.';
        }
    });

    function openWashEdit() {
        washDraft = { timeFrom: '', timeTo: '', latitude: null, longitude: null, ...wash };
        if (LOCAL_MODE && !washLoaded) washError = 'review.configReadFailed';
        isWashModalOpen = true;
    }

    function closeWashModal() {
        isWashModalOpen = false;
        washDraft = null;
        washError = '';
        washGeocoding = false;
    }

    function saveWash() {
        if (!LOCAL_MODE) { washError = 'review.configUnavailable'; return; }
        if (!washLoaded) { washError = 'review.configReadFailed'; return; }
        if (!validWashHours(washDraft)) { washError = 'review.washTimeInvalid'; return; }
        if (washGeocoding) return;
        if ((washDraft.latitude != null || washDraft.longitude != null) && !validLocation(washDraft.latitude, washDraft.longitude)) {
            washError = 'review.locationInvalid'; return;
        }
        try {
            localStorage.setItem(WASH_STORAGE_KEY, JSON.stringify(washDraft));
            wash = { ...washDraft };
            closeWashModal();
        } catch {
            washError = 'Не вдалося зберегти налаштування у браузері. Спробуйте ще раз.';
        }
    }
    
   let pults = $state(structuredClone(initialPults));

    onMount(() => {
        if (!LOCAL_MODE) return;
        for (const pult of pults) {
            try {
                const saved = createDevConfig(`bigwash.local.v1.pultData.${pult.id}`, pultDataDefaults(pult), validPultData).load();
                applyPultData(pult.id, saved);
            } catch {
                // Keep unreadable records intact; the modal displays the storage error.
            }
        }
    });

    function applyPultData(id, value) {
        const pult = pults.find(item => item.id === id);
        if (!pult) return;
        pult.name = value.name;
        Object.assign(pult.settings, value.settings);
    }

    let isModalOpen = $state(false); 
    let selectedPultData = $state({}); 

    function openEdit(pult) {
        selectedPultData = pult; 
        isModalOpen = true;      
    }

    function closeModal() {
        isModalOpen = false;     
    }

    function openDelete(pult) {
        console.info('Pult deletion is not connected to Go API.');
        // Deletion is not implemented; retain this handler until the API is wired up.
    }

</script>

<div class="page-layout pult-layout">
    <div class="main-content">
        <div class="card table-container">
            <div class="card-header-simple">
                <h3>{language.t("ui.pult.title")}</h3>
            </div>
            <div class="pult-table-scroll" use:horizontalScroll={scrollLabels}>
            <table class="compact-table">
                <thead>
                    <tr>
                        <th>№</th>
                        <th>{language.t("ui.shared.fields.name")}</th>
                        <th>{language.t("ui.shared.fields.status")}</th>
                        <th>{language.t("ui.shared.columns.money")}</th>
                        <th>{language.t("ui.pult.columns.registrationDate")}</th>
                        <th>{language.t("ui.pult.columns.mode")}</th>
                        <th>{language.t("ui.shared.columns.action")}</th>
                    </tr>
                </thead>
                <tbody>
                    {#each pults as pult}
                        <tr>
                            <td>{pult.id}</td>
                            <td><strong>{pult.name}</strong></td>
                            <td><span class="badge red">{language.translate(pult.status)}</span></td>
                            <td>{pult.money}</td>
                            <td>{pult.date}</td>
                            <td><span class="badge orange">{language.translate(pult.mode)}</span></td>
                            <td class="actions">
                               <button class="action-btn edit" onclick={() => openEdit(pult)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                    </button>
                                   <button class="action-btn delete" onclick={() => openDelete(pult)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
            </div>
        </div>

        {#if isWashModalOpen && washDraft}
        <div class="wash-modal-overlay" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) closeWashModal(); }}>
                <div class="card edit-card" role="dialog" aria-modal="true" aria-labelledby="wash-modal-title" tabindex="-1">
                    <div class="card-header-row">
                        <h4 id="wash-modal-title">{language.t("ui.wash.modal.title")}</h4>
                        <button class="wash-modal-close" aria-label={language.t('ui.shared.actions.close')} onclick={closeWashModal}>✕</button>
                    </div>
                    {#if washError}<p class="wash-error" role="alert">{washError.startsWith('review.') ? language.t(washError) : language.translate(washError)}</p>{/if}
                    <p class="field-title">{language.t(LOCAL_MODE ? 'review.washTimeLocal' : 'review.configUnavailable')}</p>
                    
                    <div class="form-row">
                        <div class="field">
                            <label for="wash-name">{language.t("ui.shared.fields.firstName")}</label>
                            <input id="wash-name" type="text" bind:value={washDraft.name} />
                        </div>
                        <div class="field">
                            <label for="wash-address">{language.t("ui.wash.fields.address")}</label>
                            <input id="wash-address" type="text" bind:value={washDraft.address} />
                        </div>
                    </div>

                    {#if LOCAL_MODE && washLoaded}
                        <LocationPicker address={washDraft.address} latitude={washDraft.latitude} longitude={washDraft.longitude}
                            onchange={location => washDraft = { ...washDraft, ...location }} onbusy={busy => washGeocoding = busy} />
                    {/if}

                    <div class="divider">{language.t("ui.wash.themes.technical")}</div>
                    
                    <div class="form-row">
                        <div class="field flex-2">
                            <label for="wash-card-id">{language.t("ui.wash.fields.cardId")}</label>
                            <input id="wash-card-id" type="text" bind:value={washDraft.cardId} />
                        </div>
                        <div class="field flex-3">
                            <label for="wash-telegram">{language.t("ui.wash.fields.telegramChatId")}</label>
                            <input id="wash-telegram" type="text" bind:value={washDraft.telegramChatId} />
                        </div>
                        <div class="checkbox-field">
                            <input type="checkbox" id="wash-dewash" bind:checked={washDraft.deWash} />
                            <label for="wash-dewash">{language.t("ui.wash.fields.deWash")}</label>
                        </div>
                    </div>

                    <div class="divider">{language.t("ui.wash.fields.visualization")}</div>
                    
                    <div class="form-row">
                        <div class="field">
                            <label for="wash-theme">{language.t("ui.wash.fields.theme")}</label>
                            <select id="wash-theme" bind:value={washDraft.theme}><option value="Світла">{language.t("ui.shared.themes.light")}</option><option value="Темна">{language.t("ui.shared.themes.dark")}</option></select>
                        </div>
                        <div class="checkbox-field">
                            <input type="checkbox" id="wash-time" bind:checked={washDraft.byTime} />
                            <label for="wash-time">{language.t("ui.wash.fields.byTime")}</label>
                        </div>
                    </div>
                    {#if washDraft.byTime}
                    <div class="form-row">
                        <div class="field">
                            <label for="wash-time-from">{language.t('review.timeFrom')}</label>
                            <input id="wash-time-from" type="time" bind:value={washDraft.timeFrom} />
                        </div>
                        <div class="field">
                            <label for="wash-time-to">{language.t('review.timeTo')}</label>
                            <input id="wash-time-to" type="time" bind:value={washDraft.timeTo} />
                        </div>
                    </div>
                    {/if}

                    <div class="form-actions">
                        <button class="btn-primary" disabled={!LOCAL_MODE || !washLoaded || washGeocoding} onclick={saveWash}>{language.t("ui.shared.actions.save")}</button>
                        <button class="btn-link" onclick={closeWashModal}>{language.t("ui.shared.actions.cancel")}</button>
                    </div>
                </div>
        </div>
        {/if}
    </div>

    <aside class="side-panel">
        <button class="btn-side blue">{language.t("ui.pult.actions.add")} <span>+</span></button>
        <button class="btn-side orange" onclick={openWashEdit}>
            {language.t("ui.wash.actions.editWithIcon")}
        </button>

        <div class="mini-stat dark">
            <div class="stat-content">
                <span class="val">2</span>
                <span class="lab">{language.t("ui.pult.title")}</span>
            </div>
            <div class="stat-icon">🚗</div>
        </div>

        <div class="mini-stat dark">
            <div class="stat-content">
                <span class="val">1200</span>
                <span class="lab">{language.t("ui.pult.summary.moneyOnPults")}</span>
            </div>
            <div class="stat-icon">💰</div>
        </div>
    </aside>
</div>

<PultModal 
    isOpen={isModalOpen} 
    pultData={selectedPultData} 
    onDataSaved={applyPultData}
    close={closeModal} 
/>

<style>
    :global(:root) {
        --bg-page: #f4f7f6;
        --bg-card: #ffffff;
        --bg-input: #ffffff;
        --border-color: #e0e0e0;
        --border-light: #eee;
        --border-table-row: #f9f9f9;
        
        --text-main: #334155;
        --text-title: #1e293b;
        --text-muted: #999999;
        --text-light: #888888;
        
        --panel-bg: #0B0B0B;
        --panel-border: #000;
        --stat-bg: #233544;
        --stat-icon-bg: #56c1ff;
        
        --action-btn-color: #a0aec0;
        --action-btn-hover: #4a5568;
    }

    :global(html.dark) {
        --bg-page: #0f172a;
        --bg-card: #1e293b;
        --bg-input: #0f172a;
        --border-color: #334155;
        --border-light: #334155;
        --border-table-row: rgba(255, 255, 255, 0.03);
        
        --text-main: #f8fafc;
        --text-title: #f8fafc;
        --text-muted: #94a3b8;
        --text-light: #94a3b8;
        
        --panel-bg: #1e293b;
        --panel-border: #334155;
        --stat-bg: #111827;
        --stat-icon-bg: #38bdf8;
        
        --action-btn-color: #94a3b8;
        --action-btn-hover: #f8fafc;
    }

    .page-layout {
        display: grid;
        grid-template-columns: 1fr 260px;
        gap: 16px;
        width: 100%;
        max-width: 1600px;
    }

    .main-content { display: flex; flex-direction: column; gap: 16px; }

    .card {
        background: var(--bg-card);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        color: var(--text-main);
    }

    .compact-table { width: 100%; border-collapse: collapse; font-size: 13px; color: var(--text-main); }
    .compact-table th { text-align: left; color: var(--text-light); padding: 8px; border-bottom: 1px solid var(--border-light); }
    .compact-table td { padding: 10px 8px; border-bottom: 1px solid var(--border-table-row); }

    .wash-modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0, 0, 0, 0.55); display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
    .edit-card { padding: 12px; width: 100%; max-width: 680px; max-height: calc(100dvh - 40px); overflow-y: auto; box-sizing: border-box; }
    .wash-modal-close { border: none; background: transparent; color: var(--text-muted); cursor: pointer; padding: 6px; }
    .wash-error { color: #f87171; font-size: 13px; }
    .edit-card .field-title { color: var(--text-muted); font-size: 13px; line-height: 1.5; }
    @media (max-width: 600px) { .edit-card .form-row { flex-wrap: wrap; } .edit-card .field { min-width: 0; flex-basis: 100%; } }
    
    .card-header-row { display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center; }
    .card-header-row h4 { margin: 0; font-size: 14px; color: var(--text-title); }

    .form-row { display: flex; gap: 10px; margin-bottom: 8px; align-items: flex-end; }
    .field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .field label { font-size: 11px; color: var(--text-muted); }
    .field input, .field select { 
        padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;
        background: var(--bg-input); color: var(--text-main);
    }
    .field input:focus, .field select:focus {
        outline: none;
        border-color: #38bdf8;
    }
    .divider { font-size: 12px; font-weight: 600; color: var(--text-muted); margin: 12px 0 8px; border-bottom: 1px dotted var(--border-color); }

    .checkbox-field { display: flex; align-items: center; gap: 5px; font-size: 12px; padding-bottom: 8px; color: var(--text-main); }

    .form-actions { display: flex; gap: 12px; align-items: center; margin-top: 12px; }
    .btn-primary { background: #fb923c; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .btn-link { color: #f87171; background: none; border: none; font-size: 12px; cursor: pointer; }

    .side-panel {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        border-radius: 12px;
        border: 4px solid var(--panel-border);
        background: var(--panel-bg);
    }

    .btn-side { 
        padding: 14px;
        border-radius: 8px;
        border: none;
        color: #000;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .blue { background: #38bdf8; }
    .orange { background: #fb923c; }

    .mini-stat { 
        background: var(--stat-bg);
        color: white; 
        padding: 16px; 
        border-radius: 8px;
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        border-bottom: 1px solid var(--panel-border);
    }

    .stat-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .val {
        font-size: 20px;
        font-weight: 700;
        line-height: 1; 
        color: white;
    }

    .lab { font-size: 13px; color: #94a3b8; }

    .stat-icon { 
        width: 40px;
        height: 40px;
        background: var(--stat-icon-bg);
        color: #000;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        opacity: 1;
    }

    .badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; color: white; }
    .red { background: #ef4444; }
    .orange { background: #f59e0b; }

    .actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        align-items: center;
    }

    .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: var(--action-btn-color);
        transition: color 0.2s, transform 0.1s;
    }

    .action-btn:hover {
        color: var(--action-btn-hover);
        transform: scale(1.1);
    }

    .action-btn svg {
        display: block;
        width: 20px;
        height: 20px;
    }

    .action-btn:focus {
        outline: none;
    }

  .main-content, .side-panel { min-width: 0; }
  .table-container { min-width: 0; box-sizing: border-box; }
  .compact-table { min-width: 680px; }
  @media(max-width:600px) { .wash-modal-overlay { padding: 10px; } .edit-card { max-height: calc(100dvh - 20px); } }

  @media(min-width:768px) and (max-width:1100px) { .page-layout.pult-layout { grid-template-columns: minmax(0,1fr) 220px !important; gap: 16px !important; } }
</style>
