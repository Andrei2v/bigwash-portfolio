import { waitForDevToolsPort } from './browser-helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// Opt in against a running local DEV server; no packages or existing browser profile are required.
const baseURL = process.env.BIGWASH_BROWSER_URL;
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

test('UI browser regressions (stages 3–5)', { skip: !baseURL, timeout: 600000 }, async t => {
  const base = new URL(baseURL).origin;
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname), 'Use a loopback DEV server');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bigwash-stage3-'));
  const chrome = process.env.BIGWASH_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  assert.ok(fs.existsSync(chrome), 'Set BIGWASH_CHROME_PATH to your installed Chrome executable');
  const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  const pending = new Map();
  const exceptions = [];
  let socket;
  let requestId = 0;
    let acceptDialog = true;
    let networkHandler;
  try {
    const port = await waitForDevToolsPort(path.join(profile, 'DevToolsActivePort'));
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    const call = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++requestId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const promise = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) promise.reject(new Error(message.error.message));
        else promise.resolve(message.result);
      }
      if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
      if (message.method === 'Page.javascriptDialogOpening') void call('Page.handleJavaScriptDialog', { accept: acceptDialog });
      if (message.method === 'Fetch.requestPaused' && networkHandler) void networkHandler(message.params).catch(error => exceptions.push(String(error)));
    };
    const evaluate = async expression => {
      const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const waitFor = async expression => {
      for (let attempt = 0; attempt < 200; attempt++) {
        if (await evaluate(expression)) return;
        await delay(50);
      }
      assert.fail(`Timed out: ${expression}`);
    };
    const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    const input = (selector, value) => evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      element.value = ${JSON.stringify(value)};
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    const navigate = async (route, selector) => {
      await call('Page.navigate', { url: base + route });
      await waitFor(`!!document.querySelector(${JSON.stringify(selector)})`);
    };
    const language = async value => {
      await click('.lang-trigger-btn');
      await evaluate(`document.querySelectorAll('.dropdown-item')[${value === 'RU' ? 1 : 0}].click()`);
      await waitFor(`document.documentElement.lang === '${value === 'RU' ? 'ru' : 'uk'}'`);
    };
    const openPult = async () => { await click('.action-btn.edit'); await waitFor(`document.querySelectorAll('.tab-btn').length === 8`); };
    await call('Runtime.enable');
    await call('Page.enable');
    await navigate('/login', '.sign-in-container form');
    await evaluate(`(async () => {
      const api = await import('/src/lib/api/client.js');
      if (!api.LOCAL_MODE) throw new Error('Browser regression requires explicit local DEV mode');
      const email = 'stage3-' + crypto.randomUUID() + '@example.local';
      const password = crypto.randomUUID();
      await api.authAPI.register({ firstname: 'Stage', lastname: 'Three', phone: '123456789', email, password });
      const response = await api.authAPI.login(email, password);
      const { auth } = await import('/src/lib/stores/auth.svelte.js');
      auth.login(response.data.user, response.data.token);
    })()`);
    const session = await evaluate(`localStorage.getItem('token')`);

    await t.test('Header fits at 100%/125%, preserves menu actions, UA/RU and themes', async () => {
      for (const route of ['/dashboard', '/discounts', '/bug-report']) {
        await navigate(route, '.header');
        for (const physicalWidth of [1920, 1440, 1366, 1024, 768, 600]) {
          for (const zoom of [1, 1.25]) {
            const width = Math.round(physicalWidth / zoom);
            await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: zoom, mobile: false });
            for (const lang of ['UA', 'RU']) {
              await language(lang);
              for (const dark of [false, true]) {
                await evaluate(`document.documentElement.classList.toggle('dark', ${dark})`);
                const outliers = await evaluate(`Array.from(document.querySelectorAll('.header, .header *')).filter(element => {
                  const box = element.getBoundingClientRect();
                  return box.width && (box.left < -1 || box.right > innerWidth + 1);
                }).map(element => element.className)`);
                assert.deepEqual(outliers, [], JSON.stringify({ route, physicalWidth, zoom, lang, dark, outliers }));
              }
            }
          }
        }
      }
      await call('Emulation.setDeviceMetricsOverride', { width: 768, height: 1000, deviceScaleFactor: 1, mobile: false });
      await click('.mobile-toggle');
      await waitFor(`document.querySelector('.sidebar').classList.contains('open')`);
      await click('.mobile-toggle');
      await waitFor(`!document.querySelector('.sidebar').classList.contains('open')`);
      await click('.notif-button');
      await waitFor(`!!document.querySelector('.notif-menu')`);
      const bounds = await evaluate(`(() => {const box = document.querySelector('.notif-menu').getBoundingClientRect();return {left:box.left,right:box.right};})()`);
      assert.ok(bounds.left >= 0 && bounds.right <= 769, JSON.stringify(bounds));
      await click('.notif-button');
    });

    await t.test('USB auto presets affect only supported fields, keep accurate dirty state, cancel and persist', async () => {
      await navigate('/pult', '.action-btn.edit');
      await openPult();
      await evaluate(`document.querySelectorAll('.tab-btn')[7].click()`);
      await waitFor(`!!document.querySelector('#usb-paypass-auto')`);
      assert.equal(await evaluate(`document.querySelectorAll('.usb-preset-button').length`), 13);
      assert.equal(await evaluate(`!!document.querySelector('.usb-config-header-row-custom .unsaved-warning')`), false);
      await input('#usb-paypass', 'COM9');
      await input('#usb-cash', 'COM8');
      await click('#usb-paypass-auto');
      assert.equal(await evaluate(`document.querySelector('#usb-cash').value`), 'COM8');
      await click('#usb-cash-auto');
      assert.equal(await evaluate(`!!document.querySelector('.usb-config-header-row-custom .unsaved-warning')`), false);
      await input('#usb-buttons', 'KEEP');
      await input('#usb-paypass', 'COM9');
      await click('.usb-save-btn-confirm-new');
      const saved = await evaluate(`localStorage.getItem('bigwash.local.v1.usb.1')`);
      await click('#usb-paypass-auto');
      await language('RU');
      assert.equal(await evaluate(`document.querySelector('#usb-paypass').value`), 'auto');
      assert.equal(await evaluate(`document.querySelector('#usb-buttons').value`), 'KEEP');
      await click('.usb-cancel-btn-link-new');
      assert.equal(await evaluate(`document.querySelector('#usb-paypass').value`), 'COM9');
      assert.equal(await evaluate(`localStorage.getItem('bigwash.local.v1.usb.1')`), saved);
      await click('#usb-paypass-auto');
      await evaluate(`window.nativeSet = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) {
        if (key === 'bigwash.local.v1.usb.1') throw new Error('Simulated storage failure');
        return nativeSet.call(this, key, value);
      };`);
      await click('.usb-save-btn-confirm-new');
      await waitFor(`!!document.querySelector('.modal-container [role=alert]')`);
      assert.equal(await evaluate(`localStorage.getItem('bigwash.local.v1.usb.1')`), saved);
      assert.equal(await evaluate(`document.querySelector('#usb-paypass').value`), 'auto');
      await evaluate(`Storage.prototype.setItem = nativeSet`);
      await click('.usb-save-btn-confirm-new');
      await navigate('/pult', '.action-btn.edit');
      await openPult();
      await evaluate(`document.querySelectorAll('.tab-btn')[7].click()`);
      assert.equal(await evaluate(`document.querySelector('#usb-paypass').value`), 'auto');
      assert.equal(await evaluate(`document.querySelector('#usb-buttons').value`), 'KEEP');
      assert.equal(await evaluate(`!!document.querySelector('.usb-config-header-row-custom .unsaved-warning')`), false);
      await click('.footer-bar .btn-cancel');
    });

    await t.test('discount state is separate from action; agreed icons, cancellation, save/F5 and failure remain correct', async () => {
      await navigate('/discounts', '.acc-header');
      for (const lang of ['UA', 'RU']) {
        await language(lang);
        for (let section = 0; section < 6; section++) {
          await evaluate(`document.querySelectorAll('.acc-header')[${section}].click()`);
          const actionSelector = section < 2 ? '.i-btn' : section === 2 ? '.btn-save-sq' : '.c-foot .btn-sq:last-child';
          const stateSelector = section < 2 ? 'tbody .discount-state' : section === 2 ? '.program-discount-state' : '.status-card .st';
          if (section < 2) {
            const clipped = await evaluate(`(() => {
              const body = document.querySelector('.acc-body').getBoundingClientRect();
              return Array.from(document.querySelectorAll('.ui-table input, .ui-table button, .discount-state')).filter(element => {
                const box = element.getBoundingClientRect();
                return box.left < body.left || box.right > body.right;
              }).map(element => element.className);
            })()`);
            assert.deepEqual(clipped, [], 'State labels and actions must remain visible at 768px');
          }
          const before = await evaluate(`document.querySelector(${JSON.stringify(stateSelector)}).textContent`);
          const label = await evaluate(`document.querySelector(${JSON.stringify(actionSelector)}).getAttribute('aria-label')`);
          assert.equal(await evaluate(`document.querySelector(${JSON.stringify(actionSelector)}).title`), label);
          await click(actionSelector);
          const after = await evaluate(`document.querySelector(${JSON.stringify(stateSelector)}).textContent`);
          assert.notEqual(after, before);
          const active = await evaluate(`(() => { const state = document.querySelector(${JSON.stringify(stateSelector)}); return state.classList.contains('active') || !!state.querySelector('.active'); })()`);
          assert.ok(after.includes(active ? 'Активна' : 'Неактивна'));
          assert.equal(await evaluate(`document.querySelector(${JSON.stringify(actionSelector)}).textContent`), active ? '✖️' : '✔️');
          assert.equal(await evaluate(`localStorage.getItem('bigwash.local.v1.discounts')`), null);
          await click('.config-actions .btn-add-prog');
          assert.equal(await evaluate(`document.querySelector(${JSON.stringify(stateSelector)}).textContent`), before);
          assert.equal(await evaluate(`Array.from(document.querySelectorAll('.acc-body button')).some(button => button.textContent.includes('🗑'))`), false);
        }
      }
      await evaluate(`document.querySelectorAll('.acc-header')[0].click()`);
      await click('.i-btn');
      await click('.config-actions .btn-action-green');
      const saved = await evaluate(`localStorage.getItem('bigwash.local.v1.discounts')`);
      assert.equal(JSON.parse(saved).turnoverRows[0].active, true);
      await navigate('/discounts', '.acc-header');
      await click('.acc-header');
      assert.equal(await evaluate(`document.querySelector('.i-btn').textContent`), '✖️');
      await click('.i-btn');
      await evaluate(`window.nativeSet = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) {
        if (key === 'bigwash.local.v1.discounts') throw new Error('Simulated storage failure');
        return nativeSet.call(this, key, value);
      };`);
      await click('.config-actions .btn-action-green');
      await waitFor(`!!document.querySelector('.page-content > [role=alert]')`);
      assert.equal(await evaluate(`localStorage.getItem('bigwash.local.v1.discounts')`), saved);
      assert.equal(await evaluate(`document.querySelector('.i-btn').textContent`), '✔️');
      await evaluate(`Storage.prototype.setItem = nativeSet`);
      await click('.config-actions .btn-add-prog');
      assert.equal(await evaluate(`document.querySelector('.i-btn').textContent`), '✖️');
    });
    await t.test('relay slots and pause config support validation, edits, confirmation, cancellation and reload', async () => {
      await navigate('/pult', '.action-btn.edit'); await openPult();
      await evaluate(`document.querySelectorAll('.tab-btn')[2].click()`);
      assert.equal(await evaluate(`document.querySelectorAll('.relay-slots button').length`), 12);
      assert.equal(await evaluate(`document.querySelectorAll('.relay-slots .occupied').length`), 1);
      await evaluate(`document.querySelectorAll('.relay-slots button')[1].click()`);
      await input('#equipment-name', 'Stage4 pump');
      assert.equal(await evaluate(`document.querySelector('#equipment-relay').value`), '2');
      assert.equal(await evaluate(`document.querySelector('#equipment-relay option[value="1"]').disabled`), true);
      await click('.eq-actions .btn-orange');
      await waitFor(`document.querySelector('#equipment-name').readOnly`);
      await click('.eq-actions .btn-orange'); await input('#equipment-name', 'Cancelled');
      await click('.eq-actions .btn-del');
      assert.equal(await evaluate(`document.querySelector('#equipment-name').value`), 'Stage4 pump');
      await click('.eq-actions .btn-orange'); await input('#equipment-relay', '3');
      await language('RU'); assert.equal(await evaluate(`document.querySelector('#equipment-relay').value`), '3');
      await click('.eq-actions .btn-orange');
      const key = 'bigwash.local.v1.equipment.1';
      const id = await evaluate(`JSON.parse(localStorage.getItem('${key}')).find(node=>node.name==='Stage4 pump').id`);
      await click('.footer-bar .btn-cancel');
      await navigate('/pult', '.action-btn.edit'); await openPult();
      await evaluate(`document.querySelectorAll('.tab-btn')[2].click()`); await input('#equipment-select', id);
      assert.equal(await evaluate(`document.querySelector('#equipment-relay').value`), '3');
      acceptDialog = false; await click('.eq-actions .btn-del');
      assert.equal(await evaluate(`JSON.parse(localStorage.getItem('${key}')).some(node=>node.id===${JSON.stringify(id)})`), true);
      acceptDialog = true; await click('.eq-actions .btn-del');
      assert.equal(await evaluate(`JSON.parse(localStorage.getItem('${key}')).some(node=>node.id===${JSON.stringify(id)})`), false);
      await evaluate(`document.querySelectorAll('.tab-btn')[5].click()`);
      assert.equal(await evaluate(`document.querySelectorAll('.program-edit-row').length`), 2);
      await input('#pause-duration', '0'); await click('.program-block-card:last-child .btn-save-section');
      await waitFor(`!!document.querySelector('.program-block-card:last-child [role=alert]')`);
      await input('#pause-duration', '30'); await click('.program-block-card:last-child .btn-save-section');
      assert.equal(await evaluate(`JSON.parse(localStorage.getItem('bigwash.local.v1.servicePrograms.1')).pauseSeconds`), 30);
      await input('#pause-duration', '60'); await click('.program-block-card:last-child .btn-cancel-section');
      assert.equal(await evaluate(`document.querySelector('#pause-duration').value`), '30');
      await click('.footer-bar .btn-cancel'); await navigate('/pult', '.action-btn.edit'); await openPult();
      await evaluate(`document.querySelectorAll('.tab-btn')[5].click()`);
      assert.equal(await evaluate(`document.querySelector('#pause-duration').value`), '30');
      await click('.footer-bar .btn-cancel');
    });

    await t.test('wash map supports both geocoding directions, manual fallback, stale response protection and save/cancel/reload', async () => {
      let failGeocoding = false;
      let slow = false;
      let calls = 0;
      networkHandler = async paused => {
        const url = new URL(paused.request.url);
        if (url.hostname === 'tile.openstreetmap.org') {
          await call('Fetch.fulfillRequest', { requestId: paused.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'image/png' }], body: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=' });
          return;
        }
        calls++;
        if (failGeocoding) { await call('Fetch.failRequest', { requestId: paused.requestId, errorReason: 'ConnectionRefused' }); return; }
        if (slow) await delay(500);
        const reverse = url.pathname.includes('reverse');
        const data = { features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: reverse ? [Number(url.searchParams.get('lon')), Number(url.searchParams.get('lat'))] : [30.5234, 50.4501] }, properties: { name: reverse ? 'Reverse address' : 'Search address', city: 'Kyiv' } }] };
        try { await call('Fetch.fulfillRequest', { requestId: paused.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: Buffer.from(JSON.stringify(data)).toString('base64') }); }
        catch (error) { if (!slow) throw error; }
      };
      await call('Fetch.enable', { patterns: [{ urlPattern: 'https://photon.komoot.io/*' }, { urlPattern: 'https://tile.openstreetmap.org/*' }] });
      await click('.btn-side.orange'); await input('#wash-address', 'Stage4 address');
      await click('.location-search'); await waitFor(`!document.querySelector('.location-search').disabled`);
      await waitFor(`document.querySelector('#wash-latitude').value==='50.4501'`);
      assert.equal(await evaluate(`document.querySelector('#wash-longitude').value`), '30.5234');
      assert.ok((await evaluate(`document.querySelector('#wash-address').value`)).includes('Search address'));
      await language('UA'); assert.equal(await evaluate(`document.querySelector('#wash-latitude').value`), '50.4501');
      await click('.edit-card .btn-primary'); await waitFor(`!document.querySelector('.edit-card')`);
      await navigate('/pult', '.btn-side.orange'); await click('.btn-side.orange');
      assert.equal(await evaluate(`document.querySelector('#wash-longitude').value`), '30.5234');
      await click('.map-surface'); await waitFor(`document.querySelector('#wash-address').value.includes('Reverse address')`);
      const saved = await evaluate(`localStorage.getItem('bigwash.wash.v1')`);
      failGeocoding = true;
      await input('#wash-address', 'Network failure address'); await click('.location-search');
      await waitFor(`!!document.querySelector('.location-picker [role=alert]')`);
      assert.equal(await evaluate(`document.querySelector('#wash-address').value`), 'Network failure address');
      assert.equal(await evaluate(`localStorage.getItem('bigwash.wash.v1')`), saved);
      await input('#wash-latitude', '49'); await input('#wash-longitude', '31');
      await click('.edit-card .btn-link'); await click('.btn-side.orange');
      assert.equal(await evaluate(`document.querySelector('#wash-longitude').value`), '30.5234');
      failGeocoding = false; slow = true;
      await input('#wash-address', 'Slow stale address'); const previousCalls = calls;
      await click('.location-search');
      for (let attempt = 0; attempt < 100 && calls === previousCalls; attempt++) await delay(50);
      await input('#wash-address', 'Keep manual address'); await delay(800);
      assert.equal(await evaluate(`document.querySelector('#wash-address').value`), 'Keep manual address');
      await click('.edit-card .btn-link');
      await call('Fetch.disable'); networkHandler = null;
    });

    await t.test('Promo global/individual configuration persists, cancels and reaches the selected pult summary', async () => {
      await navigate('/service', '#promo-enabled');
      assert.equal(await evaluate(`localStorage.getItem('bigwash.local.v1.promo')`), null);
      await click('#promo-enabled'); await input('#promo-scope', 'individual');
      await click('.promo-settings .save-btn-full'); await waitFor(`!!document.querySelector('.promo-settings [role=alert]')`);
      await click('.promo-target input'); await language('RU');
      assert.equal(await evaluate(`document.querySelector('.promo-target input').checked`), true);
      await click('.promo-settings .save-btn-full');
      assert.deepEqual(await evaluate(`JSON.parse(localStorage.getItem('bigwash.local.v1.promo')).pultIds`), [1]);
      await input('#promo-scope', 'global'); await click('.promo-cancel');
      assert.equal(await evaluate(`document.querySelector('#promo-scope').value`), 'individual');
      await input('#promo-scope', 'global'); await click('.promo-settings .save-btn-full');
      await navigate('/pult', '.action-btn.edit'); await evaluate(`document.querySelectorAll('.action-btn.edit')[1].click()`);
      await waitFor(`document.querySelectorAll('.tab-btn').length===8`); await evaluate(`document.querySelectorAll('.tab-btn')[1].click()`);
      assert.equal(await evaluate(`document.querySelector('[data-promo-active]').dataset.promoActive`), 'true');
      await click('.footer-bar .btn-cancel'); await navigate('/service', '#promo-scope');
      await input('#promo-scope', 'individual'); assert.equal(await evaluate(`document.querySelector('.promo-target input').checked`), true);
      await click('.promo-settings .save-btn-full');
      await navigate('/pult', '.action-btn.edit'); await evaluate(`document.querySelectorAll('.action-btn.edit')[1].click()`);
      await waitFor(`document.querySelectorAll('.tab-btn').length===8`); await evaluate(`document.querySelectorAll('.tab-btn')[1].click()`);
      assert.equal(await evaluate(`document.querySelector('[data-promo-active]').dataset.promoActive`), 'false');
      await click('.footer-bar .btn-cancel'); await openPult(); await evaluate(`document.querySelectorAll('.tab-btn')[1].click()`);
      assert.equal(await evaluate(`document.querySelector('[data-promo-active]').dataset.promoActive`), 'true');
      await click('.footer-bar .btn-cancel'); await navigate('/service', '#promo-scope');
      const saved = await evaluate(`localStorage.getItem('bigwash.local.v1.promo')`);
      await input('#promo-scope', 'global');
      await evaluate(`window.nativeSet = Storage.prototype.setItem; Storage.prototype.setItem = function(key,value){ if(key==='bigwash.local.v1.promo') throw Error('Full'); return nativeSet.call(this,key,value); };`);
      await click('.promo-settings .save-btn-full'); await waitFor(`!!document.querySelector('.promo-settings [role=alert]')`);
      assert.equal(await evaluate(`localStorage.getItem('bigwash.local.v1.promo')`), saved);
      await evaluate(`Storage.prototype.setItem = nativeSet`); await click('.promo-cancel');
      assert.equal(await evaluate(`document.querySelector('#promo-scope').value`), 'individual');
    });
﻿    await t.test('pult programs create, edit, assign manually, reject conflicts, cancel and persist without duplicates', async () => {
      await call('Emulation.setDeviceMetricsOverride', { width: 1024, height: 900, deviceScaleFactor: 1, mobile: false });
      await navigate('/pult', '.action-btn.edit'); await openPult(); await evaluate(`document.querySelectorAll('.tab-btn')[5].click()`);
      await waitFor(`!document.querySelector('.btn-cyan-action-small').disabled`);
      assert.equal(await evaluate(`document.querySelectorAll('.program-edit-row')[1].querySelector('output').textContent`), '13');
      await click('.btn-cyan-action-small'); await input('#pult-program-name', 'DEV test program'); await click('.program-dialog button[type=submit]');
      await waitFor(`document.querySelectorAll('.program-edit-row').length === 3 && !document.querySelector('.program-dialog')`);
      const selector = '.program-edit-row:last-child';
      await click(selector + ' .btn-define-rectangular'); await input('#program-button-number', '13'); await click('.program-dialog button[type=submit]');
      await waitFor(`!!document.querySelector('.program-dialog [role=alert]')`);
      assert.equal(await evaluate(`JSON.parse(localStorage.getItem('bigwash.local.v1.pultPrograms.1'))[2].button`), null);
      await input('#program-button-number', '37'); await click('.program-dialog button[type=submit]');
      await waitFor(`!document.querySelector('.program-dialog')`);
      assert.equal(await evaluate(`document.querySelector('.program-edit-row:last-child output').textContent`), '37');
      await click(selector + ' .program-edit-name'); await input('#pult-program-name', 'Cancelled'); await language('UA');
      assert.equal(await evaluate(`document.querySelector('#pult-program-name').value`), 'Cancelled');
      await click('.program-dialog .btn-cancel-section'); assert.match(await evaluate(`document.querySelector('.program-edit-row:last-child').textContent`), /DEV test program/);
      await click(selector + ' .program-edit-name'); await input('#pult-program-name', 'Edited program');
      await evaluate(`window.nativeProgramSet = Storage.prototype.setItem; Storage.prototype.setItem = function(key,value){ if(key==='bigwash.local.v1.pultPrograms.1') throw Error('Full'); return nativeProgramSet.call(this,key,value); };`);
      await click('.program-dialog button[type=submit]'); await waitFor(`!!document.querySelector('.program-dialog [role=alert]')`);
      assert.equal(await evaluate(`JSON.parse(localStorage.getItem('bigwash.local.v1.pultPrograms.1'))[2].name`), 'DEV test program');
      await evaluate(`Storage.prototype.setItem = nativeProgramSet`); await click('.program-dialog button[type=submit]');
      await click(selector + ' input[type=checkbox]'); await click('.program-block-card .btn-cancel-section');
      await navigate('/pult', '.action-btn.edit'); await openPult(); await evaluate(`document.querySelectorAll('.tab-btn')[5].click()`);
      assert.equal(await evaluate(`document.querySelectorAll('.program-edit-row').length`),3);
      assert.match(await evaluate(`document.querySelector('.program-edit-row:last-child').textContent`), /Edited program/);
      assert.equal(await evaluate(`document.querySelector('.program-edit-row:last-child output').textContent`),'37');
      acceptDialog=false; await click(selector+' .delete'); assert.equal(await evaluate(`document.querySelectorAll('.program-edit-row').length`),3);
      acceptDialog=true; await click(selector+' .delete'); await waitFor(`document.querySelectorAll('.program-edit-row').length===2`);
      await click('.footer-bar .btn-cancel');
    });

    await t.test('USB presets exist only in USB and preserve manual values, cancellation and F5', async () => {
      await navigate('/pult', '.action-btn.edit'); await openPult(); await evaluate(`document.querySelectorAll('.tab-btn')[1].click()`);
      assert.equal(await evaluate(`document.querySelectorAll('.usb-preset-button').length`), 0);
      await evaluate(`document.querySelectorAll('.tab-btn')[7].click()`);
      await waitFor(`!!document.querySelector('#usb-paypass-ttyACM1')`);
      await click('#usb-paypass-ttyACM1'); await click('#usb-buttons-ttyS7'); await click('#usb-barcode-ttyACM0');
      assert.equal(await evaluate(`document.querySelector('#usb-cash').value`),'auto');
      assert.equal(await evaluate(`document.querySelector('#usb-buttons-ttyS7').getAttribute('aria-pressed')`),'true');
      await click('.usb-save-btn-confirm-new');
      await evaluate(`document.querySelectorAll('.tab-btn')[7].click()`);
      assert.equal(await evaluate(`document.querySelector('#usb-paypass').value`),'ttyACM1');
      assert.equal(await evaluate(`!!document.querySelector('.unsaved-warning')`),false);
      await click('#usb-buttons-ttyUSB0'); await click('.usb-cancel-btn-link-new');
      assert.equal(await evaluate(`document.querySelector('#usb-buttons').value`),'ttyS7');
      await navigate('/pult', '.action-btn.edit');await openPult();await evaluate(`document.querySelectorAll('.tab-btn')[1].click()`);
      assert.equal(await evaluate(`document.querySelectorAll('.usb-preset-button').length`), 0);
      await evaluate(`document.querySelectorAll('.tab-btn')[7].click()`);
      assert.equal(await evaluate(`document.querySelector('#usb-paypass').value`),'ttyACM1');await click('.footer-bar .btn-cancel');
    });

    await t.test('media sanitization rejects hostile markup, external image URLs and invalid files', async () => {
      const result=await evaluate(`(async()=>{
        const m=await import('/src/lib/media.js'); window.__mediaXss=0;
        const text=m.sanitizeMedia('<script>window.__mediaXss=1</script><img src=x onerror="window.__mediaXss=2"><svg onload=alert(1)></svg><a href="javascript:alert(1)">safe</a><b onclick=alert(1)>bold</b><img data-asset-id="known" src="https://evil.test/x" onerror=alert(1)>',[{id:'known'}]);
        const errors=[];for(const file of [new File(['x'],'bad.svg',{type:'image/svg+xml'}),new File([new Uint8Array(m.MEDIA_FILE_LIMIT+1)],'big.png',{type:'image/png'}),new File(['not a png'],'bad.png',{type:'image/png'})]){try{await m.readMediaFile(file);}catch(error){errors.push(error.message);}}
        return {text,errors,xss:window.__mediaXss};})()`);
      assert.equal(result.text,'safe<b>bold</b><img data-asset-id="known">');assert.equal(result.xss,0);
      assert.deepEqual(result.errors,['mediaFileType','mediaFileSize','mediaFileType']);
    });

    await t.test('visual media editor formats selected text, saves images/GIF atomically, cancels and recovers after F5', async () => {
      await navigate('/pult', '.action-btn.edit');await openPult();await evaluate(`document.querySelectorAll('.tab-btn')[0].click()`);
      await waitFor(`document.querySelector('#media-text')?.contentEditable==='true'`);
      await evaluate(`(()=>{const e=document.querySelector('#media-text');e.textContent='alpha beta gamma';e.dispatchEvent(new InputEvent('input',{bubbles:true}));})()`);
      await evaluate(`(()=>{const e=document.querySelector('#media-text');e.focus();const r=document.createRange();r.setStart(e.firstChild,6);r.setEnd(e.firstChild,10);const s=getSelection();s.removeAllRanges();s.addRange(r);document.dispatchEvent(new Event('selectionchange'));})()`);
      await click('[data-command=bold]'); assert.match(await evaluate(`document.querySelector('#media-text').innerHTML`),/<b>beta<\/b>/);
      await click('[data-command=italic]'); assert.match(await evaluate(`document.querySelector('#media-text').innerHTML`),/<i>/);
      await click('[data-command=underline]'); assert.match(await evaluate(`document.querySelector('#media-text').innerHTML`),/<u>/);
      await click('[data-command=removeFormat]'); assert.equal(await evaluate(`document.querySelector('#media-text').textContent`),'alpha beta gamma');
      await click('[data-command=insertLineBreak]');assert.ok(await evaluate(`!!document.querySelector('#media-text br')`));
      await click('.preview-button'); assert.equal(await evaluate(`document.querySelector('#media-text').contentEditable`),'false');await click('.preview-button');
      const upload=async(type,base64,name)=>evaluate(`(()=>{const input=document.querySelector('.file-input');const transfer=new DataTransfer();transfer.items.add(new File([Uint8Array.from(atob(${JSON.stringify(base64)}),c=>c.charCodeAt(0))],${JSON.stringify(name)},{type:${JSON.stringify(type)}}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5XQAAAAASUVORK5CYII=';
      const gif=Buffer.from([...'GIF89a'].map(c=>c.charCodeAt(0)).concat([1,0,1,0,128,0,0,0,0,0,255,255,255,33,255,11], [...'NETSCAPE2.0'].map(c=>c.charCodeAt(0)),[3,1,0,0,0,33,249,4,0,10,0,0,0,44,0,0,0,0,1,0,1,0,0,2,2,68,1,0,33,249,4,0,10,0,0,0,44,0,0,0,0,1,0,1,0,0,2,2,76,1,0,59])).toString('base64');
      await upload('image/png',png,'pixel.png');await waitFor(`document.querySelectorAll('#media-text img').length===1 && document.querySelector('#media-text img').naturalWidth===1`);
      await upload('image/gif',gif,'animated.gif');await waitFor(`document.querySelectorAll('#media-text img').length===2`);
      const frames=new Set();
      for(let attempt=0;attempt<12&&frames.size<2;attempt++){
        const box=await evaluate(`(()=>{const img=document.querySelector('#media-text img[alt="animated.gif"]');img.scrollIntoView({block:'nearest'});const b=img.getBoundingClientRect();return {x:b.left,y:b.top,width:1,height:1,scale:1};})()`);
        frames.add((await call('Page.captureScreenshot',{format:'png',clip:box})).data);await delay(75);
      }
      assert.ok(frames.size>1,'GIF must animate in the browser');
      await language('RU'); assert.equal(await evaluate(`document.querySelectorAll('#media-text img').length`),2);
      await click('.input-box-full .btn-save-section');await waitFor(`!!document.querySelector('.input-box-full [role=status]')`);
      assert.equal(await evaluate(`localStorage.getItem('bigwash.local.v1.media.1')`),null);
      await evaluate(`(()=>{const e=document.querySelector('#media-text');e.textContent='cancel me';e.dispatchEvent(new InputEvent('input',{bubbles:true}));})()`);await click('.input-box-full .btn-cancel-section');
      await waitFor(`document.querySelectorAll('#media-text img').length===2`);
      await navigate('/pult','.action-btn.edit');await openPult();await evaluate(`document.querySelectorAll('.tab-btn')[0].click()`);
      await waitFor(`document.querySelectorAll('#media-text img').length===2 && [...document.querySelectorAll('#media-text img')].every(i=>i.complete&&i.naturalWidth===1)`);
      const saved=await evaluate(`(async()=>{const db=await new Promise(r=>{const q=indexedDB.open('bigwash-media-v1');q.onsuccess=()=>r(q.result)});return await new Promise(r=>{const q=db.transaction('documents').objectStore('documents').get('1');q.onsuccess=async()=>{const v=q.result;const gif=v.images.find(i=>i.type==='image/gif');r({count:v.images.length,text:v.text,gif:await gif.blob.text(),gifBytes:Array.from(new Uint8Array(await gif.blob.arrayBuffer()))});db.close();}});})()`);
      assert.equal(saved.count,2);assert.match(saved.gif,/GIF89a/);assert.equal(Buffer.from(saved.gifBytes).toString('base64'),gif);assert.equal(saved.text.includes('blob:'),false);assert.equal(saved.text.includes('data:'),false);
      await click('#media-text img');await click('.toolbar button[title="Заменить изображение"]');await upload('image/png',png,'replacement.png');await waitFor(`document.querySelector('#media-text img')?.alt==='replacement.png'`);
      await click('.toolbar button[title="Удалить изображение"]');await waitFor(`document.querySelectorAll('#media-text img').length===1`);
      await evaluate(`window.originalMediaPut=IDBObjectStore.prototype.put; IDBObjectStore.prototype.put=function(){throw new DOMException('Full','QuotaExceededError')}`);
      await click('.input-box-full .btn-save-section');await waitFor(`!!document.querySelector('.input-box-full [role=alert]')`);
      await evaluate(`IDBObjectStore.prototype.put=originalMediaPut`);
      await click('.input-box-full .btn-cancel-section');await waitFor(`document.querySelectorAll('#media-text img').length===2`);
      await click('.footer-bar .btn-cancel');
    });

﻿    await t.test('media migrates legacy text only on save and rejects concurrent document updates', async () => {
      const result=await evaluate(`(async()=>{
        const {createMediaStore}=await import('/src/lib/media.js');const {createDevConfig,validMedia}=await import('/src/lib/dev-config.js');
        const key='bigwash.local.v1.media.migration-test';const legacy=JSON.stringify({enabled:true,text:'<b>Legacy</b>'});localStorage.setItem(key,legacy);
        const make=()=>createMediaStore('migration-test',createDevConfig(key,{enabled:true,text:''},validMedia));
        const first=make(),second=make();const a=await first.load(),b=await second.load();
        const unchanged=localStorage.getItem(key)===legacy;a.text='<i>Saved</i>';await first.save(a);
        let conflict='';try{await second.save({...b,text:'Stale'});}catch(error){conflict=error.message;}
        const latest=await make().load();return {unchanged,legacyStillPresent:localStorage.getItem(key)===legacy,conflict,text:latest.text};})()`);
      assert.deepEqual(result,{unchanged:true,legacyStillPresent:true,conflict:'configConflict',text:'<i>Saved</i>'});
      const decoded=await evaluate(`(async()=>{const {readMediaFile}=await import('/src/lib/media.js');const canvas=document.createElement('canvas');canvas.width=canvas.height=2;const types=[];for(const type of ['image/jpeg','image/webp']){const blob=await new Promise(resolve=>canvas.toBlob(resolve,type));const asset=await readMediaFile(new File([blob],'test',{type:blob.type}));types.push(asset.type);}return types;})()`);
      assert.deepEqual(decoded,['image/jpeg','image/webp']);
    });
    await t.test('mobile pages, pult tabs, menus and forms fit UA/RU and both themes (320–1440px)', async () => {
      const routes=['clients','cards','operations','admin','pult','programs','discounts','service','settings','bug-report'];
      const issues=[];
      const inspect=()=>evaluate(`(()=>{const width=innerWidth;const elements=[...document.querySelectorAll('.responsive-layout, .responsive-layout *')];return {root:document.documentElement.scrollWidth,width,outliers:elements.filter(e=>{const b=e.getBoundingClientRect();if(!b.width||getComputedStyle(e).position==='fixed')return false; if(b.left>=-1&&b.right<=width+1)return false;for(let p=e.parentElement;p;p=p.parentElement){const s=getComputedStyle(p);if(['auto','scroll','hidden','clip'].includes(s.overflowX)&&p.clientWidth<p.scrollWidth)return false;}return true;}).slice(0,8).map(e=>e.className)};})()`);
      for(const route of routes){await navigate('/'+route,'.header');for(const width of [320,360,375,390,430,600,768,1024,1280,1440]){
        await call('Emulation.setDeviceMetricsOverride',{width,height:780,deviceScaleFactor:1,mobile:width<=600});
        for(const lang of ['UA','RU']){await language(lang);for(const dark of [false,true]){await evaluate(`document.documentElement.classList.toggle('dark',${dark})`);const r=await inspect();if(r.root>width+1||r.outliers.length)issues.push({route,width,lang,dark,...r});}}
      }}
      assert.deepEqual(issues,[],'Responsive failures: '+JSON.stringify(issues));
      await navigate('/pult','.action-btn.edit');await openPult();
      for(const width of [320,360,375,390,430,600,768,1024,1280]){await call('Emulation.setDeviceMetricsOverride',{width,height:700,deviceScaleFactor:1,mobile:width<=600});for(let tab=0;tab<8;tab++){
        await evaluate(`document.querySelectorAll('.tab-btn')[${tab}].click()`);await delay(30);
        const r=await evaluate(`(()=>{const m=document.querySelector('.modal-container'),body=document.querySelector('.scroll-body'),f=document.querySelector('.footer-bar').getBoundingClientRect();return{width:innerWidth,root:document.documentElement.scrollWidth,body:body.clientWidth,scroll:body.scrollWidth,covered:!!document.elementFromPoint(30,30)?.closest('.mobile-toggle'),footer:f.bottom,modal:m.getBoundingClientRect().width};})()`);
        assert.ok(r.root<=width+1&&r.scroll<=r.body+1&&!r.covered&&r.footer<=701,JSON.stringify({tab,...r}));
      }}
      assert.equal(await evaluate(`!!document.querySelector('.pink-foam-card-fixed')`),false);
      await click('.footer-bar .btn-cancel');
      await call('Emulation.setDeviceMetricsOverride',{width:320,height:640,deviceScaleFactor:1,mobile:false});
      await click('.mobile-toggle');await waitFor(`document.querySelector('.sidebar').classList.contains('open')`);await click('.mobile-toggle');
      await click('.notif-button');const bounds=await evaluate(`(()=>{const b=document.querySelector('.notif-menu').getBoundingClientRect();return {left:b.left,right:b.right};})()`);assert.ok(bounds.left>=0&&bounds.right<=320);await click('.notif-button');
    });
﻿    await t.test('all existing modal forms and login/registration remain usable on small screens', async () => {
      const flows=[
        ['clients','.btn-cyan','.client-modal','.cancel-btn'],
        ['cards','.btn-add','.modal-container','.close-btn'],
        ['cards','.btn-scan','.modal-container','.close-btn'],
        ['cards','.btn-log','.journal-panel','.journal-head button'],
        ['admin','.btn-add-main','.edit-admin-panel','.btn-cancel-light'],
        ['programs','.add-btn-main','.modal-card','.close-x'],
        ['operations','.btn-cyan','.details-card','.close-btn'],
        ['operations','.btn-orange','.details-card','.close-btn'],
        ['operations','.action-buttons .btn-cyan-soft','.details-card','.close-btn'],
        ['pult','.btn-side.orange','.edit-card','.wash-modal-close']
      ];
      for(const [route,trigger,panel,close] of flows){
        await navigate('/'+route,trigger);await click(trigger);if(route==='clients') await click('.tag-header-btn');await waitFor(`!!document.querySelector(${JSON.stringify(panel)})`);await delay(350);
        for(const width of [320,360,375,390,430,600,768,1024,1280]){
          await call('Emulation.setDeviceMetricsOverride',{width,height:640,deviceScaleFactor:1,mobile:width<=600});
          for(const lang of ['UA','RU']){await language(lang);for(const dark of [false,true]){
            await evaluate(`document.documentElement.classList.toggle('dark',${dark})`);
            const result=await evaluate(`(()=>{const p=document.querySelector(${JSON.stringify(panel)});const b=p.getBoundingClientRect();const bad=[...p.querySelectorAll('input,select,textarea,button')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&getComputedStyle(e).visibility!=='hidden'&&(r.left<b.left-1||r.right>b.right+1)}).map(e=>({tag:e.tagName,cls:e.className}));return{left:b.left,right:b.right,top:b.top,bottom:b.bottom,bad,scroll:p.scrollHeight,client:p.clientHeight};})()`);
            assert.ok(result.left>=0&&result.right<=width+1&&result.top>=0&&result.bottom<=641&&!result.bad.length,JSON.stringify({route,panel,width,lang,dark,...result}));
          }}
        }
        await click(panel+' '+close);
      }
      await navigate('/bug-report','.telegram-card');assert.equal(await evaluate(`document.querySelector('.telegram-card button')?.disabled`),true);
      assert.equal(await evaluate(`document.querySelectorAll('select').length`),2);
      // Visit login without logging out; existing session/data must survive presentation changes.
      await navigate('/login','.mobile-form-tabs');
      for(const width of [320,360,375,390,430,600]){
        await call('Emulation.setDeviceMetricsOverride',{width,height:580,deviceScaleFactor:1,mobile:true});
        for(const lang of ['UA','RU']){
          await evaluate(`import('/src/lib/localisation/language.svelte.js').then(m=>m.language.set('${lang}'))`);
          for(const signup of [true,false]){
            await evaluate(`document.querySelectorAll('.mobile-form-tabs button')[${signup?1:0}].click()`);
            const layout=await evaluate(`(()=>{const form=document.querySelector('${signup?'.sign-up-container':'.sign-in-container'} form');return {root:document.documentElement.scrollWidth,width:innerWidth,display:getComputedStyle(form.parentElement).display,fields:[...form.querySelectorAll('input,button')].filter(e=>{const b=e.getBoundingClientRect();return b.left<0||b.right>innerWidth+1}).map(e=>e.className)};})()`);
            assert.ok(layout.root<=width+1&&layout.display!=='none'&&!layout.fields.length,JSON.stringify({width,lang,signup,...layout}));
          }
        }
      }
    });
    await t.test('DEV Clients, Cards and Admin retain CRUD, roles, cancellation and F5 without changing the auth account', async () => {
      await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
      const rowAction = async (text, action) => { await waitFor(`Array.from(document.querySelectorAll('tbody tr')).some(row => row.textContent.includes(${JSON.stringify(text)}))`); await evaluate(`Array.from(document.querySelectorAll('tbody tr')).find(row => row.textContent.includes(${JSON.stringify(text)})).querySelector('.icon-btn.' + ${JSON.stringify(action)}).click()`); };
      const saved = name => evaluate(`JSON.parse(localStorage.getItem('bigwash.local.v1.' + ${JSON.stringify(name)}))`);
      await navigate('/clients', '.btn.btn-cyan'); await click('.btn.btn-cyan');
      await input('.client-modal .input-row:nth-child(1) input', 'HANDOFF CLIENT'); await click('.client-modal .save-btn'); await waitFor(`!document.querySelector('.client-modal')`);
      assert.ok((await saved('clients')).some(client => client.name === 'HANDOFF CLIENT'));
      await rowAction('HANDOFF CLIENT', 'edit'); await input('.client-modal .input-row:nth-child(1) input', 'CANCELLED CLIENT'); await click('.client-modal .cancel-btn');
      assert.ok((await saved('clients')).some(client => client.name === 'HANDOFF CLIENT'));
      await rowAction('HANDOFF CLIENT', 'edit'); await input('.client-modal .input-row:nth-child(1) input', 'HANDOFF CLIENT EDITED'); await click('.client-modal .save-btn'); await waitFor(`!document.querySelector('.client-modal')`);
      await navigate('/clients', 'tbody'); assert.ok(await evaluate(`document.querySelector('tbody').textContent.includes('HANDOFF CLIENT EDITED')`));
      acceptDialog = false; await rowAction('HANDOFF CLIENT EDITED', 'delete'); await delay(100); assert.ok((await saved('clients')).some(client => client.name === 'HANDOFF CLIENT EDITED'));
      acceptDialog = true; await rowAction('HANDOFF CLIENT EDITED', 'delete'); await waitFor(`!document.querySelector('tbody').textContent.includes('HANDOFF CLIENT EDITED')`);

      await navigate('/cards', '.btn-add'); await click('.btn-add'); await input('.modal-container .input-with-action input', 'HANDOFF-CARD'); await input('#card-discount', '12'); await click('.modal-container .btn-save'); await waitFor(`!document.querySelector('.modal-container')`);
      await navigate('/cards', 'tbody'); await rowAction('HANDOFF-CARD', 'edit'); assert.equal(await evaluate(`document.querySelector('#card-discount').value`), '12');
      await input('#card-discount', '14'); await click('.modal-container .btn-save'); await waitFor(`!document.querySelector('.modal-container')`); await navigate('/cards', 'tbody');
      assert.equal((await saved('cards')).find(card => card.uid === 'HANDOFF-CARD').discount, 14);
      await rowAction('HANDOFF-CARD', 'edit'); await input('#card-discount', '99'); await click('.modal-container .btn-cancel'); assert.equal((await saved('cards')).find(card => card.uid === 'HANDOFF-CARD').discount, 14);
      await rowAction('HANDOFF-CARD', 'delete'); await waitFor(`!document.querySelector('tbody').textContent.includes('HANDOFF-CARD')`);

      await navigate('/admin', '.btn-add-main'); await click('.btn-add-main');
      const password = crypto.randomUUID();
      for (const [selector, value] of [['#name-input', 'Handoff'], ['#surname-input', 'Admin'], ['#phone-input', '123456789'], ['#email-input', 'handoff@example.local'], ['#role-select', 'Сервіс'], ['#password-input', password], ['#confirm-password-input', password]]) await input(selector, value);
      await click('.btn-submit'); await waitFor(`!document.querySelector('.edit-admin-panel')`); await navigate('/admin', 'tbody'); await rowAction('handoff@example.local', 'edit'); assert.equal(await evaluate(`document.querySelector('#role-select').value`), 'Сервіс'); assert.equal(await evaluate(`document.querySelector('#password-input').value`), '');
      await input('#role-select', 'Власник'); await input('#card-input', 'HANDOFF-ADMIN-CARD'); acceptDialog = false; await click('.btn-submit'); await delay(100); assert.ok(await evaluate(`!!document.querySelector('.edit-admin-panel')`)); assert.equal((await saved('admins')).find(admin => admin.email === 'handoff@example.local').special_card_uid ?? null, null);
      acceptDialog = true; await click('.btn-submit'); await waitFor(`!document.querySelector('.edit-admin-panel')`); await navigate('/admin', 'tbody'); await rowAction('handoff@example.local', 'edit'); assert.equal(await evaluate(`document.querySelector('#role-select').value`), 'Власник'); assert.equal(await evaluate(`document.querySelector('#card-input').value`), 'HANDOFF-ADMIN-CARD');
      await input('#name-input', 'Cancelled'); await click('.btn-cancel-light'); assert.equal((await saved('admins')).find(admin => admin.email === 'handoff@example.local').firstname, 'Handoff');
      await rowAction('handoff@example.local', 'delete'); await waitFor(`!document.querySelector('tbody').textContent.includes('handoff@example.local')`);
      assert.ok(!JSON.stringify(await saved('admins')).includes(password));
    });
    assert.equal(await evaluate(`localStorage.getItem('token')`), session);
    assert.deepEqual(exceptions, []);
  } finally {
    socket?.close();
    browser.kill();
  }
});
