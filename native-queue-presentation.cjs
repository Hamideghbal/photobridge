'use strict';

function normalizeQueueSearch(value){
 return String(value??'').trim().replace(/[۰-۹٠-٩]/g,digit=>String(digit.charCodeAt(0)&15));
}

function patchNativeQueuePresentation(source) {
 const marker='/* PB1944 server-paged lab queue */';
 const start=source.indexOf(marker);
 const cards='children:Be.length?Nt.map(';
 const cardAt=source.indexOf(cards,start);
 const pendingGuard='if(!pbLiveOrders.current.active||seq!==pbLiveOrders.current.seq)return;';
 const afterSuccess='r1944SetCounts(old=>';
 const onError='if(seq===pbLiveOrders.current.seq)r1944SetError(';
 if(start<0||cardAt<0||cardAt-start>70000||source.includes('const pbNativePageKey='))return source;
 const queue=source.slice(start,cardAt+cards.length);
 const success=queue.indexOf(afterSuccess),failure=queue.indexOf(onError,success+afterSuccess.length);
 if(!queue.includes(pendingGuard)||success<0||failure<0)return source;
 const reportFailure='if(pbLiveOrders.current.active&&seq===pbLiveOrders.current.seq)pbNativeSetPageResult(previous=>previous?.key===pbNativePageKey&&previous.ok?previous:{key:pbNativePageKey,ok:false});';
 const withFailure=queue.slice(0,failure)+reportFailure+queue.slice(failure);

 const state=`
 ${normalizeQueueSearch.toString().replace('function normalizeQueueSearch','function pbNativeQueueSearch')}
 const [pbNativePageResult,pbNativeSetPageResult]=x.useState(null);
 const pbNativeRequestQuery=pbNativeQueueSearch(r1944DebouncedQuery);
 const pbNativeSearchText=value=>pbNativeQueueSearch(value).toLowerCase().replace(/ي/g,"ی").replace(/ك/g,"ک");
 const pbNativeSearchInput=typeof r1944Query==="undefined"?pbNativeRequestQuery:pbNativeQueueSearch(r1944Query);
 const pbNativePageKey=JSON.stringify([t?.id,o,T,r1944Page,pbNativeRequestQuery]);
 const pbNativePageLoading=pbNativeSearchInput!==pbNativeRequestQuery||pbNativePageResult?.key!==pbNativePageKey;
 const pbNativeVisiblePage=x.useRef(pbNativePageKey);
 pbNativeVisiblePage.current=pbNativePageKey;
 const pbNativeDetailRequest=x.useRef(0);
 const pbNativeOpeningPage=x.useRef(pbNativePageKey);
 pbNativeOpeningPage.current=pbNativePageLoading?pbNativePageKey:null;
 `;
 const skeleton=`Array.from({length:6},(_,index)=>e.jsxs("article",{
  className:"pbNativeQueueSkeleton card customerOrderCard liveOrderCard labOrderCard",
  "aria-hidden":true,
  children:[
   e.jsxs("div",{className:"customerOrderHead labOrderHead",children:[
    e.jsxs("div",{children:[e.jsx("i",{className:"pbNativeSkeletonLine",style:{width:62}}),e.jsx("i",{className:"pbNativeSkeletonLine",style:{width:40}})]}),
    e.jsx("i",{className:"pbNativeSkeletonBadge"})
   ]}),
   e.jsx("div",{className:"customerOrderFacts labOrderFacts",children:Array.from({length:3},(_,fact)=>
    e.jsxs("span",{children:[e.jsx("i",{className:"pbNativeSkeletonLine"}),e.jsx("i",{className:"pbNativeSkeletonLine"})]},fact))}),
   e.jsx("div",{className:"labActionTimeline",children:Array.from({length:4},(_,stage)=>
    e.jsxs("button",{type:"button",disabled:true,children:[e.jsx("span",{className:"timelineDot"}),e.jsx("i",{className:"pbNativeSkeletonLine"})]},stage))}),
   e.jsxs("div",{className:"labOrderFoot",children:[
    e.jsx("span",{children:e.jsx("i",{className:"pbNativeSkeletonLine"})}),
    e.jsxs("div",{className:"labOrderMiniActions",children:[e.jsx("i",{}),e.jsx("i",{})]})
   ]})
  ]
 },index))`;
 const failurePanel=`e.jsxs("div",{className:"pbNativeQueueError",role:"status",children:[e.jsx("span",{children:"دریافت سفارش‌ها انجام نشد."}),e.jsx("button",{type:"button",onClick:()=>{pbNativeSetPageResult(null);void ye().catch(()=>{});},children:"تلاش دوباره"})]})`;
 const patched=withFailure
  .replace(marker,marker+state)
  .replace('String(r1944DebouncedQuery||"").trim()','pbNativeRequestQuery')
  .replace('"&pbNativeLiveStatus="+Date.now();','"&pbNativeLiveStatus="+Date.now()+(pbNativeOpeningPage.current===pbNativePageKey?"&pbNativeOpen=1":"");')
  .replace('if(status===401||status===403)throw error;','if(status!==502||error?.data?.error!=="invalid_paged_orders"||!query||Array.from(query).length>2)throw error;')
  .replace('const timer=setInterval(refresh,3000);','const timer=setInterval(()=>{if(document.hasFocus())void refresh();},3000);')
  .replace('const cached=await pb1945Legacy();','const cached=await Me("/api/lab/orders",{signal:AbortSignal.timeout(2000)}).then(data=>({...data,__pb1945Legacy:true}));')
  .replace('value:r1944Query,onChange:le=>r1944SetQuery(le.target.value)', 'value:r1944Query,maxLength:100,onChange:le=>{r1944SetQuery(le.target.value);r1944SetPage(1)}')
  .replace('String([le.number,le.customer_name,le.customer_mobile,le.folder_latin_name,le.invoice_number].join(" ")).toLowerCase().includes(query.toLowerCase())','[le.number,le.customer_name,le.customer_mobile,le.folder_latin_name,le.invoice_number,...(Array.isArray(le.files)?le.files.map(file=>file.original_name||file.name):[])].some(value=>pbNativeSearchText(value).includes(pbNativeSearchText(query)))')
  .replace('r1944SetDebouncedQuery(String(r1944Query||"")),270','r1944SetDebouncedQuery(pbNativeQueueSearch(r1944Query)),110')
  .replace("x.useLayoutEffect(()=>{const main=document.querySelector('main.pageMain.pbFixedRoleHeader.labPrimaryConnectorMode')","x.useLayoutEffect(()=>{if(h){r1955SetHost(null);return;}const main=document.querySelector('main.pageMain.pbFixedRoleHeader.labPrimaryConnectorMode')")
  .replace("document.documentElement.classList.remove('pb1956LabThirdHeader');host.remove()}},[])", "document.documentElement.classList.remove('pb1956LabThirdHeader');document.documentElement.style.removeProperty('--pb1956-third-bottom');host.remove()}},[Boolean(h),o])")
  .replace('const _pbKey=String(le.id),_pbCached=', 'const pbDetailRequest=++pbNativeDetailRequest.current,pbDetailPath=location.pathname;const _pbKey=String(le.id),_pbCached=')
  .replace('data:Mt}),I(Mt),S(xt.order)', 'data:Mt});if(pbDetailRequest===pbNativeDetailRequest.current&&location.pathname===pbDetailPath){I(Mt);S(xt.order)}')
  .replace('onClick:()=>{S(null),I(null),Dn(ur(T,"",l),!0)}','onClick:()=>{++pbNativeDetailRequest.current;S(null);I(null);Dn(ur(T,"",l),!0)}')
  .replace(afterSuccess,'pbNativeSetPageResult(previous=>previous?.key===pbNativePageKey&&previous.ok?previous:{key:pbNativePageKey,ok:true});'+afterSuccess)
  .replace(cards,`"aria-busy":pbNativePageLoading,"aria-label":"سفارش‌ها",children:pbNativePageLoading?${skeleton}:!pbNativePageResult?.ok?${failurePanel}:Be.length?Nt.map(`);
 return source.slice(0,start)+patched+source.slice(cardAt+cards.length);
}

function removeConfirmedOrderExitWait(source){
 const stateUpdate=/if\((Mt|result)\.order\)\{await window\.pb1631ExitOrder\?\.\(le\.id,nt,T\);f\(rows=>rows\.map\(row=>row\.id===le\.id\?\{\.\.\.row,\.\.\.\1\.order\}:row\)\);\}/g;
 const samePage=source.includes("const pbNativeVisiblePage=")?"&&pbLiveOrders.current.active&&pbNativeVisiblePage.current===pbNativePageKey":"";
 return source.replace(stateUpdate,(_,result)=>`if(${result}.order${samePage}){
  const pbNativeMoved=(nt==="ready"||nt==="completed")&&T!==nt&&${result}.order.status===nt;
  if(pbNativeMoved)window.pb1631ExitOrder?.(le.id,nt,T);
  f(rows=>pbNativeMoved?rows.filter(row=>row.id!==le.id):rows.map(row=>row.id===le.id?{...row,...${result}.order}:row));
 }`).replaceAll('await window.pb1631ExitOrder?.(le.id,nt,T);','');
}

function reflowOrderCards(id,stage,from){
 if(stage===from||document.hidden||reduced())return;
 const outgoing=[...document.querySelectorAll('.labOrderCard[data-order-id]')]
   .find(node=>node.dataset.orderId===String(id));
 const list=outgoing?.parentElement;
 if(!list)return;
 const animations=reflowOrderCards.animations||=new WeakMap();
 const before=new Map([...list.querySelectorAll(':scope>.labOrderCard[data-order-id]')]
   .filter(card=>card!==outgoing).map(card=>[card,card.getBoundingClientRect()]));
 const observer=new MutationObserver(()=>{
  if(outgoing.parentElement===list)return;
  observer.disconnect();clearTimeout(expiry);
  const changes=[];
  for(const card of before.keys())animations.get(card)?.cancel();
  for(const[card,previous]of before){
   if(card.parentElement!==list)continue;
   const next=card.getBoundingClientRect(),x=previous.left-next.left,y=previous.top-next.top;
   if(x||y)changes.push({card,x,y});
  }
  for(const{card,x,y}of changes){
   if(typeof card.animate!=='function')continue;
   animations.set(card,card.animate(
    [{translate:`${x}px ${y}px`},{translate:'0px 0px'}],
    {duration:220,easing:'cubic-bezier(.18,.76,.35,1)'}));
  }
 });
 const expiry=setTimeout(()=>observer.disconnect(),400);
 observer.observe(list,{childList:true});
}

function flashOrderCount(button){
 const badge=button.querySelector('b');
 if(!badge||reduced())return;
 badge.animate?.([{opacity:1,scale:1},{opacity:.42,scale:1.15},{opacity:1,scale:1}],
  {duration:375,iterations:2,easing:'ease-in-out'});
}

function patchNativeOrderExit(source){
 const tween=source.indexOf('function tween('),from=source.indexOf('window.pb1631ExitOrder='),to=source.indexOf('const normalize=',from);
 const flash=source.indexOf('function flash(button){',to),after=source.indexOf("addEventListener('photobridge-order-moved'",flash);
 if(from<0||to<0||flash<0||after<0)return source;
 return source.slice(0,tween>=0&&tween<from?tween:from)+'window.pb1631ExitOrder='+reflowOrderCards.toString()+';\n'+
  source.slice(to,flash)+flashOrderCount.toString().replace('function flashOrderCount','function flash')+'\n'+source.slice(after);
}

module.exports={patchNativeQueuePresentation,removeConfirmedOrderExitWait,patchNativeOrderExit,normalizeQueueSearch};
