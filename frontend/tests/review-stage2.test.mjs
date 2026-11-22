import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function fixture(local = true, initial = {}) {
  const data = new Map(Object.entries(initial));
  let blocked = false;
  let reads = 0;
  const context = vm.createContext({
    LOCAL_MODE: local, structuredClone,
    localStorage: {
      getItem(key) { reads++; if (blocked) throw new Error('Blocked'); return data.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error('Blocked'); data.set(key, value); }
    }
  });
  const source = fs.readFileSync(new URL('../src/lib/dev-config.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?$/gm, '').replaceAll('export ', '');
  vm.runInContext(source, context);
  return {
    ...vm.runInContext('({createDevConfig, initialEquipment, validEquipment, equipmentDeleteError, initialUsbConfig, validUsbConfig, initialDiscounts, validDiscounts, validWashHours, validMedia, initialPults, pultDataDefaults, validPultData})', context),
    data, blocked(value) { blocked = value; }, reads() { return reads; }
  };
}

test('pult Data uses existing public model fields and never copies the terminal password into its saved record', () => {
  const f = fixture();
  const original = JSON.stringify(f.initialPults[0]);
  const defaults = f.pultDataDefaults(f.initialPults[0]);
  assert.equal('password' in defaults.settings, false);
  const store = f.createDevConfig('bigwash.local.v1.pultData.1', defaults, f.validPultData);
  const draft = store.load();
  assert.equal(f.data.size, 0);
  draft.name = 'Edited pult'; draft.settings.timer = 12; draft.settings.login = 'pult_config'; draft.settings.cardRecordMode = true;
  store.save(draft);
  const restored = f.createDevConfig('bigwash.local.v1.pultData.1', defaults, f.validPultData).load();
  assert.equal(restored.name, 'Edited pult'); assert.equal(restored.settings.timer, 12); assert.equal(restored.settings.login, 'pult_config');
  assert.equal('password' in restored.settings, false);
  assert.equal(JSON.stringify(f.initialPults[0]), original);
});

test('pult Data rejects invalid fields, secret persistence, failed writes and PROD access', () => {
  const f = fixture(), defaults = f.pultDataDefaults(f.initialPults[0]);
  const store = f.createDevConfig('bigwash.local.v1.pultData.1', defaults, f.validPultData);
  store.load();
  for (const timer of [-1, 1.5, NaN]) assert.equal(f.validPultData({ ...defaults, settings: { ...defaults.settings, timer } }), false);
  assert.equal(f.validPultData({ ...defaults, settings: { ...defaults.settings, password: 'terminal-test-fixture' } }), false);
  f.blocked(true); assert.throws(() => store.save(defaults), /configSaveFailed/); assert.equal(f.data.size, 0);
  f.blocked(false); store.save(defaults); assert.equal(f.data.size, 1);
  const prod = fixture(false);
  assert.throws(() => prod.createDevConfig('bigwash.local.v1.pultData.1', defaults, prod.validPultData).load(), /configUnavailable/);
  assert.equal(prod.reads(), 0);
});

test('DEV config opening does not write defaults; draft edits and cancellation leave saved records untouched', () => {
  const f = fixture();
  const store = f.createDevConfig('equipment.1', f.initialEquipment, f.validEquipment);
  const draft = store.load();
  assert.equal(f.data.size, 0);
  draft[0].name = 'Unsaved';
  assert.equal(store.load()[0].name, f.initialEquipment[0].name);
  assert.equal(f.data.size, 0);
});

test('equipment create/edit/delete round trips preserve IDs, other pults, hours and unrelated data', () => {
  const f = fixture(true, { history: 'KEEP', 'equipment.2': 'KEEP' });
  const store = f.createDevConfig('equipment.1', f.initialEquipment, f.validEquipment);
  let nodes = store.load();
  nodes.push({ id: 'local-new', name: 'New pump', relay: 'Controller A / 2', hours: 0 });
  store.save(nodes);
  const reopened = f.createDevConfig('equipment.1', [], f.validEquipment);
  nodes = reopened.load();
  nodes[1].name = 'Edited';
  reopened.save(nodes);
  assert.equal(JSON.parse(f.data.get('equipment.1'))[1].name, 'Edited');
  assert.equal(f.equipmentDeleteError(nodes[1]), '');
  reopened.save(nodes.filter(node => node.id !== 'local-new'));
  assert.deepEqual(JSON.parse(f.data.get('equipment.1')), JSON.parse(JSON.stringify(f.initialEquipment)));
  assert.equal(f.data.get('equipment.2'), 'KEEP');
  assert.equal(f.data.get('history'), 'KEEP');
});

test('unknown equipment dependencies block deletion, including additional fields on a local node', () => {
  const f = fixture();
  for (const node of [f.initialEquipment[0], { id: 'server-1' }, { id: 'local-1', module_id: 2 }, null]) {
    assert.equal(f.equipmentDeleteError(node), 'equipmentDependencies');
  }
});

test('equipment validation rejects blank identifiers, duplicate IDs, missing relay and invalid hours', () => {
  const f = fixture();
  assert.equal(f.validEquipment(f.initialEquipment), true);
  assert.equal(f.validEquipment([]), true);
  for (const patch of [{ name: ' ' }, { relay: '' }, { id: '' }, { hours: -1 }, { hours: NaN }]) {
    assert.equal(f.validEquipment([{ ...f.initialEquipment[0], ...patch }]), false);
  }
  assert.equal(f.validEquipment([...f.initialEquipment, ...f.initialEquipment]), false);
});

test('USB config keeps its existing fields/types and persists a new device without physical communication', () => {
  const f = fixture();
  const store = f.createDevConfig('usb.1', f.initialUsbConfig, f.validUsbConfig);
  const draft = store.load();
  draft.devices.push({ slaveId: '90', type: f.initialUsbConfig.devices[1].type });
  draft.paypassPort = 'COM9';
  store.save(draft);
  const restored = f.createDevConfig('usb.1', f.initialUsbConfig, f.validUsbConfig).load();
  assert.equal(restored.devices.length, 3);
  assert.equal(restored.devices[2].slaveId, '90');
  assert.equal(restored.paypassPort, 'COM9');
  const before = f.data.get('usb.1');
  draft.devices.push({ slaveId: ' 90 ', type: f.initialUsbConfig.devices[0].type });
  assert.throws(() => store.save(draft), /configInvalid/);
  assert.equal(f.data.get('usb.1'), before);
});

test('USB validation rejects empty/duplicate IDs and unknown types without coercing existing values', () => {
  const f = fixture();
  for (const device of [{ slaveId: '', type: 'Unknown' }, { slaveId: 40, type: 'Unknown' }, { slaveId: '90', type: 'Unknown' }]) {
    assert.equal(f.validUsbConfig({ ...f.initialUsbConfig, devices: [device] }), false);
  }
  assert.equal(f.validUsbConfig({ ...f.initialUsbConfig, devices: [{ slaveId: 40, type: f.initialUsbConfig.devices[0].type }] }), false);
});

test('storage errors never report save success or alter committed config', () => {
  const f = fixture();
  const store = f.createDevConfig('usb.1', f.initialUsbConfig, f.validUsbConfig);
  const value = store.load();
  store.save(value);
  const before = f.data.get('usb.1');
  value.paypassPort = 'Changed';
  f.blocked(true);
  assert.throws(() => store.save(value), /configSaveFailed/);
  assert.equal(f.data.get('usb.1'), before);
});

test('corrupt and blocked storage are never silently replaced by defaults', () => {
  const f = fixture(true, { config: '{invalid' });
  const store = f.createDevConfig('config', f.initialUsbConfig, f.validUsbConfig);
  assert.throws(() => store.load(), /configReadFailed/);
  assert.throws(() => store.save(f.initialUsbConfig), /configReadFailed/);
  assert.equal(f.data.get('config'), '{invalid');
  f.blocked(true);
  assert.throws(() => store.load(), /configReadFailed/);
});

test('concurrent config changes are detected before writing', () => {
  const f = fixture();
  const a = f.createDevConfig('usb.1', f.initialUsbConfig, f.validUsbConfig);
  const b = f.createDevConfig('usb.1', f.initialUsbConfig, f.validUsbConfig);
  const first = a.load(), second = b.load();
  first.paypassPort = 'First';
  a.save(first);
  second.paypassPort = 'Second';
  assert.throws(() => b.save(second), /configConflict/);
  assert.equal(JSON.parse(f.data.get('usb.1')).paypassPort, 'First');
});

test('PROD/nonlocal config operations cannot read or write DEV config', () => {
  const f = fixture(false, { config: 'KEEP' });
  const store = f.createDevConfig('config', f.initialUsbConfig, f.validUsbConfig);
  assert.throws(() => store.load(), /configUnavailable/);
  assert.throws(() => store.save(f.initialUsbConfig), /configUnavailable/);
  assert.equal(f.reads(), 0);
  assert.equal(f.data.get('config'), 'KEEP');
});

test('all six discount sections persist edits and enabled states without changing payments', () => {
  const f = fixture(true, { payments: 'KEEP' });
  const store = f.createDevConfig('discounts', f.initialDiscounts, f.validDiscounts);
  const config = store.load();
  config.turnoverRows.push({ id: 2, sum: 1000, percent: 7.5, active: true });
  config.totalRefillRows[0].percent = 9;
  config.program.percent = 30;
  config.program.active = true;
  config.refill[0].active = true;
  config.clientRefill[0].percent = 18;
  config.newClients[1].active = false;
  store.save(config);
  const restored = f.createDevConfig('discounts', f.initialDiscounts, f.validDiscounts).load();
  assert.deepEqual(JSON.parse(JSON.stringify(restored)), JSON.parse(JSON.stringify(config)));
  assert.equal(f.data.get('payments'), 'KEEP');
  config.turnoverRows[0].percent = 101;
  assert.throws(() => store.save(config), /configInvalid/);
  assert.notEqual(JSON.parse(f.data.get('discounts')).turnoverRows[0].percent, 101);
});

test('wash interval requires two valid ordered HH:mm times only when enabled', () => {
  const f = fixture();
  assert.equal(f.validWashHours({ byTime: false }), true);
  assert.equal(f.validWashHours({ byTime: true, timeFrom: '08:00', timeTo: '22:00' }), true);
  for (const patch of [{}, { timeFrom: '25:00', timeTo: '26:00' }, { timeFrom: '22:00', timeTo: '08:00' }, { timeFrom: '08:00', timeTo: '08:00' }]) {
    assert.equal(f.validWashHours({ byTime: true, ...patch }), false);
  }
});

test('HTML media remains a string and persists without evaluating its content or changing legacy text', () => {
  const f = fixture();
  const legacy = { enabled: true, text: 'Legacy plain text' };
  const store = f.createDevConfig('media.1', legacy, f.validMedia);
  assert.equal(store.load().text, legacy.text);
  assert.equal(f.data.size, 0);
  const html = '<b>Welcome</b><br><script>throw new Error("must not run")</script>';
  store.save({ enabled: true, text: html });
  assert.equal(store.load().text, html);
  assert.equal(f.validMedia({ enabled: true, text: null }), false);
});
