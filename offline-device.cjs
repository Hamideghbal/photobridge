'use strict';
const key=store=>'lastDownloadDevice:'+store.get('labId')+':'+store.get('deviceId');
function saveDevice(store,data){if(!store.get('labId')||!data||typeof data!=='object')return;store.set(key(store),{data,confirmedAt:new Date().toISOString()});}
function offlineDevice(store){const saved=store.get(key(store));if(!saved?.data?.registered||!saved.data.isThisDevice)return null;return{...saved.data,offline:true,lastConfirmedAt:saved.confirmedAt};}
module.exports={saveDevice,offlineDevice};
