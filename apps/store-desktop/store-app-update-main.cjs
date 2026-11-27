'use strict';
const path=require('node:path'),{spawn}=require('node:child_process');
const {AppUpdate}=require('./app-update.cjs');
function installStoreUpdates({app,dialog,store,request,getAccount,getWindow,canInstall,prepareInstall,recoverInstall,quit,checkUi,platform=process.platform,Updater=AppUpdate}){
 let flight=null,announced=null;
 const updater=new Updater({
  version:app.getVersion(),directory:path.join(app.getPath('userData'),'store-program-updates'),request,getAccount,
  highest:store.get('storeNativeUpdateHighest'),onVersion:v=>store.set('storeNativeUpdateHighest',v),
  confirmDownload:async m=>(await dialog.showMessageBox(getWindow(),{type:'info',title:'به‌روزرسانی برنامه فروشگاه',message:'نسخهٔ '+m.version+' برنامه فروشگاه منتشر شده است.',detail:'پس از دانلود و بررسی امضا، نصب فقط با تأیید شما انجام می‌شود. اطلاعات محلی محفوظ می‌مانند.',buttons:['بعداً','دریافت نسخه جدید'],defaultId:1,cancelId:0})).response===1,
  onState:s=>{store.set('storeNativeUpdateState',s);getWindow()?.setProgressBar?.(s.state==='downloading'?s.percent/100:-1)},
  canInstall,
  launch:async(file,args)=>{
   try{await prepareInstall();await new Promise((resolve,reject)=>{const child=spawn(file,args,{detached:true,stdio:'ignore',windowsHide:true});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve()})})}
   catch(e){await recoverInstall();throw e}
  },
  quit
 });
 async function run(manual=false,uiOnly=false){
  if(!getAccount())return {state:'login_required'};
  if(uiOnly){await checkUi();return {state:'ui_checked'}}
  if(!app.isPackaged||platform!=='win32'){if(manual)await checkUi();return {state:'unsupported'}}
  try{
   const account=getAccount(),result=await updater.check();
   if(getAccount()!==account)return {state:'account_changed'};
   if(result.state==='ready'&&(manual||announced!==account+':'+result.version)){
    announced=account+':'+result.version;
    const r=await dialog.showMessageBox(getWindow(),{type:'info',title:'نسخه جدید آماده نصب است',message:'نسخهٔ '+result.version+' فروشگاه دانلود و تأیید شد.',detail:'ابتدا فرم‌ها و همگام‌سازی را تمام کنید. با تأیید، پشتیبان اطلاعات تهیه می‌شود و برنامه نصب و دوباره اجرا خواهد شد.',buttons:['بعداً','نصب و اجرای مجدد'],defaultId:0,cancelId:0});
    if(r.response===1){if(getAccount()!==account)throw Error('update_account_changed');await updater.install()}
   }else if(manual&&['current','unavailable'].includes(result.state))await checkUi();
   store.set('storeNativeUpdateError',null);return result;
  }catch(e){
   store.set('storeNativeUpdateError',e.message);
   if(manual||e.message==='finish_current_work')await dialog.showMessageBox(getWindow(),{type:'warning',title:'به‌روزرسانی برنامه فروشگاه',message:e.message==='finish_current_work'?'ابتدا فرم‌ها، چاپ و عملیات ارسال‌نشده را کامل کنید، سپس دوباره به‌روزرسانی را بزنید.':'به‌روزرسانی انجام نشد؛ نسخهٔ فعلی حفظ شده است. دوباره تلاش کنید.'});
   return {state:'error'};
  }finally{getWindow()?.setProgressBar?.(-1)}
 }
 function start(manual=false,uiOnly=false){if(flight)return flight;flight=run(manual,uiOnly).finally(()=>{flight=null});return flight}
 const timer=setInterval(()=>void start(),6*3600000);timer.unref?.();
 app.on('before-quit',()=>clearInterval(timer));
 return {check:manual=>start(manual),checkUiOnly:()=>start(true,true),updater};
}
module.exports={installStoreUpdates};
