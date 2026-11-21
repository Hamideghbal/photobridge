'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {makePowerShell,launchVerifiedAfterExit}=require('../apps/lab-desktop/post-exit-install.cjs');
const {installAppUpdates}=require('../apps/lab-desktop/app-update-main.cjs');
const hash='a'.repeat(64),manifest={version:'1.0.110',sha256:hash,size:1000001};
const file='C:\\Users\\Lab\\AppData\\Roaming\\PhotoBridge Lab\\program-updates\\signed.exe';
const args=['--updated','/S','--force-run'];
test('R1933 post-exit runner must wait for actual process exit and verify hash before launching NSIS',()=>{
 const script=makePowerShell({file,manifest,parentPid:1234,args});
 assert.match(script,/Get-Process -Id \$oldPid/);
 assert(script.indexOf('ComputeHash($stream)')<script.indexOf('Start-Process -FilePath $target'));
 assert(!script.includes(file),'Installer path must not interpolate as PowerShell source');
 assert(!script.includes('Stop-Process'),'Never kill PhotoBridge to install an update');
});
test('R1933 cannot invoke arbitrary command, malformed signature metadata or relative installer',()=>{
 for(const payload of [{file:'signed.exe'},{file:file+'\ncalc'},{manifest:{...manifest,sha256:'wrong'}},{parentPid:0},{args:['/S','--disable-verify']}])
  assert.throws(()=>makePowerShell({file,manifest,parentPid:12,args,...payload}),/invalid_verified_update_handoff/);
});
test('R1933 helper launch fails safely instead of quitting if Powershell is unavailable',async()=>{
 const child=new EventEmitter();
 await assert.rejects(launchVerifiedAfterExit({file,args,manifest,parentPid:23,platform:'win32',spawnImpl:()=>{setImmediate(()=>child.emit('error',Error('not available')));return child}}),/not available/);
});
function setup(){
 let dialogs=0,installs=0,busy=false,visible=true,minimized=false,quitCount=0;
 const app=new EventEmitter();app.isPackaged=true;app.getVersion=()=> '1.0.109';app.getPath=()=>'/tmp/photobridge-test';app.quit=()=>{quitCount++};
 const store={values:new Map([['auth',true],['labId','test']]),get(k){return this.values.get(k)},set(k,v){this.values.set(k,v)}};
 class MockUpdater{
  constructor(options){this.options=options;this.ready=manifest;this.installing=false;}
  async check(){await this.options.confirmDownload(manifest);return{state:'ready',version:manifest.version};}
  async install(){if(!await this.options.canInstall())throw Error('finish_current_work');installs++;}
 }
 const win={isVisible:()=>visible,isMinimized:()=>minimized,isDestroyed:()=>false};
 const updater=installAppUpdates({app,store,request:async()=>{},getWindow:()=>win,show:async()=>{},canInstall:async()=>!busy,
  beforeQuit:async()=>{},platform:'win32',Updater:MockUpdater,dialog:{showMessageBox:async()=>{dialogs++;return{response:0}}}});
 return {app,store,updater,dialogs:()=>dialogs,installs:()=>installs,quitCount:()=>quitCount,busy:v=>{busy=v},visible:v=>{visible=v},minimized:v=>{minimized=v}};
}
test('R1933 background update downloads without interrupting active order or visible workspace',async()=>{
 const h=setup();await h.updater.check();assert.equal(h.dialogs(),0);
 await h.updater.installWhenIdle();assert.equal(h.installs(),0);
 h.minimized(true);h.busy(true);await h.updater.installWhenIdle();assert.equal(h.installs(),0);
 h.busy(false);await h.updater.installWhenIdle();assert.equal(h.installs(),1);
});
test('R1933 on normal exit attempts safe handoff, but cannot override original active-write guards',async()=>{
 const h=setup();h.busy(true);let prevented=false;
 h.app.emit('before-quit',{preventDefault(){prevented=true}});
 await new Promise(r=>setTimeout(r,10));
 assert(prevented);assert.equal(h.installs(),0);assert.equal(h.quitCount(),1);
});
test('R1933 integration copies trusted handoff to native build without shipping private key',()=>{
 const fs=require('node:fs'),s=fs.readFileSync('scripts/integrate-r1471-app-updates.cjs','utf8');
 assert(s.includes("'post-exit-install.cjs'"));
 assert(!s.includes('update-private.pem'));
});
