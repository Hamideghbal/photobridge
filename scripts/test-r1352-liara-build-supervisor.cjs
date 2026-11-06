'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {runBuild}=require('./liara-build-supervisor.cjs');

async function fixture(source,{intervalMs=12000}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pb-liara-supervisor-'));
 const file=path.join(dir,'runner.cjs');
 fs.writeFileSync(file,source);
 const logs=[],errs=[];
 try {
  const code=await runBuild({command:process.execPath,args:[file],cwd:dir,progress:x=>logs.push(x),error:x=>errs.push(x),intervalMs});
  return {code,logs,errs};
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
}

test('large TAP output suppressed on successful build, milestones kept',async()=>{
 const r=await fixture(`console.log('[PhotoBridge Docker build] START stage-one');for(let i=0;i<1500;i++) console.log('ok '+i+' - test');console.log('[PhotoBridge Docker build] OK stage-one (10ms)')`);
 assert.equal(r.code,0);
 assert(r.logs.some(x=>x.includes('START stage-one')));
 assert(r.logs.some(x=>x.includes('OK stage-one')));
 assert(r.logs.some(x=>x.includes('SUCCESS')));
 assert(r.logs.length<12);
 assert.deepEqual(r.errs,[]);
});
test('test failure still aborts build and outputs precise failing TAP details',async()=>{
 const r=await fixture(`console.log('[PhotoBridge Docker build] START suspect-stage');console.log('not ok 4 - version guard');console.log('error: ERR_ASSERTION version');process.exit(1)`);
 assert.equal(r.code,1);
 assert(r.errs.some(x=>x.includes('not ok 4 - version guard')));
 assert(r.errs.some(x=>x.includes('suspect-stage')));
});
test('periodic progress heartbeat prevents complete log silence on slow stages',async()=>{
 const r=await fixture(`console.log('[PhotoBridge Docker build] START slow-step');setTimeout(()=>{console.log('[PhotoBridge Docker build] OK slow-step')},110)`,{intervalMs:20});
 assert.equal(r.code,0);
 assert(r.logs.some(x=>x.includes('running ')));
});
test('Docker build invokes the monitored runner instead of flooding logs',()=>{
 const docker=fs.readFileSync('Dockerfile','utf8');
 assert(docker.includes('node scripts/liara-build-supervisor.cjs'));
 assert(!docker.includes('&& node scripts/liara-fast-build.mjs \\'));
});

test('hundreds of successful patches do not flood Liara log transport',async()=>{
 const r=await fixture(`for(let i=0;i<900;i++){console.log('[PhotoBridge Docker build] START patch-'+i);console.log('[PhotoBridge Docker build] OK patch-'+i+' (1ms)')}`);
 assert.equal(r.code,0);
 assert(r.logs.length<15,'unexpected verbose build logs: '+r.logs.length);
 assert(r.logs.some(x=>x.includes('completed 900/900 steps')));
 assert.deepEqual(r.errs,[]);
});
