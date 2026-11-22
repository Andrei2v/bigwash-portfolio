import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { t as ua } from '../src/lib/localisation/ua.js';
import { t as ru } from '../src/lib/localisation/ru.js';
import { compile, compileModule } from 'svelte/compiler';

const source = fs.readFileSync(new URL('../src/lib/localisation/language.svelte.js', import.meta.url), 'utf8');
function fixture(saved, blocked = false, browser = true) {
  const storage = new Map(saved ? [['bigwash.lang', saved]] : []);
  const document = { documentElement: { lang: 'uk' } };
  const context = vm.createContext({ ua, ru, browser, document, $state: value => value,
    localStorage: {
      getItem: key => { if (blocked) throw Error('Blocked'); return storage.get(key); },
      setItem: (key, value) => { if (blocked) throw Error('Blocked'); storage.set(key, value); }
    }
  });
  vm.runInContext(source.replace(/^\s*import .*;\r?$/gm, '').replace('export const language', 'const language'), context);
  return { language: vm.runInContext('language', context), storage, document };
}
const keys = (obj, prefix = '') => Object.entries(obj).flatMap(([key, value]) =>
  value && typeof value === 'object' && !Array.isArray(value) ? keys(value, prefix + key + '.') : [prefix + key]);

test('UA/RU dictionaries have identical keys and interpolation parameters', () => {
  assert.deepEqual(keys(ua).sort(), keys(ru).sort());
  const get = (o, k) => k.split('.').reduce((v, p) => v[p], o);
  for (const key of keys(ua)) {
    assert.ok(!/\?{3,}/.test(String(get(ua, key))), key + ': damaged UA text');
    assert.ok(!/\?{3,}/.test(String(get(ru, key))), key + ': damaged RU text');
    assert.deepEqual(String(get(ua, key)).match(/\{\w+\}/g), String(get(ru, key)).match(/\{\w+\}/g), key);
  }
});
test('UA default, RU persistence, html.lang, locale, and return to UA', () => {
  const f = fixture();
  assert.equal(f.language.current, 'UA');
  f.language.set('RU');
  assert.equal(f.storage.get('bigwash.lang'), 'RU');
  assert.equal(f.document.documentElement.lang, 'ru');
  assert.equal(f.language.locale, 'ru-RU');
  assert.equal(f.language.t('sidebar.cards'), 'Карты');
  assert.equal(f.language.plural('header.notificationCount', 1), '1 сообщение');
  assert.equal(f.language.plural('header.notificationCount', 5), '5 сообщений');
  assert.equal(fixture('RU').language.current, 'RU');
  f.language.set('UA');
  assert.equal(f.document.documentElement.lang, 'uk');
  assert.equal(f.language.t('sidebar.cards'), 'Картки');
  assert.equal(f.language.plural('header.notificationCount', 0), '0 повідомлень');
  assert.equal(f.language.matchesSystem('Готівка', 'Наличные'), true);
  f.language.set('RU');
  assert.equal(f.language.matchesSystem('Готівка', 'Готівка'), true);
});
test('blocked storage, invalid saved values, CSR/SSR, unknown keys and user data are safe', () => {
  for (const f of [fixture('bad'), fixture(null, true), fixture(null, false, false)]) {
    assert.equal(f.language.current, 'UA');
    assert.equal(f.language.t('missing.key'), 'missing.key');
    assert.equal(f.language.translate('Custom customer / Олена'), 'Custom customer / Олена');
    f.language.set('RU');
    assert.equal(f.language.current, 'RU');
  }
});
test('manager and first-stage components compile', () => {
  compileModule(source, { filename: 'language.svelte.js', generate: 'client' });
  for (const file of ['src/lib/components/Header.svelte', 'src/lib/components/SIdebar.svelte', 'src/routes/+layout.svelte']) {
    compile(fs.readFileSync(file, 'utf8'), { filename: file, generate: 'client' });
  }
  assert.ok(!source.includes('MutationObserver'));
  assert.ok(!source.includes('innerHTML'));
});

test('interpolation and missing RU values fall back without translating user parameters', () => {
  const f = fixture('RU');
  assert.equal(f.language.t('ui.programs.modal.editTitle', { p0: 'Піна user <b>name</b>' }), 'Редактирование: Піна user <b>name</b>');
  const saved = ru.common.loading;
  try {
    delete ru.common.loading;
    assert.equal(f.language.t('common.loading'), ua.common.loading);
  } finally { ru.common.loading = saved; }
});
