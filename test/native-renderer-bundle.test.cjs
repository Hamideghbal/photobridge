'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { compile, fastWorkerEnabled } = require('../native-renderer-bundle.cjs');

test('1.0.120 consumes the verified UI notification worker when it is present', () => {
  const source = 'function pb1908FastArrival(){}; window.pbDesktopEvents.onOrderArrived(pb1908FastArrival);';
  assert(fastWorkerEnabled(source, '1.0.120'));
  assert(!fastWorkerEnabled(source, '1.0.119'));
  assert(!fastWorkerEnabled('function pb1908FastArrival(){}', '1.0.120'));
  assert(!fastWorkerEnabled('window.pbDesktopEvents.onOrderArrived(()=>{});', '1.0.120'));
});

test('cached renderer transform follows the selected UI and most recent file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-bundle-'));
  try {
    const root = path.join(__dirname, '../verified-ui/assets/index-UIRefine-v655-r84.js');
    const file = path.join(dir, 'index.js');
    fs.copyFileSync(root, file);
    const first = compile(file, '1.0.120');
    assert(first.startsWith('window.__PB_LAB104_NATIVE__=false;'));
    assert.equal(compile(file, '1.0.120'), first);
    new vm.Script(first);
    fs.appendFileSync(file, '\nfunction pb1908FastArrival(){}; window.pbDesktopEvents.onOrderArrived(pb1908FastArrival);');
    const second = compile(file, '1.0.120');
    assert(second.startsWith('window.__PB_LAB104_NATIVE__=true;'));
    assert.notEqual(second, first);
    new vm.Script(second);
    assert(compile(file, '1.0.119').startsWith('window.__PB_LAB104_NATIVE__=false;'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('priority wake skips the read-only background poll without affecting later refresh', async () => {
  const { Sync } = require('../sync.cjs');
  const calls = [];
  const sync = new Sync({
    store: { get: key => key === 'auth' ? true : 'lab-a', cached: () => null, cache() {} },
    request: async url => {
      calls.push(url);
      return Response.json(url.endsWith('/orders') ? { orders: [] } : { invoices: [] });
    },
  });
  sync.nativeDownloadPriorityUntil = Date.now() + 10000;
  await sync.live();
  assert.deepEqual(calls, []);
  sync.nativeDownloadPriorityUntil = 0;
  await sync.live();
  assert.deepEqual(calls, ['/api/lab/orders', '/api/lab/invoices']);
});
