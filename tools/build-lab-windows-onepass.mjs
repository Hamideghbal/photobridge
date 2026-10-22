/**
 * Build PhotoBridge Lab's Electron/NSIS installer on a local Windows computer.
 * GitHub Actions is not required. Run from current repository checkout.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = path.join(root, 'apps', 'lab-desktop');
const archive = path.join(root, 'desktop-sources', 'PhotoBridge-Desktop-Sources-R1089.zip');
const archiveSha256 = '49788a4b7db76696742a9ebdfc054b71029993c76677fcf5da95d94085f2dad0';
const prepareOnly = process.argv.includes('--prepare-only');
const signed = process.argv.includes('--signed');
const rebuildWebsite=false; // Standalone installer: never replay historical Liara migration steps
const run = (program, args, cwd=root) => {
  const result = spawnSync(program, args, {cwd, stdio: 'inherit', shell: false, env: process.env});
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`${program} failed with exit status ${result.status ?? 'unknown'}`);
};
const need = f => { if (!fs.existsSync(f)) throw Error('Missing required repository file: ' + path.relative(root, f)); };
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function extract(source, destination) {
  if (process.platform === 'win32') {
    // PowerShell Expand-Archive is available on Windows 10/11 without 7-Zip.
    const script = 'Expand-Archive -LiteralPath $env:PB_LAB_ARCHIVE -DestinationPath $env:PB_LAB_TEMP -Force -ErrorAction Stop';
    const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
      stdio: 'inherit', shell: false,
      env: {...process.env, PB_LAB_ARCHIVE: source, PB_LAB_TEMP: destination}
    });
    if (r.error) throw r.error;
    if (r.status !== 0) throw Error('Windows source extraction failed');
  } else run('unzip', ['-q', source, '-d', destination]);
}

function restore() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'photobridge-lab-source-'));
  try {
    extract(archive, tmp);
    const source = path.join(tmp, 'apps', 'lab-desktop');
    need(path.join(source, 'package.json'));
    const native = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'));
    if (native.name !== 'photobridge-lab-desktop' || native.build?.appId !== 'ir.photobridge.lab') throw Error('Unexpected lab desktop source identity');
    // Preserve tracked overlay and hot updater; the archive includes outdated copies.
    for (const entry of fs.readdirSync(source, {withFileTypes: true})) {
      if (['desktop-overlay.js', 'ui-update.cjs', 'runtime', 'release', 'node_modules'].includes(entry.name)) continue;
      fs.cpSync(path.join(source, entry.name), path.join(app, entry.name), {recursive: true, force: true});
    }
  } finally {fs.rmSync(tmp, {recursive: true, force: true});}
}

function main() {
  if (Number(process.versions.node.split('.')[0]) < 22) throw Error('Node.js 22 or newer is required');
  need(archive);
  need(path.join(root, 'dist/web/index.html'));
  need(path.join(app, 'desktop-overlay.js'));
  need(path.join(app, 'ui-update.cjs'));
  for (const name of ['enable-r1296-native-alerts.mjs', 'enable-r1342-lab-ui-update.mjs', 'prepare-lab-desktop-ui.mjs', 'prepare-lab-installer-assets.mjs', 'enable-r1348-lab-presence-online-only.mjs']) need(path.join(root, 'scripts', name));
  if (hash(archive) !== archiveSha256) throw Error('Saved lab source archive does not match its verified SHA-256');
  if (signed && !(process.env.CSC_LINK || process.env.WIN_CSC_LINK)) throw Error('Signed release requires the configured Windows code-signing certificate');
  if (!prepareOnly && process.platform !== 'win32') throw Error('An actual Windows installer must be built on Windows x64 (run with --prepare-only to inspect source on another OS)');
  // Only the optional full-site rebuild needs root npm + sharp. Local Windows
  // builds normally consume the VERSIONED CHECKED-IN site files. Replaying
  // the whole Liara history over those assets caused stale-test failures at
  // R1177/R1182/R1187 (and would keep breaking on subsequent old anchors).
  // The native runtime safely refreshes its UI from the signed-by-hash server
  // manifest when the user opens the app, independently of this installer.
  const npm = (args, cwd=root) => process.platform === 'win32'
    ? run('cmd.exe', ['/d', '/s', '/c', 'npm', ...args], cwd)
    : run('npm', args, cwd);
  console.log('[PhotoBridge Lab] Verified precompiled web UI; standalone installer does not rerun Liara migrations.');
  run(process.execPath, ['tools/verify-lab-prebuilt-ui.mjs']);
 run(process.execPath, ['scripts/enable-r1362-lab-folder-runtime.mjs']);
  run(process.execPath, ['--test', 'tools/test-verify-lab-prebuilt-ui.cjs']);
  console.log('[PhotoBridge Lab] Restore editable native sources from verified archive');
  restore();
  run(process.execPath, ['scripts/enable-r1296-native-alerts.mjs']);
  run(process.execPath, ['scripts/enable-r1342-lab-ui-update.mjs']);
  run(process.execPath, ['scripts/enable-r1348-lab-presence-online-only.mjs']);
 run(process.execPath, ['scripts/enable-r1362-lab-native-folder.mjs']);
  run(process.execPath, ['scripts/prepare-lab-desktop-ui.mjs']);
  run(process.execPath, ['scripts/verify-lab-desktop-ui-freshness.mjs']);
  run(process.execPath, ['scripts/prepare-lab-installer-assets.mjs']);
  run(process.execPath, ['--test', 'scripts/test-r1296-native-alerts.cjs', 'scripts/test-r1342-lab-ui-update.cjs', 'scripts/test-r1342-native-integration.cjs', 'scripts/test-r1343-lab-installer-build.cjs', 'scripts/test-r1348-lab-presence-sync.cjs','scripts/test-r1362-lab-folder.cjs']);
  console.log('[PhotoBridge Lab] Local source and UI updater checks passed');
  if (prepareOnly) {console.log('[PhotoBridge Lab] --prepare-only complete; no Windows installer was created.'); return;}
  // Electron and NSIS are installed and built on the user's Windows computer.
  npm(['ci', '--no-audit', '--no-fund'], app);
  npm(['test'], app);
  npm(['run', signed ? 'dist' : 'dist:unsigned'], app);
  const release = path.join(app, 'release');
  const version = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8')).version;
  if (version !== '1.0.19') throw Error('Unexpected Lab installer version: ' + version);
  const expectedName = `PhotoBridge-Lab-Setup-${version}-x64.exe`;
  const installers = fs.existsSync(release) ? fs.readdirSync(release).filter(name => name === expectedName) : [];
  if (installers.length !== 1) throw Error('Expected ' + expectedName + ' was not produced. Check the logs above.');
  const output = path.join(release, installers[0]);
  const size = fs.statSync(output).size;
  if (size < 10_000_000) throw Error('Installer is suspiciously small; refusing to report success');
  const checksum = hash(output);
  const info = {name: installers[0], version: '1.0.18', signed, size, sha256: checksum, createdAt: new Date().toISOString()};
  fs.writeFileSync(path.join(release, 'lab-installer-build.json'), JSON.stringify(info, null, 2) + '\n');
  console.log('\n[PhotoBridge Lab] Local Windows installer candidate created:', output);
  console.log('[PhotoBridge Lab] SHA-256:', checksum);
  if (!signed) console.log('UNSIGNED TEST BUILD — Validate on Windows and sign before publishing to production.');
}
try {main();} catch (e) {console.error('\n[PhotoBridge Lab] Build stopped:', e.stack || e); process.exitCode = 1;}
