'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('labTray',{items:()=>ipcRenderer.invoke('lab-tray-items'),run:id=>ipcRenderer.invoke('lab-tray-action',id)});
