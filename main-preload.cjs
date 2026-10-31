'use strict';
// The native popup owns order sound in this desktop profile. Other browser
// profiles keep their own preference. Do not mute videos or unrelated media.
try{if(location.hostname==='127.0.0.1')localStorage.setItem('lablink_lab_new_order_sound','off')}catch{}

const {contextBridge,ipcRenderer}=require('electron');
if(location.protocol==='http:'&&location.hostname==='127.0.0.1'&&location.port==='43761')contextBridge.exposeInMainWorld('pbNativeStorage',{invoke:(action,payload)=>ipcRenderer.invoke('lab-native-storage',action,payload)});
