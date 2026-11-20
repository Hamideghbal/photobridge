'use strict';
function patchManualVisibility(source){
 if(typeof source!=='string')throw Error('R1918 intake asset is not text');
 if(source.includes('R1918_WALKIN_ENTRY_RESTORED'))return source;
 const changes=[
  ["const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain');",
   "const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain')||document.querySelector('.labRoleWorkspace')||document.querySelector('main');"],
  ["if(!/^\\/lab(?:\\/|$)/.test(location.pathname)||!host||!provider){old?.remove();return;}",
   "if(!/^\\/lab(?:\\/|$)/.test(location.pathname)||!host){old?.remove();return;}"],
  ["if(primaryState===null&&provider.deviceId())checkPrimary();",
   "if(primaryState===null&&typeof provider?.deviceId==='function'&&provider.deviceId())checkPrimary();"],
  ["const target=header||host.querySelector('.mainQueueFilters')||host.querySelector('.ordersWorkspace');if(!target){old?.remove();return;}",
   "const target=[header,host.querySelector('.mainQueueFilters'),host.querySelector('.ordersWorkspace'),host].find(el=>el&&el.isConnected!==false&&el.getClientRects?.().length)||host;"],
  ["const provider=storage();let directory,bootstrap,loadError;",
   "const provider=storage();let directory,bootstrap,loadError;if(!provider||typeof provider.root!=='function'||typeof provider.request!=='function')loadError=Error('اتصال ذخیره‌سازی برنامه هنوز آماده نیست؛ پس از آماده شدن دوباره تلاش کنید.');"],
  ["document.body.append(prep);prep.showModal();\n try{",
   "document.body.append(prep);prep.showModal();\n try{if(loadError)throw loadError;"]
 ];
 let next=source;
 for(const [before,after] of changes){
  if(next.includes(after))continue;
  if(next.split(before).length!==2)throw Error('R1918 button mount anchor mismatch: '+before.slice(0,75));
  next=next.replace(before,after);
 }
 if(!next.includes('pb1137LocalIntakeButton')||!next.includes('function mount()'))throw Error('R1918 original walk-in button not found');
 return next.replace('function mount(){','/* R1918_WALKIN_ENTRY_RESTORED */\nfunction mount(){');
}
module.exports={patchManualVisibility};
