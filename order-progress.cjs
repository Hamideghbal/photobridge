'use strict';
const phases=new Set(['checking','downloading','verified','failed']);
function normalizeProgress(value){
 if(!value||!/^[-A-Za-z0-9]{1,140}$/.test(String(value.orderId||''))||!phases.has(value.phase))throw Error('invalid_download_progress');
 const number=n=>Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Number.isFinite(Number(n))?Number(n):0));
 const totalBytes=number(value.totalBytes),loadedBytes=Math.min(totalBytes||Number.MAX_SAFE_INTEGER,number(value.loadedBytes));
 const total=Math.floor(number(value.total)),done=Math.min(total||Number.MAX_SAFE_INTEGER,Math.floor(number(value.done)));
 const measured=totalBytes?loadedBytes/totalBytes*100:total?done/total*100:number(value.percent);
 return {orderId:String(value.orderId),number:String(value.number||'').slice(0,48),phase:value.phase,done,total,loadedBytes,totalBytes,percent:value.phase==='verified'?100:Math.max(0,Math.min(99,Math.floor(measured)))};
}
function installOrderProgress({ipcMain,getWindow,getAccount,getOrigin,update}){
 ipcMain.handle('lab-order-progress',(event,value)=>{
  const win=getWindow();if(!win||win.isDestroyed()||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('invalid_sender');
  let url;try{url=new URL(event.senderFrame.url)}catch{throw Error('invalid_sender')}
  const account=getAccount();if(url.origin!==getOrigin()||!url.pathname.startsWith('/lab/')||!account||String(value?.labId)!==String(account))throw Error('account_changed');
  update(normalizeProgress(value),account);return true;
 });return()=>ipcMain.removeHandler('lab-order-progress');
}
module.exports={normalizeProgress,installOrderProgress};
