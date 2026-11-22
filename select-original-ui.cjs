'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { copyPinnedUi } = require('./prepare-assets.cjs');
const { validateNativeUi } = require('./verify-native-ui.cjs');
const { fastWorkerEnabled } = require('./native-renderer-bundle.cjs');
const { canBridge } = require('./native-notification-download.cjs');

function select(source, destination) {
  const manifestName = fs.existsSync(path.join(source, '.pb-lab-bundle-manifest.json'))
    ? '.pb-lab-bundle-manifest.json' : 'manifest.json';
  const manifest = JSON.parse(fs.readFileSync(path.join(source, manifestName), 'utf8'));
  const origin = 'https://photobridge.ir';
  const stage = fs.mkdtempSync(destination + '-');
  try {
    const pin = { origin, build: manifest.build };
    const pinFile = path.join(stage, 'pin.json');
    fs.writeFileSync(pinFile, JSON.stringify(pin));
    copyPinnedUi({ source, pinFile, staging: stage, origin, manifestName });
    // A valid original 1.0.120 installer can contain a pre-paging UI.
    // Distinguish "valid but incompatible" (exit 2 -> fetch verified official
    // UI) from corrupt/untrusted assets (exit 1). Do not weaken the final gate.
    const entry = fs.readFileSync(path.join(stage, 'assets/index-UIRefine-v655-r84.js'), 'utf8');
    const hasWorker = fastWorkerEnabled(entry, '1.0.120') || canBridge(entry);
    const hasPages = entry.includes('/* PB1944 server-paged lab queue */') && entry.includes('className:"r1944Pager"');
    if (!hasWorker || !hasPages) {
      const error = Error('Verified UI capabilities: immediate notification worker=' + hasWorker + ', order pagination=' + hasPages);
      error.code = 'incompatible_verified_ui';
      throw error;
    }
    // Only compatible manifest-verified UI may pass the strict native gate.
    validateNativeUi(stage);
    fs.rmSync(destination, { recursive: true, force: true });
    fs.renameSync(stage, destination);
    return manifest.build;
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    const source = process.env.PB_120_UI_DIR || path.join(__dirname, 'original-120-ui');
    const build = select(source, path.join(__dirname, 'original-ui-input'));
    console.log('Verified original UI manifest:', build);
  } catch (error) {
    console.error('STOP: Could not prepare the original 1.0.120 UI:', error.message);
    process.exitCode = error.code === 'incompatible_verified_ui' ? 2 : 1;
  }
}

module.exports = { select };
