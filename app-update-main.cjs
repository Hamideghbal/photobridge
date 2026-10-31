'use strict';
const path=require('node:path'),{spawn}=require('node:child_process');
const {AppUpdate}=require('./app-update.cjs');
const {NativeUpdateProgress}=require('./native-update-progress.cjs');

function installAppUpdates({app,dialog,store,request,getWindow,show,canInstall,beforeQuit,platform=process.platform,Updater=AppUpdate,BrowserWindow,ipcMain,net,progress:providedProgress,quitTimeout=5000}){
 let updater;
 const progress=providedProgress||new NativeUpdateProgress({app,dialog,getParent:getWindow});
 let prompting=false,readyAnnounced=null,downloadInProgress=false,checking=false,lastSuccessfulCheck=0,retryTimer=null;
 updater=new Updater({
  version:app.getVersion(),directory:path.join(app.getPath('userData'),'program-updates'),request,
  getAccount:()=>store.get('auth')&&store.get('labId'),highest:store.get('nativeUpdateHighest'),
  onVersion:v=>store.set('nativeUpdateHighest',v),
  confirmDownload:async update=>{await show();let answer=await progress.ask({state:'available',version:update.version});if(answer==='ui_unavailable')answer=await nativeAction('available',update.version);if(answer!=='download')progress.close();return answer==='download';},
  onState:state=>{store.set('nativeUpdateState',state);if(state.state==='downloading'){downloadInProgress=true;getWindow()?.setProgressBar?.(state.percent/100);progress.update(state);}else if(state.state==='verifying'){downloadInProgress=true;getWindow()?.setProgressBar?.(1);progress.update(state);}else if(state.state==='ready'){downloadInProgress=false;getWindow()?.setProgressBar?.(-1);progress.update({state:'ready',version:state.version,percent:100,loadedBytes:state.loadedBytes,totalBytes:state.totalBytes});}},
  canInstall,
  launch:(file,args)=>new Promise((resolve,reject)=>{const child=spawn(file,args,{detached:true,stdio:'ignore',windowsHide:true});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});}),
  quit:async()=>{let timer;try{await Promise.race([Promise.resolve().then(beforeQuit),new Promise(resolve=>{timer=setTimeout(resolve,quitTimeout);})]);}finally{clearTimeout(timer);}const force=setTimeout(()=>app.exit?.(0),quitTimeout);force.unref?.();app.quit();}
 });

 async function nativeAction(state,version,message){
  const ready=state==='ready',error=state==='error';
  const title=ready?'نسخهٔ جدید برنامه آماده است':error?'به‌روزرسانی کامل نشد':'به‌روزرسانی PhotoBridge';
  const detail=error?(message||'برنامهٔ فعلی حفظ شده است؛ می‌توانی دوباره تلاش کنی.'):'پنجرهٔ پیشرفت به‌روزرسانی پاسخ نداد. با انتخاب ادامه، برنامه بدون آن پنجره کار را انجام می‌دهد و نسخهٔ فعلی تا تأیید سلامت فایل حفظ می‌شود.';
  const result=await dialog.showMessageBox(getWindow(),{type:error?'warning':'info',title,message:ready?'نسخهٔ '+version+' دانلود و بررسی شده است.':error?'برای ادامه دوباره تلاش کن.':'نسخهٔ '+version+' آمادهٔ دریافت است.',detail,buttons:ready?['بعداً','نصب و اجرای مجدد']:error?['بعداً','تلاش دوباره']:['بعداً','دریافت به‌روزرسانی'],defaultId:1,cancelId:0});
  return result.response===1?(ready?'install':error?'retry':'download'):'later';
 }

 async function prompt(){
  if(prompting||!updater.ready)return;prompting=true;
  try{
   await show();
   for(;;){
    const version=updater.ready.version;let action=await progress.ask({state:'ready',version});if(action==='ui_unavailable')action=await nativeAction('ready',version);
    if(action!=='install'){progress.close();break;}
    try{
     progress.update({state:'installing',version});getWindow()?.setProgressBar?.(2);
     await progress.prepareInstall(version);
     await updater.install();progress.close();break;
    }catch(error){
     getWindow()?.setProgressBar?.(-1);
     const message=error.message==='finish_current_work'?'ابتدا فرم‌های باز و عملیات ذخیره‌سازی را تمام کن؛ سپس دوباره نصب را بزن.':'نصب انجام نشد؛ برنامهٔ فعلی و اطلاعاتت حفظ شده‌اند.';
     let retry=await progress.ask({state:'error',retryStage:'install',version,message});if(retry==='ui_unavailable')retry=await nativeAction('error',version,message);
     if(retry!=='retry'){progress.close();break;}
    }
   }
  }finally{prompting=false;}
 }

 function clearRetry(){if(retryTimer){clearTimeout(retryTimer);retryTimer=null;}}
 function scheduleRetry(){clearRetry();retryTimer=setTimeout(()=>{retryTimer=null;void check();},5*60*1000);retryTimer.unref?.();}
 async function check(manual=false){
  if(!app.isPackaged||platform!=='win32'||checking)return;checking=true;
  try{
   const result=await updater.check();store.set('nativeUpdateError',null);lastSuccessfulCheck=Date.now();clearRetry();
   if(result.state==='ready'){
    downloadInProgress=false;
    if(manual||readyAnnounced!==result.version){readyAnnounced=result.version;await prompt();}
   }else if(result.state==='available'){
    getWindow()?.setProgressBar?.(-1);progress.close();
   }else if(manual){
    await dialog.showMessageBox(getWindow(),{type:'info',title:'به‌روزرسانی برنامه',message:result.state==='current'?'آخرین نسخهٔ برنامه نصب است.':result.state==='login_required'?'برای دریافت نسخهٔ جدید وارد حساب لابراتوار شوید.':'هنوز نسخهٔ جدیدی برای دریافت منتشر نشده است.'});
   }
  }catch(error){
   getWindow()?.setProgressBar?.(-1);store.set('nativeUpdateError',error.message);progress.log?.('error',{code:String(error.message)});
   const failedDownload=downloadInProgress;downloadInProgress=false;
   if(error.message==='update_cancelled'){progress.close();store.set('nativeUpdateError',null);return;}
   scheduleRetry();
   if(failedDownload){
    let action=await progress.ask({state:'error',retryStage:'download',message:'دریافت کامل نشد. برنامهٔ فعلی حفظ شده است؛ اتصال اینترنت را بررسی و دوباره تلاش کن.'});if(action==='ui_unavailable')action=await nativeAction('error',null,'پنجرهٔ پیشرفت به‌روزرسانی پاسخ نداد. برنامهٔ فعلی حفظ شده است؛ اتصال اینترنت را بررسی و دوباره تلاش کن.');
    if(action==='retry'){checking=false;return check(true);}
    progress.close();
   }else if(manual){
    await dialog.showMessageBox(getWindow(),{type:'warning',title:'به‌روزرسانی برنامه',message:'دریافت نسخهٔ جدید انجام نشد. اینترنت و انتشار نسخه را بررسی کن؛ برنامهٔ فعلی قابل استفاده است.'});
   }
  }finally{checking=false;}
 }

 const timer=setInterval(()=>void check(),6*3600000);timer.unref();
 const onFocus=()=>{if(store.get('auth')&&Date.now()-lastSuccessfulCheck>10*60*1000)void check();};
 app.on('browser-window-focus',onFocus);
 app.on('before-quit',()=>{clearInterval(timer);clearRetry();app.off?.('browser-window-focus',onFocus);progress.destroy?.();});
 return{check,prompt,updater,progress};
}
module.exports={installAppUpdates};
