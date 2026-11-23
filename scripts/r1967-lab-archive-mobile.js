/* R1967 Lab archive/day-finance and mobile queue controls. */
(()=>{
'use strict';
if(window.__PB1967_LAB__)return;window.__PB1967_LAB__=true;
const fmt=new Intl.NumberFormat('fa-IR'),money=n=>fmt.format(Number(n)||0)+' تومان';
const make=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!=null)x.textContent=String(txt);return x;};
let frame=0;
function mount(){
 if(!matchMedia('(max-width:820px)').matches){document.documentElement.classList.remove('pb1967LabMobileChromeReady');document.querySelectorAll('.pb1967StatusBar,.pb1967ManualOrder').forEach(x=>x.remove());return;}
 const host=document.querySelector('#root .labRoleWorkspace main.labPrimaryConnectorMode > .pb1955ThirdHeaderHost');
 if(!host||!host.querySelector('.r1955ThirdHeader')){document.documentElement.classList.remove('pb1967LabMobileChromeReady');return;}
 let bar=host.querySelector(':scope > .pb1967StatusBar');
 if(!bar){bar=make('nav','pb1967StatusBar');bar.setAttribute('aria-label','وضعیت سفارش‌های لابراتوار');host.append(bar);}
 for(let i=0;i<3;i++){
  const source=document.querySelector('#root .labQueueStickyBar .queueFilters.mainQueueFilters.compactQueueFilters > button:nth-child('+(i+1)+')');
  let btn=bar.querySelector('[data-pb1967-tab="'+i+'"]');
  if(!btn){btn=make('button','pb1967StatusButton');btn.type='button';btn.dataset.pb1967Tab=String(i);bar.append(btn);}
  btn.hidden=!source;if(!source)continue;
  if(btn.textContent!==source.textContent.trim())btn.textContent=source.textContent.trim();
  const active=source.classList.contains('active');
  btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
  if(!btn.dataset.wired){btn.dataset.wired='1';btn.onclick=()=>{
   document.querySelector('#root .labQueueStickyBar .queueFilters.mainQueueFilters.compactQueueFilters > button:nth-child('+(i+1)+')')?.click();
   requestAnimationFrame(schedule);
  };}
 }
 let onsite=host.querySelector(':scope > .pb1967ManualOrder');
 if(!onsite){
  onsite=make('button','pb1967ManualOrder','＋ سفارش حضوری');
  onsite.type='button';host.append(onsite);
 }
 if(onsite.textContent!=='＋ سفارش حضوری')onsite.textContent='＋ سفارش حضوری';
 onsite.title='ثبت سفارش حضوری لابراتوار با انتخاب عکاس، عکس، سایز و کاغذ';
 onsite.onclick=()=>{
  const open=window.pb1969OpenLabOnsiteOrder;
  if(typeof open==='function')open();
  else alert('فرم سفارش حضوری هنوز بارگذاری نشده است. صفحه را تازه‌سازی کنید.');
 };
 document.documentElement.classList.add('pb1967LabMobileChromeReady');
}
function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;mount()});}
let popup=null,seq=0,abort=null,prior=null,openDay='';
function dismiss(){
 seq++;abort?.abort();abort=null;popup?.remove();popup=null;openDay='';
 document.documentElement.classList.remove('pb1967FinanceShowing');
 if(prior?.isConnected)prior.focus({preventScroll:true});prior=null;
}
function summary(data,target){
 target.replaceChildren();
 const grid=make('div','pb1967FinanceGrid');
 for(const item of [
  ['تعداد فاکتور',fmt.format(Number(data.invoiceCount)||0)],
  ['جمع فاکتورها',money(data.invoiceTotal)],
  ['تعداد دریافت',fmt.format(Number(data.paymentCount)||0)],
  ['جمع دریافتی روز',money(data.paymentTotal)]
 ]){
  const box=make('div','pb1967FinanceMetric');
  box.append(make('small','',item[0]),make('strong','',item[1]));grid.append(box);
 }
 target.append(grid,make('p','pb1967FinanceNote','فاکتورها براساس روز صدور و دریافتی‌ها براساس روز ثبت پرداخت به وقت تهران محاسبه می‌شوند، حتی اگر به سفارش قدیمی‌تری مربوط باشند.'),make('h3','pb1967FinanceSubhead','فاکتورهای صادرشده در این روز'));
 const list=make('div','pb1967FinanceList');
 const invoices=Array.isArray(data.invoices)?data.invoices:[];
 for(const item of invoices){
  const row=make('div','pb1967FinanceItem'),detail=make('div','pb1967FinanceItemDetail');
  detail.append(make('b','','فاکتور #'+fmt.format(Number(item.number)||0)),make('small','',item.customerName||'مشتری آزاد'));
  row.append(detail,make('strong','',money(item.amount)));list.append(row);
 }
 if(!invoices.length)list.append(make('p','pb1967FinanceEmpty','در این روز فاکتوری صادر نشده است.'));
 target.append(list);
}
async function show(day){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return;
 if(popup?.isConnected&&openDay===day)return; // Main React event and delegated click must not double-open.
 dismiss();openDay=day;prior=document.activeElement;const current=++seq;
 const shade=make('div','pb1967FinanceBackdrop'),dialog=make('section','pb1967FinanceDialog');
 dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','pb1967FinanceTitle');
 const head=make('header','pb1967FinanceHead');
 const title=make('h2','','خلاصه مالی · '+day.split('-').map(n=>fmt.format(Number(n))).join('/'));
 title.id='pb1967FinanceTitle';
 const close=make('button','pb1967FinanceClose','×');close.type='button';close.setAttribute('aria-label','بستن');
 close.onclick=dismiss;head.append(title,close);
 const body=make('div','pb1967FinanceBody');body.setAttribute('aria-live','polite');
 body.append(make('p','pb1967FinanceLoading','در حال دریافت اطلاعات مالی…'));
 dialog.append(head,body);shade.append(dialog);document.body.append(shade);popup=shade;
 document.documentElement.classList.add('pb1967FinanceShowing');
 shade.addEventListener('mousedown',e=>{if(e.target===shade)dismiss()});close.focus({preventScroll:true});
 abort=new AbortController();
 try{
  const response=await fetch('/api/lab/archive/day-finance?day='+encodeURIComponent(day),{credentials:'same-origin',cache:'no-store',signal:abort.signal});
  if(!response.ok)throw Error(response.status===403?'دسترسی به اطلاعات مالی این لابراتوار مجاز نیست.':'دریافت اطلاعات مالی انجام نشد.');
  const data=await response.json();if(current===seq&&popup)summary(data,body);
 }catch(error){
  if(current!==seq||!popup||error.name==='AbortError')return;
  body.replaceChildren(make('p','pb1967FinanceError',error.message||'ارتباط با سرور برقرار نشد.'));
  const retry=make('button','pb1967FinanceRetry','تلاش دوباره');retry.type='button';retry.onclick=()=>show(day);body.append(retry);
 }
}
// R1968: delegated native calendar click; robust even if an older cached React bundle misses the custom event.
const pb1968Months=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
function pb1968LatinDigits(value){
 const fa='۰۱۲۳۴۵۶۷۸۹',ar='٠١٢٣٤٥٦٧٨٩';
 return String(value||'').replace(/[۰-۹٠-٩]/g,digit=>String((fa.includes(digit)?fa:ar).indexOf(digit)));
}
function pb1968ArchiveDateKey(headerText,dayText){
 const heading=pb1968LatinDigits(headerText).replace(/\u200c/g,' ');
 const year=Number(heading.match(/\b\d{4}\b/)?.[0]||0);
 const month=pb1968Months.findIndex(name=>heading.includes(name))+1;
 const day=Number(pb1968LatinDigits(dayText).trim());
 if(year<1300||year>1700||month<1||day<1||day>31)return null;
 return [year,String(month).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
}
function pb1968ArchiveDayClick(event){
 const target=event.target?.nodeType===1?event.target:event.target?.parentElement;
 const cell=target?.closest?.('.labArchiveWorkspace .persianCalendarCard .calendarGrid button');
 if(!cell)return;
 const card=cell.closest('.persianCalendarCard');
 const day=pb1968ArchiveDateKey(card?.querySelector('.calendarHead b')?.textContent,cell.querySelector('b')?.textContent);
 if(day)void show(day); // Capture phase precedes React state updates; keep native selection intact.
}
document.addEventListener('click',pb1968ArchiveDayClick,true);
window.addEventListener('pb1967-lab-archive-day',e=>{if(e.detail?.role==='lab')void show(String(e.detail.day||''));});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&popup){e.preventDefault();dismiss();}});
function start(){
 schedule();
 new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
 addEventListener('resize',schedule,{passive:true});addEventListener('popstate',schedule);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
