(()=>{'use strict';if(window.pbSmsOtp)return;
 window.pbSmsOtp={listen(input){
  if(!window.isSecureContext||!('OTPCredential'in window)||!navigator.credentials?.get||!window.AbortController)return()=>{};
  const controller=new AbortController();let active=true;const timer=setTimeout(stop,120000);
  function stop(){if(!active)return;active=false;clearTimeout(timer);controller.abort();input?.removeEventListener('input',manual);removeEventListener('pagehide',stop);}
  function manual(event){if(event.isTrusted)stop();}input?.addEventListener('input',manual);addEventListener('pagehide',stop,{once:true});
  try{Promise.resolve(navigator.credentials.get({otp:{transport:['sms']},signal:controller.signal})).then(result=>{
   if(!active||controller.signal.aborted||!input?.isConnected||input.disabled||input.value.trim())return;
   const code=String(result?.code||'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
   if(!/^\d{6}$/.test(code))return;
   input.value=code;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
  }).catch(()=>{}).finally(stop);}catch{stop();}
  return stop;
 }};
})();
