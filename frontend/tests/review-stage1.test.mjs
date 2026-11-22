import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import axios from 'axios';
import { validateClient, validCardDiscount, validWholeMoney } from '../src/lib/review-validation.js';

function localApi(saved = {}) {
  const data = new Map(Object.entries(saved));
  let failWrites = false;
  const localStorage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => { if (failWrites) throw new Error('Storage unavailable'); data.set(key, String(value)); },
    removeItem: key => data.delete(key)
  };
  const window = new EventTarget();
  window.fetch = async () => { throw new Error('Unexpected network request'); };
  const context = vm.createContext({
    axios, env: { DEV: true, PROD: false, VITE_LOCAL_MODE: 'true' },
    window, localStorage, crypto: webcrypto, TextEncoder, URL, Response, Event,
    location: { origin: 'http://localhost:5173' }, validateClient, validCardDiscount
  });
  const source = fs.readFileSync(new URL('../src/lib/api/client.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?$/gm, '').replaceAll('import.meta.env', 'env')
    .replaceAll('export const ', 'const ').replace('export default api;', '');
  vm.runInContext(source, context);
  return { ...vm.runInContext('({ api, handleLocal })', context), data, failWrites: value => { failWrites = value; } };
}

test('client identity requires one existing model field, without arbitrary mandatory phone/name pairs', () => {
  assert.equal(validateClient({ name: ' ', surname: '', phone: '', email: '', card: '', money: '50', tags: [{ name: 'Tag' }] }, { creating: true }), 'clientIdentityRequired');
  for (const field of ['name', 'surname', 'firstname', 'lastname', 'phone', 'card']) {
    assert.equal(validateClient({ [field]: 'Identifier' }, { creating: true }), '');
  }
  assert.equal(validateClient({ email: 'valid@example.local' }, { creating: true }), '');
  assert.equal(validateClient({ name: 'Client', email: 'invalid' }, { creating: true }), 'clientEmailInvalid');
});

test('legacy clients can be edited without rewriting existing email or discarding old records', () => {
  const previous = { id: 1, name: 'Legacy', email: 'legacy import' };
  assert.equal(validateClient({ ...previous, money: '25' }, { previous }), '');
  assert.equal(validateClient({ ...previous, email: 'new invalid' }, { previous }), 'clientEmailInvalid');
  assert.equal(validateClient({ name: '', email: '' }, { previous }), 'clientIdentityRequired');
  assert.equal(validateClient({ id: 2, money: '25' }, { previous: { id: 2, money: '0' } }), '');
});

test('local API rejects blank clients before writing and preserves valid clients across reloads', async () => {
  const f = localApi();
  await assert.rejects(f.api.post('/clients', { name: ' ', surname: '', phone: '', email: '', card: '' }), error => error.response.status === 400);
  assert.equal(f.data.has('bigwash.local.v1.clients'), false);
  const created = (await f.api.post('/clients', { phone: '+380123456789' })).data;
  assert.ok(created.id);
  const restored = localApi(Object.fromEntries(f.data));
  assert.equal((await restored.api.get(`/clients/${created.id}`)).data.phone, '+380123456789');
  const before = restored.data.get('bigwash.local.v1.clients');
  await assert.rejects(restored.api.put(`/clients/${created.id}`, { phone: '' }), error => error.response.status === 400);
  assert.equal(restored.data.get('bigwash.local.v1.clients'), before);
});

test('card discounts accept the documented percentage range and reject invalid numbers', () => {
  for (const value of [0, 12.5, 100]) assert.equal(validCardDiscount(value), true);
  for (const value of [-1, 100.01, NaN, Infinity, undefined, null, '', '10']) assert.equal(validCardDiscount(value), false);
});

test('card discount persists through create/update/reload; invalid writes preserve saved data', async () => {
  const f = localApi();
  const card = (await f.api.post('/cards', { uid: 'REVIEW-CARD', amount: 25, discount: 12.5 })).data;
  await f.api.put(`/cards/${card.id}`, { discount: 30 });
  const restored = localApi(Object.fromEntries(f.data));
  assert.equal((await restored.api.get(`/cards/${card.id}`)).data.discount, 30);
  const before = restored.data.get('bigwash.local.v1.cards');
  for (const discount of [-1, 101]) {
    await assert.rejects(restored.api.put(`/cards/${card.id}`, { discount }), error => error.response.status === 400);
    assert.equal(restored.data.get('bigwash.local.v1.cards'), before);
  }
  restored.failWrites(true);
  await assert.rejects(restored.api.put(`/cards/${card.id}`, { discount: 40 }), /Storage unavailable/);
  assert.equal(restored.data.get('bigwash.local.v1.cards'), before);
});

test('whole-hryvnia validation rejects fractions without modifying legacy amounts', () => {
  for (const value of [0, 1, 250]) assert.equal(validWholeMoney(value), true);
  for (const value of [0.01, 5.5, -1, NaN, Infinity, undefined, '25', Number.MAX_SAFE_INTEGER + 1]) assert.equal(validWholeMoney(value), false);
  const legacy = { price: 12.5, cost: 3.2 };
  assert.equal(validWholeMoney(legacy.price), false);
  assert.equal(validWholeMoney(legacy.cost), false);
  assert.deepEqual(legacy, { price: 12.5, cost: 3.2 });
});
