'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildBundledUi } = require('./prepare-assets.cjs');
const { select } = require('./select-original-ui.cjs');

async function fetchCompatibleUi(directory) {
  // This acquisition is build-only. Preserve the existing signing configuration.
  const release = path.join(__dirname, 'release-config.json');
  const previous = fs.existsSync(release) ? fs.readFileSync(release) : null;
  try {
    await buildBundledUi({ origin: 'https://photobridge.ir', directory, refresh: true, offline: false });
    return select(directory, path.join(__dirname, 'original-ui-input'));
  } finally {
    if (previous) fs.writeFileSync(release, previous);
    else fs.rmSync(release, { force: true });
  }
}

if (require.main === module) fetchCompatibleUi(process.argv[2]).then(
  build => console.log('Verified compatible official UI:', build),
  error => { console.error('STOP: Official UI could not be used:', error.message); process.exitCode = 1; },
);
