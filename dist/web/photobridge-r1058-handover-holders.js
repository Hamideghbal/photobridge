/* Show recorded possession, independent of the original sourcing request. */
(()=>{
 const style=document.createElement('style');
 style.textContent='.pbR1058SupplyChoice{display:grid;gap:5px;grid-column:1/-1;font:700 12px/1.6 Vazirmatn,Tahoma}.pbR1058SupplyChoice select{width:100%;min-width:0;padding:8px;border:1px solid #cdd6e5;border-radius:8px;background:#fff;color:#344054;font:inherit}.pbR1058Holders{margin-top:8px;padding:8px;border-radius:8px;background:#eff6ff;color:#1e40af;font:700 12px/1.8 Vazirmatn,Tahoma;white-space:pre-line}.pbR1058AssetHolder{color:#1e40af!important;font-weight:800!important}';
 style.textContent+='.pbR1058SupplyChoice{font-size:15px}.pbR1058SupplyChoice summary{display:flex;justify-content:space-between;align-items:center;gap:10px;min-height:48px;box-sizing:border-box;padding:10px 12px;border:1px solid #cdd6e5;border-radius:12px;background:#f8faff;color:#1e40af;cursor:pointer;list-style:none}.pbR1058SupplyChoice summary::-webkit-details-marker{display:none}.pbR1063SourceOptions{display:grid;gap:8px;padding:8px 0}.pbR1063SourceOptions button{display:grid;gap:5px;min-height:56px;text-align:right;direction:rtl;padding:12px;border:1px solid #d9e2f5;border-radius:12px;background:#fff;color:#344054;font:inherit;cursor:pointer;overflow-wrap:anywhere}.pbR1063SourceOptions button b{font-size:15px}.pbR1063SourceOptions button small{font-size:13px;line-height:1.8;color:#667085}.pbR1063SourceOptions button[aria-pressed=true]{border-color:#315efb;background:#eef3ff;color:#1e40af}.pbR1063SourceOptions button:active{transform:scale(.98)}.pbR1063SourceOptions button{transition:transform .15s,background .15s}.pbR1058SupplyChoice summary:focus-visible,.pbR1063SourceOptions button:focus-visible{outline:2px solid #315efb;outline-offset:2px}@media(max-width:700px){.pbR1058SupplyChoice{font-size:16px}.pbR1063SourceOptions button b{font-size:16px}.pbR1063SourceOptions button small{font-size:14px}}@media(prefers-reduced-motion:reduce){.pbR1063SourceOptions button{transition:none}}';
 style.textContent+='@font-face{font-family:PhotoBridgeHandover;src:url("/assets/photobridge-handover-vazirmatn.woff2") format("woff2");font-weight:100 900;font-style:normal;font-display:swap}.pbR1058SupplyChoice,.pbR1058SupplyChoice summary,.pbR1063SourceOptions button,.pbR1063SourceOptions button b{font-family:PhotoBridgeHandover,Vazirmatn,Tahoma,sans-serif!important;font-size:16px;line-height:1.8;font-weight:500}.pbR1058SupplyChoice>span{font-size:14px;font-weight:600}.pbR1058SupplyChoice summary{font-weight:600}@media(max-width:700px){.pbR1058SupplyChoice summary,.pbR1063SourceOptions button,.pbR1063SourceOptions button b{font-size:17px}}';
 document.head.append(style);
 function paint(){
   if(typeof data==='undefined')return;
   document.querySelectorAll('#itemsList .rentalItemCard').forEach(card=>{
     const id=card.querySelector('[onclick^="editItem("]')?.getAttribute('onclick')?.match(/editItem\('([^']+)'/)?.[1];
     if(!id)return;
     const owned=(data.assets||[]).filter(a=>String(a.item_id)===id&&a.current_booking_id);
     const external=(data.externalSupplyHolders||[]).filter(a=>String(a.itemId)===id);
     const rows=[...owned.map(a=>`تجهیز فروشگاه ${a.system_code||''}: ${a.customer_name||a.customer_mobile||'مشتری'}`),...external.map(a=>`تأمین بیرونی${a.code?' ('+a.code+')':''}: ${a.customerName||a.customerMobile||'مشتری'}${a.returnMissing?' · کسری دریافت':''}`)];
     let box=card.querySelector('.pbR1058Holders');
     if(!rows.length){box?.remove();return}
     if(!box){box=document.createElement('div');box.className='pbR1058Holders';card.append(box)}
     const text='تحویل ثبت‌شده به مشتری:\n'+rows.join('\n');if(box.textContent!==text)box.textContent=text;
   });
 }
 const previous=renderItems;
 renderItems=window.renderItems=function(){const result=previous.apply(this,arguments);paint();return result};
 paint();
})();
