// R1936: online Lab Windows queue must not reuse HTTP-cache status snapshots.
// Only the installed native UI is adjusted; original offline queue and writes stay untouched.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(file,'utf8');
const marker='/* PB1936 native verified live status refresh */';
if(!ui.includes(marker)){
  const old="return Me('/api/lab/orders'+(recovery?'?recovery='+encodeURIComponent(recovery):''))";
  const next="return Me('/api/lab/orders'+(recovery?'?recovery='+encodeURIComponent(recovery)+'&':'?')+'pbNativeLiveStatus='+Date.now())";
  const count=ui.split(old).length-1;
  if(count!==1)throw Error('[R1936] native queue online read anchor mismatch: '+count);
  if(!ui.includes('setInterval(refresh,3000)')||!ui.includes('pb1753VisibleLabOrders'))
    throw Error('[R1936] native queue refresh/server-order reconciliation missing');
  ui=ui.replace(old,next);
  ui+='\n'+marker+'\n';
  fs.writeFileSync(file,ui);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R1936] Native Lab live order status GET bypasses HTTP cache; offline queue unchanged.');
