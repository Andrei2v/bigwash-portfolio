import { LOCAL_MODE } from '$lib/api/client.js';

// These browser drafts are never sent to hardware or substituted for a Go response.
export function createDevConfig(key, defaults, validate) {
  let snapshot;
  let loaded = false;

  return {
    load() {
      if (!LOCAL_MODE) throw new Error('configUnavailable');
      loaded = false;
      try {
        snapshot = localStorage.getItem(key);
        const value = snapshot === null ? structuredClone(defaults) : JSON.parse(snapshot);
        if (!validate(value)) throw new Error('Invalid config');
        loaded = true;
        return value;
      } catch {
        throw new Error('configReadFailed');
      }
    },
    save(value) {
      if (!LOCAL_MODE) throw new Error('configUnavailable');
      if (!loaded) throw new Error('configReadFailed');
      if (!validate(value)) throw new Error('configInvalid');
      try {
        // Do not overwrite changes saved by another tab since this draft was opened.
        if (localStorage.getItem(key) !== snapshot) throw new Error('configConflict');
        const next = JSON.stringify(value);
        localStorage.setItem(key, next);
        snapshot = next;
      } catch (error) {
        throw new Error(error.message === 'configConflict' ? 'configConflict' : 'configSaveFailed');
      }
    }
  };
}

export const initialEquipment = [
  { id: 'preview-1', name: 'Помпа піни. Мотогодини', relay: '1', hours: 661.98 }
];

const nonEmpty = value => typeof value === 'string' && Boolean(value.trim());
const unique = values => new Set(values).size === values.length;

export function validEquipment(nodes) {
  return Array.isArray(nodes) && unique(nodes.map(node => node?.id)) && nodes.every(node =>
    node && nonEmpty(node.id) && nonEmpty(node.name) && nonEmpty(node.relay) &&
    Number.isFinite(node.hours) && node.hours >= 0);
}

export function equipmentDeleteError(node) {
  // Only newly created, unconnected DEV nodes have a known empty dependency set.
  return node?.id?.startsWith('local-') && Object.keys(node).every(key => ['id', 'name', 'relay', 'hours'].includes(key))
    ? '' : 'equipmentDependencies';
}

export const RELAY_SLOT_COUNT = 12;
export function relaySlot(value) {
  return typeof value === 'string' && /^(?:[1-9]|1[0-2])$/.test(value) ? Number(value) : null;
}

export function relayAssignmentError(nodes, draft) {
  const slot = relaySlot(draft?.relay);
  if (!slot) return 'relaySlotInvalid';
  return nodes.some(node => node.id !== draft.id && relaySlot(node.relay) === slot) ? 'relaySlotOccupied' : '';
}

export const initialServicePrograms = { pauseSeconds: 15 };

// Program buttons have their own numbering; they are not the 12 relay slots.
export const initialPultPrograms = [
  { id: 'preview-water', name: 'Вода під тиском', button: 1, active: true },
  { id: 'preview-foam', name: 'Піна', button: 13, active: true }
];

export function pultProgramsError(programs) {
  if (!Array.isArray(programs) || !unique(programs.map(program => program?.id)) || programs.some(program =>
    !program || !nonEmpty(program.id) || !nonEmpty(program.name) || typeof program.active !== 'boolean' ||
    (program.button !== null && (!Number.isSafeInteger(program.button) || program.button <= 0)))) return 'programInvalid';
  const assigned = programs.filter(program => program.button !== null).map(program => program.button);
  return unique(assigned) ? '' : 'programButtonConflict';
}
export const validPultPrograms = programs => !pultProgramsError(programs);

export const usbPortFields = [
  { key: 'paypassPort', id: 'paypass', label: 'pult.usb.ports.paypass', presets: ['-', 'auto', 'ttyACM0', 'ttyACM1'] },
  { key: 'cashPort', id: 'cash', label: 'pult.usb.ports.cashAcceptor', presets: ['auto', 'ttyACM0', 'ttyACM1'] },
  { key: 'buttonsPort', id: 'buttons', label: 'pult.usb.ports.buttonBoard', presets: ['ttyUSB0', 'ttyS5', 'ttyS6', 'ttyS7'] },
  { key: 'barcodePort', id: 'barcode', label: 'pult.usb.ports.barcodeScanner', presets: ['auto', 'ttyACM0'] }
];
export const validServicePrograms = config => Boolean(config && Number.isSafeInteger(config.pauseSeconds) && config.pauseSeconds > 0);

// The terminal password is never copied into the browser's configuration record.
export function pultDataDefaults(pult) {
  return {
    name: pult.name ?? '',
    settings: {
      timer: pult.settings?.timer ?? 0,
      takeOffMoney: pult.settings?.takeOffMoney ?? true,
      cardRecordMode: pult.settings?.cardRecordMode ?? false,
      login: pult.settings?.login ?? ''
    }
  };
}

export function validPultData(config) {
  const settings = config?.settings;
  return Boolean(config && nonEmpty(config.name) && settings &&
    Number.isSafeInteger(settings.timer) && settings.timer >= 0 &&
    typeof settings.takeOffMoney === 'boolean' && typeof settings.cardRecordMode === 'boolean' &&
    typeof settings.login === 'string' &&
    Object.keys(settings).every(key => ['timer', 'takeOffMoney', 'cardRecordMode', 'login'].includes(key)));
}

export const initialPromo = { enabled: false, scope: 'global', pultIds: [] };
export function validPromo(config) {
  return Boolean(config && typeof config.enabled === 'boolean' && ['global', 'individual'].includes(config.scope) &&
    Array.isArray(config.pultIds) && config.pultIds.every(id => Number.isSafeInteger(id) && id > 0) &&
    new Set(config.pultIds).size === config.pultIds.length &&
    (!config.enabled || config.scope !== 'individual' || config.pultIds.length > 0));
}
export const promoApplies = (config, pultId) => config.enabled && (config.scope === 'global' || config.pultIds.includes(pultId));

export const initialUsbConfig = {
  paypassPort: 'auto', cashPort: 'auto', buttonsPort: '', barcodePort: '',
  devices: [
    { slaveId: '40', type: 'Кнопки 1-15' },
    { slaveId: '70', type: 'Реле 1-15' }
  ]
};

export function validUsbConfig(config) {
  return Boolean(config && ['paypassPort', 'cashPort', 'buttonsPort', 'barcodePort']
    .every(key => typeof config[key] === 'string') && Array.isArray(config.devices) &&
    config.devices.every(device =>
      device && nonEmpty(device.slaveId) && ['Кнопки 1-15', 'Реле 1-15'].includes(device.type)) &&
    unique(config.devices.map(device => device.slaveId.trim())));
}

export const initialDiscounts = {
  combination: 'single',
  turnoverRows: [{ id: 1, sum: 500, percent: 2, active: false }],
  totalRefillRows: [{ id: 1, sum: 500, percent: 2, active: false }],
  program: {
    percent: 20, active: false, days: ['Пн', 'Ср', 'Пт'], from: '12:30', to: '22:00',
    programs: [{ id: 1, name: 'Вода під тиском' }, { id: 2, name: 'Піна' }]
  },
  refill: [{ type: 'Готівка', percent: 10, active: false }, { type: 'PayPass', percent: 10, active: false }],
  clientRefill: [{ type: 'Готівка', percent: 15, active: true }, { type: 'PayPass', percent: 15, active: true }],
  newClients: [{ percent: 20, active: false }, { percent: 10, active: true }]
};

export const discountDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const percentage = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const time = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const discount = row => row && percentage(row.percent) && typeof row.active === 'boolean';

export const validWashHours = wash => !wash.byTime ||
  (time(wash.timeFrom) && time(wash.timeTo) && wash.timeFrom < wash.timeTo);

export const validMedia = media => Boolean(media && typeof media.enabled === 'boolean' && typeof media.text === 'string');

export function validDiscounts(config) {
  if (config?.combination !== undefined && config.combination !== 'single') return false;
  if (!config || !['turnoverRows', 'totalRefillRows'].every(key =>
    Array.isArray(config[key]) && unique(config[key].map(row => row?.id)) && config[key].every(row =>
      row && Number.isSafeInteger(row.id) && row.id > 0 && Number.isFinite(row.sum) && row.sum >= 0 && discount(row)))) return false;
  const program = config.program;
  return Boolean(discount(program) && time(program.from) && time(program.to) &&
    Array.isArray(program.days) && unique(program.days) && program.days.every(day => discountDays.includes(day)) &&
    Array.isArray(program.programs) && unique(program.programs.map(row => row?.id)) &&
    program.programs.every(row => row && Number.isSafeInteger(row.id) && nonEmpty(row.name)) &&
    ['refill', 'clientRefill'].every(key => Array.isArray(config[key]) && config[key].length === 2 &&
      config[key].every((row, index) => row?.type === ['Готівка', 'PayPass'][index] && discount(row))) &&
    Array.isArray(config.newClients) && config.newClients.length === 2 && config.newClients.every(discount));
}

// Shared DEV fixtures keep Promo targets consistent with the existing pult list.
export const initialPults = [
    { 
        id: 1, 
        name: 'Пульт 1',
        status: 'Помилка', 
        money: '1200 грн', 
        date: '28.12.2024', 
        mode: 'Очікування',
        settings: {
            ip: '192.168.1.50',
            firmware: 'v2.4.1',
            isDayMessageEnabled: true,
            dayMessage: 'Вітаємо на нашій мийці!',
            timer: 0,
            takeOffMoney: true,
            cardRecordMode: false,
            login: 'pult_1',
            password: 'DEMO_ONLY_NOT_A_PASSWORD'
        }
    },
    { 
        id: 2, 
        name: 'Pult 2 (VIP)', 
        status: 'Працює', 
        money: '0 грн', 
        date: '29.12.2024', 
        mode: 'Робота',
        settings: {
            ip: '192.168.1.51',
            firmware: 'v2.5.0',
            isDayMessageEnabled: false,
            dayMessage: '',
            timer: 0,
            takeOffMoney: true,
            cardRecordMode: true,
            login: 'pult_2',
            password: 'DEMO_ONLY_NOT_A_PASSWORD'
        }
    }
];
