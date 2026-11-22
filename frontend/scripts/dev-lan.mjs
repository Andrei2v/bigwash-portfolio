import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { isIP } from 'node:net';
import { X509Certificate } from 'node:crypto';
import { createSecureContext } from 'node:tls';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer, loadEnv } from 'vite';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const privateIPv4 = address => isIP(address) === 4 &&
  (/^10\./.test(address) || /^192\.168\./.test(address) || /^172\.(1[6-9]|2\d|3[01])\./.test(address));

export function selectLanAddress(requested, interfaces = os.networkInterfaces()) {
  const addresses = [...new Set(Object.values(interfaces).flat().filter(item => item && !item.internal && privateIPv4(item.address)).map(item => item.address))];
  if (requested && addresses.includes(requested)) return requested;
  if (!requested && addresses.length === 1) return addresses[0];
  throw Error('Specify an assigned private IPv4 address: start-dev-lan.bat <IP>. Available: ' + (addresses.join(', ') || 'none'));
}

export function ensureDevCertificate(directory, address) {
  const names = ['rootCA.cer', 'server.cer', 'server.pfx'];
  const present = names.filter(name => fs.existsSync(path.join(directory, name)));
  if (!present.length) {
    if (process.platform !== 'win32') throw Error('Certificate setup requires Windows PowerShell and .NET Framework 4.7.2 or newer.');
    fs.mkdirSync(directory, { recursive: true });
    const lock = path.join(directory, '.creating');
    let handle;
    try {
      handle = fs.openSync(lock, 'wx');
      const generated = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
        '-File', path.join(projectRoot, 'scripts/create-dev-certificate.ps1'), '-LanAddress', address, '-OutputDirectory', directory],
      { windowsHide: true, encoding: 'utf8', timeout: 60000 });
      if (generated.status !== 0) throw Error('DEV certificate creation failed. Check Windows PowerShell/.NET and folder permissions. Existing files were not replaced.');
    } finally {
      if (handle !== undefined) { fs.closeSync(handle); fs.unlinkSync(lock); }
    }
  } else if (present.length !== names.length) {
    throw Error('Incomplete DEV certificate files. Keep them intact and choose a new certificate directory.');
  }
  const ca = new X509Certificate(fs.readFileSync(path.join(directory, 'rootCA.cer')));
  const certificate = new X509Certificate(fs.readFileSync(path.join(directory, 'server.cer')));
  if (!ca.ca || !certificate.verify(ca.publicKey) || !certificate.checkIP(address) ||
    Date.parse(certificate.validTo) <= Date.now() || Date.parse(certificate.validFrom) > Date.now()) {
    throw Error('DEV certificate expired or does not cover this IP. Rename .local/https, restart and trust the new rootCA.cer on your phone.');
  }
  const https = { pfx: fs.readFileSync(path.join(directory, 'server.pfx')) };
  createSecureContext(https);
  return { https, fingerprint: ca.fingerprint256 };
}

export async function createLanDevServer({ root = projectRoot, envDir = root, address,
  certificateDir = path.join(root, '.local/https'), port = 5174 } = {}) {
  const env = loadEnv('development', envDir);
  if (process.env.NODE_ENV === 'production' || env.VITE_LOCAL_MODE !== 'true') {
    throw Error('LAN DEV server requires VITE_LOCAL_MODE=true and a development environment. No production fallback is allowed.');
  }
  const host = selectLanAddress(address);
  const { https, fingerprint } = ensureDevCertificate(certificateDir, host);
  const server = await createServer({ root, envDir, mode: 'development', server: { host, port, strictPort: true, https,
    // Preserve Vite's default deny rules and block all local certificate material.
    fs: { deny: ['.env', '.env.*', '*.{crt,pem,pfx,p12,key,cer}', '**/.local/**', '**/.git/**'] }
  } });
  if (!server.config.env.DEV || server.config.env.PROD || server.config.env.VITE_LOCAL_MODE !== 'true') {
    await server.close();
    throw Error('LAN server refused a nonlocal or production configuration.');
  }
  return { server, address: host, port, certificateDir, fingerprint };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const { server, address, port, certificateDir, fingerprint } = await createLanDevServer({ address: process.argv[2] || undefined });
    await server.listen();
    console.log(`BigWash local DEV: https://${address}:${port}/login`);
    console.log('Trust only your generated public rootCA.cer on the phone; certificate setup is described in README.md.');
    console.log('Public CA: ' + path.join(certificateDir, 'rootCA.cer'));
    console.log('CA SHA-256: ' + fingerprint);
    console.log('Never share server.pfx. Accounts belong to this browser and HTTPS origin.');
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close().finally(() => process.exit(0)));
  } catch (error) {
    console.error('LAN DEV startup failed: ' + error.message);
    process.exitCode = 1;
  }
}
