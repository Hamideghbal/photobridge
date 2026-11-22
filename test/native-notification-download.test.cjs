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

test('worker can reuse the ready order detail and report download progress without changing the ordinary path', async () => {
  const { reuseDownloadedDetails } = require('../native-notification-download.cjs');
  const upstream = `async function pb1568ProcessOrder(lab,order,settings){
   const id=order.id;
   const detail=await Me('/api/lab/orders/'+encodeURIComponent(id));
   return await pb1450Download(detail,()=>{},{silent:true});
  }
  async function pb1568AutoTick(){}`;
  const result = reuseDownloadedDetails(upstream);
  assert(result.reused);
  let reads = 0;
  const bytes = [];
  const worker = vm.runInNewContext(result.source + '\npb1568ProcessOrder', {
    Me: async () => { reads++; return { id: orderId }; },
    pb1450Download: async (detail, progress) => { progress(12); return detail; },
  });
  const detail = { id: orderId };
  assert.equal(await worker('lab-1', detail, {}, { detail, progress: n => bytes.push(n) }), detail);
  assert.deepEqual(bytes, [12]);
  assert.equal(reads, 0);
  await worker('lab-1', detail, {});
  assert.equal(reads, 1);
});

test('detail returning 404 on arrival gets exact retry instead of a full-list scan', async () => {
  let receive, attempts = 0, processed = 0;
  const delays = [];
  vm.runInNewContext('(' + connectNotificationDownload.toString() + ')();', {
    window: { pbNativeStorage: {}, pbDesktopEvents: { onOrderArrived: callback => { receive = callback; } } },
    addEventListener() {},
    setTimeout: (fn, delay) => { delays.push(delay); queueMicrotask(fn); },
    pb1568Work: { running: false },
    pb1568ProcessOrder: async () => { processed++; },
    pb1586WakeDownloads: () => assert.fail('did not use the exact retry'),
    Me: async route => {
      if (route === '/api/auth/me') return { lab: { id: 'lab-1' } };
      if (route === '/api/lab/automation') return { settings: { autoDownloadEnabled: true } };
      assert.equal(route, '/api/lab/orders/' + orderId);
      if (++attempts === 1) throw Object.assign(Error('not_found'), { status: 404 });
      return { order: { id: orderId, status: 'sent', file_count: 1 }, files: [{ id: 'file-1' }] };
    },
  });
  await receive({ labId: 'lab-1', orderId, notifiedAt: Date.now() });
  assert.equal(processed, 1);
  assert.deepEqual(delays, [450]);
});

test('a ready notice starts while another order is busy and shares one run for the same order', async()=>{
  const {reuseDownloadedDetails}=require('../native-notification-download.cjs');
  const upstream=`async function pb1568ProcessOrder(lab,order,settings){
    const id=order.id;
    const detail=await Me('/api/lab/orders/'+encodeURIComponent(id));
    return await pb1450Download(detail,()=>{},{silent:true});
  }
  async function pb1568AutoTick(){}`;
  const worker=reuseDownloadedDetails(upstream);
  let receive, finish;
  const running=new Promise(resolve=>{finish=resolve;});
  const starts=[];
  const detail={order:{id:orderId,lab_id:'lab-1',status:'sent',file_count:1},files:[{id:'file-1'}]};
  const context=vm.createContext({
    window:{pbNativeStorage:{},pbDesktopEvents:{onOrderArrived:callback=>{receive=callback;}}},
    addEventListener(){},
    Me:async route=>route==='/api/auth/me'?{lab:{id:'lab-1'}}:route==='/api/lab/automation'?{settings:{autoDownloadEnabled:true}}:detail,
    pb1568Work:{running:true,labId:'lab-1'},
    pb1450Download(value){starts.push(value);return running;},
    setTimeout(){assert.fail('ready notice must not wait for the background scheduler');},
  });
  const runWorker=vm.runInContext(worker.source+'\n('+connectNotificationDownload.toString()+')(true);\npb1568ProcessOrder',context);
  const notification=receive({labId:'lab-1',orderId,notifiedAt:Date.now()});
  await new Promise(setImmediate);
  assert.deepEqual(starts,[detail]);
  const polling=runWorker('lab-1',detail.order,{autoDownloadEnabled:true});
  finish();
  await Promise.all([notification,polling]);
  assert.equal(starts.length,1);
  assert.equal(context.pb1568Work.running,true);
});
