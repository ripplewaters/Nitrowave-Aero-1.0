import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(root, 'landing/release.json'), 'utf8'));
const config = JSON.parse(await readFile(resolve(root, 'src-tauri/tauri.conf.json'), 'utf8'));
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const cargo = await readFile(resolve(root, 'src-tauri/Cargo.toml'), 'utf8');
assert.equal(manifest.version, config.version, 'Website and desktop versions differ');
assert.equal(pkg.version, config.version, 'Package and desktop versions differ');
assert.equal(cargo.match(/^version = "([^"]+)"/m)?.[1], config.version, 'Rust and desktop versions differ');
assert.equal(manifest.tag, `v${config.version}`, 'Release tag differs from version');
assert.equal(manifest.repository, 'https://github.com/ripplewaters/Nitrowave-Aero-1.0');
for (const platform of ['windows', 'macos']) {
  const entry = manifest[platform];
  assert.match(entry.file, /^[A-Za-z0-9._-]+$/);
  assert.match(entry.checksums, /^[A-Za-z0-9._-]+$/);
  assert.ok(entry.file.includes(manifest.version), 'Asset must include version');
}
assert.equal(manifest.macos.preview, true, 'Mac remains a preview; update the website copy and this check together only after native public-release QA');
for (const page of ['index', 'license', 'privacy', 'notices']) {
  const html = await readFile(resolve(root, 'site-dist', `${page}.html`), 'utf8');
  assert.ok(html.includes('Content-Security-Policy'), `${page}: CSP missing`);
  for (const [, asset] of html.matchAll(/(?:src|href)="(\.\/assets\/[^"#]+)"/g)) {
    assert.ok((await stat(resolve(root, 'site-dist', asset))).size > 0);
  }
}
for (let i = 1; i <= 10; i++) {
  assert.ok((await stat(resolve(root, 'site-dist/worlds', `${String(i).padStart(2, '0')}.jpg`))).size > 0);
}
for (const file of ['LICENSE.txt', 'PRIVACY.txt', 'THIRD-PARTY-NOTICES.txt']) {
  const original = await readFile(resolve(root, 'src-tauri', file));
  const hosted = await readFile(resolve(root, 'site-dist/downloads', file));
  assert.ok(original.equals(hosted), `${file}: website must serve the current bundled document`);
}
console.log('PASS: versions, Windows/Mac asset names, static pages, CSP, worlds and legal documents.');

if (process.argv.includes('--published')) {
  // Run after publishing the GitHub draft, before taking the website live.
  for (const platform of ['windows', 'macos']) {
    const entry = manifest[platform];
    const base = `${manifest.repository}/releases/download/${manifest.tag}/`;
    const checksums = await fetch(`${base}${entry.checksums}`, { signal: AbortSignal.timeout(60000) });
    assert.equal(checksums.status, 200, `${platform} checksums not public: publish the draft first`);
    const text = await checksums.text();
    const expected = text.split(/\r?\n/).map((line) => line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i))
      .find((line) => line?.[2] === entry.file)?.[1].toLowerCase();
    assert.ok(expected, `${entry.file} missing in checksum file`);
    const response = await fetch(`${base}${entry.file}`, { signal: AbortSignal.timeout(60000) });
    assert.equal(response.status, 200, `${entry.file} not publicly downloadable`);
    const hash = createHash('sha256');
    let bytes = 0;
    for await (const chunk of response.body) { bytes += chunk.length; hash.update(chunk); }
    assert.ok(bytes > 100000, 'Installer unexpectedly small');
    assert.equal(hash.digest('hex'), expected, `${entry.file} checksum mismatch`);
    console.log(`PASS: public ${platform} download, ${bytes} bytes, SHA-256 ${expected}`);
  }
} else {
  console.log('Public downloads not checked. Before going live: npm run release:verify -- --published');
}
