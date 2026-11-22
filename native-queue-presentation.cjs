'use strict';

function normalizeQueueSearch(value){
 return String(value||'').trim().replace(/[۰-۹٠-٩]/g,digit=>String(digit.charCodeAt(0)&15));
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
 const pbNativeSearchInput=typeof r1944Query==="undefined"?pbNativeRequestQuery:pbNativeQueueSearch(r1944Query);
 const pbNativePageKey=JSON.stringify([t?.id,o,T,r1944Page,pbNativeRequestQuery]);
 const pbNativePageLoading=pbNativeSearchInput!==pbNativeRequestQuery||pbNativePageResult?.key!==pbNativePageKey;
 const pbNativeVisiblePage=x.useRef(pbNativePageKey);
 pbNativeVisiblePage.current=pbNativePageKey;
 const pbNativeOpeningPage=x.useRef(pbNativePageKey);
 pbNativeOpeningPage.current=pbNativePageLoading?pbNativePageKey:null;
 `;
 const skeleton=`e.jsx("div",{className:"pbNativeQueueLoading","aria-hidden":true,children:Array.from({length:6},(_,index)=>e.jsxs("div",{className:"pbNativeQueueSkeleton",children:[e.jsx("i",{className:"pbNativeQueueSkeletonThumb"}),e.jsx("div",{className:"pbNativeQueueSkeletonLines",children:[e.jsx("i",{},0),e.jsx("i",{},1),e.jsx("i",{},2)]}),e.jsx("i",{className:"pbNativeQueueSkeletonAction"})]},index))})`;
 const patched=withFailure
  .replace(marker,marker+state)
  .replace('String(r1944DebouncedQuery||"").trim()','pbNativeRequestQuery')
  .replace('"&pbNativeLiveStatus="+Date.now();','"&pbNativeLiveStatus="+Date.now()+(pbNativeOpeningPage.current===pbNativePageKey&&T==="flow"&&r1944Page===1&&!query?"&pbNativeOpen=1":"");')
  .replace('r1944SetDebouncedQuery(String(r1944Query||"")),270','r1944SetDebouncedQuery(pbNativeQueueSearch(r1944Query)),110')
  .replace(afterSuccess,'pbNativeSetPageResult(previous=>previous?.key===pbNativePageKey&&previous.ok?previous:{key:pbNativePageKey,ok:true});'+afterSuccess)
  .replace(cards,`"aria-busy":pbNativePageLoading,"aria-label":"سفارش‌ها",children:pbNativePageLoading?${skeleton}:!pbNativePageResult?.ok?null:Be.length?Nt.map(`);
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
