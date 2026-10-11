import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const targetIndex = args.indexOf('--target');
const target = targetIndex >= 0 ? args[targetIndex + 1] : undefined;
if (targetIndex >= 0 && (!target || target.startsWith('-'))) throw new Error('--target needs a Rust target.');
if (target?.includes('apple-darwin') && process.platform !== 'darwin') {
  throw new Error('Build macOS packages on a Mac or the macOS GitHub Actions runner.');
}
const run = (command, commandArgs) => {
  const result = spawnSync(command, commandArgs, { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
run(process.execPath, ['scripts/third-party-notices.mjs', ...(target ? ['--target', target] : [])]);
// Calling the installed CLI through Node avoids shell quoting and npm.cmd differences.
run(process.execPath, ['node_modules/@tauri-apps/cli/tauri.js', 'build', ...args]);
