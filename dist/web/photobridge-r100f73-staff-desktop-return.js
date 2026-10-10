/* PhotoBridge R100F73: Windows staff header and explicit checked-item return. */
(()=>{
  if(window.__PB_R100F73_STAFF__)return;
  window.__PB_R100F73_STAFF__=true;
  const q=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const isStaff=()=>document.body.classList.contains('pbR100F9StaffMode');
  const desktop=()=>window.matchMedia('(min-width:851px)').matches;
  function mountHeader(){
    if(!isStaff())return;
    const header=q('header.top'),tabs=q('.pbR100F9StaffTabs'),nav=q('.pbR100F9StaffNav');
    if(!header||!tabs||!nav)return;
    if(desktop()&&tabs.parentElement!==header)header.appendChild(tabs);
    if(!desktop()&&tabs.parentElement!==nav)nav.prepend(tabs);
    if(desktop()){
      if(!nav.querySelector('.pbR100F73ScrollArrow')){
        for(const [direction,label,symbol] of [['previous','تاریخ‌های قبل','›'],['next','تاریخ‌های بعد','‹']]){
          const b=document.createElement('button');
          b.type='button';b.className='pbR100F73ScrollArrow';
          b.dataset.direction=direction;b.setAttribute('aria-label',label);b.textContent=symbol;
          b.addEventListener('click',()=>{
            const rail=q('#pbR100F9StaffDates');if(!rail)return;
            // Scrolling a real, overflowed date strip rather than repainting dates.
            const move=direction==='previous'?-Math.max(280,rail.clientWidth*.65):Math.max(280,rail.clientWidth*.65);
            rail.scrollBy({left:move,behavior:'smooth'});
          });
          nav.appendChild(b);
        }
      }
      const rail=q('#pbR100F9StaffDates');
      if(rail&&!rail.dataset.pbR100F73Wheel){
        rail.dataset.pbR100F73Wheel='1';
        rail.addEventListener('wheel',e=>{
          if(!desktop()||rail.scrollWidth<=rail.clientWidth||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
          const moved=e.deltaY;
          const next=Math.max(0,Math.min(rail.scrollWidth-rail.clientWidth,rail.scrollLeft+moved));
          if(Math.abs(next-rail.scrollLeft)>1){e.preventDefault();rail.scrollLeft=next}
        },{passive:false});
      }
    }else{
      nav.querySelectorAll('.pbR100F73ScrollArrow').forEach(b=>b.remove());
    }
  }
  const prevRender=window.pbR100F9RenderStaffPortal;
  if(typeof prevRender==='function'){
    window.pbR100F9RenderStaffPortal=function(...args){
      const result=prevRender.apply(this,args);mountHeader();return result;
    };
  }
  const prevPaint=window.pbR100F9PaintStaffList;
  if(typeof prevPaint==='function'){
    window.pbR100F9PaintStaffList=function(...args){
      const result=prevPaint.apply(this,args);mountHeader();return result;
    };
  }
  window.addEventListener('resize',()=>{if(isStaff())mountHeader()},{passive:true});
  if(isStaff())mountHeader();

  let busy=false;
  const previousBookingStatus=window.bookingStatus;
  function showChecklist(booking){
    return new Promise(resolve=>{
      const dialog=document.createElement('div');
      dialog.className='pbR100F73ReturnBack';
      dialog.innerHTML='<section class="pbR100F73ReturnDialog" role="dialog" aria-modal="true" aria-labelledby="pbR100F73ReturnTitle">'+
        '<div class="pbR100F73ReturnHead"><div><h2 id="pbR100F73ReturnTitle">دریافت تجهیزات</h2>'+
        '<p>فقط تجهیزاتی که واقعاً دریافت کرده‌اید را تیک بزنید. هیچ موردی از قبل تأیید نشده است.</p>'+
        '</div><button type="button" class="pbR100F73ReturnClose" data-cancel aria-label="بستن">×</button></div>'+
        '<div class="pbR100F73ReturnRows" data-rows>در حال دریافت فهرست تجهیزات…</div>'+
        '<div class="pbR100F73ReturnSummary" data-summary></div>'+
        '<div class="pbR100F73ReturnWarning" role="alert" data-warning hidden></div>'+
        '<div class="pbR100F73ReturnError" role="alert" data-error></div>'+
        '<div class="pbR100F73ReturnActions"><button type="button" data-cancel>انصراف</button>'+
        '<button type="button" class="primary" data-submit disabled>ثبت دریافت</button></div></section>';
      document.body.appendChild(dialog);
      const rows=q('[data-rows]',dialog),summary=q('[data-summary]',dialog);
      const warning=q('[data-warning]',dialog),error=q('[data-error]',dialog),submit=q('[data-submit]',dialog);
      const beforeOverflow=document.body.style.overflow;
      let slots=[],closed=false,missingConfirmed=false,armedSignature='';
      document.body.style.overflow='hidden';
      const close=result=>{
        if(closed)return;closed=true;dialog.remove();document.body.style.overflow=beforeOverflow;
        document.removeEventListener('keydown',onKey);resolve(result);
      };
      const onKey=e=>{if(e.key==='Escape'){e.preventDefault();close(null)}};
      document.addEventListener('keydown',onKey);
      dialog.querySelectorAll('[data-cancel]').forEach(b=>b.addEventListener('click',()=>close(null)));
      const signature=()=>slots.map(s=>s.checked?'1':'0').join('');
      const counts=()=>{
        const checked=slots.filter(s=>s.checked).length,missing=slots.length-checked;
        return {checked,missing};
      };
      const refresh=()=>{
        const count=counts();
        summary.textContent=fa(count.checked)+' از '+fa(slots.length)+' واحد دریافت شد؛ '+
          (count.missing?fa(count.missing)+' واحد دریافت نشده است.':'همه تجهیزات دریافت شده‌اند.');
        rows.querySelectorAll('[data-slot]').forEach(el=>{
          const pos=Number(el.dataset.slot);
          el.classList.toggle('checked',!!slots[pos]?.checked);
        });
        if(missingConfirmed&&armedSignature!==signature()){
          missingConfirmed=false;warning.hidden=true;submit.textContent='ثبت دریافت';
        }
      };
      const setError=msg=>{error.textContent=msg;submit.disabled=false};
      const init=async()=>{
        try{
          const url='/api/rental/bookings/'+encodeURIComponent(String(booking.id))+'/assets';
          const result=await fetch(url,{credentials:'same-origin'});
          if(!result.ok)throw new Error('load_failed');
          const data=await result.json();
          if(!Array.isArray(data.items)||!data.items.length)throw new Error('no_items');
          const seen=new Set();
          for(const item of data.items){
            const itemId=String(item.itemId||'');
            const title=String(item.title||'تجهیز');
            const qty=Number(item.quantity);
            if(!itemId||!Number.isSafeInteger(qty)||qty<1||qty>500)throw new Error('invalid_quantity');
            const assets=Array.isArray(item.assets)?item.assets:[];
            if(assets.length>qty)throw new Error('invalid_quantity');
            for(const asset of assets){
              const code=String(asset.system_code||'').trim();
              if(!code||seen.has(code))throw new Error('invalid_assets');
              seen.add(code);
              slots.push({itemId,title,code,serial:String(asset.serial_number||''),checked:false,isExternal:false});
            }
            for(let i=assets.length;i<qty;i++){
              slots.push({itemId,title,code:'',serial:'',checked:false,isExternal:true});
            }
          }
          if(!slots.length||slots.length>500)throw new Error('invalid_quantity');
          rows.innerHTML=slots.map((slot,i)=>{
            const subtitle=slot.isExternal?'واحد تأمین بیرونی / بدون کد سیستمی':
              'کد: '+slot.code+(slot.serial?' · سریال: '+slot.serial:'');
            return '<label class="pbR100F73ReturnRow" data-slot="'+i+'">'+
              '<input type="checkbox" data-check="'+i+'"><span><b>'+esc(slot.title)+
              (slots.filter(s=>s.itemId===slot.itemId).length>1?' · واحد '+fa(slots.slice(0,i+1).filter(s=>s.itemId===slot.itemId).length):'')+
              '</b><small>'+esc(subtitle)+'</small></span></label>';
          }).join('');
          rows.addEventListener('change',e=>{
            const input=e.target.closest('input[data-check]');if(!input)return;
            const i=Number(input.dataset.check);
            if(!slots[i])return;
            slots[i].checked=input.checked;
            refresh();
          });
          submit.disabled=false;refresh();
        }catch(ex){
          rows.textContent='';
          summary.textContent='';
          submit.disabled=true;
          error.textContent=ex.message==='no_items'?'این آفیش فهرست تجهیزات ندارد؛ ثبت دریافت ممکن نیست.':
            'فهرست تجهیزات این آفیش کامل دریافت نشد. بدون بررسی تجهیزات، چیزی ثبت نخواهد شد.';
        }
      };
      submit.addEventListener('click',()=>{
        if(closed||submit.disabled||!slots.length)return;
        const {checked,missing}=counts();
        if(missing>0&&!missingConfirmed){
          missingConfirmed=true;armedSignature=signature();
          warning.hidden=false;
          warning.textContent=fa(missing)+' تجهیز هنوز تیک دریافت ندارد. اگر تأیید کنید، این '+
            fa(missing)+' تجهیز در بخش «کسری تحویل» ثبت می‌شود. برای تأیید دوباره روی دکمه زیر بزنید.';
          submit.textContent='تأیید کسری و ثبت دریافت';
          warning.scrollIntoView({block:'nearest',behavior:'smooth'});
          return;
        }
        const prompt=missing>0?'آیا ثبت '+fa(checked)+' تجهیز دریافت‌شده و انتقال '+fa(missing)+
          ' تجهیز دریافت‌نشده به کسری تحویل را تأیید می‌کنید؟':'آیا دریافت همه '+fa(checked)+' تجهیز را ثبت می‌کنید؟';
        if(!window.confirm(prompt))return;
        const quantities=new Map();
        for(const slot of slots){
          if(!quantities.has(slot.itemId))quantities.set(slot.itemId,0);
          if(slot.checked)quantities.set(slot.itemId,quantities.get(slot.itemId)+1);
        }
        const returnItems=[...quantities].map(([itemId,returnedQty])=>({itemId,returnedQty}));
        const assetCodes=slots.filter(s=>s.checked&&s.code).map(s=>s.code);
        submit.disabled=true;
        close({status:'returned',returnChecklist:true,returnItems,assetCodes});
      });
      init();
    });
  }
  window.pbR1084ReturnChecklist=showChecklist;
  if(typeof previousBookingStatus==='function'){
    window.bookingStatus=async function(id,status,...rest){
      if(!isStaff()||status!=='returned')return previousBookingStatus.call(this,id,status,...rest);
      if(busy)return;
      const booking=(typeof data!=='undefined'?data?.bookings:window.data?.bookings||[])
        .find(x=>String(x.id)===String(id));
      if(!booking||String(booking.status)!=='picked_up'){
        window.storeNotice?.('این سفارش در وضعیت قابل دریافت نیست.','دریافت تجهیزات');return;
      }
      busy=true;
      try{
        const payload=await showChecklist(booking);
        if(!payload)return;
        // The POST/PATCH happens only after a deliberate, checked confirmation.
        const res=await fetch('/api/rental/bookings/'+encodeURIComponent(String(id)),{
          method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json'},
          body:JSON.stringify(payload)
        });
        const result=await res.json().catch(()=>({}));
        if(!res.ok){
          const code=String(result.error||'');
          throw new Error(code==='return_checklist_invalid'?'فهرست تیک‌ها با سفارش تطبیق ندارد. اطلاعات را تازه‌سازی کنید.':
            code==='invalid_rental_transition'?'این آفیش قبلاً ثبت دریافت شده است.':'ثبت دریافت انجام نشد. دوباره تلاش کنید.');
        }
        window.storeNotice?.('تجهیزات تیک‌خورده دریافت شد؛ باقی‌مانده به کسری تحویل منتقل شد.','ثبت دریافت');
        if(typeof window.pbR100F9ReloadStaff==='function')await window.pbR100F9ReloadStaff();
      }catch(ex){window.storeNotice?.(ex.message||'ثبت دریافت انجام نشد.','خطای دریافت')}
      finally{busy=false}
    };
  }
})();
