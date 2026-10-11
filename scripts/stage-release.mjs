import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(resolve(root, 'src-tauri/tauri.conf.json'), 'utf8'));
const version = config.version;
const artifact = resolve(root, `src-tauri/target/release/bundle/nsis/${config.productName}_${version}_x64-setup.exe`);
const installer = await readFile(artifact);
if (installer.subarray(0, 2).toString() !== 'MZ') throw new Error('Release artifact is not a Windows executable.');
const metadata = await stat(artifact);
const executable = await stat(resolve(root, 'src-tauri/target/release/nitrowave.exe'));
// Bundling can touch the executable immediately after closing the installer. Allow timestamp rounding.
if (metadata.mtimeMs + 2000 < executable.mtimeMs) throw new Error('Installer is older than the executable. Rebuild the NSIS bundle first.');
const file = `Nitrowave-Aero-${version}-Windows-x64-setup.exe`;
const sha256 = createHash('sha256').update(installer).digest('hex');
const destination = resolve(root, 'release', `v${version}`);
await mkdir(destination, { recursive: true });
await copyFile(artifact, resolve(destination, file));
for (const legal of ['LICENSE.txt', 'PRIVACY.txt', 'THIRD-PARTY-NOTICES.txt']) {
  await copyFile(resolve(root, 'src-tauri', legal), resolve(destination, legal));
}
await writeFile(resolve(destination, 'Windows-SHA256SUMS.txt'), `${sha256}  ${file}\n`);
console.log(`Staged Nitrowave Aero ${version}: ${(installer.length / 1_000_000).toFixed(1)} MB, built ${metadata.mtime.toISOString()}`);
console.log(`SHA-256: ${sha256}`);
