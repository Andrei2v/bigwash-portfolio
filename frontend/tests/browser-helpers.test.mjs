import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForDevToolsPort } from './browser-helpers.mjs';

test('Chrome startup waits for an unlocked, complete port file instead of failing on Windows EBUSY', async () => {
  const states = [Object.assign(new Error('Busy'), { code: 'EBUSY' }), '', '9222', '0\n/devtools/browser/test', '9222\n/devtools/browser/test'];
  const port = await waitForDevToolsPort('isolated-fixture', { interval: 0, read: () => {
    const state = states.shift();
    if (state instanceof Error) throw state;
    return state;
  } });
  assert.equal(port, 9222);
  assert.equal(states.length, 0);
});

test('Chrome startup errors remain explicit if no valid port is published', async () => {
  await assert.rejects(waitForDevToolsPort('isolated-fixture', { timeout: 5, interval: 1, read: () => '' }), /complete DevToolsActivePort/);
  await assert.rejects(waitForDevToolsPort('isolated-fixture', { read: () => { throw new Error('Unexpected failure'); } }), /Unexpected failure/);
});
