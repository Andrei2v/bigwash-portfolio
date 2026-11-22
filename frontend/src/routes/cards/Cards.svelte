<script>
  import { horizontalScroll } from '$lib/actions/horizontal-scroll.js';
  const scrollLabels = $derived({ hint: language.t('review.scrollColumns'), previous: language.t('review.scrollPrevious'), next: language.t('review.scrollNext') });

    import { language } from '$lib/localisation/language.svelte.js';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import api, { LOCAL_MODE } from '$lib/api/client.js';
    import { validCardDiscount } from '$lib/review-validation.js';
    import { DEMO_MODE } from '$lib/demo.js';

    let showTopupJournal = $state(false);
    let topupJournal = $state([]);
    let searchUID = $state('');
    let searchClient = $state(''); 
    let clientSearchTerm = $state(''); 
    let showDropdown = $state(false); 
    let scanStatus = $state('Очікування картки...');
    let isModalOpen = $state(false);
    let modalMode = $state('edit'); 
    let selectedCard = $state({ id: null, uid: '', amount: 0, discount: 0, user_id: null, client: null });
    let cardError = $state('');
    let searchAmount = $state('');

    let cards = $state([]);
    let allClients = $state([]);

    let sortField = $state(''); 
    let sortDirection = $state('asc'); 

    let filteredCards = $derived((() => {
        let result = cards.filter(card => {
            const matchUID = card.uid.toLowerCase().includes(searchUID.toLowerCase());
            const clientName = card.client ? card.client.toLowerCase() : '';
            const matchClient = clientName.includes(searchClient.toLowerCase()) || searchClient === '';
            const matchAmount = card.amount.toString().includes(searchAmount);
            return matchUID && matchClient && matchAmount;
        });

        if (sortField) {
            result.sort((a, b) => {
                let valA = sortField === 'client' ? (a.client || '') : a[sortField];
                let valB = sortField === 'client' ? (b.client || '') : b[sortField];

                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();

                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    })());

    let filteredClientsForModal = $derived(
        allClients.filter(c => {
            const fullName = `${c.firstname || ''} ${c.lastname || ''}`.trim().toLowerCase();
            return fullName.includes(clientSearchTerm.toLowerCase());
        })
    );

    onMount(async () => {
        try { topupJournal = JSON.parse(localStorage.getItem('bigwash.card.topups') || '[]'); } catch { topupJournal=[]; }
        if (!DEMO_MODE && !localStorage.getItem('token')) {
            goto('/login');
            return;
        }
        await loadCards();
    });

    async function loadCards() {
        if (DEMO_MODE) {
            cards = [
                { id: 1, uid: 'DEMO-100001', amount: 450, client: 'Олена Коваль', user_id: 1, registered: '01.10.2026', lastUsed: '02.10.2026' },
                { id: 2, uid: 'DEMO-100002', amount: 1200, client: 'Максим Петренко', user_id: 2, registered: '02.10.2026', lastUsed: '02.10.2026' }
            ];
            allClients = [
                { id: 1, firstname: 'Олена', lastname: 'Коваль' },
                { id: 2, firstname: 'Максим', lastname: 'Петренко' }
            ];
            return;
        }
        try {
            const res = await api.get('/cards');
            
            cards = res.data.map(card => ({
                id: card.id,
                uid: card.uid,
                amount: card.amount || 0,
                discount: Number(card.discount ?? 0),
                client: card.user ? `${card.user.firstname || ''} ${card.user.lastname || ''}`.trim() : null,
                user_id: card.user ? card.user.id : null,
                registered: card.created_at ? new Date(card.created_at).toLocaleDateString('uk-UA') : new Date().toLocaleDateString('uk-UA'),
                lastUsed: card.last_used_at ? new Date(card.last_used_at).toLocaleDateString('uk-UA') : 'Щойно'
            }));

            const uniqueClients = [];
            res.data.forEach(c => {
                if (c.user && !uniqueClients.some(u => u.id === c.user.id)) {
                    uniqueClients.push(c.user);
                }
            });
            allClients = uniqueClients;
        } catch (err) {
            console.error("Помилка завантаження карток:", err?.response?.status ?? err?.name);
        }
    }

    function selectClient(clientObj) {
        selectedCard.user_id = clientObj.id;
        const fullName = `${clientObj.firstname || ''} ${clientObj.lastname || ''}`.trim();
        selectedCard.client = fullName;
        clientSearchTerm = fullName;
        showDropdown = false;
    }

    function openEdit(card) {
        cardError = '';
        selectedCard = { ...card, discount: Number(card.discount ?? 0) };
        clientSearchTerm = card.client ?? '';
        modalMode = 'edit';
        isModalOpen = true;
    }

    function openAddModal() {
        modalMode = 'create';
        resetModalFields(); 
        isModalOpen = true;
    }

    function openScanModal() {
        modalMode = 'scan';
        resetModalFields();
        scanStatus = 'Очікування картки...';
        isModalOpen = true;
    }

    function closeModal() {
        isModalOpen = false;
        resetModalFields();
    }

    function resetModalFields() {
        cardError = '';
        selectedCard = { id: null, uid: '', amount: 0, discount: 0, user_id: null, client: null };
        clientSearchTerm = '';
        showDropdown = false;
    }

    function identifyCard() {
        selectedCard.uid = "Зчитування...";
        setTimeout(() => {
            selectedCard.uid = Math.random().toString(16).slice(2, 12).toUpperCase();
            if (modalMode === 'scan') scanStatus = 'Картку розпізнано успішно';
        }, 800);
    }

    async function saveNewCard() {
        if (DEMO_MODE) { alert(language.t("ui.shared.demo.saveDisabled")); return; }
        if (!selectedCard.uid || selectedCard.uid === "Зчитування...") return;
        cardError = '';
        if (!validCardDiscount(selectedCard.discount)) {
            cardError = 'cardDiscountInvalid';
            return;
        }
        
        try {
            let topup = 0;
            if (modalMode === 'edit') {
                const original = cards.find(c => c.id === selectedCard.id);
                const oldAmount = Number(original?.amount || 0);
                const newAmount = Number(selectedCard.amount || 0);
                topup = newAmount > oldAmount ? newAmount - oldAmount : 0;
                await api.put(`/cards/${selectedCard.id}`, {
                    uid: selectedCard.uid,
                    user_id: selectedCard.user_id || null,
                    discount: selectedCard.discount,
                    ...(LOCAL_MODE ? { amount: newAmount } : {})
                });
            } else {
                topup = Number(selectedCard.amount || 0);
                await api.post('/cards', {
                    uid: selectedCard.uid,
                    user_id: selectedCard.user_id || null,
                    amount: selectedCard.amount || 0,
                    discount: selectedCard.discount
                });
            }
            if (LOCAL_MODE && topup > 0) {
                topupJournal = [{date:new Date().toLocaleString('uk-UA'),uid:selectedCard.uid,amount:topup.toFixed(2)},...topupJournal];
                localStorage.setItem('bigwash.card.topups',JSON.stringify(topupJournal));
            }
            await loadCards(); 
            closeModal();
        } catch (err) {
            console.error("Помилка збереження картки:", err?.response?.status ?? err?.name);
            alert(language.t("ui.cards.errors.saveFailed"));
        }
    }

    function handleSort(field) {
        if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortDirection = 'asc';
        }
    }

    async function deleteCard(id) {
        if (DEMO_MODE) { alert(language.t("ui.cards.demo.deleteDisabled")); return; }
        if (!confirm(language.t("ui.cards.confirm.delete"))) return;
        try {
            await api.delete(`/cards/${id}`);
            cards = cards.filter(c => c.id !== id);
        } catch (err) {
            console.error("Помилка видалення:", err?.response?.status ?? err?.name);
            alert(language.t("ui.cards.errors.deleteFailed"));
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
    }

    function handleBlur() {
        setTimeout(() => {
            showDropdown = false;
        }, 200);
    }
</script>

<div class="page-layout cards-layout">
    
    <div class="content">
        <div class="table-card">
            <div class="table-header">
                <h2>{language.t("ui.cards.title")}</h2>
            </div>
            
            <div class="scroll-area" use:horizontalScroll={scrollLabels}>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 50px;">№</th>
                            <th onclick={() => handleSort('uid')} style="cursor: pointer; user-select: none; width: 180px;">
                                {language.t("ui.cards.columns.uid")} {sortField === 'uid' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onclick={() => handleSort('amount')} style="cursor: pointer; user-select: none; width: 140px;">
                                {language.t("ui.shared.columns.money")} {sortField === 'amount' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onclick={() => handleSort('client')} style="cursor: pointer; user-select: none;">
                                {language.t("ui.shared.columns.client")} {sortField === 'client' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th style="width: 140px;">{language.t("ui.shared.columns.registered")}</th>
                            <th style="width: 140px;">{language.t("ui.cards.columns.activity")}</th>
                            <th class="text-right" style="width: 80px;">{language.t("ui.shared.columns.action")}</th>
                        </tr>
                        <tr class="filter-row">
                            <td></td>
                            <td>
                                <input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={searchUID}>
                            </td>
                            <td>
                                <input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={searchAmount}>
                            </td> 
                            <td>
                                <input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={searchClient}>
                            </td>
                            <td></td> 
                            <td></td> 
                            <td></td>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredCards as card, i}
                            <tr>
                                <td>{i + 1}</td>
                                <td>
                                    <div class="uid-cell">
                                        <button class="copy-link-btn" onclick={() => copyToClipboard(card.uid)}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                            </svg>
                                        </button>
                                        <span class="uid-text">{card.uid}</span>
                                    </div>
                                </td>
                                <td class="money-text">
                                    ₴ {card.amount.toLocaleString(language.locale, { minimumFractionDigits: 2 })}
                                </td>
                                <td>
                                    {#if card.client} 
                                        <span class="client-name">{card.client}</span>
                                    {:else} 
                                        <span class="badge-red">{language.t("ui.cards.states.notSet")}</span>
                                    {/if}
                                </td>
                                <td class="date-cell">{card.registered}</td>
                                <td class="date-cell">{language.translate(card.lastUsed)}</td>
                                <td class="text-right">
                                    <div class="actions-container">
                                        <button class="icon-btn edit" onclick={() => openEdit(card)} title={language.t('ui.shared.actions.edit')}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                            </svg>
                                        </button>
                                        <button class="icon-btn delete" onclick={() => deleteCard(card.id)} title={language.t('ui.shared.actions.delete')}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="3 6 5 6 21 6"/>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <aside class="side-panel">
        <button type="button" class="btn btn-add" onclick={openAddModal}>
            <span class="action-label">{language.t("ui.cards.actions.add")}</span> <span class="btn-icon">+</span>
        </button>
        <button type="button" class="btn btn-scan" onclick={openScanModal}>
            <span class="action-label">{language.t("ui.cards.actions.identify")}</span>
            <span class="btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                    <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                    <line x1="8" y1="9" x2="16" y2="9"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="8" y1="15" x2="16" y2="15"></line>
                </svg>
            </span>
        </button>
        <button type="button" class="btn btn-log" onclick={() => showTopupJournal=true}>
            <span class="action-label">{language.t("ui.cards.journal.title")}</span>
            <span class="btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
            </span>
        </button>

        <div class="stats-group">
            <div class="stat-item user-stat">
                <div class="stat-content">
                    <span class="stat-num">{cards.length}</span>
                    <span class="stat-desc">{language.t("ui.cards.summary.total")}</span>
                </div>
                <div class="stat-icon-bg user-icon">💳</div>
            </div>

            <div class="stat-item empty-stat">
                <div class="stat-content">
                    <span class="stat-num">{cards.filter(c => !c.client).length}</span>
                    <span class="stat-desc">{language.t("ui.cards.summary.withoutOwner")}</span>
                </div>
                <div class="stat-icon-bg empty-icon">👤</div>
            </div>

            <div class="stat-item green-stat">
                <div class="stat-content">
                    <span class="stat-num">₴ {cards.reduce((acc, c) => acc + c.amount, 0).toLocaleString(language.locale, { minimumFractionDigits: 2 })}</span>
                    <span class="stat-desc">{language.t("ui.cards.summary.totalBalance")}</span>
                </div>
                <div class="stat-icon-bg green-icon">💰</div>
            </div>

            <div class="stat-item brsm-stat">
                <div class="stat-content">
                    <span class="stat-num">0</span>
                    <span class="stat-desc">{language.t("ui.cards.summary.brsmCards")}</span>
                </div>
                <div class="stat-icon-bg brsm-icon">💳</div>
            </div>
        </div>
    </aside>
</div>

{#if isModalOpen}
    <div class="modal-overlay" onclick={closeModal} role="button" tabindex="0">
        <div class="modal-container" onclick={(e) => e.stopPropagation()} role="none" in:fly={{ y: -20, duration: 300 }}>
            <div class="modal-header">
                <h2>{modalMode === 'edit' ? language.t("ui.cards.modal.editTitle") : (modalMode === 'create' ? language.t("ui.cards.modal.createTitle") : language.t("ui.cards.modal.scanTitle"))}</h2>
                <button type="button" class="close-btn" onclick={closeModal}>&times;</button>
            </div>
            <div class="modal-main">
                {#if cardError}<p class="form-error" role="alert">{language.t(`review.${cardError}`)}</p>{/if}
                {#if modalMode === 'scan'}
                    <div class="alert-box-orange">
                        <div class="circle">?</div>
                        <div class="alert-text"><strong>{language.t("ui.shared.fields.status")}</strong><span>{language.translate(scanStatus)}</span></div>
                    </div>
                    <div class="input-field">
                        <label>{language.t("ui.cards.fields.identifier")}</label>
                        <input type="text" value={selectedCard.uid} readonly class="full-width-input">
                    </div>
                    <button type="button" class="btn-save-full" onclick={saveNewCard}>{language.t("ui.cards.actions.addToSystem")}</button>
                {:else}
                    <div class="input-field">
                        <label>{language.t("ui.cards.fields.client")}</label>
                        <div style="position: relative;">
                            <input 
                                type="text" 
                                bind:value={clientSearchTerm} 
                                placeholder={language.t('ui.cards.placeholders.selectClient')}
                                onfocus={() => showDropdown = true} 
                                onfocusout={handleBlur}
                                class="full-width-input"
                            >
                            {#if showDropdown && filteredClientsForModal.length > 0}
                                <div class="search-dropdown">
                                    {#each filteredClientsForModal as clientObj}
                                        <button type="button" class="dropdown-item" onclick={() => selectClient(clientObj)}>
                                            {clientObj.firstname || ''} {clientObj.lastname || ''}
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                    
                    <div class="input-field">
                        <label>{language.t("ui.cards.fields.balanceHryvnias")}</label>
                        <input type="number" step="0.01" bind:value={selectedCard.amount} class="full-width-input" placeholder="0.00">
                    </div>
                    <div class="input-field">
                        <label for="card-discount">{language.t('review.cardDiscount')}</label>
                        <input id="card-discount" type="number" min="0" max="100" step="0.01" bind:value={selectedCard.discount} class="full-width-input" aria-invalid={!validCardDiscount(selectedCard.discount)}>
                    </div>

                    <div class="input-field">
                        <label>{language.t("ui.cards.fields.identifier")}</label>
                        <div class="input-with-action">
                            <input type="text" bind:value={selectedCard.uid} placeholder="000 000 000">
                            <button type="button" class="btn-orange-sm" onclick={identifyCard}>{language.t("ui.shared.actions.identify")}</button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-save" onclick={saveNewCard}>{language.t("ui.shared.actions.save")}</button>
                        <button type="button" class="btn-cancel" onclick={closeModal}>{language.t("ui.shared.actions.cancel")}</button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

{#if showTopupJournal}
    <div class="journal-backdrop" role="presentation" onclick={() => showTopupJournal=false}>
      <section class="journal-panel" role="dialog" aria-modal="true" aria-label={language.t('ui.cards.journal.title')} onclick={(e)=>e.stopPropagation()}>
        <div class="journal-head"><h2>{language.t("ui.cards.journal.title")}</h2><button onclick={() => showTopupJournal=false} aria-label={language.t('ui.shared.actions.close')}>✕</button></div>
        <p>{language.t("ui.cards.journal.description")}</p>
        {#if topupJournal.length}
          <ul>{#each topupJournal as entry}<li>{entry.date} · {entry.uid} · +₴ {entry.amount}</li>{/each}</ul>
        {:else}<p>{language.t("ui.cards.journal.empty")}</p>{/if}
      </section>
    </div>
{/if}

<style>
  .form-error { color: #f43f5e; font-size: 13px; line-height: 1.5; }
  .journal-backdrop {position:fixed;inset:0;z-index:1500;background:#0f172a99;display:grid;place-items:center;padding:16px;}
  .journal-panel {width:min(600px,100%);max-height:80vh;overflow:auto;background:var(--bg-card,white);color:var(--text-main,#1e293b);border-radius:16px;padding:24px;box-shadow:0 20px 80px #0004;}
  .journal-head {display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .journal-head button {cursor:pointer;border:0;background:transparent;font-size:22px;color:inherit;}

    :global(:root) {
        --bg-page: #f4f7f6;
        --bg-card: white;
        --text-main: #1e293b;
        --text-muted: #64748b;
        --shadow-card: 0 4px 12px rgba(0,0,0,0.02);
        
        --border-th: #f1f5f9;
        --border-td: #f8fafc;
        --text-td: #334155;
        
        --search-bg: #f1f5f9;
        --search-border: transparent;
        --search-text: #475569;
        --search-focus-bg: white;
        --search-placeholder: #94a3b8;
        
        --badge-red-bg: #fef2f2;
        --badge-red-text: #ef4444;
        
        --icon-color: #94a3b8;
        --icon-hover: #94a3b8;
        --icon-edit-hover: #64748b;
        --icon-delete-hover: #ef4444;
        
        --stat-bg: rgba(92, 196, 255, 0.1);
        --stat-border: rgba(92, 196, 255, 0.15);
        --stat-num: inherit;
        --stat-desc: inherit;
        
        --modal-bg: #fff;
        --close-btn: #ccc;
        --close-hover: #ccc;
        --modal-label: #777;
        
        --modal-input-bg: #f9f9f9;
        --modal-border: #eee;
        --modal-input-text: inherit;
        --modal-placeholder: inherit;
        
        --btn-cancel-bg: #fff;
        --btn-cancel-text: #999;
        --btn-cancel-hover-bg: #fff;
        --btn-cancel-hover-text: #999;
        
        --dropdown-shadow: 0 4px 12px rgba(0,0,0,0.1);
        --dropdown-text: inherit;
        --dropdown-hover-bg: #f5f5f5;
        --dropdown-hover-text: inherit;
    }

    :global(html.dark) {
        --bg-page: #0f172a;
        --bg-card: #1e293b;
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.2);
        
        --border-th: #334155;
        --border-td: #334155;
        --text-td: #cbd5e1;
        
        --search-bg: #0f172a;
        --search-border: #334155;
        --search-text: #e2e8f0;
        --search-focus-bg: #0f172a;
        --search-placeholder: #64748b;
        
        --badge-red-bg: rgba(239, 68, 68, 0.15);
        --badge-red-text: #f87171;
        
        --icon-color: #94a3b8;
        --icon-hover: #e2e8f0;
        --icon-edit-hover: #38bdf8;
        --icon-delete-hover: #ef4444;
        
        --stat-bg: #111827;
        --stat-border: #1f2937;
        --stat-num: #f8fafc;
        --stat-desc: #64748b;
        
        --modal-bg: #1e293b;
        --close-btn: #64748b;
        --close-hover: #cbd5e1;
        --modal-label: #94a3b8;
        
        --modal-input-bg: #0f172a;
        --modal-border: #334155;
        --modal-input-text: #f8fafc;
        --modal-placeholder: #64748b;
        
        --btn-cancel-bg: #0f172a;
        --btn-cancel-text: #94a3b8;
        --btn-cancel-hover-bg: #334155;
        --btn-cancel-hover-text: #f8fafc;
        
        --dropdown-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        --dropdown-text: #cbd5e1;
        --dropdown-hover-bg: #334155;
        --dropdown-hover-text: #f8fafc;
    }

    /* Page layout */
    :global(body) { 
        background-color: var(--bg-page); 
        margin: 0; 
        font-family: 'Inter', sans-serif; 
        transition: background-color 0.3s ease;
    }

    .page-layout {
        display: grid;
        grid-template-columns: 1fr 280px; 
        gap: 24px;
        align-items: start;
        width: 100%;
        box-sizing: border-box;
    }

    .content { display: flex; flex-direction: column; gap: 24px; }

    .table-card {
        background: var(--bg-card);
        border-radius: 16px;
        padding: 24px;
        box-shadow: var(--shadow-card);
        transition: background 0.3s ease, box-shadow 0.3s ease;
    }

    table thead th {
        color: var(--text-muted) !important; 
        font-weight: 700;
        transition: color 0.3s ease, border-color 0.3s ease;
    }

    .table-header h2 { 
        margin: 0 0 20px 0; 
        font-size: 1.1rem; 
        color: var(--text-main); 
        font-weight: 700;
        transition: color 0.3s ease;
    }

    .scroll-area {
        width: 100%;
        overflow-x: auto;
    }

    table { width: 100%; border-collapse: collapse; }

    th { 
        text-align: left; 
        font-size: 0.75rem; 
        color: var(--text-muted) !important; 
        padding: 12px 8px; 
        border-bottom: 1px solid var(--border-th); 
        text-transform: uppercase; 
        font-weight: 700;
        letter-spacing: 0.5px;
        transition: border-color 0.3s ease;
    }

    td { 
        padding: 16px 8px; 
        border-bottom: 1px solid var(--border-td); 
        font-size: 0.85rem; 
        color: var(--text-td); 
        vertical-align: middle;
        transition: color 0.3s ease, border-color 0.3s ease;
    }

    .filter-row td {
        padding: 4px 8px 12px 8px;
    }

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

    .table-search-input:focus {
        background-color: var(--search-focus-bg);
        border-color: #38bdf8;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E");
        box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.15);
    }

    .table-search-input::placeholder {
        color: var(--search-placeholder);
    }

    .actions-container {
        display: flex !important;
        flex-direction: row !important;
        justify-content: flex-end;
        align-items: center;
        gap: 16px; 
        width: 100%;
    }

    .uid-cell {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .copy-link-btn {
        background: transparent;
        border: none;
        color: #38bdf8;
        cursor: pointer;
        padding: 2px;
        display: flex;
        align-items: center;
    }
        
    .money-text { 
        color: #10b981; 
        font-weight: 700; 
    }

    .badge-red {
        background: var(--badge-red-bg);
        color: var(--badge-red-text);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        transition: background 0.3s ease, color 0.3s ease;
    }

    .text-right { text-align: right; }
        
    .icon-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px;
        color: var(--icon-color);
        display: flex;
        align-items: center;
        transition: color 0.2s;
    }
    .icon-btn:hover { color: var(--icon-hover); }
    .icon-btn.edit:hover { color: var(--icon-edit-hover); }
    .icon-btn.delete:hover { color: var(--icon-delete-hover); }

    .side-panel {
        background: #1e293b;
        border-radius: 20px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-sizing: border-box;
    }

    .stats-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .btn { width: 100%; padding: 14px; border-radius: 10px; border: none; color: white; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
    .btn-add { background: #5CC4FF; color: #000; }
    .btn-scan, .btn-log { background: #00A082; }
    .btn-icon { display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .btn-icon svg { display: block; color: white; }

    .stat-item { 
        padding: 15px; 
        border-radius: 12px; 
        display: flex; 
        justify-content: space-between; 
        color: white; 
        background: var(--stat-bg) !important; 
        border: 1px solid var(--stat-border) !important;
    }
    .stat-icon-bg { width: 34px; height: 34px; background: rgba(92, 196, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #5CC4FF; font-size: 16px; }
    
    .empty-stat { background: rgba(255, 77, 79, 0.08); border: 1px solid rgba(255, 77, 79, 0.15); }
    .empty-icon { background: rgba(255, 77, 79, 0.15); color: #FF4D4F; }

    .green-stat { background: rgba(0, 160, 130, 0.08); border: 1px solid rgba(0, 160, 130, 0.15); }
    .green-icon { background: rgba(0, 160, 130, 0.15); color: #00A082; }

    .brsm-stat { background: rgba(255, 190, 92, 0.08); border: 1px solid rgba(255, 190, 92, 0.15); }
    .brsm-icon { background: rgba(255, 190, 92, 0.15); color: #FFBE5C; }

    .stat-num { 
        font-size: 20px; 
        font-weight: bold; 
        display: block; 
        color: var(--stat-num);
    }
    .stat-desc { 
        font-size: 11px; 
        opacity: 0.6; 
        color: var(--stat-desc);
    }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
    .modal-container { 
        background: var(--modal-bg); 
        width: 400px; 
        padding: 25px; 
        border-radius: 20px; 
        transition: background 0.3s ease; 
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .modal-header h2 { 
        font-size: 18px; 
        margin: 0; 
        transition: color 0.3s ease; 
        color: var(--text-main);
    }
    .close-btn { 
        background: none; 
        border: none; 
        font-size: 24px; 
        cursor: pointer; 
        color: var(--close-btn); 
        transition: color 0.3s ease; 
    }
    .close-btn:hover { color: var(--close-hover); }
    
    .input-field { margin-bottom: 15px; }
    .input-field label { 
        display: block; 
        font-size: 12px; 
        margin-bottom: 6px; 
        color: var(--modal-label); 
        transition: color 0.3s ease; 
    }
    
    .full-width-input { 
        width: 100%; 
        padding: 12px; 
        border: 1px solid var(--modal-border); 
        border-radius: 10px; 
        box-sizing: border-box; 
        background: var(--modal-input-bg); 
        color: var(--modal-input-text);
        transition: all 0.3s ease; 
    }
    .input-with-action { display: flex; gap: 8px; }
    .input-with-action input { 
        flex: 1; 
        padding: 12px; 
        border: 1px solid var(--modal-border); 
        border-radius: 10px; 
        background: var(--modal-input-bg);
        color: var(--modal-input-text);
        transition: all 0.3s ease; 
    }
    .full-width-input::placeholder,
    .input-with-action input::placeholder {
        color: var(--modal-placeholder);
    }
    
    .btn-orange-sm { background: #FF9F43; color: white; border: none; padding: 0 15px; border-radius: 10px; cursor: pointer; font-weight: 600; }
    .modal-footer { display: flex; gap: 10px; margin-top: 25px; }
    .btn-save { flex: 1; background: #00A082; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: 600; }
    
    .btn-cancel { 
        flex: 1; 
        background: var(--btn-cancel-bg); 
        border: 1px solid var(--modal-border); 
        color: var(--btn-cancel-text); 
        padding: 12px; 
        border-radius: 10px; 
        cursor: pointer; 
        transition: all 0.3s ease; 
    }
    .btn-cancel:hover {
        background: var(--btn-cancel-hover-bg);
        color: var(--btn-cancel-hover-text);
    }
    
    .btn-save-full { width: 100%; background: #00A082; color: white; border: none; padding: 14px; border-radius: 12px; cursor: pointer; font-weight: 600; margin-top: 10px; }

    .alert-box-orange { background: #FF9F43; color: white; padding: 15px; border-radius: 12px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .circle { width: 24px; height: 24px; background: white; border-radius: 50%; color: #FF9F43; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .alert-text { display: flex; flex-direction: column; font-size: 13px; }

    .search-dropdown { 
        position: absolute; 
        top: 100%; 
        left: 0; 
        right: 0; 
        background: var(--modal-bg); 
        border: 1px solid var(--modal-border); 
        border-radius: 10px; 
        z-index: 100; 
        box-shadow: var(--dropdown-shadow); 
        transition: background 0.3s ease, border-color 0.3s ease; 
    }
    .dropdown-item { 
        width: 100%; 
        text-align: left; 
        padding: 10px; 
        border: none; 
        background: none; 
        cursor: pointer; 
        font-size: 13px; 
        color: var(--dropdown-text);
        transition: background 0.3s ease, color 0.3s ease; 
    }
    .dropdown-item:hover { 
        background: var(--dropdown-hover-bg); 
        color: var(--dropdown-hover-text);
    }

  .content { min-width: 0; }
  .scroll-area { max-width: 100%; overflow-x: auto; }
  table { min-width: 780px; }
  .modal-container, .journal-panel { max-width: calc(100vw - 24px); box-sizing: border-box; max-height: calc(100dvh - 24px); overflow-y: auto; }
  @media(max-width:600px) { .modal-container, .journal-panel { padding: 18px; } .table-header { flex-wrap: wrap; gap: 10px; } .input-field { min-width: 0; } .modal-header { gap: 10px; } .journal-head { flex-wrap: wrap; gap: 10px; } .modal-footer { flex-wrap: wrap; } }

  @media(min-width:768px) and (max-width:1100px) {
    .page-layout.cards-layout { grid-template-columns: minmax(0,1fr) 220px !important; gap: 16px !important; }
  }
  @media(max-width:767px) {
    .page-layout.cards-layout { grid-template-areas: 'actions' 'table'; gap: 12px !important; }
    .content { grid-area: table; }
    .side-panel { grid-area: actions; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; padding: 12px; border-radius: 14px; }
    .side-panel .btn { padding: 9px 8px; min-height: 48px; font-size: 12px; line-height: 1.35; text-align: left; gap: 6px; }
    .action-label { min-width: 0; overflow-wrap: anywhere; }
    .btn-icon { flex: none; font-size: 16px; }
    .stats-group { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 8px; }
    .stat-item { padding: 9px; gap: 6px; min-width: 0; }
    .stat-content { min-width: 0; }
    .stat-num { font-size: 16px; overflow-wrap: anywhere; }
    .stat-icon-bg { width: 24px; height: 24px; flex-shrink: 0; }
    .table-card { padding: 12px; border-radius: 14px; }
    .table-header h2 { margin-bottom: 12px; }
    th { padding: 9px 7px; letter-spacing: .2px; }
    td { padding: 10px 7px; font-size: 13px; }
    table { min-width: 720px; }
    .date-cell { white-space: nowrap; }
    .actions-container { gap: 6px; }
    .icon-btn { justify-content: center; min-width: 36px; min-height: 36px; }
  }
  @media(max-width:600px) { .stats-group { grid-template-columns: repeat(2,minmax(0,1fr)); } }
</style>
