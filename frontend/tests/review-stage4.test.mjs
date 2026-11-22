import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function configFixture(local = true, initial = {}) {
  const data = new Map(Object.entries(initial));
  let fail = false;
  const state = value => value;
  state.snapshot = value => value;
  const context = vm.createContext({ LOCAL_MODE: local, structuredClone, $state: state,
    localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => { if (fail) throw Error('Full'); data.set(key, value); } }
  });
  const source = fs.readFileSync(new URL('../src/lib/dev-config.js', import.meta.url), 'utf8').replace(/^import .*;\r?$/gm, '').replaceAll('export ', '');
  vm.runInContext(source, context);
  vm.runInContext(fs.readFileSync(new URL('../src/lib/stores/promo.svelte.js', import.meta.url), 'utf8').replace(/^import .*;\r?$/gm, '').replace('export const promo', 'const promo'), context);
  return { ...vm.runInContext('({RELAY_SLOT_COUNT, relaySlot, relayAssignmentError, validEquipment, initialEquipment, createDevConfig, initialServicePrograms, validServicePrograms, initialPromo, validPromo, promoApplies, promo, initialDiscounts, validDiscounts})', context), data, fail: value => { fail = value; } };
}

function locationFixture(local = true, fetcher = async () => { throw Error('Unexpected network'); }) {
  const context = vm.createContext({ LOCAL_MODE: local, structuredClone, fetch: fetcher, URL, DOMException, AbortController, setTimeout, clearTimeout });
  vm.runInContext(fs.readFileSync(new URL('../src/lib/location.js', import.meta.url), 'utf8').replace(/^import .*;\r?$/gm, '').replaceAll('export ', ''), context);
  return vm.runInContext('({validLocation, worldPoint, coordinates, mapTiles, photonPlaces, geocode})', context);
}
const feature = (longitude = 30.5234, latitude = 50.4501) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [longitude, latitude] }, properties: { name: 'Test wash', street: 'Test street', housenumber: '1', city: 'Kyiv', country: 'Ukraine' } });

test('12 DEV relay slots reject conflicts and invalid assignments while preserving legacy data on load', () => {
  const f = configFixture();
  assert.equal(f.RELAY_SLOT_COUNT, 12);
  for (let i = 1; i <= 12; i++) assert.equal(f.relaySlot(String(i)), i);
  for (const value of ['0', '13', '1.5', '01', '', 'Controller A / 2', 2]) assert.equal(f.relaySlot(value), null);
  const nodes = [{ id: 'one', name: 'Pump', relay: '1', hours: 10 }, { id: 'old', name: 'Legacy', relay: 'Controller A / 2', hours: 20 }];
  assert.equal(f.validEquipment(nodes), true);
  assert.equal(f.relayAssignmentError(nodes, { id: 'new', relay: '1' }), 'relaySlotOccupied');
  assert.equal(f.relayAssignmentError(nodes, { id: 'one', relay: '1' }), '');
  assert.equal(f.relayAssignmentError(nodes, { id: 'new', relay: '12' }), '');
  assert.equal(f.relayAssignmentError(nodes, { id: 'new', relay: '13' }), 'relaySlotInvalid');
  assert.equal(nodes[1].relay, 'Controller A / 2');
});

test('pause duration persists independently per pult, validates positive whole seconds and rejects failed writes', () => {
  const f = configFixture();
  for (const value of [0, -1, 1.5, '15', NaN, Infinity, undefined]) assert.equal(f.validServicePrograms({ pauseSeconds: value }), false);
  const store = f.createDevConfig('pause.1', f.initialServicePrograms, f.validServicePrograms);
  const draft = store.load();
  draft.pauseSeconds = 30;
  assert.equal(f.data.size, 0);
  store.save(draft);
  assert.equal(f.createDevConfig('pause.1', f.initialServicePrograms, f.validServicePrograms).load().pauseSeconds, 30);
  assert.equal(f.createDevConfig('pause.2', f.initialServicePrograms, f.validServicePrograms).load().pauseSeconds, 15);
  f.fail(true);
  assert.throws(() => store.save({ pauseSeconds: 60 }), /configSaveFailed/);
  assert.equal(JSON.parse(f.data.get('pause.1')).pauseSeconds, 30);
});

test('Promo shares saved state between global and selected pults without losing the individual selection', () => {
  const f = configFixture();
  f.promo.load();
  assert.equal(f.data.size, 0);
  assert.equal(f.promo.applies(1), false);
  assert.equal(f.promo.save({ enabled: true, scope: 'individual', pultIds: [] }), false);
  assert.equal(f.promo.save({ enabled: true, scope: 'individual', pultIds: [2] }), true);
  assert.equal(f.promo.applies(1), false);
  assert.equal(f.promo.applies(2), true);
  assert.equal(f.promo.save({ enabled: true, scope: 'global', pultIds: [2] }), true);
  assert.equal(f.promo.applies(1), true);
  const restored = configFixture(true, Object.fromEntries(f.data));
  restored.promo.load();
  assert.equal(restored.promo.config.scope, 'global');
  assert.deepEqual(Array.from(restored.promo.config.pultIds), [2]);
  assert.equal(restored.promo.save({ ...restored.promo.config, scope: 'individual' }), true);
  assert.equal(restored.promo.applies(1), false);
  assert.equal(restored.promo.applies(2), true);
});

test('Promo handles corrupt storage, failed writes and PROD without accepting local activation', () => {
  const corrupt = configFixture(true, { 'bigwash.local.v1.promo': '{invalid' });
  corrupt.promo.load();
  assert.equal(corrupt.promo.ready, false);
  assert.equal(corrupt.promo.save(corrupt.initialPromo), false);
  assert.equal(corrupt.data.get('bigwash.local.v1.promo'), '{invalid');
  const f = configFixture(); f.promo.load(); f.fail(true);
  assert.equal(f.promo.save({ enabled: true, scope: 'global', pultIds: [] }), false);
  assert.equal(f.promo.applies(1), false);
  const prod = configFixture(false, { 'bigwash.local.v1.promo': JSON.stringify({ enabled: true, scope: 'global', pultIds: [] }) });
  prod.promo.load();
  assert.equal(prod.promo.applies(1), false);
  assert.equal(prod.promo.save(prod.initialPromo), false);
});

test('discount rules remain independent configuration with a single-discount policy and no chosen priority', () => {
  const f = configFixture();
  const old = structuredClone(f.initialDiscounts); delete old.combination;
  assert.equal(f.validDiscounts(old), true);
  const next = { ...old, combination: 'single' };
  next.turnoverRows[0].active = true; next.totalRefillRows[0].active = true;
  assert.equal(f.validDiscounts(next), true);
  assert.equal(f.validDiscounts({ ...next, combination: 'stack' }), false);
  assert.equal(next.turnoverRows[0].percent, 2);
});

test('map projection and inverse retain coordinates and visible tiles stay within supported zoom/world indices', () => {
  const f = locationFixture();
  for (const [latitude, longitude] of [[50.45, 30.52], [0, 0], [-33.86, 151.2], [80, -170]]) {
    for (const zoom of [3, 5, 15, 18]) {
      const point = f.worldPoint(latitude, longitude, zoom), restored = f.coordinates(point.x, point.y, zoom);
      assert.ok(Math.abs(restored.latitude - latitude) < 1e-7);
      assert.ok(Math.abs(restored.longitude - longitude) < 1e-7);
    }
  }
  const tiles = f.mapTiles({ latitude: 50.45, longitude: 179.9 }, 5, 600, 250);
  assert.ok(tiles.length <= 12);
  assert.ok(tiles.every(tile => tile.url.startsWith('https://tile.openstreetmap.org/5/')));
  for (const pair of [[91, 0], [0, 181], [null, 0], [0, '30'], [NaN, 0]]) assert.equal(f.validLocation(...pair), false);
});

test('Photon parsing uses GeoJSON lon/lat order, preserves address text and rejects invalid responses', () => {
  const f = locationFixture();
  const place = f.photonPlaces({ features: [feature()] })[0];
  assert.equal(place.latitude, 50.4501); assert.equal(place.longitude, 30.5234);
  assert.ok(place.address.includes('Test street 1'));
  assert.equal(f.photonPlaces({ features: [feature(500)] }).length, 0);
  assert.throws(() => f.photonPlaces({}), /geocodeFailed/);
});

test('geocoding is cached, omits credentials and never reaches the network in PROD', async () => {
  const requests = [];
  const f = locationFixture(true, async (url, options) => { requests.push({ url, options }); return { ok: true, json: async () => ({ features: [feature()] }) }; });
  const places = await f.geocode({ address: 'Test address' });
  places[0].address = 'Changed';
  assert.notEqual((await f.geocode({ address: 'Test address' }))[0].address, 'Changed');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.credentials, 'omit');
  assert.equal(requests[0].options.headers, undefined);
  assert.ok(requests[0].url.includes('q=Test%20address'));
  await assert.rejects(locationFixture(false).geocode({ address: 'Test' }), /configUnavailable/);
});

test('geocoding failures and cancellation are explicit rather than empty success', async () => {
  await assert.rejects(locationFixture(true, async () => ({ ok: false })).geocode({ address: 'Test' }), /geocodeFailed/);
  await assert.rejects(locationFixture(true, async () => ({ ok: true, json: async () => ({ features: [] }) })).geocode({ latitude: 50, longitude: 30 }), /geocodeNotFound/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(locationFixture().geocode({ address: 'Test', signal: controller.signal }), error => error.name === 'AbortError');
});
