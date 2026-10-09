/* R100F72: readonly staff shortage queues and office calendar. */
(()=>{
  if(window.__PB_R100F72_STAFF_VIEWS__)return;
  window.__PB_R100F72_STAFF_VIEWS__=true;
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const iso=x=>String(x||'').slice(0,10);
  const today=()=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Tehran'}).format(new Date());
  const dateFa=x=>{if(!x)return '—';try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Tehran'}).format(new Date(iso(x)+'T12:00:00Z'))}catch{return iso(x)}};
  let view='out',monthAnchor=today();
  const extraViews=[['officeShortages','کسری آفیش'],['returnShortages','کسری دریافت']];
  const bookingData=()=>typeof data!=='undefined'?(data||{}):(window.data||{});
  function updateHeight(){
    requestAnimationFrame(()=>{
      const nav=$('.pbR100F9StaffNav');
      if(nav)document.body.style.setProperty('--pb-r100f64-staff-nav-h',Math.ceil(nav.getBoundingClientRect().height)+'px');
    });
  }
  function ensureUI(){
    if(!document.body.classList.contains('pbR100F9StaffMode'))return;
    const tabs=$('.pbR100F9StaffTabs'),shell=$('.pbR100F9StaffShell');
    if(!tabs||!shell)return;
    for(const [key,label] of extraViews){
      if(tabs.querySelector('[data-staff-mode="'+key+'"]'))continue;
      const button=document.createElement('button');
      button.type='button';button.dataset.staffMode=key;button.textContent=label;
      tabs.appendChild(button);
    }
    if(!tabs.dataset.pbR100F72Bound){
      tabs.dataset.pbR100F72Bound='1';
      tabs.addEventListener('click',event=>{
        const button=event.target.closest('[data-staff-mode]');
        if(!button||!tabs.contains(button))return;
        view=button.dataset.staffMode;
        if(view==='officeCalendar'||view==='officeShortages'||view==='returnShortages'){
          renderExtra();
        }else{
          document.body.classList.remove('pbR100F72ExtraActive');
          const pane=$('#pbR100F72ExtraPane');if(pane)pane.hidden=true;
          updateHeight();
        }
      },true);
    }
    if(!$('#pbR100F72ExtraPane',shell)){
      const pane=document.createElement('div');pane.id='pbR100F72ExtraPane';
      pane.className='pbR100F72ExtraPane';pane.hidden=true;
      shell.appendChild(pane);
    }
  }
  const bookingCount=d=>{
    return (bookingData().bookings||[]).filter(b=>
      b.status!=='cancelled'&&b.status!=='rejected'&&iso(b.rental_start)<=d&&iso(b.rental_end)>=d
    ).length;
  };
  const parts=x=>{
    const d=x instanceof Date?x:new Date(iso(x)+'T12:00:00Z');
    const p=new Intl.DateTimeFormat('en-US-u-ca-persian',{
      year:'numeric',month:'numeric',day:'numeric',timeZone:'Asia/Tehran'
    }).formatToParts(d);
    return Object.fromEntries(p.filter(x=>['year','month','day'].includes(x.type))
      .map(x=>[x.type,Number(x.value)]));
  };
  const shift=(d,n)=>{const x=new Date(d.getTime());x.setUTCDate(x.getUTCDate()+n);return x};
  function calendar(){
    let first=new Date(iso(monthAnchor)+'T12:00:00Z');
    let safe=0;
    while(parts(first).day!==1&&safe++<32)first=shift(first,-1);
    const key=parts(first),year=key.year,month=key.month;
    const monthName=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{
      year:'numeric',month:'long',timeZone:'Asia/Tehran'
    }).format(first);
    const left=(first.getUTCDay()+1)%7;
    let length=1;
    while(length<32){const p=parts(shift(first,length));if(p.year!==year||p.month!==month)break;length++}
    const cells=Math.ceil((left+length)/7)*7;
    let html='<section class="pbR100F72Panel"><div class="pbR100F72CalendarHead">'+
      '<button type="button" data-r72-month="-1" aria-label="ماه قبل">›</button>'+
      '<h2>تقویم آفیش · '+esc(monthName)+'</h2>'+
      '<button type="button" data-r72-month="1" aria-label="ماه بعد">‹</button></div>'+
      '<div class="pbR100F72Calendar">';
    for(const day of ['ش','ی','د','س','چ','پ','ج'])html+='<span class="pbR100F72Weekday">'+day+'</span>';
    for(let i=0;i<cells;i++){
      const date=shift(first,i-left),current=parts(date),dayISO=date.toISOString().slice(0,10);
      const inMonth=current.month===month&&current.year===year,n=bookingCount(dayISO);
      html+='<div class="pbR100F72Day'+(!inMonth?' other':'')+(dayISO===today()?' today':'')+
        '" aria-label="'+esc(dateFa(dayISO))+'"><b>'+fa(current.day)+'</b>'+
        (inMonth&&n?'<small>'+fa(n)+' آفیش</small>':'')+'</div>';
    }
    html+='</div></section>';
    return html;
  }
  function shortageCards(kind){
    const d=bookingData(),office=kind==='officeShortages';
    const records=office?d.shortages:d.returnShortages;
    const title=office?'کسری آفیش':'کسری تحویل';
    if(!Array.isArray(records))return '<section class="pbR100F72Panel"><h2>'+title+
      '</h2><div class="pbR100F72Empty">فهرست کسری‌ها هنوز دریافت نشده است.</div></section>';
    const rows=[...records].sort((a,b)=>Number(Boolean(a.resolved_at))-Number(Boolean(b.resolved_at)));
    return '<section class="pbR100F72Panel"><h2>'+title+'</h2><div class="pbR100F72Entries">'+
      (rows.length?rows.map(x=>{
        const done=office?(x.status==='provided'||!!x.resolved_at):(x.status==='returned_later'||!!x.resolved_at);
        const name=x.photographer_name||x.customer_name||'عکاس';
        const quantity=office?x.shortage_qty:x.missing_qty;
        const range=office?dateFa(x.rental_start)+' تا '+dateFa(x.rental_end):dateFa(x.detected_at);
        return '<article class="pbR100F72Entry"><b>'+esc(name)+'</b>'+
          '<small dir="ltr" style="text-align:right">'+esc(x.customer_mobile||x.photographer_mobile||'')+'</small>'+
          '<div>'+esc(x.item_title||'تجهیز')+'</div><small>'+esc(range)+'</small>'+
          '<strong class="'+(done?'resolved':'pending')+'">'+
          (done?'رفع شده':'کسری '+fa(quantity)+' عدد')+'</strong></article>';
      }).join(''):'<div class="pbR100F72Empty">موردی ثبت نشده است.</div>')+
      '</div></section>';
  }
  function renderExtra(){
    ensureUI();
    const pane=$('#pbR100F72ExtraPane');
    if(!pane)return;
    const extra=extraViews.some(([key])=>key===view);
    document.body.classList.toggle('pbR100F72ExtraActive',extra);
    pane.hidden=!extra;
    for(const b of document.querySelectorAll('.pbR100F9StaffTabs [data-staff-mode]')){
      b.classList.toggle('active',b.dataset.staffMode===view);
      b.setAttribute('aria-current',b.dataset.staffMode===view?'page':'false');
    }
    if(!extra){updateHeight();return}
    pane.innerHTML=view==='officeCalendar'?calendar():shortageCards(view);
    pane.querySelectorAll('[data-r72-month]').forEach(b=>b.addEventListener('click',()=>{
      let first=new Date(iso(monthAnchor)+'T12:00:00Z');
      let safe=0;while(parts(first).day!==1&&safe++<32)first=shift(first,-1);
      const step=Number(b.dataset.r72Month);
      monthAnchor=shift(first,step>0?35:-1).toISOString().slice(0,10);
      renderExtra();
    }));
    updateHeight();
  }
  const render=window.pbR100F9RenderStaffPortal;
  if(typeof render==='function'){
    window.pbR100F9RenderStaffPortal=function(...args){
      view='out';monthAnchor=today();
      const result=render.apply(this,args);
      ensureUI();renderExtra();
      return result;
    };
  }
  const paint=window.pbR100F9PaintStaffList;
  if(typeof paint==='function'){
    window.pbR100F9PaintStaffList=function(...args){
      const result=paint.apply(this,args);
      ensureUI();renderExtra();
      return result;
    };
  }
  if(document.body.classList.contains('pbR100F9StaffMode')){ensureUI();renderExtra()}
})();
