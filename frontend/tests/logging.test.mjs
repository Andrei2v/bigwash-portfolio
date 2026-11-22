import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { parse } from 'svelte/compiler';

function components(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? components(filename) : filename.endsWith('.svelte') ? [filename] : [];
  });
}

function visit(node, callback) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach(value => visit(value, callback));
  callback(node);
  for (const [key, value] of Object.entries(node)) {
    if (!['metadata', 'loc'].includes(key)) visit(value, callback);
  }
}

test('diagnostic logging does not serialize credentials, tokens or raw response payloads', () => {
  const secrets = [randomUUID(), randomUUID(), randomUUID()];
  const error = {
    name: 'AxiosError',
    message: secrets[2],
    config: { headers: { Authorization: `Bearer ${secrets[0]}` }, data: { password: secrets[1] } },
    response: { status: 503, data: { message: secrets[2] } }
  };
  let checked = 0;
  for (const filename of components(fileURLToPath(new URL('../src', import.meta.url)))) {
    const source = fs.readFileSync(filename, 'utf8');
    const ast = parse(source, { modern: true });
    visit(ast.instance?.content, node => {
      if (node.type !== 'CallExpression' || node.callee.object?.name !== 'console') return;
      const output = [];
      const capture = (...args) => output.push(args);
      // Exercise the actual calls with an error carrying a sensitive Axios request.
      vm.runInNewContext(source.slice(node.start, node.end), {
        console: { log: capture, error: capture, warn: capture, info: capture, debug: capture },
        error, err: error, res: { status: 503 }, pult: { name: 'Fixture panel' }
      });
      for (const secret of secrets) {
        assert.ok(!JSON.stringify(output).includes(secret), `${filename}: diagnostic leaks sensitive data`);
      }
      checked++;
    });
  }
  assert.ok(checked > 0);
});
