'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { patchNoticeFirstPhoto } = require('../native-notice-first-photo.cjs');

test('fresh automatic download requests the first photo before local matching completes', async () => {
  const trace = [];
  let releaseMatch;
  const matching = new Promise(resolve => { releaseMatch = resolve; });
  let scanStarted;
  const scanning = new Promise(resolve => { scanStarted = resolve; });
  const fixture = `
  async function Ky(fileId){
    return fetch('/api/lab/order-files/'+fileId+'/content?download=1',{credentials:'include',cache:'no-store',headers});
  }
  async function pb1450Verify(detail, root, receipts = {}, progress) {
    const groups = new Map([['order',{}]]);
    if (!receipts.saved) { trace.push('matching'); scanStarted(); await matching; }
    for (const {target,names} of groups.values()) trace.push('list extras');
    return {completedIds:[],collisions:[]};
  }
  async function pb1450Download(detail, progress = () => {}, options = {}) {
    const id = detail.order.id, old = {};
    let receipts = {}, report, root;
    try {
      root = {__pbNative:true};
      report = await pb1450Verify(detail,root,receipts,progress);
      const files = detail.files, already = new Set(report.completedIds), force = false;
      for (const file of files) {
        if (!force && already.has(String(file.id))) continue;
        const response = await Ky(file.id);
        trace.push('write ' + response);
        receipts.saved = true;
      }
      report = await pb1450Verify(detail,root,receipts,progress);
    } catch (error) { throw error; }
    finally { pb1450Flights.delete(id); }
  }
  async function pb1450AllowStage(){}
  pb1450Download({order:{id:'order',file_count:1},files:[{id:'one'}]},()=>{},{silent:true});
  `;
  let signal;
  const flight = vm.runInNewContext(patchNoticeFirstPhoto(fixture), {
    trace, scanStarted, matching, AbortController, pb1450Flights: new Set(), headers: {},
    fetch(url, options) {
      assert.equal(url, '/api/lab/order-files/one/content?download=1');
      signal = options.signal;
      trace.push('request');
      return Promise.resolve('photo');
    },
  });
  await Promise.race([scanning, flight]);
  assert.deepEqual(trace, ['request','matching']);
  releaseMatch();
  await flight;
  assert.deepEqual(trace, ['request','matching','write photo','list extras']);
  assert.equal(signal.aborted, true);
});

test('the checked-in Lab bundle receives a syntactically valid fast download path', () => {
  const source = fs.readFileSync(path.join(__dirname,'../verified-ui/assets/index-UIRefine-v655-r84.js'),'utf8');
  const patched = patchNoticeFirstPhoto(source);
  assert.notEqual(patched, source);
  new vm.Script(patched);
});
