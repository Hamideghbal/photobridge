'use strict';
function allowed(wc,permission,details,win,origin){
 if(!win||wc!==win.webContents||wc.isDestroyed?.()||permission!=='media'||details?.isMainFrame!==true)return false;
 const url=details.requestingUrl||details.requestingOrigin;
 try{if(new URL(url).origin!==origin||new URL(wc.getURL()).origin!==origin)return false}catch{return false}
 return Array.isArray(details.mediaTypes)&&details.mediaTypes.length===1&&details.mediaTypes[0]==='audio';
}
function installMicrophone({session,getWindow,getOrigin,dialog}){
 const approved=new WeakSet();
 session.setPermissionCheckHandler((wc,p,requestingOrigin,details)=>p==='media'&&approved.has(wc)&&allowed(wc,p,{...details,requestingOrigin,mediaTypes:details?.mediaType==='audio'?['audio']:[]},getWindow(),getOrigin()));
 session.setPermissionRequestHandler((wc,p,cb,details)=>{
  const win=getWindow(),origin=getOrigin();if(!allowed(wc,p,details,win,origin))return cb(false);
  void dialog.showMessageBox(win,{type:'question',title:'ضبط پیام صوتی',message:'اجازهٔ استفاده از میکروفن برای ضبط پیام صوتی؟',detail:'صدا پس از ضبط قابل شنیدن و حذف است و فقط با دکمهٔ ارسال فرستاده می‌شود.',buttons:['لغو','اجازهٔ ضبط'],defaultId:0,cancelId:0}).then(answer=>{const ok=answer.response===1&&allowed(wc,p,details,getWindow(),getOrigin());if(ok)approved.add(wc);cb(ok)},()=>cb(false));
 });
}
module.exports={allowed,installMicrophone};
