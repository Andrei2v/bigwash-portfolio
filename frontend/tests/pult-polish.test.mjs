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

test('Pult Data and Sidebar polish', { skip: !baseURL, timeout: 600000 }, async t => {
  const base = new URL(baseURL).origin;
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname), 'Use a loopback DEV server');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bigwash-pult-polish-'));
  const chrome = process.env.BIGWASH_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  assert.ok(fs.existsSync(chrome), 'Set BIGWASH_CHROME_PATH to your installed Chrome executable');
  const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  const pending = new Map();
  const exceptions = [];
  let socket;
  let requestId = 0;
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
      if (message.method === 'Page.javascriptDialogOpening') void call('Page.handleJavaScriptDialog', { accept: true });
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
    await call('Page.bringToFront');
    await call('Emulation.setFocusEmulationEnabled', { enabled: true });
    await navigate('/login', '.sign-in-container form');
    await evaluate(`(async () => {
      const api = await import('/src/lib/api/client.js');
      if (!api.LOCAL_MODE) throw new Error('Browser regression requires explicit local DEV mode');
      const email = 'polish-' + crypto.randomUUID() + '@example.local';
      const password = crypto.randomUUID();
      await api.authAPI.register({ firstname: 'Pult', lastname: 'Polish', phone: '123456789', email, password });
      const response = await api.authAPI.login(email, password);
      const { auth } = await import('/src/lib/stores/auth.svelte.js');
      auth.login(response.data.user, response.data.token);
    })()`);
    const session = await evaluate(`localStorage.getItem('token')`);


    await t.test('Data draft saves only public model fields and accurately tracks edit, revert, cancel, errors and F5', async () => {
      await navigate('/pult', '.action-btn.edit'); await openPult(); await evaluate(`document.querySelectorAll('.tab-btn')[1].click()`);
      const name = await evaluate(`document.querySelector('#pult-name-input').value`);
      const dirty = () => evaluate(`!!document.querySelector('.data-header .unsaved-warning')`);
      assert.equal(await dirty(), false);
      assert.equal(await evaluate(`document.querySelectorAll('.usb-preset-button, .usb-ports-text-fields-grid').length`), 0);
      assert.equal(await evaluate(`document.querySelector('#pult-password-input').value`), '');
      assert.equal(await evaluate(`document.querySelector('#pult-password-input').type`), 'password');
      await click('.card-record-help'); assert.equal(await dirty(), false); assert.ok(await evaluate(`document.querySelector('#pult-card-help').textContent.includes('карт')`));
      await click('.card-record-help'); await evaluate(`document.querySelector('#pult-name-input').focus()`); assert.equal(await dirty(), false);
      const unfocusedLoginBorder = await evaluate(`getComputedStyle(document.querySelector('#pult-login-input')).borderColor`);
      await evaluate(`document.querySelector('#pult-login-input').focus()`); await delay(250);
      assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('#pult-login-input')).borderColor`), unfocusedLoginBorder, 'The login field retains its visible focus border');
      assert.equal(await dirty(), false);
      await input('#pult-name-input', 'PULT DATA QA'); assert.equal(await dirty(), true);
      await language('RU'); assert.equal(await evaluate(`document.querySelector('#pult-name-input').value`), 'PULT DATA QA');
      await input('#pult-name-input', name); assert.equal(await dirty(), false);
      for (const toggle of ['#pult-take-money', '#pult-record-mode']) { await click(toggle); assert.equal(await dirty(), true); await click(toggle); assert.equal(await dirty(), false); }
      await input('#pult-timer-input', '5'); assert.equal(await dirty(), true); await input('#pult-timer-input', '0'); assert.equal(await dirty(), false);
      await input('#pult-name-input', 'PULT DATA QA'); await input('#pult-timer-input', '12'); await input('#pult-login-input', 'terminal_qa'); await click('#pult-take-money'); await click('#pult-record-mode');
      await click('.data-actions .btn-save-section'); await waitFor(`!!document.querySelector('.data-card [role=status]')`); assert.equal(await dirty(), false);
      const record = await evaluate(`localStorage.getItem('bigwash.local.v1.pultData.1')`);
      const saved = JSON.parse(record); assert.equal(saved.name, 'PULT DATA QA'); assert.equal(saved.settings.timer, 12); assert.equal(saved.settings.login, 'terminal_qa'); assert.equal(saved.settings.takeOffMoney, false); assert.equal(saved.settings.cardRecordMode, true); assert.equal('password' in saved.settings, false);
      await input('#pult-name-input', 'Cancelled pult'); assert.ok(await evaluate(`!document.querySelector('.pult-layout tbody').textContent.includes('Cancelled pult')`)); await click('.data-actions .btn-cancel-section'); assert.equal(await dirty(), false); assert.equal(await evaluate(`document.querySelector('#pult-name-input').value`), saved.name);
      await evaluate(`window.__polishSetItem=Storage.prototype.setItem; Storage.prototype.setItem=function(key,value){if(key==='bigwash.local.v1.pultData.1')throw Error('Simulated write failure');return window.__polishSetItem.call(this,key,value)}`);
      await input('#pult-name-input', 'PULT DATA RETRY'); await click('.data-actions .btn-save-section'); await waitFor(`!!document.querySelector('.data-card [role=alert]')`); assert.equal(await dirty(), true); assert.equal(await evaluate(`localStorage.getItem('bigwash.local.v1.pultData.1')`), record); assert.equal(await evaluate(`document.querySelector('#pult-name-input').value`), 'PULT DATA RETRY');
      await evaluate(`Storage.prototype.setItem=window.__polishSetItem`); await click('.data-actions .btn-save-section'); await waitFor(`!document.querySelector('.data-header .unsaved-warning')`);
      const updated = await evaluate(`localStorage.getItem('bigwash.local.v1.pultData.1')`);
      const terminalPassword = 'terminal-fixture-' + crypto.randomUUID(); await input('#pult-password-input', terminalPassword); assert.equal(await dirty(), true); await click('.data-actions .btn-save-section'); await waitFor(`!!document.querySelector('.data-card [role=alert]')`); assert.equal(await dirty(), true); assert.equal(await evaluate(`localStorage.getItem('bigwash.local.v1.pultData.1')`), updated);
      assert.ok(!await evaluate(`Object.values(localStorage).some(value=>value.includes(${JSON.stringify(terminalPassword)}))`), 'A terminal password must never enter localStorage');
      await click('.data-actions .btn-cancel-section'); assert.equal(await dirty(), false); assert.equal(await evaluate(`document.querySelector('#pult-password-input').value`), '');
      await click('.footer-bar .btn-cancel'); await navigate('/pult', '.action-btn.edit'); await openPult(); await evaluate(`document.querySelectorAll('.tab-btn')[1].click()`);
      assert.equal(await evaluate(`document.querySelector('#pult-name-input').value`), 'PULT DATA RETRY'); assert.equal(await evaluate(`document.querySelector('#pult-login-input').value`), 'terminal_qa'); assert.equal(await evaluate(`document.querySelector('#pult-timer-input').value`), '12'); assert.equal(await dirty(), false); assert.equal(await evaluate(`document.querySelector('#pult-password-input').value`), '');
      await input('#pult-login-input', 'terminal_footer'); await click('.footer-bar .btn-save'); await waitFor(`!document.querySelector('.modal-container')`);
      await openPult(); await evaluate(`document.querySelectorAll('.tab-btn')[1].click()`);
      assert.equal(await evaluate(`document.querySelector('#pult-login-input').value`), 'terminal_footer'); assert.equal(await dirty(), false);
      await input('#pult-name-input', 'Cancelled from footer'); await click('.footer-bar .btn-cancel'); await openPult();
      assert.equal(await evaluate(`document.querySelector('#pult-name-input').value`), 'PULT DATA RETRY'); assert.equal(await dirty(), false); await click('.footer-bar .btn-cancel');
    });

    await t.test('USB remains separate, keeps its saved state, and is not reset by a successful Data save', async () => {
      await navigate('/pult', '.action-btn.edit'); await openPult(); await evaluate(`document.querySelectorAll('.tab-btn')[7].click()`);
      const saved = await evaluate(`localStorage.getItem('bigwash.local.v1.usb.1')`), original = await evaluate(`document.querySelector('#usb-paypass').value`);
      await input('#usb-paypass', 'ttyACM1'); assert.ok(await evaluate(`!!document.querySelector('.usb-config-header-row-custom .unsaved-warning')`));
      await evaluate(`document.querySelectorAll('.tab-btn')[1].click()`); await input('#pult-login-input', 'terminal_qa_2'); await click('.data-actions .btn-save-section'); await waitFor(`!!document.querySelector('.data-card [role=status]')`);
      await evaluate(`document.querySelectorAll('.tab-btn')[7].click()`); assert.equal(await evaluate(`document.querySelector('#usb-paypass').value`), 'ttyACM1'); assert.ok(await evaluate(`!!document.querySelector('.usb-config-header-row-custom .unsaved-warning')`)); assert.equal(await evaluate(`localStorage.getItem('bigwash.local.v1.usb.1')`), saved);
      await click('.usb-cancel-btn-link-new'); assert.equal(await evaluate(`document.querySelector('#usb-paypass').value`), original); assert.equal(await evaluate(`!!document.querySelector('.unsaved-warning')`), false);
      await click('#usb-paypass-ttyACM1'); await click('.usb-save-btn-confirm-new'); await waitFor(`!document.querySelector('.usb-config-header-row-custom .unsaved-warning')`);
      await evaluate(`document.querySelectorAll('.tab-btn')[4].click()`); assert.equal(await evaluate(`!!document.querySelector('.prro-header .unsaved-warning')`), false);
      const prroLogin = await evaluate(`document.querySelector('#prro-login-field').value`); await input('#prro-login-field', 'Changed terminal draft'); assert.equal(await evaluate(`!!document.querySelector('.prro-header .unsaved-warning')`), true); await input('#prro-login-field', prroLogin); assert.equal(await evaluate(`!!document.querySelector('.prro-header .unsaved-warning')`), false);
      await click('.footer-bar .btn-cancel'); await navigate('/pult', '.action-btn.edit'); await openPult(); await evaluate(`document.querySelectorAll('.tab-btn')[7].click()`); assert.equal(await evaluate(`document.querySelector('#usb-paypass').value`), 'ttyACM1'); assert.equal(await evaluate(`!!document.querySelector('.unsaved-warning')`), false); await click('.footer-bar .btn-cancel');
    });

    await t.test('Pult layout uses necessary scroll areas only and keeps actions reachable in both orientations', async () => {
      await navigate('/pult', '.action-btn.edit'); await openPult();
      for (const [width,height] of [[1440,900],[1024,768],[768,800],[430,844],[390,844],[375,812],[320,640],[640,320],[844,390]]) {
        await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});
        for (const lang of ['UA','RU']) { await language(lang); for (const dark of [false,true]) {
          await evaluate(`document.documentElement.classList.toggle('dark',${dark})`);
          for(const tab of [0,1,2,3,4,5,6,7]) {
            const pageY=await evaluate(`scrollY`); await evaluate(`document.querySelectorAll('.tab-btn')[${tab}].click()`); await delay(25);
            const r=await evaluate(`(()=>{const b=document.querySelector('.scroll-body'),nav=document.querySelector('.tabs-header').getBoundingClientRect(),foot=document.querySelector('.footer-bar').getBoundingClientRect();return{root:document.documentElement.scrollWidth,width:innerWidth,bodyX:b.scrollWidth,bodyWidth:b.clientWidth,gap:b.getBoundingClientRect().top-nav.bottom,footer:foot.bottom,window:innerHeight,pageY:scrollY,client:b.clientHeight,scroll:b.scrollHeight,extra:[...b.querySelectorAll('*')].filter(n=>n.scrollHeight>n.clientHeight+2&&getComputedStyle(n).overflowY==='auto'&&n.clientHeight>0).map(n=>n.className)}})()`);
            assert.ok(r.root<=width+1&&r.bodyX<=r.bodyWidth+1,JSON.stringify({width,height,lang,dark,tab,...r})); assert.ok(r.footer<=height+1); assert.ok(r.gap<=1&&r.gap>=-1); assert.equal(r.pageY,pageY); assert.deepEqual(r.extra,[],'Only the main form body should scroll vertically');
            if(width===1440&&tab===1)assert.ok(r.scroll<=r.client+1,'The short Data form should not force a scrollbar');
          }
          await evaluate(`document.querySelectorAll('.tab-btn')[1].click()`); await click('.card-record-help'); const hint=await evaluate(`document.querySelector('#pult-card-help').textContent`); assert.ok(hint.startsWith(lang==='RU'?'Если':'Якщо')); await click('.card-record-help');
        }}
      }
      await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false}); await evaluate(`document.querySelectorAll('.tab-btn')[1].click()`); await delay(100); let shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),'bigwash-polish-desktop.png'),Buffer.from(shot.data,'base64'));
      await call('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:true}); await evaluate(`document.querySelectorAll('.tab-btn')[7].click()`); for(let index=0;index<20;index++)await click('.btn-usb-add-device-new');
      const large=await evaluate(`(()=>{const b=document.querySelector('.scroll-body');b.scrollTop=b.scrollHeight;return{client:b.clientHeight,scroll:b.scrollHeight}})()`);assert.ok(large.scroll>large.client+300);
      const controls=await evaluate(`(()=>{const body=document.querySelector('.scroll-body').getBoundingClientRect(),button=document.querySelector('.usb-save-btn-confirm-new').getBoundingClientRect();return{top:button.top,bottom:button.bottom,viewportTop:body.top,viewportBottom:body.bottom}})()`);assert.ok(controls.top>=controls.viewportTop&&controls.bottom<=controls.viewportBottom+1,JSON.stringify(controls)); await click('.usb-cancel-btn-link-new');
      await evaluate(`document.querySelectorAll('.tab-btn')[1].click();document.querySelector('.scroll-body').scrollTop=0`);shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),'bigwash-polish-mobile.png'),Buffer.from(shot.data,'base64'));await click('.footer-bar .btn-cancel');
    });

    await t.test('Sidebar keeps navigation and readable dark/light palettes on desktop and mobile', async () => {
      const rgb=value=>value.match(/[\d.]+/g).slice(0,3).map(Number);
      const luminance=color=>rgb(color).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
      await call('DOM.enable'); await call('CSS.enable');
      for(const width of [1440,1024,768,430,390,375,320]) {await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<768});for(const dark of [false,true]) {
        await evaluate(`document.documentElement.classList.toggle('dark',${dark})`); await delay(350);
        const r=await evaluate(`(()=>{const sidebar=document.querySelector('.sidebar'),active=sidebar.querySelector('.menu-item.active'),normal=sidebar.querySelector('.menu-item:not(.active)');return{background:getComputedStyle(sidebar).backgroundImage,normal:getComputedStyle(normal).color,activeColor:getComputedStyle(active).color,activeBg:getComputedStyle(active).backgroundColor,width:sidebar.getBoundingClientRect().width}})()`);
        assert.equal(r.width,260);assert.ok(r.background.includes(dark?'30, 41, 59':'254, 243, 199'));assert.ok(r.background.includes(dark?'15, 23, 42':'255, 255, 255'));assert.ok(contrast(r.normal,dark?'rgb(30,41,59)':'rgb(254,243,199)')>=4.5,JSON.stringify({width,dark,...r}));assert.ok(contrast(r.activeColor,r.activeBg)>=4.5);
        if (width === 1440) {
          const { root } = await call('DOM.getDocument');
          const { nodeId } = await call('DOM.querySelector', { nodeId: root.nodeId, selector: '.sidebar .menu-item:not(.active)' });
          await call('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
          await delay(350);
          const hover = await evaluate(`(() => { const style = getComputedStyle(document.querySelector('.sidebar .menu-item:not(.active)')); return { color: style.color, background: style.backgroundColor }; })()`);
          const channels = hover.background.match(/[\d.]+/g).map(Number), alpha = channels[3] ?? 1;
          const surface = rgb(dark ? 'rgb(30,41,59)' : 'rgb(254,243,199)');
          const background = 'rgb(' + channels.slice(0, 3).map((value, index) => value * alpha + surface[index] * (1 - alpha)).join(',') + ')';
          assert.ok(contrast(hover.color, background) >= 4.5, JSON.stringify({ dark, hover, background }));
          await call('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
          await delay(350);
          const screenshot = await call('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(os.tmpdir(), `bigwash-polish-sidebar-${dark ? 'dark' : 'light'}.png`), Buffer.from(screenshot.data, 'base64'));
        }
      }if(width<=1024){await click('.mobile-toggle');await waitFor(`document.querySelector('.sidebar').classList.contains('open')`);await click('.mobile-toggle');await waitFor(`!document.querySelector('.sidebar').classList.contains('open')`);}}
      await call('Emulation.setDeviceMetricsOverride',{width:640,height:320,deviceScaleFactor:1,mobile:true}); await click('.mobile-toggle'); await delay(350); assert.ok(await evaluate(`(()=>{const side=document.querySelector('.sidebar');side.scrollTop=side.scrollHeight;const button=side.querySelector('.logout-btn').getBoundingClientRect();return button.top>=0&&button.bottom<=innerHeight+1})()`),'Short screens must retain access to Logout'); await click('.mobile-toggle');
      await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await click('.sidebar a[href="/cards"]');await waitFor(`location.pathname==='/cards'`);await navigate('/pult','.action-btn.edit');
    });
    assert.equal(await evaluate(`localStorage.getItem('token')`), session);
    assert.deepEqual(exceptions, []);

  } finally {
    socket?.close();
    browser.kill();
  }
});
