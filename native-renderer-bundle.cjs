'use strict';

const fs = require('node:fs');
const { sourceMarker } = require('./ui-diagnostics.cjs');
const { patchStorageBundle } = require('./storage-bundle.cjs');
let last;

function fastWorkerEnabled(source, version) {
  // Keep the original 104 behavior. Enable it for the 120-family build
  // only when the verified UI actually contains the notification worker.
  const match = /^1\.0\.(\d+)$/.exec(version);
  return version === '1.0.104' || Boolean(match && Number(match[1]) >= 120 &&
    source.includes('pb1908FastArrival') && source.includes('onOrderArrived'));
}

function compile(file, version) {
  const stat = fs.statSync(file);
  const key = [file, version, stat.size, stat.mtimeMs, stat.ctimeMs, stat.ino].join('|');
  if (last?.key === key) return last.body;
  const source = fs.readFileSync(file, 'utf8');
  const body = 'window.__PB_LAB104_NATIVE__=' + JSON.stringify(fastWorkerEnabled(source, version)) + ';\n' +
    'window.__PB_NATIVE_SOURCE_PROOF__=' + JSON.stringify(sourceMarker(source, version)) + ';\n' +
    patchStorageBundle(source);
  last = { key, body };
  return body;
}

module.exports = { compile, fastWorkerEnabled };
