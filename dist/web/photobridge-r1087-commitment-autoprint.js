/* PhotoBridge R1087: print receiver for confirmed equipment handovers.
 * A phone commits the handover on the server; only a signed-in desktop session with
 * this receiver enabled may print the already-generated commitment document.
 * Browsers can show a print dialog, but cannot guarantee silent physical printing.
 */
(()=>{
 'use strict';
 if(window.__pbR1087PrintReceiver)return;
 window.__pbR1087PrintReceiver=true;
 const mobile=()=>matchMedia('(max-width:850px)').matches||/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'');
 if(mobile())return;
 const optKey='pbR1087:autoPrintEnabled',ledgerPrefix='pbR1087:printed:',leaderPrefix='pbR1087:leader:';
 const uid='receiver-'+Math.random().toString(36).slice(2)+Date.now().toString(36);
 const get=(k)=>{try{return localStorage.getItem(k)}catch{return null}};
 const put=(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}};
 const native=!!window.__PB_DESKTOP_FETCH__||!!window.__PB_DESKTOP_OVERLAY_101__;
 let enabled=get(optKey)==='1'||(get(optKey)===null&&native);
 let active=false,receiving=false,currentShop='',lastError='',lastName='',lastId='',button=null,pending=[],lastOverview=null;
 let pendingPrint=false,printed=0,initializing=false;
 const parse=s=>{try{return JSON.parse(s)}catch{return null}};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const handed=b=>String(b?.status)==='picked_up';
 const handoverTime=b=>String(b?.handover_serials_recorded_at||b?.updated_at||'');
 const key=b=>String(b.id)+'|'+handoverTime(b);
 const oldestFirst=(a,b)=>handoverTime(a).localeCompare(handoverTime(b))||String(a.id).localeCompare(String(b.id));
 const persisted=()=>parse(get(ledgerPrefix+currentShop))||{};
 const writeLedger=ledger=>put(ledgerPrefix+currentShop,JSON.stringify(Object.fromEntries(Object.entries(ledger).slice(-650))));
 function isLeader(){
  if(!currentShop)return false;
  const k=leaderPrefix+currentShop,now=Date.now(),old=parse(get(k));
  if(old&&old.id!==uid&&old.until>now)return false;
  if(!put(k,JSON.stringify({id:uid,until:now+18000})))return true;
  return parse(get(k))?.id===uid;
 }
 function paint(){
  if(!button)return;
  button.textContent='تعهدنامه خودکار: '+(enabled?'روشن':'خاموش')+(pendingPrint?' · در حال چاپ':lastError?' · نیاز به بررسی':'');
  button.setAttribute('aria-pressed',enabled?'true':'false');
  button.title=lastError?lastError:enabled?'دریافت خودکار تعهدنامه پس از تحویل تجهیزات از موبایل یا کامپیوتر؛ مرورگر ممکن است پنجره چاپ را نشان دهد.':'فعال‌کردن چاپ خودکار تعهدنامه روی همین کامپیوتر';
  button.style.background=enabled?'#ebfff5':'#f2f4f7';
  button.style.color=enabled?'#08764a':'#344054';
 }
 function mount(){
  const header=document.querySelector('header.top')||document.querySelector('#rentalHeader')||document.querySelector('header');
  if(!header||!document.body.classList.contains('rentalAppReady')){if(button)button.hidden=true;return}
  if(!button){
   button=document.createElement('button');button.type='button';button.id='pbR1087AutoPrint';button.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-height:28px;max-width:190px;white-space:nowrap;padding:4px 9px;border:1px solid #d0d5dd;border-radius:8px;font:600 11px/1.4 Vazirmatn,Tahoma,sans-serif;cursor:pointer;direction:rtl;vertical-align:middle;margin-inline:8px;box-shadow:none;';
   button.addEventListener('click',()=>{
    enabled=!enabled;put(optKey,enabled?'1':'0');lastError='';paint();
    if(enabled)void check();
   });
  }
  if(!header.contains(button))header.appendChild(button);
  button.hidden=false;paint();
 }
 function notice(text){
  lastError=text;paint();window.console?.warn?.('[PhotoBridge automatic commitment printing]',text);
 }
 function printDocument(b,{retry=false}={}){
  return new Promise(async resolve=>{
   const ident=key(b);
   try{
    if(!currentShop||!isLeader()){resolve(false);return}
    const res=await fetch('/api/rental/bookings/'+encodeURIComponent(b.id)+'/commitment',{credentials:'include',cache:'no-store'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const html=await res.text();
    if(!html||!/<!doctype|<html/i.test(html))throw new Error('پاسخ تعهدنامه معتبر نیست');
    const frame=document.createElement('iframe');frame.title='تعهدنامه '+String(b.photographer_name||b.customer_name||b.id);
    frame.setAttribute('aria-hidden','true');
    frame.style.cssText='position:fixed;top:0;left:-10000px;width:794px;height:1123px;border:0;opacity:0;pointer-events:none;';
    let finished=false;
    const done=ok=>{
     if(finished)return;finished=true;pendingPrint=false;paint();setTimeout(()=>frame.remove(),1200);resolve(ok);
    };
    const timeout=setTimeout(()=>{if(!finished){notice('چاپ به موقع شروع نشد؛ از دکمه تعهدنامه برای چاپ دستی استفاده کنید.');done(false)}},16000);
    frame.onload=()=>{
     try{
      if(finished)return;
      const printedLedger=persisted();
      // Mark at dispatch time, so a cancelled print dialog cannot cause repeated automatic printouts.
      printedLedger[ident]=new Date().toISOString();writeLedger(printedLedger);
      lastId=b.id;lastName=b.photographer_name||b.customer_name||'مشتری';
      frame.contentWindow?.addEventListener('afterprint',()=>{clearTimeout(timeout);done(true)},{once:true});
      frame.contentWindow?.focus();
      if(typeof frame.contentWindow?.print!=='function')throw new Error('Browser print unavailable');
      frame.contentWindow.print();
      printed++;
      setTimeout(()=>{clearTimeout(timeout);done(true)},1800);
     }catch(e){
      const ledger=persisted();delete ledger[ident];writeLedger(ledger);
      clearTimeout(timeout);notice('امکان اجرای چاپ خودکار وجود ندارد؛ تعهدنامه را دستی چاپ کنید.');done(false);
     }
    };
    frame.onerror=()=>{clearTimeout(timeout);notice('بارگذاری تعهدنامه ناموفق بود.');done(false)};
    pendingPrint=true;paint();
    // srcdoc is same-origin and uses the server's complete handover document.
    frame.srcdoc=html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'');
    document.body.appendChild(frame);
   }catch(e){notice('دریافت تعهدنامه انجام نشد: '+String(e?.message||e));pendingPrint=false;paint();resolve(false)}
  });
 }
 function collect(rows){
  if(!currentShop||!Array.isArray(rows))return;
  const stamped=rows.filter(b=>b?.id&&handed(b));
  const ledger=persisted(),ledgerKey=ledgerPrefix+currentShop;
  if(!get(ledgerKey)){
   // Avoid bulk-printing older handovers the first time a machine is enrolled.
   const baseline={};
   for(const b of stamped)baseline[key(b)]='baseline';
   writeLedger(baseline);
   return;
  }
  const unseen=stamped.filter(b=>!ledger[key(b)]).sort(oldestFirst);
  for(const b of unseen)if(!pending.some(x=>key(x)===key(b)))pending.push(b);
 }
 async function drain(){
  if(receiving||!enabled||!isLeader())return;
  receiving=true;
  try{
   while(enabled&&pending.length){
    const b=pending.shift();
    if(persisted()[key(b)])continue;
    const ok=await printDocument(b);
    if(!ok)break;
   }
  }finally{receiving=false}
 }
 async function check(){
  if(active||!enabled||mobile())return;
  active=true;
  try{
   const response=await fetch('/api/rental/overview',{credentials:'include',cache:'no-store'});
   if(!response.ok)return;
   const overview=await response.json();
   const shopId=String(overview?.shop?.id||'');
   if(!shopId||!Array.isArray(overview.bookings))return;
   if(shopId!==currentShop){pending=[];currentShop=shopId;lastOverview=null}
   lastOverview=overview;
   mount();
   if(!isLeader())return;
   collect(overview.bookings);
   await drain();
  }catch(e){if(enabled)lastError='ارتباط با سرور برای بررسی چاپ برقرار نیست';paint()}
  finally{active=false}
 }
 window.pbR1087AutoPrint={checkNow:check,enabled:()=>enabled,pending:()=>pending.length};
 function lifecycle(){mount();if(enabled)void check()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',lifecycle,{once:true});else lifecycle();
 setInterval(()=>{mount();if(enabled)void check()},6000);
 window.addEventListener('online',()=>{if(enabled)void check()});
})();
