'use strict';

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
 if(!queue.includes(pendingGuard)||!queue.includes(afterSuccess)||!queue.includes(onError))return source;

 const state=`
 const [pbNativePageResult,pbNativeSetPageResult]=x.useState(null);
 const pbNativePageKey=JSON.stringify([t?.id,o,T,r1944Page,r1944DebouncedQuery]);
 const pbNativePageLoading=pbNativePageResult?.key!==pbNativePageKey;
 `;
 const skeleton=`e.jsx("div",{className:"pbNativeQueueLoading","aria-hidden":true,children:Array.from({length:6},(_,index)=>e.jsxs("div",{className:"pbNativeQueueSkeleton",children:[e.jsx("i",{className:"pbNativeQueueSkeletonThumb"}),e.jsx("div",{className:"pbNativeQueueSkeletonLines",children:[e.jsx("i",{},0),e.jsx("i",{},1),e.jsx("i",{},2)]}),e.jsx("i",{className:"pbNativeQueueSkeletonAction"})]},index))})`;
 const patched=queue
  .replace(marker,marker+state)
  .replace(afterSuccess,'pbNativeSetPageResult(previous=>previous?.key===pbNativePageKey&&previous.ok?previous:{key:pbNativePageKey,ok:true});'+afterSuccess)
  .replace(onError,'if(pbLiveOrders.current.active&&seq===pbLiveOrders.current.seq)pbNativeSetPageResult(previous=>previous?.key===pbNativePageKey&&previous.ok?previous:{key:pbNativePageKey,ok:false});'+onError)
  .replace(cards,`"aria-busy":pbNativePageLoading,"aria-label":"سفارش‌ها",children:pbNativePageLoading?${skeleton}:!pbNativePageResult?.ok?null:Be.length?Nt.map(`);
 return source.slice(0,start)+patched+source.slice(cardAt+cards.length);
}

function removeConfirmedOrderExitWait(source){
 return source.replaceAll('await window.pb1631ExitOrder?.(le.id,nt,T);','');
}

module.exports={patchNativeQueuePresentation,removeConfirmedOrderExitWait};
