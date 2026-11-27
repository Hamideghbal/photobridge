'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('storeAlert',{
 state:()=>ipcRenderer.invoke('store-alert-state'),
 layout:height=>ipcRenderer.invoke('store-alert-layout',height),
 save:settings=>ipcRenderer.invoke('store-alert-save',settings),
 acknowledge:ids=>ipcRenderer.invoke('store-alert-ack',ids),
 open:ids=>ipcRenderer.invoke('store-alert-open',ids),
 reply:()=>Promise.reject(Error('reply_not_available')),
 onChange:callback=>{ipcRenderer.on('store-alert-change',()=>callback())}
});
