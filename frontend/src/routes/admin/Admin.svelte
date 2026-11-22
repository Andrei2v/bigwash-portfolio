<script>
  import { horizontalScroll } from '$lib/actions/horizontal-scroll.js';
  const scrollLabels = $derived({ hint: language.t('review.scrollColumns'), previous: language.t('review.scrollPrevious'), next: language.t('review.scrollNext') });

    import { language } from '$lib/localisation/language.svelte.js';
    import { onMount } from 'svelte';
    import { API_URL, LOCAL_MODE } from '$lib/api/client.js';
    import { DEMO_MODE } from '$lib/demo.js';

    let admins = $state([]);
    let isLoading = $state(true);

    let selectedRoleFilter = $state('Всі');
    let sortField = $state(''); 
    let sortDirection = $state(1);
    let showRoleDropdown = $state(false);

    let searchFilters = $state({
        name: '',
        email: '',
        phone: '',
        card: ''
    });

    let showModal = $state(false);
    let selectedAdmin = $state(null);
    let isNewAdmin = $state(false);

    let adminName = $state('');
    let adminSurname = $state('');
    let adminPassword = $state('');
    let adminConfirmPassword = $state('');
    let showPassword = $state(false);
    let isSaving = $state(false);
    let initialCard = $state('');
    let cardFeedback = $state(null);

    function normalizeRole(role, roleId) {
        const names = { 1: 'Власник', 2: 'Адмін', 3: 'Сервіс', owner: 'Власник', admin: 'Адмін', service: 'Сервіс' };
        return names[roleId] || names[role] || (['Власник', 'Адмін', 'Сервіс'].includes(role) ? role : 'Адмін');
    }

    function toAdmin(data) {
        const role = normalizeRole(data.role, data.role_id);
        return {
            id: data.id, firstname: data.firstname || '', lastname: data.lastname || '',
            name: `${data.firstname || ''} ${data.lastname || ''}`.trim(),
            email: data.email || '', phone: data.phone || '', role,
            roleClass: roleClasses[role], card: data.special_card_uid || null
        };
    }

    async function localPasswordFields(password) {
        const salt = crypto.randomUUID();
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
        const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
        return { password_salt: salt, password_hash: Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('') };
    }

    const roleClasses = {
        'Власник': 'owner',
        'Адмін': 'admin',
        'Сервіс': 'service'
    };

    const roleToId = {
        'Власник': 1,
        'Адмін': 2,
        'Сервіс': 3
    };

    const API_BASE = API_URL.replace(/\/api\/v1$/, '');

    function getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    onMount(async () => {
        if (DEMO_MODE && !LOCAL_MODE) {
            admins = [
                { id: 1, name: 'Демо Власник', email: 'owner@example.com', phone: '+380000000001', role: 'Власник', roleClass: 'owner', card: null },
                { id: 2, name: 'Демо Адмін', email: 'admin@example.com', phone: '+380000000002', role: 'Адмін', roleClass: 'admin', card: '10000002' }
            ];
            isLoading = false;
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/api/v1/admins`, {
                headers: getHeaders()
            });
            
            if (res.ok) {
                const data = await res.json();
                admins = data.map(toAdmin);
            } else {
                console.error("Помилка сервера при завантаженні адмінів. Статус:", res.status);
            }
        } catch (error) {
            console.error("Помилка мережі:", error?.name);
        } finally {
            isLoading = false;
        }
    });

    const stats = $derived({
        engineers: admins.filter(a => a.role === 'Сервіс').length,
        admins: admins.filter(a => a.role === 'Адмін').length,
        owners: admins.filter(a => a.role === 'Власник').length
    });

    const processedAdmins = $derived.by(() => {
        let result = admins.filter(admin => {
            const matchesRole = selectedRoleFilter === 'Всі' || admin.role === selectedRoleFilter;
            const matchesName = (admin.name || '').toLowerCase().includes(searchFilters.name.toLowerCase());
            const matchesEmail = (admin.email || '').toLowerCase().includes(searchFilters.email.toLowerCase());
            const matchesPhone = (admin.phone || '').toLowerCase().includes(searchFilters.phone.toLowerCase());
            const matchesCard = (admin.card || '').toLowerCase().includes(searchFilters.card.toLowerCase());

            return matchesRole && matchesName && matchesEmail && matchesPhone && matchesCard;
        });

        if (sortField) {
            result.sort((a, b) => {
                let valA = a[sortField] || '';
                let valB = b[sortField] || '';
                return valA.toString().localeCompare(valB.toString(), 'uk') * sortDirection;
            });
        }
        return result;
    });

    function handleSort(field) {
        if (sortField === field) {
            sortDirection = -sortDirection;
        } else {
            sortField = field;
            sortDirection = 1;
        }
    }

    function openEdit(admin, isNew = false) {
        cardFeedback = null;
        initialCard = String(admin.card ?? '').trim();
        isNewAdmin = isNew;
        selectedAdmin = { ...admin, role: normalizeRole(admin.role) };
        
        if (isNew) {
            adminName = '';
            adminSurname = '';
        } else {
            const nameParts = (admin.name || '').trim().split(' ');
            adminName = admin.firstname ?? nameParts[0] ?? '';
            adminSurname = admin.lastname ?? nameParts.slice(1).join(' ');
        }

        adminPassword = '';
        adminConfirmPassword = '';
        showPassword = false;
        showModal = true;
    }

    function closeModal() {
        showModal = false;
        selectedAdmin = null;
        adminPassword = '';
        adminConfirmPassword = '';
        showPassword = false;
    }

    async function saveAdmin() {
        if (isSaving) return;
        if (DEMO_MODE && !LOCAL_MODE) { alert(language.t("ui.shared.demo.saveDisabled")); return; }
        if (!adminName.trim() || !adminSurname.trim() || !selectedAdmin.email.trim() || !selectedAdmin.phone.trim()) {
            alert(language.t("ui.admin.validation.fieldsRequired"));
            return;
        }
        if ((adminPassword || adminConfirmPassword) && adminPassword !== adminConfirmPassword) {
            alert(language.t("ui.admin.password.mismatch"));
            return;
        }
        if ((isNewAdmin || adminPassword) && adminPassword.length < 6) {
            alert(language.t("ui.admin.password.minimumLength"));
            return;
        }

        const nextCard = String(selectedAdmin.card ?? '').trim();
        const cardChanged = nextCard !== initialCard;
        const adminLabel = `${adminName.trim()} ${adminSurname.trim()}`.trim();
        if (cardChanged && !confirm(language.t(nextCard ? 'review.adminBindConfirm' : 'review.adminUnbindConfirm', {
            card: nextCard, admin: adminLabel
        }))) return;

        const payload = {
            firstname: adminName.trim(),
            lastname: adminSurname.trim(),
            email: selectedAdmin.email.trim(),
            phone: selectedAdmin.phone.trim(),
            role_id: roleToId[selectedAdmin.role] || 2,
            special_card_uid: nextCard || null,
            is_active: true
        };

        isSaving = true;
        try {
            if (LOCAL_MODE) payload.role = selectedAdmin.role;
            if (adminPassword) {
                if (LOCAL_MODE) Object.assign(payload, await localPasswordFields(adminPassword));
                else payload.password = adminPassword;
            }
            if (isNewAdmin) {
                const res = await fetch(`${API_BASE}/api/v1/admins`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Create failed');
                if (res.ok) {
                    const newAdminData = await res.json();
                    admins = [...admins, toAdmin({ ...payload, ...newAdminData })];
                }
            } else {
                const res = await fetch(`${API_BASE}/api/v1/admins/${selectedAdmin.id}`, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify(payload)
                });
                
                if (!res.ok) throw new Error('Update failed');
                const updated = toAdmin({ ...payload, id: selectedAdmin.id });
                admins = admins.map(a => a.id === updated.id ? updated : a);
            }
            if (cardChanged) cardFeedback = {
                key: nextCard ? 'review.adminCardLinked' : 'review.adminCardUnlinked',
                params: { card: nextCard, admin: adminLabel }
            };
            closeModal();
        } catch (error) {
            console.error("Помилка збереження:", error?.name);
            alert(language.t("ui.admin.errors.saveFailed"));
        } finally {
            isSaving = false;
        }
    }

    async function deleteAdmin(id) {
        if (DEMO_MODE && !LOCAL_MODE) { alert(language.t("ui.shared.demo.saveDisabled")); return; }
        if (confirm(language.t("ui.admin.confirm.delete"))) {
            try {
                const res = await fetch(`${API_BASE}/api/v1/admins/${id}`, { 
                    method: 'DELETE',
                    headers: getHeaders() 
                });
                if (!res.ok) throw new Error('Delete failed');
                if (res.ok) {
                    admins = admins.filter(a => a.id !== id);
                }
            } catch (error) {
                console.error("Помилка видалення:", error?.name);
                alert(language.t("ui.admin.errors.deleteFailed"));
            }
        }
    }

    function generatePassword() {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        adminPassword = pass;
        adminConfirmPassword = pass;
    }

    function copyToClipboard(text) {
        if (!text) return;
        navigator.clipboard.writeText(text);
    }

    function handleOverlayClick(event) {
        if (!isSaving && event.target === event.currentTarget) {
            closeModal();
        }
    }
</script>

<div class="admin-page-container" class:blurred-content={showModal}>
    <div class="table-block">
        {#if cardFeedback}<p class="card-feedback" role="status">{language.t(cardFeedback.key, cardFeedback.params)}</p>{/if}
        <div class="table-header">
            <h2>{language.t("ui.admin.title")} {isLoading ? language.t("ui.shared.loading.parenthesized") : ''}</h2>
        </div>
        
        <div class="table-wrapper" use:horizontalScroll={scrollLabels}>
            <table>
                <thead>
                    <tr>
                        <th class="w-50">№</th>
                        <th class="sortable-th" onclick={() => handleSort('name')}>
                            <div class="th-sort-content">
                                <span>{language.t("ui.shared.fields.firstName")}</span>
                                <span class="sort-arrow" class:active={sortField === 'name'} class:desc={sortField === 'name' && sortDirection === -1}>↑</span>
                            </div>
                        </th>
                        <th class="sortable-th" onclick={() => handleSort('email')}>
                            <div class="th-sort-content">
                                <span>{language.t("ui.admin.fields.email")}</span>
                                <span class="sort-arrow" class:active={sortField === 'email'} class:desc={sortField === 'email' && sortDirection === -1}>↑</span>
                            </div>
                        </th>
                        <th class="sortable-th" onclick={() => handleSort('phone')}>
                            <div class="th-sort-content">
                                <span>{language.t("ui.shared.fields.phone")}</span>
                                <span class="sort-arrow" class:active={sortField === 'phone'} class:desc={sortField === 'phone' && sortDirection === -1}>↑</span>
                            </div>
                        </th>
                        <th class="sortable-th role-th-container">
                            <span onclick={() => showRoleDropdown = !showRoleDropdown}>
                                {language.t("ui.admin.fields.role")} <span class="filter-indicator">▼</span>
                            </span>
                            {#if selectedRoleFilter !== 'Всі'}
                                <span class="active-filter-badge">({language.translate(selectedRoleFilter)})</span>
                            {/if}
                            
                            {#if showRoleDropdown}
                                <div class="role-filter-dropdown">
                                    <button class:active={selectedRoleFilter === 'Всі'} onclick={() => { selectedRoleFilter = 'Всі'; showRoleDropdown = false; }}>{language.t("ui.admin.filters.all")}</button>
                                    <button class:active={selectedRoleFilter === 'Власник'} onclick={() => { selectedRoleFilter = 'Власник'; showRoleDropdown = false; }}>{language.t("ui.admin.filters.owners")}</button>
                                    <button class:active={selectedRoleFilter === 'Адмін'} onclick={() => { selectedRoleFilter = 'Адмін'; showRoleDropdown = false; }}>{language.t("ui.admin.titleShort")}</button>
                                    <button class:active={selectedRoleFilter === 'Сервіс'} onclick={() => { selectedRoleFilter = 'Сервіс'; showRoleDropdown = false; }}>{language.t("ui.admin.roles.service")}</button>
                                </div>
                            {/if}
                        </th>
                        <th class="sortable-th" onclick={() => handleSort('card')}>
                            <div class="th-sort-content">
                                <span>{language.t("ui.admin.fields.specialCard")}</span>
                                <span class="sort-arrow" class:active={sortField === 'card'} class:desc={sortField === 'card' && sortDirection === -1}>↑</span>
                            </div>
                        </th>
                        <th class="text-right">{language.t("ui.shared.columns.action")}</th>
                    </tr>
                    
                    <tr class="search-row">
                        <th></th>
                        <th><input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={searchFilters.name} /></th>
                        <th><input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={searchFilters.email} /></th>
                        <th><input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={searchFilters.phone} /></th>
                        <th></th> 
                        <th><input type="text" class="table-search-input" placeholder={language.t('ui.shared.placeholders.search')} bind:value={searchFilters.card} /></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {#each processedAdmins as admin, index (admin.id)}
                        <tr>
                            <td class="text-gray">{index + 1}</td>
                            <td class="font-medium">{admin.name}</td>
                            <td>
                                <div class="cell-with-icon">
                                    <button class="copy-btn-minimal" onclick={() => copyToClipboard(admin.email)} title={language.t('ui.admin.actions.copyEmail')}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5ebfff" stroke-width="1.5">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </button>
                                    <span class="cell-text">{admin.email}</span>
                                </div>
                            </td>
                            <td>{admin.phone}</td>
                            <td>
                                <span class="badge {admin.roleClass}">
                                    {language.translate(admin.role)}
                                </span>
                            </td>
                            <td>
                                {#if admin.card}
                                    <div class="cell-with-icon special-card">
                                        <button class="copy-btn-minimal" onclick={() => copyToClipboard(admin.card)} title={language.t('ui.admin.actions.copyCard')}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5ebfff" stroke-width="1.5">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                            </svg>
                                        </button>
                                        <span class="card-number">{admin.card}</span>
                                    </div>
                                {:else}
                                    <button class="add-card-btn" onclick={() => openEdit(admin)}>
                                        <span class="plus-sign">+</span> {language.t("ui.admin.actions.add")}
                                    </button>
                                {/if}
                            </td>
                            <td class="text-right">
                                <div class="action-group">
                                    <button class="icon-btn edit" onclick={() => openEdit(admin)} title={language.t('ui.shared.actions.edit')}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                    </button>
                                    <button class="icon-btn delete" onclick={() => deleteAdmin(admin.id)} title={language.t('ui.shared.actions.delete')}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {:else}
                        <tr>
                            <td colspan="7" class="empty-state">{language.t("ui.admin.empty.search")}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>

    <aside class="side-panel">
        <div class="black-card">
            <button class="btn-add-main" onclick={() => openEdit({ id: Date.now(), name: '', email: '', phone: '', role: 'Адмін', roleClass: 'admin', card: null }, true)}>
                {language.t("ui.admin.actions.addShort")} <span class="plus-icon-white">+</span>
            </button>

            <div class="stats-list">
                <div class="stat-item">
                    <div class="stat-info">
                        <span class="stat-val">{stats.engineers}</span>
                        <span class="stat-desc">{language.t("ui.admin.summary.serviceEngineers")}</span>
                    </div>
                    <div class="stat-icon gray">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    </div>
                </div>

                <div class="stat-item">
                    <div class="stat-info">
                        <span class="stat-val">{stats.admins}</span>
                        <span class="stat-desc">{language.t("ui.admin.roles.admin")}</span>
                    </div>
                    <div class="stat-icon blue">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                </div>

                <div class="stat-item">
                    <div class="stat-info">
                        <span class="stat-val">{stats.owners}</span>
                        <span class="stat-desc">{language.t("ui.admin.filters.owners")}</span>
                    </div>
                    <div class="stat-icon house">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                </div>
            </div>
        </div>
    </aside>
</div>

{#if showModal}
    <div class="modal-overlay" onclick={handleOverlayClick}>
        <div class="edit-admin-panel white-theme">
            <h3>{isNewAdmin ? language.t("ui.admin.actions.addAdministrator") : language.t("ui.admin.modal.title")}</h3>
            
            <div class="edit-grid">
                <div class="edit-field">
                    <label for="role-select">{language.t("ui.admin.fields.role")}</label>
                    <select id="role-select" class="light-input select-input" bind:value={selectedAdmin.role}>
                        <option value="Власник">{language.t("ui.admin.roles.owner")}</option>
                        <option value="Адмін">{language.t("ui.admin.roles.admin")}</option>
                        <option value="Сервіс">{language.t("ui.admin.roles.service")}</option>
                    </select>
                </div>
                <div class="edit-field">
                    <label for="name-input">{language.t("ui.shared.fields.firstName")}</label>
                    <input id="name-input" type="text" class="light-input" bind:value={adminName} placeholder={language.t('ui.shared.fields.firstName')}>
                </div>
                <div class="edit-field">
                    <label for="surname-input">{language.t("ui.admin.fields.lastName")}</label>
                    <input id="surname-input" type="text" class="light-input" bind:value={adminSurname} placeholder={language.t('ui.admin.fields.lastName')}>
                </div>
                <div class="edit-field">
                    <label for="phone-input">{language.t("ui.shared.fields.phone")}</label>
                    <input id="phone-input" type="text" class="light-input" bind:value={selectedAdmin.phone} placeholder={language.t('ui.shared.fields.phone')}>
                </div>
                <div class="edit-field">
                    <label for="email-input">{language.t("ui.admin.fields.emailWithColon")}</label>
                    <input id="email-input" type="email" class="light-input" bind:value={selectedAdmin.email} placeholder={language.t('ui.admin.placeholders.email')}>
                </div>
                <div class="edit-field">
                    <label for="card-input">{language.t("ui.admin.fields.specialCard")}</label>
                    <input id="card-input" type="text" class="light-input" bind:value={selectedAdmin.card} placeholder="000 000 000 0000">
                    {#if String(selectedAdmin.card ?? '').trim() !== initialCard}
                        <p class="card-feedback">{language.t('review.adminCardPending')}</p>
                    {/if}
                </div>
                <div class="edit-field full-row">
                    <label for="password-input">{language.t("ui.admin.fields.password")}</label>
                    <div class="password-group">
                        <input id="password-input" type={showPassword ? "text" : "password"} autocomplete="new-password" class="light-input password-input-field" bind:value={adminPassword} placeholder={isNewAdmin ? language.t("ui.admin.fields.newPassword") : language.t("ui.admin.password.keepUnchanged")}>
                        <button type="button" class="gen-btn" onclick={generatePassword}>{language.t("ui.admin.actions.generatePassword")}</button>
                        <button type="button" class="eye-btn-light" onclick={() => showPassword = !showPassword}>
                             {#if showPassword}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                             {:else}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                             {/if}
                        </button>
                    </div>
                </div>
                <div class="edit-field full-row">
                    <label for="confirm-password-input">{language.t("ui.admin.fields.passwordConfirmation")}</label>
                    <input id="confirm-password-input" type={showPassword ? "text" : "password"} autocomplete="new-password" class="light-input" bind:value={adminConfirmPassword} placeholder={isNewAdmin ? language.t("ui.admin.placeholders.confirmPassword") : language.t("ui.admin.password.newOnlyHint")}>
                </div>
            </div>

            <div class="edit-actions">
                <button class="btn-submit" disabled={isSaving} onclick={saveAdmin}>{isSaving ? language.t("ui.admin.states.saving") : language.t("ui.admin.actions.submit")}</button>
                <button class="btn-cancel-light" disabled={isSaving} onclick={closeModal}>{language.t("ui.admin.actions.cancel")}</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .card-feedback { margin: 0 0 12px; color: var(--text-main); font-size: 13px; line-height: 1.5; }
    :global(:root) {
        --bg-page: #f4f7f6;
        --bg-card: #ffffff;
        --text-main: #1e293b;
        --text-muted: #64748b;
        
        --border-color: #e2e8f0;
        --border-table: rgba(0, 0, 0, 0.05);
        
        --input-bg: #f8fafc;
        --input-bg-alt: #f1f5f9;
        --input-text: #1e293b;
        
        --dropdown-active-bg: #e0f2fe;
        --dropdown-active-text: #0369a1;
        
        --panel-bg: #0B0B0B;
        --stat-item-bg: #1a222d;
        --stat-border: #000000;
    }

    :global(html.dark) {
        --bg-page: #0f172a;
        --bg-card: #1e293b;
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        
        --border-color: rgba(255, 255, 255, 0.1);
        --border-table: rgba(255, 255, 255, 0.05);
        
        --лет-input-dark-fix: #0f172a;
        --input-bg: #0f172a;
        --input-bg-alt: #0f172a; 
        --input-text: #f8fafc;
        
        --dropdown-active-bg: rgba(14, 165, 233, 0.15);
        --dropdown-active-text: #38bdf8;
        
        --panel-bg: #1e293b;
        --stat-item-bg: #0f172a;
        --stat-border: rgba(255, 255, 255, 0.05);
    }

    .admin-page-container { display: flex; justify-content: flex-start; align-items: flex-start; gap: 24px; width: 100%; margin-top: 10px; transition: filter 0.3s ease, opacity 0.3s ease; box-sizing: border-box; }
    .blurred-content { filter: blur(8px); opacity: 0.6; pointer-events: none; }
    .sortable-th { cursor: pointer; user-select: none; transition: color 0.2s ease; }
    .sortable-th:hover { color: var(--text-main); }
    .th-sort-content { display: inline-flex; align-items: center; gap: 6px; }
    .sort-arrow { font-size: 11px; font-weight: 700; color: var(--text-muted); transition: transform 0.2s ease, color 0.2s ease; display: inline-block; }
    .sort-arrow.active { color: var(--text-main); }
    .sort-arrow.desc { transform: rotate(180deg); }
    .role-th-container { position: relative; }
    .filter-indicator { font-size: 9px; margin-left: 2px; color: var(--text-muted); }
    .active-filter-badge { font-size: 11px; color: #0ea5e9; text-transform: none; font-weight: 500; margin-left: 4px; }
    .search-row th { padding: 4px 8px 12px 8px; border-bottom: 1px solid var(--border-table); }
    
    .table-search-input { background-color: var(--input-bg-alt); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; border: 1px solid transparent; border-radius: 20px; padding: 6px 32px 6px 14px; font-size: 13px; color: var(--text-main); outline: none; width: 100%; max-width: 140px; box-sizing: border-box; transition: all 0.2s ease; }
    .table-search-input::placeholder { color: var(--text-muted); }
    .table-search-input:focus { background-color: var(--bg-card); border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.1); }
    
    .role-filter-dropdown { position: absolute; top: 100%; left: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); padding: 6px; z-index: 50; display: flex; flex-direction: column; gap: 2px; min-width: 130px; margin-top: 4px; }
    .role-filter-dropdown button { background: transparent; border: none; text-align: left; padding: 8px 12px; font-size: 13px; color: var(--text-main); cursor: pointer; border-radius: 6px; font-weight: 500; transition: all 0.15s ease; }
    .role-filter-dropdown button:hover { background: var(--input-bg-alt); color: var(--text-main); }
    .role-filter-dropdown button.active { background: var(--dropdown-active-bg); color: var(--dropdown-active-text); }
    
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .edit-admin-panel { background: var(--bg-card); border-radius: 24px; padding: 32px; color: var(--text-main); width: 100%; max-width: 580px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3); box-sizing: border-box; }
    .edit-admin-panel h3 { margin-top: 0; margin-bottom: 24px; font-size: 22px; font-weight: 700; color: var(--text-main); }
    .edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
    .full-row { grid-column: span 2; }
    .edit-field { display: flex; flex-direction: column; gap: 6px; }
    .edit-field label { font-size: 13px; font-weight: 500; color: var(--text-muted); text-align: left; }
    
    .light-input { background: var(--input-bg) !important; border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 16px; color: var(--input-text) !important; font-size: 14px; outline: none; transition: border-color 0.2s, background-color 0.2s; width: 100%; box-sizing: border-box; height: 45px; }
    .light-input:-webkit-autofill, .light-input:-webkit-autofill:hover, .light-input:-webkit-autofill:focus { -webkit-text-fill-color: var(--input-text) !important; -webkit-box-shadow: 0 0 0px 1000px var(--input-bg) inset !important; transition: background-color 5000s ease-in-out 0s; }
    .select-input { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px; cursor: pointer; }
    .light-input:focus { border-color: #5ebfff; background: var(--input-bg) !important; }
    
    .password-group { display: flex; gap: 8px; width: 100%; }
    .password-input-field { flex: 1; min-width: 0; }
    .gen-btn { background: var(--input-bg-alt); border: 1px solid var(--border-color); color: var(--text-main); padding: 0 16px; border-radius: 12px; cursor: pointer; font-size: 13px; font-weight: 600; white-space: nowrap; flex-shrink: 0; transition: background 0.2s; height: 45px; }
    .gen-btn:hover { background: var(--border-color); }
    .eye-btn-light { background: var(--input-bg-alt); border: 1px solid var(--border-color); padding: 0 14px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; height: 45px; }
    .eye-btn-light:hover { background: var(--border-color); }
    
    .edit-actions { display: flex; gap: 12px; margin-top: 10px; }
    .btn-submit { background: #5ebfff; color: #000000; border: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; transition: background 0.2s; }
    .btn-submit:hover { background: #4db3f0; }
    .btn-cancel-light { background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-muted); padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; }
    .btn-cancel-light:hover { background: var(--input-bg-alt); }
    
    .table-block { flex: 1; background: var(--bg-card); border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); box-sizing: border-box; overflow: hidden; }
    .table-header h2 { font-size: 18px; font-weight: 700; color: var(--text-main); margin: 0 0 16px 0; text-align: left; }
    .table-wrapper { width: 100%; overflow-x: auto; min-height: 250px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; color: var(--text-muted); font-size: 12px; font-weight: 600; padding: 12px 8px; border-bottom: 1px solid var(--border-table); text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 16px 8px; font-size: 14px; color: var(--text-main); border-bottom: 1px solid var(--border-table); white-space: nowrap; text-align: left; }
    
    .font-medium { font-weight: 500; color: var(--text-main); }
    .text-gray { color: var(--text-muted); }
    .text-right { text-align: right; }
    .w-50 { width: 50px; }
    .cell-with-icon { display: flex; align-items: center; gap: 8px; }
    
    .badge { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block; min-width: 75px; text-align: center; border: none; }
    .badge.admin { background: #e0f2fe; color: #0ea5e9; }
    .badge.service { background: #ffedd5; color: #f97316; }
    .badge.owner { background: #dcfce7; color: #22c55e; }
    
    .empty-state { text-align: center; color: var(--text-muted); padding: 40px 0; font-style: italic; }
    .side-panel { width: 250px; flex-shrink: 0; box-sizing: border-box; }
    .black-card { background: var(--panel-bg); border-radius: 16px; padding: 6px; display: flex; flex-direction: column; box-sizing: border-box; }
    .btn-add-main { background: #5ebfff; color: #000; border: none; border-radius: 12px; padding: 14px 18px; font-weight: 700; font-size: 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; margin-bottom: 8px; width: 100%; text-align: left; box-sizing: border-box;}
    
    .stat-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--stat-item-bg); border-top: 1px solid var(--stat-border); box-sizing: border-box; }
    .stat-item:first-of-type { border-radius: 12px 12px 0 0; border-top: none; }
    .stat-item:last-child { border-radius: 0 0 12px 12px; }
    .stat-val { color: white; font-size: 22px; font-weight: 800; line-height: 1; }
    .stat-info { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
    .stat-desc { color: #94a3b8; font-size: 12px; text-align: left; }
    
    .stat-icon { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon.gray { background: #334155; }
    .stat-icon.blue { background: #0ea5e9; }
    .stat-icon.house { background: #0369a1; }
    
    .action-group { display: flex; justify-content: flex-end; gap: 12px; }
    .icon-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 4px; transition: color 0.2s; }
    .icon-btn.edit:hover { color: #5ebfff; }
    .icon-btn.delete:hover { color: #ef4444; }
    
    .add-card-btn { background: var(--bg-card); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: background 0.2s; color: var(--text-main); }
    .add-card-btn:hover { background: var(--input-bg-alt); }
    .box-btn-minimal, .copy-btn-minimal { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; opacity: 0.7; transition: opacity 0.2s; color: var(--text-muted); }
    .copy-btn-minimal:hover { opacity: 1; color: var(--text-main); }

  .table-block { min-width: 0; }
  .edit-admin-panel { max-width: calc(100vw - 24px); max-height: calc(100dvh - 24px); overflow-y: auto; }
  @media(max-width:1024px) { .admin-page-container { flex-direction: column; } .table-block, .side-panel { width: 100%; } }
  @media(max-width:600px) { .edit-admin-panel { padding: 18px; } .edit-grid { grid-template-columns: minmax(0,1fr); } .edit-actions { flex-wrap: wrap; gap: 10px; } .table-header { flex-wrap: wrap; gap: 10px; } .password-group { flex-wrap: wrap; } .password-input-field { flex-basis: 100%; } }

  table { min-width: 880px; }
</style>
