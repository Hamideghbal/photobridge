'use strict';
// Read-only synchronization is not unfinished user work. Keep the guard on
// durable mutations and visible forms, and drain writes while new sync is held.
function rendererBlockReason(){
 const visible=element=>{
  if(element.hidden||!element.getClientRects().length)return false;
  const style=getComputedStyle(element);
  const box=element.getBoundingClientRect();
  return style.display!=='none'&&style.visibility!=='hidden'&&style.visibility!=='collapse'&&Number(style.opacity)!==0&&box.width>0&&box.height>0&&box.right>0&&box.bottom>0&&box.left<innerWidth&&box.top<innerHeight;
 };
 for(const element of document.querySelectorAll('dialog[open],[role="dialog"],form[data-busy="1"]')){
  if(visible(element))return element.matches('form[data-busy="1"]')?'saving_form':'open_form';
 }
 return null;
}
function beginHostWrite(sync,method,pathname){
 if(['GET','HEAD','OPTIONS'].includes(method)||!/^\/(?:api|desktop)\//.test(pathname)||pathname==='/api/lab/print-alert/presence')return()=>{};
 if(sync.updateHolds)throw Object.assign(Error('update_in_progress'),{status:503});
 sync.foregroundWrites=(sync.foregroundWrites||0)+1;let released=false;
 return()=>{if(!released){released=true;sync.foregroundWrites=Math.max(0,sync.foregroundWrites-1);}};
}
function createUpdateInstallGate({nativeStorage,sync,getWindow,now=Date.now,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}){
 let lastReason=null;
 async function reason(){
  if(nativeStorage.writers.size)return 'file_write';
  if(nativeStorage.selection)return 'folder_selection';
  if(sync.mutating)return 'sync_write';
  if(sync.foregroundWrites)return 'foreground_write';
  const win=getWindow();if(!win||win.isDestroyed?.())return 'ui_unavailable';
  try{const value=await win.webContents.executeJavaScript('('+rendererBlockReason.toString()+')()');return value===null?null:['open_form','saving_form'].includes(value)?value:'ui_unavailable';}
  catch{return 'ui_unavailable';}
 }
 async function canInstall({waitMs=8000}={}){
  const deadline=now()+waitMs;
  for(;;){
   lastReason=await reason();if(!lastReason)return true;
   if(!['sync_write','foreground_write','file_write','saving_form'].includes(lastReason)||now()>=deadline)return false;
   await sleep(Math.min(100,Math.max(1,deadline-now())));
  }
 }
 return {canInstall,reason:()=>lastReason,hold:()=>sync.holdForUpdate()};
}
module.exports={createUpdateInstallGate,rendererBlockReason,beginHostWrite};
