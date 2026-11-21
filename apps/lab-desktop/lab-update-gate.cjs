'use strict';
// R1942: hold background synchronization only while handing an already verified
// installer to the built-in post-exit runner. No write, auth or signature bypass.
function createInstallGate({sync,nativeStorage,getWindow,store,uiTimeoutMs=2000,drainTimeoutMs=7000}){
 if(!sync||!nativeStorage||typeof getWindow!=='function')throw Error('invalid_install_gate_dependencies');
 let ownsPause=false,lastReason=null;
 const report=reason=>{
  if(reason!==lastReason){lastReason=reason;try{store?.set?.('nativeUpdateBlockReason',reason)}catch{}}
  return reason===null;
 };
 const blocked=reason=>{abort();return report(reason);};
 function abort(){
  if(ownsPause){ownsPause=false;sync.resume();}
 }
 function timed(promise,ms){
  let timer;return Promise.race([
   Promise.resolve().then(promise),
   new Promise(resolve=>{timer=setTimeout(()=>resolve(false),ms);})
  ]).finally(()=>clearTimeout(timer));
 }
 async function safeUi(){
  const win=getWindow();
  if(!win||win.isDestroyed?.()||win.webContents?.isDestroyed?.())return false;
  return !!await timed(()=>win.webContents.executeJavaScript("!document.querySelector('dialog[open],form[data-busy=\\\"1\\\"]')").then(Boolean,()=>false),uiTimeoutMs);
 }
 async function check(){
  if(nativeStorage.writers.size>0||nativeStorage.selection)return blocked('native_write_or_selection');
  if(!await safeUi())return blocked('unsaved_form_or_unavailable_renderer');
  const wasPaused=!!sync.paused;
  if(!wasPaused)ownsPause=true;
  const drained=await timed(()=>sync.pause().then(()=>true,()=>false),drainTimeoutMs);
  if(!drained||sync.flight)return blocked('sync_still_active');
  if(nativeStorage.writers.size>0||nativeStorage.selection)return blocked('native_write_after_sync');
  if(!await safeUi())return blocked('form_after_sync');
  return report(null);
 }
 return {check,abort,get blockedReason(){return lastReason}};
}
module.exports={createInstallGate};
