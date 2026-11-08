(()=>{'use strict';
// Website-only, read-only finance snapshot. Never restores or alters ledger rows.
const $=id=>document.getElementById(id);
const formatNum=n=>new Intl.NumberFormat('fa-IR').format(n);
let active=false,shop=null;
function progress(value,label,state='working'){
 const pct=Math.max(0,Math.min(100,Math.round(value)));
 $('backupProgressBar').style.width=pct+'%';
 $('backupProgress').setAttribute('aria-valuenow',String(pct));
 $('backupPercent').textContent=formatNum(pct)+'٪';
 $('backupStage').textContent=label;
 $('message').textContent=label;
 $('message').className=state==='error'?'error':state==='complete'?'ok':'';
 const steps=Array.from($('steps').children);
 steps.forEach((el,i)=>{el.className=i<Math.floor(pct/100*steps.length)?'done':i===Math.floor(pct/100*steps.length)?'active':'';});
}
async function request(path){
 const res=await fetch(path,{method:'GET',credentials:'same-origin',cache:'no-store',headers:{accept:'application/json','x-photobridge-portal':'rental'}});
 if(!res.ok)throw Error(res.status===401||res.status===403?'دسترسی مالی فروشگاه مجاز نیست؛ با حساب مدیر وارد شوید.':'دریافت اطلاعات انجام نشد (HTTP '+res.status+').');
 const data=await res.json();
 if(!data||typeof data!=='object')throw Error('پاسخ سرور برای '+path+' معتبر نیست.');
 return data;
}
function validateTenant(rows,label){
 for(const row of rows){
  if(row&&row.shop_id&&String(row.shop_id)!==shop.id)
   throw Error('شناسه فروشگاه در '+label+' هم‌خوانی ندارد؛ خروجی ساخته نشد.');
 }
}
async function authorize(){
 const data=await request('/api/auth/me'),user=data.user;
 if(user?.rentalRole!=='shop_admin'||!user?.rentalShopId||String(user.rentalShopId)!==String(data.rentalShop?.id||''))
  throw Error('پشتیبان‌گیری فقط با حساب مدیر همین فروشگاه امکان‌پذیر است.');
 shop={id:String(user.rentalShopId),name:String(data.rentalShop.name||'فروشگاه')};
 $('start').disabled=false;
 progress(0,'حساب مدیر فروشگاه «'+shop.name+'» تأیید شد؛ برای شروع دکمه را بزنید.');
}
function saveFile(data){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
 const link=document.createElement('a'),url=URL.createObjectURL(blob);
 link.href=url;link.download='PhotoBridge-Store-Finance-Backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
 link.hidden=true;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
 return blob.size;
}
async function run(){
 if(active||!shop)return;
 active=true;$('start').disabled=true;
 try{
  progress(5,'دریافت اطلاعات مالی فروشگاه و طرف‌حساب‌ها…');
  const overview=await request('/api/rental/overview');
  if(String(overview.shop?.id||'')!==shop.id)throw Error('فروشگاه فعال تغییر کرده است؛ دوباره وارد شوید.');
  const customers=(Array.isArray(overview.photographers)?overview.photographers:[]).map(row=>({
   user_id:row.user_id,name:row.name,mobile:row.mobile,active:row.active,
   opening_debt:row.opening_debt,current_balance:row.current_balance,settlement_mode:row.settlement_mode
  }));
  const sales=Array.isArray(overview.saleOrders)?overview.saleOrders:[];
  validateTenant(sales,'اسناد فروش');
  progress(25,'دریافت فاکتورها، بدهی‌ها و دریافت‌ها…');
  const financial=await request('/api/rental/accounting');
  const invoices=Array.isArray(financial.invoices)?financial.invoices:[],recent=Array.isArray(financial.entries)?financial.entries:[],balances=Array.isArray(financial.balances)?financial.balances:[];
  validateTenant(recent,'اسناد حسابداری');
  validateTenant(invoices,'فاکتورهای اجاره');
  const ids=[...new Set(balances.map(row=>String(row.user_id||'')))].filter(id=>/^[\da-f]{8}-[\da-f-]{27}$/i.test(id));
  const ledgers=[],received=new Map(),limits=[];
  if(sales.length>=200)limits.push('فهرست اسناد فروش API ممکن است بعد از ۲۰۰ مورد کوتاه شده باشد.');
  if(invoices.length>=1000)limits.push('فهرست فاکتورهای اجاره API ممکن است بعد از ۱۰۰۰ مورد کوتاه شده باشد.');
  if(recent.length>=300)limits.push('لیست عمومی گردش مالی API حداکثر ۳۰۰ سند جدید را بازمی‌گرداند؛ حساب معین جداگانه دریافت شد.');
  for(const entry of recent)if(entry?.entry_type==='payment'&&entry.id)received.set(String(entry.id),entry);
  for(let i=0;i<ids.length;i++){
   progress(40+Math.round(i/Math.max(ids.length,1)*44),'دریافت حساب معین عکاس '+formatNum(i+1)+' از '+formatNum(ids.length)+'…');
   const id=ids[i],ledger=await request('/api/rental/accounting/ledger?photographerId='+encodeURIComponent(id));
   if(String(ledger.photographerId||'')!==id)throw Error('پاسخ حساب معین مربوط به عکاس دیگری است.');
   const rows=Array.isArray(ledger.entries)?ledger.entries:[];
   validateTenant(rows,'حساب معین');
   if(rows.length>=5000)limits.push('حساب معین '+id+' ممکن است به سقف ۵۰۰۰ سند API رسیده باشد.');
   for(const entry of rows)if(entry?.entry_type==='payment'&&entry.id)received.set(String(entry.id),entry);
   ledgers.push({photographerId:id,openingBalance:ledger.openingBalance,summary:ledger.summary,entries:rows});
  }
  if(customers.some(row=>row.active===false))
   limits.push('حساب معین اعضای غیرفعال از API عمومی قابل‌دریافت نیست.');
  progress(91,'ساخت خروجی فاکتورها، دریافتی‌ها، حساب معین و اسناد فروش…');
  const backup={
   format:'photobridge-store-finance-readable-snapshot',version:1,
   generatedAt:new Date().toISOString(),
   scope:'current-authorized-rental-shop-finance-API-results',
   store:shop,restoreSupported:false,
   limitations:[
    'not a PostgreSQL/SQLite/Access database backup',
    'not a restore archive; this JSON cannot restore PhotoBridge',
    'no order archive, photographs, PDFs or local Windows data included',
    'API results can be paginated or limited',
    ...limits
   ],
   datasets:{counterparties:customers,summary:financial.summary||{},
    balances,rentalInvoices:invoices,salesDocuments:sales,
    receipts:[...received.values()],recentEntries:recent,ledgerByPhotographer:ledgers}
  };
  progress(95,'کنترل و آماده‌سازی دانلود…');
  const bytes=saveFile(backup);
  progress(100,'فایل مالی فروشگاه ذخیره شد ('+formatNum(bytes)+' بایت).'+(limits.length?' محدودیت‌های احتمالی در فایل ثبت شده‌اند.':''),'complete');
 }catch(error){
  progress(Number($('backupProgress').getAttribute('aria-valuenow'))||0,'پشتیبان‌گیری کامل نشد: '+String(error.message||error),'error');
 }finally{active=false;$('start').disabled=!shop;}
}
$('start').addEventListener('click',()=>{void run();});
authorize().catch(error=>progress(0,String(error.message||error),'error'));
})();