'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const { test } = require('node:test');
const { canBridge, connectNotificationDownload } = require('../native-notification-download.cjs');
const orderId = '11111111-1111-4111-8111-111111111111';

test('notification adapter requires the official worker and keeps the full scheduler path separate', () => {
  assert(!canBridge('/* PB1892: */ const pb1568Work={running:false};'));
  assert(canBridge('/* PB1892: */ async function pb1568ProcessOrder(lab,order,settings){}; pb1568Work.running; function pb1586WakeDownloads(){}'));
  new vm.Script('(' + connectNotificationDownload.toString() + ')();');
});

test('notification fetches the exact order immediately and calls its existing download worker once', async () => {
  const requests = [], transfers = [];
  let receive, sessionChanged;
  const settings = { autoDownloadEnabled: true };
  const detail = { order: { id: orderId, lab_id: 'lab-1', status: 'sent', file_count: 1 }, files: [{ id: 'file-1' }] };
  const context = {
    window: { pbNativeStorage: {}, pbDesktopEvents: { onOrderArrived: value => { receive = value; } } },
    addEventListener: (_event, callback) => { sessionChanged = callback; },
    Me: async route => {
      requests.push(route);
      if (route === '/api/auth/me') return { lab: { id: 'lab-1' } };
      if (route === '/api/lab/automation') return { settings };
      return detail;
    },
    pb1568Work: { running: false },
    pb1568ProcessOrder: async (lab, order, policy) => transfers.push([lab, order.id, policy]),
    pb1586WakeDownloads: () => assert.fail('unexpected polling fallback'),
    setTimeout: () => assert.fail('a ready manifest requires no delay'),
  };
  vm.runInNewContext('(' + connectNotificationDownload.toString() + ')();', context);
  const signal = { labId: 'lab-1', orderId, notifiedAt: Date.now() };
  await Promise.all([receive(signal), receive(signal)]);
  assert.deepEqual(requests, ['/api/auth/me', '/api/lab/automation', '/api/lab/orders/' + orderId]);
  assert.deepEqual(transfers, [['lab-1', orderId, settings]]);
  assert.equal(context.pb1568Work.running, false);

  settings.autoDownloadEnabled = false;
  await receive(signal);
  assert.equal(transfers.length, 1);
  settings.autoDownloadEnabled = true;
  const previous = receive(signal);
  sessionChanged();
  await previous;
  assert.equal(transfers.length, 1);
});
