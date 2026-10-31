'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('pbUpdateProgress',{
 onState:callback=>{if(typeof callback!=='function')return;const listener=(_event,state)=>callback(state);ipcRenderer.on('pb-update-progress-state',listener);ipcRenderer.send('pb-update-progress-ready');return()=>ipcRenderer.removeListener('pb-update-progress-state',listener)},
 action:value=>{if(['download','install','later','retry'].includes(value))ipcRenderer.send('pb-update-progress-action',value)}
});
