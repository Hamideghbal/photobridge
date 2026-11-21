'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { copyPinnedUi } = require('./prepare-assets.cjs');
const { validateNativeUi } = require('./verify-native-ui.cjs');
const { fastWorkerEnabled } = require('./native-renderer-bundle.cjs');

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
    validateNativeUi(stage);
    const entry = fs.readFileSync(path.join(stage, 'assets/index-UIRefine-v655-r84.js'), 'utf8');
    if (!fastWorkerEnabled(entry, '1.0.120') || !entry.includes('/* PB1944 server-paged lab queue */') ||
        !entry.includes('className:"r1944Pager"')) throw Error('Original UI lacks the required notification worker or paged order toolbar');
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
    process.exitCode = 1;
  }
}

module.exports = { select };
