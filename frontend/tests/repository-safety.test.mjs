import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const gitAvailable = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root, windowsHide: true, stdio: 'ignore' }).status === 0;
const git = (args, options = {}) => execFileSync('git', args, { cwd: root, windowsHide: true, encoding: 'utf8', ...options });

test('Git-tracked material contains no private environment, key, database or generated paths', { skip: !gitAvailable }, () => {
  const paths = git(['ls-files', '-z']).split('\0').filter(Boolean);
  const unsafe = paths.filter(filename => filename !== '.env.example' && (
    /(?:^|\/)(?:\.env(?:\..*)?|\.local|node_modules|\.svelte-kit|build|dist)(?:\/|$)/i.test(filename) ||
    /\.(?:pfx|p12|key|pem|p8|jks|keystore|db|sqlite3?|sql|dump|zip|7z|log)$/i.test(filename) || /(?:^|\/)id_(?:rsa|ecdsa|ed25519)$/.test(filename)
  ));
  assert.deepEqual(unsafe, []);
  assert.ok(paths.includes('.env.example'));
});

test('ignore rules exclude new private material while keeping the public environment example', { skip: !gitAvailable }, () => {
  const candidates = ['.env', '.env.production', '.env.development.local', '.env.example', '.local/https/server.pfx', 'certificates/private.key', 'certificates/private.pem', 'certificates/private.p12', 'keys/id_rsa', 'keys/test.keystore', 'data/preview.db', 'data/preview.sqlite3', 'backup.sql', 'archive.zip', 'debug.log', 'BigWash-local-backup-2026-11-21.json', 'bigwash-report-fixture.json', 'node_modules/example.js', '.svelte-kit/output.js', 'build/client.js', 'dist/client.js'];
  const ignored = new Set(git(['check-ignore', '--no-index', '--stdin'], { input: candidates.join('\n') + '\n' }).trim().split('\n'));
  for (const filename of candidates) assert.equal(ignored.has(filename), filename !== '.env.example', filename);
});
