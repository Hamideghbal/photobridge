/* R1847: show an entry skeleton independently of identity and optional panels. */
(()=>{
 if(!/^\/photographer(?:\/|$)/.test(location.pathname))return;
 const q=new URLSearchParams(location.search),pendingKey='photobridge:r100f37:lab-enter-pending',hintKey='photobridge:r1847:entry-lab';
 let hint=null,pending=0;try{pending=Number(sessionStorage.getItem(pendingKey)||0);hint=JSON.parse(sessionStorage.getItem(hintKey)||'null');if(!hint||Date.now()-hint.at>12000||String(hint.id)!==String(sessionStorage.getItem('photobridge:r99:selected-lab')||''))hint=null}catch{hint=null}
 if(q.get('pbEntryDone')!=='lab'&&!(pending&&Date.now()-pending<12000))return;
 if(q.get('pbLabChooser')==='1')return;
 const entry={labId:String(hint?.id||''),home:null,orders:null};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 const load=async resource=>{try{const response=await fetch('/api/customer/'+resource+(entry.labId?'?_lab='+encodeURIComponent(entry.labId):''),{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'},signal:controller.signal});return response.ok?await response.json():null}catch{return null}};
 window.__PB1847EntryEarly=entry;entry.home=load('home');entry.orders=load('orders');
 Promise.all([entry.home,entry.orders]).finally(()=>clearTimeout(timer));
 let observer,frame=0,done=false,coverReleased=false;
 const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 function releaseCover(){coverReleased=true;document.documentElement.classList.remove('pbR100F37LabEnterBoot');try{sessionStorage.removeItem(pendingKey)}catch{}}
 function remove(){if(done)return;done=true;releaseCover();controller.abort();if(window.__PB1847EntryEarly===entry)delete window.__PB1847EntryEarly;document.getElementById('pb1847EntrySkeleton')?.remove();document.documentElement.classList.remove('pb1847EntrySkeletonVisible');observer?.disconnect();clearTimeout(cap);try{sessionStorage.removeItem(hintKey);const u=new URL(location.href);if(u.searchParams.get('pbEntryDone')==='lab'){u.searchParams.delete('pbEntryDone');history.replaceState(history.state,'',u.pathname+u.search+u.hash)}}catch{}}
 function mount(){
  if(done||!document.body)return;
  if(!document.getElementById('pb1847EntrySkeleton')){
   const root=document.createElement('section');root.id='pb1847EntrySkeleton';root.setAttribute('role','status');root.setAttribute('aria-live','polite');
   root.innerHTML='<header><h1>'+esc(hint?.name||'لابراتوار')+'</h1><p>در حال دریافت سفارش‌های چاپ…</p></header><div class="pb1847OrdersSkeleton" aria-label="در حال دریافت سفارش‌ها"><i></i><i></i><i></i></div>';
   document.body.append(root);document.documentElement.classList.add('pb1847EntrySkeletonVisible');
  }
  releaseCover();
 }
 function check(){
  if(done)return;
  if(!/^\/photographer\/(?:orders|upload|album|archive|finance)(?:\/|$)/.test(location.pathname)||new URLSearchParams(location.search).get('pbLabChooser')==='1'){remove();return}
  const main=document.querySelector('.photographerMain.photographerPrintWorkspace'),scroll=main?.querySelector(':scope>.photographerRolePageScrollArea'),header=main?.querySelector('#photographerRoleHeaderV710');
  if(entry.ordersDelivered&&header&&scroll?.children.length){requestAnimationFrame(remove);return}
  if(document.querySelector('#root .authBg,#root .login')){remove();return}
  mount();
 }
 const cap=setTimeout(()=>{mount();releaseCover()},2500);
 window.__PB1847EntryUI={check,releaseCover,remove,ordersReady(){entry.ordersDelivered=true;check()},get released(){return coverReleased}};
 const style=document.createElement('style');style.textContent='html.pb1847EntrySkeletonVisible #pbR1361MobileSplash,html.pb1847EntrySkeletonVisible #pbAppSplashV780{display:none!important}#pb1847EntrySkeleton{position:fixed;inset:0;z-index:2147483644;overflow:auto;background:#f5faff;color:#18365b;direction:rtl;font-family:Vazirmatn,Tahoma,Arial,sans-serif;padding:28px max(16px,calc((100vw - 1040px)/2))}#pb1847EntrySkeleton header{padding:20px;background:#fff;border:1px solid #dbe8fb;border-radius:18px}#pb1847EntrySkeleton h1{font-size:20px;margin:0 0 12px}#pb1847EntrySkeleton p{font-size:13px;margin:0}.pb1847OrdersSkeleton{display:grid;gap:14px;margin-top:20px}.pb1847OrdersSkeleton i{display:block;height:106px;border:1px solid #dbe8fb;border-radius:16px;background:linear-gradient(100deg,#e9f1fa,#fff,#e9f1fa)}';document.head.append(style);
 observer=new MutationObserver(()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;check()})});observer.observe(document.documentElement,{childList:true,subtree:true});
 addEventListener('popstate',check);document.addEventListener('DOMContentLoaded',check,{once:true});entry.home.then(data=>{if(data?.lab?.name){hint={...hint,name:data.lab.name};const h=document.querySelector('#pb1847EntrySkeleton h1');if(h)h.textContent=data.lab.name}});
 check();
})();
