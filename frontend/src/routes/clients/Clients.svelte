<script>
  import { horizontalScroll } from '$lib/actions/horizontal-scroll.js';
  const scrollLabels = $derived({ hint: language.t('review.scrollColumns'), previous: language.t('review.scrollPrevious'), next: language.t('review.scrollNext') });

    import { language } from '$lib/localisation/language.svelte.js';
    import { fly, fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    import api, { WS_URL } from '$lib/api/client.js';
    import { validateClient } from '$lib/review-validation.js';
    import { DEMO_MODE } from '$lib/demo.js';

    let clients = $state([]);
    let isLoading = $state(true);

    let availableTags = $state([
        { name: 'Мото', color: '#EF3636' },
        { name: 'Авто', color: '#A855F7' },
        { name: 'Фури', color: '#F59E0B' },
        { name: 'Таксі', color: '#EAB308' }
    ]);

    let isModalOpen = $state(false);
    let modalMode = $state('edit'); 
    let editingClient = $state(null);
    let clientError = $state('');
    let isSaving = $state(false);

    let sortField = $state(null);
    let sortDirection = $state(1);

    let filterFio = $state('');
    let filterMoney = $state('');
    let filterPhone = $state('');
    let filterTag = $state('');

    onMount(async () => {
    if (DEMO_MODE) {
        clients = [
            { id: 1, name: 'Олена', surname: 'Коваль', money: '1250.00', phone: '+380000000001', tags: [{ name: 'Авто', color: '#A855F7' }], email: 'demo1@example.com', date: '01.10.2026', card: '10000001' },
            { id: 2, name: 'Максим', surname: 'Петренко', money: '340.50', phone: '+380000000002', tags: [{ name: 'Мото', color: '#EF3636' }], email: 'demo2@example.com', date: '02.10.2026', card: '10000002' }
        ];
        isLoading = false;
        return;
    }
    try {
        const res = await api.get('/clients');
        if (!Array.isArray(res.data)) throw new Error('Invalid client list');
        clients = res.data;
    } catch (error) {
        console.error("Помилка мережі при завантаженні клієнтів:", error?.name);
    } finally {
        isLoading = false;
    }
});

    let sortedClients = $derived.by(() => {
        let list = [...clients];

        if (filterFio) {
            list = list.filter(c => {
                const fullName = `${c.name} ${c.surname}`.toLowerCase();
                return fullName.includes(filterFio.toLowerCase());
            });
        }
        if (filterMoney) {
            list = list.filter(c => String(c.money).toLowerCase().includes(filterMoney.toLowerCase()));
        }
        if (filterPhone) {
            list = list.filter(c => String(c.phone).toLowerCase().includes(filterPhone.toLowerCase()));
        }
        if (filterTag) {
            list = list.filter(c => c.tags?.some(t => t.name.toLowerCase().includes(filterTag.toLowerCase())));
        }

        if (!sortField) return list;

        return list.sort((a, b) => {
            let valA = a[sortField] || '';
            let valB = b[sortField] || '';

            if (sortField === 'money') {
                valA = parseFloat(String(valA).replace(/\s/g, '').replace(',', '.'));
                valB = parseFloat(String(valB).replace(/\s/g, '').replace(',', '.'));
            } else if (sortField === 'tags') {
                valA = a.tags && a.tags.length > 0 ? a.tags[0].name : '';
                valB = b.tags && b.tags.length > 0 ? b.tags[0].name : '';
            }

            if (valA < valB) return -1 * sortDirection;
            if (valA > valB) return 1 * sortDirection;
            return 0;
        });
    });

    let newTagName = $state('');
    let newTagColor = $state('#EF3636');
    let showInlineTagManager = $state(false);

    // Let the API assign IDs in both local and server modes.
    const createEmptyClient = () => ({
        name: '', surname: '', money: '0.00', phone: '', tags: [], email: '',
        date: new Date().toLocaleDateString('uk-UA'), card: ''
    });

    function openAdd() {
        clientError = '';
        modalMode = 'add';
        editingClient = createEmptyClient();
        showInlineTagManager = false;
        isModalOpen = true;
    }

    function openEdit(client) {
        clientError = '';
        modalMode = 'edit';
        editingClient = { ...client, tags: [...(client.tags || [])] }; 
        showInlineTagManager = false;
        isModalOpen = true;
    }

    function closeModal() {
        if (isSaving) return;
        clientError = '';
        isModalOpen = false;
        editingClient = null;
        showInlineTagManager = false; 
    }

    async function saveClient() {
        if (isSaving) return;
        if (DEMO_MODE) { alert(language.t("ui.clients.demo.serverSaveDisabled")); return; }
        const payload = { ...editingClient };
        for (const key of ['name', 'surname', 'phone', 'email', 'card']) payload[key] = String(payload[key] ?? '').trim();
        clientError = validateClient(payload, { creating: modalMode === 'add', previous: clients.find(client => client.id === payload.id) });
        if (clientError) return;
        isSaving = true;
        try {
            if (modalMode === 'add') {
                const res = await api.post('/clients', payload);
                if (!res.data || res.data.id == null) throw new Error('Invalid client response');
                clients = [...clients, { ...payload, ...res.data }];
            } else {
                const res = await api.put(`/clients/${payload.id}`, payload);
                const index = clients.findIndex(client => client.id === payload.id);
                if (index !== -1) {
                    clients[index] = { ...payload, ...res.data };
                }
            }
            isSaving = false;
            closeModal();
        } catch (error) {
            console.error("Помилка збереження клієнта:", error?.response?.status ?? error?.name);
            clientError = 'clientSaveFailed';
        } finally {
            isSaving = false;
        }
    }

    async function deleteClient(id) {
        if (DEMO_MODE) { alert(language.t("ui.clients.demo.serverSaveDisabled")); return; }
        if (!confirm(language.t("ui.clients.confirm.delete"))) return;
        
        try {
            await api.delete(`/clients/${id}`);
            clients = clients.filter(c => c.id !== id);
        } catch (error) {
            console.error("Помилка мережі при видаленні:", error?.name);
        }
    }

    function toggleTag(tag) {
        if (!editingClient.tags) editingClient.tags = [];
        const exists = editingClient.tags.some(t => t.name === tag.name);
        if (exists) {
            editingClient.tags = editingClient.tags.filter(t => t.name !== tag.name);
        } else {
            editingClient.tags = [...editingClient.tags, tag];
        }
    }

    function handleCreateTag() {
        if (!newTagName.trim()) return;
        const tagObj = { name: newTagName.trim(), color: newTagColor.trim() || '#ef4444' };
        
        if (!availableTags.some(t => t.name.toLowerCase() === tagObj.name.toLowerCase())) {
            availableTags = [...availableTags, tagObj];
        }
        
        if (!editingClient.tags) editingClient.tags = [];
        if (!editingClient.tags.some(t => t.name === tagObj.name)) {
            editingClient.tags = [...editingClient.tags, tagObj];
        }
        
        newTagName = '';
        showInlineTagManager = false;
    }

    $effect(() => {
        if (DEMO_MODE) return;
        const socketURL = WS_URL.startsWith('/') ? `${window.location.origin.replace(/^http/, 'ws')}${WS_URL}` : WS_URL;
        const token = localStorage.getItem("token");
        if (!token || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return;
        const socket = new WebSocket(socketURL, ["bigwash.v1", token]);

        socket.onopen = () => {
            console.log("🟢 WebSocket Connected for Clients!");
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                const eventType = message.type;
                const payload = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;

                // Retain fields omitted from a partial client update.
                if (eventType === 'client.updated' || eventType === 'client.balance_changed') {
                    const index = clients.findIndex(c => c.id === payload.id);
                    if (index !== -1) {
                        clients[index] = { ...clients[index], ...payload };
                    }
                } 
                else if (eventType === 'client.created') {
                    if (!clients.some(c => c.id === payload.id)) {
                        clients = [...clients, payload];
                    }
                } 
                else if (eventType === 'client.deleted') {
                    clients = clients.filter(c => c.id !== payload.id);
                }

            } catch (err) {
                console.error("❌ Failed to parse WebSocket message:", err?.name);
            }
        };

        socket.onclose = () => {
            console.log("🔴 WebSocket Disconnected.");
        };

        return () => socket.close();
    });
</script>

<div class="admin-container">
    <main class="content">
        <div class="table-card">
            <div class="table-header">
                <h2>{language.t("ui.shared.titles.clients")} {isLoading ? language.t("ui.shared.loading.parenthesized") : ''}</h2>
            </div>
            
            <div class="scroll-area" use:horizontalScroll={scrollLabels}>
                <table>
                    <thead>
                        <tr>
                            <th>№</th>
                            <th style="cursor: pointer;" onclick={() => { sortField = 'name'; sortDirection *= -1; }}>{language.t("ui.clients.columns.fullName")}</th>
                            <th style="cursor: pointer;" onclick={() => { sortField = 'money'; sortDirection *= -1; }}>{language.t("ui.shared.columns.money")}</th>
                            <th style="cursor: pointer;" onclick={() => { sortField = 'phone'; sortDirection *= -1; }}>{language.t("ui.shared.fields.phone")}</th>
                            <th style="cursor: pointer;" onclick={() => { sortField = 'tags'; sortDirection *= -1; }}>{language.t("ui.clients.fields.tag")}</th>
                            <th>{language.t("ui.shared.columns.registered")}</th>
                            <th class="text-right">{language.t("ui.shared.columns.action")}</th>
                        </tr>
                        <tr class="filter-row">
                            <td></td>
                            <td><input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={filterFio} /></td>
                            <td><input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={filterMoney} /></td>
                            <td><input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={filterPhone} /></td>
                            <td><input type="text" class="table-search-input" placeholder={language.t('ui.clients.placeholders.choose')} bind:value={filterTag} /></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </thead>
                    <tbody>
                        {#each sortedClients as client, index (client.id)}
                            <tr>
                                <td>{index + 1}</td>
                                <td class="fio-cell">{client.name} {client.surname}</td>
                                <td class="money-text">₴ {client.money}</td>
                                <td>{client.phone}</td>
                                
                                <td class="tags-cell">
                                    <div class="tags-list">
                                        {#if client.tags}
                                            {#each client.tags as tag}
                                                <span class="tag-badge" style="background: {tag.color}">{tag.name}</span>
                                            {/each}
                                        {/if}
                                    </div>
                                </td>
                                
                                <td>{client.date}</td>
                                <td class="text-right">
                                    <div class="actions-container">
                                        <button type="button" class="icon-btn edit" onclick={() => openEdit(client)}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                            </svg>
                                        </button>
                                        <button type="button" class="icon-btn delete" onclick={() => deleteClient(client.id)}>
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
    </main>

    <aside class="right-panel">
        <div class="action-buttons">
            <button type="button" class="btn btn-cyan" onclick={openAdd}>{language.t("ui.clients.actions.add")} <span>+</span></button>
        </div>

        <div class="stats-group">
            <div class="stat-card">
                <div class="stat-info">
                    <span class="stat-value">{clients.filter(c => c.card).length}</span>
                    <span class="stat-label">{language.t("ui.clients.filters.withCard")}</span>
                </div>
                <div class="stat-icon-circle blue">💳</div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <span class="stat-value">{clients.filter(c => !c.card).length}</span>
                    <span class="stat-label">{language.t("ui.clients.summary.withoutCard")}</span>
                </div>
                <div class="stat-icon-circle blue">👤</div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <span class="stat-value">{clients.length}</span>
                    <span class="stat-label">{language.t("ui.clients.filters.allClients")}</span>
                </div>
                <div class="stat-icon-circle blue">👥</div>
            </div>
        </div>
    </aside>
</div>

{#if isModalOpen && editingClient}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" transition:fade onclick={closeModal}>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="client-modal" transition:fly={{ y: 20 }} onclick={(e) => e.stopPropagation()}>
            
            <h3 class="modal-title">{language.t("ui.clients.modal.title")}</h3>
            <p class="form-hint">{language.t('review.clientFormHint')}</p>
            {#if clientError}<p class="form-error" role="alert">{language.t(`review.${clientError}`)}</p>{/if}
            
            <div class="modal-body">
                <div class="input-row">
                    <span class="inline-label">{language.t("ui.clients.fields.firstNameWithColon")}</span>
                    <input type="text" bind:value={editingClient.name} placeholder={language.t('ui.clients.samples.firstName')} />
                    <button type="button" class="clear-btn" onclick={() => editingClient.name = ''}>✕</button>
                </div>
                
                <div class="input-row">
                    <span class="inline-label">{language.t("ui.clients.fields.lastNameWithColon")}</span>
                    <input type="text" bind:value={editingClient.surname} placeholder={language.t('ui.clients.samples.lastName')} />
                    <button type="button" class="clear-btn" onclick={() => editingClient.surname = ''}>✕</button>
                </div>
                
                <div class="input-row">
                    <span class="inline-label">{language.t("ui.clients.fields.phoneWithColon")}</span>
                    <input type="text" bind:value={editingClient.phone} placeholder="096 774 79 83" />
                    <button type="button" class="clear-btn" onclick={() => editingClient.phone = ''}>✕</button>
                </div>
                
                <div class="input-row" class:error-border={clientError === 'clientEmailInvalid'}>
                    <span class="inline-label">{language.t("ui.clients.fields.emailWithColon")}</span>
                    <input type="email" bind:value={editingClient.email} placeholder={language.t('ui.clients.placeholders.email')} />
                    <button type="button" class="clear-btn" onclick={() => editingClient.email = ''}>✕</button>
                </div>

                <div class="input-row">
                    <span class="inline-label">{language.t("ui.clients.fields.passwordWithColon")}</span>
                    <input type="password" placeholder="********" />
                    <div class="row-actions">
                        <button type="button" class="clear-btn">✕</button>
                        <button type="button" class="clear-btn icon-btn">👁️</button>
                    </div>
                </div>

                <div class="tags-section-wrapper">
                    {#if !showInlineTagManager}
                        <div class="tag-display-row">
                            <button type="button" class="tag-header-btn" onclick={() => showInlineTagManager = true}>
                                {language.t("ui.clients.tags.assign")} <span class="plus-icon">+</span>
                            </button>
                            
                            {#if editingClient.tags}
                                {#each editingClient.tags as tag}
                                    <span class="tag-badge" style="background: {tag.color}">{tag.name}</span>
                                {/each}
                            {/if}
                        </div>
                    {:else}
                        <div class="tag-manager-layout">
                            <button type="button" class="tag-header-btn" onclick={() => showInlineTagManager = false}>
                                {language.t("ui.clients.pagination.previous")}
                            </button>

                            <div class="tag-manager-card">
                                <h4 class="card-subtitle">{language.t("ui.clients.actions.createNew")}</h4>
                                
                                <div class="input-row compact">
                                    <span class="inline-label">{language.t("ui.shared.fields.nameWithColon")}</span>
                                    <input type="text" placeholder={language.t('ui.clients.tags.motorcycle')} bind:value={newTagName} />
                                    <button type="button" class="clear-btn" onclick={() => newTagName = ''}>✕</button>
                                </div>

                                <div class="input-row compact color-picker-wrapper">
                                    <span class="inline-label">{language.t("ui.clients.tags.color")}</span>
                                    <input type="color" bind:value={newTagColor} class="native-color-picker" />
                                    <span class="color-hex-text">{newTagColor}</span>
                                </div>

                                <button type="button" class="create-assign-btn" onclick={handleCreateTag}>
                                    {language.t("ui.clients.actions.createAndAssign")}
                                </button>

                                <h4 class="card-subtitle mt-15">{language.t("ui.clients.actions.selectExisting")}</h4>
                                <div class="existing-tags-list">
                                    {#each availableTags as tag}
                                        <button 
                                            type="button"
                                            class="existing-tag-pill {editingClient.tags && editingClient.tags.some(t => t.name === tag.name) ? 'selected' : ''}" 
                                            style="background: {tag.color}"
                                            onclick={() => toggleTag(tag)}
                                        >
                                            {tag.name}
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>

                <div class="card-row mt-15">
                    <div class="input-row no-margin flex-1">
                        <span class="inline-label">{language.t("ui.clients.fields.card")}</span>
                        <input type="text" bind:value={editingClient.card} placeholder={language.t('review.cardUID')} />
                        <button type="button" class="clear-btn" onclick={() => editingClient.card = ''}>✕</button>
                    </div>
                    <button type="button" class="define-btn">{language.t("ui.shared.actions.identify")}</button>
                </div>
            </div>

            <div class="modal-footer">
                <button type="button" class="save-btn" disabled={isSaving} onclick={saveClient}>{language.t("ui.shared.actions.save")}</button>
                <button type="button" class="cancel-btn" disabled={isSaving} onclick={closeModal}>{language.t("ui.shared.actions.cancel")}</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .form-hint { margin: 0 0 12px; color: var(--text-muted); font-size: 12px; line-height: 1.5; }
    .form-error { margin: 0 0 12px; color: #f43f5e; font-size: 13px; line-height: 1.5; }
    :global(:root) {
        --bg-page: transparent;
        --bg-card: white;
        --text-main: #1e293b;
        --text-muted: #64748b;
        --text-input: #111827;
        
        --border-color: #d1d5db;
        --border-th: #f1f5f9;
        --border-td: #f8fafc;
        
        --search-bg: #f1f5f9;
        --search-border: transparent;
        --search-text: #475569;
        --search-focus-bg: white;
        --search-placeholder: #94a3b8;
        
        --icon-color: #94a3b8;
        --icon-hover: #4b5563;
        --icon-edit-hover: #64748b;
        --icon-delete-hover: #ef4444;
        
        --panel-bg: #111827;
        --panel-border: transparent;
        --stat-bg: #1f2937;
        --stat-border: transparent;
        --stat-text: white;
        --stat-label: #94a3b8;
        
        --modal-bg: white;
        --modal-title: #333;
        --input-row-bg: white;
        --tag-header-bg: #e0f2fe;
        --tag-header-text: #0369a1;
        --tag-card-bg: white;
        --tag-card-border: #e5e7eb;
    }

    :global(html.dark) {
        --bg-page: transparent;
        --bg-card: #1e293b;
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        --text-input: #f8fafc;
        
        --border-color: #334155;
        --border-th: #334155;
        --border-td: #334155;
        
        --search-bg: #0f172a;
        --search-border: #334155;
        --search-text: #e2e8f0;
        --search-focus-bg: #0f172a;
        --search-placeholder: #64748b;
        
        --icon-color: #94a3b8;
        --icon-hover: #cbd5e1;
        --icon-edit-hover: #38bdf8;
        --icon-delete-hover: #ef4444;
        
        --panel-bg: #1e293b;
        --panel-border: #334155;
        --stat-bg: #0f172a;
        --stat-border: #334155;
        --stat-text: #f8fafc;
        --stat-label: #94a3b8;
        
        --modal-bg: #1e293b;
        --modal-title: #f8fafc;
        --input-row-bg: #0f172a;
        --tag-header-bg: rgba(56, 189, 248, 0.15);
        --tag-header-text: #38bdf8;
        --tag-card-bg: #1e293b;
        --tag-card-border: #334155;
    }

    :global(body) { 
        background-color: var(--bg-page); 
        margin: 0; 
        font-family: 'Inter', sans-serif; 
        transition: background-color 0.3s ease;
    }

    .admin-container {
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
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        transition: background 0.3s ease;
    }

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

    .table-search-input:focus {
        background-color: var(--search-focus-bg);
        border-color: #38bdf8;
        box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.15);
    }

    .table-search-input::placeholder { color: var(--search-placeholder); }

    .modal-backdrop { 
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); 
        display: flex; align-items: center; justify-content: center; z-index: 100; 
    }
    .client-modal { 
        background: var(--modal-bg); border-radius: 16px; padding: 24px; 
        width: 380px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); 
        font-family: sans-serif; border: 1px solid var(--border-color);
        transition: background 0.3s ease, border-color 0.3s ease;
    }
    .modal-title { font-size: 16px; font-weight: 500; color: var(--modal-title); margin: 0 0 16px 0; transition: color 0.3s ease; }
    
    .input-row { 
        display: flex; align-items: center; 
        border: 1px solid var(--border-color); border-radius: 8px; 
        padding: 6px 10px; margin-bottom: 8px; background: var(--input-row-bg);
        transition: background 0.3s ease, border-color 0.3s ease;
    }
    .input-row.error-border { border-color: #f43f5e; margin-bottom: 4px; }
    .input-row.no-margin { margin-bottom: 0; }
    .input-row.compact { padding: 4px 8px; margin-bottom: 6px; }
    .flex-1 { flex: 1; }
    
    .inline-label { font-size: 13px; font-weight: 600; color: var(--text-main); margin-right: 6px; white-space: nowrap; transition: color 0.3s ease; }
    
    .input-row input { 
        border: none; outline: none; background-color: transparent !important; 
        flex: 1; font-size: 13px; color: var(--text-input); width: 100%;
        transition: color 0.3s ease;
    }
    .input-row input::placeholder { color: var(--text-muted); }

    .input-row input:-webkit-autofill {
        -webkit-box-shadow: 0 0 0 30px var(--input-row-bg) inset !important;
        -webkit-text-fill-color: var(--text-input) !important;
        transition: background-color 5000s ease-in-out 0s;
    }
    
    .clear-btn { background: none; border: none; color: var(--icon-color); cursor: pointer; font-size: 14px; padding: 0 4px; transition: color 0.2s ease; }
    .clear-btn:hover { color: var(--icon-hover); }
    .row-actions { display: flex; align-items: center; gap: 4px; }
    
    .error-text { font-size: 11px; color: #f43f5e; margin: 0 0 8px 4px; display: none; }

    .color-picker-wrapper {
        display: flex;
        align-items: center;
    }
    .native-color-picker {
        -webkit-appearance: none;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        cursor: pointer;
        background: transparent;
        padding: 0;
        margin-right: 12px;
    }
    .native-color-picker::-webkit-color-swatch-wrapper { padding: 0; }
    .native-color-picker::-webkit-color-swatch {
        border: 1px solid rgba(128, 128, 128, 0.3);
        border-radius: 6px;
    }
    .color-hex-text { font-size: 13px; font-weight: 600; color: var(--text-main); text-transform: uppercase; flex: 1; }

    .tags-section-wrapper { min-height: 40px; margin-bottom: 8px; }
    .tag-display-row { display: flex; align-items: center; gap: 8px; height: 32px; }

    .tag-manager-layout { display: flex; align-items: flex-start; gap: 12px; }
    
    .tag-header-btn { 
        background: var(--tag-header-bg); border: none; color: var(--tag-header-text); padding: 6px 12px; 
        border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; 
        display: flex; align-items: center; gap: 6px; white-space: nowrap;
        transition: background 0.3s ease, color 0.3s ease;
    }

    .tag-manager-card { 
        flex: 1; border: 1px solid var(--tag-card-border); border-radius: 8px; 
        padding: 12px; background: var(--tag-card-bg); box-shadow: 0 2px 8px rgba(0,0,0,0.04); 
        transition: background 0.3s ease, border-color 0.3s ease;
    }
    .card-subtitle { font-size: 12px; font-weight: 500; color: var(--text-main); margin: 0 0 8px 0; transition: color 0.3s ease; }
    .mt-15 { margin-top: 16px; }
    
    .create-assign-btn { 
        width: 100%; background: #38bdf8; color: white; border: none; 
        padding: 8px; border-radius: 6px; font-size: 13px; font-weight: 500; 
        cursor: pointer; margin-top: 10px;
    }

    .existing-tags-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .existing-tag-pill { 
        border: none; color: white; padding: 4px 10px; border-radius: 6px; 
        font-size: 12px; font-weight: 500; cursor: pointer; 
    }
    .selected { box-shadow: 0 0 0 2px var(--bg-card), 0 0 0 2px #38bdf8; }

    .fio-cell { word-break: break-word; max-width: 150px; }
    .tags-cell { max-width: 200px; min-width: 150px; }
    .tags-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag-badge { padding: 2px 8px; border-radius: 4px; color: white; font-size: 0.75rem; white-space: nowrap; display: inline-block; }

    .right-panel {
        background: var(--panel-bg);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        border: 1px solid var(--panel-border);
        transition: background 0.3s ease, border-color 0.3s ease;
    }

    .action-buttons { display: flex; flex-direction: column; gap: 8px; }

    .btn {
        width: 100%; border: none; border-radius: 10px; padding: 14px 16px;
        color: #000; font-weight: 700; font-size: 0.85rem;
        display: flex; justify-content: space-between; align-items: center; cursor: pointer;
    }

    .btn-cyan { background: #38bdf8; }

    .stats-group { display: flex; flex-direction: column; gap: 6px; }

    .stat-card {
        background: var(--stat-bg); border-radius: 12px; padding: 16px;
        display: flex; justify-content: space-between; align-items: center; color: var(--stat-text);
        border: 1px solid var(--stat-border);
        transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease;
    }

    .stat-value { font-size: 1.4rem; font-weight: 700; display: block; color: var(--stat-text); }
    .stat-label { font-size: 0.7rem; color: var(--stat-label); transition: color 0.3s ease; }

    .stat-icon-circle.blue { 
        width: 36px; height: 36px; background: rgba(3, 105, 161, 0.4); 
        border-radius: 50%; display: flex; align-items: center; 
        justify-content: center; color: #38bdf8; border: 1px solid #0369a1;
    }

    .actions-container {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 12px;
    }
    
    .text-right { text-align: right; }
    
    .icon-btn { background: none; border: none; cursor: pointer; color: var(--icon-color); display: flex; align-items: center; transition: color 0.2s ease; }
    .icon-btn:hover { color: var(--icon-hover); }
    .icon-btn.edit:hover { color: var(--icon-edit-hover); }
    .icon-btn.delete:hover { color: var(--icon-delete-hover); }

    .card-row { display: flex; gap: 10px; align-items: center; margin-bottom: 24px; }
    .define-btn { 
        background: #38bdf8; color: white; border: none; padding: 6px 14px; 
        border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; height: 32px;
    }

    .modal-footer { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .save-btn { 
        width: 140px; background: #38bdf8; color: white; border: none; 
        padding: 10px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; 
    }
    .cancel-btn { background: none; border: none; color: #f43f5e; font-size: 13px; font-weight: 500; cursor: pointer; }

  .content { min-width: 0; }
  .scroll-area { max-width: 100%; overflow-x: auto; }
  table { min-width: 760px; }
  .client-modal { max-width: calc(100vw - 24px); box-sizing: border-box; max-height: calc(100dvh - 24px); overflow-y: auto; }
  @media(max-width:1024px) { .admin-container { grid-template-columns: minmax(0,1fr); } }
  @media(max-width:600px) { .table-header { flex-wrap: wrap; gap: 10px; } .client-modal { padding: 18px; } .input-row { min-width: 0; } .inline-label { flex-shrink: 0; } .card-row { flex-wrap: wrap; } .tag-manager-layout { flex-direction: column; } .right-panel { box-sizing: border-box; } }
</style>
