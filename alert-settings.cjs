'use strict';
const DEFAULTS={mode:'gentle',tone:'bell',volume:50,interval:10};
function normalizeSettings(value={}){
 return {mode:['silent','gentle','repeat'].includes(value.mode)?value.mode:DEFAULTS.mode,
 tone:['bell','beep','soft'].includes(value.tone)?value.tone:DEFAULTS.tone,
 volume:Number.isFinite(Number(value.volume))?Math.max(0,Math.min(100,Number(value.volume))):DEFAULTS.volume,
 interval:[5,10,30,60].includes(Number(value.interval))?Number(value.interval):DEFAULTS.interval};
}
function initializeSettings(store,account){
 const key='nativeAlertSettings:'+account,marker='nativeAlertGentleDefaultV1:'+account;
 if(!store.get(marker)){
  const current=normalizeSettings(store.get(key));
  if(!store.get(key)||current.mode==='silent'||current.volume===0)store.set(key,{...current,mode:'gentle',volume:current.volume||DEFAULTS.volume});
  store.set(marker,true);
 }
 return normalizeSettings(store.get(key));
}
module.exports={normalizeSettings,DEFAULTS,initializeSettings};
