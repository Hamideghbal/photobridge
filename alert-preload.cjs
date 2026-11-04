'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('labAlert',{
 retryDownload:id=>ipcRenderer.invoke('lab-alert-retry-download',id),
 reply:(id,message)=>ipcRenderer.invoke('lab-alert-reply',{id,message}),
 layout:height=>ipcRenderer.invoke('lab-alert-layout',height),
 state:()=>ipcRenderer.invoke('lab-alert-state'),
 save:value=>ipcRenderer.invoke('lab-alert-save',value),
 acknowledge:ids=>ipcRenderer.invoke('lab-alert-ack',ids),
 open:ids=>ipcRenderer.invoke('lab-alert-open',ids),
 onProgress:callback=>ipcRenderer.on('lab-alert-progress',(_event,items)=>{if(typeof callback==='function')callback(items)}),
 onChange:callback=>ipcRenderer.on('lab-alert-change',()=>callback())
});
