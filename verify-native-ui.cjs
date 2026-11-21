'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { patchStorageBundle } = require('./storage-bundle.cjs');
const { eligible } = require('./r1963-fast-worker-gate.cjs');
const mainBundle = 'assets/index-UIRefine-v655-r84.js';

function hasNativeFastWorker(root, version) {
  return eligible(fs.readFileSync(path.join(root, mainBundle), 'utf8'), version);
}

function validateNativeUi(root, { requireFastWorker = false, version = require('./package.json').version } = {}) {
  require('./navigation-contract.cjs').validateNavigation(root);
  const source = fs.readFileSync(path.join(root, mainBundle), 'utf8');
  patchStorageBundle(source);
  if (requireFastWorker && !eligible(source, version)) throw Error('native_ui_fast_worker_missing');
}

if (require.main === module) {
  try {
    validateNativeUi(process.argv[2] || path.join(__dirname, 'runtime'), {
      requireFastWorker: process.env.PB_REQUIRE_NATIVE_FAST_WORKER === '1',
    });
    console.log('Native UI verified');
  } catch (error) {
    console.error('STOP: Native UI verification failed:', error.message);
    process.exitCode = 1;
  }
}

module.exports = { validateNativeUi, hasNativeFastWorker };
