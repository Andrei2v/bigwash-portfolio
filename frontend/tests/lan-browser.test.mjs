import { waitForDevToolsPort } from './browser-helpers.mjs';
﻿import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { createHash, randomUUID, X509Certificate } from 'node:crypto';
import { spawn } from 'node:child_process';

const httpURL=process.env.BIGWASH_LAN_HTTP_URL;
const httpsURL=process.env.BIGWASH_LAN_HTTPS_URL;
const certificateDir=process.env.BIGWASH_LAN_CERT_DIR;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test('LAN auth in mobile Chrome (isolated profile, test certificate pinned only)',{skip:!httpURL||!httpsURL||!certificateDir,timeout:300000},async t=>{
 const insecure=new URL(httpURL).origin,secure=new URL(httpsURL).origin;
 assert.equal(new URL(insecure).protocol,'http:');assert.equal(new URL(secure).protocol,'https:');
 assert.equal(new URL(insecure).hostname,new URL(secure).hostname);
 const ca=new X509Certificate(fs.readFileSync(path.join(certificateDir,'rootCA.cer')));
 const leaf=new X509Certificate(fs.readFileSync(path.join(certificateDir,'server.cer')));
 const pin=createHash('sha256').update(leaf.publicKey.export({type:'spki',format:'der'})).digest('base64');
 const request=pathname=>new Promise((resolve,reject)=>{
  const req=https.get(new URL(pathname,secure),{ca:ca.toString(),agent:false},res=>{const authorized=res.socket.authorized;let size=0;res.on('data',chunk=>{size+=chunk.length});res.on('end',()=>resolve({status:res.statusCode,authorized,size}));});req.on('error',reject);req.setTimeout(15000,()=>req.destroy(Error('TLS request timeout')));
 });
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'bigwash-lan-browser-'));
 const browser=spawn(process.env.BIGWASH_CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--disable-gpu','--no-proxy-server','--remote-debugging-port=0',`--user-data-dir=${profile}`,`--ignore-certificate-errors-spki-list=${pin}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let socket,id=0;const pending=new Map(),exceptions=[],logs=[],posts=[];
 const password=randomUUID(),email='phone-'+randomUUID()+'@example.local';let session;
 try{
  const port = await waitForDevToolsPort(path.join(profile, 'DevToolsActivePort'));
  const targets=await(await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket=new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
  socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}
   if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
   if(m.method==='Runtime.consoleAPICalled')logs.push(m.params.args.map(arg=>arg.value??arg.description??'').join(' '));
   if(m.method==='Network.requestWillBeSent'&&m.params.request.method==='POST')posts.push(m.params.request.url);
  };
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const wait=async expression=>{for(let i=0;i<250;i++){if(await evaluate(expression))return;await delay(50)}assert.fail('Timed out waiting for UI state: '+expression)};
  const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const input=(selector,value)=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  const navigate=async url=>{await call('Page.navigate',{url});await wait(`!!document.querySelector('.sign-in-container form')`)};
  const register=async()=>{await click('.mobile-form-tabs button:last-child');for(const [selector,value]of [['[autocomplete=given-name]','Phone'],['[autocomplete=family-name]','User'],['input[type=tel]','123456789'],['input[type=email]',email],['input[autocomplete=new-password]',password]])await input('.sign-up-container '+selector,value);await click('.sign-up-container button[type=submit]');};
  const login=async value=>{await input('.sign-in-container input[type=email]',email);await input('.sign-in-container input[autocomplete=current-password]',value);await click('.sign-in-container button[type=submit]');};
  await call('Runtime.enable');await call('Page.enable');await call('Network.enable');
  const version=await call('Browser.getVersion');
  await call('Network.setUserAgentOverride',{userAgent:`Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) ${version.product.replace('HeadlessChrome','Chrome')} Mobile Safari/537.36`});
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await call('Emulation.setTouchEmulationEnabled',{enabled:true});

  await t.test('LAN HTTP keeps local mode and shows an HTTPS diagnostic without backend traffic or data changes',async()=>{
   await navigate(insecure+'/login');
   const state=await evaluate(`(async()=>({secure:isSecureContext,subtle:!!crypto.subtle,local:(await import('/src/lib/api/client.js')).LOCAL_MODE,width:innerWidth}))()`);
   assert.deepEqual(state,{secure:false,subtle:false,local:true,width:390});
   await evaluate(`localStorage.setItem('bigwash.lan.test.sentinel','KEEP')`);
   await register();await wait(`!!document.querySelector('.sign-up-container [role=alert]')`);
   const message=await evaluate(`document.querySelector('.sign-up-container [role=alert]').textContent`);
   assert.match(message,/HTTPS/);assert.equal(message.includes('backend'),false);
   await evaluate(`import('/src/lib/localisation/language.svelte.js').then(m=>m.language.set('RU'))`);
   await wait(`document.documentElement.lang==='ru'`);assert.match(await evaluate(`document.querySelector('[role=alert]').textContent`),/телефона/);
   assert.equal(await evaluate(`localStorage.getItem('bigwash.lan.test.sentinel')`),'KEEP');
   assert.equal(await evaluate(`localStorage.getItem('token')`),null);
  });

  await t.test('trusted HTTPS validates its IP certificate and does not expose private certificate files',async()=>{
   const page=await request('/login');assert.equal(page.status,200);assert.equal(page.authorized,true);
   for(const url of ['/.local/https/server.pfx','/.local/https/server.pfx?raw','/.local/https/server.pfx?raw&import','/.local/https/rootCA.cer']){
    const response=await request(url);assert.ok([403,404].includes(response.status),'Certificate files must not be served');
    const status=await new Promise((resolve,reject)=>{const req=http.get(new URL(url,insecure),{agent:false},res=>{res.resume();res.on('end',()=>resolve(res.statusCode))});req.on('error',reject);req.setTimeout(15000,()=>req.destroy(Error('HTTP request timeout')))});
    assert.ok([403,404].includes(status),'Regular HTTP Vite must also deny certificate files');
   }
   await navigate(secure+'/login');
   assert.deepEqual(await evaluate(`(async()=>({secure:isSecureContext,subtle:!!crypto.subtle,local:(await import('/src/lib/api/client.js')).LOCAL_MODE,width:innerWidth}))()`),{secure:true,subtle:true,local:true,width:390});
   await evaluate(`(async()=>{const api=await import('/src/lib/api/client.js');await api.authAPI.register({firstname:'Existing',lastname:'Account',phone:'123',email:'existing@example.local',password:crypto.randomUUID()});localStorage.setItem('bigwash.lan.test.sentinel','HTTPS-KEEP');})()`);
  });

  await t.test('mobile registration/login, wrong password, F5, logout and re-login work without Go',async()=>{
   await register();await wait(`!!document.querySelector('.sign-in-container .success-message')`);
   assert.equal(await evaluate(`localStorage.getItem('token')`),null,'Registration must not create a session');
   await login('wrong password');await wait(`!!document.querySelector('.sign-in-container [role=alert]')`);
   assert.match(await evaluate(`document.querySelector('.sign-in-container [role=alert]').textContent`),/email/);
   await login(password);await wait(`location.pathname==='/dashboard'&&!!document.querySelector('.dashboard-wrapper')`);
   session=await evaluate(`localStorage.getItem('token')`);assert.match(session,/^local-preview-/);
   const before=(await call('Page.getFrameTree')).frameTree.frame.loaderId;
   await call('Page.reload');for(let i=0;i<100;i++){if((await call('Page.getFrameTree')).frameTree.frame.loaderId!==before)break;await delay(50)}
   await wait(`!!document.querySelector('.dashboard-wrapper')`);
   assert.equal(await evaluate(`localStorage.getItem('token')`),session);
   assert.equal(await evaluate(`localStorage.getItem('bigwash.lan.test.sentinel')`),'HTTPS-KEEP');
   await click('.mobile-toggle');await click('.logout-btn');
   await wait(`location.pathname==='/login'&&!!document.querySelector('.sign-in-container form')`);
   assert.equal(await evaluate(`localStorage.getItem('token')`),null);
   await login(password);await wait(`location.pathname==='/dashboard'&&!!document.querySelector('.dashboard-wrapper')`);
   const accounts=await evaluate(`new Promise((resolve,reject)=>{const q=indexedDB.open('bigwash-local-preview',1);q.onerror=()=>reject(Error('Read failed'));q.onsuccess=()=>{const db=q.result;const r=db.transaction('settings').objectStore('settings').get('accounts');r.onsuccess=()=>{resolve(r.result.map(a=>({email:a.user.email,hashed:typeof a.hash==='string'&&!('password' in a)})));db.close();};};})`);
   assert.equal(accounts.length,2);assert.ok(accounts.every(a=>a.hashed));assert.ok(accounts.some(a=>a.email==='existing@example.local'));
  });

  assert.deepEqual(posts.filter(url=>/\/auth\/(login|register)/.test(url)),[],'DEV credentials must never reach a network auth endpoint');
  assert.deepEqual(exceptions,[]);
  assert.ok(!logs.some(line=>[password,email,session].filter(Boolean).some(secret=>line.includes(secret))),'Diagnostics must not print credentials or tokens');
 }finally{socket?.close();browser.kill();}
});
