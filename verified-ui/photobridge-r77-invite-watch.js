(()=>{
 if(location.pathname!=='/photographer/signup')return;
 const started=Date.now();
 function addRetry(){
   if(document.getElementById('pbR77InviteRetry'))return;
   const text=[...document.querySelectorAll('div,p,span')].find(x=>String(x.textContent||'').trim()==='در حال بررسی حساب…');
   if(!text)return;
   const b=document.createElement('button');b.id='pbR77InviteRetry';b.type='button';b.textContent='بررسی دوباره';text.textContent='بررسی حساب طول کشید؛ دوباره تلاش کن.';
   b.style.cssText='margin-top:10px;border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:9px 14px;font:700 12px Vazirmatn,Tahoma,Arial;cursor:pointer';
   b.onclick=()=>location.reload();text.insertAdjacentElement('afterend',b);
 }
 setTimeout(addRetry,8500);
 const mo=new MutationObserver(()=>{if(Date.now()-started>8500)addRetry()});mo.observe(document.documentElement,{childList:true,subtree:true});
})();
