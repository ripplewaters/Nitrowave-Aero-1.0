// Writes THIRD-PARTY-NOTICES.txt: every open-source component that ships inside the app,
// with its licence text (copyright lines included). Run from the repo root; release:stage calls it.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const licenceFiles = (dir) => existsSync(dir)
  ? readdirSync(dir).filter((f) => /^(licen[cs]e|copying|notice)/i.test(f)).sort().map((f) => readFileSync(join(dir, f), 'utf8').trim())
  : [];

// --- JavaScript and fonts bundled into the window (runtime dependencies only) ---
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')).packages;
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const js = new Map();
const visitJs = (name) => {
  const key = `node_modules/${name}`, entry = lock[key];
  if (!entry || js.has(name)) return;
  js.set(name, { name, version: entry.version, license: entry.license ?? 'see text', texts: licenceFiles(join(root, key)) });
  for (const dep of Object.keys(entry.dependencies ?? {})) visitJs(dep);
};
Object.keys(pkg.dependencies).forEach(visitJs);

// Include runtime crates for the actual build target; universal Mac packages contain both slices.
const targetIndex = process.argv.indexOf('--target');
const requestedTarget = targetIndex >= 0 ? process.argv[targetIndex + 1] : undefined;
if (targetIndex >= 0 && (!requestedTarget || requestedTarget.startsWith('-'))) throw new Error('--target needs a Rust target.');
const host = execFileSync('rustc', ['-vV']).toString().match(/^host: (.+)$/m)?.[1].trim();
if (!host) throw new Error('Could not determine the Rust host target.');
const targets = requestedTarget === 'universal-apple-darwin'
  ? ['aarch64-apple-darwin', 'x86_64-apple-darwin'] : [requestedTarget ?? host];
const rust = new Map();
for (const target of targets) {
  const meta = JSON.parse(execFileSync('cargo', ['metadata', '--format-version', '1', '--filter-platform', target, '--manifest-path', join(root, 'src-tauri/Cargo.toml')], { maxBuffer: 1 << 28 }).toString());
  const byId = new Map(meta.packages.map((p) => [p.id, p]));
  const nodes = new Map(meta.resolve.nodes.map((n) => [n.id, n]));
  const visited = new Set();
  const visitRust = (id) => {
    if (visited.has(id)) return;
    visited.add(id);
    rust.set(id, byId.get(id));
    for (const dep of nodes.get(id)?.deps ?? []) if (dep.dep_kinds.some((k) => k.kind === null)) visitRust(dep.pkg);
  };
  visitRust(meta.resolve.root);
  rust.delete(meta.resolve.root);
}

// Group components that share an identical licence text so the file stays readable.
const groups = new Map();
const add = (label, licence, texts) => {
  const body = texts.length ? texts.join('\n\n- - -\n\n') : `Licensed under ${licence}. Standard texts for common licences are at https://spdx.org/licenses/.`;
  const group = groups.get(body) ?? { licence, names: [] };
  group.names.push(label);
  groups.set(body, group);
};
for (const c of [...js.values()].sort((a, b) => a.name.localeCompare(b.name))) add(`${c.name} ${c.version} (npm)`, c.license, c.texts);
for (const p of [...rust.values()].sort((a, b) => a.name.localeCompare(b.name))) add(`${p.name} ${p.version} (crate)`, p.license ?? 'see text', licenceFiles(dirname(p.manifest_path)));

const out = [
  'NITROWAVE AERO — THIRD-PARTY NOTICES',
  '',
  'Nitrowave Aero includes the open-source components listed below. Each is the property of its',
  'authors and is used under the licence reproduced with it. These licences apply to those',
  'components only, not to Nitrowave Aero itself (see LICENSE.txt).',
  '',
  ...(targets.some((target) => target.includes('windows')) ? [
    'The Windows installer can also download Microsoft Edge WebView2 Runtime, provided by Microsoft',
    'under its own terms: https://developer.microsoft.com/microsoft-edge/webview2/',
  ] : ['The macOS application uses the system-provided Apple WKWebView runtime.']),
  '',
  'Components under the Mozilla Public License 2.0 (cssparser, selectors, dtoa-short, option-ext and',
  'related crates) are used unmodified. Their source code is available from https://crates.io under',
  'the crate name and version listed below.',
  '',
  `Components: ${js.size} JavaScript/font packages, ${rust.size} Rust crates.`,
  '',
];
let index = 0;
for (const [body, group] of groups) {
  // A unique group header: licence texts themselves sometimes contain ===== or ----- lines.
  out.push(`==== LICENCE GROUP ${++index} ${'='.repeat(56)}`, group.names.join('\n'), `Licence: ${group.licence}`, `---- TEXT ${'-'.repeat(68)}`, body, '');
}
writeFileSync(join(root, 'src-tauri/THIRD-PARTY-NOTICES.txt'), out.join('\n'));
console.log(`Third-party notices: ${js.size} npm, ${rust.size} crates, ${groups.size} distinct licence texts.`);
