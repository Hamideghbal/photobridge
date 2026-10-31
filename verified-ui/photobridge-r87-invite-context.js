(()=>{
  if(location.pathname!=='/photographer/signup')return;
  const qs=new URLSearchParams(location.search),invite=String(qs.get('invite')||'').trim(),mobile=String(qs.get('mobile')||'').trim();
  if(!invite||!mobile)return;
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init={}){
    const raw=typeof input==='string'?input:(input&&input.url)||''; let u;
    try{u=new URL(raw,location.origin)}catch{return nativeFetch(input,init)}
    if(u.pathname!=='/api/public/photographer-signup/context')return nativeFetch(input,init);
    u.pathname='/api/public/photographer-signup/context-fast';
    const ctl=new AbortController(), timer=setTimeout(()=>ctl.abort(),5200);
    try{return await nativeFetch(u.toString(),{...init,cache:'no-store',credentials:'same-origin',signal:ctl.signal})}
    catch(e){return new Response(JSON.stringify({error:e?.name==='AbortError'?'invite_context_timeout':'invite_temporarily_unavailable'}),{status:503,headers:{'content-type':'application/json; charset=utf-8'}})}
    finally{clearTimeout(timer)}
  };
  const show=()=>{const el=[...document.querySelectorAll('div,p,span')].find(x=>String(x.textContent||'').trim()==='در حال بررسی حساب…');if(!el)return;el.textContent='در حال شناسایی حساب…';};
  new MutationObserver(show).observe(document.documentElement,{childList:true,subtree:true});show();
})();
