/* R1773: per-photo partial stock and unlimited inventory. */
/* R1764: Share the authoritative size-level chassis availability with photo rows.
   Do not modify prices, upload payloads, or the other add-on controls. */
(()=>{
 'use strict';
 if(window.__pb1764PhotoChassis)return;
 window.__pb1764PhotoChassis=true;
 const cardSelector='main.photographerMain .simplePrintSizeCard';
 const photoSelector='.simplePrintPhotoAddonCheck';
 const clearing=new WeakSet(),attempts=new WeakMap();
 const isChassis=label=>/شاسی/.test((label.textContent||'').replace(/\s+/g,' '));
 function evaluate(card){
  const group=card.querySelector('.simplePrintCardAddonCheck.pb1608ChassisGroup');
  const master=group?.querySelector('input[type="checkbox"]');
  const labels=[...card.querySelectorAll(photoSelector)].filter(isChassis);
  const raw=group?.getAttribute('data-pb1764-stock');
  const stock=raw==='unlimited'?Infinity:raw===null||raw===''?NaN:Number(raw);
  // A count below the number of selected photos is not enough for this size.
  // No option is exposed until the authoritative price/stock has loaded.
  const selected=labels.reduce((total,label)=>{if(!label.querySelector('input[type="checkbox"]')?.checked)return total;const n=Number(label.getAttribute('data-pb1765-copies'));return total+(Number.isInteger(n)&&n>=1?n:1);},0);
  const shortage=!group||!master||(!Number.isFinite(stock)&&stock!==Infinity)||stock<=0||stock<selected;
  const disabled=!!master?.disabled;
  const allChecks=card.querySelectorAll('.simplePrintCardAddonCheck input[type="checkbox"]');
  // During an in-flight send all controls may temporarily be disabled. Do not
  // mutate already chosen add-ons during that transient disabled state.
  const busy=stock>0&&allChecks.length>0&&[...allChecks].every(input=>input.disabled);
  return {labels,stock,selected,unavailable:shortage,clear:shortage&&!busy};
 }
 let syncing=false,pending=false;
 function sync(){
  pending=false;
  if(syncing)return;
  syncing=true;
  try{
   for(const card of document.querySelectorAll(cardSelector)){
    const state=evaluate(card);
    for(const label of state.labels){
     const input=label.querySelector('input[type="checkbox"]');
     if(!input)continue;
     const n=Number(label.getAttribute('data-pb1765-copies'));
     const copies=Number.isInteger(n)&&n>=1?n:1;
     const unavailable=state.unavailable||(!input.checked&&state.stock<state.selected+copies);
     if(label.classList.contains('pb1764ChassisUnavailable')!==unavailable)
      label.classList.toggle('pb1764ChassisUnavailable',unavailable);
     if(!unavailable){attempts.delete(input);continue;}
     // Use the original React change handler. Toggling DOM.checked alone leaves
     // a stale chassisOverride in React state and still fails during upload.
     if(state.clear&&input.checked&&!input.disabled&&(attempts.get(input)||0)<2){
      attempts.set(input,(attempts.get(input)||0)+1);
      clearing.add(input);
      try{input.click();}finally{clearing.delete(input);}
     }
    }
   }
  }finally{syncing=false;}
 }
 function schedule(){
  if(pending)return;
  pending=true;requestAnimationFrame(sync);
 }
 // Block a tap in the narrow interval before the observer has repainted a row.
 document.addEventListener('click',event=>{
  const label=event.target?.closest?.(photoSelector);
  if(!label||!isChassis(label))return;
  const input=label.querySelector('input[type="checkbox"]');
  if(input&&clearing.has(input))return;
  const card=label.closest('.simplePrintSizeCard');
  if(!card)return;
  const state=evaluate(card),n=Number(label.getAttribute('data-pb1765-copies'));
  const copies=Number.isInteger(n)&&n>=1?n:1;
  if(state.unavailable||(!input?.checked&&state.stock<state.selected+copies)){
   event.preventDefault();
   event.stopImmediatePropagation();
   schedule();
  }
 },true);
 function boot(){
  const root=document.getElementById('root');
  if(!root)return;
  new MutationObserver(mutations=>{
   if(mutations.some(m=>m.type==='childList'||(m.type==='attributes'&&m.attributeName!=='class')))
    schedule();
   else if(mutations.some(m=>m.target?.closest?.('.simplePrintSizeCard')))schedule();
  }).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled','hidden','aria-disabled','data-pb1764-stock','data-pb1765-copies']});
  schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
})();
