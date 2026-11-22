import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { parse } from 'svelte/compiler';
import { privateIPv4, selectLanAddress, createLanDevServer } from '../scripts/dev-lan.mjs';
const source=fs.readFileSync(new URL('../src/routes/login/Login.svelte',import.meta.url),'utf8');
const declaration=parse(source,{modern:true}).instance.content.body.find(node=>node.type==='FunctionDeclaration'&&node.id.name==='getErrorMessage');
const errorMessage=local=>vm.runInNewContext(source.slice(declaration.start,declaration.end)+';getErrorMessage', {LOCAL_MODE:local,language:{t:key=>key}});

test('local crypto/storage failures are diagnosed separately from a real Go network failure',()=>{
 const local=errorMessage(true),prod=errorMessage(false);
 assert.equal(local({code:'LOCAL_AUTH_HTTPS_REQUIRED'}),'auth.localHttpsRequired');
 assert.equal(local({code:'LOCAL_AUTH_CRYPTO_UNAVAILABLE'}),'auth.localCryptoUnavailable');
 assert.equal(local(new Error('Quota exceeded')),'auth.localOperationFailed');
 assert.equal(local({response:{status:401,data:{error:'invalid credentials'}}}),'Невірний email або пароль.');
 assert.match(prod(new Error('Network failure')),/backend/);
 assert.match(prod({code:'LOCAL_AUTH_HTTPS_REQUIRED'}),/backend/);
});

test('LAN server chooses an assigned private address and refuses public, loopback or ambiguous interfaces',()=>{
 for(const address of ['192.168.0.126','10.0.0.3','172.16.0.3','172.31.1.5'])assert.equal(privateIPv4(address),true);
 for(const address of ['127.0.0.1','0.0.0.0','26.75.44.88','8.8.8.8','172.15.1.1','172.32.0.1','192.168.0.999','::1'])assert.equal(privateIPv4(address),false);
 const adapter=address=>[{address,internal:false}];const interfaces={wifi:adapter('192.168.0.126'),vpn:adapter('26.75.44.88')};
 assert.equal(selectLanAddress('',interfaces),'192.168.0.126');
 assert.equal(selectLanAddress('192.168.0.126',interfaces),'192.168.0.126');
 assert.throws(()=>selectLanAddress('10.1.2.3',interfaces),/assigned private/);
 assert.throws(()=>selectLanAddress('',{...interfaces,ethernet:adapter('10.0.0.3')}),/Specify/);
});

test('LAN launcher refuses missing/disabled local opt-in and NODE_ENV=production before generating keys',async()=>{
 const originalLocal=process.env.VITE_LOCAL_MODE,originalNode=process.env.NODE_ENV;
 const emptyEnv=fileURLToPath(new URL('../.nonexistent-lan-test-env',import.meta.url));
 try{
  for(const value of ['', 'false']){process.env.VITE_LOCAL_MODE=value;await assert.rejects(createLanDevServer({envDir:emptyEnv}),/requires VITE_LOCAL_MODE=true/);}
  process.env.VITE_LOCAL_MODE='true';process.env.NODE_ENV='production';await assert.rejects(createLanDevServer({envDir:emptyEnv}),/development environment/);
 }finally{
  if(originalLocal===undefined)delete process.env.VITE_LOCAL_MODE;else process.env.VITE_LOCAL_MODE=originalLocal;
  if(originalNode===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=originalNode;
 }
});

test('regular Vite denies generated certificates while keeping the production local-auth gate',async()=>{
 const config=(await import('../vite.config.js')).default;
 for(const command of ['serve','build']){
  const settings=config({command,mode:command==='serve'?'development':'production'});
  assert.ok(settings.server.fs.deny.includes('**/.local/**'));
  assert.ok(settings.server.fs.deny.includes('*.{crt,pem,pfx,p12,key,cer}'));
  if(command==='build')assert.equal(settings.define['import.meta.env.VITE_LOCAL_MODE'],'"false"');
 }
});
