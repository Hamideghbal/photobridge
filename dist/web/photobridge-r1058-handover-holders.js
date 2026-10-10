/* Show recorded possession, independent of the original sourcing request. */
(()=>{
 const style=document.createElement('style');
 style.textContent='.pbR1058SupplyChoice{display:grid;gap:5px;grid-column:1/-1;font:700 12px/1.6 Vazirmatn,Tahoma}.pbR1058SupplyChoice select{width:100%;min-width:0;padding:8px;border:1px solid #cdd6e5;border-radius:8px;background:#fff;color:#344054;font:inherit}.pbR1058Holders{margin-top:8px;padding:8px;border-radius:8px;background:#eff6ff;color:#1e40af;font:700 12px/1.8 Vazirmatn,Tahoma;white-space:pre-line}.pbR1058AssetHolder{color:#1e40af!important;font-weight:800!important}';
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
