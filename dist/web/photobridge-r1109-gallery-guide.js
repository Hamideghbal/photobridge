(()=>{
 'use strict';
 let pending=false;
 async function check(){
  if(pending||!document.querySelector('.clientGalleryIntroHeader'))return;pending=true;
  try{
   const response=await fetch('/api/public/video-guides?raw=1',{credentials:'include',cache:'no-store'});
   const data=response.ok?await response.json():{};
   const mobile=matchMedia('(max-width:820px)').matches||/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent),words=mobile?['mobile','موبایل','android','ios','iphone']:['windows','window','ویندوز','desktop','دسکتاپ'];
   const available=(data.guides||[]).some(g=>{const text=[g.title,g.category,g.description,g.id].join(' ').toLowerCase();return g.active!==false&&g.src&&['gallery','گالری'].some(w=>text.includes(w))&&words.some(w=>text.includes(w))});
   document.documentElement.dataset.pb1109GalleryGuide=available?'ready':'missing';
  }catch{document.documentElement.dataset.pb1109GalleryGuide='missing'}finally{pending=false}
 }
 let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;if(!document.documentElement.dataset.pb1109GalleryGuide)void check()})};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
 new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
 addEventListener('focus',()=>{delete document.documentElement.dataset.pb1109GalleryGuide;void check()});
})();
