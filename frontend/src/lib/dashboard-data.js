import { language } from './localisation/language.svelte.js';
// Read-only dashboard model. Amounts are stored in kopecks to avoid rounding drift.
export const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const formatDate = value => language.date(value);
export const money = value => (value / 100).toLocaleString(language.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Local noon keeps date-only ranges away from midnight timezone transitions.
const atNoon = key => new Date(key + 'T12:00:00');
export function overviewRange(today = dateKey(new Date())) {
  const year = atNoon(today).getFullYear();
  return { from: `${year - 1}-12-01`, to: `${year}-11-30` };
}
export function presetRange(preset, today = dateKey(new Date())) {
  const date = atNoon(today);
  let start = new Date(date);
  let end = new Date(date);
  if (preset === 'week' || preset === '30days') start.setDate(start.getDate() - (preset === 'week' ? 6 : 29));
  if (preset === 'month') { start.setDate(1); end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12); }
  if (preset === 'year') { start = new Date(date.getFullYear(), 0, 1, 12); end = new Date(date.getFullYear(), 11, 31, 12); }
  return { from: dateKey(start), to: dateKey(end) };
}

export function parseDate(value) {
  if (typeof value !== 'string') return '';
  const local = value.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  const key = local ? `${local[3]}-${local[2]}-${local[1]}` : value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return '';
  const date = atNoon(key);
  return Number.isFinite(date.getTime()) && dateKey(date) === key ? key : '';
}

function readArray(storage, key) {
  try {
    const raw = storage?.getItem(key);
    if (raw === null || raw === undefined) return null;
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : null;
  } catch { return null; }
}

export function normalizeEvents(rows, source = 'activity') {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row, index) => {
    if (!row || typeof row !== 'object') return [];
    const date = parseDate(row.date || row.created_at);
    const amount = Number(row.amount ?? row.sum);
    if (!date || !Number.isFinite(amount) || !('amount' in row || 'sum' in row)) return [];
    const expense = row.type === 'Витрата' || row.type === 'expense' || amount < 0;
    const topup = source === 'topup' || row.type === 'topup';
    return [{
      id: `${source}-${row.id ?? index}`, date, amount: Math.round(Math.abs(amount) * 100),
      kind: expense ? 'expense' : topup ? 'topup' : 'income',
      method: topup ? 'Картка' : row.method || row.payment_method || (row.type === 'Картка' ? 'Картка' : row.type === 'PayPass' ? 'PayPass' : row.type === 'Готівка' ? 'Готівка' : 'Не вказано'),
      client: row.client_name || row.client || row.uid || 'Не встановлено',
      pult: expense ? '' : row.pult || row.pult_name || '', program: row.program || row.program_name || '',
      bonus: Number.isFinite(Number(row.bonus)) ? Math.round(Number(row.bonus) * 100) : 0,
      sample: false
    }];
  });
}

export function loadDashboard(storage, today = dateKey(new Date()), sampleOnly = false) {
  const clients = readArray(storage, 'bigwash.local.v1.clients');
  const programs = readArray(storage, 'bigwash.programs.v1');
  const localSources = [
    ['bigwash.local.v1.activities', 'activity'],
    ['bigwash.operations.extra', 'operation'],
    ['bigwash.card.topups', 'topup']
  ].map(([key, source]) => ({ rows: readArray(storage, key), source }));
  const localEvents = localSources.flatMap(({ rows, source }) => normalizeEvents(rows || [], source));
  const hasLocalJournal = localSources.some(item => item.rows !== null);
  if (hasLocalJournal && !sampleOnly) return { events: localEvents, sample: false, localCatalogs: false };

  const people = clients === null ? ['Олена Коваль', 'Максим Петренко', 'Ірина Бондар', 'Андрій Мельник', 'Марія Шевченко', 'Дмитро Ткаченко', 'Наталія Кравченко', 'Олексій Савченко', 'Вікторія Мороз', 'Богдан Романюк', 'Юлія Лисенко', 'Сергій Бойко'] : clients.filter(c => c && typeof c === 'object').map(c => `${c.firstname || c.name || ''} ${c.lastname || c.surname || ''}`.trim()).filter(Boolean);
  const names = programs === null ? ['Осмос', 'Піна', 'Віск', 'Вода під тиском', 'Пилосос', 'Тепла вода', 'Рожева піна', 'Обдув повітрям', 'Підкачка шин'] : programs.filter(p => p && typeof p === 'object').map(p => p.name).filter(name => typeof name === 'string' && name);
  const events = [];
  // Stable calendar-based examples: no random numbers, no browser writes.
  const end = atNoon(today);
  const start = new Date(end.getFullYear() - 1, 0, 1, 12);
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const key = dateKey(date);
    const seed = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
    const season = [8, 9, 13, 21, 28, 33, 35, 36, 25, 20, 13, 8][date.getMonth()];
    const pultCount = date.getMonth() % 4 === 0 ? 10 : 7;
    let revenue = 0;
    for (let i = 0; i < season + seed % 7; i++) {
      const amount = (45 + (seed * 7 + i * 23) % 180) * 100;
      revenue += amount;
      events.push({ id: `sample-${key}-${i}`, date: key, amount,
        kind: 'income', method: ['Готівка', 'Картка', 'PayPass'][(seed + i) % 3],
        client: people.length ? people[(seed + i) % people.length] : 'Не встановлено',
        program: names.length ? names[(seed + i * 3) % names.length] : 'Не вказано',
        pult: `Пульт ${(i % pultCount + date.getMonth()) % 10 + 1}`, bonus: i % 4 === 0 ? 1500 : 0, sample: true });
    }
    events.push({ id: `sample-expense-${key}`, date: key, amount: Math.round(revenue * (0.37 + seed % 9 / 100)), kind: 'expense', method: 'Готівка', client: ['Хімія та витратні матеріали', 'Обслуговування обладнання', 'Вода та електроенергія'][seed % 3], pult: '', program: '', bonus: 0, sample: true });
  }
  return { events, sample: true, localCatalogs: clients !== null || programs !== null };
}

export const selectEvents = (events, range) => events.filter(row => row.date >= range.from && row.date <= range.to);
export function totals(rows) {
  const income = rows.filter(row => row.kind === 'income');
  const profit = income.reduce((sum, row) => sum + row.amount, 0);
  const expenses = rows.filter(row => row.kind === 'expense').reduce((sum, row) => sum + row.amount, 0);
  const bonus = income.reduce((sum, row) => sum + row.bonus, 0);
  return { profit, expenses, bonus, balance: profit - expenses - bonus };
}

export function breakdown(rows, field) {
  const counts = new Map();
  for (const row of rows.filter(row => row.kind === 'income')) {
    const name = String(row[field] || 'Не вказано');
    const item = counts.get(name) || { name, count: 0, amount: 0 };
    item.count++; item.amount += row.amount; counts.set(name, item);
  }
  const result = [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'uk'));
  const total = result.reduce((sum, row) => sum + row.count, 0);
  let assigned = 0;
  // Cumulative rounding guarantees that displayed percentages add up to 100.
  return result.map((row, index) => {
    const cumulative = result.slice(0, index + 1).reduce((sum, item) => sum + item.count, 0);
    const percent = total ? Math.round(cumulative * 100 / total) - assigned : 0;
    assigned += percent;
    return { ...row, percent };
  });
}

export function chartSeries(rows, range) {
  const months = language.t('calendar.months').map(month => month.toLocaleLowerCase(language.locale));
  const buckets = new Map();
  const start = atNoon(range.from);
  start.setDate(1);
  for (const date = new Date(start); date <= atNoon(range.to); date.setMonth(date.getMonth() + 1)) {
    buckets.set(dateKey(date).slice(0, 7), []);
  }
  for (const row of selectEvents(rows, range)) buckets.get(row.date.slice(0, 7))?.push(row);
  return [...buckets].map(([key, records]) => ({ label: months[Number(key.slice(5)) - 1], month: key, ...totals(records) }));
}

export function previousRange(range) {
  const count = Math.round((atNoon(range.to) - atNoon(range.from)) / 86400000) + 1;
  const end = atNoon(range.from); end.setDate(end.getDate() - 1);
  const start = new Date(end); start.setDate(start.getDate() - count + 1);
  return { from: dateKey(start), to: dateKey(end) };
}
export function changeLabel(current, previous) {
  if (!previous) return language.translate(current ? 'Немає бази порівняння' : 'Без змін');
  const delta = (current - previous) * 100 / Math.abs(previous);
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% ${language.translate('до попереднього періоду')}`;
}
