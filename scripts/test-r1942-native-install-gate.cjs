'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createInstallGate}=require('../apps/lab-desktop/lab-update-gate.cjs');
const fs=require('node:fs');
const path=require('node:path');
function fixture({writers=0,selection=false,form=false,hang=false,previouslyPaused=false,brokenRenderer=false}={}){
 const changes=[];
 const sync={
  paused:previouslyPaused,flight:hang?{}:null,
  pause(){this.paused=true;return hang?new Promise(()=>{}):Promise.resolve().then(()=>{this.flight=null;})},
  resume(){this.paused=false;changes.push('resumed')}
 };
 const nativeStorage={writers:{size:writers},selection:selection?{}:null};
 const getWindow=()=>({webContents:{executeJavaScript:()=>brokenRenderer?Promise.reject(Error('renderer failed')):Promise.resolve(!form)}});
 const gate=createInstallGate({sync,nativeStorage,getWindow,store:{set:(key,value)=>changes.push([key,value])},drainTimeoutMs:15,uiTimeoutMs:15});
 return{gate,sync,nativeStorage,changes};
}
test('R1942: idle update really pauses background sync before approving installer',async()=>{
 const f=fixture();assert.equal(await f.gate.check(),true);assert.equal(f.sync.paused,true);f.gate.abort();assert.equal(f.sync.paused,false);
});
test('R1942: active native writer or directory selection blocks before pause',async()=>{
 for(const input of [{writers:1},{selection:true}]){const f=fixture(input);assert.equal(await f.gate.check(),false);assert.equal(f.sync.paused,false);assert.equal(f.gate.blockedReason,'native_write_or_selection');}
});
test('R1942: open form and unavailable renderer cannot force installation',async()=>{
 for(const input of [{form:true},{brokenRenderer:true}]){const f=fixture(input);assert.equal(await f.gate.check(),false);assert.equal(f.sync.paused,false);}
});
test('R1942: hung background sync times out; updater must defer and restore live sync',async()=>{
 const f=fixture({hang:true});assert.equal(await f.gate.check(),false);assert.equal(f.gate.blockedReason,'sync_still_active');assert.equal(f.sync.paused,false);assert(f.changes.includes('resumed'));
});
test('R1942: interrupted install resumes only a pause acquired by this gate',async()=>{
 const f=fixture();assert.equal(await f.gate.check(),true);f.gate.abort();f.gate.abort();assert.equal(f.changes.filter(x=>x==='resumed').length,1);
 const g=fixture({previouslyPaused:true});assert.equal(await g.gate.check(),true);g.gate.abort();assert.equal(g.sync.paused,true);
});
test('R1942: native integration copies the gate and never ships the signing key',()=>{
 const src=fs.readFileSync(path.join(__dirname,'integrate-r1471-app-updates.cjs'),'utf8');
 assert(src.includes("'lab-update-gate.cjs'"));
 assert(src.includes("canInstall:()=>updateInstallGate.check()"));
 assert(src.includes("onInstallAborted:()=>updateInstallGate.abort()"));
 assert(!src.includes('update-private.pem'));
});
test('R1942: installer failure restores sync while successful handoff keeps it paused until process exit',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../apps/lab-desktop/app-update.cjs'),'utf8');
 assert(app.includes('await this.onInstallAborted?.(error)'));
 const main=fs.readFileSync(path.join(__dirname,'../apps/lab-desktop/app-update-main.cjs'),'utf8');
 assert(main.includes('onInstallAborted();app.quit();'));
 assert(main.includes('launchVerifiedAfterExit('));
});
