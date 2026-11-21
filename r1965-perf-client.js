/* R1965 Windows-only renderer responsiveness diagnostics: numeric aggregates only. */
(()=>{'use strict';
 if(window.__pbLabNativePerfStarted)return;window.__pbLabNativePerfStarted=true;
 const queue=[];let longTaskObserver=null,active=null;
 function add(type,value){if(!Number.isFinite(value)||value<0||value>60000)return;queue.push({type,value:Math.round(value*10)/10});if(queue.length>80)queue.splice(0,queue.length-80)}
 function begin(event){
  const target=event.target?.closest?.('button,[role="tab"],a');if(!target)return;
  const tab=target.matches('[role="tab"]')||!!target.closest?.('.queueFilters,.labQueueStickyBar,.stageQueueWorkspace,.roleTabs,[role="tablist"]');
  const stage=!tab&&!!target.closest?.('.labActionTimeline,.labOrderAction,.labStatusActions');if(!tab&&!stage)return;
  const prefix=tab?'tab':'stage',at=performance.now();
  if(active?.observer)active.observer.disconnect();
  active={at,mutations:0,observer:null};const current=active;
  const root=document.getElementById('root');
  if(root&&typeof MutationObserver==='function'){
   const obs=new MutationObserver(records=>{if(active!==current)return;current.mutations+=records.length;if(!current.firstDom){current.firstDom=true;add(prefix+'_first_dom_ms',performance.now()-at)}});
   obs.observe(root,{childList:true,subtree:true,attributes:false,characterData:false});current.observer=obs;
  }
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(active===current)add(prefix+'_first_paint_ms',performance.now()-at)}));
  setTimeout(()=>{if(active!==current)return;current.observer?.disconnect();if(tab)add('tab_dom_mutations',Math.min(60000,current.mutations));active=null},1200);
 }
 document.addEventListener('click',begin,{capture:true,passive:true});
 const unsubscribeQueue=window.pbDesktopEvents?.onQueuePageRefresh?.(()=>window.dispatchEvent(new CustomEvent('photobridge-lab-orders-changed')));
 try{longTaskObserver=new PerformanceObserver(list=>{for(const e of list.getEntries())add('renderer_longtask_ms',e.duration)});longTaskObserver.observe({entryTypes:['longtask']})}catch{}
 function flush(){if(Number.isFinite(performance.memory?.usedJSHeapSize))add('renderer_heap_mb',performance.memory.usedJSHeapSize/1048576);if(!queue.length)return;const samples=queue.splice(0,40);try{void fetch('/desktop/perf-sample',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({samples}),keepalive:false}).catch(()=>{})}catch{}}
 const timer=setInterval(flush,10000);
 window.addEventListener('pagehide',()=>{clearInterval(timer);longTaskObserver?.disconnect();active?.observer?.disconnect();unsubscribeQueue?.();flush()},{once:true});
})();
