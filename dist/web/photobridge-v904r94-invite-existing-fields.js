(()=>{
  if(location.pathname!=='/photographer/signup' || window.__PB_R94_INVITE_EXISTING_FIELDS__) return;
  window.__PB_R94_INVITE_EXISTING_FIELDS__=true;
  const q=new URLSearchParams(location.search);
  const inviteCode=String(q.get('invite')||'').trim();
  const mobile=String(q.get('mobile')||'').trim();
  const mb=String(q.get('mb')||'').trim();
  if(!inviteCode) return;
  const nativeFetch=window.fetch.bind(window);
  const state={ctx:null,values:{birthJalali:'',nationalId:'',birthCertificateNo:'',businessLicenseNo:'',businessLicenseImage:null},raf:0,loading:false};
  const digits=s=>String(s||'').replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[+d]);
  const normalizeReq=r=>({birthDate:r?.birthDate===true,nationalId:r?.nationalId===true,birthCertificateNo:r?.birthCertificateNo===true,businessLicenseNo:r?.businessLicenseNo===true,businessLicenseImage:r?.businessLicenseImage===true});
  function mergeCtx(x){
    if(!x||typeof x!=='object') return;
    const old=state.ctx||{}, next={...old,...x};
    const a=normalizeReq(old.membershipRequiredFields||{}),b=normalizeReq(x.membershipRequiredFields||{});
    next.membershipRequiredFields={birthDate:a.birthDate||b.birthDate,nationalId:a.nationalId||b.nationalId,birthCertificateNo:a.birthCertificateNo||b.birthCertificateNo,businessLicenseNo:a.businessLicenseNo||b.businessLicenseNo,businessLicenseImage:a.businessLicenseImage||b.businessLicenseImage};
    const oa=old.existingAccount&&typeof old.existingAccount==='object'?old.existingAccount:{},na=x.existingAccount&&typeof x.existingAccount==='object'?x.existingAccount:{};
    const mergedAccount={...oa,...Object.fromEntries(Object.entries(na).filter(([,v])=>v!==null&&v!==undefined&&v!==''))};
    next.existingAccount=Object.keys(mergedAccount).length?mergedAccount:null;
    next.invite={...(old.invite||{}),...(x.invite||{})};
    const op=old.membershipProfile||{},np=x.membershipProfile||{};
    next.membershipProfile={...op,...Object.fromEntries(Object.entries(np).filter(([,v])=>v!==null&&v!==undefined&&v!==''))};
    if(!Object.keys(next.membershipProfile).length) next.membershipProfile=null;
    state.ctx=next;
    seed(); schedule();
  }
  function seed(){
    const p=state.ctx?.membershipProfile||{};
    for(const k of ['birthJalali','nationalId','birthCertificateNo','businessLicenseNo']) if(!state.values[k]&&p[k]) state.values[k]=String(p[k]);
    if(!state.values.businessLicenseImage&&p.businessLicenseImage) state.values.businessLicenseImage=p.businessLicenseImage;
  }
  const required=()=>normalizeReq(state.ctx?.membershipRequiredFields||{});
  const isRental=()=>state.ctx?.invite?.issuerType==='rental'||state.ctx?.invite?.issuer_type==='rental'||Object.values(required()).some(Boolean);
  const isExisting=()=>Boolean(state.ctx?.existingAccount?.exists||state.ctx?.existingAccount);
  const hasProfileValue=k=>Boolean(String((state.ctx?.membershipProfile||{})[k]||'').trim());
  function hideLabel(label){label.classList.add('pbR94BaseHidden');label.querySelectorAll('input,select,button').forEach(el=>{if('required' in el)el.required=false;el.tabIndex=-1})}
  function hideBase(form){
    const rental=isRental(), existing=isExisting();
    for(const label of form.querySelectorAll('label')){
      if(label.closest('#pbR94InviteRequired,#pbR94ExistingIdentity')) continue;
      const t=String(label.textContent||'').replace(/\s+/g,' ').trim();
      if(rental&&(t.includes('تاریخ تولد عکاس')||t.includes('شماره مجوز عکاسی'))) hideLabel(label);
      if(existing&&(t.startsWith('نام عکاسی / آتلیه')||t.startsWith('شماره موبایل')||t==='رمز عبور'||t==='تکرار رمز'||t.startsWith('رمز عبور')||t.startsWith('تکرار رمز'))) hideLabel(label);
    }
    if(existing){
      form.querySelectorAll('.iranLocationFields,.photographerSignupLocationPicker,.inviteExistingAccountCompact,.pbR91Identity,.pbR91InviteFields').forEach(x=>x.classList.add('pbR94BaseHidden'));
      form.querySelectorAll('.pbR91Identity,.pbR91InviteFields').forEach(x=>x.remove());
      form.classList.add('pbR94ExistingActive');
    }else form.classList.remove('pbR94ExistingActive');
  }
  function identityBox(form){
    if(!isExisting()){form.querySelector('#pbR94ExistingIdentity')?.remove();return}
    const a=state.ctx.existingAccount||{},p=state.ctx.membershipProfile||{};
    const baseValue=(names)=>{for(const n of names){const el=form.querySelector(`[name="${n}"]`);const v=String(el?.value||'').trim();if(v)return v}return''};
    const name=String(a.studioName||a.name||p.name||baseValue(['name','studioName'])||'').trim()||'—';
    const mob=String(a.mobile||p.mobile||state.ctx?.mobile||mobile||baseValue(['mobile'])||'').trim()||'—';
    const province=String(a.province||p.province||baseValue(['province'])||'').trim()||'—';
    const city=String(a.city||p.city||baseValue(['city'])||'').trim()||'—';
    let box=form.querySelector('#pbR94ExistingIdentity');
    if(!box){box=document.createElement('section');box.id='pbR94ExistingIdentity';box.className='pbR94Identity';const h=form.firstElementChild;h?.after(box)}
    const sig=JSON.stringify([name,mob,province,city]); if(box.dataset.sig===sig)return;box.dataset.sig=sig;
    box.innerHTML=`<b>اطلاعات حساب فعلی PhotoBridge</b><div><span>نام عکاسی / آتلیه</span><strong>${esc(name)}</strong></div><div><span>شماره موبایل</span><strong dir="ltr">${esc(mob)}</strong></div><div><span>استان</span><strong>${esc(province)}</strong></div><div><span>شهر</span><strong>${esc(city)}</strong></div>`;
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
    document.querySelector('#pbR95JalaliBackdrop')?.remove();document.querySelector('#pbR95JalaliPopover')?.remove();
    const today=jalaliPartsFromDate(new Date())||{year:1405,month:1,day:1};let parts=digits(state.values.birthJalali||'').match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);let yy=parts?Number(parts[1]):today.year,mm=parts?Number(parts[2]):today.month;
    const back=document.createElement('div');back.id='pbR95JalaliBackdrop';back.className='jalaliCalendarBackdrop open';const pop=document.createElement('div');pop.id='pbR95JalaliPopover';pop.className='jalaliCalendarPopover open pbR95BirthCalendar';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','تقویم شمسی');document.body.append(back,pop);
    const close=()=>{back.remove();pop.remove()};back.onclick=close;
    const draw=()=>{const max=jalaliMonthLength(yy,mm);let firstDow=6;try{const g=toGregorian(yy,mm,1);firstDow=new Date(Date.UTC(g.gy,g.gm-1,g.gd,12)).getUTCDay()}catch{}const offset=(firstDow+1)%7;const selected=digits(state.values.birthJalali||'').match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);let days='';for(let i=0;i<offset;i++)days+='<button type="button" class="jalaliDay blank" tabindex="-1"></button>';for(let d=1;d<=max;d++){const sel=selected&&Number(selected[1])===yy&&Number(selected[2])===mm&&Number(selected[3])===d,now=today.year===yy&&today.month===mm&&today.day===d;days+=`<button type="button" class="jalaliDay${now?' today':''}${sel?' selected':''}" data-day="${d}">${fa(d)}</button>`}pop.innerHTML=`<div class="jalaliCalendarHead"><button type="button" data-nav="prev" aria-label="ماه قبل">‹</button><div class="jalaliCalendarTitle"><select data-month aria-label="ماه">${jalaliMonths.map((x,i)=>`<option value="${i+1}" ${i+1===mm?'selected':''}>${x}</option>`).join('')}</select><select data-year aria-label="سال">${Array.from({length:126},(_,i)=>today.year-i).filter(y=>y>=1300).map(y=>`<option value="${y}" ${y===yy?'selected':''}>${fa(y)}</option>`).join('')}</select></div><button type="button" data-nav="next" aria-label="ماه بعد">›</button></div><div class="jalaliWeekdays">${jalaliWeekdays.map(x=>`<span>${x}</span>`).join('')}</div><div class="jalaliDays">${days}</div><div class="jalaliCalendarFooter"><button type="button" data-close>بستن</button><button type="button" class="todayBtn" data-today>امروز</button></div>`;
      pop.querySelector('[data-nav="prev"]').onclick=()=>{mm--;if(mm<1){mm=12;yy--}draw()};pop.querySelector('[data-nav="next"]').onclick=()=>{mm++;if(mm>12){mm=1;yy++}if(yy>today.year){yy=today.year;mm=today.month}draw()};pop.querySelector('[data-month]').onchange=e=>{mm=Number(e.target.value);draw()};pop.querySelector('[data-year]').onchange=e=>{yy=Number(e.target.value);draw()};pop.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{const d=Number(b.dataset.day),v=`${yy}/${String(mm).padStart(2,'0')}/${String(d).padStart(2,'0')}`;state.values.birthJalali=v;input.value=v;input.dispatchEvent(new Event('change',{bubbles:true}));close()});pop.querySelector('[data-close]').onclick=close;pop.querySelector('[data-today]').onclick=()=>{const v=`${today.year}/${String(today.month).padStart(2,'0')}/${String(today.day).padStart(2,'0')}`;state.values.birthJalali=v;input.value=v;input.dispatchEvent(new Event('change',{bubbles:true}));close()};
    };draw();requestAnimationFrame(()=>{if(innerWidth>560){const r=input.getBoundingClientRect(),w=Math.min(330,innerWidth-24);pop.style.left=Math.max(12,Math.min(innerWidth-w-12,r.right-w))+'px';pop.style.right='auto';pop.style.top=Math.min(innerHeight-380,Math.max(12,r.bottom+7))+'px'}})
  }
  function textField(label,key,opt={}){
    const wrap=document.createElement('label');wrap.className='pbR94ReqField';wrap.append(document.createTextNode(label));const input=document.createElement('input');input.dataset.key=key;input.value=state.values[key]||'';input.dir=opt.dir||'ltr';input.inputMode=opt.numeric?'numeric':'text';input.required=true;
    const locked=isExisting()&&hasProfileValue(key);if(locked){input.readOnly=true;input.classList.add('locked');const s=document.createElement('small');s.textContent='از اطلاعات قبلی حساب شما خوانده شد.';wrap.append(input,s)}else{input.oninput=()=>state.values[key]=opt.numeric?digits(input.value).replace(/\D/g,''):digits(input.value);wrap.append(input)}return wrap;
  }
  function birthField(){
    const wrap=document.createElement('label');wrap.className='pbR94ReqField';wrap.append(document.createTextNode('تاریخ تولد (شمسی)'));const input=document.createElement('input');input.className='pbR95BirthInput jalaliDateInput';input.value=state.values.birthJalali||'';input.readOnly=true;input.required=true;input.placeholder='برای انتخاب تاریخ لمس کنید';wrap.append(input);
    const locked=isExisting()&&hasProfileValue('birthJalali');if(locked){input.classList.add('locked');const s=document.createElement('small');s.textContent='از اطلاعات قبلی حساب شما خوانده شد.';wrap.append(s)}else{input.onclick=()=>calendar(input);input.onfocus=()=>calendar(input)}return wrap;
  }
  async function uploadImage(file,status){
    status.textContent='در حال ارسال تصویر…';try{const r=await nativeFetch('/api/public/rental-invite-file/presign',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({inviteCode,mobile,mobileBinding:mb,name:file.name,contentType:file.type,bytes:file.size})});const j=await r.json();if(!r.ok)throw j;const u=await nativeFetch(j.uploadUrl,{method:'PUT',headers:{'content-type':file.type},body:file});if(!u.ok)throw new Error('upload_failed');state.values.businessLicenseImage={objectKey:j.objectKey,name:j.name,contentType:j.contentType,bytes:j.bytes};status.textContent='✓ تصویر جواز دریافت شد';status.classList.add('ok')}catch{state.values.businessLicenseImage=null;status.textContent='ارسال تصویر انجام نشد؛ دوباره انتخاب کن.';status.classList.remove('ok')}
  }
  function imageField(){
    const wrap=document.createElement('label');wrap.className='pbR94ReqField';wrap.append(document.createTextNode('تصویر جواز / پرونده'));const existing=state.ctx?.membershipProfile?.businessLicenseImage;
    if(existing){const s=document.createElement('div');s.className='pbR94ExistingFile';s.textContent='✓ تصویر جواز قبلاً در پرونده این فروشگاه ثبت شده است.';wrap.append(s);return wrap}
    const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.className='pbR95FileInput';input.required=!state.values.businessLicenseImage;input.id='pbR95LicenseFile';const picker=document.createElement('div');picker.className='pbR95FilePicker';picker.innerHTML='<span class="pbR95FileIcon">＋</span><span><b>انتخاب تصویر جواز / پرونده</b><small>JPG، PNG یا WEBP · حداکثر ۸ مگابایت</small></span><em>انتخاب فایل</em>';const st=document.createElement('small');st.className='pbR94UploadState';st.textContent=state.values.businessLicenseImage?'✓ تصویر دریافت شده است':'هنوز فایلی انتخاب نشده است';if(state.values.businessLicenseImage)st.classList.add('ok');picker.onclick=e=>{e.preventDefault();input.click()};input.onchange=()=>{const f=input.files?.[0];if(f){picker.querySelector('b').textContent=f.name;picker.querySelector('small').textContent='آماده ارسال';uploadImage(f,st)}};wrap.append(input,picker,st);return wrap;
  }
  function requiredBox(form){
    if(!isRental()){form.querySelector('#pbR94InviteRequired')?.remove();return}
    const req=required();if(!Object.values(req).some(Boolean)){form.querySelector('#pbR94InviteRequired')?.remove();return}
    const p=state.ctx?.membershipProfile||{},sig=JSON.stringify({req,existing:isExisting(),birth:p.birthJalali||'',national:p.nationalId||'',certificate:p.birthCertificateNo||'',license:p.businessLicenseNo||'',image:Boolean(p.businessLicenseImage)});let box=form.querySelector('#pbR94InviteRequired');if(box&&box.dataset.sig===sig)return;if(box)box.remove();box=document.createElement('section');box.id='pbR94InviteRequired';box.className='pbR94Required';box.dataset.sig=sig;box.innerHTML='<b>اطلاعات درخواستی همین فروشگاه</b><small>فقط مواردی که مدیر فروشگاه برای همین دعوت انتخاب کرده نمایش داده می‌شود.</small>';
    if(req.birthDate)box.append(birthField());if(req.nationalId)box.append(textField('کد ملی','nationalId',{numeric:true}));if(req.birthCertificateNo)box.append(textField('شماره شناسنامه','birthCertificateNo',{numeric:true}));if(req.businessLicenseNo)box.append(textField('شماره جواز / پرونده','businessLicenseNo'));if(req.businessLicenseImage)box.append(imageField());
    const btn=form.querySelector('button.primary,button[type="submit"]');btn?btn.before(box):form.append(box);
  }
  function tweakButton(form){if(!isExisting())return;const b=[...form.querySelectorAll('button.primary,button[type="submit"]')].find(x=>!x.closest('#pbR94InviteRequired'));const text=String(b?.textContent||'').trim();if(b&&text!=='تأیید اطلاعات و اتصال به فروشگاه'&&!/کد|در حال/.test(text))b.textContent='تأیید اطلاعات و اتصال به فروشگاه'}
  function render(){state.raf=0;const form=document.querySelector('.photographerSignupForm');if(!form||!state.ctx)return;hideBase(form);identityBox(form);requiredBox(form);tweakButton(form);}
  function schedule(){if(state.raf)return;state.raf=requestAnimationFrame(render)}
  async function bootstrap(){if(state.loading)return;state.loading=true;try{
    const ir=await nativeFetch('/api/public/photographer-invites/'+encodeURIComponent(inviteCode),{credentials:'same-origin',cache:'no-store'});if(ir.ok){const j=await ir.json();if(j.signupContext)mergeCtx(j.signupContext);if(j.invite)mergeCtx({invite:j.invite})}
    const u='/api/public/photographer-signup/context?invite='+encodeURIComponent(inviteCode)+'&mobile='+encodeURIComponent(mobile)+(mb?'&mb='+encodeURIComponent(mb):'');const cr=await nativeFetch(u,{credentials:'same-origin',cache:'no-store'});if(cr.ok)mergeCtx(await cr.json());
  }catch{}finally{state.loading=false;schedule()}}
  window.fetch=async function(input,init={}){
    const raw=typeof input==='string'?input:(input?.url||'');let url;try{url=new URL(raw,location.origin)}catch{return nativeFetch(input,init)}const method=String(init?.method||'GET').toUpperCase();
    if(url.origin===location.origin&&url.pathname==='/api/public/photographer-signup'&&method==='POST'&&typeof init.body==='string'){
      try{const b=JSON.parse(init.body),req=required();if(req.birthDate)b.birthJalali=state.values.birthJalali||b.birthJalali||'';if(req.nationalId)b.nationalId=state.values.nationalId||'';if(req.birthCertificateNo)b.birthCertificateNo=state.values.birthCertificateNo||'';if(req.businessLicenseNo)b.businessLicenseNo=state.values.businessLicenseNo||'';if(req.businessLicenseImage&&state.values.businessLicenseImage&&!state.ctx?.membershipProfile?.businessLicenseImage)b.businessLicenseImage=state.values.businessLicenseImage;if(isExisting()){b.name='';b.province='';b.city='';b.locationLat=null;b.locationLng=null;b.locationAddress='';b.password='';b.confirmPassword=''}init={...init,body:JSON.stringify(b)}}catch{}
    }
    const res=await nativeFetch(input,init);
    if(url.origin===location.origin&&url.pathname.includes('/api/public/photographer-signup/context')&&res.ok)res.clone().json().then(mergeCtx).catch(()=>{});
    if(url.origin===location.origin&&url.pathname==='/api/public/photographer-signup'&&method==='POST'&&!res.ok){res.clone().json().then(j=>{if(j?.requiredFields)mergeCtx({membershipRequiredFields:j.requiredFields,membershipProfile:j.profile||null});else if(j?.error==='membership_profile_required'){const map={'تاریخ تولد':'birthDate','شماره ملی':'nationalId','کد ملی':'nationalId','شماره شناسنامه':'birthCertificateNo','شماره جواز / پرونده':'businessLicenseNo','تصویر جواز / پرونده':'businessLicenseImage'},r={...required()};for(const f of j.fields||j.missingFields||[]){const k=map[String(f)];if(k)r[k]=true}mergeCtx({membershipRequiredFields:r})}}).catch(()=>{})}
    return res;
  };
  const css=document.createElement('style');css.id='pbR94InviteStyle';css.textContent=`.pbR94BaseHidden{display:none!important}.pbR94Identity,.pbR94Required{margin:12px 0;padding:13px;border:1px solid #dbe4f0;border-radius:16px;background:#f8fbff;display:grid;gap:9px}.pbR94Identity>b,.pbR94Required>b{font-size:14px;color:#172033}.pbR94Identity{grid-template-columns:1fr 1fr}.pbR94Identity>b{grid-column:1/-1}.pbR94Identity>div{display:grid;gap:4px;border:1px solid #e2e8f0;border-radius:11px;padding:9px;background:#fff}.pbR94Identity span,.pbR94Required>small,.pbR94ReqField small{font-size:10px;color:#667085}.pbR94Identity strong{font-size:13px;color:#344054}.pbR94ReqField{display:grid!important;gap:6px!important;font-size:12px!important;font-weight:800!important}.pbR94ReqField input{width:100%!important;box-sizing:border-box!important;min-height:44px!important;border:1px solid #d0d5dd!important;border-radius:11px!important;background:#fff!important;padding:9px 11px!important;font:700 13px Vazirmatn,Tahoma,Arial!important}.pbR94ReqField input.locked{background:#f2f4f7!important;color:#475467!important}.pbR95BirthInput:not(.locked){cursor:pointer!important}.pbR94ExistingFile{border:1px solid #a6e1c7;background:#ecfdf3;color:#027a48;border-radius:11px;padding:10px;font-size:11px}.pbR94UploadState{font-size:10px!important}.pbR94UploadState.ok{color:#027a48!important}.pbR95FileInput{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.pbR95FilePicker{min-height:76px;border:1px dashed #b9c8e8;border-radius:13px;background:linear-gradient(135deg,#f8fbff,#f5f7ff);display:flex;align-items:center;gap:10px;padding:11px 12px;cursor:pointer;transition:.18s ease}.pbR95FilePicker:hover{border-color:#7d9cff;background:#f1f5ff;box-shadow:0 5px 16px rgba(49,94,251,.08)}.pbR95FileIcon{width:42px;height:42px;border-radius:11px;background:#fff;border:1px solid #dbe5ff;color:#315efb;display:grid;place-items:center;font-size:23px;flex:0 0 auto}.pbR95FilePicker>span:nth-child(2){display:grid;gap:2px;min-width:0;flex:1}.pbR95FilePicker b{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pbR95FilePicker small{font-size:9px!important;color:#667085!important}.pbR95FilePicker em{font-style:normal;font-size:9px;color:#315efb;background:#fff;border:1px solid #dbe5ff;border-radius:9px;padding:7px 9px;white-space:nowrap}.jalaliCalendarBackdrop{position:fixed;inset:0;z-index:2147482998;background:rgba(15,23,42,.16);opacity:0;pointer-events:none;transition:opacity .18s ease}.jalaliCalendarBackdrop.open{opacity:1;pointer-events:auto}.jalaliCalendarPopover{position:fixed;z-index:2147482999;width:min(330px,calc(100vw - 24px));border:1px solid #e4e7ec;border-radius:16px;background:#fff;box-shadow:0 24px 64px rgba(15,23,42,.22);padding:11px;direction:rtl}.jalaliCalendarHead{display:grid;grid-template-columns:38px 1fr 38px;gap:6px;align-items:center;margin-bottom:8px}.jalaliCalendarHead>button{height:36px;border:1px solid #e4e7ec;border-radius:10px;background:#f8fafc;color:#475467;font:900 18px Vazirmatn;cursor:pointer}.jalaliCalendarTitle{display:grid;grid-template-columns:1.15fr .85fr;gap:5px;text-align:center}.jalaliCalendarTitle select{height:36px;border:1px solid #e4e7ec;border-radius:9px;background:#fff;color:#344054;font:800 10px Vazirmatn;padding:0 6px}.jalaliWeekdays,.jalaliDays{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.jalaliWeekdays span{text-align:center;font-size:8px;color:#98a2b3;font-weight:800;padding:3px 0}.jalaliDay{aspect-ratio:1;border:0;border-radius:9px;background:transparent;color:#344054;font:800 9.5px Vazirmatn;cursor:pointer}.jalaliDay:hover{background:#eef2ff;color:#315efb}.jalaliDay.today{box-shadow:inset 0 0 0 1px #a8b8ff;color:#315efb}.jalaliDay.selected{background:#315efb!important;color:#fff!important;box-shadow:none}.jalaliDay.blank{visibility:hidden;pointer-events:none}.jalaliCalendarFooter{display:flex;gap:6px;margin-top:9px;padding-top:9px;border-top:1px solid #f0f2f5}.jalaliCalendarFooter button{flex:1;min-height:36px;border:1px solid #d0d5dd;border-radius:9px;background:#fff;color:#475467;font:850 9px Vazirmatn;cursor:pointer}.jalaliCalendarFooter .todayBtn{border-color:#c7d2fe;background:#eef2ff;color:#315efb}.photographerSignupForm.pbR94ExistingActive{overflow:visible!important}@media(max-width:600px){.pbR94Identity{grid-template-columns:1fr}.pbR94Identity>b{grid-column:1}.pbR95FilePicker em{display:none}.jalaliCalendarPopover{left:12px!important;right:12px!important;top:auto!important;bottom:12px!important;width:auto!important}.jalaliCalendarBackdrop{background:rgba(15,23,42,.30)}}`;document.head.append(css);
  const mo=new MutationObserver(()=>schedule());mo.observe(document.getElementById('root')||document.documentElement,{childList:true,subtree:true});addEventListener('pageshow',()=>{bootstrap();schedule()},{passive:true});document.addEventListener('DOMContentLoaded',()=>{bootstrap();schedule()},{once:true});bootstrap();schedule();
})();
