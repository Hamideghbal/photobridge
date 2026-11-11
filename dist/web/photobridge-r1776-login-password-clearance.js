/* R1776: a stable style marker when native show/hide changes input type.
   No credential reads or edits to authentication/toggle behavior. */
(()=>{'use strict';
 if(window.pbR1776PasswordClearance)return;
 window.pbR1776PasswordClearance=true;
 const scope='form.unifiedLoginCard,form.rentalUnifiedLogin,form.labLogin,.unifiedLoginPage,.authShell,.authBg,.passwordResetCard,#loginView,.pb1536PasswordHost';
 function mark(){
  for(const input of document.querySelectorAll('input[type="password"],input[data-pb1776-password-clearance]')){
   if(input.tagName!=='INPUT'||input.hasAttribute('data-pb1776-password-clearance'))continue;
   if(input.closest(scope))input.setAttribute('data-pb1776-password-clearance','');
  }
 }
 new MutationObserver(mark).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['type']});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mark,{once:true});
 mark();
})();
