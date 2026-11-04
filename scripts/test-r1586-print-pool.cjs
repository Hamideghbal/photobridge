'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {performance}=require('node:perf_hooks');
const {PB1586runUploadPool}=require('./r1586-upload-pool.cjs');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

// Exercise the SAME function that is embedded by the production-build patch.
test('bounded concurrency; every upload fully completed before submit',async()=>{
  const jobs=Array.from({length:13},(_,i)=>({id:i,bytes:1000+i}));
  let active=0,maxActive=0;
  const recorded=new Set();
  await PB1586runUploadPool(jobs,3,async job=>{
    active++; maxActive=Math.max(maxActive,active);
    await delay(3); // presign
    await delay(9); // PUT
    await delay(3); // complete including JPEG conversion
    assert(!recorded.has(job.id));
    recorded.add(job.id);
    active--;
  });
  assert.equal(recorded.size,jobs.length);
  assert.equal(maxActive,3);
});

test('failure stops new jobs and waits for in-flight completions',async()=>{
  const jobs=Array.from({length:15},(_,id)=>id);
  let active=0,completed=0,started=0;
  const error=new Error('upload_http_503');
  await assert.rejects(PB1586runUploadPool(jobs,3,async id=>{
    active++;started++;
    try {await delay(id===1?5:25); if(id===1)throw error;completed++;}
    finally{active--;}
  }),e=>e===error);
  assert.equal(active,0,'must wait before deleting draft');
  assert(started<=3,'do not start more after an early failure');
  assert.equal(completed,started-1);
});

test('user cancellation has no background uploads after rejection',async()=>{
  const controller=new AbortController();
  let active=0;
  const jobs=Array.from({length:10},(_,id)=>id);
  const p=PB1586runUploadPool(jobs,3,async()=>{
    active++;
    try {await delay(12);if(controller.signal.aborted)throw Object.assign(new Error('upload_aborted'),{name:'AbortError'});}
    finally{active--;}
  });
  controller.abort();
  await assert.rejects(p,{name:'AbortError'});
  assert.equal(active,0);
});

async function simulate(count,concurrency){
  const jobs=Array.from({length:count},(_,i)=>i);
  const started=performance.now();
  await PB1586runUploadPool(jobs,concurrency,async()=>{
    await delay(18); // presign roundtrip
    await delay(55); // upload network roundtrip in independent-file simulation
    await delay(22); // complete + verification
  });
  return Math.round(performance.now()-started);
}

test('repeatable SYNTHETIC benchmark, not a real Liara speed test',async()=>{
  const count=12,serial=[],parallel=[];
  for(let i=0;i<3;i++){
    serial.push(await simulate(count,1));
    parallel.push(await simulate(count,3));
  }
  const median=a=>[...a].sort((x,y)=>x-y)[1];
  console.log(JSON.stringify({kind:'synthetic_only',count,stagesMs:[18,55,22],serialMs:serial,parallelMs:parallel,speedup:Math.round(100*median(serial)/median(parallel))/100}));
  assert(median(parallel)<median(serial)*.6,'expected independent-file latency improvement');
});

if(process.env.PB1586_VERIFY_BUNDLE==='1')test('built bundle contains bounded upload pool and preserves the original order guards',()=>{
  const bundle=fs.readFileSync(path.resolve(__dirname,'../dist/web/assets/index-UIRefine-v655-r84.js'),'utf8');
  assert(bundle.includes('PB1586runUploadPool='));
  assert(bundle.includes('PB1586runUploadPool(PB1586jobs,3,PB1586uploadOne)'));
  assert(bundle.includes('await Me("/api/customer/uploads/complete"'));
  assert(bundle.includes('await rs(Gt.uploadUrl,tt.file'));
  assert(bundle.includes('const Be=await Me('));
  assert(!bundle.includes('let ge=0;for(const bt of E.current){const Nt=Zv(bt.label)'));
});
