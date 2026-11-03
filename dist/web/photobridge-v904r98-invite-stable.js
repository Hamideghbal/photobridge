(()=>{
  if(location.pathname!=='/photographer/signup' || window.__PB_R98_INVITE_STABLE__) return;
  window.__PB_R98_INVITE_STABLE__=true;
  const q=new URLSearchParams(location.search);
  const inviteCode=String(q.get('invite')||'').trim();
  const mobile=String(q.get('mobile')||'').trim();
  const mb=String(q.get('mb')||'').trim();
  if(!inviteCode) return;
  document.documentElement.classList.add('pbR98InviteScroll');
  const enableInviteScroll=()=>{document.documentElement.classList.add('pbR98InviteScroll');if(document.body)document.body.classList.add('pbR98InviteScrollBody')};
  enableInviteScroll();
  const nativeFetch=window.fetch.bind(window);
  const state={ctx:null,contextReady:false,values:{birthJalali:'',nationalId:'',birthCertificateNo:'',businessLicenseNo:'',businessLicenseImage:null},raf:0,loading:false};
  const digits=s=>String(s||'').replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[+d]);
  function setInputValue(input,value){
    try{const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;if(set)set.call(input,value);else input.value=value}catch{input.value=value}
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  const normalizeReq=r=>({
    birthDate:r?.birthDate===true||r?.requiredBirthDate===true,
    nationalId:r?.nationalId===true||r?.requiredNationalId===true||r?.national_id===true,
    birthCertificateNo:r?.birthCertificateNo===true||r?.requiredBirthCertificateNo===true||r?.birth_certificate_no===true,
    businessLicenseNo:r?.businessLicenseNo===true||r?.requiredBusinessLicenseNo===true||r?.business_license_no===true||r?.caseNumber===true,
    businessLicenseImage:r?.businessLicenseImage===true||r?.requiredBusinessLicenseImage===true||r?.business_license_image===true||r?.caseNumberImage===true
  });
  function mergeCtx(x){
    if(!x||typeof x!=='object') return;
    const old=state.ctx||{}, next={...old,...x};
    const a=normalizeReq(old.membershipRequiredFields||{}),b=normalizeReq(x.membershipRequiredFields||{});
    next.membershipRequiredFields={birthDate:a.birthDate||b.birthDate,nationalId:a.nationalId||b.nationalId,birthCertificateNo:a.birthCertificateNo||b.birthCertificateNo,businessLicenseNo:a.businessLicenseNo||b.businessLicenseNo,businessLicenseImage:a.businessLicenseImage||b.businessLicenseImage};
    const oa=old.existingAccount&&typeof old.existingAccount==='object'?old.existingAccount:{},na=x.existingAccount&&typeof x.existingAccount==='object'?x.existingAccount:{};
    const mergedAccount={...oa,...Object.fromEntries(Object.entries(na).filter(([,v])=>v!==null&&v!==undefined&&v!==''))};
    next.existingAccount=(x.rejoiningAccount?.required||old.rejoiningAccount?.required)?null:(Object.keys(mergedAccount).length?mergedAccount:null);
    const previousInvite=old.invite||{},incomingInvite=x.invite||{};next.invite={...previousInvite,...incomingInvite};for(const field of ['issuerRentalShopName','issuerName','issuerLabName']){const fresh=String(incomingInvite[field]??'').trim();if((!fresh||fresh==='فروشگاه')&&previousInvite[field])next.invite[field]=previousInvite[field]}
    const op=old.membershipProfile||{},np=x.membershipProfile||{};
    next.membershipProfile={...op,...Object.fromEntries(Object.entries(np).filter(([,v])=>v!==null&&v!==undefined&&v!==''))};
    if(!Object.keys(next.membershipProfile).length) next.membershipProfile=null;
    state.ctx=next;
    seed(); scheduleSeries();
  }
  function releaseContextGate(){
    state.contextReady=true;
    clearTimeout(window.__PB_INVITE_GATE_TIMEOUT__);
    document.getElementById('pbInviteContextRetry')?.remove();
    window.__PB_INVITE_GATE_TIMEOUT__=setTimeout(()=>{if(state.contextReady&&!document.querySelector('.photographerSignupForm'))showContextRetry(true)},8000);
    scheduleSeries();
  }
  function acceptSignupContext(x){
    if(!x||typeof x!=='object'||!Object.prototype.hasOwnProperty.call(x,'existingAccount'))return false;
    mergeCtx(x);
    releaseContextGate();
    return true;
  }
  function showContextRetry(force=false){
    if((state.contextReady&&!force)||document.getElementById('pbInviteContextRetry'))return;
    const panel=document.createElement('section');panel.id='pbInviteContextRetry';panel.setAttribute('role','alert');
    panel.innerHTML='<strong>بررسی دعوت‌نامه انجام نشد</strong><span>برای نمایش فرم درست، ارتباط امن حساب باید بررسی شود. لطفاً دوباره تلاش کنید.</span><button type="button">تلاش دوباره</button>';
    panel.querySelector('button').onclick=()=>location.reload();document.body.append(panel);
  }
  window.__PB_INVITE_GATE_TIMEOUT__=setTimeout(showContextRetry,12000);
  function seed(){
    const p=state.ctx?.membershipProfile||{};
    for(const k of ['birthJalali','nationalId','birthCertificateNo','businessLicenseNo']) if(!state.values[k]&&p[k]) state.values[k]=String(p[k]);
    if(!state.values.businessLicenseImage&&p.businessLicenseImage) state.values.businessLicenseImage=p.businessLicenseImage;
  }
  const required=()=>({...normalizeReq(state.ctx?.membershipRequiredFields||{}),birthDate:isExisting()&&!hasProfileValue('birthJalali')});
  function PB1412IsRental(invite,fields){const item=invite||{},type=String(item.issuerType||item.issuer_type||'');if(type==='lab'||item.issuerLabName||item.issuer_lab_name)return false;if(type==='rental')return true;return Object.values(normalizeReq(fields||{})).some(Boolean);}
  const isRental=()=>PB1412IsRental(state.ctx?.invite,state.ctx?.membershipRequiredFields);
  const isExisting=()=>!state.ctx?.rejoiningAccount?.required&&Boolean(state.ctx?.existingAccount?.exists||state.ctx?.existingAccount);
  function prefillRejoiningName(form){
    const previousName=String(state.ctx?.rejoiningAccount?.previousName||'').trim();
    if(!state.ctx?.rejoiningAccount?.required||!previousName||form.dataset.pbR1549Prefilled==='1')return;
    for(const label of form.querySelectorAll('label')){
      if(!String(label.textContent||'').includes('نام عکاسی'))continue;
      const input=label.querySelector('input');
      if(!input)continue;
      if(!String(input.value||'').trim())setInputValue(input,previousName);
      // Only prefill: the new name stays fully editable.
      form.dataset.pbR1549Prefilled='1';
      break;
    }
  }
  function PB1411RentalShopName(invite){const item=invite||{};const options=[item.issuerRentalShopName,item.issuer_rental_shop_name,item.issuerName,item.issuer_name];return options.map(value=>String(value||'').trim()).find(value=>value&&value!=='فروشگاه'&&value!=='PhotoBridge')||'';}
  const hasProfileValue=k=>Boolean(String((state.ctx?.membershipProfile||{})[k]||'').trim());
  function hideLabel(label){label.classList.add('pbR94BaseHidden');label.querySelectorAll('input,select,button').forEach(el=>{if('required' in el)el.required=false;el.tabIndex=-1})}
  function hideBase(form){
    const rental=isRental(), existing=isExisting();
    for(const label of form.querySelectorAll('label')){
      if(label.closest('#pbR94InviteRequired,#pbR94ExistingIdentity')) continue;
      const t=String(label.textContent||'').replace(/\s+/g,' ').trim();
      // Existing PhotoBridge accounts must never see the legacy new-account form.
      // Keep only the two R98 sections: current account + fields requested by this store.
      if(existing){hideLabel(label);continue}
      if(t.includes('شماره مجوز عکاسی')) hideLabel(label);
    }
    if(existing){
      form.querySelectorAll('.iranLocationFields,.photographerSignupLocationPicker,.inviteExistingAccountCompact,.pbR91Identity,.pbR91InviteFields').forEach(x=>x.classList.add('pbR94BaseHidden'));
      form.querySelectorAll('.pbR91Identity,.pbR91InviteFields').forEach(x=>x.classList.add('pbR94BaseHidden'));
      // These belong to the legacy third section shown in the screenshot.
      for(const el of form.querySelectorAll(':scope > .alert.success,:scope > .inviteCheckingHint,:scope > .authSwitchLink')) el.classList.add('pbR94BaseHidden');
      form.classList.add('pbR94ExistingActive');
    }else form.classList.remove('pbR94ExistingActive');
  }
  function identityBox(){
    const box=document.getElementById('pbR94ExistingIdentity');
    // An already registered photographer must not be asked to review or fill
    // any of the account profile again.  The account summary used to be a
    // third card on this page and made it look as though the saved profile was
    // another required step.  Keep the invite page limited to this shop's
    // requested fields and the SMS confirmation.
    if(box)box.remove();
  }
  const jDiv=(a,b)=>~~(a/b),jMod=(a,b)=>a-~~(a/b)*b;
  function jalCal(jy,withoutLeap=false){const breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];let bl=breaks.length,gy=jy+621,leapJ=-14,jp=breaks[0],jm=0,jump=0,leap=0,leapG=0,march=0,n=0,i=0;if(jy<jp||jy>=breaks[bl-1])throw new Error('invalid_jalali_year');for(i=1;i<bl;i++){jm=breaks[i];jump=jm-jp;if(jy<jm)break;leapJ+=jDiv(jump,33)*8+jDiv(jMod(jump,33),4);jp=jm}n=jy-jp;leapJ+=jDiv(n,33)*8+jDiv(jMod(n,33)+3,4);if(jMod(jump,33)===4&&jump-n===4)leapJ++;leapG=jDiv(gy,4)-jDiv((jDiv(gy,100)+1)*3,4)-150;march=20+leapJ-leapG;if(withoutLeap)return{gy,march};if(jump-n<6)n=n-jump+jDiv(jump+4,33)*33;leap=jMod(jMod(n+1,33)-1,4);if(leap===-1)leap=4;return{leap,gy,march}}
  function g2d(gy,gm,gd){let d=jDiv((gy+jDiv(gm-8,6)+100100)*1461,4)+jDiv(153*jMod(gm+9,12)+2,5)+gd-34840408;d=d-jDiv(jDiv(gy+100100+jDiv(gm-8,6),100)*3,4)+752;return d}
  function d2g(jdn){let j=4*jdn+139361631;j=j+jDiv(jDiv(4*jdn+183187720,146097)*3,4)*4-3908;const i=jDiv(jMod(j,1461),4)*5+308,gd=jDiv(jMod(i,153),5)+1,gm=jMod(jDiv(i,153),12)+1,gy=jDiv(j,1461)-100100+jDiv(8-gm,6);return{gy,gm,gd}}
  function j2d(jy,jm,jd){const r=jalCal(jy,true);return g2d(r.gy,3,r.march)+(jm-1)*31-jDiv(jm,7)*(jm-7)+jd-1}
  function toGregorian(jy,jm,jd){return d2g(j2d(jy,jm,jd))}
  function jalaliPartsFromDate(d){try{const parts=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d),out={};for(const x of parts)if(['year','month','day'].includes(x.type))out[x.type]=Number(digits(x.value));return out.year?out:null}catch{return null}}
  function jalaliMonthLength(jy,jm){if(jm<=6)return 31;if(jm<=11)return 30;try{const g=toGregorian(jy,12,30),back=jalaliPartsFromDate(new Date(Date.UTC(g.gy,g.gm-1,g.gd,12)));return back&&back.year===jy&&back.month===12&&back.day===30?30:29}catch{return 29}}
  const jalaliMonths=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'],jalaliWeekdays=['ش','ی','د','س','چ','پ','ج'];
  function calendar(input){
    document.querySelector('#pbR95JalaliBackdrop')?.remove();
    document.querySelector('#pbR95JalaliPopover')?.remove();
    const today=jalaliPartsFromDate(new Date())||{year:1405,month:1,day:1};
    const parts=digits(state.values.birthJalali||input.value||'').match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    let yy=parts?Number(parts[1]):today.year,mm=parts?Number(parts[2]):today.month;
    const back=document.createElement('div');back.id='pbR95JalaliBackdrop';back.className='jalaliCalendarBackdrop open';
    const pop=document.createElement('div');pop.id='pbR95JalaliPopover';pop.className='jalaliCalendarPopover open';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','تقویم شمسی');
    document.body.append(back,pop);
    const close=()=>{back.remove();pop.remove()};back.onclick=close;
    const selectedParts=()=>digits(state.values.birthJalali||input.value||'').match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    const choose=d=>{const v=`${yy}/${String(mm).padStart(2,'0')}/${String(d).padStart(2,'0')}`;state.values.birthJalali=v;setInputValue(input,v);close()};
    const move=delta=>{let m=mm+delta,y=yy;if(m<1){m=12;y--}if(m>12){m=1;y++}if(y>today.year||y<1250)return;yy=y;mm=m;draw()};
    const position=()=>{if(innerWidth<=560)return;const r=input.getBoundingClientRect(),w=Math.min(330,innerWidth-24),h=Math.min(pop.offsetHeight||390,innerHeight-24);pop.style.left=Math.max(12,Math.min(innerWidth-w-12,r.right-w))+'px';pop.style.right='auto';pop.style.top=Math.max(12,Math.min(innerHeight-h-12,r.bottom+6))+'px';pop.style.bottom='auto'};
    const draw=()=>{
      const max=jalaliMonthLength(yy,mm);let firstDow=6;
      try{const g=toGregorian(yy,mm,1);firstDow=new Date(Date.UTC(g.gy,g.gm-1,g.gd,12)).getUTCDay()}catch{}
      const offset=(firstDow+1)%7,selected=selectedParts();let dayHtml='';
      for(let i=0;i<offset;i++)dayHtml+='<button type="button" class="jalaliDay blank" tabindex="-1"></button>';
      for(let d=1;d<=max;d++){
        const isSelected=selected&&Number(selected[1])===yy&&Number(selected[2])===mm&&Number(selected[3])===d;
        const isToday=today.year===yy&&today.month===mm&&today.day===d;
        const future=yy>today.year||(yy===today.year&&(mm>today.month||(mm===today.month&&d>today.day)));
        dayHtml+=`<button type="button" class="jalaliDay${isToday?' today':''}${isSelected?' selected':''}" data-jalali-day="${d}" ${future?'disabled':''}>${fa(d)}</button>`;
      }
      const years=[];for(let y=today.year;y>=1250;y--)years.push(`<option value="${y}" ${y===yy?'selected':''}>${fa(y)}</option>`);
      pop.innerHTML=`<div class="jalaliCalendarHead"><button type="button" data-jalali-nav="prev" aria-label="ماه قبل">‹</button><div class="jalaliCalendarTitle pbR100F9BirthTitle"><select data-jalali-month aria-label="انتخاب ماه" style="max-width:100%;min-height:30px;background:white;border:1px solid #d0d5dd;border-radius:8px;font:inherit">${jalaliMonths.map((name,index)=>`<option value="${index+1}" ${index+1===mm?'selected':''}>${name}</option>`).join('')}</select><select data-jalali-year-select aria-label="انتخاب سال تولد" class="pbR1417YearSelect">${years.join('')}</select></div><button type="button" data-jalali-nav="next" aria-label="ماه بعد">›</button></div><div class="jalaliWeekdays">${jalaliWeekdays.map(x=>`<span>${x}</span>`).join('')}</div><div class="jalaliDays">${dayHtml}</div><div class="jalaliCalendarFooter"><button type="button" data-jalali-clear>پاک کردن</button><button type="button" class="todayBtn" data-jalali-today>امروز</button></div>`;
      pop.querySelector('[data-jalali-month]').onchange=e=>{mm=Number(e.target.value);draw()};
      pop.querySelector('[data-jalali-nav="prev"]').onclick=()=>move(-1);
      pop.querySelector('[data-jalali-nav="next"]').onclick=()=>move(1);
      pop.querySelector('[data-jalali-year-select]').onchange=e=>{yy=Number(e.target.value)||yy;draw()};
      pop.querySelectorAll('[data-jalali-day]:not([disabled])').forEach(b=>b.onclick=()=>choose(Number(b.dataset.jalaliDay)));
      pop.querySelector('[data-jalali-clear]').onclick=()=>{state.values.birthJalali='';setInputValue(input,'');close()};
      pop.querySelector('[data-jalali-today]').onclick=()=>{yy=today.year;mm=today.month;choose(today.day)};
      requestAnimationFrame(position);
    };
    draw();
  }

  function textField(label,key,opt={}){
    const wrap=document.createElement('label');wrap.className='pbR94ReqField';wrap.append(document.createTextNode(label));const input=document.createElement('input');input.dataset.key=key;input.value=state.values[key]||'';input.dir=opt.dir||'ltr';input.inputMode=opt.numeric?'numeric':'text';input.required=true;
    const locked=isExisting()&&hasProfileValue(key);if(locked){input.readOnly=true;input.classList.add('locked');const s=document.createElement('small');s.textContent='از اطلاعات قبلی حساب شما خوانده شد.';wrap.append(input,s)}else{input.oninput=()=>state.values[key]=opt.numeric?digits(input.value).replace(/\D/g,''):digits(input.value);wrap.append(input)}return wrap;
  }
  function birthField(){
    const wrap=document.createElement('label');wrap.className='pbR94ReqField';wrap.append(document.createTextNode('تاریخ تولد (شمسی)'));const input=document.createElement('input');input.className='pbR95BirthInput jalaliDateInput';input.value=state.values.birthJalali||'';input.readOnly=true;input.required=true;input.placeholder='برای انتخاب تاریخ لمس کنید';wrap.append(input);
    const locked=isExisting()&&hasProfileValue('birthJalali');if(locked){input.classList.add('locked');const s=document.createElement('small');s.textContent='از اطلاعات قبلی حساب شما خوانده شد.';wrap.append(s)}else{input.onclick=e=>{e.preventDefault();calendar(input)}}return wrap;
  }
  async function uploadImage(file,status){
    status.textContent='در حال ارسال تصویر…';try{const r=await nativeFetch('/api/public/rental-invite-file/presign',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({inviteCode,mobile,mobileBinding:mb,name:file.name,contentType:file.type,bytes:file.size})});const j=await r.json();if(!r.ok)throw j;const u=await nativeFetch(j.uploadUrl,{method:'PUT',headers:{'content-type':file.type},body:file});if(!u.ok)throw new Error('upload_failed');state.values.businessLicenseImage={objectKey:j.objectKey,name:j.name,contentType:j.contentType,bytes:j.bytes};status.textContent='✓ تصویر جواز دریافت شد';status.classList.add('ok')}catch{state.values.businessLicenseImage=null;status.textContent='ارسال تصویر انجام نشد؛ دوباره انتخاب کن.';status.classList.remove('ok')}
  }
  function imageField(){
    const wrap=document.createElement('label');wrap.className='pbR94ReqField';wrap.append(document.createTextNode('تصویر جواز / پرونده'));const existing=state.ctx?.membershipProfile?.businessLicenseImage;
    if(existing){const s=document.createElement('div');s.className='pbR94ExistingFile';s.textContent='✓ تصویر جواز قبلاً در پرونده این فروشگاه ثبت شده است.';wrap.append(s);return wrap}
    const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.className='pbR95FileInput';input.required=!state.values.businessLicenseImage;input.id='pbR95LicenseFile';const picker=document.createElement('div');picker.className='pbR95FilePicker';picker.innerHTML='<span class="pbR95FileIcon">＋</span><span><b>انتخاب تصویر جواز / پرونده</b><small>JPG، PNG یا WEBP · حداکثر ۸ مگابایت</small></span><em>انتخاب فایل</em>';const st=document.createElement('small');st.className='pbR94UploadState';st.textContent=state.values.businessLicenseImage?'✓ تصویر دریافت شده است':'هنوز فایلی انتخاب نشده است';if(state.values.businessLicenseImage)st.classList.add('ok');picker.onclick=e=>{e.preventDefault();input.click()};input.onchange=()=>{const f=input.files?.[0];if(f){picker.querySelector('b').textContent=f.name;picker.querySelector('small').textContent='آماده ارسال';uploadImage(f,st)}};wrap.append(input,picker,st);return wrap;
  }
  function upgradeBaseBirthCalendar(form){
    if(isExisting())return;
    for(const label of form.querySelectorAll('label')){
      if(label.closest('#pbR94InviteRequired,#pbR94ExistingIdentity'))continue;
      const t=String(label.textContent||'').replace(/\s+/g,' ').trim();
      const input=label.querySelector('input');
      const hint=String(input?.getAttribute('aria-label')||input?.getAttribute('placeholder')||input?.name||'');
      if(!/تاریخ تولد|birth.?date/i.test(`${t} ${hint}`)||!input)continue;
      if(!state.values.birthJalali&&String(input.value||'').trim())state.values.birthJalali=digits(input.value).trim();
      input.readOnly=true;input.inputMode='none';input.dir='ltr';input.classList.add('pbR95BirthInput','jalaliDateInput','pbR100F7ProjectBirth');
      input.placeholder='برای انتخاب تاریخ لمس کنید';
      if(input.dataset.pbJalaliBound!=='1'){
        input.dataset.pbJalaliBound='1';
        input.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();calendar(input)}},true);
        input.addEventListener('click',e=>{e.preventDefault();calendar(input)},true);
      }
      input.setAttribute('aria-haspopup','dialog');input.setAttribute('aria-label','انتخاب تاریخ تولد با تقویم شمسی');
    }
  }
  function signupActionButton(form){
    // Never use a nested primary button (for example the map's "current location" button)
    // as the insertion anchor. The invite fields must always be a direct child of the form.
    const direct=[...form.children].filter(el=>el?.tagName==='BUTTON');
    return direct.find(el=>el.type==='submit')||direct.find(el=>el.classList.contains('primary'))||null;
  }
  function placeRequiredBox(form,box){
    // Keep injected invite details outside React's managed form subtree. Values
    // are copied into the signup request by the fetch adapter below.
    if(box.parentElement!==form.parentElement||box.nextElementSibling!==form)form.before(box);
  }
  function requiredBox(form){
    let box=document.getElementById('pbR94InviteRequired');
    
    const allReq=required(),req=Object.fromEntries(Object.entries(allReq).map(([key,value])=>[key,value&&(!isExisting()||!hasProfileValue(key==='birthDate'?'birthJalali':key))]));const hasExtras=Object.values(req).some(Boolean);if(!hasExtras){if(box)box.classList.add('pbR94BaseHidden');return}
    const p=state.ctx?.membershipProfile||{},sig=JSON.stringify({req,existing:isExisting(),birth:p.birthJalali||'',national:p.nationalId||'',certificate:p.birthCertificateNo||'',license:p.businessLicenseNo||'',image:Boolean(p.businessLicenseImage)});
    if(box&&box.dataset.sig===sig){placeRequiredBox(form,box);return}
    if(!box){box=document.createElement('section');box.id='pbR94InviteRequired';box.className='pbR94Required'}
    box.classList.remove('pbR94BaseHidden');box.dataset.sig=sig;const shopName=PB1411RentalShopName(state.ctx?.invite);box.replaceChildren();const title=document.createElement('b');title.textContent=shopName?'اطلاعات درخواستی فروشگاه «'+shopName+'»':'اطلاعات درخواستی فروشگاه';if(!isRental()){const labName=PB1412LabName(state.ctx?.invite);title.textContent=labName?'اطلاعات درخواستی لابراتوار «'+labName+'»':'اطلاعات درخواستی لابراتوار';}box.append(title);
    if(req.birthDate&&isExisting())box.append(birthField());if(req.nationalId)box.append(textField('کد ملی','nationalId',{numeric:true}));if(req.birthCertificateNo)box.append(textField('شماره شناسنامه','birthCertificateNo',{numeric:true}));if(req.businessLicenseNo)box.append(textField('شماره جواز / پرونده','businessLicenseNo'));if(req.businessLicenseImage)box.append(imageField());
    placeRequiredBox(form,box);
  }
  function formTopChild(form,node){
    let el=node;
    while(el&&el.parentElement&&el.parentElement!==form)el=el.parentElement;
    return el&&el.parentElement===form?el:node;
  }
  function removeLegacyNode(form,node){
    if(!node||node.closest?.('#pbR94ExistingIdentity,#pbR94InviteRequired'))return;
    const el=formTopChild(form,node);
    if(!el||el===form||el.id==='pbR94ExistingIdentity'||el.id==='pbR94InviteRequired')return;
    el.querySelectorAll?.('input,select,textarea,button').forEach(x=>{if('required' in x)x.required=false});
    // Keep React-owned nodes in place. Removing them behind React's back makes
    // its next form render fail with NotFoundError and drops the submit action.
    el.classList.add('pbR94BaseHidden');
  }
  function cleanupExistingLegacyForm(form,button){
    if(!isExisting())return;
    // Earlier invite overlays can append their own profile/required-fields
    // cards next to the React form.  They duplicate data already stored on
    // the photographer account.  Remove them globally, but preserve the one
    // canonical R98 card containing only fields requested by this shop.
    const legacyCards='.pbR74Identity,.pbR74InviteFields,.pbR75Identity,.pbR75InviteFields,.pbR76Identity,.pbR76InviteFields,.pbR89Identity,.pbR89InviteFields,.pbR90Identity,.pbR90InviteFields,.pbR91Identity,.pbR91InviteFields,.inviteExistingAccountCompact';
    document.querySelectorAll(legacyCards).forEach(x=>{
      x.querySelectorAll?.('input,select,textarea,button').forEach(control=>{if('required' in control)control.required=false});
      x.classList.add('pbR94BaseHidden');
    });
    // R100F4: React may still render the complete new-account form even though
    // the public context has already identified an existing photographer. Remove
    // those specific legacy controls by meaning, regardless of their DOM nesting.
    const legacyLabels=['کد دعوت','نام عکاسی / آتلیه','تاریخ تولد عکاس','شماره مجوز عکاسی','شماره موبایل','رمز عبور','تکرار رمز'];
    [...form.querySelectorAll('label')].forEach(label=>{
      if(label.closest('#pbR94ExistingIdentity,#pbR94InviteRequired'))return;
      const text=String(label.textContent||'').replace(/\s+/g,' ').trim();
      if(legacyLabels.some(x=>text.startsWith(x)))removeLegacyNode(form,label);
    });
    // Province/city and map are rendered by their own React components.
    form.querySelectorAll('select[name="province"],select[name="city"],input[name="province"],input[name="city"],.photographerSignupLocationPicker').forEach(x=>removeLegacyNode(form,x));
    // Remove invite validation/checking notices that belong to the new-account form.
    form.querySelectorAll('.inviteCheckingHint,.authSwitchLink,.alert.success').forEach(x=>{
      if(x.closest('#pbR94ExistingIdentity,#pbR94InviteRequired'))return;
      const t=String(x.textContent||'').replace(/\s+/g,' ').trim();
      if(x.matches('.inviteCheckingHint,.authSwitchLink')||/دعوتنامه معتبر است|دعوت‌نامه معتبر است/.test(t))removeLegacyNode(form,x);
    });
    // Any old activation button that survived must go; keep only our connection button.
    form.querySelectorAll('button').forEach(x=>{
      if(x===button||x.closest('#pbR94InviteRequired'))return;
      const t=String(x.textContent||'').replace(/\s+/g,' ').trim();
      if(/تأیید موبایل و فعال.?سازی عکاس|ارسال کد تأیید/.test(t))removeLegacyNode(form,x);
    });
  }
  function PB1412LabName(invite){const item=invite||{};return [item.issuerLabName,item.issuer_lab_name,item.issuerName,item.issuer_name].map(value=>String(value||'').trim()).find(value=>value&&!['فروشگاه','لابراتوار','PhotoBridge'].includes(value))||'';}
  function decorateRentalIntro(){
    if(!isRental()){const intro=document.querySelector('.photographerSignupIntro');if(!intro)return;const name=PB1412LabName(state.ctx?.invite),lab=name?'لابراتوار «'+name+'»':'لابراتوار عکاسی';const h=intro.querySelector('h1'),p=intro.querySelector('p');if(h)h.textContent='به '+lab+' خوش آمدید';if(p)p.textContent=isExisting()?'با تأیید این دعوت، حساب فعلی شما به '+lab+' متصل می‌شود و سفارش چاپ، آلبوم و پیگیری همکاری را آنلاین انجام می‌دهید.':'با عضویت در '+lab+'، سفارش چاپ و آلبوم را آنلاین ثبت و پیگیری می‌کنید.';const labels=['سفارش چاپ عکس','سفارش آلبوم','پیگیری آنلاین سفارش'];[...intro.querySelectorAll('.trialFacts span')].forEach((x,i)=>{if(labels[i])x.textContent=labels[i]});return;}
    const shopName=PB1411RentalShopName(state.ctx?.invite);
    const intro=document.querySelector('.photographerSignupIntro');if(!intro)return;
    const h=intro.querySelector('h1'),p=intro.querySelector('p');
    if(h)h.textContent=shopName?'به فروشگاه «'+shopName+'» خوش آمدید':'به فروشگاه تجهیزات خوش آمدید';
    if(p){const name=shopName?'فروشگاه «'+shopName+'»':'فروشگاه دعوت‌کننده';p.textContent=isExisting()?'با تأیید این دعوت، حساب فعلی شما به '+name+' متصل می‌شود و آفیش، رزرو تجهیزات و پیگیری همکاری را آنلاین انجام می‌دهید.':'با عضویت در '+name+'، آفیش و رزرو تجهیزات را غیرحضوری دریافت می‌کنید و مراحل همکاری را آنلاین در PhotoBridge پیگیری می‌کنید.'}
    const facts=[...intro.querySelectorAll('.trialFacts span')],labels=['آفیش غیرحضوری','رزرو آنلاین تجهیزات','پیگیری آنلاین همکاری'];facts.forEach((x,i)=>{if(labels[i])x.textContent=labels[i]});
  }
  function tweakButton(form){
    if(!isExisting())return null;
    const b=signupActionButton(form);
    if(!b)return null;
    // Existing-account invite cards are rendered with a button whose React
    // click action is unreliable after the legacy signup controls are hidden.
    // Keep this as a button and explicitly submit its owning form so React's
    // normal submit handler starts the SMS verification flow.
    b.type='button';
    if(b.dataset.pbR100F68SubmitBridge!=='1'){
      b.dataset.pbR100F68SubmitBridge='1';
      b.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        const req=required(),missing=[];
        if(req.birthDate&&!String(state.values.birthJalali||'').trim())missing.push('تاریخ تولد');
        if(req.nationalId&&!String(state.values.nationalId||'').trim())missing.push('کد ملی');
        if(req.birthCertificateNo&&!String(state.values.birthCertificateNo||'').trim())missing.push('شماره شناسنامه');
        if(req.businessLicenseNo&&!String(state.values.businessLicenseNo||'').trim())missing.push('شماره جواز / پرونده');
        if(req.businessLicenseImage&&!state.values.businessLicenseImage&&!state.ctx?.membershipProfile?.businessLicenseImage)missing.push('تصویر جواز / پرونده');
        if(missing.length){
          const box=document.getElementById('pbR94InviteRequired');
          let status=box?.querySelector('.pbR100F68SubmitStatus');
          if(box&&!status){status=document.createElement('small');status.className='pbR100F68SubmitStatus';status.setAttribute('role','alert');box.append(status)}
          if(status)status.textContent=`لطفاً این موارد را تکمیل کنید: ${missing.join('، ')}`;
          return;
        }
        const status=document.querySelector('#pbR94InviteRequired .pbR100F68SubmitStatus');
        if(status)status.textContent='';
        if(typeof form.requestSubmit==='function')form.requestSubmit();
        else form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
      },true);
    }
    const text=String(b.textContent||'').trim();
    if(!/کد|در حال/.test(text))b.textContent=isRental()?'تأیید اطلاعات و اتصال به فروشگاه':'تأیید اطلاعات و اتصال به لابراتوار';
    b.classList.remove('pbR94BaseHidden','pbR100F3LegacyInviteTail');
    b.removeAttribute('aria-hidden'); if('inert' in b)b.inert=false; b.tabIndex=0;
    return b;
  }
  let observedForm=null,formObserver=null;
  function watchExistingForm(form){
    if(observedForm===form)return;
    formObserver?.disconnect(); observedForm=form;
    formObserver=new MutationObserver(()=>schedule());
    // Only watch top-level React replacements. Do not observe attributes/subtree;
    // this avoids the scroll-lock/performance regression of the old invite observer.
    formObserver.observe(form,{childList:true});
  }
  function render(){state.raf=0;const form=document.querySelector('.photographerSignupForm');if(!form||!state.ctx||!state.contextReady)return;document.documentElement.classList.toggle('pbR1411ExistingRentalInvite',isExisting()&&Boolean(state.ctx?.invite));watchExistingForm(form);decorateRentalIntro();if(form.querySelector('input[maxlength="6"],input[autocomplete="one-time-code"]')){document.getElementById('pbR94InviteRequired')?.classList.add('pbR94BaseHidden');clearTimeout(window.__PB_INVITE_GATE_TIMEOUT__);document.documentElement.classList.remove('pbR100F7InviteBootPending');return}upgradeBaseBirthCalendar(form);hideBase(form);prefillRejoiningName(form);identityBox(form);requiredBox(form);const b=tweakButton(form);cleanupExistingLegacyForm(form,b);clearTimeout(window.__PB_INVITE_GATE_TIMEOUT__);document.documentElement.classList.remove('pbR100F7InviteBootPending');}
  function schedule(){if(state.raf)return;state.raf=requestAnimationFrame(render)}
  let settleTimers=[];function scheduleSeries(){schedule();settleTimers.forEach(clearTimeout);settleTimers=[80,220,600,1400,3000,6000,10000].map(ms=>setTimeout(schedule,ms))}
  async function bootstrap(){
    if(state.loading||state.contextReady)return;
    state.loading=true;
    let accepted=false,validInvite=false;
    const opts={credentials:'same-origin',cache:'no-store'};
    const normalizeMobile=value=>{
      const digitsOnly=digits(value||'').replace(/\D/g,'');
      if(/^09\d{9}$/.test(digitsOnly))return digitsOnly;
      if(/^989\d{9}$/.test(digitsOnly))return '0'+digitsOnly.slice(2);
      if(/^9\d{9}$/.test(digitsOnly))return '0'+digitsOnly;
      return '';
    };
    const getInvite=async()=>{
      const res=await nativeFetch('/api/public/photographer-invites/'+encodeURIComponent(inviteCode),opts);
      if(!res.ok)return null;
      const json=await res.json();
      return json&&json.invite?json:null;
    };
    const checkAccount=async number=>{
      if(!number)return false;
      const params='?invite='+encodeURIComponent(inviteCode)+'&mobile='+encodeURIComponent(number)+(mb?'&mb='+encodeURIComponent(mb):'');
      const res=await nativeFetch('/api/public/photographer-signup/context-fast'+params,opts);
      if(!res.ok)return false;
      return acceptSignupContext(await res.json());
    };
    try{
      const initialMobile=normalizeMobile(mobile);
      // A URL containing a mobile can load its invitation and account context in parallel.
      const [inviteResult,contextResult]=await Promise.allSettled([
        getInvite(),initialMobile?checkAccount(initialMobile):Promise.resolve(false)
      ]);
      if(inviteResult.status==='fulfilled'&&inviteResult.value){
        validInvite=true;
        if(inviteResult.value.invite)mergeCtx({invite:inviteResult.value.invite});
        if(inviteResult.value.signupContext)acceptSignupContext(inviteResult.value.signupContext);
      }
      accepted=state.contextReady||(contextResult.status==='fulfilled'&&contextResult.value===true);
      if(!accepted&&!state.contextReady){
        const boundMobile=normalizeMobile(state.ctx?.invite?.targetMobile||state.ctx?.invite?.target_mobile);
        if(boundMobile&&boundMobile!==initialMobile)accepted=await checkAccount(boundMobile).catch(()=>false);
      }
      // A generic link has no known member until a mobile is entered; show the form now.
      if(!accepted&&!state.contextReady&&validInvite&&!initialMobile&&!normalizeMobile(state.ctx?.invite?.targetMobile))releaseContextGate();
    }catch{}finally{
      state.loading=false;
      if(!accepted&&!state.contextReady)showContextRetry();
      scheduleSeries();
    }
  }
  window.fetch=async function(input,init={}){
    const raw=typeof input==='string'?input:(input?.url||'');let url;try{url=new URL(raw,location.origin)}catch{return nativeFetch(input,init)}const method=String(init?.method||'GET').toUpperCase();
    if(url.origin===location.origin&&url.pathname==='/api/public/photographer-signup'&&method==='POST'&&typeof init.body==='string'){
      try{const b=JSON.parse(init.body),req=required();if(state.values.birthJalali)b.birthJalali=state.values.birthJalali;if(req.nationalId)b.nationalId=state.values.nationalId||'';if(req.birthCertificateNo)b.birthCertificateNo=state.values.birthCertificateNo||'';if(req.businessLicenseNo)b.businessLicenseNo=state.values.businessLicenseNo||'';if(req.businessLicenseImage&&state.values.businessLicenseImage&&!state.ctx?.membershipProfile?.businessLicenseImage)b.businessLicenseImage=state.values.businessLicenseImage;if(isExisting()){b.name='';b.province='';b.city='';b.locationLat=null;b.locationLng=null;b.locationAddress='';b.password='';b.confirmPassword=''}init={...init,body:JSON.stringify(b)}}catch{}
    }
    const res=await nativeFetch(input,init);
    if(url.origin===location.origin&&url.pathname.includes('/api/public/photographer-signup/context')&&res.ok)res.clone().json().then(acceptSignupContext).catch(()=>{});
    if(url.origin===location.origin&&url.pathname==='/api/public/photographer-signup'&&method==='POST'&&!res.ok){res.clone().json().then(j=>{if(j?.requiredFields)mergeCtx({membershipRequiredFields:j.requiredFields,membershipProfile:j.profile||null});else if(j?.error==='membership_profile_required'){const map={'تاریخ تولد':'birthDate','شماره ملی':'nationalId','کد ملی':'nationalId','شماره شناسنامه':'birthCertificateNo','شماره جواز / پرونده':'businessLicenseNo','تصویر جواز / پرونده':'businessLicenseImage'},r={...required()};for(const f of j.fields||j.missingFields||[]){const k=map[String(f)];if(k)r[k]=true}mergeCtx({membershipRequiredFields:r})}}).catch(()=>{})}
    return res;
  };
  const css=document.createElement('style');css.id='pbR96InviteStyle';css.textContent=`.pbR94BaseHidden{display:none!important}.pbR94Identity,.pbR94Required{margin:12px 0;padding:13px;border:1px solid #dbe4f0;border-radius:16px;background:#f8fbff;display:grid;gap:9px;width:100%;max-width:100%;min-width:0;box-sizing:border-box;overflow:hidden}.pbR94Identity>b,.pbR94Required>b{font-size:14px;color:#172033}.pbR94Identity{grid-template-columns:1fr 1fr}.pbR94Identity>b{grid-column:1/-1}.pbR94Identity>div{display:grid;gap:4px;border:1px solid #e2e8f0;border-radius:11px;padding:9px;background:#fff}.pbR94Identity span,.pbR94Required>small,.pbR94ReqField small{font-size:10px;color:#667085}.pbR94Identity strong{font-size:13px;color:#344054}.pbR94ReqField{display:grid!important;gap:6px!important;font-size:12px!important;font-weight:800!important;min-width:0!important;max-width:100%!important}.pbR94ReqField input{width:100%!important;box-sizing:border-box!important;min-height:44px!important;border:1px solid #d0d5dd!important;border-radius:11px!important;background:#fff!important;padding:9px 11px!important;font:700 13px Vazirmatn,Tahoma,Arial!important}.pbR94ReqField input.locked{background:#f2f4f7!important;color:#475467!important}.pbR95BirthInput:not(.locked){cursor:pointer!important}.pbR94ExistingFile{border:1px solid #a6e1c7;background:#ecfdf3;color:#027a48;border-radius:11px;padding:10px;font-size:11px}.pbR94UploadState{font-size:10px!important}.pbR94UploadState.ok{color:#027a48!important}.pbR95FileInput{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.pbR95FilePicker{min-height:76px;border:1px dashed #b9c8e8;border-radius:13px;background:linear-gradient(135deg,#f8fbff,#f5f7ff);display:flex;align-items:center;gap:10px;padding:11px 12px;cursor:pointer;transition:.18s ease}.pbR95FilePicker:hover{border-color:#7d9cff;background:#f1f5ff;box-shadow:0 5px 16px rgba(49,94,251,.08)}.pbR95FileIcon{width:42px;height:42px;border-radius:11px;background:#fff;border:1px solid #dbe5ff;color:#315efb;display:grid;place-items:center;font-size:23px;flex:0 0 auto}.pbR95FilePicker>span:nth-child(2){display:grid;gap:2px;min-width:0;flex:1}.pbR95FilePicker b{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pbR95FilePicker small{font-size:9px!important;color:#667085!important}.pbR95FilePicker em{font-style:normal;font-size:9px;color:#315efb;background:#fff;border:1px solid #dbe5ff;border-radius:9px;padding:7px 9px;white-space:nowrap}.jalaliCalendarBackdrop{position:fixed;inset:0;z-index:2147482998;background:rgba(15,23,42,.16);opacity:0;pointer-events:none;transition:opacity .18s ease}.jalaliCalendarBackdrop.open{opacity:1;pointer-events:auto}.jalaliCalendarPopover{position:fixed;z-index:2147482999;width:min(330px,calc(100vw - 24px));border:1px solid #e4e7ec;border-radius:16px;background:#fff;box-shadow:0 24px 64px rgba(15,23,42,.22);padding:11px;direction:rtl}.jalaliCalendarHead{display:grid;grid-template-columns:38px 1fr 38px;gap:6px;align-items:center;margin-bottom:8px}.jalaliCalendarHead>button{height:36px;border:1px solid #e4e7ec;border-radius:10px;background:#f8fafc;color:#475467;font:900 18px Vazirmatn;cursor:pointer}.jalaliCalendarTitle{text-align:center}.pbR100F9BirthTitle{display:grid;justify-items:center;gap:1px}.pbR100F9YearButton{border:0!important;background:transparent!important;height:auto!important;min-height:20px!important;padding:0 8px!important;border-radius:7px!important;color:#667085!important;font:850 9px Vazirmatn,Tahoma,Arial!important;cursor:pointer!important}.pbR100F9YearButton:hover,.pbR100F9YearButton.open{background:#eef2ff!important;color:#315efb!important}.pbR100F9YearButton span{font-size:9px}.pbR100F9YearPanel{max-height:182px;overflow:auto;margin:-2px 0 9px;padding:7px;border:1px solid #e4e7ec;border-radius:11px;background:#f8fafc;scrollbar-width:thin}.pbR100F9YearPanel[hidden]{display:none!important}.pbR100F9YearGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}.pbR100F9YearOption{min-height:31px;border:1px solid transparent;border-radius:8px;background:#fff;color:#475467;font:800 9px Vazirmatn,Tahoma,Arial;cursor:pointer}.pbR100F9YearOption:hover{border-color:#c7d2fe;color:#315efb}.pbR100F9YearOption.selected{background:#315efb;color:#fff;border-color:#315efb}.pbR96BirthCalendarTitle{display:grid!important;grid-template-rows:auto auto!important;gap:0!important;align-items:center}.pbR96BirthCalendarTitle select{appearance:none;-webkit-appearance:none;width:100%;height:auto;border:0!important;background:transparent!important;text-align:center;text-align-last:center;padding:0!important;margin:0!important;color:#344054;cursor:pointer;font-family:Vazirmatn,Tahoma,Arial!important}.pbR96BirthCalendarTitle [data-month]{font-size:12px!important;font-weight:900!important;line-height:18px}.pbR96BirthCalendarTitle [data-year]{font-size:8.5px!important;font-weight:800!important;color:#98a2b3!important;line-height:14px}.jalaliWeekdays,.jalaliDays{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.jalaliWeekdays span{text-align:center;font-size:8px;color:#98a2b3;font-weight:800;padding:3px 0}.jalaliDay{aspect-ratio:1;border:0;border-radius:9px;background:transparent;color:#344054;font:800 9.5px Vazirmatn;cursor:pointer}.jalaliDay:hover{background:#eef2ff;color:#315efb}.jalaliDay.today{box-shadow:inset 0 0 0 1px #a8b8ff;color:#315efb}.jalaliDay.selected{background:#315efb!important;color:#fff!important;box-shadow:none}.jalaliDay.blank{visibility:hidden;pointer-events:none}.jalaliDay:disabled{opacity:.28;cursor:not-allowed;pointer-events:none}.jalaliCalendarFooter{display:flex;gap:6px;margin-top:9px;padding-top:9px;border-top:1px solid #f0f2f5}.jalaliCalendarFooter button{flex:1;min-height:36px;border:1px solid #d0d5dd;border-radius:9px;background:#fff;color:#475467;font:850 9px Vazirmatn;cursor:pointer}.jalaliCalendarFooter .todayBtn{border-color:#c7d2fe;background:#eef2ff;color:#315efb}.photographerSignupForm.pbR94ExistingActive{overflow:visible!important}.pbBirthProjectBackdrop{position:fixed;inset:0;z-index:2147482998;background:rgba(15,23,42,.18)}.pbBirthProjectCalendar{position:fixed!important;z-index:2147482999!important;width:min(310px,calc(100vw - 24px))!important;padding:10px!important;direction:rtl!important;margin:0!important}.pbBirthProjectCalendar .pbBirthProjectMonthYear{display:grid;grid-template-columns:1.15fr .85fr;gap:5px;align-items:center}.pbBirthProjectCalendar .pbBirthProjectMonthYear select{width:100%;height:30px;border:1px solid #e4e7ec;border-radius:9px;background:#fff;color:#344054;font:800 9px Vazirmatn,Tahoma,Arial;padding:0 5px;text-align:center}.pbBirthProjectCalendar .calendarGrid button.today{border-color:#93c5fd;background:#eff6ff}.pbBirthProjectCalendar .calendarGrid button.today b{color:#1d4ed8}.pbBirthProjectCalendar .calendarGrid button.selected.today b{color:#fff}@media(max-width:600px){.pbBirthProjectCalendar{left:12px!important;right:12px!important;top:auto!important;bottom:12px!important;width:auto!important;max-height:calc(100dvh - 24px)!important;overflow:auto!important}.pbBirthProjectBackdrop{background:rgba(15,23,42,.30)}}html.pbR98InviteScroll,html.pbR98InviteScroll body{height:auto!important;min-height:100%!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior-y:auto!important}html.pbR98InviteScroll body{position:static!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important}html.pbR98InviteScroll body #root{height:auto!important;min-height:100dvh!important;max-height:none!important;overflow:visible!important;position:static!important;touch-action:pan-y!important}html.pbR98InviteScroll body #root .photographerSignupPage{height:auto!important;min-height:100dvh!important;max-height:none!important;overflow:visible!important;position:relative!important;inset:auto!important;touch-action:pan-y!important;padding-bottom:max(36px,env(safe-area-inset-bottom))!important}html.pbR98InviteScroll body #root .photographerSignupShell,html.pbR98InviteScroll body #root .photographerSignupForm{height:auto!important;min-height:0!important;min-width:0!important;max-width:100%!important;max-height:none!important;overflow:visible!important;position:relative!important;touch-action:pan-y!important}.pbR94Required>*{min-width:0;max-width:100%;overflow-wrap:anywhere}html.pbR98InviteScroll body.pbR98InviteScrollBody{overflow-y:auto!important}@media(max-width:600px){.photographerSignupShell,.photographerSignupForm{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}.photographerSignupForm>#pbR94InviteRequired,.photographerSignupForm>#pbR94ExistingIdentity{grid-column:1/-1!important;justify-self:stretch!important;align-self:stretch!important}.pbR94Required,.pbR94Identity{width:100%!important;max-width:100%!important;min-width:0!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important}.pbR94Required>b,.pbR94Identity>b{max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important}.pbR94ReqField,.pbR95FilePicker{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}.pbR94ReqField input{min-width:0!important;max-width:100%!important}.pbR94Identity{grid-template-columns:1fr}.pbR94Identity>b{grid-column:1}.pbR95FilePicker em{display:none}.jalaliCalendarPopover{left:12px!important;right:12px!important;top:auto!important;bottom:12px!important;width:auto!important}.jalaliCalendarBackdrop{background:rgba(15,23,42,.30)}}`;document.head.append(css);
  const layoutFix=document.createElement('style');layoutFix.textContent='.pbR94Required,.pbR94Identity{grid-column:1/-1!important;justify-self:stretch!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}';document.head.append(layoutFix);
  const refreshFromForm=e=>{const t=e?.target;if(t&&t.closest?.('.photographerSignupForm'))schedule()};
  document.addEventListener('input',refreshFromForm,{passive:true});document.addEventListener('change',refreshFromForm,{passive:true});
  addEventListener('pageshow',()=>{enableInviteScroll();bootstrap();scheduleSeries()},{passive:true});
  document.addEventListener('DOMContentLoaded',()=>{enableInviteScroll();bootstrap();scheduleSeries()},{once:true});
  enableInviteScroll();bootstrap();scheduleSeries();
})();

/* PB1411 existing rental invitation */
