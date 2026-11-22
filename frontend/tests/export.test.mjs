import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from 'svelte/compiler';

test('the actual Settings export omits sessions and nested legacy credentials without changing saved data', async () => {
  const source = fs.readFileSync(new URL('../src/routes/settings/Settings.svelte', import.meta.url), 'utf8');
  const fn = parse(source, { modern: true }).instance.content.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'exportData');
  const accounts = JSON.stringify([{ hash: 'account-hash-fixture', salt: 'account-salt-fixture' }]);
  const admins = JSON.stringify([{ id: 7, firstname: 'Export fixture', password: 'password-fixture', password_hash: 'hash-fixture', salt: 'salt-fixture', metadata: { accessToken: 'token-fixture', api_key: 'api-key-fixture', allowed: 'keep' } }]);
  const storage = new Map([['token', 'session-fixture'], ['user', '{"id":7}'], ['bigwash.local.v1.accounts', accounts], ['bigwash.local.v1.admins', admins]]);
  const reads = [];
  let exported;
  const context = vm.createContext({
    Blob, feedback: '', ru: false,
    localStorage: { getItem: key => { reads.push(key); return storage.get(key) ?? null; } },
    URL: { createObjectURL: blob => { exported = blob; return 'blob:export-fixture'; }, revokeObjectURL() {} },
    document: { createElement: () => ({ click() {}, remove() {} }), body: { append() {} } }
  });
  vm.runInContext(source.slice(fn.start, fn.end) + '\nexportData();', context);
  const text = await exported.text();
  for (const value of ['account-hash-fixture', 'account-salt-fixture', 'password-fixture', 'hash-fixture', 'salt-fixture', 'token-fixture', 'api-key-fixture', 'session-fixture']) assert.equal(text.includes(value), false);
  const result = JSON.parse(text);
  assert.deepEqual(result.data['bigwash.local.v1.admins'], [{ id: 7, firstname: 'Export fixture', metadata: { allowed: 'keep' } }]);
  assert.equal(storage.get('bigwash.local.v1.admins'), admins);
  assert.equal(storage.get('bigwash.local.v1.accounts'), accounts);
  assert.ok(!reads.some(key => ['token', 'user', 'bigwash.local.v1.accounts'].includes(key)));
  assert.equal(result.app, 'BigWash');
});
