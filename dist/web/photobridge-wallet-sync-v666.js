(()=>{
  if(window.__photobridgeWalletSyncV666)return;
  window.__photobridgeWalletSyncV666=true;
  const nativeFetch=window.fetch.bind(window);
  let running=false,last=0,timer=0;
  const fa=n=>Math.max(0,Math.round(Number(n)||0)).toLocaleString('fa-IR');
  const isPhotographer=()=>location.pathname.startsWith('/photographer');
  function paint(balance){
    const text=fa(balance);
    document.querySelectorAll('.mobileHeaderWallet b').forEach(el=>{el.textContent=text});
    document.querySelectorAll('.headerWalletBadge').forEach(el=>{el.textContent=`اعتبار ${text}`});
    try{window.dispatchEvent(new CustomEvent('photobridge-wallet-balance',{detail:{balance:Number(balance)||0}}))}catch{}
  }
  async function refresh(force=false){
    if(!isPhotographer()||running)return;
    const now=Date.now();if(!force&&now-last<1200)return;
    running=true;last=now;
    try{
      const res=await nativeFetch('/api/customer/services-wallet',{credentials:'include',headers:{'x-photobridge-portal':'photographer','accept':'application/json'}});
      if(!res.ok)return;
      const data=await res.json();
      if(Number.isFinite(Number(data?.balance)))paint(Number(data.balance));
    }catch{}finally{running=false}
  }
  function soon(delay=180){clearTimeout(timer);timer=setTimeout(()=>refresh(true),delay)}
  window.fetch=async function(input,init){
    const res=await nativeFetch(input,init);
    try{
      const method=String(init?.method||((input&&typeof input==='object'&&'method' in input)?input.method:'GET')||'GET').toUpperCase();
      const url=String(typeof input==='string'?input:(input&&input.url)||'');
      if(res.ok&&method!=='GET'&&url.includes('/api/customer/'))soon(220);
    }catch{}
    return res;
  };
  window.addEventListener('focus',()=>refresh(true));
  window.addEventListener('pageshow',()=>refresh(true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(true)});
  window.addEventListener('popstate',()=>soon(80));
  setInterval(()=>refresh(false),8000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>soon(50),{once:true});else soon(50);
})();
