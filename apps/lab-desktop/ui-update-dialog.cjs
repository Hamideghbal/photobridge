'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderUiUpdate(state,token){
 const ready=state.kind==='ready',busy=state.kind==='busy',error=state.kind==='error',checking=state.kind==='checking';
 const title=checking?'در حال دریافت به‌روزرسانی':ready?'ظاهر جدید برنامه آماده است':busy?'بررسی به‌روزرسانی در حال انجام است':error?'بررسی به‌روزرسانی کامل نشد':'برنامهٔ شما به‌روز است';
 const message=state.message||(ready?'تغییرات جدید سایت دریافت شده‌اند. پس از ذخیرهٔ کارهای باز، آن‌ها را روی برنامه اعمال کنید.':busy?'به‌روزرسانی در حال بررسی است؛ می‌توانید پنجره را ببندید. وضعیت از منوی برنامه قابل پیگیری است.':'آخرین نسخهٔ برنامه و ظاهر نصب‌شده بررسی شدند.');
 const font=fs.readFileSync(path.join(__dirname,'assets/photobridge-vazirmatn.woff2')).toString('base64');
 const link=action=>'https://photobridge.invalid/ui-update/'+action+'?token='+token;
 return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';style-src 'unsafe-inline';font-src data:;script-src 'none';base-uri 'none';form-action 'none'"><title>به‌روزرسانی فوتوبریج</title><style>@font-face{font-family:Vazirmatn;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}body{margin:0;padding:24px;background:#f5f7fc;color:#243753;font:13px/2 Vazirmatn,Tahoma,sans-serif}.card{background:white;border:1px solid #e0e7f1;border-radius:20px;padding:24px}.brand{color:#7b8ba3;font-size:12px;border-bottom:1px solid #edf1f6;padding-bottom:14px}.badge{display:inline-block;margin:18px 0 8px;padding:3px 12px;border-radius:20px;background:#edf3ff;color:#315efb;font-size:11px}h1{font-size:20px;margin:0 0 12px}p{margin:0;color:#61718a}.note{margin-top:18px;padding:12px;background:#f6f8fc;border-radius:12px;font-size:11px}.progress{margin-top:18px;height:9px;background:#edf2fc;border-radius:9px;overflow:hidden}.progress>div{height:100%;background:#315efb;transition:width .2s}#update-percent{color:#315efb}.actions{display:flex;gap:10px;margin-top:22px}a{flex:1;display:block;text-align:center;text-decoration:none;padding:10px;border-radius:11px;background:#edf1f7;color:#52657e}a.primary{background:#315efb;color:white}a:focus-visible{outline:3px solid #9eb5ff;outline-offset:3px}</style></head><body><main class="card"><div class="brand">PhotoBridge Lab · به‌روزرسانی برنامه</div><span class="badge">${checking?'در حال بررسی':ready?'به‌روزرسانی ظاهر':error?'نیاز به بررسی':busy?'در حال بررسی':'آخرین نسخه'}</span><h1>${title}</h1><p id="update-message">${escape(message)}</p>${checking?`<div class="progress"><div id="update-bar" style="width:${Math.max(0,Math.min(100,Number(state.percent)||0))}%"></div></div><small id="update-percent">${Number(state.percent||0).toLocaleString('fa-IR')}٪</small>`:''}<div class="note">${ready?'ظاهر برنامه بدون تغییر داده‌ها به‌روزرسانی می‌شود.':'نسخهٔ فعلی برنامه حفظ می‌شود.'}</div><div class="actions">${ready?`<a class="primary" href="${link('apply')}">اعمال ظاهر جدید</a>`:''}<a href="${link('later')}">${ready?'بعداً':'بستن'}</a></div></main></body></html>`;
}
class UiUpdateDialog{
 constructor({BrowserWindow,getWindow,dialog,timeout=15000}){Object.assign(this,{BrowserWindow,getWindow,dialog,timeout});this.pending=null;}
 ask(state){this.pending?.();return new Promise(resolve=>{
  const token=crypto.randomBytes(24).toString('hex'),parent=this.getWindow(),win=new this.BrowserWindow({width:560,height:480,useContentSize:true,parent,modal:!!parent,show:false,resizable:false,minimizable:false,maximizable:false,autoHideMenuBar:true,title:'به‌روزرسانی فوتوبریج',backgroundColor:'#f5f7fc',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});let done=false;this.window=win;
  const finish=value=>{if(done)return;done=true;clearTimeout(timer);this.pending=null;if(!win.isDestroyed())win.destroy();resolve(value)};
  const fallback=()=>{finish('later');if(state.kind!=='checking')void this.dialog?.showMessageBox(parent,{type:'info',title:'به‌روزرسانی برنامه',message:state.message||'وضعیت به‌روزرسانی از منوی برنامه قابل بررسی است.'});};
  const timer=setTimeout(fallback,this.timeout);this.pending=()=>finish('later');win.removeMenu?.();win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event,url)=>{event.preventDefault();for(const action of ['apply','retry','later'])if(url===`https://photobridge.invalid/ui-update/${action}?token=${token}`)finish(action)});
  win.webContents.on('before-input-event',(event,input)=>{if(input.key==='Escape'){event.preventDefault();finish('later')}});win.on('closed',()=>finish('later'));win.webContents.on('render-process-gone',fallback);win.webContents.on('did-fail-load',(_e,_c,_d,_u,main)=>{if(main)fallback()});win.webContents.once('did-finish-load',()=>{if(done)return;clearTimeout(timer);win.show();win.focus?.()});Promise.resolve(win.loadURL('data:text/html;base64,'+Buffer.from(renderUiUpdate(state,token)).toString('base64'))).catch(fallback);
 });}
 progress(state){
  if(state.start){this.progressDismissed=false;this.stopProgress();}
  if(this.progressDismissed)return;
  if(!this.progressWindow||this.progressWindow.isDestroyed()){
   const answer=this.ask({kind:'checking',...state});this.progressWindow=this.window;
   void answer.then(()=>{this.progressDismissed=true;this.progressWindow=null});return;
  }
  const percent=Math.max(0,Math.min(100,Number(state.percent)||0));
  if(percent<100&&Date.now()-(this.lastProgress||0)<120)return;this.lastProgress=Date.now();
  void this.progressWindow.webContents.executeJavaScript(`(()=>{const text=document.getElementById('update-message'),bar=document.getElementById('update-bar'),label=document.getElementById('update-percent');if(text)text.textContent=${JSON.stringify(state.message||'در حال دریافت به‌روزرسانی…')};if(bar)bar.style.width=${JSON.stringify(String(percent)+'%')};if(label)label.textContent=${JSON.stringify(percent.toLocaleString('fa-IR')+'٪')}})()`).catch(()=>{});
 }
 stopProgress(){if(this.progressWindow&&!this.progressWindow.isDestroyed())this.progressWindow.destroy();this.progressWindow=null;}
 destroy(){this.stopProgress();this.pending?.();}
}
module.exports={UiUpdateDialog,renderUiUpdate};
