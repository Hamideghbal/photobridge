/* Keep the print content frame a content frame across native and legacy SPA navigation. */
(()=>{
 if(window.pb1467EmbeddedRoute)return;window.pb1467EmbeddedRoute=true;
 const normalize=value=>{try{
  if(value==null||parent===window||!window.frameElement?.closest('.pb1126ContentPanel[data-panel="print"]'))return value;
  const url=new URL(String(value),location.href);
  if(url.origin!==location.origin||!/^\/photographer\/(?:orders(?:\/|$)|upload(?:\/|$)|album(?:\/|$)|archive(?:\/|$)|finance(?:\/|$)|settings(?:\/|$)|wallet(?:\/|$))/.test(url.pathname))return value;
  url.searchParams.set('pbDesktopContent','1');url.searchParams.set('workspace','print');url.searchParams.delete('pbDesktopPanel');url.searchParams.delete('pbPrintRoute');return url.pathname+url.search+url.hash;
 }catch{return value;}};
 for(const key of ['pushState','replaceState']){const original=history[key];history[key]=function(...args){args[2]=normalize(args[2]);return original.apply(this,args);};}
})();
