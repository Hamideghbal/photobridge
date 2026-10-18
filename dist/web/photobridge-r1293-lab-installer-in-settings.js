/* R1293: Windows Lab installer access belongs ONLY to Settings > Windows alerts.
   The native download button continues to point directly to /api/lab/desktop-installer.
   When no installer is published, show a link to an accurate status/help page,
   never an active download action for a missing EXE. */
(()=>{'use strict';
 if(window.pb1293LabInstallerSettings)return;
 window.pb1293LabInstallerSettings=true;
 const id='pb1293LabInstallerStatus';
 function mount(){
   const previous=document.getElementById(id);
   if(location.pathname!=='/lab/settings/windowsAlert'){
     previous?.remove();
     return;
   }
   const panel=document.querySelector('.labRoleWorkspace .windowsAlertSimplePanel');
   if(!panel){previous?.remove();return;}
   const installer=[...panel.querySelectorAll('.windowsAlertSimpleInstall')]
     .find(el=>el.textContent.includes('برنامهٔ آفلاین لابراتوار'));
   if(!installer){previous?.remove();return;}
   const nativeButton=[...installer.querySelectorAll('button')]
     .find(el=>el.textContent.includes('دریافت پکیج نصب ویندوز'));
   if(!nativeButton){previous?.remove();return;}
   let link=installer.querySelector('#'+id);
   if(!link){
     link=document.createElement('a');
     link.id=id;
     link.href='/lab-windows-download.html';
     link.textContent='بررسی وضعیت دانلود برنامه ویندوز';
     link.setAttribute('aria-label','بررسی وضعیت انتشار برنامه ویندوز لابراتوار');
     link.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:7px 12px;margin:8px 4px 0;border-radius:9px;border:1px solid #b8cfdf;background:#edf6fc;color:#195d8e;text-decoration:none;font-size:12px;font-weight:700';
     installer.append(link);
   }
   link.hidden=!nativeButton.disabled;
   link.style.display=nativeButton.disabled?'inline-flex':'none';
 }
 let scheduled=false;
 function schedule(){
   if(scheduled)return;
   scheduled=true;
   requestAnimationFrame(()=>{scheduled=false;mount()});
 }
 function start(){
   schedule();
   new MutationObserver(schedule).observe(document.getElementById('root')||document.body,
     {childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
   addEventListener('popstate',schedule);
   addEventListener('photobridge-auth-session-changed',schedule);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();