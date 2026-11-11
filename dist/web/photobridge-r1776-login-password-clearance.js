/* R1776.2: real, live clearance for native and fallback password reveal controls.
 * CSS reserves the initial gutter before JavaScript; measured inline !important
 * spacing wins over later global mobile input padding resets. No credential reads,
 * auth logic changes, password values, focus overrides, or button event handlers. */
(()=>{'use strict';
 if(window.pbR1776PasswordClearance)return;
 window.pbR1776PasswordClearance=true;
 const authScope='form.unifiedLoginCard,form.rentalUnifiedLogin,form.labLogin,.unifiedLoginPage,.authShell,.authBg,.passwordResetCard,#loginView,.pb1536PasswordHost';
 const isReveal=button=>{
  if(button.classList?.contains('pb1536PasswordEye'))return true;
  const label=[button.textContent,button.getAttribute?.('aria-label'),button.getAttribute?.('title')]
   .filter(Boolean).join(' ').trim();
  return /(?:^|\s)(?:نمایش|مخفی|پنهان|show|hide|visibility|reveal)(?:\s|$)/i.test(label);
 };
 function nearestReveal(input){
  const box=input.getBoundingClientRect?.();
  if(!box?.width||!box?.height)return null;
  let parent=input.parentElement;
  for(let depth=0;parent&&depth<3;parent=parent.parentElement,depth++){
   const matches=Array.from(parent.querySelectorAll('button,[role="button"]')).filter(button=>{
    if(!isReveal(button))return false;
    const b=button.getBoundingClientRect?.();
    if(!b?.width||!b?.height)return false;
    const sameRow=Math.abs((b.top+b.bottom-box.top-box.bottom)/2)<Math.max(24,box.height*.65);
    const inside=b.left>=box.left-12&&b.right<=box.right+12;
    return sameRow&&inside;
   });
   if(matches.length)return matches[0];
  }
  return null;
 }
 function protect(input){
  // Only mobile has this overlap; never adjust desktop input padding.
  if(!window.matchMedia?.('(max-width:767px)')?.matches)return;
  if(input.tagName!=='INPUT'||!input.closest(authScope))return;
  if(!input.hasAttribute('data-pb1776-password-clearance'))input.setAttribute('data-pb1776-password-clearance','');
  const box=input.getBoundingClientRect?.();
  if(!box?.width||!box?.height)return;
  const button=nearestReveal(input);
  if(!button)return; // Keep the stylesheet's safe initial gutter until the button mounts.
  const b=button.getBoundingClientRect();
  const onLeft=((b.left+b.right)/2)<=((box.left+box.right)/2);
  const max=Math.max(40,Math.floor(box.width-76));
  const min=window.matchMedia?.('(max-width:767px)').matches?94:112;
  const gutter=onLeft?Math.ceil(b.right-box.left+14):Math.ceil(box.right-b.left+14);
  const px=Math.max(24,Math.min(max,Math.max(min,gutter)))+'px';
  const side=onLeft?'padding-left':'padding-right';
  if(input.style?.getPropertyValue(side)!==px||input.style?.getPropertyPriority(side)!=='important')
   input.style?.setProperty(side,px,'important');
 }
 function scan(){
  for(const input of document.querySelectorAll('input[type="password"],input[data-pb1776-password-clearance]'))
   protect(input);
 }
 let queued=false;
 function schedule(){
  if(queued)return;
  queued=true;
  window.requestAnimationFrame(()=>{queued=false;scan()});
 }
 new MutationObserver(schedule).observe(document.documentElement,{
  childList:true,subtree:true,attributes:true,attributeFilter:['type','class','aria-label']
 });
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('orientationchange',schedule,{passive:true});
 document.addEventListener('focusin',schedule,true);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
 schedule();
})();
