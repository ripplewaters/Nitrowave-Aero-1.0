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
const file = `downloads/Nitrowave-Aero-${version}-Windows-x64-setup.exe`;
const sha256 = createHash('sha256').update(installer).digest('hex');
await mkdir(resolve(root, 'landing/public/downloads'), { recursive: true });
await copyFile(artifact, resolve(root, 'landing/public', file));
await copyFile(resolve(root, 'src-tauri/LICENSE.txt'), resolve(root, 'landing/public/downloads/LICENSE.txt'));
await copyFile(resolve(root, 'src-tauri/PRIVACY.txt'), resolve(root, 'landing/public/downloads/PRIVACY.txt'));
await copyFile(resolve(root, 'src-tauri/THIRD-PARTY-NOTICES.txt'), resolve(root, 'landing/public/downloads/THIRD-PARTY-NOTICES.txt'));
await writeFile(resolve(root, 'landing/public/downloads/SHA256SUMS.txt'), `${sha256}  ${file.split('/').pop()}\n`);
await writeFile(resolve(root, 'landing/release.json'), JSON.stringify({ version, file, sizeMB: (installer.length / 1_000_000).toFixed(1), sha256 }, null, 2) + '\n');
console.log(`Staged Nitrowave Aero ${version}: ${(installer.length / 1_000_000).toFixed(1)} MB, built ${metadata.mtime.toISOString()}`);
console.log(`SHA-256: ${sha256}`);
