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

test('Hybrid mobile layouts', { skip: !baseURL, timeout: 600000 }, async t => {
  const base = new URL(baseURL).origin;
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname), 'Use a loopback DEV server');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bigwash-hybrid-'));
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


﻿    await evaluate(`(async()=>{const api=(await import('/src/lib/api/client.js')).default;await api.post('/cards',{uid:'HYBRID-001',amount:120,discount:10});await api.post('/cards',{uid:'HYBRID-002',amount:250,discount:5});})()`);
    const size=async(width,height=840)=>{await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=430});await call('Emulation.setTouchEmulationEnabled',{enabled:width<=430});};
    const flush=()=>evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
    const rootFits=async context=>{const r=await evaluate(`({width:innerWidth,root:document.documentElement.scrollWidth})`);assert.ok(r.root<=r.width+1,JSON.stringify({context,...r}));};

    await t.test('compact Header keeps navigation, language, notifications and profile inside 320–1024px',async()=>{
      await navigate('/cards','.header');
      for(const width of [320,360,390,430,768,1024]){await size(width);for(const lang of ['UA','RU']){await language(lang);for(const dark of [false,true]){
        await evaluate(`document.documentElement.classList.toggle('dark',${dark})`);await flush();await rootFits({width,lang,dark});
        const r=await evaluate(`(()=>{const h=document.querySelector('.header').getBoundingClientRect();const bad=[...document.querySelectorAll('.header .user-actions > *, .header .nav-island')].filter(e=>{const b=e.getBoundingClientRect();return b.left<0||b.right>innerWidth+1}).map(e=>e.className);return {height:h.height,bad,profile:getComputedStyle(document.querySelector('.user-profile')).display};})()`);
        assert.deepEqual(r.bad,[]);assert.notEqual(r.profile,'none');if(width<=430)assert.ok(r.height<=125,JSON.stringify({width,lang,...r}));
      }}}
      await size(320);await click('.notif-button');await waitFor(`!!document.querySelector('.notif-menu')`);
      assert.ok(await evaluate(`(()=>{const r=document.querySelector('.notif-menu').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight})()`));
      await click('.notif-menu-heading button');assert.equal(await evaluate(`document.querySelector('.notif-compact-count').textContent`),'0');await click('.notif-button');
      await click('.mobile-toggle');await waitFor(`document.querySelector('.sidebar').classList.contains('open')`);await click('.mobile-toggle');
    });

    await t.test('tables preserve columns and provide local scrolling with visible, translated controls',async()=>{
      for(const route of ['cards','clients','operations','admin','programs','pult','discounts']){
        await navigate('/'+route,'.header');if(route==='discounts')await click('.acc-header');
        for(const width of [320,360,390,430,768,1024]){await size(width);for(const lang of ['UA','RU']){await language(lang);await flush();await rootFits({route,width,lang});
          for(const dark of [false,true]){
            await evaluate(`document.documentElement.classList.toggle('dark',${dark})`);
            const result=await evaluate(`(()=>{const n=document.querySelector('.horizontal-scroll');if(!n)return null;const table=n.querySelector('table');return {width:n.clientWidth,scroll:n.scrollWidth,columns:table?.tHead?.rows[0]?.cells.length,cue:!n.nextElementSibling.hidden,buttons:n.nextElementSibling.querySelectorAll('button').length,label:n.getAttribute('aria-label')};})()`);
            assert.ok(result,'Missing table viewport: '+route);assert.ok(result.columns>=4);assert.equal(result.buttons,2);
            if(result.scroll>result.width+1){assert.equal(result.cue,true);assert.ok(result.label.length>8);}
          }
        }}
        await size(320);await flush();const before=await evaluate(`document.querySelector('.horizontal-scroll').scrollLeft`);await click('.horizontal-scroll + .scroll-cue button:last-child');
        await waitFor(`document.querySelector('.horizontal-scroll').scrollLeft>${before}`);await rootFits(route);
        await evaluate(`(()=>{const n=document.querySelector('.horizontal-scroll');n.scrollLeft=n.scrollWidth})()`);await flush();
        assert.ok(await evaluate(`(()=>{const n=document.querySelector('.horizontal-scroll'),cell=n.querySelector('thead tr:first-child th:last-child'),a=n.getBoundingClientRect(),b=cell.getBoundingClientRect();return b.right<=a.right+2&&b.left>=a.left-2})()`),'Last column must be reachable: '+route);
      }
      await navigate('/programs','.horizontal-scroll');await size(1920);await flush();assert.equal(await evaluate(`document.querySelector('.scroll-cue').hidden`),true);
      await navigate('/bug-report','.report-page');assert.equal(await evaluate(`document.querySelectorAll('.scroll-cue').length`),0,'Actions must remove their indicators on unmount');
    });

    await t.test('Cards retain all actions with a compact phone toolbar and a desktop-like tablet sidebar',async()=>{
      await navigate('/cards','.cards-layout');
      for(const width of [320,360,390,430,432,600,768,1024]){await size(width);await flush();const r=await evaluate(`(()=>{const a=document.querySelector('.side-panel').getBoundingClientRect(),b=document.querySelector('.content').getBoundingClientRect();return{actions:a.top,table:b.top,side:a.left,main:b.left,count:document.querySelectorAll('.side-panel > button').length,stats:document.querySelectorAll('.stats-group .stat-item').length}})()`);assert.equal(r.count,3);assert.equal(r.stats,4);if(width>=768)assert.ok(r.side>r.main);else assert.ok(r.actions<r.table);if(width<=600)assert.equal(await evaluate(`getComputedStyle(document.querySelector('.stats-group')).gridTemplateColumns.split(' ').length`),2,'Phone statistics must use two readable columns, including Android 432px');}
      for (const lang of ['UA', 'RU']) {
        await language(lang);
        await size(320);
        await flush();
        assert.ok(await evaluate(`Array.from(document.querySelectorAll('.side-panel > button')).every(button => { const label = button.querySelector('.action-label').getBoundingClientRect(), icon = button.querySelector('.btn-icon').getBoundingClientRect(); return label.right <= icon.left && button.scrollWidth <= button.clientWidth + 1; })`), 'Cards action labels must not overlap icons at 320px');
      }
      await size(390);await evaluate(`(()=>{const n=document.querySelector('.horizontal-scroll');n.scrollLeft=n.scrollWidth})()`);await flush();
      await click('.icon-btn.edit');await waitFor(`!!document.querySelector('.modal-container')`);assert.ok(await evaluate(`(()=>{const b=document.querySelector('.modal-container').getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.bottom<=innerHeight+1})()`));await click('.modal-container .close-btn');
      for(const [trigger,panel,close]of [['.btn-add','.modal-container','.close-btn'],['.btn-scan','.modal-container','.close-btn'],['.btn-log','.journal-panel','.journal-head button']]){await click(trigger);await waitFor(`!!document.querySelector(${JSON.stringify(panel)})`);await click(panel+' '+close);}
      const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),'bigwash-hybrid-desktop-cards.png'),Buffer.from(shot.data,'base64'));
    });

    await t.test('Pult keeps program columns and local table scrolling; tablets keep the left information panel',async()=>{
      await navigate('/pult','.action-btn.edit');await openPult();
      for(const width of [320,360,390,430,768,1024]){await size(width);for(const lang of ['UA','RU']){await language(lang);for(const dark of [false,true]){await evaluate(`document.documentElement.classList.toggle('dark',${dark})`);for(let tab=0;tab<8;tab++){
        await evaluate(`document.querySelectorAll('.tab-btn')[${tab}].click()`);await flush();await rootFits({width,lang,dark,tab});
        assert.ok(await evaluate(`(()=>{const b=document.querySelector('.scroll-body');return b.scrollWidth<=b.clientWidth+1})()`),'Each wide area must scroll locally');
        if(tab===5){assert.equal(await evaluate(`getComputedStyle(document.querySelector('.program-table-header')).display`),'grid');assert.ok(await evaluate(`document.querySelector('.program-table-scroll').scrollWidth>=560`));}
      }}}const panel=await evaluate(`getComputedStyle(document.querySelector('.info-details')).display`);assert.equal(panel,width>=768?'flex':'none');}
      await size(390);await evaluate(`document.querySelectorAll('.tab-btn')[5].click()`);const saved=await evaluate(`localStorage.getItem('bigwash.local.v1.pultPrograms.1')`);
      await click('.btn-define-rectangular');await waitFor(`!!document.querySelector('.program-dialog')`);await input('#program-button-number','77');await click('.program-dialog .btn-cancel-section');assert.equal(await evaluate(`localStorage.getItem('bigwash.local.v1.pultPrograms.1')`),saved);
      await click('.footer-bar .btn-cancel');
    });

    await t.test('short viewport forms keep fields and Save/Cancel reachable without page scaling',async()=>{
      assert.match(await evaluate(`document.querySelector('meta[name=viewport]').content`), /interactive-widget=resizes-content/, 'Android must resize the layout viewport when the keyboard opens');
      for(const [route,trigger,panel,close]of [['cards','.btn-add','.modal-container','.close-btn'],['clients','.btn-cyan','.client-modal','.cancel-btn'],['admin','.btn-add-main','.edit-admin-panel','.btn-cancel-light'],['programs','.add-btn-main','.modal-card','.close-x']]){
        await navigate('/'+route,trigger);await size(360,360);await click(trigger);await waitFor(`!!document.querySelector(${JSON.stringify(panel)})`);await delay(350);
        const result=await evaluate(`(()=>{const p=document.querySelector(${JSON.stringify(panel)}),b=p.getBoundingClientRect();p.scrollTop=p.scrollHeight;return{top:b.top,bottom:b.bottom,left:b.left,right:b.right,scale:visualViewport.scale}})()`);
        assert.ok(result.top>=0&&result.bottom<=361&&result.left>=0&&result.right<=361,JSON.stringify({route,...result}));assert.equal(result.scale,1);await click(panel+' '+close);
      }
    });

    assert.equal(await evaluate(`localStorage.getItem('token')`), session);
    assert.deepEqual(exceptions, []);
  } finally {
    socket?.close();
    browser.kill();
  }
});
