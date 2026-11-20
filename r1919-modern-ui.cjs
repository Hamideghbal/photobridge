'use strict';
// Preserve the currently installed website form and its per-photo copy/cut tags.
// Never replace it with the older two-button manual-order asset.
function patchModernWalkIn(source){
 if(typeof source!=='string'||!source.includes('pb1137LocalIntakeButton'))throw Error('R1919 current UI launcher unknown');
 if(source.includes('R1919_PRESERVE_CURRENT_PHOTO_UI'))return source;
 const start=source.indexOf('async function open('),mount=source.indexOf('function mount(){'),stop=source.indexOf('let primaryState=',mount);
 if(start<0||mount<start||stop<mount||source.indexOf('function mount(){',mount+1)>=0)throw Error('R1919 current manual UI shape incompatible');
 let opener=source.slice(start,mount),entry=source.slice(mount,stop);const remainder=source.slice(stop);
 if(!entry.includes('old.onclick=()=>open(')||!entry.includes('target.append(button)'))throw Error('R1919 current launcher handler absent');
 const prefix='if(!/^\\/lab(?:\\/|$)/.test(location.pathname)||!host';
 const at=entry.indexOf(prefix),end=entry.indexOf('){old?.remove();return;}',at);
 if(at<0||end<at||end-at>260)throw Error('R1919 current lab visibility guard incompatible');
 entry=entry.slice(0,at)+prefix+'){old?.remove();return;}'+entry.slice(end+'){old?.remove();return;}'.length);
 entry=entry.replace('if(primaryState===null){checkPrimary();return;}if(!primaryState){old?.remove();return;}',"if(primaryState===null&&typeof provider?.deviceId==='function'&&provider.deviceId())void checkPrimary();");
 entry=entry.replace('if(primaryState===null&&provider.deviceId())checkPrimary();',"if(primaryState===null&&typeof provider?.deviceId==='function'&&provider.deviceId())void checkPrimary();");
 const target=entry.match(/const target=([^;]+);if\(!target\)\{old\?\.remove\(\);return;\}/);
 if(!target)throw Error('R1919 cannot safely mount current button');
 entry=entry.replace(target[0],'const target=('+target[1]+')||host;');
 entry=entry.replace("const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain');","const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain')||document.querySelector('.labRoleWorkspace');");
 const remote="api('/api/lab/download-device')",manual="api('/api/lab/manual-intake/preflight')";
 if(opener.includes(remote)){
  const cached='cachedPrimary?Promise.resolve({registered:true,isThisDevice:true}):'+remote;
  if(opener.includes(cached))opener=opener.replace(cached,manual);
  else if(opener.split(remote).length===2)opener=opener.replace(remote,manual);
  else throw Error('R1919 manual authorization is ambiguous');
  const guard='if(!primary.registered||!primary.isThisDevice)throw Error(primary.registered?errors.not_primary_download_device:errors.download_device_not_registered);';
  if(!opener.includes(guard))throw Error('R1919 manual device permission shape unknown');
  opener=opener.replace(guard,"if(primary?.allowed!==true)throw Error(primary?.message||'مجوز ثبت سفارش محلی تأیید نشد.');");
  opener=opener.replace('primaryState=!!(primary.registered&&primary.isThisDevice);primaryCheckedAt=Date.now();','/* Manual permission never promotes remote download primary. */');
 }else if(!opener.includes(manual))throw Error('R1919 dedicated manual preflight not found');
 const result=source.slice(0,start)+'/* R1919_PRESERVE_CURRENT_PHOTO_UI */\n'+opener+entry+remainder;
 for(const token of ['کات','کپی','cut','copy','pb1468FileActions'])if(source.includes(token)&&result.split(token).length<source.split(token).length)throw Error('R1919 existing photo control was modified');
 if(!result.includes(manual)||!remainder.includes(remote))throw Error('R1919 primary authority separation unavailable');
 new Function(result);
 return result;
}
module.exports={patchModernWalkIn};