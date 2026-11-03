(()=>{'use strict';
 let working=false,dirty=false;const $=id=>document.getElementById(id);
 const set=(id,value)=>{if($(id).textContent!==value)$(id).textContent=value;};
 const api=async(path,body)=>{const response=await fetch('/desktop/backups/'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok)throw Error(data.message||data.error);return data;};
 const date=value=>value?new Date(value).toLocaleString('fa-IR',{timeZone:'Asia/Tehran'}):'—';
 function show(state){
  set('directory',state.settings.directory);
  if(!working&&!dirty){$('automatic').checked=state.settings.automatic;$('interval').value=String(state.settings.intervalHours);}
  const progress=state.progress;const bar=$('backupProgress');const visible=Boolean(progress&&(state.busy||working||progress.state==='complete'||progress.state==='partial'||progress.state==='failed'));bar.hidden=!visible;if(progress){const percent=Math.max(0,Math.min(100,Number(progress.percent)||0));$('backupProgressBar').style.width=percent+'%';bar.setAttribute('aria-valuenow',String(percent));set('backupProgressPercent',new Intl.NumberFormat('fa-IR').format(percent)+'٪');set('backupProgressLabel',progress.label||'در حال تهیه پشتیبان');}
  const last=state.last;
  const message=state.busy?'پشتیبان‌گیری در حال انجام است… '+(progress?.label||''):!last?'هنوز بکاپی تهیه نشده است.':last.error?'پشتیبان‌گیری انجام نشد: '+last.error:!last.finishedAt?'پشتیبان‌گیری در حال انجام است…':!last.ok?'بکاپ داده‌ها ذخیره شد؛ خروجی اکسس انجام نشد: '+(last.accessError||''):last.accessSaved&&!last.reportsIncluded?'پشتیبان‌گیری کامل شد. جدول‌های اکسس ذخیره شدند؛ ساخت گزارش انجام نشد: '+(last.reportsError||'نسخهٔ کامل Microsoft Access لازم است.'):'پشتیبان‌گیری کامل شد.';
  set('message',message);$('message').className='status-message '+(last?.error||last?.accessError||(last?.accessSaved&&!last?.reportsIncluded)?'error':last?.ok?'ok':'');
  set('databaseState',!last?'—':last.databaseSaved?'ذخیره شد':'در این نوبت تهیه نشده');
  set('accessState',!last?'—':last.accessSaved?'ذخیره شد':'در این نوبت تهیه نشده');
  set('reportsState',!last?'—':last.reportsIncluded?'معین و فاکتورهای آتلیه‌ها آماده‌اند':last.accessSaved?'ساخته نشد؛ توضیح بالا':'در این نوبت تهیه نشده');
  set('lastTime',date(last?.finishedAt));
  set('viewerState',!last?'—':last.viewerSaved?'مشاهده بکاپ.html آماده است':last.viewerError?'ساخته نشد: '+last.viewerError:'در این نوبت ساخته نشده');
  document.querySelectorAll('button').forEach(button=>button.disabled=working||state.busy);
 }
 async function refresh(){try{show(await api('status'));}catch(e){set('message',e.message);$('message').className='status-message error';}}
 async function action(fn){if(working)return;working=true;document.querySelectorAll('button').forEach(button=>button.disabled=true);try{await fn();}catch(e){set('message',e.message);$('message').className='status-message error';}finally{working=false;document.querySelectorAll('button').forEach(button=>button.disabled=false);await refresh();}}
 $('choose').onclick=()=>action(()=>api('choose',{}));$('open').onclick=()=>action(()=>api('open',{}));
 $('automatic').onchange=$('interval').onchange=()=>{dirty=true;set('saveNote','تغییرات هنوز ذخیره نشده‌اند.');};
 $('save').onclick=()=>action(async()=>{await api('configure',{automatic:$('automatic').checked,intervalHours:Number($('interval').value)});dirty=false;set('saveNote','تنظیمات ذخیره شد.');});
 document.querySelectorAll('.run').forEach(button=>button.onclick=()=>action(async()=>{set('message','در حال تهیهٔ نسخهٔ ثابت داده‌ها…');await api('run',{format:button.dataset.format});}));
 void refresh();setInterval(refresh,1500);
})();
