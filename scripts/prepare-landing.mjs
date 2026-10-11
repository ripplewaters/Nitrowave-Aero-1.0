import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(root, 'landing/release.json'), 'utf8'));
const config = JSON.parse(await readFile(resolve(root, 'src-tauri/tauri.conf.json'), 'utf8'));
if (manifest.version !== config.version || manifest.tag !== `v${config.version}`) {
  throw new Error('Website version/tag must match the desktop app.');
}
const destination = resolve(root, 'landing/public/downloads');
await mkdir(destination, { recursive: true });
for (const file of ['LICENSE.txt', 'PRIVACY.txt', 'THIRD-PARTY-NOTICES.txt']) {
  await copyFile(resolve(root, 'src-tauri', file), resolve(destination, file));
}
console.log('Website legal documents prepared; app downloads are hosted on GitHub Releases.');
