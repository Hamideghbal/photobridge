(()=>{'use strict';
const $=id=>document.getElementById(id);
const sources=[
 ['dashboard','/api/lab/dashboard','اطلاعات لابراتوار و مشتریان'],
 ['invoices','/api/lab/invoices','فاکتورها'],
 ['payments','/api/lab/finance/payments','دریافت‌ها'],
 ['expenses','/api/lab/finance/expenses','هزینه‌ها'],
 ['ledger','/api/lab/finance/ledger','حساب معین'],
 ['archive','/api/lab/archive','فهرست سفارش‌های آرشیو']
];
let active=false,authenticated=false;
const printNum=n=>new Intl.NumberFormat('fa-IR').format(n);
function update(percent,label,state='working'){
 const pct=Math.max(0,Math.min(100,Math.round(percent)));
 $('backupProgressBar').style.width=pct+'%';
 $('backupProgress').setAttribute('aria-valuenow',String(pct));
 $('backupPercent').textContent=printNum(pct)+'٪';
 $('backupStage').textContent=label;
 $('message').textContent=label;
 $('message').className=state==='error'?'error':state==='complete'?'ok':'';
 const steps=[...$('steps').children];
 for(let i=0;i<steps.length;i++)steps[i].className=i<Math.floor(pct/100*steps.length)?'done':i===Math.floor(pct/100*steps.length)?'active':'';
}
async function request(url){
 const response=await fetch(url,{method:'GET',credentials:'same-origin',cache:'no-store',headers:{'accept':'application/json','x-photobridge-portal':'lab'}});
 if(!response.ok)throw Error(response.status===401||response.status===403?'دسترسی لابراتوار مجاز نیست؛ با حساب مدیر وارد شوید.':'دریافت داده‌ها ناموفق بود (HTTP '+response.status+').');
 return response.json();
}
async function authorize(){
 const data=await request('/api/auth/me');
 if(data?.user?.labRole!=='lab_admin'||!data.user.labId)throw Error('تهیه خروجی فقط با حساب مدیر لابراتوار امکان‌پذیر است.');
 authenticated=true;$('start').disabled=false;update(0,'حساب مدیر لابراتوار تأیید شد. برای شروع دکمه را بزنید.');
}
function saveFile(data){
 const content=JSON.stringify(data,null,2);
 const blob=new Blob([content],{type:'application/json;charset=utf-8'});
 const link=document.createElement('a'),url=URL.createObjectURL(blob);
 const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
 link.href=url;link.download='PhotoBridge-Lab-Web-Backup-'+timestamp+'.json';link.hidden=true;
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 return blob.size;
}
async function run(){
 if(active||!authenticated)return;active=true;$('start').disabled=true;
 try{
  update(3,'شروع دریافت داده‌های سایت');
  const datasets={},finished=[];
  for(let i=0;i<sources.length;i++){
   const [key,url,label]=sources[i];update(4+i*14,'در حال دریافت: '+label);
   datasets[key]=await request(url);
   finished.push({name:key,endpoint:url,receivedAt:new Date().toISOString()});
   update(4+(i+1)*14,'دریافت '+label+' کامل شد.');
  }
  update(92,'ساخت فایل پشتیبان و آماده‌سازی دانلود');
  const backup={format:'photobridge-lab-web-readable-snapshot',version:1,generatedAt:new Date().toISOString(),scope:'current-authorized-lab-API-results',limitations:['not a PostgreSQL/SQLite/Access database backup','not a restore archive','API responses can be paginated or limited','no image files or PDFs included'],sources:finished,datasets};
  const bytes=saveFile(backup);
  update(100,'فایل پشتیبان سایت ساخته شد ('+printNum(bytes)+' بایت).','complete');
 }catch(error){update(Number($('backupProgress').getAttribute('aria-valuenow'))||0,'پشتیبان‌گیری کامل نشد: '+String(error.message||error),'error')}
 finally{active=false;$('start').disabled=!authenticated;}
}
$('start').addEventListener('click',run);
authorize().catch(error=>update(0,String(error.message||error),'error'));
})();