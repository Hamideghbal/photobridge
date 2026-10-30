import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const file='dist/web/assets/index-UIRefine-v655-r84.js';
let source=fs.readFileSync(file,'utf8');
if(!source.includes('/* PB1499 lab desktop invoice errors */')){
 const printAnchor='if(await ye().catch(()=>{}),((Jt=Zt==null?void 0:Zt.data)==null?void 0:Jt.error)==="invoice_pricing_required")';
 const printReplacement='if(await ye().catch(()=>{}),((Jt=Zt==null?void 0:Zt.data)==null?void 0:Jt.error)==="order_sync_pending"){P(Zt.data.message||"تغییرات قبلی سفارش هنوز همگام نشده است؛ ابتدا همگام‌سازی را کامل کن.");return}if(((Jt=Zt==null?void 0:Zt.data)==null?void 0:Jt.error)==="invoice_live_connection_required"){P(Zt.data.message||"برای آماده‌تحویل و صدور فاکتور اتصال اینترنت لازم است.");return}if(((Jt=Zt==null?void 0:Zt.data)==null?void 0:Jt.error)==="invoice_pricing_required")';
 const printCount=source.split(printAnchor).length-1;
 if(printCount===1) source=source.replace(printAnchor,printReplacement);
 else if(!source.includes('error)==="order_sync_pending"')||!source.includes('error)==="invoice_live_connection_required"')) throw Error(`R1499 expected one print invoice handler or an already patched equivalent; found ${printCount}`);

 const albumAnchor='if(nt==="ready"&&Bt==="invoice_pricing_required"){on(le,"ready");return}';
 const albumReplacement='if(nt==="ready"&&Bt==="order_sync_pending"){P(Zt.data.message||"تغییرات قبلی سفارش هنوز همگام نشده است؛ ابتدا همگام‌سازی را کامل کن.");return}if(nt==="ready"&&Bt==="invoice_live_connection_required"){P(Zt.data.message||"برای آماده‌تحویل و صدور فاکتور اتصال اینترنت لازم است.");return}if(nt==="ready"&&Bt==="invoice_pricing_required"){on(le,"ready");return}';
 const albumCount=source.split(albumAnchor).length-1;
 if(albumCount===1) source=source.replace(albumAnchor,albumReplacement);
 else if(!source.includes('nt==="ready"&&Bt==="order_sync_pending"')||!source.includes('nt==="ready"&&Bt==="invoice_live_connection_required"')) throw Error(`R1499 expected one album invoice handler or an already patched equivalent; found ${albumCount}`);
 source+='\n/* PB1499 lab desktop invoice errors */\n';
 fs.writeFileSync(file,source);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
