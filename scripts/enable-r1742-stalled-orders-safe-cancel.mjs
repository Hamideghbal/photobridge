// R1742: show the existing per-order cancellation for stuck pre-print
// sent/received orders whose previous download flag was set prematurely.
// All financial, print-history, shipping, stock, and cloud-delete safeguards
// in R1545 remain in place. No filesystem or existing orders are modified here.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const one=(src,from,to,label)=>{
  const count=src.split(from).length-1;
  if(count!==1)throw Error('[R1742] '+label+' anchor count '+count);
  return src.replace(from,to);
};
const serverPath='dist/api/server.js';
let server=fs.readFileSync(serverPath,'utf8');
if(!server.includes('/* PB1742 safe stuck order cancellation */')){
  const begin=server.indexOf("if (labOrder && req.method === 'DELETE')");
  const end=server.indexOf("if (labOrder && req.method === 'PATCH')",begin);
  if(begin<0||end<=begin)throw Error('[R1742] lab order DELETE route missing');
  let route=server.slice(begin,end);
  route=one(route,
    "if (order.downloaded_at && String(order.status || '') !== 'downloaded') {",
    "/* PB1742 safe stuck order cancellation */\n                if (order.downloaded_at && !['sent','received','downloaded'].includes(String(order.status || ''))) {",
    'downloaded flag guard');
  // Cancel ONLY while pre-print. The existing stronger R1545 guards MUST
  // remain intact; a future accidental removal makes the build fail.
  for(const guard of [
    'order.printed_at',
    "status IN ('printing','reviewing','ready_print','printed','ready','completed','binding')",
    'order_print_started',
    'paid_order_requires_lab',
    'courier_already_requested',
    "order.status || ''",
    "status='cancelled'"
  ])if(!route.includes(guard))throw Error('[R1742] missing cancellation safety guard: '+guard);
  server=server.slice(0,begin)+route+server.slice(end);
  fs.writeFileSync(serverPath,server);
}
execFileSync(process.execPath,['--check',serverPath],{stdio:'inherit'});

const oldEligibility='(!(le!=null&&le.downloaded_at)||le.status==="downloaded")';
const newEligibility='(!(le!=null&&le.downloaded_at)||["sent","received","downloaded"].includes(String(le.status||"")))';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const bundle=root+'/assets/index-UIRefine-v655-r84.js';
  let ui=fs.readFileSync(bundle,'utf8');
  if(!ui.includes(newEligibility)){
    if(ui.includes(oldEligibility)){
      ui=one(ui,oldEligibility,newEligibility,root+' updated delete eligibility');
    }else{
      // Some native snapshots predate the R1545 queue predicate. The API
      // safeguards are identical; update that older predicate in-place.
      const start=ui.indexOf(',ma=le=>'),end=ui.indexOf(',si=async le=>',start);
      if(start<0||end<=start||ui.indexOf(',ma=le=>',start+1)!==-1)throw Error('[R1742] '+root+' native delete predicate not found');
      const previous=ui.slice(start,end);
      if(!previous.startsWith(',ma=le=>!(le!=null&&le.downloaded_at)&&'))throw Error('[R1742] '+root+' unknown delete predicate');
      const safe=',ma=le=>!(le!=null&&le.printed_at)&&(!(le!=null&&le.downloaded_at)||["sent","received","downloaded"].includes(String(le.status||"")))&&!['+'"uploading","completed","cancelled","ready","printed","ready_print","printing","reviewing"'+'].includes(String((le==null?void 0:le.status)||""))&&!["printing","binding","ready","completed","delivered"].includes(String((le==null?void 0:le.album_stage)||""))&&String((le==null?void 0:le.payment_status)||"")!=="paid"';
      ui=ui.slice(0,start)+safe+ui.slice(end);
    }
  }
  for(const guard of ['le.printed_at',"String((le==null?void 0:le.payment_status)||\"\")!==\"paid\""]){
    if(!ui.includes(guard))throw Error('[R1742] missing queue cancellation guard '+root+': '+guard);
  }
  fs.writeFileSync(bundle,ui);
  execFileSync(process.execPath,['--check',bundle],{stdio:'inherit'});
  const htmlPath=root+'/index.html';
  let html=fs.readFileSync(htmlPath,'utf8');
  html=html.replace(
    /(\/assets\/index-UIRefine-v655-r84\.js\?[^"'\s<>]*)/g,
    url=>url.includes('stuckCancel=r1742')?url:url+'&stuckCancel=r1742');
  if(!html.includes('stuckCancel=r1742'))throw Error('[R1742] cache-busting module marker absent: '+root);
  fs.writeFileSync(htmlPath,html);
  if(root.endsWith('lab-desktop-ui')){
    const file=root+'/manifest.json';
    const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
    if(!Array.isArray(manifest.files)||manifest.channel!=='lab')throw Error('[R1742] bad lab manifest');
    for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){
      const row=manifest.files.find(x=>x.name===name);
      if(!row)throw Error('[R1742] missing native manifest asset: '+name);
      row.sha256=hash(fs.readFileSync(root+'/'+name));
    }
    manifest.build=hash(JSON.stringify(manifest.files));
    manifest.generatedAt=new Date().toISOString();
    fs.writeFileSync(file,JSON.stringify(manifest));
  }
}
console.log('[R1742] Stuck sent/received pre-print orders can be individually cancelled; print/payment/shipping safeguards remain.');
