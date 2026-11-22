<script>
  import { horizontalScroll } from '$lib/actions/horizontal-scroll.js';
  const scrollLabels = $derived({ hint: language.t('review.scrollColumns'), previous: language.t('review.scrollPrevious'), next: language.t('review.scrollNext') });

  import { language } from '$lib/localisation/language.svelte.js';
  import { onMount } from 'svelte';
  import { validWholeMoney } from '$lib/review-validation.js';
  import { Pencil, Trash2 } from 'lucide-svelte';

  const STORAGE_KEY = 'bigwash.programs.v1';
  let programs = $state([
    { id: 1, name: 'Вода під тиском', price: 15.00, unit: 'грн/хв', date: '16.07.2024', description: 'Чиста вода під потужним тиском для змивання основного бруду', cost: 5.50 },
    { id: 2, name: 'Піна', price: 37.00, unit: 'грн/хв', date: '16.07.2024', description: 'Густа активна піна для розчинення стійких забруднень', cost: 12.00 },
    { id: 3, name: 'Осмос', price: 20.00, unit: 'грн/хв', date: '16.07.2024', description: 'Демінералізована вода, що не залишає розводів при висиханні', cost: 3.20 },
    { id: 4, name: 'Тепла вода', price: 28.00, unit: 'грн/хв', date: '16.07.2024', description: 'Ефективне миття при низьких температурах', cost: 8.00 },
    { id: 5, name: 'Зима', price: 20.00, unit: 'грн/хв', date: '16.07.2024', description: 'Спеціальний режим для зимового періоду', cost: 6.00 },
    { id: 6, name: 'Віск', price: 28.00, unit: 'грн/хв', date: '16.07.2024', description: 'Захисне покриття для блиску та гідрофобного ефекту', cost: 10.50 },
    { id: 7, name: 'Пилосос', price: 6.00, unit: 'грн/хв', date: '16.07.2024', description: 'Потужне прибирання салону автомобіля', cost: 1.50 },
    { id: 8, name: 'Полотенце', price: 0.00, unit: 'грн/хв', date: '16.07.2024', description: 'Видача паперових або багаторазових рушників', cost: 0.00 },
    { id: 9, name: 'Обдув повітрям', price: 0.00, unit: 'грн/хв', date: '16.07.2024', description: 'Видалення води з важкодоступних місць та щілин', cost: 0.50 },
    { id: 10, name: 'Підкачка шин', price: 0.00, unit: 'грн/хв', date: '16.07.2024', description: 'Контроль тиску та підкачка коліс', cost: 0.00 },
    { id: 11, name: 'Вода та шампунь', price: 0.00, unit: 'грн/хв', date: '16.07.2024', description: 'Подача води з додаванням миючого засобу', cost: 4.00 },
    { id: 12, name: 'Рожева піна', price: 0.00, unit: 'грн/хв', date: '16.07.2024', description: 'Ефектна кольорова піна з посиленим миючим ефектом', cost: 13.00 },
    { id: 13, name: 'Антимошка', price: 0.00, unit: 'грн/хв', date: '16.07.2024', description: 'Видалення слідів комах з лобового скла та кузова', cost: 7.00 },
    { id: 14, name: 'Тефлон', price: 0.00, unit: 'грн/хв', date: '16.07.2024', description: 'Довготривалий захист лакофарбового покриття', cost: 15.00 },
    { id: 15, name: 'Омивач', price: 0.00, unit: 'грн/хв', date: '16.07.2024', description: 'Заправка бачка склоомивача', cost: 0.00 },
    { id: 16, name: 'Очисник', price: 0.00, unit: 'пульс', date: '16.07.2024', description: 'Очисник для дисків або салону', cost: 5.00, pulseSeconds: 45 }
  ]);

  let searchName = $state('');
  let isEditModalOpen = $state(false);
  let selectedProgram = $state(null);
  let isNewProgram = $state(false);
  let error = $state('');

  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) || !parsed.every(p =>
          p && Number.isSafeInteger(p.id) && typeof p.name === 'string' &&
          p.name.trim() && Number.isFinite(p.price) && p.price >= 0 &&
          Number.isFinite(p.cost) && p.cost >= 0 &&
          ['грн/хв', 'грн/л', 'пульс'].includes(p.unit) &&
          typeof p.date === 'string' && typeof p.description === 'string' &&
          (p.unit !== 'пульс' || (Number.isFinite(p.pulseSeconds) && p.pulseSeconds > 0))
        ) || new Set(parsed.map(p => p.id)).size !== parsed.length) {
          throw new Error('Invalid programs');
        }
        programs = parsed;
      }
    } catch {
      error = 'Не вдалося прочитати збережені програми. Показано початковий список.';
    }
  });

  function persistPrograms(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      programs = next;
      error = '';
      return true;
    } catch {
      error = 'Не вдалося зберегти програми у браузері. Спробуйте ще раз.';
      return false;
    }
  }

  function openAdd() {
    isNewProgram = true;
    error = '';
    selectedProgram = {
      id: Math.max(0, ...programs.map(p => p.id)) + 1,
      name: '', price: 0, unit: 'грн/хв',
      date: new Date().toLocaleDateString('uk-UA'),
      description: '', cost: 0, pulseSeconds: 30
    };
    isEditModalOpen = true;
  }

  function openEdit(prog) {
    isNewProgram = false;
    error = '';
    selectedProgram = { 
      ...prog,
      pulseSeconds: prog.pulseSeconds || 30,
      cost: prog.cost || 0
    };
    isEditModalOpen = true;
  }

  function saveChanges() {
    if (!validWholeMoney(selectedProgram.price) || !validWholeMoney(selectedProgram.cost)) {
      error = 'review.programWholeMoney';
      return;
    }
    if (!selectedProgram.name.trim() ||
        !Number.isFinite(selectedProgram.price) || selectedProgram.price < 0 ||
        !Number.isFinite(selectedProgram.cost) || selectedProgram.cost < 0 ||
        (selectedProgram.unit === 'пульс' &&
          (!Number.isFinite(selectedProgram.pulseSeconds) || selectedProgram.pulseSeconds <= 0))) {
      error = 'Вкажіть назву, невід’ємні ціну й собівартість та додатну тривалість імпульсу.';
      return;
    }
    const updated = { ...selectedProgram, name: selectedProgram.name.trim() };
    const next = isNewProgram
      ? [...programs, updated]
      : programs.map(p => p.id === updated.id ? updated : p);
    if (persistPrograms(next)) isEditModalOpen = false;
  }

  function deleteProgram(prog) {
    if (confirm(language.t("ui.programs.confirm.delete", {p0: prog.name}))) {
      persistPrograms(programs.filter(p => p.id !== prog.id));
    }
  }

  function getPriceLabel(unit) {
    switch(unit) {
      case 'грн/хв': return 'Ціна за хвилину (грн)';
      case 'грн/л': return 'Ціна за літр (грн)';
      case 'пульс': return 'Ціна за 1 імпульс (грн)';
      default: return 'Ціна (грн)';
    }
  }
</script>

<div class="page-wrapper">
  <div class="content-container">
    
    <div class="page-header">
      <div class="title-section">
        <h1>{language.t("ui.shared.titles.programs")}</h1>
        <p class="subtitle">{language.t("ui.programs.description")}</p>
      </div>
      <button class="add-btn-main" onclick={openAdd}>
        <span>{language.t("ui.shared.actions.addProgram")}</span>
        <div class="plus-icon">+</div>
      </button>
    </div>

    {#if error && !isEditModalOpen}<p class="error-message" role="alert">{error.startsWith('review.') ? language.t(error) : language.translate(error)}</p>{/if}
    <div class="table-card">
      <div class="scroll-area" use:horizontalScroll={scrollLabels}>
      <table>
        <thead>
          <tr>
            <th width="50">#</th>
            <th>{language.t("ui.programs.columns.nameUppercase")}</th>
            <th>{language.t("ui.programs.columns.priceUppercase")}</th>
            <th>{language.t("ui.programs.columns.dateAdded")}</th>
            <th width="80"></th>
          </tr>
          <tr class="filter-row">
            <td></td>
            <td>
              <div class="filter-input">
                <input type="text" placeholder={language.t('ui.programs.placeholders.search')} bind:value={searchName} />
              </div>
            </td>
            <td><div class="filter-input"><input type="text" placeholder={language.t('ui.programs.placeholders.price')} /></div></td>
            <td><div class="filter-input"><input type="date" /></div></td>
          </tr>
        </thead>
        <tbody>
          {#each programs.filter(p => p.name.toLowerCase().includes(searchName.toLowerCase())) as prog}
            <tr>
              <td class="id-cell">{prog.id}</td>
              <td class="name-cell">{prog.name}</td>
              <td class="price-cell">
                <span class="amount">{language.number(prog.price, { maximumFractionDigits: 20 })}</span>
                <span class="unit">{language.translate(prog.unit)}</span>
              </td>
              <td class="date-cell">{prog.date}</td>
              <td class="actions-cell">
                <div class="program-actions">
                  <button class="icon-btn edit" title={language.t('ui.shared.actions.edit')} aria-label={language.t('ui.programs.actions.edit')} onclick={() => openEdit(prog)}><Pencil size={17} strokeWidth={1.8} /></button>
                  <button class="icon-btn delete" title={language.t('ui.shared.actions.delete')} aria-label={language.t('ui.programs.actions.delete')} onclick={() => deleteProgram(prog)}><Trash2 size={17} strokeWidth={1.8} /></button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      </div>
    </div>
  </div>
</div>

{#if isEditModalOpen && selectedProgram}
<div class="modal-overlay">
  <div class="modal-card">
    <div class="modal-header">
      <h2>{isNewProgram ? language.t("ui.shared.actions.addProgram") : language.t("ui.programs.modal.editTitle", {p0: selectedProgram.name})}</h2>
      <button class="close-x" onclick={() => isEditModalOpen = false}>✕</button>
    </div>

    <div class="modal-body">
      {#if error}<p class="error-message" role="alert">{error.startsWith('review.') ? language.t(error) : language.translate(error)}</p>{/if}
      {#if !isNewProgram && (!validWholeMoney(selectedProgram.price) || !validWholeMoney(selectedProgram.cost))}
        <p class="info-box">{language.t('review.programLegacyMoney')}</p>
      {/if}
      <div class="input-grid">
        <div class="form-col">
          <div class="input-group">
            <label>{language.t("ui.shared.fields.programName")}</label>
            <input type="text" bind:value={selectedProgram.name} />
          </div>

          <div class="input-group">
            <label>{language.t("ui.programs.fields.description")}</label>
            <textarea bind:value={selectedProgram.description}></textarea>
          </div>

          <div class="input-group">
            <label>{language.t("ui.programs.fields.billingType")}</label>
            <select bind:value={selectedProgram.unit}>
              <option value="грн/хв">{language.t("ui.programs.billing.perMinute")}</option>
              <option value="грн/л">{language.t("ui.programs.billing.perLitre")}</option>
              <option value="пульс">{language.t("ui.programs.billing.perPulse")}</option>
            </select>
          </div>

          <div class="row">
            <div class="input-group price-highlight">
              <label>{language.translate(getPriceLabel(selectedProgram.unit))}</label>
              <input type="number" min="0" step="1" inputmode="numeric" bind:value={selectedProgram.price} />
            </div>

            {#if selectedProgram.unit === 'пульс'}
            <div class="input-group pulse-highlight">
              <label>{language.t("ui.programs.fields.durationSeconds")}</label>
              <input type="number" min="0.01" step="0.01" bind:value={selectedProgram.pulseSeconds} />
            </div>
            {/if}
          </div>

          <div class="input-group">
            <label>{language.t("ui.programs.fields.cost")}</label>
            <input type="number" min="0" step="1" inputmode="numeric" bind:value={selectedProgram.cost} />
          </div>
        </div>

        <div class="photo-col">
          <label>{language.t("ui.programs.fields.image")}</label>
          <div class="upload-zone">
            <button class="btn-select-file">{language.t("ui.programs.actions.chooseFile")}</button>
            <div class="preview-box">
               <span class="preview-text">{language.t("ui.programs.preview.title")}</span>
            </div>
          </div>
          <div class="info-box">
            <h4>{language.t("ui.programs.actions.help")}</h4>
            <p>{language.t("ui.programs.saveChangesHint")}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-cancel" onclick={() => isEditModalOpen = false}>{language.t("ui.shared.actions.cancel")}</button>
      <button class="btn-save-action" onclick={saveChanges}>{language.t("ui.shared.actions.saveChanges")}</button>
    </div>
  </div>
</div>
{/if}

<style>
  .error-message { color: #ef4444; font-size: 14px; }
  :global(:root) {
      --bg-page: #f8fafc;
      --bg-card: #ffffff;
      --bg-modal: #ffffff;
      --bg-input: #f8fafc;
      --bg-input-alt: #f1f5f9;
      --border-color: #e2e8f0;
      --border-table: #f1f5f9;
      --border-table-row: #f8fafc;
      
      --text-main: #1e293b;
      --text-muted: #94a3b8;
      --text-secondary: #64748b;
      
      --btn-main-bg: #1e293b;
      --btn-main-hover: #0f172a;
      --btn-main-text: #ffffff;
      
      --accent-sky: #38bdf8;
      --accent-sky-dark: #0c4a6e;
      --accent-sky-darker: #075985;
      
      --price-green: #10b981;
      --price-green-bg: #f0fdf4;
      --pulse-sky-bg: #f0f9ff;
      
      --overlay-bg: rgba(15, 23, 42, 0.4);
      --modal-shadow: rgba(0, 0, 0, 0.15);
      --card-shadow: rgba(0,0,0,0.03);
  }

  :global(html.dark) {
      --bg-page: #0f172a;
      --bg-card: #1e293b;
      --bg-modal: #1e293b;
      --bg-input: #0f172a;
      --bg-input-alt: #0f172a;
      --border-color: #334155;
      --border-table: #334155;
      --border-table-row: rgba(255, 255, 255, 0.05);
      
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-secondary: #94a3b8;
      
      --btn-main-bg: #38bdf8;
      --btn-main-hover: #0ea5e9;
      --btn-main-text: #000000;
      
      --accent-sky: #38bdf8;
      --accent-sky-dark: #38bdf8;
      --accent-sky-darker: #e0f2fe;
      
      --price-green: #34d399;
      --price-green-bg: rgba(16, 185, 129, 0.1);
      --pulse-sky-bg: rgba(56, 189, 248, 0.1);
      
      --overlay-bg: rgba(0, 0, 0, 0.6);
      --modal-shadow: rgba(0, 0, 0, 0.5);
      --card-shadow: rgba(0,0,0,0.2);
  }

  .page-wrapper { display: flex; justify-content: center; width: 100%; min-height: 100vh; padding: 20px; box-sizing: border-box; font-family: 'Inter', sans-serif; background: var(--bg-page); }
  .content-container { width: 100%; max-width: 1200px; animation: fadeIn 0.4s ease-out; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  h1 { font-size: 28px; font-weight: 800; color: var(--text-main); margin: 0; }
  .subtitle { color: var(--text-muted); font-size: 14px; }

  .add-btn-main { background: var(--btn-main-bg); color: var(--btn-main-text); border: none; border-radius: 14px; padding: 10px 10px 10px 20px; display: flex; align-items: center; gap: 15px; cursor: pointer; font-weight: 600; transition: background 0.2s; }
  .plus-icon { width: 32px; height: 32px; background: var(--accent-sky); color: black; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; }

  .table-card { background: var(--bg-card); border-radius: 24px; padding: 16px; box-shadow: 0 4px 20px var(--card-shadow); border: 1px solid var(--border-table); }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; color: var(--text-muted); padding: 12px 16px; text-transform: uppercase; letter-spacing: 1px; }
  td { padding: 16px; border-bottom: 1px solid var(--border-table-row); font-size: 14px; color: var(--text-main); }
  .price-cell { font-weight: 700; }
  .price-cell .amount { color: var(--price-green); }
  .price-cell .unit { color: var(--text-muted); font-size: 11px; margin-left: 4px; }

  .filter-input input { width: 100%; background: var(--bg-input-alt); border: 1px solid transparent; padding: 8px 12px; border-radius: 10px; font-size: 13px; outline: none; color: var(--text-main); }
  .filter-input input:focus { border-color: var(--accent-sky); }
  .icon-btn { background: var(--bg-input-alt); border: none; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; color: var(--text-secondary); transition: background 0.2s, color 0.2s; }
  .icon-btn:hover { background: var(--accent-sky); color: black; }
  .program-actions { display: flex; align-items: center; gap: 8px; }
  .program-actions .icon-btn { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .program-actions .edit { color: var(--accent-sky-dark); }
  .program-actions .delete { color: #ef4444; }
  .program-actions .delete:hover { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
  .program-actions .icon-btn:focus-visible { outline: 2px solid var(--accent-sky); outline-offset: 3px; }

  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: var(--overlay-bg); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .modal-card { background: var(--bg-modal); width: 90%; max-width: 850px; border-radius: 24px; padding: 32px; box-shadow: 0 25px 50px -12px var(--modal-shadow); border: 1px solid var(--border-color); }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .modal-header h2 { font-size: 20px; font-weight: 700; color: var(--text-main); }
  .close-x { background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; }
  .close-x:hover { color: var(--text-main); }

  .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .input-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .input-group label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
  .input-group input, .input-group textarea, .input-group select { background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; color: var(--text-main); outline: none; font-family: inherit; }
  .input-group input:focus, .input-group textarea:focus, .input-group select:focus { border-color: var(--accent-sky); }
  
  .price-highlight input { border: 2px solid var(--price-green); background: var(--price-green-bg); }
  .pulse-highlight input { border: 2px solid var(--accent-sky); background: var(--pulse-sky-bg); }

  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .preview-box { width: 100%; height: 160px; background: var(--bg-input-alt); border-radius: 16px; border: 2px dashed var(--border-color); margin-top: 10px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
  .btn-select-file { background: var(--border-color); border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; color: var(--text-main); }
  .btn-select-file:hover { background: var(--text-muted); }

  .info-box { background: var(--pulse-sky-bg); border-left: 4px solid var(--accent-sky); padding: 16px; border-radius: 8px; margin-top: 20px; }
  .info-box h4 { margin: 0 0 5px 0; font-size: 14px; color: var(--accent-sky-dark); }
  .info-box p { margin: 0; font-size: 12px; color: var(--accent-sky-darker); line-height: 1.4; }

  .modal-footer { display: flex; justify-content: flex-end; gap: 16px; margin-top: 32px; }
  .btn-cancel { background: none; border: none; color: var(--text-secondary); font-weight: 600; cursor: pointer; }
  .btn-cancel:hover { color: var(--text-main); }
  .btn-save-action { background: var(--btn-main-bg); color: var(--btn-main-text); border: none; padding: 12px 28px; border-radius: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .btn-save-action:hover { background: var(--btn-main-hover); transform: translateY(-1px); }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .table-card { max-width: 100%; overflow: hidden; }
  table { min-width: 760px; }
  .modal-card { box-sizing: border-box; max-width: calc(100vw - 24px); max-height: calc(100dvh - 24px); overflow-y: auto; }
  @media(max-width:600px) { .page-wrapper { padding: 0; } .page-header { flex-direction: column; align-items: stretch; gap: 16px; } .modal-card { padding: 18px; } .input-grid { grid-template-columns: minmax(0,1fr); gap: 16px; } .row { grid-template-columns: minmax(0,1fr); } .modal-footer { flex-wrap: wrap; margin-top: 20px; gap: 10px; } .title-section h1 { font-size: 24px; } }
</style>
