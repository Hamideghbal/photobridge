'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {patchModernWalkIn}=require('../r1919-modern-ui.cjs');
const original=`(()=>{'use strict';
async function open(){const cachedPrimary=primaryState===true&&Date.now()-primaryCheckedAt<45000;
 const [primary,root,data]=await Promise.all([
 cachedPrimary?Promise.resolve({registered:true,isThisDevice:true}):api('/api/lab/download-device'),
 provider.root(),api('/api/lab/delegated-orders/bootstrap')]);
 primaryState=!!(primary.registered&&primary.isThisDevice);primaryCheckedAt=Date.now();
 if(!primary.registered||!primary.isThisDevice)throw Error(primary.registered?errors.not_primary_download_device:errors.download_device_not_registered);
 const photo={photoMode:'کپی/کات',onCut:()=>photo.cut(),onCopy:()=>photo.copy()};
}
function mount(){
 const provider=storage();const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain');
 const old=document.getElementById('pb1137LocalIntakeButton');
 if(!/^\\/lab(?:\\/|$)/.test(location.pathname)||!host||!provider||!provider.deviceId()){old?.remove();return;}
 if(primaryState===null){checkPrimary();return;}if(!primaryState){old?.remove();return;}
 const header=window.header;
 const target=header||host.querySelector('.mainQueueFilters')||host.querySelector('.ordersWorkspace');if(!target){old?.remove();return;}
 const albumTab=false;const text='ثبت سفارش عکس حضوری';if(old){if(old.parentElement!==target)target.append(old);if(old.textContent!==text)old.textContent=text;old.onclick=()=>open(albumTab?'album':'print');return;}const button=node('button',text,'pb1137Launch');button.id='pb1137LocalIntakeButton';button.type='button';button.onclick=()=>open(albumTab?'album':'print');
 target.append(button);
}
let primaryState=null,checking=false,primaryCheckedAt=0;
async function checkPrimary(){return api('/api/lab/download-device');}
})();`;
test('R1919 keeps current per-image copy/cut and changes only manual-launch guards',()=>{
 const rendered=patchModernWalkIn(original);
 assert(rendered.includes("photoMode:'کپی/کات',onCut:()=>photo.cut(),onCopy:()=>photo.copy()"));
 assert(rendered.includes("api('/api/lab/manual-intake/preflight')"));
 assert(rendered.includes("checkPrimary(){return api('/api/lab/download-device')"));
 assert(!rendered.includes('انتقال عکس'));assert(!rendered.includes('کپی عکس'));
 new Function(rendered);assert.equal(patchModernWalkIn(rendered),rendered);
});
test('R1919 never invents a valid UI from unknown source',()=>{
 assert.throws(()=>patchModernWalkIn('window.x=1;'),/launcher unknown/);
 assert.throws(()=>patchModernWalkIn(original.replace('target.append(button)','document.body.append(button)')),/launcher handler absent/);
});
test('R1919 production source retains cached authorization and UI without removing old download guard',()=>{
 const adapted=require('../offline-ui.cjs').patchOfflineIntake(original);
 assert(adapted.includes('R1919_PRESERVE_CURRENT_PHOTO_UI'));
 assert(adapted.includes("photoMode:'کپی/کات'"));
});
