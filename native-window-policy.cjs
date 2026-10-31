'use strict';
function windowPolicy(url,origin,openExternal){
 const allow={action:'allow',overrideBrowserWindowOptions:{webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}}};
 if(url==='about:blank')return allow;
 try{const target=new URL(url);if(target.origin===origin&&/^\/desktop\/local-invoices\/[0-9a-f-]{36}\/(pdf|print)$/i.test(target.pathname))return allow;if(target.protocol==='https:')openExternal(url);}catch{}
 return{action:'deny'};
}
module.exports={windowPolicy};
