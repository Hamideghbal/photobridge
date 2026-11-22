'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { patchNoticeFirstPhoto, directDownloadMarker } = require('../native-notice-first-photo.cjs');

const source = fs.readFileSync(path.join(__dirname,'../verified-ui/assets/index-UIRefine-v655-r84.js'),'utf8');
const patched = patchNoticeFirstPhoto(source);
const functions = patched.slice(patched.indexOf('async function pb1450Download('),patched.indexOf('async function pb1450AllowStage(')) +
  patched.slice(patched.indexOf('function pbNativeNoticeFileName('));
const turn = () => new Promise(resolve=>setImmediate(resolve));
function gate() {
  let release;
  const waiting = new Promise(resolve=>{release=resolve;});
  return { waiting, release };
}

function fixture({ rootReady, secondReady, verificationReady, existing = {}, checkpoint = {},
  silent = true, finalComplete = true, files = ['one','two'] } = {}) {
  const trace = [], progress = [], saved = new Map(Object.entries(existing));
  const root = {__pbNative:true};
  const target = {dir:{rootId:'lab-root',parts:['order'],async getFileHandle(name) {
    trace.push('stat '+name);
    if (!saved.has(name)) throw Object.assign(Error('missing'),{code:'ENOENT'});
    return {size:saved.get(name)};
  }}};
  let firstSignal, state = checkpoint;
  const order = {id:'order',file_count:files.length};
  const context = vm.createContext({
    AbortController, window:{pbNativeStorage:{}}, pb1450Flights:new Set(), Ya:name=>name,
    yc:()=>state, hr:(_,value)=>{state=value;}, Uy:()=> 'prints',
    pb1450Root:async()=>{trace.push('root');await rootReady;return root;},
    pb1450Target:async(_,__,file)=>{trace.push('target '+file.id);if(file.id==='two')await secondReady;return target;},
    pb1450Missing:error=>error.code==='ENOENT', pb1450FileInfo:async handle=>handle,
    Ky:async (id,signal)=>{if(id==='one')firstSignal=signal;trace.push('request '+id);return {pbDownloadBytes:5};},
    pb1445WriteDownload:async (_,name,__,onChunk)=>{
      trace.push('write '+name);saved.set(name,5);onChunk(5);
    },
    pb1450Verify:async ()=>{
      trace.push('full verification');
      await verificationReady;
      return {complete:finalComplete,collisions:[],completedIds:[],valid:saved.size,expected:files.length};
    },
    pb1450Save:(_,report)=>trace.push(report.complete?'verified':'incomplete'),
    pb1450Code:error=>error.message,
    detail:{order,files:files.map(id=>({id,original_name:id+'.jpg',bytes:5}))},
    progress:value=>progress.push(value.phase),
    options:{silent},
  });
  const flight = vm.runInContext(functions+'\npb1450Download(detail,progress,options);',context);
  return { trace, progress, flight, firstSignal:()=>firstSignal };
}

test('notification requests the photo during root validation and writes it before any later file check or whole-order scan', async () => {
  const root = gate(), second = gate(), verification = gate();
  const job = fixture({rootReady:root.waiting,secondReady:second.waiting,verificationReady:verification.waiting});
  try {
    await turn();
    assert.deepEqual(job.trace,['request one','root']);
    root.release();
    await turn();
    assert(job.trace.includes('write one.jpg'));
    assert(job.trace.includes('target two'));
    assert(!job.trace.includes('full verification'));
    assert(job.progress.includes('downloading'));
    assert(!job.progress.includes('complete'));
    second.release();
    await turn();
    assert(job.trace.includes('write two.jpg'));
    assert.equal(job.trace.at(-1),'full verification');
    assert(!job.progress.includes('complete'));
  } finally {root.release();second.release();verification.release();}
  await job.flight;
  assert.equal(job.trace.at(-1),'verified');
  assert.equal(job.progress.at(-1),'complete');
});

test('a valid existing file is kept, and a failed final verification cannot complete the order', async () => {
  const job = fixture({existing:{'one.jpg':5},finalComplete:false});
  await assert.rejects(job.flight,/local_download_incomplete/);
  assert(!job.trace.includes('write one.jpg'));
  assert(job.firstSignal().aborted);
  assert(job.trace.includes('write two.jpg'));
  assert(!job.progress.includes('complete'));
});

test('manual downloads and historical paths still verify before sending a photo request', async () => {
  for (const options of [{silent:false},{checkpoint:{startedAt:'earlier',pathLayout:'legacy'}}]) {
    const job = fixture(options);
    await job.flight;
    assert.equal(job.trace[0],'root');
    assert(job.trace.indexOf('full verification') < job.trace.indexOf('request one'));
  }
});

test('the checked-in Lab bundle receives a syntactically valid direct download path', () => {
  assert(patched.includes(directDownloadMarker));
  new vm.Script(patched);
});
