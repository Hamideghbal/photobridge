'use strict';
function installPricingFocus({ipcMain,getWindow,getAccount,getOrigin}){
 ipcMain.handle('lab-pricing-focus',(event,labId)=>{
  const win=getWindow();if(!win||win.isDestroyed()||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('invalid_sender');
  let url;try{url=new URL(event.senderFrame.url)}catch{throw Error('invalid_sender')}
  if(url.origin!==getOrigin()||!url.pathname.startsWith('/lab/')||!getAccount()||String(labId)!==String(getAccount()))throw Error('account_changed');
  // Focus the existing page, without reloading or replacing an open pricing form.
  win.show();win.restore();win.focus();return true;
 });return()=>ipcMain.removeHandler('lab-pricing-focus');
}
module.exports={installPricingFocus};
