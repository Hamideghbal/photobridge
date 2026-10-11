/* R1097 — actionable red follow-up counters, shared by Store mobile and Windows. */
(()=>{
 'use strict';
 if(window.__PB_R1097_ATTENTION__)return;
 window.__PB_R1097_ATTENTION__=true;
 const all=q=>[...document.querySelectorAll(q)];
 const small=n=>Number(n)>99?'۹۹+':Number(n).toLocaleString('fa-IR');
 const integer=v=>Math.max(0,Math.min(100000,Math.floor(Number(v)||0)));
 const current=()=>{try{return typeof data==='undefined'?null:data}catch{return null}};
 const today=()=>{try{const p=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const find=x=>p.find(v=>v.type===x)?.value||'';return find('year')+'-'+find('month')+'-'+find('day')}catch{return new Date().toISOString().slice(0,10)}};
 const countsFrom=state=>{
  const bookings=Array.isArray(state?.bookings)?state.bookings:[];
  const day=today();
  const shortages=Array.isArray(state?.shortages)?state.shortages:[];
  const returns=Array.isArray(state?.returnShortages)?state.returnShortages:[];
  return {
   pendingBookings:bookings.filter(b=>b.status==='pending_approval').length,
   handoverDue:bookings.filter(b=>b.status==='reserved'&&String(b.rental_start||'').slice(0,10)<=day).length,
   returnDue:bookings.filter(b=>b.status==='picked_up'&&String(b.rental_end||'').slice(0,10)<=day).length,
   rentalShortages:shortages.filter(s=>
    ((s.status||'pending')!=='provided'&&!s.resolved_at&&!s.booking_cancelled_at)
    ||(s.booking_cancelled_at&&!s.external_cancellation_acknowledged_at)).length,
   returnShortages:returns.filter(s=>s.status==='missing'&&!s.resolved_at).length,
   saleOrders:(state?.saleOrders||[]).filter(s=>s.status==='pending').length,
   collaborations:(state?.collaborationRequests||[]).filter(r=>r.status==='pending').length
  };
 };
 const parts=(c,key)=>({
  bookings:[['pendingBookings','درخواست آفیش'],['rentalShortages','کسری آفیش'],['returnShortages','کسری دریافت'],['handoverDue','تحویل سررسیدشده'],['returnDue','دریافت سررسیدشده']],
  sales:[['saleOrders','سفارش خرید جدید']],
  photographers:[['collaborations','درخواست همکاری']],
  pending:[['pendingBookings','درخواست آفیش']],
  shortages:[['rentalShortages','کسری آفیش']],
  requests:[['collaborations','درخواست همکاری']]
 }[key]||[]).filter(([k])=>integer(c?.[k])>0);
 const total=(c,key)=>parts(c,key).reduce((sum,[k])=>sum+integer(c[k]),0);
 const label=(c,key)=>parts(c,key).map(([k,title])=>title+': '+small(c[k])).join('، ');
 const targets={
  bookings:'[data-rental-desktop-tab="bookings"],[data-rental-bottom-tab="bookings"]',
  sales:'[data-rental-desktop-tab="sales"],[data-rental-bottom-tab="sales"]',
  photographers:'[data-rental-desktop-tab="photographers"],[data-rental-bottom-tab="photographers"],[data-rental-tab="photographers"]',
  pending:'[data-pb843-office-tab="pending"]',
  shortages:'[data-pb843-office-tab="shortages"]',
  requests:'[data-pb842-tabs="photographers"] [data-pb842-tab="requests"]'
 };
 function paintCount(button,key,counts){
  if(!button)return;
  const n=total(counts,key),info=label(counts,key);
  const before=button.querySelector(':scope > .pbR1097AttentionBadge');
  let badge=before;
  if(n>0&&!badge){badge=document.createElement('span');badge.className='pbR1097AttentionBadge';badge.setAttribute('aria-hidden','true');button.append(badge)}
  if(n===0&&badge){badge.remove();badge=null}
  if(badge&&badge.textContent!==small(n))badge.textContent=small(n);
  button.classList.toggle('pbR1097AttentionOn',n>0);
  if(!button.dataset.pbR1097BaseLabel){
   button.dataset.pbR1097BaseLabel=(button.getAttribute('aria-label')||button.textContent||'پیگیری').trim();
   button.dataset.pbR1097BaseTitle=button.getAttribute('title')||'';
  }
  const name=button.dataset.pbR1097BaseLabel;
  const accessible=n>0?name+'، '+info:name;
  if(button.getAttribute('aria-label')!==accessible)button.setAttribute('aria-label',accessible);
  const tooltip=n>0?info:button.dataset.pbR1097BaseTitle;
  if(button.title!==tooltip)button.title=tooltip;
 }
 function paint(counts){
  if(!counts)return;
  document.body.classList.add('pbR1097AttentionReady');
  for(const [key,selector]of Object.entries(targets))for(const el of all(selector))paintCount(el,key,counts);
 }
 let shop='',remote=null,localRevision='',busy=false,lastPoll=0;
 function syncLocal(){
  if(!document.body.classList.contains('rentalAppReady'))return;
  const state=current(),id=String(state?.shop?.id||'');
  if(!id)return;
  if(shop!==id){shop=id;remote=null;lastPoll=0;localRevision=''}
  const revision=[state?.bookings?.length,state?.saleOrders?.length,state?.shortages?.length,state?.returnShortages?.length,state?.collaborationRequests?.length].join('|');
  if(!remote||revision!==localRevision){localRevision=revision;if(!remote)paint(countsFrom(state))}
  else paint(remote);
 }
 async function poll(force=false){
  if(document.hidden||busy||!document.body.classList.contains('rentalAppReady'))return;
  syncLocal();if(!shop)return;
  if(!force&&Date.now()-lastPoll<18000)return;
  const queriedShop=shop;busy=true;lastPoll=Date.now();
  try{
   const response=await fetch('/api/rental/attention-counts',{credentials:'same-origin',cache:'no-store'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const json=await response.json();
   if(String(json?.shopId||'')!==queriedShop||!json?.counts)return;
   remote=json.counts;paint(remote);
  }catch{if(!remote)paint(countsFrom(current()))}
  finally{busy=false}
 }
 let delayed=null;
 function schedule(){
  if(delayed)clearTimeout(delayed);
  delayed=setTimeout(()=>{delayed=null;void poll(true)},1150);
 }
 function start(){
  syncLocal();void poll(true);
  setInterval(()=>{syncLocal();void poll(false)},4500);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
  window.addEventListener('online',schedule);
  document.addEventListener('click',event=>{
   if(event.target.closest?.('#bookings,#sales,#photographers,[data-pb843-office-tab],[data-pb842-tab],[data-rental-desktop-tab]'))schedule();
  },false);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.pbR1097Attention={countsFrom,poll,paint};
})();
