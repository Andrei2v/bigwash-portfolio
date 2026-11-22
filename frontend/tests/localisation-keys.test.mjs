import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { parse as parseJavaScript } from 'acorn';
import { parse as parseSvelte } from 'svelte/compiler';
import { t as ua } from '../src/lib/localisation/ua.js';
import { t as ru } from '../src/lib/localisation/ru.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const get = (dictionary, key) => key.split('.').reduce((value, part) => value?.[part], dictionary);
const leaves = (object, prefix = '') => Object.entries(object).flatMap(([key, value]) =>
  value && typeof value === 'object' && !Array.isArray(value) ? leaves(value, prefix + key + '.') : [[prefix + key, value]]);
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? files(filename) : /\.(svelte|js)$/.test(filename) ? [filename] : [];
  });
}
function visit(node, callback) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach(value => visit(value, callback));
  callback(node);
  for (const [key, value] of Object.entries(node)) if (!['metadata', 'loc'].includes(key)) visit(value, callback);
}
function literalKeys(expression) {
  if (expression?.type === 'Literal' && typeof expression.value === 'string') return [expression.value];
  if (expression?.type === 'ConditionalExpression') return [...literalKeys(expression.consequent), ...literalKeys(expression.alternate)];
  return [];
}

test('semantic dictionaries have readable paths, unique properties, and no hash identifiers', () => {
  assert.deepEqual(leaves(ua).map(([key]) => key).sort(), leaves(ru).map(([key]) => key).sort());
  for (const [key] of leaves(ua.ui)) {
    assert.match(key, /^[a-z][A-Za-z]*(\.[a-z][A-Za-z]*)+$/);
    assert.doesNotMatch(key, /(?:^|\.)s[0-9a-f]{10}(?:\.|$)/);
  }
  for (const language of ['ua', 'ru']) {
    const source = fs.readFileSync(path.join(root, 'src/lib/localisation', language + '.js'), 'utf8');
    visit(parseJavaScript(source, { ecmaVersion: 'latest', sourceType: 'module' }), node => {
      if (node.type !== 'ObjectExpression') return;
      const names = node.properties.map(property => property.key?.name ?? property.key?.value);
      assert.equal(new Set(names).size, names.length, language + ': duplicate dictionary property');
    });
  }
});

test('all literal translation calls resolve; dynamic USB labels use the semantic dictionary', () => {
  let checked = 0;
  for (const filename of files(path.join(root, 'src'))) {
    const source = fs.readFileSync(filename, 'utf8');
    assert.doesNotMatch(source, /\bs[0-9a-f]{10}\b/, filename + ': unmigrated hash identifier');
    const ast = filename.endsWith('.svelte') ? parseSvelte(source, { modern: true }) : parseJavaScript(source, { ecmaVersion: 'latest', sourceType: 'module' });
    visit(ast, node => {
      if (node.type !== 'CallExpression' || node.callee.object?.name !== 'language' || !['t', 'plural'].includes(node.callee.property?.name)) return;
      for (const key of literalKeys(node.arguments[0])) {
        for (const dictionary of [ua, ru]) assert.notEqual(get(dictionary, key), undefined, filename + ': missing ' + key);
        checked++;
      }
    });
  }
  const source = fs.readFileSync(path.join(root, 'src/lib/dev-config.js'), 'utf8');
  let ports;
  visit(parseJavaScript(source, { ecmaVersion: 'latest', sourceType: 'module' }), node => {
    if (node.type === 'VariableDeclarator' && node.id.name === 'usbPortFields') ports = vm.runInNewContext(source.slice(node.init.start, node.init.end));
  });
  assert.equal(ports.length, 4);
  for (const field of ports) for (const dictionary of [ua, ru]) assert.equal(typeof get(dictionary, 'ui.' + field.label), 'string');
  assert.ok(checked > 500, 'All page and component calls must be inspected');
});

test('shared source labels preserve their established translation despite dictionary grouping', () => {
  // The two previews intentionally have distinct RU wording; translate() keeps the Programs variant.
  const index = new Map();
  for (const dictionary of [ua, ru]) for (const [key, value] of leaves(dictionary)) if (typeof value === 'string' && !index.has(value)) index.set(value, key);
  assert.equal(get(ru, index.get(ua.ui.programs.preview.title)), ru.ui.programs.preview.title);
  assert.notEqual(ru.ui.programs.preview.title, ru.ui.dashboard.telegram.previewLabel);
});

test('relative and lib imports use exact tracked filename case for Linux checkouts', () => {
  let checked = 0;
  for (const filename of files(path.join(root, 'src'))) {
    const source = fs.readFileSync(filename, 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*\()(['"])(\$lib\/[^'"]+|\.[^'"]+)\1/g)) {
      const target = match[2].startsWith('$lib/') ? path.join(root, 'src/lib', match[2].slice(5)) : path.resolve(path.dirname(filename), match[2]);
      if (!path.extname(target)) continue;
      let directory = root;
      for (const part of path.relative(root, target).split(path.sep)) {
        assert.ok(fs.readdirSync(directory).includes(part), path.relative(root, filename) + ': case mismatch in ' + match[2]);
        directory = path.join(directory, part);
      }
      checked++;
    }
  }
  assert.ok(checked > 30);
});
