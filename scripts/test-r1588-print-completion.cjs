'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PB1588makeCompletionQueue}=require('./r1588-completion-queue.cjs');
const {PB1587runUploadPool}=require('./r1587-upload-pool.cjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const jpg={type:'image/jpeg',name:'DSC0111.JPG'};
const png={type:'image/png',name:'DSC0111.png'};
const temporary=status=>Object.assign(new Error('request_failed'),{status});

test('three concurrent storage PUTs but only one server confirmation',async()=>{
  const jobs=Array.from({length:9},(_,id)=>id);
  let puts=0,maxPuts=0,confirms=0,maxConfirms=0;
  let completions=0;
  const verify=PB1588makeCompletionQueue({
    assertActive:()=>{},sleep:async()=>{},
    complete:async()=>{
      confirms++;maxConfirms=Math.max(maxConfirms,confirms);
      await wait(18);
      confirms--;completions++;
    }
  });
  await PB1587runUploadPool(jobs,3,async id=>{
    puts++;maxPuts=Math.max(maxPuts,puts);
    await wait(9);puts--;
    await verify(id,jpg);
  });
  assert.equal(maxPuts,3);
  assert.equal(maxConfirms,1);
  assert.equal(completions,9);
});

test('502 after a completed JPEG PUT retries SAME fileId without reupload',async()=>{
  const attempts=[],sleeps=[];
  const verify=PB1588makeCompletionQueue({
    assertActive:()=>{},sleep:async ms=>sleeps.push(ms),
    complete:async id=>{
      attempts.push(id);
      if(attempts.length<3)throw temporary(502);
      return {ok:true};
    }
  });
  assert.deepEqual(await verify('file-A',jpg),{ok:true});
  assert.deepEqual(attempts,['file-A','file-A','file-A']);
  assert.deepEqual(sleeps,[700,1400]);
});

test('non-JPEG conversion never blindly retried on 502',async()=>{
  let calls=0;
  const verify=PB1588makeCompletionQueue({assertActive:()=>{},sleep:async()=>{},complete:async()=>{calls++;throw temporary(502)}});
  await assert.rejects(verify('file-PNG',png),{status:502});
  assert.equal(calls,1);
});

test('permanent status 400 is not retried even for JPEG',async()=>{
  let calls=0;
  const verify=PB1588makeCompletionQueue({assertActive:()=>{},sleep:async()=>{},complete:async()=>{calls++;throw temporary(400)}});
  await assert.rejects(verify('file-400',jpg),{status:400});
  assert.equal(calls,1);
});

test('rejected confirmation does not block already-uploaded files, but propagates original error',async()=>{
  const first=new Error('gateway_failed'),order=[];
  const verify=PB1588makeCompletionQueue({
    assertActive:()=>{},sleep:async()=>{},
    complete:async id=>{order.push(id);await wait(4);if(id==='bad')throw first;return id;}
  });
  const p1=verify('bad',png),p2=verify('good',jpg);
  await assert.rejects(p1,e=>e===first);
  assert.equal(await p2,'good');
  assert.deepEqual(order,['bad','good']);
});

test('cancellation during retry delay prevents another completion request',async()=>{
  let active=true,calls=0;
  const verify=PB1588makeCompletionQueue({
    assertActive:()=>{if(!active)throw Object.assign(new Error('upload_aborted'),{name:'AbortError'})},
    sleep:async()=>{active=false},
    complete:async()=>{calls++;throw temporary(503)}
  });
  await assert.rejects(verify('file-1',jpg),{name:'AbortError'});
  assert.equal(calls,1);
});

if(process.env.PB1588_VERIFY_BUNDLE==='1')test('actual built print bundle has queue and preserves 3 PUT workers and lab crop',()=>{
  const s=fs.readFileSync(path.resolve(__dirname,'../dist/web/assets/index-UIRefine-v655-r84.js'),'utf8');
  assert(s.includes('const PB1588verifyUpload='));
  assert(s.includes('await PB1588verifyUpload(Gt.fileId,tt.file);'));
  assert(s.includes('PB1587runUploadPool(PB1587jobs,E.current.some(bt=>bt.sizeId==="__custom__")?1:3,PB1587uploadOne)'));
  assert(s.includes('printCopies:pbPrintCopies(tt)'));
  assert(s.includes('cropHandling:"lab"'));
  assert(s.includes('await rs(Gt.uploadUrl,tt.file'));
  assert(s.includes('const Be=await Me('));
});
