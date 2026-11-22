import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import axios, { AxiosError } from 'axios';

const clientSource = fs.readFileSync(new URL('../src/lib/api/client.js', import.meta.url), 'utf8');
const authSource = fs.readFileSync(new URL('../src/lib/stores/auth.svelte.js', import.meta.url), 'utf8');
const demoSource = fs.readFileSync(new URL('../src/lib/demo.js', import.meta.url), 'utf8');
const runnable = source => source.replace(/^import .*;\r?$/gm, '').replaceAll('import.meta.env', 'env').replaceAll('export const ', 'const ').replace('export default api;', '');

function fixture(env, saved = {}, capabilities = {}) {
  const data = new Map(Object.entries(saved));
  const calls = [];
  const window = new EventTarget();
  const nativeFetch = async () => { throw new Error('Unexpected network fetch'); };
  window.fetch = nativeFetch;
  let behavior = 'valid';
  let release;
  let failAccountWrites = false;
  const serverAdapter = async config => {
    calls.push(config);
    if (behavior === 'offline') throw new AxiosError('Offline', 'ERR_NETWORK', config);
    if (behavior === 'html') return { status: 200, data: '<html>SPA fallback</html>', config, headers: {} };
    if (behavior === 'pending') await new Promise(resolve => { release = resolve; });
    if (behavior === 'unauthorized') {
      const response = { status: 401, data: { error: 'invalid credentials' }, config };
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, response);
    }
    return { status: 200, data: config.url === '/auth/login'
      ? { user: { id: 42 }, token: 'server-session-token' }
      : { daily_stats: { profit: 0, expenses: 0, balance: 0 } }, config, headers: {} };
  };
  const localStorage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => {
      if (failAccountWrites && key === 'bigwash.local.v1.accounts') throw new Error('Storage unavailable');
      data.set(key, String(value));
    },
    removeItem: key => data.delete(key)
  };
  const context = vm.createContext({
    env, browser: true, window, localStorage, Event, URL, Response, TextEncoder,
    crypto: webcrypto, location: { origin: 'http://localhost:5173' },
    $state: value => value,
    axios: { create: config => axios.create({ ...config, adapter: config.adapter || serverAdapter }) },
    ...capabilities
  });
  vm.runInContext(runnable(clientSource), context);
  vm.runInContext(runnable(authSource), context);
  vm.runInContext(runnable(demoSource), context);
  return {
    ...vm.runInContext('({ api, authAPI, auth, LOCAL_MODE, DEMO_MODE, API_URL, isAllowedToken, handleLocal, changeLocalCredentials })', context),
    data, calls, window, nativeFetch,
    setBehavior: value => { behavior = value; },
    failAccountWrites: value => { failAccountWrites = value; },
    release: () => release()
  };
}

test('local auth requires DEV, not PROD, and the exact explicit true flag', () => {
  for (const DEV of [false, true]) for (const PROD of [false, true]) {
    for (const value of [undefined, 'false', '', '1', 'TRUE', 'true']) {
      const expected = DEV && !PROD && value === 'true';
      const f = fixture({ DEV, PROD, VITE_LOCAL_MODE: value, VITE_DEMO_MODE: 'true' });
      assert.equal(f.LOCAL_MODE, expected);
      assert.equal(f.DEMO_MODE, expected);
      assert.equal(f.window.fetch !== f.nativeFetch, expected);
      assert.equal(f.API_URL.startsWith('/__bigwash_local__'), expected);
    }
  }
});

test('explicit local DEV login and registration still work without Go', async () => {
  const f = fixture({ DEV: true, PROD: false, VITE_LOCAL_MODE: 'true' });
  await assert.rejects(f.authAPI.login('test@bigwash.local', 'test12345'), error => error.response.status === 401);
  assert.equal(f.data.size, 0);
  const password = webcrypto.randomUUID();
  await f.authAPI.register({ firstname: 'Test', lastname: 'User', phone: '123', email: 'new@example.local', password });
  const response = await f.authAPI.login('new@example.local', password);
  assert.ok(response.data.token.startsWith('local-preview-'));
  f.auth.login(response.data.user, response.data.token);
  assert.equal(f.auth.isAuthenticated, true);
  f.auth.logout();
  assert.ok((await f.authAPI.login('new@example.local', password)).data.token.startsWith('local-preview-'));
  assert.equal(f.calls.length, 0);
});

test('explicit DEV credential rotation replaces old credentials and preserves account/data contracts', async () => {
  const env = { DEV: true, PROD: false, VITE_LOCAL_MODE: 'true' };
  const f = fixture(env, { 'bigwash.local.v1.clients': '[{"id":77}]', 'bigwash.lang': 'RU' });
  const oldPassword = webcrypto.randomUUID(), nextPassword = webcrypto.randomUUID(), otherPassword = webcrypto.randomUUID();
  await f.authAPI.register({ firstname: 'Keep', lastname: 'Profile', phone: '123', email: 'old@example.local', password: oldPassword });
  await f.authAPI.register({ firstname: 'Other', lastname: 'User', phone: '456', email: 'other@example.local', password: otherPassword });
  const login = await f.authAPI.login('old@example.local', oldPassword);
  f.auth.login(login.data.user, login.data.token);
  const before = new Map(f.data);
  await assert.rejects(f.changeLocalCredentials('old@example.local', 'incorrect', 'next@example.local', nextPassword), e => e.response.status === 401);
  await assert.rejects(f.changeLocalCredentials('old@example.local', oldPassword, 'next@example.local', 'short'), e => e.response.status === 400);
  await assert.rejects(f.changeLocalCredentials('old@example.local', oldPassword, 'other@example.local', nextPassword), e => e.response.status === 409);
  assert.deepEqual(f.data, before);
  const result = await f.changeLocalCredentials(' OLD@example.local ', oldPassword, ' NEXT@example.local ', nextPassword);
  assert.equal(result.user.id, login.data.user.id);
  assert.equal(result.user.role, login.data.user.role);
  assert.equal(result.user.firstname, login.data.user.firstname);
  assert.equal(result.user.email, 'next@example.local');
  assert.equal(f.auth.isAuthenticated, false);
  assert.equal(f.data.get('bigwash.local.v1.clients'), before.get('bigwash.local.v1.clients'));
  assert.equal(f.data.get('bigwash.lang'), 'RU');
  assert.equal(f.data.has('token'), false);
  assert.equal(f.data.has('user'), false);
  const stored = f.data.get('bigwash.local.v1.accounts');
  assert.ok(!stored.includes(oldPassword) && !stored.includes(nextPassword));
  const restored = fixture(env, Object.fromEntries(f.data));
  for (const [email, password] of [['old@example.local', oldPassword], ['old@example.local', nextPassword], ['next@example.local', oldPassword], ['next@example.local', 'incorrect']]) {
    await assert.rejects(restored.authAPI.login(email, password), e => e.response.status === 401);
  }
  assert.equal((await restored.authAPI.login('next@example.local', nextPassword)).data.user.id, login.data.user.id);
  assert.equal((await restored.authAPI.login('other@example.local', otherPassword)).data.user.email, 'other@example.local');
  await assert.rejects(restored.authAPI.register({ firstname: 'Duplicate', lastname: 'User', phone: '123', email: 'NEXT@example.local', password: otherPassword }), e => e.response.status === 409);
  assert.equal(restored.data.get('bigwash.local.v1.accounts'), stored);
  assert.equal(f.calls.length + restored.calls.length, 0);
});

test('legacy stored DEV accounts remain usable and password-only changes preserve the login', async () => {
  const env = { DEV: true, PROD: false, VITE_LOCAL_MODE: 'true' };
  const original = fixture(env);
  const oldPassword = webcrypto.randomUUID(), nextPassword = webcrypto.randomUUID();
  await original.authAPI.register({ firstname: 'Legacy', lastname: 'User', phone: '123', email: 'legacy@example.local', password: oldPassword });
  const saved = Object.fromEntries(original.data);
  const f = fixture(env, saved);
  const user = (await f.authAPI.login('legacy@example.local', oldPassword)).data.user;
  assert.equal(f.data.get('bigwash.local.v1.accounts'), saved['bigwash.local.v1.accounts']);
  await f.changeLocalCredentials('legacy@example.local', oldPassword, 'legacy@example.local', nextPassword);
  await assert.rejects(f.authAPI.login('legacy@example.local', oldPassword), e => e.response.status === 401);
  assert.equal((await f.authAPI.login('legacy@example.local', nextPassword)).data.user.id, user.id);
});

test('failed account writes do not report a successful change or end the existing session', async () => {
  const f = fixture({ DEV: true, PROD: false, VITE_LOCAL_MODE: 'true' });
  const password = webcrypto.randomUUID();
  await f.authAPI.register({ firstname: 'Test', lastname: 'User', phone: '123', email: 'saved@example.local', password });
  const response = await f.authAPI.login('saved@example.local', password);
  f.auth.login(response.data.user, response.data.token);
  const before = new Map(f.data);
  f.failAccountWrites(true);
  await assert.rejects(f.changeLocalCredentials('saved@example.local', password, 'next@example.local', webcrypto.randomUUID()), /Storage unavailable/);
  await assert.rejects(f.authAPI.register({ firstname: 'Unsaved', lastname: 'User', phone: '123', email: 'unsaved@example.local', password }), /Storage unavailable/);
  assert.deepEqual(f.data, before);
  assert.equal(f.auth.isAuthenticated, true);
  assert.equal((await f.authAPI.login('saved@example.local', password)).data.user.id, response.data.user.id);
});

test('DEV credential maintenance is unavailable outside the exact local development gate', async () => {
  for (const env of [{ DEV: false, PROD: true, VITE_LOCAL_MODE: 'true' }, { DEV: true, PROD: true, VITE_LOCAL_MODE: 'true' }, { DEV: true, PROD: false }, { DEV: true, PROD: false, VITE_LOCAL_MODE: 'false' }]) {
    const f = fixture(env, { 'bigwash.local.v1.accounts': '[]', token: 'server-session-token', user: '{"id":42}' });
    const before = new Map(f.data);
    await assert.rejects(f.changeLocalCredentials('old@example.local', 'unused', 'next@example.local', 'unused'), e => e.response.status === 403);
    assert.deepEqual(f.data, before);
    assert.equal(f.calls.length, 0);
  }
});

test('a local DEV session restores only in explicitly enabled local mode', async () => {
  const f = fixture({ DEV: true, PROD: false, VITE_LOCAL_MODE: 'true' }, {
    token: 'local-preview-saved', user: '{"id":"local-test"}'
  });
  await f.auth.init();
  assert.equal(f.auth.isAuthenticated, true);
  assert.equal(f.auth.loading, false);
  assert.equal(f.calls.length, 0);
});

test('production rejects old local tokens before restore and never installs local adapters', async () => {
  const f = fixture({ DEV: false, PROD: true, VITE_LOCAL_MODE: 'true', VITE_DEMO_MODE: 'true' }, {
    token: 'local-preview-old', user: '{"id":"local-test"}'
  });
  await f.auth.init();
  assert.equal(f.auth.isAuthenticated, false);
  assert.equal(f.data.has('token'), false);
  assert.equal(f.calls.length, 0);
  assert.throws(() => f.auth.login({ id: 'local-test' }, 'local-preview-fake'), /INVALID_AUTH_RESPONSE/);
  assert.equal(f.isAllowedToken(' local-preview-fake'), false);
  await assert.rejects(f.handleLocal('POST', 'auth/login', {}), error => error.response.status === 403);
});

test('server auth failures never fall back to seeded accounts or local tokens', async () => {
  for (const behavior of ['offline', 'unauthorized']) {
    const f = fixture({ DEV: false, PROD: true, VITE_LOCAL_MODE: 'true' });
    f.setBehavior(behavior);
    await assert.rejects(f.authAPI.login('test@bigwash.local', 'test12345'));
    assert.equal(f.calls.length, 1);
    assert.equal(f.auth.isAuthenticated, false);
    assert.equal(f.data.size, 0);
  }
});

test('saved server sessions require server acceptance, including forged JWTs', async () => {
  for (const behavior of ['offline', 'unauthorized', 'html', 'valid']) {
    const token = behavior === 'valid' ? 'server-session-token' : 'forged.jwt.signature';
    const f = fixture({ DEV: true, PROD: false }, { token, user: '{"id":42}' });
    f.setBehavior(behavior);
    await Promise.all([f.auth.init(), f.auth.init()]);
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].url, '/stats/dashboard');
    assert.equal(f.calls[0].headers.Authorization, `Bearer ${token}`);
    assert.equal(f.auth.isAuthenticated, behavior === 'valid');
    assert.equal(f.auth.loading, false);
  }
});

test('logout during session validation cannot be undone by a late response', async () => {
  const f = fixture({ DEV: false, PROD: true }, { token: 'server-token', user: '{"id":42}' });
  f.setBehavior('pending');
  const pending = f.auth.init();
  await new Promise(resolve => setImmediate(resolve));
  f.auth.logout();
  f.release();
  await pending;
  assert.equal(f.auth.isAuthenticated, false);
  assert.equal(f.auth.loading, false);
});

test('server login succeeds; a later protected 401 clears the active session', async () => {
  const f = fixture({ DEV: false, PROD: true });
  const response = await f.authAPI.login('real@example.local', 'password');
  f.auth.login(response.data.user, response.data.token);
  assert.equal(f.auth.isAuthenticated, true);
  f.setBehavior('unauthorized');
  await assert.rejects(f.api.get('/cards'));
  assert.equal(f.auth.isAuthenticated, false);
  assert.equal(f.data.has('token'), false);
});

test('every build and production/preview serve configuration disables local/demo flags', async () => {
  const config = (await import('../vite.config.js')).default;
  for (const mode of ['production', 'development', 'staging']) {
    const result = config({ command: 'build', mode });
    assert.equal(result.define['import.meta.env.VITE_LOCAL_MODE'], '"false"');
    assert.equal(result.define['import.meta.env.VITE_DEMO_MODE'], '"false"');
  }
  for (const env of [{ command: 'serve', mode: 'production' }, { command: 'serve', mode: 'development', isPreview: true }]) {
    assert.equal(config(env).define['import.meta.env.VITE_LOCAL_MODE'], '"false"');
  }
  assert.deepEqual(config({ command: 'serve', mode: 'development' }).define, {});
});

test('LAN HTTP preserves explicit local mode but rejects auth without Web Crypto, without Go or account writes', async () => {
  const saved = { 'bigwash.local.v1.accounts': JSON.stringify([{ user: { id: 'keep', email: 'keep@example.local' }, salt: 'keep', hash: 'keep' }]), 'bigwash.local.v1.clients': '[{"id":1}]' };
  const f = fixture({ DEV: true, PROD: false, VITE_LOCAL_MODE: 'true' }, saved, {
    isSecureContext: false, crypto: {}, location: { origin: 'http://192.168.0.126:5173' }
  });
  assert.equal(f.LOCAL_MODE, true);
  const unchanged = JSON.stringify([...f.data]);
  const rejected = error => error.code === 'LOCAL_AUTH_HTTPS_REQUIRED' && !error.response;
  await assert.rejects(f.authAPI.register({ firstname: 'Phone', lastname: 'User', phone: '123', email: 'phone@example.local', password: webcrypto.randomUUID() }), rejected);
  await assert.rejects(f.authAPI.login('keep@example.local', webcrypto.randomUUID()), rejected);
  await assert.rejects(f.changeLocalCredentials('keep@example.local', 'unused', 'next@example.local', webcrypto.randomUUID()), rejected);
  assert.equal(JSON.stringify([...f.data]), unchanged);
  assert.equal(f.calls.length, 0);
});

test('trusted LAN HTTPS registers/logs in, rejects a wrong password and restores the existing account/session', async () => {
  const env = { DEV: true, PROD: false, VITE_LOCAL_MODE: 'true' };
  const capabilities = { isSecureContext: true, crypto: webcrypto, location: { origin: 'https://192.168.0.126:5174' } };
  const f = fixture(env, { 'bigwash.local.v1.clients': '[{"id":1}]' }, capabilities);
  const password = webcrypto.randomUUID();
  await f.authAPI.register({ firstname: 'Phone', lastname: 'User', phone: '123', email: 'phone@example.local', password });
  await assert.rejects(f.authAPI.login('phone@example.local', 'wrong'), error => error.response.status === 401);
  const response = await f.authAPI.login('phone@example.local', password);
  f.auth.login(response.data.user, response.data.token);
  const restored = fixture(env, Object.fromEntries(f.data), capabilities);
  await restored.auth.init();
  assert.equal(restored.auth.isAuthenticated, true);
  assert.equal(restored.auth.user.id, response.data.user.id);
  restored.auth.logout();
  assert.equal(restored.data.has('token'), false);
  assert.ok((await restored.authAPI.login('phone@example.local', password)).data.token.startsWith('local-preview-'));
  assert.equal(restored.data.get('bigwash.local.v1.clients'), '[{"id":1}]');
  assert.equal(restored.data.get('bigwash.local.v1.accounts').includes(password), false);
  assert.equal(f.calls.length + restored.calls.length, 0);
});

test('secure context without Web Crypto has a specific diagnostic; production never selects local auth on LAN', async () => {
  const caps = { isSecureContext: true, crypto: {}, location: { origin: 'https://192.168.0.126:5174' } };
  const dev = fixture({ DEV: true, PROD: false, VITE_LOCAL_MODE: 'true' }, {}, caps);
  await assert.rejects(dev.authAPI.login('phone@example.local', 'unused'), error => error.code === 'LOCAL_AUTH_CRYPTO_UNAVAILABLE');
  assert.equal(dev.calls.length, 0);
  const prod = fixture({ DEV: false, PROD: true, VITE_LOCAL_MODE: 'true' }, {}, { ...caps, isSecureContext: false });
  assert.equal(prod.LOCAL_MODE, false);
  await prod.authAPI.login('phone@example.local', 'unused');
  assert.equal(prod.calls.length, 1);
  assert.equal(prod.data.size, 0);
});
