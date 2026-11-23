/* R1976: connected photographers begin with print / Lab chooser, never force later navigation. */
(()=>{'use strict';
 const PRINT='/photographer/orders/flow?workspace=print&pbLabChooser=1';
 const photographer=()=>/^\/photographer(?:\/|$)/.test(location.pathname)&&!/^\/photographer\/(login|signup|register|invite)(?:\/|$)/.test(location.pathname);
 const entry=()=>/^\/photographer(?:\/gallery)?\/?$/.test(location.pathname)&&!['pbDesktopPanel','pbCrmTab','pbStorePanel','pbDesktopContent','view'].some(key=>new URLSearchParams(location.search).has(key));
 let connected=false,scheduled=false,checking=false,epoch=0,currentKey='';
 const headers=()=>{let token='';try{token=sessionStorage.getItem('lablink_test_session')||''}catch{}return {'x-photobridge-portal':'photographer',...(token?{authorization:'Bearer '+token}:{})}};
 async function getJson(path){const r=await fetch(path,{credentials:'include',cache:'no-store',headers:headers()});if(!r.ok)throw Error('unavailable');return r.json();}
 const visible=el=>!el.hidden&&getComputedStyle(el).display!=='none';
 const isPrint=button=>button.dataset.pb1126Kind==='print'||String(button.getAttribute('aria-label')||button.textContent||'').replace(/\s+/g,' ').trim()==='چاپ';
 function centerPrint(){
  scheduled=false;
  if(!connected||!photographer())return;
  document.documentElement.classList.add('pb1976ConnectedPrint');
  for(const nav of document.querySelectorAll('#pb1126DesktopHeader .pb1126MainNav,#root .photographerHomeModeNav,#root .photographerHeaderNav')){
   const list=[...nav.children].filter(el=>el.matches('button,a')&&visible(el));
   const print=list.find(isPrint);if(!print||list.length<3)continue;
   const others=list.filter(el=>el!==print);
   const midpoint=Math.ceil(others.length/2);
   others.splice(midpoint,0,print);
   others.forEach((el,index)=>{const value=String(index+1);if(el.style.order!==value)el.style.order=value});
   nav.dataset.pb1976PrintCentered='1';
  }
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(centerPrint)}
 async function check(){
  if(!photographer()||checking)return;checking=true;
  const thisEpoch=epoch;
  try{
   const account=await getJson('/api/auth/me');
   if(thisEpoch!==epoch||!account?.user?.userId)return;
   const id=String(account.user.userId);
   const data=await getJson('/api/customer/labs');
   if(thisEpoch!==epoch)return;
   connected=Array.isArray(data?.memberships)&&data.memberships.some(m=>m?.active===true&&m?.service_only!==true);
   currentKey='pb1976-entry:'+id;
   centerPrint();
   // Redirect once per authenticated session, and only from a genuine home entry.
   // A later click on Gallery or an explicit deep link must remain navigable.
   if(sessionStorage.getItem(currentKey)==='done')return;
   sessionStorage.setItem(currentKey,'done');
   if(connected&&entry())location.replace(PRINT);
  }catch{connected=false}finally{checking=false}
 }
 function reset(event){
  const previousKey=currentKey;epoch++;connected=false;checking=false;currentKey='';
  document.documentElement.classList.remove('pb1976ConnectedPrint');
  if(previousKey){try{sessionStorage.removeItem(previousKey)}catch{}}
  if(event?.detail?.labRole==='customer')void check();
 }
 function init(){
  void check();
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('photobridge-auth-session-changed',reset);
  window.addEventListener('pageshow',()=>{schedule();void check()});
  window.addEventListener('focus',()=>{schedule();void check()});
  window.addEventListener('popstate',schedule);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
