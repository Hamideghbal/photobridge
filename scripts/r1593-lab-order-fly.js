/* PB1593 lab order status: fly confirmed order into its new tab without selecting it.
 * Runs in the lab web UI AND the verified Windows lab desktop UI bundle.
 * No mutation, no event interception, and no movement on failed server writes. */
(function(){
 'use strict';
 if(window.PB1593LabFlyOrder)return;
 const inflight=new Map();
 const targets={ready:1,completed:2};

 window.PB1593LabFlyOrder=function({orderId,target}={}){
   let card=null,ghost=null;
   try{
     if(!orderId || !(target in targets))return false;
     if(document.visibilityState==='hidden')return false;
     if(!window.matchMedia('(min-width:821px)').matches ||
        window.matchMedia('(prefers-reduced-motion:reduce)').matches)return false;
     if(inflight.has(String(orderId))||inflight.size>=3)return false;
     const buttons=Array.from(document.querySelectorAll('.stageQueueWorkspace .queueFilters.compactQueueFilters button'));
     const tab=buttons[targets[target]];
     if(!tab || !tab.isConnected || !tab.animate)return false;
     const to=tab.getBoundingClientRect();
     if(to.width<=5)return false;
     const root=document.querySelector('.stageQueueWorkspace .labOrderScrollArea');
     if(!root)return false;
     card=Array.from(root.querySelectorAll('.labOrderCard[data-order-id]'))
       .find(el=>el.dataset.orderId===String(orderId));
     if(!card || !card.isConnected || !card.animate)return false;
     const from=card.getBoundingClientRect();
     if(from.width<90 || from.height<30 || from.top>window.innerHeight || from.bottom<0)return false;
     ghost=card.cloneNode(true);
     ghost.classList.add('pb1593LabOrderFlight');
     ghost.setAttribute('aria-hidden','true');
     ghost.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
     ghost.querySelectorAll('button,input,select,textarea,a,[tabindex]').forEach(x=>{
       x.setAttribute('tabindex','-1');
       if('disabled'in x)x.disabled=true;
     });
     ghost.querySelectorAll('.mobileOrderDisclosure,.labOrderFoot,.labPrepayOrderNotice,.downloadProgressInline').forEach(x=>x.style.display='none');
     const st=ghost.style;
     st.setProperty('position','fixed','important');
     st.setProperty('left',from.left+'px','important');
     st.setProperty('top',from.top+'px','important');
     st.setProperty('width',from.width+'px','important');
     st.setProperty('height',from.height+'px','important');
     st.setProperty('margin','0','important');
     document.body.appendChild(ghost);
     card.style.setProperty('opacity','0','important');
     const dx=to.left+to.width/2-(from.left+from.width/2);
     const dy=to.top+to.height/2-(from.top+from.height/2);
     const scale=Math.min(.28,Math.max(.1,to.width/Math.max(1,from.width)));
     let settled=false;
     function cleanup(){
       if(settled)return;
       settled=true;
       inflight.delete(String(orderId));
       ghost.remove();
       if(card.isConnected)card.style.removeProperty('opacity');
     }
     const animation=ghost.animate([
       {offset:0,transform:'translate(0px,0px) scale(1)',opacity:1,filter:'blur(0px)'},
       {offset:.22,transform:'translate('+dx*.1+'px,-8px) scale(.95)',opacity:1,filter:'blur(0px)'},
       {offset:.7,transform:'translate('+dx*.81+'px,'+(dy*.76-7)+'px) scale(.42)',opacity:.67,filter:'blur(.7px)'},
       {offset:1,transform:'translate('+dx+'px,'+dy+'px) scale('+scale+')',opacity:0,filter:'blur(2px)'}
     ],{duration:690,easing:'cubic-bezier(.25,.81,.22,1)',fill:'forwards'});
     inflight.set(String(orderId),animation);
     animation.addEventListener('finish',()=>{
       cleanup();
       if(tab.isConnected){
         tab.classList.remove('pb1593LabTabReceive');
         void tab.offsetWidth;
         tab.classList.add('pb1593LabTabReceive');
         window.setTimeout(()=>tab.classList.remove('pb1593LabTabReceive'),710);
       }
     },{once:true});
     animation.addEventListener('cancel',cleanup,{once:true});
     return true;
   }catch(error){
     if(ghost&&ghost.isConnected)ghost.remove();
     if(card&&card.isConnected)card.style.removeProperty('opacity');
     if(typeof console.debug==='function')console.debug('[PB1593] lab motion unavailable',error);
     return false;
   }
 };
})();
