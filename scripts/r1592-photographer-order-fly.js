/* R1592 — fly a changed order into its destination tab. Desktop photographer only.
   Visual-only effect: statuses/counts still come exclusively from the server. */
(function(){
  'use strict';
  if(window.PB1592FlyOrder) return;
  const keys={flow:0,needs_fix:1,ready:2,completed:3};
  const flying=new Map();

  function destination(mode,target) {
    const index=keys[target];
    if(index==null)return null;
    const selector=mode==='album'
      ? '#photographer-album-status-desktop-slot .albumHeaderStatuses button'
      : '.photographerContextStatusesDesktop button';
    const buttons=Array.from(document.querySelectorAll(selector));
    // Skip hidden copies of the same tabs (mobile vs desktop).
    const button=buttons[index];
    if(!button || button.getBoundingClientRect().width<5)return null;
    return button;
  }

  function fly({orderId,mode='print',target}={}) {
    try {
      if(!orderId || !['ready','completed','needs_fix','flow'].includes(target))return false;
      if(!document.documentElement.matches('.pb1126Desktop,.pb1126Embedded'))return false;
      if(!window.matchMedia('(min-width:821px)').matches)return false;
      if(document.visibilityState==='hidden')return false;
      if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return false;
      if(flying.has(String(orderId)) || flying.size>=2)return false;
      const tab=destination(mode,target);
      if(!tab || typeof tab.animate!=='function')return false;

      const root=document.querySelector('#root .liveCustomerOrders');
      if(!root)return false;
      const original=Array.from(root.querySelectorAll('.liveOrderCard[data-order-id]'))
        .find(card=>card.dataset.orderId===String(orderId));
      if(!original || typeof original.animate!=='function')return false;
      const from=original.getBoundingClientRect(),to=tab.getBoundingClientRect();
      if(from.width<80 || from.height<30 || from.bottom<0 || from.top>window.innerHeight)return false;

      const ghost=original.cloneNode(true);
      ghost.classList.add('pb1592FlyingOrderCard');
      ghost.setAttribute('aria-hidden','true');
      ghost.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
      ghost.querySelectorAll('button,input,select,textarea,a,[tabindex]').forEach(node=>{
        node.setAttribute('tabindex','-1');
        if('disabled' in node)node.disabled=true;
      });
      ghost.querySelectorAll('.mobileOrderDisclosure,.liveOrderExtras').forEach(node=>node.style.display='none');
      ghost.style.setProperty('position','fixed','important');
      ghost.style.setProperty('left',from.left+'px','important');
      ghost.style.setProperty('top',from.top+'px','important');
      ghost.style.setProperty('width',from.width+'px','important');
      ghost.style.setProperty('height',from.height+'px','important');
      ghost.style.setProperty('margin','0','important');
      document.body.appendChild(ghost);
      original.style.setProperty('opacity','0','important');
      const dx=(to.left+to.width/2)-(from.left+from.width/2);
      const dy=(to.top+to.height/2)-(from.top+from.height/2);
      const scale=Math.max(.1,Math.min(.3,to.width/Math.max(1,from.width)));
      let cleaned=false;
      function cleanup() {
        if(cleaned)return;
        cleaned=true;
        flying.delete(String(orderId));
        ghost.remove();
        if(original.isConnected)original.style.removeProperty('opacity');
      }
      const motion=ghost.animate([
        {offset:0,transform:'translate(0px,0px) scale(1)',opacity:1,filter:'blur(0px)'},
        {offset:.2,transform:'translate('+dx*.1+'px,-8px) scale(.96)',opacity:1,filter:'blur(0px)'},
        {offset:.64,transform:'translate('+dx*.77+'px,'+(dy*.72-10)+'px) scale(.47)',opacity:.78,filter:'blur(.3px)'},
        {offset:1,transform:'translate('+dx+'px,'+dy+'px) scale('+scale+')',opacity:0,filter:'blur(2px)'}
      ],{duration:670,easing:'cubic-bezier(.23,.83,.22,1)',fill:'forwards'});
      flying.set(String(orderId),motion);
      motion.addEventListener('finish',()=>{
        cleanup();
        if(tab.isConnected) {
          tab.classList.remove('pb1592TabReceivedOrder');
          void tab.offsetWidth;
          tab.classList.add('pb1592TabReceivedOrder');
          window.setTimeout(()=>tab.classList.remove('pb1592TabReceivedOrder'),680);
        }
      },{once:true});
      motion.addEventListener('cancel',cleanup,{once:true});
      return true;
    }catch(error){
      // Animation must never interfere with order refresh or change the status.
      if(window.console && typeof console.debug==='function')console.debug('[PB1592] motion skipped',error);
      return false;
    }
  }
  window.PB1592FlyOrder=fly;
})();
