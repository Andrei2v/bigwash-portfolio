import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { telegramSupportURL } from '../src/lib/support.js';
function fixture(local = true) {
 const values = new Map(); const c=vm.createContext({ LOCAL_MODE:local, structuredClone, localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)} });
 vm.runInContext(fs.readFileSync(new URL('../src/lib/dev-config.js',import.meta.url),'utf8').replace(/^import .*;\r?$/gm,'').replaceAll('export ',''),c);
 return {...vm.runInContext('({initialPultPrograms,pultProgramsError,validPultPrograms,createDevConfig,usbPortFields})',c), values};
}
test('pult programs use unique IDs and positive button numbers independent of relay slots',()=>{
 const f=fixture();const rows=structuredClone(f.initialPultPrograms);
 assert.equal(f.validPultPrograms(rows),true);assert.equal(rows[1].button,13);
 rows.push({id:'dev-unique',name:'User program',button:123456,active:false});assert.equal(f.validPultPrograms(rows),true);
 rows[2].button=13;assert.equal(f.pultProgramsError(rows),'programButtonConflict');
 for(const value of [0,-1,1.5,'14',NaN,Infinity,Number.MAX_SAFE_INTEGER+1]){rows[2].button=value;assert.equal(f.pultProgramsError(rows),'programInvalid');}
 rows[2].button=null;assert.equal(f.validPultPrograms(rows),true);rows[2].id=rows[0].id;assert.equal(f.validPultPrograms(rows),false);
});
test('pult program storage preserves old rows, isolates pults, cancels drafts and rejects stale writes',()=>{
 const f=fixture();const first=f.createDevConfig('pult.1',f.initialPultPrograms,f.validPultPrograms);const draft=first.load();draft.push({id:'dev-new',name:'New',button:20,active:true});assert.equal(f.values.size,0);first.save(draft);
 const other=f.createDevConfig('pult.1',f.initialPultPrograms,f.validPultPrograms);const saved=other.load();assert.equal(saved.length,3);assert.equal(f.createDevConfig('pult.2',f.initialPultPrograms,f.validPultPrograms).load().length,2);
 first.save(saved.map(row=>({...row,active:false})));assert.throws(()=>other.save(saved),/configConflict/);
 const prod=fixture(false);assert.throws(()=>prod.createDevConfig('pult.1',prod.initialPultPrograms,prod.validPultPrograms).load(),/configUnavailable/);assert.equal(prod.values.size,0);
});
test('USB text presets target all four existing fields without inventing device types',()=>{
 const {usbPortFields}=fixture();assert.deepEqual(Array.from(usbPortFields,row=>row.key),['paypassPort','cashPort','buttonsPort','barcodePort']);
 assert.deepEqual(Array.from(usbPortFields,row=>Array.from(row.presets)),[['-','auto','ttyACM0','ttyACM1'],['auto','ttyACM0','ttyACM1'],['ttyUSB0','ttyS5','ttyS6','ttyS7'],['auto','ttyACM0']]);
});
test('Telegram configuration accepts public usernames only and rejects unsafe redirects or bot URLs',()=>{
 assert.equal(telegramSupportURL('https://t.me/Example_support'),'https://t.me/Example_support');
 assert.equal(telegramSupportURL(' https://telegram.me/Example_support/ '),'https://t.me/Example_support');
 for(const value of [undefined,'','javascript:alert(1)','https://evil.test/name','https://t.me.evil.test/name','https://user:pass@t.me/name','https://t.me/proxy','https://t.me/share/url','https://t.me/name?token=secret','tg://resolve?domain=Test','https://api.telegram.org/bot123/sendMessage']) assert.equal(telegramSupportURL(value),'');
});
