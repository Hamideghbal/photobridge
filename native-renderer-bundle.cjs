'use strict';

const fs = require('node:fs');
const { sourceMarker } = require('./ui-diagnostics.cjs');
const { canBridge, connectNotificationDownload } = require('./native-notification-download.cjs');
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
  const modern = fastWorkerEnabled(source, version);
  const bridge = !modern && /^1\.0\.\d+$/.test(version) && Number(version.split('.')[2]) >= 120 && canBridge(source);
  const body = 'window.__PB_LAB104_NATIVE__=' + JSON.stringify(modern) + ';\n' +
    'window.__PB_NATIVE_SOURCE_PROOF__=' + JSON.stringify(sourceMarker(source, version)) + ';\n' +
    patchStorageBundle(source) + (bridge ? '\n;(' + connectNotificationDownload.toString() + ')();\n' : '');
  last = { key, body };
  return body;
}

module.exports = { compile, fastWorkerEnabled };
