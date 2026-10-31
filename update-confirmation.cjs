'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {NativeUpdateProgress}=require('./native-update-progress.cjs');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderConfirmation(state,token){
 const ready=state.state==='ready',version=escape(state.version),action=ready?'install':'download';
 const font=fs.readFileSync(path.join(__dirname,'assets/photobridge-vazirmatn.woff2')).toString('base64'),logo=fs.readFileSync(path.join(__dirname,'assets/photobridge.png')).toString('base64');
 return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; script-src 'none'; base-uri 'none'; form-action 'none'"><title>به‌روزرسانی PhotoBridge</title><style>
 @font-face{font-family:Vazirmatn;src:url(data:font/woff2;base64,${font}) format('woff2');font-display:block}*{box-sizing:border-box}html,body{margin:0;height:100%;background:#f5f7fc;color:#172746;font-family:Vazirmatn,Tahoma,sans-serif}body{padding:24px;text-align:right}.card{background:#fff;border:1px solid #e3e9f4;border-radius:22px;padding:24px;box-shadow:0 12px 40px #18335b09}.brand{display:flex;align-items:center;gap:12px}.logo{width:46px;height:46px;border-radius:12px}.brand strong{display:block;font-size:16px;direction:ltr;text-align:right}.brand small{display:block;color:#8090aa;font-size:11px;margin-top:3px}.badge{margin-right:auto;white-space:nowrap;background:${ready?'#eaf8f1':'#edf2ff'};color:${ready?'#18875a':'#315efb'};font-size:11px;padding:6px 10px;border-radius:30px}.divider{height:1px;background:#edf0f6;margin:20px 0}.eyebrow{font-size:11px;color:#71809a;letter-spacing:.1px}.heading{font-size:21px;line-height:1.7;margin:5px 0 9px;font-weight:800}.text{font-size:13px;color:#6b7890;line-height:2;margin:0;min-height:52px}.version{display:inline-block;direction:ltr;unicode-bidi:isolate;font-weight:700;color:#315efb}.notice{display:flex;align-items:flex-start;gap:9px;border-radius:12px;background:${ready?'#f0faf5':'#f5f7fc'};padding:12px 14px;margin:18px 0 22px;font-size:11px;line-height:1.9;color:${ready?'#34785b':'#74829a'}}.mark{font-size:15px;color:${ready?'#1da36c':'#5674e7'}}.actions{display:flex;gap:10px}.button{display:flex;align-items:center;justify-content:center;min-height:46px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;outline-offset:3px}.primary{flex:1.6;background:#315efb;color:white;box-shadow:0 5px 13px #315efb25}.primary:hover{background:#264fdf}.secondary{flex:1;background:#f0f3f9;color:#62718b}.secondary:hover{background:#e8edf6}a:focus-visible{outline:3px solid #99afff}.footer{text-align:center;font-size:10px;color:#9aa5b7;margin-top:14px}
 </style></head><body><main class="card"><header class="brand"><img class="logo" src="data:image/png;base64,${logo}" alt=""><div><strong>PhotoBridge Lab</strong><small>به‌روزرسانی برنامه</small></div><span class="badge">${ready?'آمادهٔ نصب':'نسخهٔ جدید'}</span></header><div class="divider"></div><div class="eyebrow">${ready?'دریافت و بررسی فایل کامل شد':'نسخهٔ تازهٔ فوتوبریج منتشر شده'}</div><h1 class="heading">${ready?'همه‌چیز برای نصب آماده است':'فوتوبریج شما به‌روزتر می‌شود'}</h1><p class="text">${ready?`نسخهٔ <bdi class="version">${version}</bdi> دانلود و سلامت فایل تأیید شده است. با تأیید شما، برنامه بسته و نسخهٔ جدید نصب می‌شود.`:`نسخهٔ <bdi class="version">${version}</bdi> آمادهٔ دریافت است. هنگام دانلود می‌توانید به کارتان ادامه دهید؛ پس از پایان، برای نصب به شما اطلاع می‌دهیم.`}</p><div class="notice"><span class="mark">${ready?'✓':'↓'}</span><span>${ready?'پیش از نصب، فرم‌های باز را ذخیره کنید. سفارش‌ها و مسیرهای ذخیره حفظ می‌شوند.':'پیشرفت دریافت روی آیکن برنامه در نوار وظیفه نمایش داده می‌شود.'}</span></div><nav class="actions"><a class="button primary" href="https://photobridge.invalid/update-action/${action}?token=${token}">${ready?'نصب و اجرای مجدد':'دریافت به‌روزرسانی'}</a><a class="button secondary" href="https://photobridge.invalid/update-action/later?token=${token}">بعداً</a></nav></main><div class="footer">PhotoBridge · همراه لابراتوار شما</div></body></html>`;
}
class UpdateConfirmation extends NativeUpdateProgress{
 constructor(options){super(options);this.BrowserWindow=options.BrowserWindow;this.timeoutMs=options.confirmationTimeoutMs||8000;this.pending=null;}
 async ask(state){
  if(!this.BrowserWindow||!['available','ready'].includes(state.state))return super.ask(state);
  let result;
  try{result=await this.customAsk(state);}catch(error){this.log('confirmation_error',{code:String(error.message)});result='fallback';}
  if(result==='fallback')return super.ask(state);this.log('action',{stage:state.state,action:result});return result;
 }
 customAsk(state){return new Promise(resolve=>{
  const token=crypto.randomBytes(24).toString('hex'),action=state.state==='ready'?'install':'download',parent=this.getParent?.();
  const win=new this.BrowserWindow({width:560,height:500,useContentSize:true,resizable:false,maximizable:false,minimizable:false,parent,modal:!!parent,show:false,autoHideMenuBar:true,backgroundColor:'#f5f7fc',title:'به‌روزرسانی PhotoBridge',icon:path.join(__dirname,'assets/photobridge.png'),webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  let done=false;const finish=value=>{if(done)return;done=true;clearTimeout(timer);this.pending=null;if(!win.isDestroyed())win.destroy();resolve(value);};
  const timer=setTimeout(()=>finish('fallback'),this.timeoutMs);this.pending=()=>finish('later');
  win.removeMenu?.();win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event,url)=>{event.preventDefault();for(const value of [action,'later'])if(url===`https://photobridge.invalid/update-action/${value}?token=${token}`)finish(value);});
  win.webContents.on('before-input-event',(event,input)=>{if(input.key==='Escape'){event.preventDefault();finish('later');}});
  win.webContents.on('render-process-gone',()=>finish('fallback'));
  win.webContents.on('did-fail-load',(_e,_c,_d,_u,isMainFrame)=>{if(isMainFrame)finish('fallback');});
  win.on('closed',()=>finish('later'));
  win.webContents.once('did-finish-load',()=>{if(done)return;clearTimeout(timer);win.show();win.focus?.();this.log('confirmation_visible',{stage:state.state});});
  Promise.resolve(win.loadURL('data:text/html;base64,'+Buffer.from(renderConfirmation(state,token)).toString('base64'))).catch(()=>finish('fallback'));
 });}
 close(){this.pending?.();}
 destroy(){this.close();}
}
module.exports={UpdateConfirmation,renderConfirmation};
