'use strict';
const path=require('node:path');
const {launchVerifiedAfterExit}=require('./post-exit-install.cjs');
const {AppUpdate}=require('./app-update.cjs');
function installAppUpdates({app,dialog,Notification,store,request,getWindow,show,canInstall,beforeQuit,platform=process.platform,Updater=AppUpdate,quitTimeout=5000}){
 let prompting=false,readyAnnounced=null,manualDownload=false,checking=false,autoBusy=false,exitBypass=false;
 const updater=new Updater({version:app.getVersion(),directory:path.join(app.getPath('userData'),'program-updates'),request,getAccount:()=>store.get('auth')&&store.get('labId'),highest:store.get('nativeUpdateHighest'),onVersion:v=>store.set('nativeUpdateHighest',v),confirmDownload:async update=>{if(!manualDownload)return true;await show();const answer=await dialog.showMessageBox(getWindow(),{type:'info',title:'به‌روزرسانی جدید PhotoBridge',message:'نسخهٔ '+update.version+' برنامه منتشر شده است.',detail:'برای دریافت نسخهٔ جدید، «به‌روزرسانی» را بزنید. پس از دانلود، نصب و اجرای مجدد را از همین پنجره تأیید می‌کنید. اطلاعات و مسیرهای ذخیره حفظ می‌شوند.',buttons:['بعداً','به‌روزرسانی'],defaultId:1,cancelId:0});return answer.response===1;},onState:s=>{store.set('nativeUpdateState',s);if(s.state==='downloading'){getWindow()?.setProgressBar?.(s.percent/100);}else if(s.state==='ready'){getWindow()?.setProgressBar?.(-1);}},canInstall,
  launch:(file,args,manifest)=>launchVerifiedAfterExit({file,args,manifest,platform}),quit:async()=>{let timer;try{await Promise.race([Promise.resolve().then(beforeQuit),new Promise(resolve=>{timer=setTimeout(resolve,quitTimeout);})]);}finally{clearTimeout(timer);}const force=setTimeout(()=>app.exit?.(0),quitTimeout);force.unref?.();app.quit();}});

 async function prompt(){if(prompting||!updater.ready)return;prompting=true;let retry=false;try{await show();const r=await dialog.showMessageBox(getWindow(),{type:'info',title:'نسخهٔ جدید برنامه آماده است',message:'نسخهٔ '+updater.ready.version+' دانلود و بررسی شد.',detail:'کارهای باز را ذخیره کنید. با انتخاب نصب، برنامه بسته و نسخهٔ جدید نصب و اجرا می‌شود. اطلاعات و مسیر ذخیره حفظ می‌شوند.',buttons:['بعداً','نصب و اجرای مجدد'],defaultId:0,cancelId:0});if(r.response===1)await updater.install();}catch(e){const answer=await dialog.showMessageBox(getWindow(),{type:'warning',title:'به‌روزرسانی برنامه',message:e.message==='finish_current_work'?'ابتدا فرم‌های باز و عملیات ذخیره‌سازی را تمام کنید. سپس از همین پیام تلاش دوباره را بزنید.':'نصب به‌روزرسانی انجام نشد؛ نسخهٔ فعلی حفظ شد.',buttons:['بعداً','تلاش دوباره'],defaultId:0,cancelId:0});retry=answer.response===1;}finally{prompting=false;}if(retry)return prompt();}
 async function check(manual=false,quietCurrent=false){
  if(!app.isPackaged||platform!=='win32')return{state:'unsupported'};
  if(checking)return{state:'busy'};
  checking=true;manualDownload=!!manual;
  try{
   const result=await updater.check();
   store.set('nativeUpdateError',null);
   if(result.state==='ready'){
    // Background checks never interrupt a customer at work.
    // The verified EXE is installed after a normal exit or safe idle.
    if(manual){readyAnnounced=result.version;await prompt();}
   }else if(manual&&!quietCurrent&&result.state!=='available'){
    await dialog.showMessageBox(getWindow(),{type:'info',title:'به‌روزرسانی برنامه',message:result.state==='current'?'آخرین نسخهٔ برنامه نصب است.':result.state==='login_required'?'برای دریافت نسخهٔ جدید وارد حساب لابراتوار شوید.':'هنوز نسخهٔ جدیدی برای دریافت منتشر نشده است.'});
   }
   return result;
  }catch(e){
   getWindow()?.setProgressBar?.(-1);store.set('nativeUpdateError',e.message);
   if(manual&&!quietCurrent)await dialog.showMessageBox(getWindow(),{type:'warning',title:'به‌روزرسانی برنامه',message:'دریافت نسخهٔ جدید انجام نشد. اینترنت و انتشار نسخه را بررسی کنید؛ برنامهٔ فعلی قابل استفاده است.'});
   return{state:'error'};
  }finally{checking=false;manualDownload=false;}
 }
 // R1933: if the window is actually hidden or minimized, attempt the verified
 // update only after all native writers, form, and sync guards say it is idle.
 async function installWhenIdle(){
  if(autoBusy||prompting||checking||!updater.ready)return;
  const win=getWindow();
  if(!win||win.isDestroyed?.()||typeof win.isVisible!=='function'||typeof win.isMinimized!=='function')return;
  if(win.isVisible()&&!win.isMinimized())return;
  autoBusy=true;
  try{await updater.install();}catch(error){
   if(error.message!=='finish_current_work')store.set('nativeUpdateError',String(error.message||'auto_install_failed'));
  }finally{autoBusy=false;}
 }
 const timer=setInterval(()=>void check(),6*3600000);timer.unref?.();
 const idleTimer=setInterval(()=>void installWhenIdle(),30000);idleTimer.unref?.();
 // Normal user exit is the preferred silent install point: cancel this one
 // quit event briefly, check the *original* safety guards, hand the installer
 // to a detached waiter, then let PhotoBridge exit normally.
 app.on('before-quit',event=>{
  clearInterval(timer);clearInterval(idleTimer);
  if(exitBypass||autoBusy||updater.installing||!updater.ready||!app.isPackaged||platform!=='win32')return;
  event.preventDefault();exitBypass=true;
  Promise.resolve().then(async()=>{
   if(!await canInstall()){app.quit();return;}
   try{await updater.install();}catch(error){store.set('nativeUpdateError',String(error.message||'exit_install_failed'));app.quit();}
  }).catch(()=>app.quit());
 });
 return {check,prompt,updater,installWhenIdle};
}
module.exports={installAppUpdates};
