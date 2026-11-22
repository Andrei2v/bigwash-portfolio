<script>
  import { horizontalScroll } from '$lib/actions/horizontal-scroll.js';
  const scrollLabels = $derived({ hint: language.t('review.scrollColumns'), previous: language.t('review.scrollPrevious'), next: language.t('review.scrollNext') });
  import { language } from '$lib/localisation/language.svelte.js';
  import { untrack, tick } from 'svelte';
  import { Trash2 } from 'lucide-svelte';
  import { LOCAL_MODE } from '$lib/api/client.js';
  import { createDevConfig, initialEquipment, validEquipment, equipmentDeleteError,
    initialUsbConfig, validUsbConfig, validMedia, RELAY_SLOT_COUNT, relaySlot, relayAssignmentError,
    initialServicePrograms, validServicePrograms, pultDataDefaults, validPultData } from '$lib/dev-config.js';
  import { promo } from '$lib/stores/promo.svelte.js';
  import UsbPortFields from './UsbPortFields.svelte';
  import MediaEditor from './MediaEditor.svelte';
  import { createMediaStore } from '$lib/media.js';
  import { initialPultPrograms, validPultPrograms, pultProgramsError } from '$lib/dev-config.js';
  let { 
    isOpen = false, 
    pultData = {
      name: 'Пульт 1',
      mediaEnabled: true,
      mediaText: 'Вітаємо на нашій автомийці! Гарного дня!',
      settings: { timer: 15, login: 'panel_1' }
    }, 
    close = () => {},
    onDataSaved = () => {}
  } = $props();

  const tabs = [
    { id: 'media', label: 'Медіа', icon: '📁' },
    { id: 'data', label: 'Дані', icon: '📄' },
    { id: 'equipment', label: 'Обладнання', icon: '☁️' },
    { id: 'operations', label: 'Операції', icon: '💰' },
    { id: 'kassa', label: 'Каса ПРРО', icon: '✔️' },
    { id: 'programs', label: 'Програми', icon: '⚙️' },
    { id: 'actions', label: 'Дії', icon: '🪄' },
    { id: 'usb', label: 'USB', icon: '🔗' }
  ];

  let activeTab = $state('actions'); 
  let tabsElement = $state();
  $effect(() => {
    if (isOpen && tabsElement && activeTab) {
      untrack(() => tick().then(scrollToActiveTab));
    }
  });
  function scrollToActiveTab() {
    const active = tabsElement?.querySelector('[aria-pressed="true"]');
    if (!active) return;
    const tab = active.getBoundingClientRect();
    const viewport = tabsElement.getBoundingClientRect();
    // Revealing a tab must not scroll the document or shift the modal vertically.
    if (tab.left < viewport.left) tabsElement.scrollLeft -= viewport.left - tab.left;
    else if (tab.right > viewport.right) tabsElement.scrollLeft += tab.right - viewport.right;
  }
  let infoExpanded = $state(false);
  let programStore;
  let programsReady = $state(false);
  let programsSaved = $state(structuredClone(initialPultPrograms));
  let programs = $state(structuredClone(initialPultPrograms));
  let programDraft = $state(null);
  let assignment = $state(null);
  let programsError = $state('');
  let programsFeedback = $state('');
  const programsDirty = $derived(JSON.stringify(programs) !== JSON.stringify(programsSaved));
  const programDialogOpen = $derived(!!programDraft || !!assignment);
  $effect(() => {
    if (programDialogOpen) untrack(() => tick().then(() => document.querySelector('.program-dialog input')?.focus()));
  });
  let showPrroPassword = $state(false);
  let dataStore;
  let dataReady = $state(false);
  let dataSaved = $state(pultDataDefaults({}));
  let dataDraft = $state(pultDataDefaults({}));
  let newPassword = $state('');
  let dataError = $state('');
  let dataFeedback = $state('');
  let showCardHelp = $state(false);
  const dataDirty = $derived(JSON.stringify(dataDraft) !== JSON.stringify(dataSaved) || newPassword !== '');
  const cardHelp = $derived(language.current === 'RU'
    ? 'Если включено, пустые карты записываются как карты этой мойки. Если выключено, незарегистрированную карту сначала нужно зарегистрировать на сервере.'
    : 'Якщо увімкнено, порожні картки записуються як картки цієї мийки. Якщо вимкнено, незареєстровану картку спочатку потрібно зареєструвати на сервері.');

  // Fiscal-service fixtures are separate from the application's authentication session.
  let prroData = $state({
    enabled: true,
    testMode: false,
    login: 'Pult1',
    password: '••••',
    licenseKey: '5847-9264-1043-8572-XXXXXXXX',
    token: 'eyJhbgGciOiJIUzl1NiJ9.eyJ1c2VySWQi...',
    host: '192.168.3.10',
    port: '3939',
    printer: 'POS-CityFoodv6',
    paypassIp: '10.1.1.2',
    paypassPort: '2000',
    paypassMid: 'S10SODA7'
  });
  const prroSaved = untrack(() => JSON.stringify($state.snapshot(prroData)));
  const prroDirty = $derived(JSON.stringify(prroData) !== prroSaved);

  const prroHistory = [
    { id: 1, check: 'Звіт', opType: 'Службове внесення', sum: '1000.00 грн', status: 'Відправлено', isError: false },
    { id: 2, check: 'Звіт', opType: 'x-звіт', sum: '0.00 грн', status: 'Відправлено', isError: false },
    { id: 3, check: 'Звіт', opType: 'Службове видання', sum: '1000.00 грн', status: 'Помилка виконання', isError: true }
  ];

  let maintenanceHistory = $state([
    { id: 1, name: 'BIG WASH', task: 'Планова заміна мастила високого тиску', plan: 100, fact: 100, date: '28.12.2024' },
    { id: 2, name: 'Pult2', task: 'Діагностика та чищення клапанів піни', plan: 100, fact: 25, date: '28.12.2024' }
  ]);

  const operationsStats = [
    { icon: '💧', title: 'Вода під тиском', sub: 'Найпопулярніша программа' },
    { icon: '🔢', title: '6 860', sub: 'Усього операцій' },
    { icon: '👥', title: '2', sub: 'Клієнтів на пульті за місяць' },
    { icon: '💵', title: '1 995', sub: 'В касі готівкою' }
  ];

  const operationsTable = [
    { id: 1, name: 'Вода під тиском', price: '11.00 грн/хв', sum: '496 373.04', time: '45 124' },
    { id: 2, name: 'Піна', price: '32.00 грн/хв', sum: '211 156.80', time: '6 598' },
    { id: 3, name: 'Рожева піна', price: '42.00 грн/хв', sum: '85 923.15', time: '2 045' },
    { id: 4, name: 'Осмос', price: '16.00 грн/хв', sum: '23 128.27', time: '1 445' }
  ];

  const cashNominals = [
    { val: 1, count: 0 }, { val: 2, count: 0 }, { val: 5, count: 1 },
    { val: 10, count: 0 }, { val: 20, count: 2 }, { val: 50, count: 5 },
    { val: 100, count: 5 }, { val: 200, count: 6 }, { val: 500, count: 0 },
    { val: 1000, count: 0 }
  ];

  let autoZReportTime = $state('00:00');
  let usbSaved = $state(structuredClone(initialUsbConfig));
  let usbConfig = $state(structuredClone(initialUsbConfig));
  // Compare values, not focus/touch events; reverting a field clears the warning.
  const usbDirty = $derived(JSON.stringify(usbConfig) !== JSON.stringify(usbSaved));
  let usbStore;
  let equipmentStore;
  let usbReady = $state(false);
  let equipmentReady = $state(false);
  let usbError = $state('');
  let usbFeedback = $state('');
  let equipmentError = $state('');
  let equipmentFeedback = $state('');
  let equipment = $state(structuredClone(initialEquipment));
  let selectedEquipmentId = $state('preview-1');
  let equipmentDraft = $state(null);
  const selectedEquipment = $derived(equipment.find(node => node.id === selectedEquipmentId));
  const relaySlots = $derived(Array.from({ length: RELAY_SLOT_COUNT }, (_, index) => ({
    number: index + 1, nodes: equipment.filter(node => relaySlot(node.relay) === index + 1)
  })));
  const freeRelayCount = $derived(relaySlots.filter(slot => !slot.nodes.length).length);
  let serviceStore;
  let serviceReady = $state(false);
  let serviceSaved = $state(structuredClone(initialServicePrograms));
  let serviceDraft = $state(structuredClone(initialServicePrograms));
  let serviceError = $state('');
  let serviceFeedback = $state('');
  const serviceDirty = $derived(JSON.stringify(serviceDraft) !== JSON.stringify(serviceSaved));
  let mediaStore;
  let mediaReady = $state(false);
  let mediaSaved = $state({ enabled: true, text: '', images: [] });
  let mediaDraft = $state({ enabled: true, text: '', images: [] });
  let mediaError = $state('');
  let mediaFeedback = $state('');
  let mediaSaving = $state(false);
  let mediaBusy = $state(false);
  let configGeneration = 0;
  const mediaFingerprint = value => JSON.stringify({ ...value, images: value.images.map(image => image.id) });
  const mediaDirty = $derived(mediaFingerprint(mediaDraft) !== mediaFingerprint(mediaSaved));

  $effect(() => {
    if (isOpen) {
      const id = pultData.id;
      // Reopening selects fresh saved drafts; language/tab changes must not reset them.
      untrack(() => loadConfigs(id));
    }
  });

  function loadConfigs(id) {
    const generation = ++configGeneration;
    dataReady = false;
    dataError = dataFeedback = newPassword = '';
    showCardHelp = false;
    dataSaved = pultDataDefaults(pultData);
    prroData = JSON.parse(prroSaved);
    programDraft = assignment = null;
    programsError = programsFeedback = '';
    programsReady = false;
    programsSaved = structuredClone(initialPultPrograms);
    equipmentDraft = null;
    equipmentFeedback = usbFeedback = mediaFeedback = '';
    equipmentError = usbError = mediaError = '';
    equipmentReady = usbReady = mediaReady = false;
    serviceReady = false;
    serviceError = serviceFeedback = '';
    serviceSaved = structuredClone(initialServicePrograms);
    promo.load();
    equipment = structuredClone(initialEquipment);
    usbSaved = structuredClone(initialUsbConfig);
    const initialMedia = { enabled: pultData.mediaEnabled ?? true, images: [],
      text: pultData.mediaText ?? 'Вітаємо на нашій автомийці! Гарного дня!' };
    mediaSaved = initialMedia;
    if (LOCAL_MODE && id != null) {
      dataStore = createDevConfig(`bigwash.local.v1.pultData.${id}`, pultDataDefaults(pultData), validPultData);
      try { dataSaved = dataStore.load(); dataReady = true; }
      catch (error) { dataError = error.message; }
      programStore = createDevConfig(`bigwash.local.v1.pultPrograms.${id}`, initialPultPrograms, validPultPrograms);
      try { programsSaved = programStore.load(); programsReady = true; }
      catch (error) { programsError = error.message; }
      equipmentStore = createDevConfig(`bigwash.local.v1.equipment.${id}`, initialEquipment, validEquipment);
      usbStore = createDevConfig(`bigwash.local.v1.usb.${id}`, initialUsbConfig, validUsbConfig);
      const legacyMedia = createDevConfig(`bigwash.local.v1.media.${id}`, initialMedia, validMedia);
      mediaStore = createMediaStore(id, legacyMedia);
      serviceStore = createDevConfig(`bigwash.local.v1.servicePrograms.${id}`, initialServicePrograms, validServicePrograms);
      try { equipment = equipmentStore.load(); equipmentReady = true; }
      catch (error) { equipmentError = error.message; }
      try { usbSaved = usbStore.load(); usbReady = true; }
      catch (error) { usbError = error.message; }
      mediaStore.load().then(value => {
        if (generation !== configGeneration || !isOpen) return;
        mediaSaved = value;
        mediaDraft = structuredClone(value);
        mediaReady = true;
      }).catch(error => { if (generation === configGeneration) mediaError = error.message; });
      try { serviceSaved = serviceStore.load(); serviceReady = true; }
      catch (error) { serviceError = error.message; }
    }
    selectedEquipmentId = equipment[0]?.id ?? '';
    dataDraft = structuredClone($state.snapshot(dataSaved));
    usbConfig = structuredClone($state.snapshot(usbSaved));
    mediaDraft = structuredClone($state.snapshot(mediaSaved));
    serviceDraft = structuredClone($state.snapshot(serviceSaved));
    programs = structuredClone($state.snapshot(programsSaved));
  }

  function savePrograms(next = $state.snapshot(programs)) {
    if (!programsReady) return false;
    programsFeedback = '';
    const error = pultProgramsError(next);
    if (error) { programsError = error; return false; }
    try {
      programStore.save(next);
      programsSaved = structuredClone(next);
      programs = structuredClone(next);
      programsError = '';
      programsFeedback = 'configSaved';
      return true;
    } catch (error) { programsError = error.message; return false; }
  }

  function openProgram(program = null) {
    programsError = programsFeedback = '';
    programDraft = program ? structuredClone($state.snapshot(program))
      : { id: `dev-${crypto.randomUUID()}`, name: '', button: null, active: true };
  }

  function saveProgramDraft(event) {
    event.preventDefault();
    if (!programDraft) return;
    const next = { ...$state.snapshot(programDraft), name: programDraft.name.trim() };
    const rows = programs.some(row => row.id === next.id)
      ? $state.snapshot(programs).map(row => row.id === next.id ? next : row)
      : [...$state.snapshot(programs), next];
    if (savePrograms(rows)) programDraft = null;
  }

  function saveAssignment(event) {
    event.preventDefault();
    const rows = $state.snapshot(programs).map(row => row.id === assignment.id ? { ...row, button: assignment.button ?? null } : row);
    if (savePrograms(rows)) assignment = null;
  }

  function deleteProgram(program) {
    if (!programsReady || !program.id.startsWith('dev-') || !confirm(language.t('review.programDeleteConfirm', { name: program.name }))) return;
    savePrograms($state.snapshot(programs).filter(row => row.id !== program.id));
  }

  function moveProgram(index, offset) {
    const next = $state.snapshot(programs);
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    programs = next;
    programsFeedback = '';
  }

  function setUsbPort(key, value) { usbConfig[key] = value; usbFeedback = ''; }

  function editEquipment(creating = false, slot = null) {
    if (!equipmentReady) return;
    equipmentError = equipmentFeedback = '';
    equipmentDraft = creating
      ? { id: `local-${crypto.randomUUID()}`, name: '', relay: String(slot ?? relaySlots.find(item => !item.nodes.length)?.number ?? ''), hours: 0 }
      : selectedEquipment ? structuredClone($state.snapshot(selectedEquipment)) : null;
  }

  function saveEquipment() {
    if (!equipmentReady || !equipmentDraft) return false;
    const node = { ...$state.snapshot(equipmentDraft), name: equipmentDraft.name.trim(), relay: equipmentDraft.relay.trim() };
    const next = equipment.some(item => item.id === node.id)
      ? equipment.map(item => item.id === node.id ? node : $state.snapshot(item))
      : [...$state.snapshot(equipment), node];
    if (!validEquipment(next)) { equipmentError = 'equipmentInvalid'; return false; }
    const assignmentError = relayAssignmentError(equipment, node);
    if (assignmentError) { equipmentError = assignmentError; return false; }
    try {
      equipmentStore.save(next);
      equipment = next;
      selectedEquipmentId = node.id;
      equipmentDraft = null;
      equipmentError = '';
      equipmentFeedback = 'configSaved';
      return true;
    } catch (error) { equipmentError = error.message; return false; }
  }

  function deleteEquipment() {
    if (!equipmentReady || !selectedEquipment || equipmentDraft) return;
    equipmentError = equipmentFeedback = '';
    const dependencyError = equipmentDeleteError(selectedEquipment);
    if (dependencyError) { equipmentError = dependencyError; return; }
    if (!confirm(language.t('review.equipmentDeleteConfirm', { name: selectedEquipment.name }))) return;
    const next = $state.snapshot(equipment).filter(node => node.id !== selectedEquipmentId);
    try {
      equipmentStore.save(next);
      equipment = next;
      selectedEquipmentId = next[0]?.id ?? '';
      equipmentFeedback = 'configSaved';
    } catch (error) { equipmentError = error.message; }
  }

  function cancelUsb() {
    usbConfig = structuredClone($state.snapshot(usbSaved));
    usbError = usbFeedback = '';
  }

  function cancelData() {
    dataDraft = structuredClone($state.snapshot(dataSaved));
    newPassword = dataError = dataFeedback = '';
  }

  function saveData() {
    dataFeedback = '';
    if (!dataReady) return false;
    // No terminal credential endpoint exists; never persist a password or claim it was changed.
    if (newPassword) { dataError = 'configUnavailable'; activeTab = 'data'; return false; }
    if (!validPultData(dataDraft)) { dataError = 'configInvalid'; activeTab = 'data'; return false; }
    try {
      const next = $state.snapshot(dataDraft);
      dataStore.save(next);
      dataSaved = structuredClone(next);
      dataDraft = structuredClone(next);
      dataError = '';
      dataFeedback = 'configSaved';
      onDataSaved(pultData.id, next);
      return true;
    } catch (error) { dataError = error.message; activeTab = 'data'; return false; }
  }

  function saveUsb() {
    usbFeedback = '';
    if (!usbReady) return false;
    if (!validUsbConfig(usbConfig)) { usbError = 'usbInvalid'; return false; }
    try {
      usbStore.save(usbConfig);
      usbSaved = structuredClone($state.snapshot(usbConfig));
      usbError = '';
      usbFeedback = 'configSaved';
      return true;
    } catch (error) { usbError = error.message; return false; }
  }

  async function saveAndClose() {
    if (mediaSaving || mediaBusy) return;
    if (programDraft || assignment) return;
    if (dataDirty && !saveData()) return;
    if (programsDirty && !savePrograms()) return;
    if (equipmentDraft && !saveEquipment()) return;
    if (usbDirty && !saveUsb()) return;
    if (mediaDirty && !await saveMedia()) return;
    if (serviceDirty && !saveServicePrograms()) return;
    close();
  }

  function saveServicePrograms() {
    serviceFeedback = '';
    if (!serviceReady) return false;
    if (!validServicePrograms(serviceDraft)) { serviceError = 'pauseInvalid'; return false; }
    try {
      serviceStore.save(serviceDraft);
      serviceSaved = structuredClone($state.snapshot(serviceDraft));
      serviceError = '';
      serviceFeedback = 'configSaved';
      return true;
    } catch (error) { serviceError = error.message; return false; }
  }

  async function saveMedia() {
    mediaFeedback = '';
    if (!mediaReady || mediaBusy || mediaSaving) return false;
    mediaSaving = true;
    try {
      const value = await mediaStore.save($state.snapshot(mediaDraft));
      mediaSaved = structuredClone(value);
      mediaDraft = structuredClone(value);
      pultData.mediaEnabled = mediaDraft.enabled;
      pultData.mediaText = mediaDraft.text;
      mediaError = '';
      mediaFeedback = 'configSaved';
      return true;
    } catch (error) { mediaError = error.message; return false; }
    finally { mediaSaving = false; }
  }

  function cancelMedia() {
    if (mediaSaving || mediaBusy) return;
    mediaDraft = structuredClone($state.snapshot(mediaSaved));
    mediaError = mediaFeedback = '';
  }

  function requestClose() { if (!mediaSaving && !mediaBusy) { cancelData(); close(); } }

  function handleEscape(event) {
    if (event.key !== 'Escape' || !isOpen) return;
    if (programDraft || assignment) { programDraft = assignment = null; programsError = ''; }
    else requestClose();
  }

  function copyText(text) {
    navigator.clipboard?.writeText(text);
  }
</script>

<svelte:window onkeydown={handleEscape} onresize={scrollToActiveTab}/>

{#if isOpen}
<div class="modal-overlay" onclick={requestClose} role="presentation">
  <div class="modal-container" onclick={(e) => e.stopPropagation()} role="presentation">
    
    <aside class="side-info" class:expanded={infoExpanded}>
      <button class="info-toggle" aria-expanded={infoExpanded} onclick={() => infoExpanded = !infoExpanded}>{pultData.name} <span>{infoExpanded ? '−' : '+'}</span></button>
      <div class="info-details">
      <div class="side-card main-stats">
        <div class="brand-badge">
          <span class="car-icon">🚗</span>
          <span class="brand-name">{language.t("ui.shared.brand.washName")}</span>
        </div>
        <div class="stats-compact">
          <div class="stat-item-mini">
            <span class="icon">💳</span>
            <div class="txt"><strong>150</strong><small>{language.t("ui.pult.summary.totalWashes")}</small></div>
          </div>
          <div class="stat-item-mini">
            <span class="icon">👥</span>
            <div class="txt"><strong>1200</strong><small>{language.t("ui.pult.summary.balance")}</small></div>
          </div>
        </div>
      </div>

      <div class="side-card info-list-compact">
        <div class="row-c"><span>{language.t("ui.pult.fields.modelWithColon")}</span> <strong>{language.t("ui.pult.fields.buttonModel")}</strong></div>
        <div class="row-c"><span>{language.t("ui.shared.fields.nameWithColon")}</span> <button class="copy-val-btn" onclick={() => copyText(pultData.name)}>{pultData.name} 📋</button></div>
        <div class="row-c"><span>{language.t("ui.pult.fields.washWithColon")}</span> <span class="val orange">{language.t("ui.pult.samples.washNameWithSettings")}</span></div>
        <div class="row-c"><span>{language.t("ui.pult.fields.loginWithColon")}</span> <button class="copy-val-btn" onclick={() => copyText(dataSaved.settings.login)}>{dataSaved.settings.login || language.t('pultsModal.side.noData')} 📋</button></div>
        <div class="row-c"><span>{language.t("ui.pult.fields.ipAddressWithColon")}</span> <button class="copy-val-btn" onclick={() => copyText('192.168.7.7:3003')}>192.168.7.7:3003 📋</button></div>
        <div class="row-c"><span>{language.t("ui.pult.data.cashRegisterLoginWithColon")}</span> <button class="copy-val-btn" onclick={() => copyText(prroData.login)}>{prroData.login || language.t("ui.pult.prro.options.none")} 📋</button></div>
      </div>

      <div class="side-card status-group-compact">
        <div class="st-line"><span class="dot blue">{language.t("ui.pult.status.icons.pult")}</span> <span class="lab">{language.t("ui.pult.status.pultWithColon")}</span> <span class="msg green">{language.t("ui.pult.status.healthy")}</span></div>
        <div class="st-line"><span class="dot l-blue">$</span> <span class="lab">{language.t("ui.pult.status.cashWithColon")}</span> <span class="msg red">{language.t("ui.pult.status.errorWithWarning")}</span></div>
        <div class="st-line"><span class="dot green-d">{language.t("ui.pult.status.icons.relay")}</span> <span class="lab">{language.t("ui.pult.status.relayWithColon")}</span> <span class="msg green">{language.t("ui.pult.status.healthy")}</span></div>
        <div class="st-line"><span class="dot blue">{language.t("ui.pult.status.icons.buttonBoard")}</span> <span class="lab">{language.t("ui.pult.status.buttonBoardWithColon")}</span> <span class="msg green">{language.t("ui.pult.status.healthy")}</span></div>
      </div>

      </div>
    </aside>

    <main class="content-area">
      <nav class="tabs-header" bind:this={tabsElement}>
        {#each tabs as tab}
          <button class="tab-btn" aria-pressed={activeTab === tab.id} class:active={activeTab === tab.id} onclick={() => activeTab = tab.id}>
            <span class="tab-icon">{tab.icon}</span>
            <span class="tab-label">{language.translate(tab.label)}</span>
          </button>
        {/each}
      </nav>

      <div class="scroll-body">
        
        {#if activeTab === 'media'}
          <div class="tab-view-container">
            <h2 class="title">{language.t("ui.pult.media.title")}</h2>
            <div class="config-card">
              <label class="toggle-row">
                <input type="checkbox" bind:checked={mediaDraft.enabled} disabled={!mediaReady}>
                <span class="track"></span>
                <span class="label-text">{language.t("ui.pult.media.fields.enableMessage")}</span>
              </label>
              <div class="input-box-full">
                <label class="field-title" for="media-text">{language.t("ui.pult.media.fields.message")}</label>
                <MediaEditor value={mediaDraft} disabled={!mediaReady || mediaSaving} onchange={value => { mediaDraft = value; mediaFeedback = ''; }} onbusy={value => mediaBusy = value} />
                <p class="field-title">{language.t(LOCAL_MODE ? 'review.mediaVisualLocal' : 'review.configUnavailable')}</p>
                {#if mediaError}<p class="text-red" role="alert">{language.t(`review.${mediaError}`)}</p>{/if}
                {#if mediaFeedback && !mediaDirty}<p class="text-green" role="status">{language.t(`review.${mediaFeedback}`)}</p>{/if}
                <div class="eq-actions">
                  <button class="btn-save-section" disabled={!mediaReady || !mediaDirty || mediaSaving || mediaBusy} onclick={saveMedia}>{language.t('review.configSave')}</button>
                  <button class="btn-cancel-section" disabled={mediaSaving || mediaBusy} onclick={cancelMedia}>{language.t('ui.shared.actions.cancel')}</button>
                </div>
              </div>
            </div>
          </div>


        {:else if activeTab === 'data'}
          <div class="tab-view-container data-view">
            <div class="data-header">
              <h2 class="title">{language.t('ui.pult.data.title')}</h2>
              {#if dataDirty}<span class="unsaved-warning">{language.t('ui.shared.unsavedChanges.title')}</span>{/if}
            </div>
            <div class="data-context">
              <p class="field-title" data-promo-active={promo.applies(pultData.id)}>
                Promo: {language.t(promo.applies(pultData.id) ? 'review.discountEnabled' : 'review.discountDisabled')}
                · {language.t(promo.config.scope === 'global' ? 'review.promoGlobal' : 'review.promoIndividual')}
              </p>
              <p class="field-title">{language.t(LOCAL_MODE ? 'review.promoPultHint' : 'review.configUnavailable')}</p>
              {#if promo.error}<p class="text-red" role="alert">{language.t('review.' + promo.error)}</p>{/if}
            </div>
            <form class="config-card data-card" onsubmit={event => { event.preventDefault(); saveData(); }}>
              <div class="field-row">
                <label for="pult-name-input">{language.t('ui.pult.fields.pultName')}</label>
                <input id="pult-name-input" type="text" class="bordered-input" bind:value={dataDraft.name} disabled={!dataReady}>
              </div>
              <div class="field-row">
                <label for="pult-timer-input">{language.t('ui.pult.data.fields.startDelaySeconds')}</label>
                <input id="pult-timer-input" type="number" min="0" step="1" class="bordered-input" bind:value={dataDraft.settings.timer} disabled={!dataReady}>
              </div>
              <div class="toggles-stack data-toggles">
                <button id="pult-take-money" type="button" role="switch" class="toggle-row data-toggle" aria-checked={dataDraft.settings.takeOffMoney} disabled={!dataReady} onclick={() => dataDraft.settings.takeOffMoney = !dataDraft.settings.takeOffMoney}>
                  <span class="track"></span><span class="label-text">{language.t('ui.pult.data.forceDeduction')}</span>
                </button>
                <div class="data-record-row">
                  <button id="pult-record-mode" type="button" role="switch" class="toggle-row data-toggle" aria-checked={dataDraft.settings.cardRecordMode} disabled={!dataReady} onclick={() => dataDraft.settings.cardRecordMode = !dataDraft.settings.cardRecordMode}>
                    <span class="track"></span><span class="label-text">{language.t('ui.pult.data.serviceCardWritingMode')}</span>
                  </button>
                  <button type="button" class="help-icon card-record-help" aria-label={language.t('ui.programs.actions.help')} aria-expanded={showCardHelp} aria-controls="pult-card-help" onclick={() => showCardHelp = !showCardHelp}>?</button>
                </div>
                {#if showCardHelp}<p id="pult-card-help" class="data-help" role="note">{cardHelp} {language.t('review.pultConfigLocal')}</p>{/if}
              </div>
              <div class="auth-section">
                <div class="auth-col">
                  <label for="pult-login-input" class="field-title">{language.t('ui.pult.data.loginHint')}</label>
                  <input id="pult-login-input" type="text" class="underline-input" autocomplete="username" spellcheck="false" bind:value={dataDraft.settings.login} disabled={!dataReady}>
                </div>
                <div class="auth-col">
                  <label for="pult-password-input" class="field-title">{language.t('ui.pult.data.passwordHint')}</label>
                  <div class="pass-wrapper">
                    <input id="pult-password-input" type="password" class="underline-input" autocomplete="new-password" bind:value={newPassword} disabled={!dataReady} placeholder={language.t('ui.admin.password.keepUnchanged')} title={language.t('review.configUnavailable')} oninput={() => dataError = ''}>
                  </div>
                </div>
              </div>
              <p class="field-title">{language.t(LOCAL_MODE ? 'review.pultConfigLocal' : 'review.configUnavailable')}</p>
              {#if dataError}<p class="text-red" role="alert">{language.t('review.' + dataError)}</p>{/if}
              {#if dataFeedback && !dataDirty}<p class="text-green" role="status">{language.t('review.' + dataFeedback)}</p>{/if}
              <div class="eq-actions data-actions">
                <button type="submit" class="btn-save-section" disabled={!dataReady || !dataDirty}>{language.t('ui.shared.actions.save')}</button>
                <button type="button" class="btn-cancel-section" onclick={cancelData}>{language.t('ui.shared.actions.cancel')}</button>
              </div>
            </form>
          </div>

        {:else if activeTab === 'equipment'}
          <div class="tab-view-container">
            <h2 class="title">{language.t("ui.pult.equipment.title")}</h2>
            <p class="field-title">{language.t(LOCAL_MODE ? 'review.pultConfigLocal' : 'review.configUnavailable')}</p>
            <p class="field-title">{language.t('review.relaySlotsSummary', { free: freeRelayCount, occupied: RELAY_SLOT_COUNT - freeRelayCount })}</p>
            <div class="relay-slots" aria-label={language.t('review.relaySlots')}>
              {#each relaySlots as slot}
                <button class:occupied={slot.nodes.length > 0} class:conflict={slot.nodes.length > 1}
                  disabled={!equipmentReady || !!equipmentDraft} title={slot.nodes.map(node => node.name).join(', ')}
                  onclick={() => { if (slot.nodes.length) selectedEquipmentId = slot.nodes[0].id; else editEquipment(true, slot.number); }}>
                  R{slot.number}<small>{language.t(slot.nodes.length > 1 ? 'review.relayConflict' : slot.nodes.length ? 'review.relayOccupied' : 'review.relayFree')}</small>
                </button>
              {/each}
            </div>
            {#if equipmentError}<p class="text-red" role="alert">{language.t(`review.${equipmentError}`)}</p>{/if}
            {#if equipmentFeedback && !equipmentDraft}<p class="text-green" role="status">{language.t(`review.${equipmentFeedback}`)}</p>{/if}
            <div class="eq-field">
              <label for="equipment-select">{language.t('review.equipmentList')}</label>
              <select id="equipment-select" class="bordered-input" bind:value={selectedEquipmentId} disabled={!!equipmentDraft}>
                {#each equipment as node (node.id)}<option value={node.id}>{node.name}</option>{/each}
              </select>
            </div>
            {#if equipmentDraft || selectedEquipment}
            <div class="eq-layout">
              <div class="eq-form">
                <div class="eq-field">
                  <label for="equipment-name">{language.t("ui.pult.equipment.fields.moduleName")}</label>
                  {#if equipmentDraft}
                    <input id="equipment-name" type="text" bind:value={equipmentDraft.name} class="bordered-input">
                  {:else}
                    <input id="equipment-name" type="text" value={selectedEquipment.name} readonly class="bordered-input">
                  {/if}
                </div>
                <div class="eq-field">
                  <label for="equipment-relay">{language.t('review.relaySlot')}</label>
                  {#if equipmentDraft}
                    <select id="equipment-relay" bind:value={equipmentDraft.relay} class="bordered-input">
                      {#if !relaySlot(equipmentDraft.relay)}<option value={equipmentDraft.relay} disabled>{language.t('review.relayLegacy', { value: equipmentDraft.relay })}</option>{/if}
                      {#each relaySlots as slot}<option value={String(slot.number)} disabled={slot.nodes.some(node => node.id !== equipmentDraft.id)}>R{slot.number} · {language.t(slot.nodes.some(node => node.id !== equipmentDraft.id) ? 'review.relayOccupied' : 'review.relayFree')}</option>{/each}
                    </select>
                  {:else}
                    <input id="equipment-relay" type="text" value={selectedEquipment.relay} readonly class="bordered-input">
                  {/if}
                </div>
                <div class="eq-field">
                  <label>{language.t("ui.pult.equipment.fields.totalOperatingTime")}</label>
                  <span class="blue-text">{language.number((equipmentDraft || selectedEquipment).hours)} {language.t('review.hours')}</span>
                </div>
                <button class="btn-cyan-action">{language.t("ui.pult.maintenance.actions.addType")}</button>
                <div class="eq-actions">
                  {#if equipmentDraft}
                    <button class="btn-orange" onclick={saveEquipment}>{language.t('review.configSave')}</button>
                    <button class="btn-del" onclick={() => { equipmentDraft = null; equipmentError = ''; }}>{language.t('ui.shared.actions.cancel')}</button>
                  {:else}
                    <button class="btn-orange" disabled={!equipmentReady} onclick={() => editEquipment()}>{language.t("ui.pult.equipment.actions.edit")}</button>
                    <button class="btn-del" disabled={!equipmentReady} onclick={deleteEquipment}>{language.t("ui.pult.equipment.actions.deleteModule")}</button>
                  {/if}
                </div>
              </div>
              <div class="eq-preview">
                <div class="dark-box">
                  <div class="terminal-mock">
                    <p>{language.t("ui.pult.actions.emulateScreen")}</p>
                    <div class="mock-btn">{language.t("ui.pult.equipment.samples.foamPumpActive")}</div>
                  </div>
                </div>
              </div>
            </div>
            {/if}
            <button class="btn-add-main" disabled={!equipmentReady || !!equipmentDraft || !freeRelayCount} onclick={() => editEquipment(true)}>{language.t("ui.pult.equipment.actions.add")}</button>
            <div class="table-container equipment-history">
              <h3 class="section-title">{language.t("ui.pult.maintenance.title")}</h3>
              <p class="field-title">{language.t('review.maintenanceReadonly')}</p>
              <div class="pult-table-scroll" use:horizontalScroll={scrollLabels}>
              <table class="m-table">
                <thead>
                  <tr><th>№</th><th>{language.t("ui.pult.tabs.equipment")}</th><th>{language.t("ui.pult.maintenance.columns.task")}</th><th>{language.t("ui.pult.maintenance.columns.plannedHours")}</th><th>{language.t("ui.pult.maintenance.columns.actualHours")}</th><th>{language.t("ui.shared.columns.date")}</th></tr>
                </thead>
                <tbody>
                  {#each maintenanceHistory as row}
                    <tr>
                      <td>{row.id}</td><td><strong>{row.name}</strong></td><td>{row.task}</td><td>{row.plan}</td><td>{row.fact}</td><td>{row.date}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
              </div>
            </div>
          </div>

        {:else if activeTab === 'operations'}
          <div class="tab-view-container">
            <h2 class="title">{language.t("ui.pult.operations.title")}</h2>
            <div class="ops-main-layout">
              <div class="ops-content">
                <div class="ops-cards-grid">
                  {#each operationsStats as stat}
                    <div class="op-stat-card">
                      <div class="op-icon-circle blue-bg">{stat.icon}</div>
                      <div class="op-text">
                        <div class="op-val">{language.translate(stat.title)}</div>
                        <div class="op-label">{language.translate(stat.sub)}</div>
                      </div>
                    </div>
                  {/each}

                  <div class="op-stat-card long">
                    <div class="op-icon-circle blue-bg">📊</div>
                    <div class="op-text">
                      <div class="op-val">{language.t("ui.pult.operations.monthlyRegister")}</div>
                      <div class="op-sub-row">{language.t("ui.pult.operations.labels.cashPlural")} <strong>{language.t("ui.pult.operations.samples.monthCash")}</strong></div>
                      <div class="op-sub-row">{language.t("ui.pult.operations.labels.nonCash")} <strong>{language.t("ui.pult.operations.samples.monthNonCash")}</strong></div>
                    </div>
                  </div>

                  <div class="op-stat-card long">
                    <div class="op-icon-circle blue-bg">📅</div>
                    <div class="op-text">
                      <div class="op-val">{language.t("ui.pult.operations.dailyRegister")}</div>
                      <div class="op-sub-row">{language.t("ui.pult.operations.labels.cashSingular")} <strong>{language.t("ui.pult.operations.samples.dailyCash")}</strong></div>
                      <div class="op-sub-row">{language.t("ui.pult.operations.labels.paypass")} <strong>{language.t("ui.pult.operations.samples.dailyPaypass")}</strong></div>
                    </div>
                  </div>

                  <button class="btn-orange-wide">{language.t("ui.pult.actions.collectCash")} <span style="margin-left: 8px;">⚠️</span></button>
                </div>
              </div>

              <div class="cash-nominal-card">
                <h3>{language.t("ui.pult.usb.devices.banknoteAcceptor")}</h3>
                <div class="cash-head"><span>{language.t("ui.pult.prro.fields.denomination")}</span><span>{language.t("ui.shared.columns.count")}</span></div>
                <div class="cash-body">
                  {#each cashNominals as item}
                    <div class="cash-item">
                      <span class="nom-v">{item.val} {language.t("ui.shared.units.hryvnia")}</span>
                      <span class="nom-c">{item.count} {language.t("ui.shared.units.pieces")}</span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <div class="table-container big-t">
              <h3 class="section-title">{language.t("ui.pult.programs.usageHint")}</h3>
              <div class="pult-table-scroll" use:horizontalScroll={scrollLabels}>
              <table class="m-table ops-t">
                <thead>
                  <tr><th>№</th><th>{language.t("ui.shared.fields.programName")}</th><th>{language.t("ui.pult.service.pricePerMinute")}</th><th>{language.t("ui.pult.prro.fields.totalHryvnias")}</th><th>{language.t("ui.pult.programs.columns.totalMinutes")}</th></tr>
                </thead>
                <tbody>
                  {#each operationsTable as row}
                    <tr>
                      <td>{row.id}</td><td class="blue-link">{row.name}</td><td>{row.price}</td><td><strong>{row.sum}</strong></td><td>{row.time}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
              </div>
            </div>
          </div>

        {:else if activeTab === 'kassa'}
          <div class="kassa-view">
            <div class="prro-header">
              <h2 class="title">{language.t("ui.pult.prro.settingsTitle")}</h2>
              {#if prroDirty}<span class="unsaved-warning">{language.t("ui.shared.unsavedChanges.title")}</span>{/if}
            </div>

            <div class="config-card">
              <div class="toggles-stack" style="display: flex; gap: 40px; margin-bottom: 5px; border-bottom: 1px solid var(--border-light); padding-bottom: 20px;">
                <label class="toggle-row">
                  <input type="checkbox" bind:checked={prroData.enabled}>
                  <span class="track"></span>
                  <span class="label-text" style="font-weight: 600; color: var(--text-title);">{language.t("ui.pult.prro.fields.enableFiscalization")}</span>
                </label>
                <label class="toggle-row">
                  <input type="checkbox" bind:checked={prroData.testMode}>
                  <span class="track"></span>
                  <span class="label-text" style="font-weight: 600; color: var(--accent-orange);">{language.t("ui.pult.prro.fields.taxTestMode")}</span>
                </label>
              </div>

              <div class="prro-form-grid">
                <div class="form-group tooltip-container">
                  <label for="prro-login-field">{language.t("ui.pult.prro.fields.cashierLogin")} <span class="help-icon" title={language.t('ui.pult.prro.loginHint')}>?</span></label>
                  <input id="prro-login-field" type="text" class="bordered-input full-w-inp" bind:value={prroData.login} placeholder={language.t('ui.pult.prro.placeholders.login')}>
                </div>
                <div class="form-group">
                  <label for="prro-token-field">{language.t("ui.pult.prro.fields.apiToken")}</label>
                  <input id="prro-token-field" type="text" class="bordered-input full-w-inp" bind:value={prroData.token} placeholder={language.t('ui.pult.prro.placeholders.secretToken')}>
                </div>
                <div class="form-group split-group">
                  <div class="sub-group">
                    <label for="prro-host-field">{language.t("ui.pult.prro.fields.host")}</label>
                    <input id="prro-host-field" type="text" class="bordered-input full-w-inp" bind:value={prroData.host}>
                  </div>
                  <div class="sub-group">
                    <label for="prro-port-field">{language.t("ui.pult.prro.fields.port")}</label>
                    <input id="prro-port-field" type="text" class="bordered-input full-w-inp" bind:value={prroData.port}>
                  </div>
                </div>
                <div class="form-group">
                  <label for="prro-printer-field">{language.t("ui.pult.prro.fields.receiptPrinter")}</label>
                  <input id="prro-printer-field" type="text" class="bordered-input full-w-inp" bind:value={prroData.printer}>
                </div>
                <div class="form-group">
                  <label for="prro-pass-field">{language.t("ui.pult.prro.fields.cashierPassword")}</label>
                  <div class="pass-wrapper" style="width: 100%;">
                    <input id="prro-pass-field" type={showPrroPassword ? "text" : "password"} class="bordered-input full-w-inp" bind:value={prroData.password} style="padding-right: 40px;">
                    <button class="eye-btn" onclick={() => showPrroPassword = !showPrroPassword} style="right: 12px; top: 50%; transform: translateY(-50%); position: absolute;">
                      {showPrroPassword ? '🔓' : '👁️'}
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label for="prro-license-field">{language.t("ui.pult.prro.fields.licenseKey")}</label>
                  <input id="prro-license-field" type="text" class="bordered-input full-w-inp" bind:value={prroData.licenseKey}>
                </div>
              </div>

              <div class="paypass-section">
                <h3 class="section-title">{language.t("ui.pult.paypass.description")}</h3>
                <div class="paypass-grid">
                  <div class="form-group">
                    <label for="paypass-ip-field">{language.t("ui.pult.paypass.fields.ipAddress")}</label>
                    <input id="paypass-ip-field" type="text" class="bordered-input full-w-inp" bind:value={prroData.paypassIp}>
                  </div>
                  <div class="form-group">
                    <label for="paypass-port-field">{language.t("ui.pult.paypass.fields.port")}</label>
                    <input id="paypass-port-field" type="text" class="bordered-input full-w-inp" bind:value={prroData.paypassPort}>
                  </div>
                  <div class="form-group mid-group">
                    <label for="paypass-mid-field">{language.t("ui.pult.paypass.fields.merchantId")}</label>
                    <input id="paypass-mid-field" type="text" class="bordered-input full-w-inp" bind:value={prroData.paypassMid}>
                  </div>
                </div>
              </div>
            </div>

            <div class="table-container">
              <h3 class="section-title">{language.t("ui.pult.prro.history.title")}</h3>
              <div class="pult-table-scroll" use:horizontalScroll={scrollLabels}>
              <table class="m-table">
                <thead>
                  <tr><th>{language.t("ui.pult.prro.columns.transactionId")}</th><th>{language.t("ui.pult.prro.columns.receiptType")}</th><th>{language.t("ui.pult.prro.columns.operationName")}</th><th>{language.t("ui.shared.columns.amount")}</th><th>{language.t("ui.pult.prro.columns.taxDeliveryStatus")}</th></tr>
                </thead>
                <tbody>
                  {#each prroHistory as item}
                    <tr>
                      <td>#{item.id}</td><td><strong>{language.translate(item.check)}</strong></td><td>{language.translate(item.opType)}</td><td><strong>{item.sum}</strong></td>
                      <td class={item.isError ? 'text-red' : 'text-green'}>{language.translate(item.status)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
              </div>
            </div>
          </div>

        {:else if activeTab === 'programs'}
          <div class="tab-view-container">
            <h2 class="title" style="margin-bottom: 20px;">{language.t("ui.shared.titles.programs")}</h2>
            
            <div class="programs-actions-header">
              <button class="btn-cyan-action-small" disabled={!programsReady} onclick={() => openProgram()}>
                {language.t("ui.shared.actions.addProgram")} <span class="btn-icon-inline">+</span>
              </button>
              <button class="btn-gray-outline-small" disabled title={language.t('review.programCopyUnavailable')}>
                {language.t("ui.pult.programs.actions.copySettings")}
              </button>
            </div>

            <div class="program-block-card">
              <h3 class="block-card-title">{language.t("ui.shared.titles.programs")}</h3>
              <div class="program-table-scroll" use:horizontalScroll={scrollLabels}>
              <div class="program-table-header">
                <span class="col-name">{language.t("ui.shared.fields.name")}</span>
                <span class="col-btn-select">{language.t("ui.pult.programs.columns.button")}</span>
                <span class="col-action-end">{language.t("ui.shared.columns.action")}</span>
              </div>
              
              <div class="program-rows-list">
                {#each programs as program, index (program.id)}
                  <div class="program-edit-row" data-program-id={program.id}>
                    <button class="program-name-label program-edit-name" disabled={!programsReady} onclick={() => openProgram(program)}>{program.id.startsWith('preview-') ? language.translate(program.name) : program.name} ✎</button>
                    <div class="btn-selection-group">
                      <output class="compact-btn-input">{program.button ?? '—'}</output>
                      <button class="btn-define-rectangular" disabled={!programsReady} onclick={() => { programsError = ''; assignment = { id: program.id, button: program.button }; }}>{language.t('ui.shared.actions.identify')}</button>
                    </div>
                    <div class="program-row-controls">
                      <button class="row-control-icon-btn" title={language.t('review.moveUp')} disabled={!programsReady || index === 0} onclick={() => moveProgram(index, -1)}>↑</button>
                      <button class="row-control-icon-btn" title={language.t('review.moveDown')} disabled={!programsReady || index === programs.length - 1} onclick={() => moveProgram(index, 1)}>↓</button>
                      <button class="row-control-icon-btn delete" title={language.t(program.id.startsWith('dev-') ? 'ui.shared.actions.delete' : 'review.programProtected')} disabled={!programsReady || !program.id.startsWith('dev-')} onclick={() => deleteProgram(program)}><Trash2 size={16}/></button>
                      <label class="toggle-row-compact">
                        <input type="checkbox" aria-label={language.t('review.programActive', { name: program.name })} bind:checked={program.active} disabled={!programsReady} onchange={() => programsFeedback = ''}>
                        <span class="track-compact"></span>
                      </label>
                    </div>
                  </div>
                {/each}
              </div>
              </div>
              <p class="field-title">{language.t(LOCAL_MODE ? 'review.programManualHint' : 'review.configUnavailable')}</p>
              {#if programsError}<p class="text-red" role="alert">{language.t('review.' + programsError)}</p>{/if}
              {#if programsFeedback && !programsDirty}<p class="text-green" role="status">{language.t('review.' + programsFeedback)}</p>{/if}
              <div class="block-card-footer-actions">
                <button class="btn-save-section" disabled={!programsReady || !programsDirty} onclick={() => savePrograms()}>{language.t('ui.pult.programs.actions.save')}</button>
                <button class="btn-cancel-section" onclick={() => { programs = structuredClone($state.snapshot(programsSaved)); programsError = programsFeedback = ''; }}>{language.t('ui.shared.actions.cancel')}</button>
              </div>
            </div>

            <div class="program-block-card" style="margin-top: 24px;">
              <h3 class="block-card-title">{language.t('review.pauseTitle')}</h3>
              <p class="field-title">{language.t('review.pauseHint')}</p>
              <label for="pause-duration" class="field-title">{language.t('review.pauseDuration')}</label>
              <input id="pause-duration" type="number" min="1" step="1" class="bordered-input" bind:value={serviceDraft.pauseSeconds} disabled={!serviceReady}>
              {#if serviceError}<p class="text-red" role="alert">{language.t(`review.${serviceError}`)}</p>{/if}
              {#if serviceFeedback && !serviceDirty}<p class="text-green" role="status">{language.t(`review.${serviceFeedback}`)}</p>{/if}
              <div class="block-card-footer-actions">
                <button class="btn-save-section" disabled={!serviceReady || !serviceDirty} onclick={saveServicePrograms}>{language.t('review.configSave')}</button>
                <button class="btn-cancel-section" onclick={() => { serviceDraft = structuredClone($state.snapshot(serviceSaved)); serviceError = serviceFeedback = ''; }}>{language.t('ui.shared.actions.cancel')}</button>
              </div>
              <p class="field-title">{language.t('review.paypassPaymentOnly')}</p>
            </div>
          </div>

        {:else if activeTab === 'actions'}
          <div class="tab-view-container">
            <div class="actions-card-layout">
              <h3 class="actions-group-title">{language.t("ui.pult.actions.title")}</h3>
              <div class="actions-buttons-grid-custom">
                <button class="action-trigger-btn orange-btn-new">
                  <span>{language.t("ui.pult.actions.restart")}</span>
                  <svg class="svg-inline-action" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                </button>
                <button class="action-trigger-btn dark-btn-new">
                  <span>{language.t("ui.pult.actions.paypassZReport")}</span>
                  <svg class="svg-inline-action" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </button>
                <button class="action-trigger-btn light-blue-btn-new">
                  <span>{language.t("ui.pult.actions.initialize")}</span>
                  <svg class="svg-inline-action" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </button>
                <button class="action-trigger-btn dark-btn-new">
                  <span>{language.t("ui.pult.actions.vchasnoZReport")}</span>
                  <svg class="svg-inline-action" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </button>
              </div>

              <div class="auto-zreport-row-custom">
                <label for="auto-zreport-input">{language.t("ui.pult.prro.fields.automaticZReport")}</label>
                <div class="auto-zreport-input-wrapper">
                  <input id="auto-zreport-input" type="text" class="zreport-time-field-new" bind:value={autoZReportTime} placeholder="--:--" />
                  <span class="clock-inside-icon">🕒</span>
                </div>
                <button class="zreport-save-btn-new">{language.t("ui.shared.actions.save")}</button>
              </div>

              <h3 class="actions-group-title" style="margin-top: 24px;">{language.t("ui.pult.actions.logs.title")}</h3>
              <div class="logs-download-links-list">
                <a href="#download" class="log-download-item-link" onclick={(e) => e.preventDefault()}>
                  <span class="download-arrow-icon">⬇️</span> <span class="log-file-name-text">{language.t("ui.pult.actions.logs.serverFile")}</span>
                </a>
                <a href="#download" class="log-download-item-link" onclick={(e) => e.preventDefault()}>
                  <span class="download-arrow-icon">⬇️</span> <span class="log-file-name-text">{language.t("ui.pult.actions.logs.npmFile")}</span>
                </a>
                <a href="#download" class="log-download-item-link" onclick={(e) => e.preventDefault()}>
                  <span class="download-arrow-icon">⬇️</span> <span class="log-file-name-text">{language.t("ui.pult.actions.logs.paypassFile")}</span>
                </a>
                <a href="#download" class="log-download-item-link" onclick={(e) => e.preventDefault()}>
                  <span class="download-arrow-icon">⬇️</span> <span class="log-file-name-text">{language.t("ui.pult.actions.logs.applicationFile")}</span>
                </a>
              </div>

              <div class="clear-logs-wrapper-row">
                <button class="btn-clear-logs-danger-new">
                  {language.t("ui.pult.actions.clearLogs")} <span style="margin-left: 6px; font-size:14px;">🧼</span>
                </button>
              </div>
            </div>
          </div>

        {:else if activeTab === 'usb'}
          <div class="tab-view-container">
            <div class="usb-config-header-row-custom">
              <h2 class="usb-config-title-main">{language.t("ui.pult.usb.settingsTitle")}</h2>
              {#if usbDirty}<span class="unsaved-warning">{language.t("ui.shared.unsavedChanges.title")}</span>{/if}
            </div>

            <div class="usb-form-card-container">
              <UsbPortFields config={usbConfig} disabled={!usbReady} onchange={setUsbPort} />

              <div class="usb-dynamic-slaves-rows-stack">
                {#each usbConfig.devices as device}
                  <div class="usb-slave-device-edit-row">
                    <div class="slave-field-mini-block">
                      <label>{language.t("ui.pult.usb.fields.slaveId")}</label>
                      <input type="text" class="usb-slave-id-input-styled" bind:value={device.slaveId} />
                    </div>
                    <div class="slave-field-select-block">
                      <label>{language.t("ui.pult.usb.fields.deviceType")}</label>
                      <div class="custom-select-arrow-wrapper">
                        <select class="usb-slave-select-styled" bind:value={device.type}>
                          <option value="Кнопки 1-15">{language.t("ui.pult.buttons.rangeLabel")}</option>
                          <option value="Реле 1-15">{language.t("ui.pult.relays.rangeLabel")}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>

              <div class="usb-add-action-container-row">
                <button class="btn-usb-add-device-new" disabled={!usbReady} onclick={() => { usbConfig.devices.push({ slaveId: '', type: 'Кнопки 1-15' }); usbFeedback = ''; }}>
                  {language.t("ui.pult.usb.actions.addDevice")} <span style="margin-left: 4px; font-weight: 700;">+</span>
                </button>
              </div>

              <div class="usb-footer-action-buttons-row">
                <button class="usb-save-btn-confirm-new" disabled={!usbReady || !usbDirty} onclick={saveUsb}>{language.t('review.configSave')}</button>
                <button class="usb-cancel-btn-link-new" onclick={cancelUsb}>{language.t("ui.shared.actions.cancel")}</button>
              </div>
              <p class="field-title">{language.t(LOCAL_MODE ? 'review.pultConfigLocal' : 'review.configUnavailable')}</p>
              {#if usbError}<p class="text-red" role="alert">{language.t(`review.${usbError}`)}</p>{/if}
              {#if usbFeedback && !usbDirty}<p class="text-green" role="status">{language.t(`review.${usbFeedback}`)}</p>{/if}
            </div>
          </div>
        {/if}

      </div>

      <footer class="footer-bar">
        <button class="btn-save" disabled={mediaSaving || mediaBusy || !!programDraft || !!assignment || (!dataReady && dataDirty) || (!usbReady && usbDirty) || (!equipmentReady && !!equipmentDraft) || (!mediaReady && mediaDirty) || (!serviceReady && serviceDirty)} onclick={saveAndClose}>{language.t("ui.shared.actions.saveChanges")}</button>
        <button class="btn-cancel" disabled={mediaSaving || mediaBusy} onclick={requestClose}>{language.t("ui.shared.actions.cancel")}</button>
      </footer>
    </main>
  </div>
  {#if programDraft || assignment}
    <div class="program-dialog-backdrop" role="presentation" onclick={event => { event.stopPropagation(); programDraft = assignment = null; programsError = ''; }}>
      <div class="program-dialog" role="dialog" aria-modal="true" aria-labelledby="program-dialog-title" tabindex="-1" onclick={event => event.stopPropagation()} onkeydown={event => { if (event.key === 'Escape') { programDraft = assignment = null; programsError = ''; event.stopPropagation(); } }}>
        <form onsubmit={programDraft ? saveProgramDraft : saveAssignment}>
          <h3 id="program-dialog-title">{language.t(programDraft ? 'review.programEditTitle' : 'review.programAssignTitle')}</h3>
          {#if programDraft}
            <label for="pult-program-name">{language.t('ui.shared.fields.name')}</label>
            <input id="pult-program-name" class="bordered-input" required bind:value={programDraft.name}>
            <label class="toggle-row"><input type="checkbox" bind:checked={programDraft.active}><span>{language.t('review.programEnabled')}</span></label>
          {:else}
            <p class="field-title">{language.t('review.programManualHint')}</p>
            <label for="program-button-number">{language.t('review.programButtonNumber')}</label>
            <input id="program-button-number" class="bordered-input" type="number" min="1" step="1" bind:value={assignment.button}>
            <small>{language.t('review.programButtonEmpty')}</small>
          {/if}
          {#if programsError}<p class="text-red" role="alert">{language.t('review.' + programsError)}</p>{/if}
          <div class="block-card-footer-actions">
            <button class="btn-save-section" type="submit">{language.t('review.configSave')}</button>
            <button class="btn-cancel-section" type="button" onclick={() => { programDraft = assignment = null; programsError = ''; }}>{language.t('ui.shared.actions.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

</div>
{/if}

<style>
  :global(:root) {
      --bg-overlay: rgba(15, 23, 42, 0.4);
      --bg-modal: #f1f5f9;
      --bg-panel: #f8fafc;
      --bg-card: #ffffff;
      --bg-input: #ffffff;
      --bg-tabs-header: #0f172a;
      --bg-tab-hover: #1e293b;
      --bg-tab-active: #0ea5e9;
      --bg-warning-light: #fef2f2;
      
      --border-main: #e2e8f0;
      --border-light: #f1f5f9;
      --border-input: #cbd5e1;
      --border-warning: #fee2e2;
      
      --text-title: #0f172a;
      --text-main: #334155;
      --text-muted: #475569;
      --text-light: #94a3b8;
      
      --brand-bg: #e0f2fe;
      --brand-text: #0369a1;
      
      --accent-blue: #0ea5e9;
      --accent-cyan: #38bdf8;
      --accent-orange: #f97316;
      --accent-red: #ef4444;
      --accent-green: #10b981;
      
      --shadow-main: rgba(0,0,0,0.45);
      --shadow-card: rgba(0,0,0,0.02);
  }

  :global(html.dark) {
      --bg-overlay: rgba(0, 0, 0, 0.6);
      --bg-modal: #0f172a;
      --bg-panel: #1e293b;
      --bg-card: #1e293b;
      --bg-input: #0f172a;
      --bg-tabs-header: #0b1120;
      --bg-tab-hover: #334155;
      --bg-tab-active: #0ea5e9;
      --bg-warning-light: rgba(239, 68, 68, 0.1);
      
      --border-main: #334155;
      --border-light: rgba(255, 255, 255, 0.05);
      --border-input: #475569;
      --border-warning: rgba(239, 68, 68, 0.2);
      
      --text-title: #f8fafc;
      --text-main: #cbd5e1;
      --text-muted: #94a3b8;
      --text-light: #64748b;
      
      --brand-bg: rgba(14, 165, 233, 0.15);
      --brand-text: #38bdf8;
      
      --accent-blue: #0ea5e9;
      --accent-cyan: #38bdf8;
      --accent-orange: #f97316;
      --accent-red: #ef4444;
      --accent-green: #10b981;
      
      --shadow-main: rgba(0,0,0,0.7);
      --shadow-card: rgba(0,0,0,0.2);
  }

  .modal-overlay { position: fixed; inset: 0; background: var(--bg-overlay); backdrop-filter: blur(12px); display: flex; justify-content: center; align-items: center; z-index: 9999; }
  .modal-container { background: var(--bg-modal); width: 96%; max-width: 1250px; height: 92vh; border-radius: 24px; display: grid; grid-template-columns: 290px 1fr; overflow: hidden; box-shadow: 0 25px 60px -15px var(--shadow-main); border: 1px solid var(--border-light); }
  
  .side-info { background: var(--bg-panel); border-right: 1px solid var(--border-main); padding: 16px; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
  .side-card { background: var(--bg-card); border-radius: 16px; padding: 12px; border: 1px solid var(--border-main); box-shadow: 0 1px 3px var(--shadow-card); }
  .brand-badge { background: var(--brand-bg); border-radius: 12px; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px; }
  .brand-name { color: var(--brand-text); font-weight: 800; font-size: 16px; letter-spacing: 0.5px; }
  .car-icon { font-size: 18px; }
  .stats-compact { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--border-light); padding-top: 8px; }
  .stat-item-mini { display: flex; align-items: center; gap: 10px; }
  .stat-item-mini .icon { font-size: 16px; background: var(--border-light); width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .stat-item-mini strong { font-size: 15px; color: var(--text-title); }
  .stat-item-mini small { font-size: 11px; color: var(--text-muted); display: block; }
  
  .info-list-compact { display: flex; flex-direction: column; gap: 6px; }
  .row-c { display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; padding: 4px 0; border-bottom: 1px solid var(--border-light); color: var(--text-muted); }
  .copy-val-btn { background: transparent; border: none; font-weight: 600; color: var(--text-title); cursor: pointer; padding: 2px 4px; border-radius: 4px; font-size: 11.5px; }
  .copy-val-btn:hover { background: var(--border-light); color: var(--accent-blue); }
  .val.orange { color: var(--accent-orange); font-weight: bold; }
  
  .status-group-compact { display: flex; flex-direction: column; gap: 6px; }
  .st-line { display: flex; align-items: center; font-size: 11.5px; color: var(--text-muted); }
  .dot { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 10px; font-size: 10px; }
  .dot.blue { background: var(--accent-blue); }
  .dot.l-blue { background: #3b82f6; }
  .dot.green-d { background: var(--accent-green); }
  .lab { font-weight: 400; }
  .msg { margin-left: auto; font-weight: 600; font-size: 11px; }
  .msg.green { color: var(--accent-green); }
  .msg.red { color: var(--accent-red); }
  

  .content-area { display: flex; flex-direction: column; background: var(--bg-card); overflow: hidden; }
  .tabs-header { background: var(--bg-tabs-header); padding: 10px; display: flex; gap: 6px; }
  .tab-btn { flex: 1; background: transparent; border: none; color: var(--text-light); padding: 10px 6px; border-radius: 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s ease; }
  .tab-btn:hover { background: var(--bg-tab-hover); color: var(--text-title); }
  .tab-btn.active { background: var(--bg-tab-active); color: white; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); }
  .tab-icon { font-size: 16px; }
  .tab-label { font-size: 10.5px; font-weight: 500; letter-spacing: 0.2px; }
  .scroll-body { flex: 1; padding: 24px; overflow-y: auto; background: var(--bg-panel); }
  
  .tab-view-container { display: flex; flex-direction: column; }
  .title { font-size: 20px; color: var(--text-title); margin-top: 0; margin-bottom: 20px; font-weight: 700; letter-spacing: -0.3px; }
  .config-card { background: var(--bg-card); border-radius: 18px; padding: 24px; border: 1px solid var(--border-main); display: flex; flex-direction: column; gap: 20px; box-shadow: 0 4px 6px -1px var(--shadow-card); }

  .field-row { display: flex; align-items: center; gap: 20px; }
  .field-row label { width: 240px; font-size: 13.5px; font-weight: 500; color: var(--text-main); }
  .bordered-input { flex: 1; max-width: 360px; padding: 10px 14px; border: 1px solid var(--border-input); border-radius: 10px; outline: none; font-size: 14px; color: var(--text-title); transition: all 0.2s; background: var(--bg-input); }
  .bordered-input:focus { border-color: var(--accent-blue); box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15); }
  .full-w-inp { max-width: 100% !important; width: 100%; box-sizing: border-box; }
  
  .underline-input { border: none; border-bottom: 2px solid var(--border-main); width: 100%; padding: 10px 0; outline: none; font-size: 15px; color: var(--text-title); transition: border-color 0.2s; background: transparent; }
  .underline-input:focus { border-color: var(--accent-blue); }
  .input-box-full { display: flex; flex-direction: column; gap: 6px; }
  .field-title { font-size: 13px; font-weight: 600; color: var(--text-main); }

  .toggles-stack { display: flex; flex-direction: column; }
  .toggle-row { display: inline-flex; align-items: center; gap: 12px; cursor: pointer; user-select: none; }
  .track { width: 40px; height: 22px; background: var(--border-input); border-radius: 20px; position: relative; transition: background 0.2s ease; flex-shrink: 0; }
  .track::before { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
  input[type="checkbox"] { display: none; }
  input:checked + .track { background: var(--accent-blue); }
  input:checked + .track::before { transform: translateX(18px); }
  .label-text { font-size: 13.5px; color: var(--text-main); font-weight: 500; }

  .auth-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; border-top: 1px solid var(--border-light); padding-top: 20px; margin-top: 10px; }
  .auth-col { display: flex; flex-direction: column; gap: 6px; }
  .pass-wrapper { position: relative; display: flex; align-items: center; width: 100%; }
  .eye-btn { position: absolute; right: 0; background: none; border: none; cursor: pointer; padding: 6px 10px; font-size: 14px; opacity: 0.6; transition: opacity 0.2s; }
  .eye-btn:hover { opacity: 1; }

  .prro-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .unsaved-warning { color: var(--accent-red); font-weight: 600; font-size: 13px; background: var(--bg-warning-light); padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border-warning); }
  
  .prro-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 24px; margin-top: 5px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; width: 100%; }
  .form-group label { font-size: 13px; font-weight: 500; color: var(--text-muted); display: flex; align-items: center; }
  
  .split-group { display: grid; grid-template-columns: 2.2fr 1fr; gap: 12px; }
  .split-group .sub-group { display: flex; flex-direction: column; gap: 6px; }
  
  .help-icon { border: 1px solid var(--text-light); border-radius: 50%; width: 15px; height: 15px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; margin-left: 6px; color: var(--text-light); cursor: help; font-weight: bold; }
  
  .paypass-section { border-top: 1px solid var(--border-light); padding-top: 20px; margin-top: 10px; }
  .section-title { font-size: 14px; font-weight: 700; color: var(--text-title); margin-top: 0; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.3px; }
  .paypass-grid { display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 16px; }

  .ops-main-layout { display: grid; grid-template-columns: 1fr 310px; gap: 24px; align-items: start; }
  .ops-cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .op-stat-card { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 16px; padding: 16px; display: flex; gap: 14px; align-items: center; box-shadow: 0 1px 3px var(--shadow-card); }
  .op-stat-card.long { grid-column: span 1; align-items: flex-start; flex-direction: column; gap: 6px; }
  .op-icon-circle { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .blue-bg { background: var(--brand-bg); color: var(--brand-text); }
  .op-val { font-size: 16px; font-weight: 700; color: var(--text-title); }
  .op-label { font-size: 11.5px; color: var(--text-muted); line-height: 1.3; }
  .op-sub-row { font-size: 12px; color: var(--text-main); display: flex; justify-content: space-between; width: 100%; width: -webkit-fill-available; margin-top: 2px; }
  .btn-orange-wide { grid-column: span 2; background: var(--accent-orange); color: white; border: none; border-radius: 12px; padding: 14px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2); }
  .btn-orange-wide:hover { background: #ea580c; }

  .cash-nominal-card { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 18px; padding: 16px; box-shadow: 0 2px 4px var(--shadow-card); }
  .cash-nominal-card h3 { font-size: 14px; margin-top: 0; margin-bottom: 12px; text-align: center; color: var(--text-title); font-weight: 700; }
  .cash-head { display: flex; justify-content: space-between; font-weight: 700; font-size: 11px; color: var(--text-muted); padding-bottom: 8px; border-bottom: 1px solid var(--border-light); text-transform: uppercase; letter-spacing: 0.5px; }
  .cash-body { display: flex; flex-direction: column; }
  .cash-item { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; border-bottom: 1px solid var(--border-light); }
  .nom-v { color: var(--text-main); font-weight: 500; }
  .nom-c { font-weight: 700; color: var(--text-title); }

  .eq-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .eq-form { background: var(--bg-card); border-radius: 18px; padding: 20px; border: 1px solid var(--border-main); display: flex; flex-direction: column; gap: 14px; }
  .eq-field { display: flex; flex-direction: column; gap: 5px; }
  .eq-field label { font-size: 13px; font-weight: 500; color: var(--text-muted); }
  .blue-text { color: var(--accent-blue); font-weight: 700; font-size: 15px; padding: 4px 0; }
  .btn-cyan-action { background: var(--accent-blue); color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 600; font-size: 13.5px; cursor: pointer; text-align: center; transition: background 0.2s; }
  .btn-cyan-action:hover { background: #0284c7; }
  .eq-actions { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-light); padding-top: 12px; margin-top: 5px; flex-wrap: wrap; gap: 8px; }
  .relay-slots { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; margin-bottom: 18px; }
  .relay-slots button { background: var(--bg-card); color: var(--text-title); border: 1px solid var(--border-main); border-radius: 8px; padding: 8px 4px; cursor: pointer; }
  .relay-slots small { display: block; font-size: 10px; margin-top: 4px; }
  .relay-slots .occupied { border-color: var(--accent-blue); }
  .relay-slots .conflict { border-color: var(--accent-red); }
  .btn-orange { background: var(--accent-orange); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 12.5px; cursor: pointer; }
  .btn-del { color: var(--accent-red); background: none; border: none; cursor: pointer; font-weight: 600; font-size: 12.5px; padding: 8px 0; }
  .dark-box { background: #0f172a; height: 100%; min-height: 220px; border-radius: 18px; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
  .terminal-mock { border: 2px dashed #0ea5e9; padding: 24px; border-radius: 14px; text-align: center; color: white; width: 100%; max-width: 240px; }
  .terminal-mock p { margin: 0 0 12px 0; font-size: 13px; color: #94a3b8; }
  .mock-btn { background: #0ea5e9; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; color: white; box-shadow: 0 4px 10px rgba(14,165,233,0.25); }
  
  .btn-add-main { width: 100%; background: var(--bg-panel); border: 2px dashed var(--border-input); border-radius: 14px; padding: 14px; margin-top: 20px; font-weight: 600; color: var(--text-muted); font-size: 14px; cursor: pointer; transition: all 0.2s; }
  .btn-add-main:hover { background: var(--border-light); border-color: var(--text-muted); color: var(--text-title); }

  .program-slots-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 5px; }
  .prog-slot { background: var(--bg-panel); border: 1px solid var(--border-main); padding: 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 500; }
  .prog-slot .blue { color: var(--accent-blue); font-size: 12px; }
  .usb-device-row { background: var(--bg-panel); padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border-main); font-size: 13.5px; color: var(--text-main); }

  .table-container { background: var(--bg-card); border-radius: 18px; padding: 20px; border: 1px solid var(--border-main); margin-top: 24px; box-shadow: 0 2px 4px var(--shadow-card); }
  .table-container.big-t { margin-top: 24px; }
  .m-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
  .m-table th { color: var(--text-muted); font-weight: 600; padding: 12px 10px; border-bottom: 2px solid var(--border-light); background: var(--bg-panel); font-size: 12px; text-transform: uppercase; letter-spacing: 0.3px; }
  .m-table td { padding: 12px 10px; border-bottom: 1px solid var(--border-light); color: var(--text-main); vertical-align: middle; }
  .m-table tbody tr:hover { background: var(--bg-panel); }
  .blue-link { color: var(--accent-blue); font-weight: 600; cursor: pointer; }
  .text-green { color: var(--accent-green); font-weight: 600; }
  .text-red { color: var(--accent-red); font-weight: 600; }

  .footer-bar { padding: 16px 24px; background: var(--bg-card); border-top: 1px solid var(--border-main); display: flex; justify-content: center; align-items: center; gap: 24px; }
  .btn-save { background: var(--accent-blue); color: white; border: none; padding: 12px 55px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25); }
  .btn-save:hover { background: #0284c7; transform: translateY(-1px); }
  .btn-cancel { color: var(--accent-red); background: none; border: none; cursor: pointer; font-weight: 700; font-size: 14px; transition: color 0.2s; padding: 12px 10px; }
  .btn-cancel:hover { color: #dc2626; }

  .programs-actions-header { display: flex; gap: 12px; margin-bottom: 20px; }
  .btn-cyan-action-small { background: var(--accent-cyan); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.2s; }
  .btn-cyan-action-small:hover { background: var(--accent-blue); }
  .btn-gray-outline-small { background: var(--bg-card); border: 1px solid var(--border-main); color: var(--text-main); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
  .btn-gray-outline-small:hover { background: var(--bg-panel); }
  
  .program-block-card { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px var(--shadow-card); }
  .block-card-title { margin: 0 0 16px 0; font-size: 15px; font-weight: 700; color: var(--text-title); text-align: left; }
  .program-table-header { display: grid; grid-template-columns: 240px 1fr 120px; padding-bottom: 8px; border-bottom: 1px solid var(--border-light); font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .program-table-header .col-name { text-align: left; }
  .program-table-header .col-btn-select { text-align: left; padding-left: 10px; }
  .program-table-header .col-action-end { text-align: right; }
  
  .program-rows-list { display: flex; flex-direction: column; margin-bottom: 20px; }
  .program-edit-row { display: grid; grid-template-columns: 240px 1fr 120px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--bg-panel); height: 48px; box-sizing: border-box; }
  .program-name-label { font-size: 14px; color: var(--text-main); text-align: left; }
  
  .btn-selection-group { display: flex; align-items: center; gap: 8px; padding-left: 10px; }
  .compact-btn-input { width: 65px; height: 32px; background: var(--bg-input); border: 1px solid var(--border-input); border-radius: 6px; text-align: center; font-size: 13px; color: var(--text-main); outline: none; transition: border-color 0.15s; }
  .compact-btn-input:focus { border-color: var(--accent-cyan); }
  
  .btn-define-rectangular { background: var(--accent-cyan); color: white; border: none; height: 32px; padding: 0 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s ease; }
  .btn-define-rectangular:hover { background: var(--accent-blue); }
  
  .program-row-controls { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
  .row-control-icon-btn { background: none; border: none; cursor: pointer; color: var(--text-light); display: inline-flex; align-items: center; justify-content: center; padding: 4px; transition: color 0.15s; }
  .row-control-icon-btn.delete:hover { color: var(--accent-red); }
  
  .toggle-row-compact { display: inline-flex; align-items: center; cursor: pointer; position: relative; }
  .toggle-row-compact input { opacity: 0; width: 0; height: 0; position: absolute; }
  .track-compact { width: 32px; height: 18px; background-color: var(--border-input); border-radius: 100px; position: relative; transition: background-color 0.2s; }
  .track-compact::before { content: ""; position: absolute; width: 14px; height: 14px; border-radius: 50%; background: white; top: 2px; left: 2px; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
  .toggle-row-compact input:checked + .track-compact { background-color: var(--accent-cyan); }
  .toggle-row-compact input:checked + .track-compact::before { transform: translateX(14px); }
  
  .block-card-footer-actions { display: flex; gap: 12px; margin-top: 20px; border-top: 1px solid var(--border-light); padding-top: 16px; }
  .btn-save-section { background: var(--accent-cyan); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
  .btn-save-section:hover { background: var(--accent-blue); }
  .btn-cancel-section { background: none; border: none; color: var(--accent-red); font-size: 13px; font-weight: 600; cursor: pointer; }

  .actions-card-layout { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px var(--shadow-card); display: flex; flex-direction: column; text-align: left; }
  .actions-group-title { font-size: 15px; font-weight: 700; color: var(--text-title); margin: 0 0 16px 0; }
  .actions-buttons-grid-custom { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
  
  .action-trigger-btn { border: none; border-radius: 8px; height: 46px; padding: 0 16px; font-size: 13.5px; font-weight: 600; color: white; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: opacity 0.15s ease; }
  .action-trigger-btn:hover { opacity: 0.9; }
  .orange-btn-new { background-color: var(--accent-orange); }
  .dark-btn-new { background-color: var(--bg-tabs-header); }
  .light-blue-btn-new { background-color: var(--accent-cyan); }
  .svg-inline-action { opacity: 0.9; flex-shrink: 0; }

  .auto-zreport-row-custom { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
  .auto-zreport-row-custom label { font-size: 14px; color: var(--text-muted); font-weight: 600; }
  .auto-zreport-input-wrapper { position: relative; display: inline-flex; align-items: center; }
  .zreport-time-field-new { width: 240px; height: 36px; border: 1px solid var(--border-input); border-radius: 8px; padding: 0 32px 0 12px; font-size: 14px; color: var(--text-main); background: var(--bg-input); outline: none; box-sizing: border-box; }
  .clock-inside-icon { position: absolute; right: 10px; font-size: 13px; color: var(--text-light); pointer-events: none; }
  
  .zreport-save-btn-new { background-color: var(--accent-cyan); color: white; border: none; height: 36px; padding: 0 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background-color 0.15s; }
  .zreport-save-btn-new:hover { background-color: var(--accent-blue); }

  .logs-download-links-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
  .log-download-item-link { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; font-size: 13.5px; color: var(--accent-cyan); width: max-content; transition: color 0.15s; }
  .log-download-item-link:hover { color: var(--accent-blue); text-decoration: underline; }
  .clear-logs-wrapper-row { border-top: 1px solid var(--border-light); padding-top: 20px; }
  
  .btn-clear-logs-danger-new { background-color: var(--accent-red); color: white; border: none; height: 42px; padding: 0 24px; border-radius: 8px; font-size: 13.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background-color 0.15s; }
  .btn-clear-logs-danger-new:hover { background-color: #dc2626; }

  .usb-config-header-row-custom { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .usb-config-title-main { font-size: 16px; font-weight: 700; color: var(--text-title); margin: 0; }
  .usb-form-card-container { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px var(--shadow-card); text-align: left; }

  .usb-dynamic-slaves-rows-stack { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; border-top: 1px solid var(--border-light); padding-top: 20px; }
  .usb-slave-device-edit-row { display: grid; grid-template-columns: 140px 240px; gap: 24px; align-items: flex-end; }
  @media (max-width: 900px) {
    .relay-slots { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .eq-layout { grid-template-columns: minmax(0, 1fr); }
    .usb-slave-device-edit-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1.7fr); }
  }
  .slave-field-mini-block, .slave-field-select-block { display: flex; flex-direction: column; gap: 6px; }
  .slave-field-mini-block label, .slave-field-select-block label { font-size: 13px; font-weight: 600; color: var(--text-muted); }
  
  .usb-slave-id-input-styled { height: 34px; border: 1px solid var(--border-input); border-radius: 8px; padding: 0 12px; font-size: 13.5px; color: var(--text-main); background-color: var(--bg-input); outline: none; box-sizing: border-box; width: 100%; }
  .custom-select-arrow-wrapper { position: relative; width: 100%; }
  .usb-slave-select-styled { width: 100%; height: 34px; border: 1px solid var(--border-input); border-radius: 8px; padding: 0 30px 0 12px; font-size: 13.5px; color: var(--text-main); background-color: var(--bg-input); outline: none; cursor: pointer; appearance: none; -webkit-appearance: none; box-sizing: border-box; }
  .custom-select-arrow-wrapper::after { content: "▼"; font-size: 9px; color: var(--text-light); position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }

  .usb-add-action-container-row { margin-bottom: 28px; }
  .btn-usb-add-device-new { background-color: var(--accent-cyan); color: white; border: none; height: 38px; padding: 0 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background-color 0.15s; }
  .btn-usb-add-device-new:hover { background-color: var(--accent-blue); }

  .usb-footer-action-buttons-row { display: flex; justify-content: center; align-items: center; gap: 20px; border-top: 1px solid var(--border-light); padding-top: 20px; }
  .usb-save-btn-confirm-new { background-color: var(--accent-cyan); color: white; border: none; height: 36px; padding: 0 24px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background-color 0.15s; }
  .usb-save-btn-confirm-new:hover { background-color: var(--accent-blue); }
  
  .usb-cancel-btn-link-new { background: none; border: none; color: var(--accent-red); font-size: 13px; font-weight: 600; cursor: pointer; padding: 6px 12px; transition: color 0.15s; }
  .usb-cancel-btn-link-new:hover { color: #dc2626; }

  .program-dialog-backdrop { position: fixed; inset: 0; z-index: 11001; background: #020617aa; display: grid; place-items: center; padding: 12px; }
  .program-dialog { width: min(420px, 100%); box-sizing: border-box; max-height: 90dvh; overflow: auto; background: var(--bg-card); color: var(--text-title); border: 1px solid var(--border-main); border-radius: 16px; padding: 22px; }
  .program-dialog form { display: flex; flex-direction: column; gap: 14px; }
  .program-dialog h3 { margin: 0; }
  .program-dialog .bordered-input { width: 100%; max-width: 100%; box-sizing: border-box; flex: none; }
  .program-edit-name { border: 0; background: none; cursor: pointer; padding: 8px 0; overflow-wrap: anywhere; }
  output.compact-btn-input { display: inline-grid; place-items: center; min-width: 52px; width: auto; padding: 0 6px; }
  .program-table-header, .program-edit-row { grid-template-columns: minmax(100px, 1fr) minmax(155px, 1fr) auto; gap: 8px; }
  .program-edit-row { height: auto; min-height: 60px; }
  .program-row-controls { gap: 4px; }
  .row-control-icon-btn { min-width: 30px; min-height: 34px; }
  .info-toggle { display: none; }
  .info-details { display: flex; flex-direction: column; gap: 10px; }
  .side-info { overflow-y: auto; box-shadow: 4px 0 15px #0206170c; }
  .modal-container { grid-template-columns: 250px minmax(0, 1fr); height: 92dvh; }
  .content-area, .scroll-body, .tab-view-container { min-width: 0; min-height: 0; }
  .tabs-header { padding: 6px 8px; gap: 4px; align-items: center; overflow-x: auto; flex-shrink: 0; scrollbar-width: thin; scrollbar-color: var(--border-input) var(--bg-tabs-header); }
  .tabs-header::-webkit-scrollbar { height: 4px; }
  .tabs-header::-webkit-scrollbar-track { background: var(--bg-tabs-header); }
  .tabs-header::-webkit-scrollbar-thumb { background: var(--border-input); border-radius: 4px; }
  .tab-btn { flex: 1 0 auto; padding: 8px; gap: 6px; flex-direction: row; border-radius: 8px; min-height: 40px; }
  .tab-label { font-size: 11px; white-space: nowrap; }
  .scroll-body { padding: 20px; }
  .footer-bar { flex-shrink: 0; gap: 12px; padding: 10px 20px; }
  .programs-actions-header { flex-wrap: wrap; }
  .data-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  .data-header .title { margin-bottom: 0; }
  .data-context { margin-bottom: 12px; line-height: 1.45; }
  .data-context p { margin: 0; }
  .data-card { padding: 18px; gap: 14px; }
  .data-card .field-row { gap: 16px; }
  .data-card .bordered-input { max-width: 450px; min-width: 0; }
  .data-toggles { gap: 12px; }
  .data-toggle { padding: 0; border: 0; background: none; text-align: left; font: inherit; }
  .data-toggle[aria-checked='true'] .track { background: var(--accent-blue); }
  .data-toggle[aria-checked='true'] .track::before { transform: translateX(18px); }
  .data-record-row { display: flex; align-items: center; gap: 6px; }
  .card-record-help { flex: none; width: 24px; height: 24px; margin: 0; background: transparent; color: var(--text-main); border-color: currentColor; }
  .data-help { margin: 0; padding: 12px; border-radius: 8px; background: var(--brand-bg); color: var(--text-title); font-size: 12px; line-height: 1.5; }
  .data-card .auth-section { gap: 16px; margin-top: 0; padding-top: 14px; }
  .data-card .underline-input { border: 1px solid var(--border-input); border-radius: 10px; padding: 10px 12px; background: var(--bg-input); box-sizing: border-box; }
  .data-card .underline-input:focus { border-color: var(--accent-blue); }
  .data-actions { padding-top: 12px; margin-top: 0; }
  .content-area :global(button:disabled) { opacity: .45; cursor: not-allowed; transform: none; }
  .content-area :global(button:focus-visible), .program-dialog :global(button:focus-visible) { outline: 2px solid var(--accent-cyan); outline-offset: 2px; }
  @media(max-width:1024px) {
    .modal-container { grid-template-columns: 215px minmax(0, 1fr); }
    .side-info { padding: 10px; }
    .scroll-body { padding: 16px; }
    .ops-main-layout { grid-template-columns: minmax(0, 1fr); }
    .program-table-header { display: none; }
    .program-edit-row { grid-template-columns: minmax(0, 1fr) auto; gap: 8px; padding: 12px 0; }
    .program-name-label { grid-column: 1 / -1; }
    .btn-selection-group { padding-left: 0; }
  }
  @media(max-width:600px) {
    .modal-container { width: calc(100% - 16px); height: calc(100dvh - 16px); grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); border-radius: 16px; }
    .side-info { border-right: 0; border-bottom: 1px solid var(--border-main); padding: 0; overflow: hidden; }
    .info-toggle { display: flex; justify-content: space-between; gap: 8px; width: 100%; padding: 12px 16px; border: 0; background: var(--bg-card); color: var(--text-title); font-weight: 700; text-align: left; cursor: pointer; }
    .info-details { display: none; }
    .side-info.expanded .info-details { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); padding: 10px; max-height: 30dvh; overflow: auto; }
    .tabs-header { padding: 6px; }
    .tab-btn { flex: none; padding: 8px 10px; }
    .config-card, .program-block-card, .eq-form, .table-container { padding: 14px; border-radius: 12px; }
    .field-row { flex-direction: column; align-items: stretch; gap: 7px; }
    .field-row label, .bordered-input { width: 100%; max-width: 100%; box-sizing: border-box; min-width: 0; }
    .auth-section, .prro-form-grid, .paypass-grid { grid-template-columns: minmax(0,1fr); flex-direction: column; }
    .ops-cards-grid { grid-template-columns: minmax(0,1fr); }
    .btn-orange-wide { grid-column: auto; }
    .footer-bar { padding: 10px 12px; }
    .btn-save { padding: 12px 16px; flex: 1; }
    .prro-header, .usb-config-header-row-custom { flex-wrap: wrap; gap: 8px; }
    .usb-slave-device-edit-row { flex-wrap: wrap; }
    .slave-field-mini-block, .slave-field-select-block { min-width: 0; }
    .split-group { grid-template-columns: minmax(0,1fr) 90px; }
    .form-group { min-width: 0; }
    .relay-slots { grid-template-columns: repeat(3,minmax(0,1fr)); }
    .actions-buttons-grid-custom { grid-template-columns: minmax(0,1fr); }
    .auto-zreport-row-custom { flex-wrap: wrap; }
  }
  @media(max-width:430px) {
    .scroll-body { padding: 10px; }
    .side-info.expanded .info-details { grid-template-columns: minmax(0,1fr); }
    .program-edit-row { grid-template-columns: minmax(0,1fr); }
    .program-row-controls { justify-content: flex-start; }
    .auth-col { min-width: 0; }
  }

  .pult-table-scroll .m-table { min-width: 600px; }
  .program-table-scroll .program-table-header, .program-table-scroll .program-edit-row { display: grid; grid-template-columns: minmax(140px,1fr) 170px 180px; gap: 8px; }
  .program-table-scroll .program-table-header, .program-table-scroll .program-rows-list { min-width: 560px; }
  .program-table-scroll .program-name-label { grid-column: auto; }
  .program-table-scroll .program-row-controls { justify-content: flex-end; }
  .program-table-scroll .btn-selection-group, .program-table-scroll .col-btn-select { padding-left: 0; }
  @media(min-width:430px) and (max-width:600px) {
    .prro-form-grid, .paypass-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }
    .auth-section { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }
  }
</style>
