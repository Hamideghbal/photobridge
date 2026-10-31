'use strict';
// Confirmation must not depend on the HTML renderer / preload IPC handshake.
const fs=require('node:fs'),path=require('node:path');
class NativeUpdateProgress{
 constructor({app,dialog,getParent}){this.app=app;this.dialog=dialog;this.getParent=getParent;this.lastStage=null;this.log('controller_started',{version:app.getVersion(),build:'native-dialog-02'});}
 log(event,details={}){try{fs.appendFileSync(path.join(this.app.getPath('userData'),'updater-debug.log'),JSON.stringify({time:new Date().toISOString(),event,...details})+'\n');}catch{}}
 async ask(state){
  const stage=state.state;this.log('prompt',{stage,version:state.version});
  const ready=stage==='ready',error=stage==='error';
  const options={type:error?'warning':'info',title:'PhotoBridge Lab '+this.app.getVersion()+' · UPD-02',message:ready?'نسخهٔ '+state.version+' دانلود و بررسی شد.':error?'به‌روزرسانی کامل نشد.':'نسخهٔ '+state.version+' آمادهٔ دریافت است.',detail:error?(state.message||'نسخهٔ فعلی حفظ شده است.'):ready?'کارهای باز را ذخیره کنید. برنامه بسته می‌شود و نسخهٔ جدید نصب و اجرا خواهد شد.':'با انتخاب دریافت، دانلود شروع می‌شود. پیشرفت روی آیکن برنامه در نوار وظیفه نمایش داده می‌شود؛ پس از پایان، پیام نصب باز خواهد شد.',buttons:['بعداً',ready?'نصب و اجرای مجدد':error?'تلاش دوباره':'دریافت به‌روزرسانی'],defaultId:0,cancelId:0,noLink:true};
  const parent=this.getParent?.();const result=await(parent&&!parent.isDestroyed?.()?this.dialog.showMessageBox(parent,options):this.dialog.showMessageBox(options));
  const action=result.response===1?(ready?'install':error?'retry':'download'):'later';this.log('action',{stage,action});return action;
 }
 update(state){if(state.state!==this.lastStage){this.lastStage=state.state;this.log('state',{stage:state.state,version:state.version});}}
 async prepareInstall(version){this.log('prepare_install',{version});}
 close(){}
 destroy(){}
}
module.exports={NativeUpdateProgress};
