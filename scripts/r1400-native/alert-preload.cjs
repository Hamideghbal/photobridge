'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('labAlert',{
 reply:(id,message)=>ipcRenderer.invoke('lab-alert-reply',{id,message}),
 layout:height=>ipcRenderer.invoke('lab-alert-layout',height),
 state:()=>ipcRenderer.invoke('lab-alert-state'),
 save:value=>ipcRenderer.invoke('lab-alert-save',value),
 acknowledge:ids=>ipcRenderer.invoke('lab-alert-ack',ids),
 open:ids=>ipcRenderer.invoke('lab-alert-open',ids),
 onChange:callback=>ipcRenderer.on('lab-alert-change',()=>callback())
});
