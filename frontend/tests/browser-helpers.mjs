import fs from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

export async function waitForDevToolsPort(filename, { timeout = 15000, interval = 50, read = fs.readFileSync } = {}) {
  const deadline = Date.now() + timeout;
  do {
    try {
      // Chrome can create or lock this file before both lines have been written.
      const [port, endpoint] = read(filename, 'utf8').trim().split(/\r?\n/);
      if (/^\d+$/.test(port) && Number(port) > 0 && Number(port) <= 65535 && endpoint?.startsWith('/devtools/browser/')) {
        return Number(port);
      }
    } catch (error) {
      if (!['ENOENT', 'EBUSY', 'EACCES', 'EPERM'].includes(error.code)) throw error;
    }
    await delay(interval);
  } while (Date.now() < deadline);
  throw new Error('Chrome did not publish a complete DevToolsActivePort file in time');
}
