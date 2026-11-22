import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { waitForDevToolsPort } from './browser-helpers.mjs';

const previewURL = process.env.BIGWASH_PREVIEW_URL;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test('production-preview uses the documented Go contract without DEV fallback (mock server)', { skip: !previewURL, timeout: 240000 }, async t => {
  const base = new URL(previewURL).origin;
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Use an isolated loopback preview');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bigwash-preview-'));
  const browser = spawn(process.env.BIGWASH_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  const password = randomUUID();
  const serverToken = 'server-issued-integration-fixture';
  const user = { id: 42, firstname: 'Server', lastname: 'Fixture', role: 'admin' };
  const clients = [{ id: 1, name: 'Server client', surname: '', phone: '123', email: '', card: '', money: '0', tags: [] }];
  const cards = [{ id: 1, uid: 'SERVER-CARD', discount: 37, amount: 10, user: null }];
  const admins = [{ id: 1, firstname: 'Server', lastname: 'Admin', phone: '123', email: 'admin@example.local', role_id: 2, special_card_uid: null }];
  const exceptions = [], consoleMessages = [], requests = [], routeErrors = [];
  let socket, nextId = 0, offline = false, rejectClients = false, failWrite = true, lastAdmin, lastCard;
  const pending = new Map();
  try {
    const port = await waitForDevToolsPort(path.join(profile, 'DevToolsActivePort'));
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    const call = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const promise = pending.get(message.id);
        pending.delete(message.id);
        message.error ? promise.reject(new Error(message.error.message)) : promise.resolve(message.result);
      }
      if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
      if (message.method === 'Network.responseReceived' && message.params.type === 'Document' && message.params.response.status >= 400) routeErrors.push(new URL(message.params.response.url).pathname);
      if (message.method === 'Runtime.consoleAPICalled') consoleMessages.push(message.params.args.map(arg => arg.value ?? arg.description ?? '').join(' '));
      if (message.method === 'Page.javascriptDialogOpening') void call('Page.handleJavaScriptDialog', { accept: true });
      if (message.method === 'Fetch.requestPaused') void respond(message.params).catch(error => exceptions.push(error.message));
    };
    async function respond({ requestId, request }) {
      const url = new URL(request.url);
      if (url.origin === base && !url.pathname.startsWith('/api/')) return call('Fetch.continueRequest', { requestId });
      if (url.hostname === 'api.dicebear.com') return call('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'image/svg+xml' }], body: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>').toString('base64') });
      const route = url.pathname.replace(/^\/api\/v1/, '');
      requests.push({ route, method: request.method });
      if (offline) return call('Fetch.failRequest', { requestId, errorReason: 'ConnectionRefused' });
      let status = 200, data = {}, body = request.postData ? JSON.parse(request.postData) : {};
      if (request.method !== 'OPTIONS') {
        if (route === '/auth/register') {
          assert.deepEqual(Object.keys(body).sort(), ['email', 'firstname', 'lastname', 'password', 'phone']);
          status = 201; data = { message: 'user registered successfully', user };
        } else if (route === '/auth/login') {
          if (body.password === password) data = { user, token: serverToken };
          else { status = 401; data = { error: 'invalid credentials' }; }
        } else {
          assert.ok((request.headers.Authorization || request.headers.authorization) === 'Bearer ' + serverToken, 'Protected API must receive the server Bearer token');
          if (route === '/stats/dashboard') data = { daily_stats: { profit: 0, expenses: 0, balance: 0 } };
          else if (['/stats/monthly-chart', '/stats/payment-methods', '/stats/activities'].includes(route)) data = [];
          else if (route === '/clients' && rejectClients) { status = 401; data = { error: 'Unauthorized' }; }
          else if (route === '/clients' && request.method === 'POST') {
            if (failWrite) { status = 500; data = { error: 'Rejected fixture write' }; }
            else { data = { ...body, id: 2 }; clients.push(data); status = 201; }
          } else if (route === '/clients') data = clients;
          else if (route === '/cards') data = cards;
          else if (route === '/cards/1' && request.method === 'PUT') { lastCard = body; Object.assign(cards[0], body); data = cards[0]; }
          else if (route === '/admins') data = admins;
          else if (route === '/admins/1' && request.method === 'PUT') { lastAdmin = body; Object.assign(admins[0], body); data = admins[0]; }
          else throw new Error('Undocumented API request in preview: ' + route);
        }
      }
      return call('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [
        { name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: base },
        { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' }
      ], body: Buffer.from(JSON.stringify(data)).toString('base64') });
    }
    const evaluate = async expression => {
      const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const wait = async expression => {
      for (let attempt = 0; attempt < 300; attempt++) { if (await evaluate(expression)) return; await delay(50); }
      assert.fail('Timed out waiting for preview UI: ' + expression);
    };
    const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    const input = (selector, value) => evaluate(`(() => { const field = document.querySelector(${JSON.stringify(selector)}); field.value = ${JSON.stringify(value)}; field.dispatchEvent(new Event('input', { bubbles: true })); field.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    const navigate = async (route, selector = '.header') => { await call('Page.navigate', { url: base + route }); await wait(`location.pathname === ${JSON.stringify(route)} && !!document.querySelector(${JSON.stringify(selector)})`); };
    const login = async value => { await input('.sign-in-container input[type=email]', 'server@example.local'); await input('.sign-in-container input[autocomplete=current-password]', value); await click('.sign-in-container button[type=submit]'); };
    const setLanguage = async value => { await click('.lang-trigger-btn'); await evaluate(`document.querySelectorAll('.dropdown-item')[${value === 'RU' ? 1 : 0}].click()`); await wait(`document.documentElement.lang === '${value === 'RU' ? 'ru' : 'uk'}'`); };
    await call('Runtime.enable'); await call('Page.enable'); await call('Network.enable'); await call('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
    await t.test('registration and login use Go responses; a wrong password and F5 preserve the server boundary', async () => {
      await navigate('/login', '.sign-in-container form');
      await click('.mobile-form-tabs button:last-child');
      for (const [selector, value] of [['input[autocomplete=given-name]', 'Server'], ['input[autocomplete=family-name]', 'Fixture'], ['input[type=tel]', '123456789'], ['input[type=email]', 'server@example.local'], ['input[autocomplete=new-password]', password]]) await input('.sign-up-container ' + selector, value);
      await click('.sign-up-container button[type=submit]');
      await wait(`!!document.querySelector('.success-message')`);
      assert.equal(await evaluate(`localStorage.getItem('token')`), null);
      await login('wrong-fixture-password'); await wait(`!!document.querySelector('.sign-in-container .error-message')`);
      assert.equal(await evaluate(`localStorage.getItem('token')`), null);
      await login(password); await wait(`!!document.querySelector('.dashboard-wrapper')`);
      await call('Page.navigate', { url: base + '/' }); await wait(`location.pathname === '/dashboard' && !!document.querySelector('.dashboard-wrapper')`);
      await navigate('/cards');
      assert.ok(requests.some(request => request.route === '/stats/dashboard'));
      assert.equal(await evaluate(`!!window.__bigwashLocalFetchInstalled`), false);
    });
    await t.test('documented Clients/Cards/Admin writes retain drafts on failure and restore saved values', async () => {
      await navigate('/clients'); await click('.btn.btn-cyan'); await input('.client-modal .input-row:nth-child(1) input', 'PROD CLIENT'); await click('.client-modal .save-btn');
      await wait(`!!document.querySelector('.client-modal [role=alert]')`);
      assert.equal(await evaluate(`document.querySelector('.client-modal .input-row:nth-child(1) input').value`), 'PROD CLIENT'); assert.equal(clients.length, 1);
      failWrite = false; await click('.client-modal .save-btn'); await wait(`!document.querySelector('.client-modal')`); await navigate('/clients');
      assert.ok(await evaluate(`document.querySelector('tbody').textContent.includes('PROD CLIENT')`));
      await navigate('/cards', 'tbody .icon-btn.edit'); await click('tbody .icon-btn.edit'); assert.equal(await evaluate(`document.querySelector('#card-discount').value`), '37'); await input('#card-discount', '44'); await click('.modal-container .btn-save'); await wait(`!document.querySelector('.modal-container')`); assert.equal(lastCard.discount, 44);
      await navigate('/cards', 'tbody .icon-btn.edit'); await click('tbody .icon-btn.edit'); assert.equal(await evaluate(`document.querySelector('#card-discount').value`), '44');
      await navigate('/admin', 'tbody .icon-btn.edit'); await click('tbody .icon-btn.edit'); await input('#card-input', 'SERVER-ADMIN-CARD'); await click('.btn-submit'); await wait(`!document.querySelector('.edit-admin-panel')`); assert.equal(lastAdmin.special_card_uid, 'SERVER-ADMIN-CARD'); assert.equal('password' in lastAdmin, false);
      await navigate('/admin'); await wait(`!!document.querySelector('.card-number')`); assert.equal(await evaluate(`document.querySelector('.card-number').textContent`), 'SERVER-ADMIN-CARD');
    });
    await t.test('all routes render UA/RU in both themes without missing keys; mobile pages retain their viewport', async () => {
      for (const route of ['dashboard', 'cards', 'clients', 'admin', 'operations', 'pult', 'programs', 'discounts', 'service', 'settings', 'bug-report']) {
        await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false }); await navigate('/' + route);
        for (const language of ['UA', 'RU']) { await setLanguage(language); for (const dark of [false, true]) { await evaluate(`document.documentElement.classList.toggle('dark', ${dark})`); assert.equal(await evaluate(String.raw`/\b(?:ui|review|common|auth|sidebar)\.[a-zA-Z]+/.test(document.body.innerText)`), false, route); } }
        if (route !== 'dashboard') { await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth + 1`), route + ': page overflow'); }
      }
    });
    await t.test('PROD cannot save DEV equipment, USB, programs, media or discounts and preserves legacy records', async () => {
      await evaluate(`localStorage.setItem('bigwash.local.v1.accounts', JSON.stringify([{user:{email:'legacy@example.local'},hash:'fixture',salt:'fixture'}])); localStorage.setItem('bigwash.wash.v1', JSON.stringify({name:'KEEP-WASH'}));`);
      const before = await evaluate(`JSON.stringify({accounts:localStorage.getItem('bigwash.local.v1.accounts'),wash:localStorage.getItem('bigwash.wash.v1')})`);
      await navigate('/pult'); await click('.action-btn.edit'); await wait(`document.querySelectorAll('.tab-btn').length===8`);
      for (const tab of [0, 2, 5, 7]) {
        await evaluate(`document.querySelectorAll('.tab-btn')[${tab}].click()`);
        const selector = { 0: '.media-editor .btn-save-section', 2: '.tab-view-container > .btn-add-main', 5: '.btn-cyan-action-small', 7: '.btn-usb-add-device-new' }[tab];
        if (tab === 0) assert.equal(await evaluate(`document.querySelector('[contenteditable]').getAttribute('contenteditable')`), 'false');
        else assert.equal(await evaluate(`document.querySelector(${JSON.stringify(selector)}).disabled`), true);
      }
      await click('.footer-bar .btn-cancel'); await navigate('/discounts'); await click('.acc-header'); assert.equal(await evaluate(`document.querySelector('.ui-table .i-btn').disabled`), true);
      assert.equal(await evaluate(`JSON.stringify({accounts:localStorage.getItem('bigwash.local.v1.accounts'),wash:localStorage.getItem('bigwash.wash.v1')})`), before);
      assert.equal(await evaluate(`(async () => (await indexedDB.databases()).length)()`), 0);
      assert.ok(!requests.some(request => /\/(equipment|usb|discounts|media|pults|wash)(?:[/?]|$)/.test(request.route)));
    });
    await t.test('logout, protected 401, offline Go and local tokens never establish a DEV session', async () => {
      await click('.logout-btn'); await wait(`location.pathname === '/login'`); assert.equal(await evaluate(`localStorage.getItem('token')`), null);
      await login(password); await wait(`!!document.querySelector('.dashboard-wrapper')`);
      await evaluate(`localStorage.setItem('token','local-preview-forbidden-fixture')`); await navigate('/login', '.sign-in-container form'); await wait(`localStorage.getItem('token') === null`);
      await login(password); await wait(`!!document.querySelector('.dashboard-wrapper')`); rejectClients = true; await call('Page.navigate', { url: base + '/clients' }); await wait(`location.pathname === '/login' && !!document.querySelector('.sign-in-container form')`); assert.equal(await evaluate(`localStorage.getItem('token')`), null);
      offline = true; await login(password); await wait(`!!document.querySelector('.sign-in-container .error-message') && !document.querySelector('.sign-in-container button[type=submit]').disabled`);
      assert.equal(await evaluate(`localStorage.getItem('token')`), null); assert.equal(await evaluate(`!!window.__bigwashLocalFetchInstalled`), false);
      assert.ok(!consoleMessages.some(message => message.includes(password) || message.includes(serverToken)), 'Logs must not contain test credentials');
    });
    assert.deepEqual(exceptions, []);
    assert.deepEqual(routeErrors, [], 'Existing routes must not return document errors');
  } finally { socket?.close(); browser.kill(); }
});
